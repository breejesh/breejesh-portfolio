---
title: "Diseñar un sistema de chat: walkie-talkies, correos y ticks verdes"
description: "Diseño de un sistema de chat para principiantes absolutos: ruta en línea en vivo frente a almacenamiento de historial, 1:1 y grupos pequeños, presencia, ticks de entrega y cómo explicárselo a un amigo."
date: "2025-11-19"
tags: [Diseño de Sistemas y Arquitectura, Backend y Bases de Datos]
coverImage: /assets/images/design-chat-system.webp
previewImage: /assets/images/design-chat-system.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Diseño de un sistema de chat para principiantes absolutos: ruta en línea en vivo frente a almacenamiento de historial, 1:1 y grupos pequeños, presencia, ticks de entrega y cómo explicárselo a un amigo.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Abre WhatsApp o iMessage. Escribe una línea. Pulsa enviar. Aparece un tick. A veces un punto verde dice que tu amigo está en línea. Parece magia. No es magia. Son dos ideas antiguas con ropa moderna.

**Idea 1: un walkie-talkie.** Cuando ambas personas están conectadas ahora mismo, el servidor mantiene una línea abierta para que las palabras lleguen en una fracción de segundo.

**Idea 2: una oficina de correos.** Cada mensaje también se archiva en un almacén (la base de datos). Cuando alguien estaba offline, o abre la app más tarde en otro teléfono, el historial se obtiene de ese almacén, no del aire.

Si recuerdas solo una frase de este post, que sea esta: **la conexión en vivo es para la velocidad; el almacén de mensajes es para la verdad.**

Esta guía enseña el diseño de un sistema de chat como lo haría un profesor paciente: lenguaje claro primero, comportamiento real del producto después, cajas de entrevista al final. Acotamos un producto estilo Messenger: chat 1:1, grupos pequeños, texto, presencia en línea, ticks de entrega e historial multi-dispositivo. Para detalles de WebSocket a nivel de cable (handshake, heartbeats, reconnect), ver [WebSockets para apps en tiempo real](/blog/es/websockets-realtime-basics). Aquí nos quedamos en la arquitectura de producto.

---

## ¿Qué estamos construyendo?

Antes de cajas y flechas, fija el producto. Las entrevistas se rompen cuando alguien inventa canales a escala Discord y el enunciado era "WhatsApp para amigos".

| Pregunta | Respuesta por defecto en este post |
| --- | --- |
| ¿1:1, grupos o ambos? | Ambos |
| Tamaño de grupo | Unos 100 miembros como máximo |
| Clientes | Teléfono y web |
| Escala de ejemplo | Decenas de millones de usuarios diarios (orden de magnitud) |
| Tipo de mensaje | Texto primero; fotos después |
| Historial | Conservarlo mucho tiempo |
| Misma cuenta en teléfono + portátil | Sí |
| Cifrado de extremo a extremo | Fuera de alcance salvo que lo pidan |
| Avisar cuando está offline | Sí (notificación push) |

**Lo que el usuario debe poder hacer**

1. Enviar y recibir mensajes 1:1 con baja latencia cuando ambos están en línea.
2. Chatear en un grupo pequeño.
3. Ver quién está en línea u offline (presencia).
4. Abrir la app y cargar mensajes anteriores.
5. Mantenerse sincronizado en varios dispositivos.
6. Recibir un push cuando está offline y ponerse al día al abrir la app.

**Lo que no diseñamos salvo que lo pidan:** llamadas de voz, canales de un millón de personas, reacciones, búsqueda en todo el historial, cifrado E2E completo. Nómbralos fuera de alcance para que la conversación sea honesta.

---

## El modelo mental central: walkie-talkie y oficina de correos

### Walkie-talkie = ruta en línea

Imagina a dos amigos con walkie-talkies en el mismo canal. Pulsa el botón, habla, suelta. El otro oye **si** está escuchando **ahora mismo**.

En el chat:

