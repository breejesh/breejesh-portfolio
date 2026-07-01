---
title: "WebSockets para apps en tiempo real: handshake, heartbeats, reconexión, auth y escala"
description: "Cómo funcionan los WebSockets en producción: el upgrade HTTP, ping y pong, reconexión con backoff, auth sin filtrar tokens y fan-out multi-nodo con pub/sub."
date: "2026-07-01"
tags: [Redes, Backend, Desarrollo Web]
coverImage: /assets/images/websockets-realtime-basics.webp
previewImage: /assets/images/websockets-realtime-basics.webp
---

HTTP es petición y respuesta. Los productos en tiempo real necesitan que el servidor empuje datos sin esperar al siguiente poll: chat, paneles en vivo, estado multijugador, ticks de trading, cursores colaborativos. Los **WebSockets** te dan un canal full-duplex de larga duración sobre una sola conexión TCP. Lo difícil no es abrir un socket. Lo difícil es mantener miles de ellos honestos ante cortes de red, caducidad de auth y deploys multi-pod.

Esta es la checklist de producción que me habría gustado tener la primera vez que un "feed en vivo simple" se cruzó con balanceadores y clientes móviles.

---

## Cuándo merecen la pena los WebSockets

| Enfoque | Push del servidor | Overhead | Mejor uso |
| --- | --- | --- | --- |
| Short polling | No (el cliente pregunta) | Muchas peticiones, 200 vacíos | Actualizaciones raras, cachés simples |
| Long polling | Aproximado | Una petición HTTP retenida por espera | Fallback si WS está bloqueado |
| Server-Sent Events (SSE) | Unidireccional (servidor → cliente) | Ligero, amigable con HTTP | Feeds, notificaciones |
| **WebSocket** | Full duplex | Una conexión, frames | Chat, juegos, control bidireccional |
| WebRTC data | Peer-to-peer | Complejidad ICE/NAT | Media, apps peer directas |

Usa WebSockets cuando **ambos** lados envían a menudo, o cuando la latencia debe ser baja y estable. Prefiere SSE para streams unidireccionales si no necesitas cliente→servidor en el mismo canal. Prefiere HTTP plano para APIs request/response que no necesitan push.

---

## El handshake: HTTP que se convierte en socket

Un WebSocket empieza como una petición HTTP normal con cabeceras de upgrade. El navegador (o la librería cliente) envía algo así:

```http
GET /ws HTTP/1.1
Host: api.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://app.example.com
```

Si el servidor acepta, responde:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

Después de ese `101`, la misma conexión TCP transporta **frames WebSocket**, no cuerpos de petición HTTP. Detalles clave:

1. **`Sec-WebSocket-Key` / `Accept`**: no es cifrado. El cliente elige un nonce; el servidor lo hashea con un GUID fijo (RFC 6455). Eso demuestra que ambos hablan el protocolo y evita upgrades accidentales por proxies tontos.
2. **`Origin`**: los navegadores lo envían. Valídalo en el servidor en apps autenticadas con cookie para que un sitio aleatorio no abra un socket como el usuario.
3. **Path y query**: siguen disponibles en el handshake para enrutado y (con cuidado) auth. Prefiere el path para elegir endpoint (`/ws/chat` vs `/ws/prices`).
4. **Subprotocolos**: `Sec-WebSocket-Protocol` permite negociar un protocolo de app con nombre. Útil cuando un host sirve varios clientes con esquemas de mensaje distintos.

Los reverse proxies deben permitir upgrades. En nginx sueles necesitar `proxy_http_version 1.1`, pasar las cabeceras `Upgrade` y `Connection`, y timeouts de idle largos (o desactivados). En LBs cloud, busca "websocket support" y el idle timeout; un corte a los 60s se parece a desconexiones aleatorias.

---

## Frames, mensajes y qué envías

El formato en el cable son frames: text, binary, ping, pong, close. Tu app suele ver **mensajes** (frames ensamblados). Mantén el contrato aburrido:

