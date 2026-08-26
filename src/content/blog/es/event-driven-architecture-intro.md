---
title: "Arquitectura orientada a eventos para backend: eventos, brokers, idempotencia y outbox"
description: "Introducción práctica a sistemas orientados a eventos: eventos vs comandos, brokers, idempotencia del consumidor, outbox transaccional y cuándo request/response sigue siendo mejor."
date: "2026-07-11"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/event-driven-architecture-intro.webp
previewImage: /assets/images/event-driven-architecture-intro.webp
---

Request/response síncrono es fácil de razonar. El servicio A llama al servicio B, espera, obtiene respuesta o error. Ese modelo se rompe cuando una acción debe repartirse a muchos sistemas independientes, cuando escalan a ritmos distintos, o cuando un fallo temporal en una dependencia no debería bloquear todo el checkout.

La **arquitectura orientada a eventos** cambia el contrato: un productor publica un hecho sobre algo que ya ocurrió, y los consumidores reaccionan a su ritmo. Ganas desacoplamiento y escala horizontal. Pagas con consistencia eventual, depuración más dura y modos de fallo que no caben en un solo stack trace.

Este post es un mapa para ingenieros de backend en sistemas de alta demanda: la separación evento/comando, brokers, consumidores idempotentes, el patrón outbox, y los casos en los que los eventos son la herramienta equivocada.

---

## Qué significa de verdad "orientado a eventos"

En un diseño orientado a eventos, los componentes se comunican **emitiendo y reaccionando a eventos**, casi siempre a través de un **message broker** o un log. Los productores no saben quién consume. Los consumidores no llaman al productor de vuelta por el mismo hecho. El acoplamiento pasa de "debo conocer tu API y estar online cuando te llamo" a "debo acordar un esquema de mensaje y cómo recuperarme cuando la entrega se retrasa o se duplica."

Formas típicas en alta demanda:

| Forma | Ejemplo | Por qué ayudan los eventos |
| --- | --- | --- |
| Fan-out tras un write | Pedido creado → inventario, email, analytics, loyalty | Un write, muchos efectos laterales independientes |
| Handoff asíncrono | Upload listo → antivirus → miniatura → índice de búsqueda | El trabajo lento sale del camino del request |
| Integración | Webhook de pago → ledger + notificación | Los sistemas externos llegan a su horario |
| Stream processing | Click stream → score de fraude → feature store | Continuo, alto volumen, poco trabajo por ítem |

Eventos **no** significan "sustituye cada API HTTP por una cola." La mayoría de sistemas se quedan híbridos: síncrono para lecturas/escrituras de usuario que necesitan respuesta inmediata, asíncrono para trabajo que puede terminar después.

---

## Eventos vs comandos

La gente mezcla estos dos. Son contratos distintos.

### Evento: un hecho que ya ocurrió

Un **evento** va en pasado y es inmutable una vez publicado. El productor ya confirmó un cambio de estado (o al menos decidió que el hecho es cierto). Los consumidores pueden:

- actualizar sus propios modelos
- disparar workflows
- ignorar el evento si no les importa

Ejemplos:

```json
{
  "type": "OrderPlaced",
  "eventId": "evt_01J8K2...",
  "occurredAt": "2026-02-04T10:15:30Z",
  "orderId": "ord_9f3a",
  "customerId": "cus_12",
  "totalCents": 4599,
  "currency": "USD"
}
```

El nombre se queda en pasado: `OrderPlaced`, `PaymentCaptured`, `UserEmailChanged`. El payload debería llevar datos suficientes para que los consumidores actúen sin volver a llamar al productor por cada campo (con sentido común). Eventos demasiado finos, solo con un id, empujan a cada consumidor a un camino de lectura ruidoso bajo carga.

### Comando: una instrucción para hacer algo

Un **comando** es imperativo. Un emisor quiere que un receptor concreto realice una acción. Puede aceptarse, rechazarse o fallar. El resultado aún no es un hecho.

Ejemplos: `PlaceOrder`, `ChargeCard`, `ReserveInventory`.