- El teléfono mantiene una **conexión de larga duración** con un servidor de chat (normalmente un WebSocket).
- Cuando envías "voy de camino", el servidor puede **empujar** ese texto a la conexión abierta de tu amigo al instante.
- No hace falta preguntar cada segundo "¿hay mensajes nuevos?". El servidor habla cuando pasa algo.

Ese cable en vivo es por lo que el chat se siente instantáneo. También es por lo que los servidores de chat son difíciles: millones de teléfonos pueden tener un socket abierto al mismo tiempo.

### Oficina de correos = almacenamiento del historial

Un walkie-talkie no sirve para la conversación de la semana pasada. Para eso necesitas un sistema de archivo.

En el chat:

- Cada mensaje aceptado se **escribe en almacenamiento durable** (una base pensada para muchos appends pequeños).
- Si tu amigo estaba offline, el mensaje sigue en el almacén.
- Cuando abre la app, el cliente pregunta: "dame todo después del message id X".
- Cuando cambia del teléfono al portátil, el portátil carga el historial del mismo almacén.

**Regla práctica**

| Ruta | Trabajo | Fallo si confías solo en ella |
| --- | --- | --- |
| Conexión en vivo (walkie-talkie) | Entrega rápida mientras estás en línea | Pierde lo enviado desconectado |
| Almacén de mensajes (correos) | Historial durable y puesta al día | Demasiado lento si solo se hace pull sin push |

El chat de producción usa **ambas**. El push en vivo acelera. El almacén es la fuente de verdad. Si un push se pierde en una red inestable, la siguiente sincronización desde el almacén cierra el hueco.

---

## ¿Cómo se mantiene el teléfono "en la línea"?

Las peticiones web normales son como enviar una postal y esperar respuesta. Bien para login o perfil. Mal para chat.

El chat necesita que el servidor hable **primero** cuando llega un mensaje para ti. Opciones comunes:

| Enfoque | Resumen para principiantes | ¿Sirve para chat? |
| --- | --- | --- |
| Short polling | La app pregunta cada pocos segundos "¿algo nuevo?" | Derrochador; casi siempre "no" |
| Long polling | La app pregunta y el servidor aguanta hasta que hay algo | Funciona; torpe a escala |
| **WebSocket** | Un tubo abierto en ambos sentidos tras un pequeño handshake | **Sí, por defecto** |
| HTTP REST | Petición y respuesta normales | Login, páginas de historial, ajustes |

Muchos productos envían mensajes por WebSocket y usan HTTP para lo aburrido (alta, lista de amigos, historial antiguo). La división importante:

- **APIs HTTP sin estado:** cualquier servidor puede responder; fácil de escalar.
- **Gateways de chat con estado:** cada teléfono en vivo queda en **un** nodo de chat que sostiene su socket.

Las conexiones pegajosas exigen un mapa: "el usuario B está conectado en el chat server 7, dispositivo teléfono". Ese mapa vive en un almacén rápido (a menudo Redis). Sin él, el servidor 1 no sabe cómo gritar a B, que está en el servidor 7.

---

## Arquitectura a vista de pájaro (sigue siendo simple)

Tres tipos de piezas, no cincuenta logotipos.

### 1. APIs de producto aburridas (sin estado)

Auth, perfil, contactos, lista de conversaciones, historial. Detrás de un balanceador normal. Añades máquinas cuando crece el tráfico.

### 2. Servidores de chat (con estado)

Sostienen sesiones WebSocket. Aceptan mensajes nuevos. Empujan mensajes, "está escribiendo" y eventos de presencia. Buscan dónde está conectado un usuario.

### 3. Sistemas de apoyo

| Pieza | Trabajo en palabras simples |
| --- | --- |
| Almacén de mensajes | El almacén de correos de todo el historial |
| Generador de IDs | Ids de mensaje únicos, idealmente casi ordenados en el tiempo |
| Mapa de sesiones | `user_id → qué servidor de chat y qué dispositivos` |
| Almacén de presencia | En línea / offline, última actividad |
| Bus entre servidores | Avisa a otros nodos "entrega esto al usuario B" |
| Servicio push | Notificación en la pantalla de bloqueo si no hay socket vivo |
| Object storage (después) | Fotos y vídeos |