- **JSON text** para control y payloads pequeños (chat, presencia).
- **Binary** (protobuf, MessagePack, flatbuffers) cuando importa el tamaño o el coste de parseo.
- Un **sobre de mensaje**: `{ "type": "...", "id": "...", "payload": ... }` para poder añadir tipos sin romper cada cliente.

Define **códigos de cierre** y razones. `1000` es normal. Fallos de auth, expulsiones de política y reinicios de servidor deberían usar códigos distintos para que el cliente sepa si reconectar, volver a autenticarse o parar.

No trates el socket como un bus RPC libre sin límite de tamaño. Limita el tamaño de mensaje. Rechaza o cierra ante abuso. Aplica backpressure: si un cliente es lento y tu buffer de envío crece, descarta actualizaciones no críticas o desconecta en lugar de hacer OOM al proceso.

---

## Heartbeats: distinguir muertos de callados

TCP puede quedarse half-open mucho tiempo tras dormir un portátil, un timeout de NAT o un cable cortado. Sin comprobaciones de vida a nivel de aplicación, el servidor sigue creyendo que el usuario está online.

### Ping / pong

RFC 6455 define frames de control **ping** y **pong**. Servidores o clientes envían ping; el peer debe responder con pong. Muchas librerías lo exponen como un intervalo.

Valores prácticos de partida:

| Ajuste | Rango típico | Notas |
| --- | --- | --- |
| Intervalo de ping | 15s-30s | Más corto en UIs de trading; más largo por batería |
| Timeout de pong | 5s-15s tras el ping | Sin pong → cerrar y liberar recursos |
| Idle timeout | Relacionado con el LB | Debe ser **mayor** que el intervalo de ping |

Si el balanceador mata conexiones idle a los 60s, tu intervalo de ping debe quedar claramente por debajo (por ejemplo 20s-30s). Los heartbeats mantienen el camino caliente y demuestran que la capa de app sigue respondiendo.

### Heartbeats a nivel de app

Algunos stacks también envían un mensaje de app pequeño (`{"type":"ping"}`) para middleboxes que solo entienden HTTP y para medir RTT en métricas. Prefiere pings de protocolo cuando la librería los soporte; usa pings de app cuando necesites payload propio o un proxy maltrata los frames de control.

Al cerrar (limpio o por timeout), actualiza presencia, cancela suscripciones de servidor de esa conexión y libera memoria. Usuarios "online" fantasma son un clásico de tickets de producto con WebSockets.

---

## Reconexión: los clientes se caen, planifícalo

Las redes móviles cambian de celda. Los deploys reinician pods. La gente cierra el portátil. Reconectar no es un caso raro; es el bucle principal de un cliente durable.

### Backoff exponencial con jitter

Reconectar al instante en cada close satura el servidor tras un deploy:

```
all clients reconnect at T+0 → thundering herd
```

Mejor patrón:

```
delay = min(cap, base * 2^attempt) * (0.5 + random())
```

Ejemplo: base `1s`, tope `30s`, jitter completo. El intento 0 espera unos 0.5s-1s. Los siguientes se alargan. Resetea el contador de intentos solo tras un open **estable** (por ejemplo 10s sin error), no en el primer `onopen`.

### Qué re-sincronizar tras reconectar

Un socket nuevo no recuerda eventos perdidos. Patrones habituales:

1. **Last event id / cursor**: el cliente guarda la última secuencia o timestamp aplicado; el primer mensaje tras abrir es `SUBSCRIBE` + `since`.
2. **Snapshot y luego delta**: el servidor envía el estado actual y después actualizaciones en vivo. Simple para paneles; pesado con estado grande.
3. **Rooms versionados**: el cliente guarda `roomVersion`; si está desfasado, resync completo.

Sin uno de estos, el usuario ve huecos tras cada corte.

### Tokens de resume (opcional)

Algunos sistemas emiten un **resume token** de vida corta ligado a usuario y offset del stream. Al reconectar, se presenta el token para saltar re-auth completa y reanudar desde el offset. Trátalos como credenciales: TTL corto, rotación, revocación al logout.

### Razones de cierre que no deben reconectar

