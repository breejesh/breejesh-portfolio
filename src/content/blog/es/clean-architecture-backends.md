---
title: "Arquitectura limpia para backends que se mantienen"
description: "Capas, la regla de dependencia y casos de uso en servicios backend reales. Qué rinde, qué se vuelve ceremonia y cuándo un diseño más simple es la mejor opción."
date: "2026-06-26"
tags: [Backend]
coverImage: /assets/images/clean-architecture-backends.webp
previewImage: /assets/images/clean-architecture-backends.webp
---

La mayoría de reescrituras de backend empiezan igual. Las reglas de negocio viven en controladores. Los controladores hablan con el ORM. El ORM se cuela en los tests. Seis meses después, cambiar una regla de pago implica tocar handlers HTTP, SQL y un consumer de cola que nadie recordaba. La arquitectura limpia es un conjunto de hábitos que frenan ese deterioro. No es religión, y no es gratis.

Este post cubre lo que aguanta presión real de producto: **capas**, la **regla de dependencia**, **casos de uso**, y una sección directa sobre **cuándo todo esto es exceso**.

---

## Qué problema estás resolviendo de verdad

Un backend mantenible es uno donde:

1. **Las reglas de negocio pueden cambiar** sin reescribir transporte y almacenamiento.
2. **El storage o el HTTP pueden cambiar** sin reescribir las reglas de negocio.
3. **Puedes probar decisiones** sin base de datos ni framework web completo.
4. **Los endpoints nuevos reutilizan política** en lugar de copiar validación y efectos secundarios.

Si tu servicio es un CRUD fino sobre una tabla, quizá ya estés bien. Si el servicio maneja dinero, inventario, compliance, flujos de varios pasos o varias entradas a la misma regla (API, job, herramienta admin), la estructura empieza a importar.

---

## Capas en lenguaje claro

El diagrama de Uncle Bob tiene muchos anillos. En un backend puedes vivir años con cuatro ideas:

| Capa | Posee | Ejemplos |
| --- | --- | --- |
| **Dominio / entidades** | Significado de negocio puro | `Order`, `Money`, `InvoiceStatus`, invariantes como "no se puede enviar un pedido cancelado" |
| **Casos de uso / aplicación** | Una acción visible para el usuario o el sistema | `PlaceOrder`, `RefundPayment`, `ExpireSubscription` |
| **Adaptadores de interfaz** | Traducción de entrada y salida | Controllers, presenters, implementaciones de repositorio, mappers de mensajes |
| **Frameworks y drivers** | Detalles que quieres poder reemplazar | Express/FastAPI, Postgres, Redis, SDK de Stripe, filesystem |

Piensa en **política dentro, detalles fuera**. El dominio no sabe que FastAPI existe. Un caso de uso no importa objetos de sesión de SQLAlchemy. Los controllers no embeben la matemática de reembolsos.

Una estructura de carpetas que encaja (los nombres varían por equipo):

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

No necesitas exactamente esos nombres. Necesitas un lugar donde **reglas** y **cableado** no compartan archivo.

---

## La regla de dependencia

**Las dependencias de código fuente apuntan hacia dentro.** Las capas externas conocen a las internas. Las internas nunca importan a las externas.

Consecuencias que salen en code review:

* El dominio **no** importa frameworks, **no** modelos ORM, **no** códigos de estado HTTP.
* Los casos de uso dependen de **puertos** (interfaces o tipos abstractos), no de clases de Postgres o Stripe.
* Los adaptadores implementan esos puertos y llaman a los casos de uso.
* `main` (o tu contenedor de DI) es el único sitio que construye el grafo completo.

```
HTTP controller  -->  PlaceOrder use case  -->  OrderRepository (port)
                              ^                        ^
                              |                        |
                         domain types          PostgresOrderRepository
```

Dirección incorrecta (fallo habitual):

```
PlaceOrder imports Session from ORM
PlaceOrder calls response.json(...)
Entity methods take Request objects
```

