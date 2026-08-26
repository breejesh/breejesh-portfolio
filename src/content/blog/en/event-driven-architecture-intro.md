---
title: "Event-Driven Architecture for Backend Engineers: Events, Brokers, Idempotency, Outbox"
description: "A practical intro to event-driven systems: events vs commands, broker choices, consumer idempotency, transactional outbox, and when request/response is still the better call."
date: "2026-07-11"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/event-driven-architecture-intro.webp
previewImage: /assets/images/event-driven-architecture-intro.webp
---

Synchronous request/response is simple to reason about until one downstream service stumbles and the entire checkout flow freezes. Event-driven architecture shifts the contract from blocking commands to asynchronous facts. That model breaks down when one action must fan out to many independent systems, when those systems scale at different rates, or when a temporary outage in one dependency should not block the whole checkout path.

**Event-driven architecture** shifts the contract: a producer publishes a fact about something that already happened, and consumers react in their own time. You gain decoupling and horizontal scale. You pay with eventual consistency, harder debugging, and failure modes that do not show up in a single stack trace.

This post is a backend engineer's map of the ideas that matter on high-demand systems: the event/command split, brokers, idempotent consumers, the outbox pattern, and the cases where events are the wrong tool.

---

## What "event-driven" actually means

In an event-driven design, components communicate by **emitting and reacting to events**, usually through a **message broker** or a log. Producers do not know who consumes. Consumers do not call the producer back for the same fact. Coupling moves from "I must know your API and be online when I call you" to "I must agree on a message schema and on how to recover when delivery is delayed or duplicated."

Typical high-demand shapes:

| Shape | Example | Why events help |
| --- | --- | --- |
| Fan-out after a write | Order placed → inventory, email, analytics, loyalty | One write, many independent side effects |
| Async handoff | Upload finished → virus scan → thumbnail → search index | Slow work leaves the request path |
| Integration | Payment webhook → ledger + notification | External systems arrive on their schedule |
| Stream processing | Click stream → fraud score → feature store | Continuous, high volume, low per-item work |

Events do **not** mean "replace every HTTP API with a queue." Most systems stay hybrid: synchronous for user-facing reads/writes that need an immediate answer, asynchronous for work that can complete later.

---

## Events vs commands

People mix these two. They are different contracts.

### Event: a fact that happened

An **event** is past tense and immutable once published. The producer already committed a state change (or at least decided the fact is true). Consumers may:

- update their own models
- trigger workflows
- ignore the event if it is not relevant

Examples:

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

Naming stays past tense: `OrderPlaced`, `PaymentCaptured`, `UserEmailChanged`. The payload should carry enough data for consumers to act without calling back into the producer for every field (within reason). Thin events that only contain an id force every consumer into a chatty read path under load.

### Command: an instruction to do something

A **command** is imperative. A sender wants a specific receiver to perform an action. It may be accepted, rejected, or fail. The outcome is not yet a fact.

Examples: `PlaceOrder`, `ChargeCard`, `ReserveInventory`.

Commands often travel on queues with a single logical consumer group (or a known worker type). Events often go to topics with many independent subscribers.

| | Event | Command |
| --- | --- | --- |
| Tense | Past (`OrderPlaced`) | Imperative (`PlaceOrder`) |
| Ownership of outcome | Already decided by producer | Decided by the handler |
| Coupling | Producer ignores consumers | Sender targets a responsibility |
| Fan-out | Natural (many subscribers) | Usually one handler type |
| Failure | Consumers retry their own work | Command may need reject / compensate |

In practice, a command handler that succeeds often **emits an event**. `PlaceOrder` succeeds → `OrderPlaced` is published. That split keeps write intent and broadcast of facts separate.

---

## Brokers and logs: what you are actually buying

The broker (or log) is the shared infrastructure between producers and consumers. The product choice matters less than the delivery semantics you design for.

### Common options (mental model, not a bake-off)

| System | Model | Good default for |
| --- | --- | --- |
| **Kafka / Redpanda** | Append-only log, consumer offsets, partitions | High throughput, replay, many consumer groups |
| **RabbitMQ** | Queues, exchanges, routing keys | Work queues, complex routing, lower volume |
| **SQS (+ SNS)** | Managed queues / fan-out | AWS-native workers, simple ops |
| **NATS / JetStream** | Lightweight messaging + optional persistence | Low latency, simpler topologies |
| **Google Pub/Sub** | Managed topics/subscriptions | GCP-native event fan-out |