Los comandos suelen viajar en colas con un único grupo de consumidores lógico (o un tipo de worker conocido). Los eventos suelen ir a topics con muchos suscriptores independientes.

| | Evento | Comando |
| --- | --- | --- |
| Tiempo verbal | Pasado (`OrderPlaced`) | Imperativo (`PlaceOrder`) |
| Dueño del resultado | Ya decidido por el productor | Decidido por el handler |
| Acoplamiento | El productor ignora a los consumidores | El emisor apunta a una responsabilidad |
| Fan-out | Natural (muchos suscriptores) | Suele ser un tipo de handler |
| Fallo | Cada consumidor reintenta su trabajo | El comando puede rechazarse o compensarse |

En la práctica, un handler de comando que tiene éxito suele **emitir un evento**. `PlaceOrder` ok → se publica `OrderPlaced`. Esa separación mantiene aparte la intención de escritura y la difusión del hecho.

---

## Brokers y logs: qué estás comprando de verdad

El broker (o log) es la infraestructura compartida entre productores y consumidores. El producto importa menos que la semántica de entrega para la que diseñas.

### Opciones comunes (modelo mental, no comparativa)

| Sistema | Modelo | Buen default para |
| --- | --- | --- |
| **Kafka / Redpanda** | Log append-only, offsets de consumidor, particiones | Alto throughput, replay, muchos consumer groups |
| **RabbitMQ** | Colas, exchanges, routing keys | Work queues, routing complejo, menor volumen |
| **SQS (+ SNS)** | Colas gestionadas / fan-out | Workers nativos en AWS, ops simples |
| **NATS / JetStream** | Mensajería ligera + persistencia opcional | Baja latencia, topologías más simples |
| **Google Pub/Sub** | Topics/suscripciones gestionados | Fan-out de eventos nativo en GCP |

### Garantías de entrega con las que vas a vivir

Casi todo broker de producción te da **at-least-once** en los caminos de fallo que importan. Un consumidor puede caer después de procesar pero antes de hacer ack. El mismo mensaje vuelve.

Diseña para:

1. **At-least-once** como línea base.
2. **Consumidores idempotentes** (siguiente sección).
3. **Orden** solo donde lo necesitas (normalmente por clave de agregado, p. ej. `orderId`), no orden global de todo el sistema.
4. **Retención / replay** si necesitas reconstruir un consumidor o recuperarte de un bug.

El marketing de "exactly-once" suele ser una combinación cuidadosa de productores transaccionales, consumidores idempotentes y features del broker. Trátalo como propiedad de **todo el pipeline**, no como un checkbox de ficha de producto.

### Topics, particiones y claves

En sistemas basados en log:

- Pon eventos que deben mantener orden para una entidad en la **misma partition key** (p. ej. `orderId`).
- Mantén las particiones equilibradas. Una clave caliente se convierte en una partición caliente.
- Separa **topics de integración públicos** (esquemas estables) de los **internos** que puedes romper con más libertad.

En sistemas basados en colas:

- Prefiere **competing consumers** en una work queue para paralelizar.
- Usa **dead-letter queues (DLQ)** para mensajes venenosos tras N fallos.
- Limita la concurrencia para que un pico no funda la base de datos detrás de los workers.

---

## Idempotencia: los consumidores verán duplicados

Si solo recuerdas una regla operativa: **cada consumidor debe tolerar el mismo evento dos veces**.

Los duplicados aparecen cuando:

- el broker reentrega tras un crash o un blip de red
- un productor reintenta un publish que en realidad tuvo éxito
- reprocesas una partición tras un fix
- at-least-once se encuentra con un ack lento

### Patrones prácticos

**1. Clave de idempotencia guardada antes de los side effects**

Usa un id estable del mensaje (`eventId`, o una clave natural como `paymentId + status`). En la misma transacción de base de datos que tu write:

```sql
INSERT INTO processed_events (event_id, consumer, processed_at)
VALUES ($1, 'inventory-service', now())
ON CONFLICT (event_id, consumer) DO NOTHING;
-- if insert did nothing, skip business work
```