Cuando el caso de uso depende de la capa web, cada nueva entrada (CLI, worker, GraphQL) tiene que fingir HTTP. Así muere la arquitectura en silencio.

### Puertos y adaptadores, no magia

Un **puerto** es una interfaz pequeña que la aplicación necesita:

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

Un **caso de uso** orquesta objetos de dominio y puertos:

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

Un **adaptador** implementa el puerto con tecnología real:

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

El handler HTTP se queda fino: parsear entrada, llamar `placeOrder.execute`, mapear resultado o errores de dominio a códigos de estado. El mapeo vive en el borde para que el caso de uso se pruebe con fakes.

---

## Casos de uso como columna vertebral

Si solo te llevas una idea de la arquitectura limpia, que sea **casos de uso**.

Un caso de uso es:

* nombrado por **lo que hace el negocio** (`CancelSubscription`, no `UpdateSubscriptionRow`)
* un **límite de transacción** principal (o un flujo multi-paso con puntos de fallo claros)
* el sitio donde a menudo viven **comprobaciones de autorización que son política**, no detalles de middleware del framework
* la unidad que **unit test** con más fuerza

Los controllers se vuelven aburridos. Eso es una ventaja. Controllers aburridos significan que los bugs interesantes viven en operaciones con nombre que puedes listar en una pizarra.

### Comando vs consulta

No necesitas CQRS completo. Una separación ligera ayuda:

* **Comandos** cambian estado: `PlaceOrder`, `RefundPayment`
* **Consultas** leen estado: `GetOrder`, `ListInvoicesForCustomer`

Las consultas pueden saltarse factories de dominio pesadas y pegar a un read model o a una proyección SQL simple. Forzar cada lectura por un agregado rico es una forma habitual de exceso.

### Dónde va la validación

| Tipo de comprobación | Dónde |
| --- | --- |
| Forma / tipos / campos obligatorios | DTO o schema del borde (Zod, Pydantic, Bean Validation) |
| Invariante de negocio | Entidad de dominio o domain service |
| Reglas de proceso (quién puede, bajo qué estado) | Caso de uso |
| Límites de infraestructura (tamaño de payload) | Framework / gateway |

No dejes "el total del pedido debe ser positivo" solo en el controller. No metas "el campo JSON debe ser string" en la entidad.

---

## Tests: el ROI real

La arquitectura limpia paga alquiler en tests.

* **Tests de dominio:** funciones puras y entidades, sin mocks.
* **Tests de caso de uso:** fakes en memoria para puertos. Rápidos. Deterministas.
* **Tests de adaptador:** menos; un Postgres real en CI para repositorios, o contract tests para gateways.
* **Tests HTTP:** humo y mapeo, no el juego completo de reglas otra vez.

Forma de ejemplo para un test de caso de uso:

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

Si cada test relevante levanta el framework web y una base de datos, la arquitectura aún no te protege. La regla de dependencia es lo que hace posibles los tests baratos.

---

## Kernels compartidos, módulos y varios servicios

La arquitectura limpia es **dentro de un desplegable**. No sustituye los límites de servicio.

* **Un bounded context por servicio** (o módulo grande) mantiene los casos de uso coherentes.
* Librerías de "dominio dios" compartidas entre muchos microservicios suelen volverse un monolitito distribuido de tipos.
* Prefiere **shared nothing** o **eventos versionados** a importar las entidades del otro.

En un modular monolith, trata los paquetes como servicios: solo llama a otro módulo por su API de aplicación, no metiendo la mano en sus tablas.

---

## Cuándo es exceso

Elige el diseño más simple cuando la mayoría de esto sea cierto:

1. **Un desarrollador**, vida corta, o un prototipo que puede morir el próximo trimestre.
2. Trabajo con forma de **CRUD**: listar, obtener, actualizar columnas, casi sin reglas multi-paso.
3. **Una base de datos**, una API HTTP, sin un segundo consumidor de las mismas reglas.
4. El equipo **pelea más con las carpetas** que con el producto.
5. Inventas interfaces para cosas que **nunca vas a intercambiar** ni fakear en tests.