| Significado del close | Acción del cliente |
| --- | --- |
| Cierre normal / logout | Permanecer cerrado |
| Auth inválida / prohibida | Re-login y luego abrir |
| Rate limit / política | Backoff fuerte, quizá parar |
| Reinicio de servidor / idle timeout | Reconectar con backoff |

Parsea códigos de cierre (y tus mensajes de error de app) para no girar para siempre ante un ban.

---

## Auth: ¿quién está en este socket?

El handshake es la puerta principal. Tras el `101`, muchos servidores no vuelven a comprobar identidad hasta que el token caduca a mitad de sesión.

### Patrones que funcionan

| Patrón | Cómo | Pros | Contras |
| --- | --- | --- | --- |
| **Sesión por cookie** | Cookie same-site en el upgrade | Auth web familiar; importan checks de Origin | Más difícil en nativo/móvil; dominio de cookie |
| **Token en query** | `wss://host/ws?token=...` | Fácil con la API `WebSocket` del navegador | Tokens en logs, proxies, historial de Referer |
| **Auth en primer mensaje** | Conectar anónimo y luego `{"type":"auth","token":"..."}` | Token fuera de la URL | Ventana breve sin autenticar |
| **Truco Sec-WebSocket-Protocol** | Meter el token en la cabecera de protocolo | Evita query string | Abuso no estándar del subprotocolo |

Prefiere **`Authorization` vía cliente custom** o **auth en primer mensaje** para SPAs que ya tienen un bearer en memoria. Para apps first-party en navegador con cookies HTTP-only, cookie + check estricto de **Origin** es limpio.

Nunca pongas secretos de larga vida en query strings. Si debes usar un param de query (algunos entornos lo fuerzan), emite un ticket WS **de corta vida y un solo uso** desde tu API HTTP y rechaza reutilización.

### Caducidad del token a mitad de conexión

Los access tokens caducan con el socket aún abierto. Opciones:

1. **Cerrar con código de auth** al expirar; el cliente refresca el token HTTP y reconecta.
2. **Refresh por el socket**: el cliente envía un access token nuevo; el servidor revalida y continúa.
3. **Sesión en servidor**: el handshake crea una sesión de servidor más larga; el access token solo se usa al abrir.

La opción 2 es fluida en chat. La 1 es más fácil de razonar en revisiones de seguridad. En cualquier caso, documéntalo; una muerte silenciosa al minuto 15 fabrica tickets de soporte.

### Autorización tras autenticación

AuthN es "quién". AuthZ es "qué rooms/canales". En `SUBSCRIBE channel:X`, vuelve a comprobar ACL. Vuelve a comprobar al reconectar. No confíes a ciegas en room ids del cliente. En productos multi-tenant, ata cada suscripción al tenant id del token verificado, no al cuerpo del mensaje.

---

## Escalar más allá de un proceso

Un proceso Node o Go puede sostener muchas conexiones, pero:

- Deploys y crashes tiran a todo el mundo.
- La CPU del fan-out JSON suele limitar antes que la RAM.
- El usuario A en el pod 1 no recibe un mensaje publicado solo en memoria en el pod 2.

### Sticky sessions no bastan

Los balanceadores pueden fijar un cliente a un pod (cookie o IP). Eso ayuda a mapas de conexión **en memoria** para un solo usuario, pero **no** resuelve "mensaje producido en el pod A, consumidor conectado en el pod B". Cualquier broadcast o evento entre usuarios necesita un bus compartido.

### Fan-out con pub/sub

La forma estándar:

```
Client ←→ WS gateway pod ←→ Redis (or NATS, Kafka, etc.) ←→ other gateway pods
                              ↑
                         app workers / API
```

1. El cliente se conecta a cualquier pod gateway; el pod registra conn local → user/rooms.
2. Cuando ocurre algo (escritura de API, job de worker), se publica a un canal: `room:42`, `user:7`, `tenant:acme:alerts`.
3. Cada pod gateway suscrito a ese canal recibe el evento y escribe solo a los sockets **locales** que coinciden.