```
Teléfono / web ──HTTP──► API (auth, páginas de historial)
Teléfono / web ──WS────► Servidor de chat ──► bus ──► otros servidores
                              │
                              ├── almacén de mensajes (verdad)
                              ├── mapa de sesión + presencia
                              └── proveedor push (si offline)
```

---

## Ponerse en línea: unirse a la torre de walkie-talkie correcta

Cuando se abre la app:

1. El cliente inicia sesión en la API y obtiene un token de corta vida.
2. **Service discovery** responde: "conecta tu WebSocket a este host de chat" (sano, no saturado, preferiblemente en la región cercana).
3. El cliente abre el WebSocket con ese token.
4. El servidor de chat valida el token, escribe la entrada en el mapa de sesiones, te marca **en línea** y empieza a escuchar heartbeats.

Si ese servidor muere, discovery deja de anunciarlo. Los clientes se reconectan con backoff y caen en un nodo sano. Los mensajes no enviados esperan en un outbox local del teléfono hasta que el servidor los confirme.

Piensa en discovery como el operador que te asigna una torre de radio libre en lugar de meter a todos en una torre rota.

---

## ¿Qué se guarda por cada mensaje?

Las escrituras de chat son sobre todo appends: nuevas líneas al final de una conversación. Un registro práctico se parece a esto:

| Campo | Por qué |
| --- | --- |
| `message_id` | Id único, preferiblemente ordenable por tiempo |
| `conversation_id` | Qué hilo de chat |
| `sender_id` | Quién lo envió |
| `body` | El texto |
| `created_at` | Hora del servidor |
| `type` | texto, aviso de sistema, etc. |
| `client_msg_id` (opcional) | Evita doble envío cuando la red reintenta |

Patrones de acceso que importan:

1. **Abrir una conversación:** últimos N mensajes de ese `conversation_id`, luego páginas más antiguas al hacer scroll.
2. **Poner al día un dispositivo:** todo de este usuario más nuevo que el cursor X.
3. **Fan-out de grupo pequeño:** a menudo una copia o puntero en el inbox de cada miembro para que cada teléfono lea **su** correo.

En entrevistas suele gustar una historia de key-value o wide-column (partición por conversación o por inbox del destinatario) porque el volumen de escritura es alto y el acceso es por clave, no por joins complejos. SQL con buenos índices funciona a menor escala; di cuándo te graduarías de él.

**Idempotencia:** el teléfono puede enviar el mismo mensaje dos veces tras un parpadeo. Clave `(sender_id, client_msg_id)` para que la oficina de correos selle una carta, no dos copias.

---

## Flujo 1:1: A escribe a B

A está en el chat server 1. B está en el chat server 2.

```
1. A → WebSocket → servidor 1: {to: B, body, client_msg_id}
2. Servidor 1 comprueba: ¿pueden hablar? ¿rate limit ok?
3. Asigna message_id, escribe en el almacén
4. Ack a A → la UI muestra "enviado"
5. Busca a B en el mapa de sesiones
6a. B en línea: avisa al servidor 2 por el bus → push en el socket de B → "entregado" cuando la app de B confirma
6b. B offline: encola notificación push; el mensaje espera en el almacén para el sync
7. Lectura: la app de B reporta "vi hasta message_id" → actualiza almacén → avisa a los dispositivos de A
```

**Orden:** mantén el orden **dentro de una conversación** (o al menos por emisor). El orden global de todos los chats del planeta es caro e inútil.

**Verdad frente a velocidad:** si el bus pierde un push en vivo, B sigue recibiendo el mensaje al sincronizar desde el almacén. El fan-out en vivo no sustituye al almacenamiento durable.