Si el insert gana, aplica el cambio de negocio en la misma transacción. Si pierde, ya manejaste este evento.

**2. Idempotencia natural en el dominio**

Algunos writes son seguros de repetir por naturaleza:

- `SET status = 'shipped' WHERE order_id = $1 AND status = 'paid'`
- Upsert por primary key con el mismo payload
- "Añade el ítem si falta" en lugar de "siempre incrementa"

Prefiere checks de dominio cuando encajan. Se leen mejor que una tabla lateral gigante para cada micro-update.

**3. Side effects de salida (email, webhooks, cargos)**

Las APIs externas son la parte dura. Un segundo envío puede cobrar dos veces o spamear a un usuario.

- Pasa un **client request id** / clave de idempotencia a proveedores que lo soporten (las APIs de pago suelen hacerlo).
- Registra "notificación ya enviada para este evento" antes o después de la llamada, con una regla clara para fallos parciales.
- Prefiere tablas de "enviar una vez" al fire-and-forget en el bucle del consumidor.

### Qué no hacer

No confíes en "el broker dijo exactly once." No uses solo sets en memoria de "ya vi esto" en un consumidor multi-instancia. No trates el orden de mensajes como sustituto de la idempotencia; reordenación y reentrega ocurren bajo carga.

---

## El problema dual-write y el outbox

Este es el fallo clásico:

```
1. BEGIN; INSERT order; COMMIT;
2. publish OrderPlaced to broker
```

Si el paso 2 falla tras el commit, el pedido existe y ningún consumidor se entera. Si inviertes el orden y el write de la DB falla tras el publish, los consumidores procesan un pedido fantasma.

Publicar dentro de la misma transacción de DB no está disponible en la mayoría de brokers. Dos sistemas independientes no comparten un commit atómico sin ayuda.

### Outbox transaccional

Escribe la fila de negocio **y** una fila de outbox en la **misma transacción de base de datos**. Un proceso aparte (o CDC) publica las filas del outbox al broker y luego las marca como enviadas.

```sql
BEGIN;

INSERT INTO orders (id, customer_id, total_cents, status)
VALUES ($1, $2, $3, 'placed');

INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload, created_at)
VALUES ($4, 'order', $1, 'OrderPlaced', $5::jsonb, now());

COMMIT;
```

Bucle del relay (simplificado):

```
1. SELECT pending outbox rows (FOR UPDATE SKIP LOCKED)
2. publish to broker
3. mark published_at (or delete)
```

Propiedades que quieres:

| Preocupación | Enfoque |
| --- | --- |
| Atomicidad de estado + intención de publicar | Misma transacción de DB |
| Sin eventos perdidos tras commit | El relay reintenta hasta que el publish tenga éxito |
| Sin filas atascadas bajo concurrencia | `SKIP LOCKED`, límites de batch |
| Publish duplicado aún posible | Los consumidores siguen siendo idempotentes |
| Observabilidad | Métricas de lag del outbox, edad del más antiguo sin enviar |

### CDC como variante del outbox

Change Data Capture (Debezium y compañía) sigue el log de la base de datos y convierte cambios de filas en eventos. Misma idea: la fuente de verdad es el commit log, no un publish best-effort de la app tras el commit. Aun así diseñas esquemas, filtros e idempotencia del consumidor.

### Inbox (espejo opcional)

Algunos equipos también usan una tabla **inbox** en el lado del consumidor como almacén durable de "recibí el evento X", y procesan desde ahí. Mismo tema: hacer que el marcador de "manejado" sea transaccional con el write de dominio.

---

## Fallos, reintentos y mensajes venenosos

Los sistemas de alta demanda fallan de formas parciales. Diseña el bucle del consumidor como si cada dependencia pudiera hacer timeout.