Redis Pub/Sub es habitual para fan-out efímero. Redis Streams o Kafka encajan cuando necesitas retención y consumer groups. NATS es popular por mensajería interna de baja latencia. Elige por necesidades de durabilidad, no por marca.

### Preocupaciones horizontales

| Preocupación | Enfoque |
| --- | --- |
| Número de conexiones | Muchos pods gateway pequeños; autoscale por sockets abiertos + CPU |
| Rooms calientes | Shard por room id; evita que un solo proceso posea un canal celebrity |
| Entrega ordenada | Secuencias por room; el cliente ordena o descarta stale |
| At-least-once | El cliente de-duplica por event id |
| Drain elegante | Dejar de aceptar, esperar close o forzar close con "reconnect", deregistrar del pub/sub |
| Observabilidad | Métricas: conns abiertas, pings perdidos, profundidad de cola de envío, lag de pub/sub, fallos de auth |

### Extras con estado

Presencia ("quién está online") e indicadores de escritura quieren TTLs cortos y heartbeats, normalmente en Redis. No guardes presencia solo en memoria de proceso si más de un pod sirve tráfico.

Ráfagas binarias grandes (chunks de archivo, vídeo) no suelen pertenecer al mismo socket que el chat de control. Canales separados o object storage + URLs firmadas.

---

## Esquema mínimo de servidor (modelo mental)

Pseudocódigo, no un framework:

```
on HTTP upgrade:
  user = authenticate(request)
  if not user: reject 401
  if not origin_allowed(request): reject 403
  socket = accept()
  register(socket, user)
  subscribe_bus(user.rooms)

on message(socket, msg):
  if msg.type == "subscribe":
    if authorize(user, msg.room): add_local(socket, msg.room); bus_sub(msg.room)
  elif msg.type == "publish":
    if authorize(...): bus_publish(msg.room, envelope(msg))

on bus_event(room, event):
  for socket in local_sockets(room):
    try send(socket, event) except backpressure: drop_or_close

on ping timeout / close:
  unregister(socket)
  update_presence(user)
```

La división importante: **mapa local de sockets** en el gateway, **bus compartido** para entrega multi-pod, **auth en cada cambio de privilegio**.

---

## Checklist del cliente

1. Abre con `wss://` en producción (TLS).
2. Heartbeat (protocolo o app) por debajo del idle timeout del LB.
3. Reconexión con backoff exponencial + jitter.
4. Resume con last event id o snapshot.
5. Gestiona caducidad de auth sin bucles infinitos de reconnect.
6. Limita tamaño de mensajes entrantes y valida el schema.
7. Muestra el estado de conexión en la UI (online / reconnecting / offline).
8. Al ocultar la página / background de la app, decide si mantienes el socket o lo pausas (batería móvil).

---

## Fallos habituales

| Síntoma | Causa probable |
| --- | --- |
| Desconexión aleatoria cada ~60s | Idle timeout del proxy; heartbeats demasiado lentos |
| Funciona en un servidor, fallos silenciosos multi-pod | Sin pub/sub; solo memoria |
| Tormenta de reconnect tras deploy | Sin backoff/jitter; sin drain |
| Token en access logs | Auth por query string |
| Fantasmas "online" | Sin timeout de pong; presencia no limpiada |
| OOM en el gateway | Buffers de envío sin tope; sin backpressure |
| Hijack tipo CSRF | Auth por cookie sin checks de Origin |

---

## Cuándo no usar WebSockets

- CRUD request/response con actualizaciones raras: HTTP es más simple.
- Push unidireccional sobre infra HTTP que ya confías: SSE puede bastar.
- Fan-out masivo de datos públicos idénticos: CDN + SSE o polling a un edge de caché puede salir más barato.
- Plataformas serverless con vida corta de request y sin soporte de sockets: usa un servicio realtime gestionado o un tier gateway de larga duración.

Los WebSockets son un transporte. No sustituyen el diseño de auth, los event ids idempotentes ni un plan de fan-out multi-nodo. Acerta el handshake, demuestra vida con heartbeats, reconecta con paciencia, controla cada suscripción y pon un bus entre pods. El resto es acabado de producto sobre una conexión que se mantiene en pie.
