---
title: "Clean Architecture for Backends That Stay Maintainable"
description: "Layers, the dependency rule, and use cases in real backend services. What pays off, what turns into ceremony, and when a simpler layout is the better call."
date: "2026-06-26"
tags: [Backend]
coverImage: /assets/images/clean-architecture-backends.webp
previewImage: /assets/images/clean-architecture-backends.webp
---

Most backend rewrites start the same way. Business rules live in controllers. Controllers talk to the ORM. The ORM leaks into tests. Six months later, changing a payment rule means touching HTTP handlers, SQL, and a queue consumer that nobody remembered. Clean architecture is a set of habits that slow that drift down. It is not a religion, and it is not free.

This post is about the pieces that hold up under real product pressure: **layers**, the **dependency rule**, **use cases**, and a blunt section on **when the whole thing is overkill**.

---

## What problem you are actually solving

A maintainable backend is one where:

1. **Business rules can change** without rewriting transport and storage.
2. **Storage or HTTP can change** without rewriting business rules.
3. **You can test decisions** without a database or a full web framework.
4. **New endpoints reuse policy** instead of copy-pasting validation and side effects.

If your service is a thin CRUD shell over one table, you may already be fine. If your service owns money, inventory, compliance, multi-step workflows, or several ways into the same rule (API, job, admin tool), structure starts to matter.

---

## Layers in plain language

Uncle Bob’s diagram has many rings. In a backend you can run for years with four ideas:

| Layer | Owns | Examples |
| --- | --- | --- |
| **Domain / entities** | Pure business meaning | `Order`, `Money`, `InvoiceStatus`, invariants like "cannot ship cancelled order" |
| **Use cases / application** | One user-visible or system-visible action | `PlaceOrder`, `RefundPayment`, `ExpireSubscription` |
| **Interface adapters** | Translation in and out | Controllers, presenters, repository implementations, message mappers |
| **Frameworks and drivers** | Details you want to replace | Express/FastAPI, Postgres, Redis, Stripe SDK, filesystem |

Think of it as **policy inside, details outside**. The domain does not know FastAPI exists. A use case does not import SQLAlchemy session objects. Controllers do not embed refund math.

A folder layout that maps cleanly (names vary by team):

```
src/
  domain/           # entities, value objects, domain errors
  application/      # use cases, ports (interfaces)
  adapters/
    http/           # routes, request/response DTOs
    persistence/    # repository implementations
    messaging/      # consumers, publishers
  main/             # composition root: wire dependencies
```

You do not need those exact names. You need a place where **rules** and **wiring** do not share a file.

---

## The dependency rule

**Source code dependencies point inward.** Outer layers know about inner layers. Inner layers never import outer ones.

Consequences that actually show up in code review:

* Domain code has **no** framework imports, **no** ORM models, **no** HTTP status codes.
* Use cases depend on **ports** (interfaces or abstract types), not on Postgres or Stripe classes.
* Adapters implement those ports and call use cases.
* `main` (or your DI container) is the only place that constructs the full graph.

```
HTTP controller  -->  PlaceOrder use case  -->  OrderRepository (port)
                              ^                        ^
                              |                        |
                         domain types          PostgresOrderRepository
```

Wrong direction (common failure mode):

```
PlaceOrder imports Session from ORM
PlaceOrder calls response.json(...)
Entity methods take Request objects
```

Once the use case depends on the web layer, every new entry point (CLI, worker, GraphQL) has to fake HTTP. That is how architecture dies quietly.

### Ports and adapters, not magic

A **port** is a small interface the application needs:

```typescript
// application/ports/order-repository.ts
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
}
```

A **use case** orchestrates domain objects and ports:

```typescript
// application/place-order.ts
export class PlaceOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
    private readonly clock: Clock,
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<PlaceOrderResult> {
    const order = Order.create(cmd, this.clock.now());
    const charge = await this.payments.charge({
      amount: order.total,
      customerId: cmd.customerId,
    });
    if (!charge.ok) {
      throw new PaymentFailed(charge.reason);
    }
    order.markPaid(charge.id, this.clock.now());
    await this.orders.save(order);
    return { orderId: order.id, paymentId: charge.id };
  }
}
```

An **adapter** implements the port with real tech:

```typescript
// adapters/persistence/postgres-order-repository.ts
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.db.query(/* ... */);
    return row ? mapRowToOrder(row) : null;
  }

  async save(order: Order): Promise<void> {
    await this.db.query(/* insert or update */);
  }
}
```

The HTTP handler stays thin: parse input, call `placeOrder.execute`, map result or domain errors to status codes. Mapping lives at the edge so the use case stays testable with fakes.

---

## Use cases as the spine of the app

If you only take one idea from clean architecture, take **use cases**.

A use case is:

* named after **what the business does** (`CancelSubscription`, not `UpdateSubscriptionRow`)
* one primary **transaction boundary** (or an explicit multi-step workflow with clear failure points)
* the place where **authorization checks that are policy**, not framework middleware trivia, often live
* the unit you **unit test** hardest

Controllers become boring. That is a feature. Boring controllers mean the interesting bugs live in named operations you can list on a whiteboard.

### Command vs query

You do not need full CQRS. A light split helps:

* **Commands** change state: `PlaceOrder`, `RefundPayment`
* **Queries** read state: `GetOrder`, `ListInvoicesForCustomer`

Queries can skip heavy domain factories and hit a read model or a simple SQL projection. Forcing every read through a rich aggregate is a common form of overkill.