---

## Ticks de entrega: qué significa cada marca

Los usuarios leen los ticks como emociones. Los ingenieros deben mapearlos a eventos.

| Lo que ves | Lo que el sistema significa |
| --- | --- |
| Reloj / enviando / fallido | Solo en el teléfono; el servidor no lo ha aceptado |
| **Enviado** (un tick) | El servidor escribió el mensaje y devolvió `message_id` |
| **Entregado** (dos ticks) | Al menos un dispositivo del destinatario lo recibió (o lo marcó tras el fetch) |
| **Leído** (azul / relleno) | El cliente del destinatario reportó el mensaje como visto |

Notas defendibles en una entrevista:

- **Enviado** es autoridad del servidor tras persistir. No muestres "enviado" solo porque la UI lo pintó de forma optimista.
- **Entregado** necesita un ack del cliente en la ruta en vivo, o un ack tras pull del almacén. Con multi-dispositivo, elige una regla: "cualquier dispositivo" es habitual.
- **Leído** a menudo se agrupa: "leído hasta id X" en lugar de una fila por mensaje cada vez que alguien hace scroll.
- Nunca bloquees el envío porque la otra persona no ha leído. El estado viaja al lado de la ruta principal.

Analogía del walkie-talkie: "enviado" significa que la oficina de correos aceptó la carta. "Entregado" significa que llegó a su buzón o a su mano. "Leído" significa que la abrió.

---

## Grupos pequeños: un grito, muchos buzones

Para grupos de hasta unos 100 miembros, un modelo práctico es **fan-out en escritura** hacia inboxes por usuario:

1. A envía a `group_id`.
2. El servidor carga la lista de miembros (con caché).
3. Escribe el mensaje canónico una vez para el historial del grupo.
4. Coloca una copia o puntero en el **inbox de sync de cada miembro**.
5. Empuja en vivo a cada miembro en línea en su servidor de chat.
6. Los offline reciben push y se sincronizan después.

¿Por qué copiar con N pequeño?

- Cada cliente solo lee **su** inbox para ponerse al día. Modelo mental simple.
- Entregas parciales y rarezas de membresía son más fáciles por usuario.
- El coste es O(miembros) en almacenamiento y trabajo por mensaje. Bien con 100. Doloroso con 100.000.

Para canales enormes (piensa en Discord público), inviertes el modelo: guardas una vez por canal, los miembros hacen pull o se suscriben al stream, y la presencia se vuelve aproximada. Di ese trade-off en voz alta. No finjas que un diseño 1:1 escala a una sala de un millón solo "añadiendo servidores".

**Cambio de membresía:** ¿un nuevo miembro ve el historial de antes de unirse? Es una regla de producto. Menciónala.

---

## Presencia: los puntos verdes y grises

"En línea" no es un booleano pintado una vez al login. Las redes móviles parpadean. Un diseño ingenuo te pone offline en cada desconexión breve y la lista de contactos parpadea.

### Señales que funcionan

| Evento | Efecto en presencia |
| --- | --- |
| Login WebSocket correcto | Candidato a en línea |
| Heartbeat cada pocos segundos | Seguir en línea |
| Logout limpio | Offline al instante |
| Heartbeats perdidos más allá de una ventana de gracia (ejemplo: 30s) | Offline |
| Parpadeo de red bajo la ventana de gracia | Seguir en línea |

Guarda algo como:

```
user_id → { status: online|offline, last_active_at, devices: [...] }
```

A menudo en Redis con un TTL refrescado por heartbeats.

### ¿A quién hay que avisar?

Con una lista de amigos normal, publica cambios de presencia a los amigos interesados (o a quien está viendo ese perfil). Sus servidores de chat empujan un pequeño "ahora en línea".

En grupos enormes, no spamees a 100.000 personas cada vez que alguien parpadea en línea. Carga la presencia al abrir la lista de miembros; refresca bajo demanda.