### Delivery guarantees you will live with

Almost every production broker gives you **at-least-once** delivery in the failure paths that matter. A consumer can crash after processing but before acknowledging. The same message comes back.

Design for:

1. **At-least-once** as the baseline.
2. **Idempotent consumers** (next section).
3. **Ordering** only where you need it (usually per aggregate key, e.g. `orderId`), not global order across the whole system.
4. **Retention / replay** if you need to rebuild a consumer or recover from a bug.

"Exactly-once" marketing usually means a careful combination of transactional producers, idempotent consumers, and broker features. Treat it as a property of the **whole pipeline**, not a checkbox on a product page.

### Topics, partitions, and keys

For log-based systems:

- Put events that must stay ordered for one entity on the **same partition key** (e.g. `orderId`).
- Keep partitions balanced. A single hot key becomes a single hot partition.
- Separate **public integration topics** (stable schemas) from **internal** ones you can break more freely.

For queue-based systems:

- Prefer **competing consumers** on a work queue for parallel processing.
- Use **dead-letter queues (DLQ)** for poison messages after N failures.
- Cap concurrency so a spike does not melt the database behind the workers.

---

## Idempotency: consumers will see duplicates

If you only remember one operational rule: **every consumer must tolerate the same event twice**.

Duplicates show up when:

- the broker redelivers after a crash or network blip
- a producer retries a publish that actually succeeded
- you reprocess a partition after a bug fix
- at-least-once meets a slow acknowledge

### Practical patterns

**1. Idempotency key stored before side effects**

Use a stable id from the message (`eventId`, or a natural key like `paymentId + status`). In the same database transaction as your write:

```sql
INSERT INTO processed_events (event_id, consumer, processed_at)
VALUES ($1, 'inventory-service', now())
ON CONFLICT (event_id, consumer) DO NOTHING;
-- if insert did nothing, skip business work
```

If the insert wins, apply the business change in the same transaction. If it loses, you already handled this event.

**2. Natural idempotency in the domain**

Some writes are inherently safe to repeat:

- `SET status = 'shipped' WHERE order_id = $1 AND status = 'paid'`
- Upsert by primary key with the same payload
- "Add item if missing" rather than "always increment"

Prefer domain checks when they fit. They read cleaner than a giant side table for every micro-update.

**3. Outbound side effects (email, webhooks, charges)**

External APIs are the hard part. A second send can double-charge or spam a user.

- Pass a **client request id** / idempotency key to providers that support it (payment APIs often do).
- Record "notification already sent for this event" before or after the call with a clear rule for partial failure.
- Prefer "send once" tables over fire-and-forget in the consumer loop.

### What not to do

Do not rely on "the broker said exactly once." Do not use only in-memory "I already saw this" sets on a multi-instance consumer. Do not treat message order as a substitute for idempotency; reordering and redelivery both happen under load.

---

## The dual-write problem and the outbox

Here is the classic failure:

```
1. BEGIN; INSERT order; COMMIT;
2. publish OrderPlaced to broker
```

If step 2 fails after commit, the order exists and no consumer ever hears about it. If you reverse the order and the DB write fails after publish, consumers process a ghost order.

Publishing inside the same DB transaction is not available on most brokers. Two independent systems cannot share one atomic commit without help.

### Transactional outbox

Write the business row **and** an outbox row in the **same database transaction**. A separate process (or CDC) publishes outbox rows to the broker, then marks them sent.

```sql
BEGIN;

INSERT INTO orders (id, customer_id, total_cents, status)
VALUES ($1, $2, $3, 'placed');

INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload, created_at)
VALUES ($4, 'order', $1, 'OrderPlaced', $5::jsonb, now());

COMMIT;
```

Relay loop (simplified):

```
1. SELECT pending outbox rows (FOR UPDATE SKIP LOCKED)
2. publish to broker
3. mark published_at (or delete)
```

Properties you want:

| Concern | Approach |
| --- | --- |
| Atomicity of state + intent to publish | Same DB transaction |
| No lost events after commit | Relay retries until publish succeeds |
| No stuck rows under concurrency | `SKIP LOCKED`, batch size limits |
| Duplicate publish still possible | Consumers stay idempotent |
| Observability | Metrics on outbox lag, oldest unsent age |

### CDC as an outbox variant

Change Data Capture (Debezium and friends) tails the database log and turns row changes into events. Same idea: the source of truth is the commit log, not a best-effort app publish after commit. You still design schemas, filters, and consumer idempotency.

### Inbox (optional mirror)

Some teams also use an **inbox** table on the consumer side as the durable "I received event X" store, then process from there. Same theme: make the "handled" marker transactional with the domain write.

---

## Failure, retries, and poison messages

High-demand systems fail in partial ways. Design the consumer loop as if every dependency can time out.

1. **Retry with backoff** for transient errors (DB lock, network blip). Cap attempts.
2. **DLQ** after N failures so one bad payload does not block the partition or queue forever.
3. **Alert on DLQ depth and outbox lag.** Silent lag is worse than a loud failure.
4. **Make handlers short.** Long handlers increase the chance of redelivery mid-flight.
5. **Separate "process event" from "call flaky third party"** when you can: process fast, enqueue a dedicated job for the flaky call.

For Kafka-style logs, a stuck consumer on a poison message can stall the whole partition. That is why DLQ (or skip-and-metric with care) is not optional at scale.

---

## Schema and evolution

Loose JSON without a contract turns into production pain after the third consumer.

Practical rules:

- Version the **event type** or schema (`OrderPlaced.v1`, or a `schemaVersion` field).
- Prefer **additive** changes: new optional fields. Avoid renaming or repurposing fields.
- Use a registry (Avro/Protobuf/JSON Schema) when many teams share topics.
- Document which fields are **required for correctness** vs convenience denormalization.
- Do not put secrets in event payloads. Events are often retained and widely readable inside the org.

When a breaking change is unavoidable, run dual-publish for a while or stand up a new topic and migrate consumers deliberately.

---

## When not to use event-driven design

Events are a trade-off, not a promotion. Skip or limit them when:

| Situation | Prefer instead |
| --- | --- |
| User needs an immediate, correct answer in the same request | Synchronous API + DB transaction |
| One team owns one deployable and there is no fan-out | In-process calls or a modular monolith |
| Strong consistency across multiple aggregates is required in one click | Single transaction boundary, or sagas only if you accept complexity |
| Team has no ops for brokers, lag metrics, DLQs, schema review | Simpler architecture until you can operate the plumbing |
| Debugging skill is thin and traffic is low | Request/response is easier to trace end to end |
| You only need a nightly report | Batch job, not a real-time topic |

Also avoid **"distributed monolith over Kafka"**: every service still needs every other service's events to complete a single user action, with no clear ownership. You get the failure modes of distributed systems without the isolation benefits.

A useful test: if losing the broker for 10 minutes would make the **core product unusable** rather than delayed on side effects, you may have put critical path logic on the wrong transport.

---

## A minimal production checklist

Before you ship an event path on a high-demand flow:

1. **Event vs command** is named and owned correctly.
2. **Schema** is documented; consumers know required fields.
3. **Producer** uses outbox (or CDC), not dual-write hope.
4. **Consumer** is idempotent for at-least-once delivery.
5. **Ordering** is defined per key if it matters; not assumed globally.
6. **Retries + DLQ + lag alerts** exist and are tested.
7. **Backpressure**: consumers and DB pools will not melt under a replay or traffic spike.
8. **You know how to reprocess** a day of events after a bug without double-charging users.

---

## Closing

Event-driven architecture earns its place when independent systems must react to the same facts at different speeds, and when request paths cannot wait for every side effect. The engineering cost is real: brokers, schemas, idempotency, outboxes, and lag monitoring are part of the feature, not extras.

Start with one clear fact (`OrderPlaced`), one outbox, one idempotent consumer, and metrics on lag. Expand only when the next fan-out hurts more as a synchronous call than as another subscriber. That sequence keeps high-demand systems flexible without turning every write into a distributed mystery.