### Where validation goes

| Kind of check | Where |
| --- | --- |
| Shape / types / required fields | Edge DTO or schema (Zod, Pydantic, Bean Validation) |
| Business invariant | Domain entity or domain service |
| Process rules (who may, under what status) | Use case |
| Infrastructure limits (payload size) | Framework / gateway |

Do not push "order total must be positive" into the controller only. Do not push "JSON field must be a string" into the entity.

---

## Testing: the real ROI

Clean architecture pays rent in tests.

* **Domain tests:** pure functions and entities, no mocks needed.
* **Use case tests:** in-memory fakes for ports. Fast. Deterministic.
* **Adapter tests:** fewer of them; hit a real Postgres in CI for repositories, or contract tests for gateways.
* **HTTP tests:** smoke and mapping, not the full rule set again.

Example shape for a use case test:

```typescript
test("rejects cancel when already shipped", async () => {
  const orders = new InMemoryOrderRepository([
    Order.rehydrate({ id: "o1", status: "shipped" }),
  ]);
  const uc = new CancelOrder(orders, fixedClock);

  await expect(uc.execute({ orderId: "o1", reason: "changed mind" }))
    .rejects.toBeInstanceOf(OrderNotCancellable);
});
```

If every meaningful test boots the web framework and a database, the architecture is not protecting you yet. The dependency rule is what makes the cheap tests possible.

---

## Shared kernels, modules, and multiple services

Clean architecture is **inside one deployable**. It does not replace service boundaries.

* **One bounded context per service** (or large module) keeps use cases coherent.
* Shared "god domain" libraries across many microservices usually become a distributed monolith of types.
* Prefer **shared nothing** or **versioned events** over importing each other’s entities.

Inside a modular monolith, treat packages like services: only call another module through its application API, not by reaching into its tables.

---

## When it is overkill

Ship the simpler design when most of these are true:

1. **One developer**, short lifetime, or a prototype that may die next quarter.
2. **CRUD-shaped** work: list, get, update columns, almost no multi-step rules.
3. **One database**, one HTTP API, no second consumer of the same rules.
4. Team is **fighting the folder structure** more than the product.
5. You are inventing interfaces for things you will **never swap** and never fake in tests.

Symptoms you went too far:

* Five interfaces for one Postgres table used in one place
* Mappers mapping mappers mapping DTOs that are identical
* Use case files that only call a repository with no domain logic
* New hires spend a week learning "the architecture" before shipping a field

A honest middle ground many teams use:

| Situation | Layout |
| --- | --- |
| Internal tool, thin API | Routes + service functions + SQL |
| Growing product service | Controllers, application services, repositories, domain where rules cluster |
| Money / compliance / multi-entry workflows | Full ports, use cases, domain entities |

Start **vertical**. Extract a use case when a second entry point appears, or when a rule is hard to test through HTTP. Do not scaffold twenty empty layers on day one of a todo app.

---

## Practical rules that survive code review

1. **Domain and use cases have no framework imports.** Grep for them in CI if you must.
2. **One use case class (or function) per business action** that mutates important state.
3. **Ports are small** and owned by the application side, implemented by adapters.
4. **Composition root wires everything.** Controllers do not `new` infrastructure deep in request handlers if you can avoid it.
5. **Errors are domain-named** (`InsufficientStock`, `SubscriptionInactive`). Map them to HTTP once at the edge.
6. **Reads can be simpler than writes.** Do not force every GET through a rich aggregate.
7. **Rename ruthlessly.** `OrderService` that does fifteen things is not a use case layer; it is a junk drawer.
8. **Document the one dependency rule** in the README in five lines. Long architecture wikis rot.

Minimal composition root sketch:

```typescript
// main/server.ts
const pool = new Pool(env.DATABASE_URL);
const orders = new PostgresOrderRepository(pool);
const payments = new StripePaymentGateway(env.STRIPE_KEY);
const placeOrder = new PlaceOrder(orders, payments, systemClock);

app.post("/orders", httpPlaceOrder(placeOrder));
```

Wiring is allowed to be ugly. Business code should not be.

---

## How this looks in common stacks

You can apply the same ideas without adopting a framework named "clean":

* **Node / TypeScript:** use cases as classes or functions; ports as interfaces; Prisma/TypeORM stay in adapters; Zod at the HTTP edge.
* **Python:** use cases as callables or classes; `Protocol` for ports; SQLAlchemy models do not double as domain entities if the model is messy; Pydantic for request DTOs.
* **Java / Kotlin:** package-by-feature or hexagonal modules; Spring stays at the edges (`@RestController`, `@Repository` impls); domain jars without Spring annotations if you want pure unit tests.
* **Go:** interfaces defined next to the consumer (use case package); concrete Postgres structs in `internal/postgres`; `cmd` wires it.

The brand on the blog post matters less than **who depends on whom**.

---

## A short decision checklist

Before you add another layer, ask:

* Will this rule be reached from **more than one** transport?
* Is the rule **hard to test** if it stays in the controller?
* Are we about to **duplicate** this validation in a worker?
* Can a junior engineer find the behavior by the **business name**?

If yes, extract a use case and a port. If no, leave the code boring and close the ticket.

Clean architecture keeps backends maintainable when it protects business rules from framework churn and makes those rules cheap to test. It becomes ceremony when every file is an interface waiting for a second implementation that never arrives. Use the dependency rule where the pain is real, keep the edges thin, and let use cases carry the names your product already uses.