La presencia es **eventualmente consistente**. Unos segundos equivocados valen más que fundir el sistema bajo tormentas de estado.

Analogía: la luz verde significa "te oigo en el canal ahora mismo", no "poseo un walkie-talkie en algún lugar del mundo".

---

## Multi-dispositivo: la misma persona, dos radios

Teléfono y portátil abiertos. Cada dispositivo guarda un **cursor**: el último message id que ya aplicó.

Al conectar o reanudar:

1. Abre la conexión en vivo (y/o sync HTTP).
2. Pide: mensajes para mí con `message_id > cursor`.
3. Aplícalos, avanza el cursor, pinta la UI.

Mientras ambos están en vivo, el mapa de sesiones guarda **varias** conexiones por usuario. El fan-out empuja a cada conexión para que ambas pantallas se actualicen sin esperar al siguiente pull. El cursor repara el modo suspensión, el avión y las apps matadas.

---

## Escala sin jerga de pánico

### Conexiones

Cada nodo de chat sostiene un trozo de sockets abiertos. El número de conexiones (y la memoria por socket) suele doler antes que la CPU. Escalar en horizontal es más nodos de chat y discovery que reparte los nuevos logins. En un deploy, drena nodos viejos; los clientes se reconectan.

Matemática de entrevista que puedes ajustar en vivo:

- 50M usuarios diarios.
- El pico de conexiones concurrentes puede ser una fracción del DAU (ejemplo: 10M en línea a la vez).
- Si cada conexión cuesta del orden de 10 KB de RAM de servidor en buffers y estado de sesión, son decenas de GB de memoria de conexión **en toda la flota**, no en un solo portátil.

### Ruta de mensajes

- Particiona el almacén por conversación o por inbox del destinatario.
- Ruta caliente: autorizar → id → **persistir** → ack "enviado" → fan-out asíncrono.
- Mantén notificaciones push y analítica fuera de la ruta crítica del ack.

### Fallos que merece la pena nombrar

| Fallo | Mitigación |
| --- | --- |
| Muere un nodo de chat | Reconnect del cliente + discovery; puesta al día desde el almacén |
| Caída del bus entre nodos | El almacén + sync es la verdad |
| Envío duplicado | Idempotencia con `client_msg_id` |
| Grupo caliente | Caché de miembros; rate limit; backpressure |
| Tormenta de presencia | Gracia de heartbeat; bajo demanda en rosters grandes |
| Mensaje gigante | Tope de tamaño en el gateway |

### Consistencia en un aliento

- Tras el ack del servidor: el mensaje es durable y aparecerá (push o sync posterior).
- Entrega en vivo: mejor esfuerzo, ruta rápida.
- Confirmaciones de lectura y presencia: eventuales.

Esa división mantiene el botón de enviar honesto ante fallos parciales.

---

## Seguridad y abuso (profundidad de entrevista)

- Autentica el WebSocket; renueva tokens sin tirar el tubo a la ligera.
- Autoriza cada envío (bloqueos, membresía de grupo).
- Rate limit por usuario y por grupo.
- Tope de tamaño del cuerpo.
- TLS en el cable (WSS). Cifrado en reposo en el almacén. El E2E completo es otro diseño (claves en cada dispositivo).
- El fan-out en el servidor implica que el servidor puede leer texto plano salvo que te comprometas con E2E. Di en qué mundo estás.

---

## Diseño que puedes defender en la pizarra

**Producto:** estilo Messenger a gran escala, 1:1 + grupos ≤100, texto, presencia, multi-dispositivo, push si offline.

**Piezas:**

1. Cluster de API HTTP (auth, perfil, historial).
2. Discovery de endpoints de chat sanos.
3. Flota de gateways de chat (WebSockets + actualizaciones de sesión).
4. Generador de IDs.
5. Almacén de mensajes (particionado para append y lecturas por conversación).
6. Almacén rápido para sesiones y presencia.
7. Pub/sub o cola para entrega entre nodos.
8. Workers de push (APNs / FCM).