1. **Retry con backoff** para errores transitorios (lock de DB, blip de red). Limita los intentos.
2. **DLQ** tras N fallos para que un payload malo no bloquee la partición o la cola para siempre.
3. **Alerta sobre profundidad de DLQ y lag del outbox.** Un lag silencioso es peor que un fallo ruidoso.
4. **Haz handlers cortos.** Handlers largos aumentan la probabilidad de reentrega a mitad de vuelo.
5. **Separa "procesar evento" de "llamar a un tercero frágil"** cuando puedas: procesa rápido, encola un job dedicado para la llamada frágil.

En logs estilo Kafka, un consumidor atascado en un mensaje venenoso puede detener toda la partición. Por eso DLQ (o skip-and-metric con cuidado) no es opcional a escala.

---

## Esquema y evolución

JSON suelto sin contrato se convierte en dolor de producción tras el tercer consumidor.

Reglas prácticas:

- Versiona el **tipo de evento** o el esquema (`OrderPlaced.v1`, o un campo `schemaVersion`).
- Prefiere cambios **aditivos**: campos opcionales nuevos. Evita renombrar o reutilizar campos.
- Usa un registry (Avro/Protobuf/JSON Schema) cuando muchos equipos comparten topics.
- Documenta qué campos son **necesarios para corrección** frente a desnormalización de conveniencia.
- No pongas secretos en payloads de eventos. Los eventos suelen retenerse y ser legibles dentro de la org.

Cuando un cambio rompedor es inevitable, haz dual-publish un tiempo o levanta un topic nuevo y migra consumidores a propósito.

---

## Cuándo no usar diseño orientado a eventos

Los eventos son un trade-off, no un ascenso. Evítalos o limítalos cuando:

| Situación | Prefiere en su lugar |
| --- | --- |
| El usuario necesita una respuesta inmediata y correcta en el mismo request | API síncrona + transacción de DB |
| Un equipo posee un solo desplegable y no hay fan-out | Llamadas in-process o un monólito modular |
| Se exige consistencia fuerte entre varios agregados en un clic | Un solo límite de transacción, o sagas solo si aceptas la complejidad |
| El equipo no tiene ops para brokers, métricas de lag, DLQs, revisión de esquema | Arquitectura más simple hasta poder operar la fontanería |
| La depuración es débil y el tráfico es bajo | Request/response es más fácil de trazar de punta a punta |
| Solo necesitas un informe nocturno | Job batch, no un topic en tiempo real |

Evita también el **"monólito distribuido sobre Kafka"**: cada servicio sigue necesitando los eventos de todos los demás para completar una sola acción de usuario, sin ownership claro. Obtienes los modos de fallo de sistemas distribuidos sin los beneficios de aislamiento.

Una prueba útil: si perder el broker 10 minutos hace el **producto core inutilizable** en lugar de retrasar solo side effects, puede que hayas puesto lógica de camino crítico en el transporte equivocado.

---

## Checklist mínima de producción

Antes de publicar un camino de eventos en un flujo de alta demanda:

1. **Evento vs comando** está bien nombrado y con dueño claro.
2. El **esquema** está documentado; los consumidores conocen los campos requeridos.
3. El **productor** usa outbox (o CDC), no esperanza de dual-write.
4. El **consumidor** es idempotente ante entrega at-least-once.
5. El **orden** se define por clave si importa; no se asume global.
6. Existen y se prueban **retries + DLQ + alertas de lag**.
7. **Backpressure**: consumidores y pools de DB no se funden con un replay o un pico de tráfico.
8. **Sabes cómo reprocesar** un día de eventos tras un bug sin cobrar dos veces a los usuarios.

---

## Cierre

La arquitectura orientada a eventos se gana su sitio cuando sistemas independientes deben reaccionar a los mismos hechos a distintas velocidades, y cuando los caminos de request no pueden esperar a cada side effect. El coste de ingeniería es real: brokers, esquemas, idempotencia, outboxes y monitorización de lag son parte de la feature, no extras.

Empieza con un hecho claro (`OrderPlaced`), un outbox, un consumidor idempotente y métricas de lag. Amplía solo cuando el siguiente fan-out duela más como llamada síncrona que como otro suscriptor. Esa secuencia mantiene flexibles los sistemas de alta demanda sin convertir cada write en un misterio distribuido.