Síntomas de que te pasaste:

* Cinco interfaces para una tabla Postgres usada en un solo sitio
* Mappers que mapean mappers de DTOs idénticos
* Archivos de caso de uso que solo llaman a un repositorio sin lógica de dominio
* Los nuevos tardan una semana en aprender "la arquitectura" antes de entregar un campo

Un término medio honesto que usan muchos equipos:

| Situación | Diseño |
| --- | --- |
| Herramienta interna, API fina | Rutas + funciones de servicio + SQL |
| Servicio de producto en crecimiento | Controllers, application services, repositories, dominio donde se agrupan reglas |
| Dinero / compliance / flujos multi-entrada | Puertos completos, casos de uso, entidades de dominio |

Empieza en **vertical**. Extrae un caso de uso cuando aparezca una segunda entrada, o cuando una regla sea dura de probar por HTTP. No armes veinte capas vacías el día uno de una todo app.

---

## Reglas prácticas que sobreviven al code review

1. **Dominio y casos de uso sin imports de framework.** Haz grep en CI si hace falta.
2. **Una clase (o función) de caso de uso por acción de negocio** que mute estado importante.
3. **Puertos pequeños**, propiedad del lado de aplicación, implementados por adaptadores.
4. **El composition root cablea todo.** Los controllers no hacen `new` de infraestructura en lo hondo del handler si se puede evitar.
5. **Errores con nombre de dominio** (`InsufficientStock`, `SubscriptionInactive`). Mapea a HTTP una vez en el borde.
6. **Las lecturas pueden ser más simples que las escrituras.** No fuerces cada GET por un agregado rico.
7. **Renombra sin piedad.** Un `OrderService` que hace quince cosas no es capa de casos de uso; es cajón de sastre.
8. **Documenta la regla de dependencia** en el README en cinco líneas. Los wikis largos de arquitectura se pudren.

Esbozo mínimo de composition root:

```typescript
// main/server.ts
const pool = new Pool(env.DATABASE_URL);
const orders = new PostgresOrderRepository(pool);
const payments = new StripePaymentGateway(env.STRIPE_KEY);
const placeOrder = new PlaceOrder(orders, payments, systemClock);

app.post("/orders", httpPlaceOrder(placeOrder));
```

El cableado puede ser feo. El código de negocio no debería serlo.

---

## Cómo se ve en stacks habituales

Puedes aplicar las mismas ideas sin adoptar un framework llamado "clean":

* **Node / TypeScript:** casos de uso como clases o funciones; puertos como interfaces; Prisma/TypeORM en adaptadores; Zod en el borde HTTP.
* **Python:** casos de uso como callables o clases; `Protocol` para puertos; los modelos SQLAlchemy no doblan como entidades de dominio si el modelo es un lío; Pydantic para DTOs de request.
* **Java / Kotlin:** package-by-feature o módulos hexagonales; Spring en los bordes (`@RestController`, impls `@Repository`); jars de dominio sin anotaciones Spring si quieres unit tests puros.
* **Go:** interfaces junto al consumidor (paquete del caso de uso); structs concretos de Postgres en `internal/postgres`; `cmd` cablea.

La marca del post importa menos que **quién depende de quién**.

---

## Checklist corta de decisión

Antes de añadir otra capa, pregunta:

* ¿Esta regla se alcanzará desde **más de un** transporte?
* ¿La regla es **difícil de probar** si se queda en el controller?
* ¿Estamos a punto de **duplicar** esta validación en un worker?
* ¿Un junior encuentra el comportamiento por el **nombre de negocio**?

Si sí, extrae un caso de uso y un puerto. Si no, deja el código aburrido y cierra el ticket.

La arquitectura limpia mantiene los backends cuando protege las reglas de negocio del churn de frameworks y las hace baratas de probar. Se vuelve ceremonia cuando cada archivo es una interfaz esperando una segunda implementación que nunca llega. Usa la regla de dependencia donde el dolor es real, mantén los bordes finos y deja que los casos de uso lleven los nombres que el producto ya usa.