**Envío 1:1:** WS → validar → id → persistir → ack enviado → enrutar al nodo del destinatario o push → entregado/leído como eventos laterales.

**Grupo:** igual, con expandir membresía y fan-out a inbox por usuario para N pequeño.

**Sync:** cursor por dispositivo desde el almacén; push en vivo a todas las sesiones activas.

**Trade-offs para decir en voz alta:**

- WebSocket en ambos sentidos simplifica el cliente; HTTP para enviar + WS para recibir también funciona.
- Copias de inbox por usuario simplifican grupos pequeños; se rompen en canales enormes.
- El fan-out en vivo no sustituye al almacenamiento durable.
- La presencia necesita heartbeats y gracia, no eventos crudos de desconexión TCP.
- Un solo servidor con todos los sockets es un juguete, no un chat global.

---

## Checklist de producción

- [ ] Alcance: 1:1, tamaño de grupo, media, cifrado, retención
- [ ] División HTTP vs WebSocket clara
- [ ] Discovery solo devuelve nodos de chat sanos
- [ ] Mapa de sesiones soporta multi-dispositivo
- [ ] Ids de mensaje únicos y fáciles de fusionar
- [ ] Envío idempotente con ids de cliente
- [ ] Persistir antes (o con semántica clara) de "enviado"
- [ ] Entregado y leído definidos para multi-dispositivo
- [ ] Ruta push offline probada
- [ ] Heartbeat de presencia + ventana de gracia
- [ ] Coste de fan-out de grupo acotado (u otro modelo para N grande)
- [ ] Rate limits y tamaño máximo de cuerpo en el borde
- [ ] Historia de drenaje y reconnect en deploys y muerte de nodo
- [ ] Métricas: conexiones, QPS de envío, latencia de ack, lag de fan-out, éxito de push, tasa de reconnect

---

## Resumen que puedes contar a un amigo

Imagina el chat como dos sistemas pegados.

Primero, una **red de walkie-talkies**. Mientras estás en línea, el teléfono mantiene una línea viva con un servidor de chat. Los mensajes se empujan por esa línea y el chat se siente instantáneo. Los puntos verdes son "estoy en el canal ahora mismo", refrescados con heartbeats silenciosos para que un parpadeo del túnel no te pinte offline.

Segundo, una **oficina de correos**. Cada mensaje aceptado se archiva. Los ticks significan: aceptado por correos (enviado), llegó a su dispositivo (entregado), abierto (leído). Si tu amigo dormía o estaba offline, la carta sigue en el almacén. Cuando abre la app, o un segundo dispositivo, tira del historial con un cursor: "dame todo después de lo último que ya tengo".

El chat uno a uno es una carta con un grito en vivo si están conectados. Los grupos pequeños hacen muchas copias (o punteros) de buzón para que cada persona se ponga al día desde su propio inbox. Las salas públicas enormes necesitan otro modelo; no estires para siempre el diseño de grupo pequeño.

Si falla un grito en vivo, el almacén sigue teniendo la carta. **La velocidad es el walkie-talkie. La verdad es la oficina de correos.** Ese es todo el sistema de chat en un aliento.

---

## Cierre

Un sistema de chat no es "WebSockets más una base de datos". Son sesiones en tiempo real pegajosas, un log durable de mensajes en append, y reglas de fan-out que cambian con el tamaño del grupo, más presencia y sync para que la vida multi-dispositivo y las redes inestables se sientan intencionadas y no rotas.

Espina de entrevista: **HTTP para el CRUD aburrido, WebSocket para el cable en vivo, almacén como fuente de verdad, push como ruta rápida, inbox por usuario en grupos pequeños, heartbeats para presencia.** Todo lo demás es dimensionar, manejar fallos y acotar el producto.

Cuando alguien pregunte "¿y si el grupo tiene un millón de miembros?", cambia el modelo de fan-out. No solo añadas servidores a un diseño de walkie-talkie y esperes.

