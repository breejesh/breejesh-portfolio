---
title: "Clean architecture pour des backends qui restent maintenables"
description: "Couches, règle de dépendance et cas d'usage dans de vrais services backend. Ce qui paie, ce qui devient cérémonie, et quand un design plus simple est le meilleur choix."
date: "2026-06-26"
tags: [Backend et Bases de Données]
coverImage: /assets/images/clean-architecture-backends.webp
previewImage: /assets/images/clean-architecture-backends.webp
---


La plupart des réécritures de backend commencent pareil. Les règles métier vivent dans les controllers. Les controllers parlent à l'ORM. L'ORM fuit dans les tests. Six mois plus tard, changer une règle de paiement veut dire toucher les handlers HTTP, le SQL et un consumer de file que plus personne ne se rappelait. La clean architecture est un ensemble d'habitudes qui ralentissent cette dérive. Ce n'est pas une religion, et ce n'est pas gratuit.

Ce billet couvre ce qui tient sous la pression produit réelle: **couches**, **règle de dépendance**, **cas d'usage**, et une section franche sur **quand tout ça est excessif**.

---

## Le problème que vous résolvez vraiment

Un backend maintenable, c'est un service où:

1. **Les règles métier peuvent changer** sans réécrire transport et stockage.
2. **Le storage ou le HTTP peuvent changer** sans réécrire les règles métier.
3. **Vous testez des décisions** sans base de données ni framework web complet.
4. **Les nouveaux endpoints réutilisent la politique** au lieu de copier validation et effets de bord.

Si votre service est un CRUD mince sur une table, vous allez peut-être déjà bien. Si le service gère de l'argent, du stock, de la conformité, des workflows multi-étapes ou plusieurs entrées vers la même règle (API, job, outil admin), la structure commence à compter.

---

## Les couches en langage simple

Le schéma d'Uncle Bob a beaucoup d'anneaux. Dans un backend, quatre idées suffisent longtemps:

| Couche | Possède | Exemples |
| --- | --- | --- |
| **Domaine / entités** | Sens métier pur | `Order`, `Money`, `InvoiceStatus`, invariants du type "on ne livre pas une commande annulée" |
| **Cas d'usage / application** | Une action visible utilisateur ou système | `PlaceOrder`, `RefundPayment`, `ExpireSubscription` |
| **Adaptateurs d'interface** | Traduction entrée/sortie | Controllers, presenters, implémentations de repository, mappers de messages |
| **Frameworks et drivers** | Détails que vous voulez pouvoir remplacer | Express/FastAPI, Postgres, Redis, SDK Stripe, filesystem |

Pensez **politique à l'intérieur, détails à l'extérieur**. Le domaine ignore FastAPI. Un cas d'usage n'importe pas de session SQLAlchemy. Les controllers n'embarquent pas le calcul des remboursements.

Une arborescence qui mappe bien (les noms varient):

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

Vous n'avez pas besoin de ces noms exacts. Vous avez besoin d'un endroit où **règles** et **câblage** ne partagent pas le même fichier.

---

## La règle de dépendance

**Les dépendances de code source pointent vers l'intérieur.** Les couches externes connaissent les internes. Les internes n'importent jamais les externes.

Conséquences qui sortent en review:

* Le domaine n'a **pas** d'imports framework, **pas** de modèles ORM, **pas** de codes HTTP.
* Les cas d'usage dépendent de **ports** (interfaces ou types abstraits), pas de classes Postgres ou Stripe.
* Les adaptateurs implémentent ces ports et appellent les cas d'usage.
* `main` (ou votre conteneur DI) est le seul endroit qui construit le graphe complet.

```
HTTP controller  -->  PlaceOrder use case  -->  OrderRepository (port)
                              ^                        ^
                              |                        |
                         domain types          PostgresOrderRepository
```

Mauvais sens (échec fréquent):

```
PlaceOrder imports Session from ORM
PlaceOrder calls response.json(...)
Entity methods take Request objects
```

Dès que le cas d'usage dépend de la couche web, chaque nouvelle entrée (CLI, worker, GraphQL) doit simuler du HTTP. C'est comme ça que l'architecture meurt sans bruit.

### Ports et adaptateurs, pas de magie

Un **port** est une petite interface dont l'application a besoin:

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

Un **cas d'usage** orchestre objets de domaine et ports:

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

Un **adaptateur** implémente le port avec la vraie techno:

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

Le handler HTTP reste mince: parser l'entrée, appeler `placeOrder.execute`, mapper résultat ou erreurs de domaine vers des codes de statut. Le mapping vit au bord pour que le cas d'usage se teste avec des fakes.

---

## Les cas d'usage comme colonne vertébrale

Si vous ne retenez qu'une idée de la clean architecture, prenez les **cas d'usage**.

Un cas d'usage est:

* nommé d'après **ce que fait le métier** (`CancelSubscription`, pas `UpdateSubscriptionRow`)
* une **frontière de transaction** principale (ou un workflow multi-étapes avec points d'échec clairs)
* l'endroit où vivent souvent les **contrôles d'autorisation qui sont de la politique**, pas des détails de middleware framework
* l'unité que vous **unit test** le plus durement

Les controllers deviennent ennuyeux. C'est une feature. Des controllers ennuyeux veulent dire que les bugs intéressants vivent dans des opérations nommées que vous listez au tableau.

### Commande vs requête

Pas besoin de CQRS complet. Une séparation légère aide:

* **Commandes** changent l'état: `PlaceOrder`, `RefundPayment`
* **Requêtes** lisent l'état: `GetOrder`, `ListInvoicesForCustomer`

Les requêtes peuvent éviter les factories de domaine lourdes et taper un read model ou une projection SQL simple. Forcer chaque lecture par un agrégat riche est une forme courante d'excès.

### Où va la validation

| Type de contrôle | Où |
| --- | --- |
| Forme / types / champs requis | DTO ou schema du bord (Zod, Pydantic, Bean Validation) |
| Invariant métier | Entité de domaine ou domain service |
| Règles de process (qui peut, sous quel statut) | Cas d'usage |
| Limites d'infra (taille de payload) | Framework / gateway |

Ne laissez pas "le total de commande doit être positif" uniquement dans le controller. Ne mettez pas "le champ JSON doit être une string" dans l'entité.

---

## Tests: le vrai ROI

La clean architecture paie son loyer en tests.

* **Tests de domaine:** fonctions pures et entités, sans mocks.
* **Tests de cas d'usage:** fakes en mémoire pour les ports. Rapides. Déterministes.
* **Tests d'adaptateur:** moins nombreux; un vrai Postgres en CI pour les repositories, ou des contract tests pour les gateways.
* **Tests HTTP:** smoke et mapping, pas tout le jeu de règles une seconde fois.

Forme d'exemple pour un test de cas d'usage:

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

Si chaque test important démarre le framework web et une base, l'architecture ne vous protège pas encore. La règle de dépendance est ce qui rend les tests bon marché possibles.

---

## Kernels partagés, modules et plusieurs services

La clean architecture vit **dans un déployable**. Elle ne remplace pas les frontières de service.

* **Un bounded context par service** (ou gros module) garde les cas d'usage cohérents.
* Des libs de "domaine dieu" partagées entre microservices finissent souvent en monolithe distribué de types.
* Préférez **shared nothing** ou **événements versionnés** à importer les entités des autres.

Dans un modular monolith, traitez les packages comme des services: n'appelez un autre module que par son API applicative, pas en fouillant ses tables.

---

## Quand c'est excessif

Choisissez le design plus simple quand la plupart de ces points sont vrais:

1. **Un développeur**, durée de vie courte, ou un prototype qui peut mourir le trimestre prochain.
2. Travail en forme de **CRUD**: lister, lire, mettre à jour des colonnes, presque pas de règles multi-étapes.
3. **Une base**, une API HTTP, pas de second consommateur des mêmes règles.
4. L'équipe **se bat plus contre l'arborescence** que contre le produit.
5. Vous inventez des interfaces pour des choses que vous **ne remplacerez jamais** et ne fakez jamais en tests.

Signes que vous êtes allés trop loin:

* Cinq interfaces pour une table Postgres utilisée à un seul endroit
* Des mappers qui mappent des mappers de DTOs identiques
* Des fichiers de cas d'usage qui appellent juste un repository sans logique de domaine
* Les nouveaux passent une semaine à apprendre "l'architecture" avant de livrer un champ

Un juste milieu que beaucoup d'équipes utilisent:

| Situation | Layout |
| --- | --- |
| Outil interne, API mince | Routes + fonctions service + SQL |
| Service produit qui grandit | Controllers, application services, repositories, domaine là où les règles se regroupent |
| Argent / conformité / workflows multi-entrées | Ports complets, cas d'usage, entités de domaine |

Commencez en **vertical**. Extrayez un cas d'usage quand une seconde entrée apparaît, ou quand une règle est dure à tester via HTTP. N'échafaudez pas vingt couches vides le jour un d'une todo app.

---

## Règles pratiques qui survivent à la review

1. **Domaine et cas d'usage sans imports de framework.** Grep en CI si besoin.
2. **Une classe (ou fonction) de cas d'usage par action métier** qui mute un état important.
3. **Ports petits**, propriété du côté application, implémentés par les adaptateurs.
4. **Le composition root câble tout.** Les controllers ne font pas `new` d'infra au fond du handler si on peut l'éviter.
5. **Erreurs nommées métier** (`InsufficientStock`, `SubscriptionInactive`). Mappez vers HTTP une fois au bord.
6. **Les lectures peuvent être plus simples que les écritures.** Ne forcez pas chaque GET par un agrégat riche.
7. **Renommez sans pitié.** Un `OrderService` qui fait quinze choses n'est pas une couche de cas d'usage; c'est un tiroir fourre-tout.
8. **Documentez la règle de dépendance** dans le README en cinq lignes. Les longs wikis d'architecture pourrissent.

Esquisse minimale de composition root:

```typescript
// main/server.ts
const pool = new Pool(env.DATABASE_URL);
const orders = new PostgresOrderRepository(pool);
const payments = new StripePaymentGateway(env.STRIPE_KEY);
const placeOrder = new PlaceOrder(orders, payments, systemClock);

app.post("/orders", httpPlaceOrder(placeOrder));
```

Le câblage a le droit d'être moche. Le code métier ne devrait pas l'être.

---

## Comment ça se présente dans les stacks courants

Vous pouvez appliquer les mêmes idées sans adopter un framework nommé "clean":

* **Node / TypeScript:** cas d'usage en classes ou fonctions; ports en interfaces; Prisma/TypeORM dans les adaptateurs; Zod au bord HTTP.
* **Python:** cas d'usage en callables ou classes; `Protocol` pour les ports; les modèles SQLAlchemy ne doublent pas comme entités de domaine si le modèle est sale; Pydantic pour les DTOs de request.
* **Java / Kotlin:** package-by-feature ou modules hexagonaux; Spring aux bords (`@RestController`, impls `@Repository`); jars de domaine sans annotations Spring si vous voulez des unit tests purs.
* **Go:** interfaces définies près du consommateur (package du cas d'usage); structs Postgres concrets dans `internal/postgres`; `cmd` câble.

La marque sur le blog compte moins que **qui dépend de qui**.

---

## Mini checklist de décision

Avant d'ajouter une autre couche, demandez:

* Cette règle sera-t-elle atteinte depuis **plus d'un** transport?
* La règle est-elle **difficile à tester** si elle reste dans le controller?
* Sommes-nous sur le point de **dupliquer** cette validation dans un worker?
* Un junior retrouve-t-il le comportement par le **nom métier**?

Si oui, extrayez un cas d'usage et un port. Sinon, laissez le code ennuyeux et fermez le ticket.

La clean architecture garde les backends maintenables quand elle protège les règles métier du churn de frameworks et les rend bon marché à tester. Elle devient cérémonie quand chaque fichier est une interface qui attend une seconde implémentation qui n'arrive jamais. Utilisez la règle de dépendance là où la douleur est réelle, gardez les bords minces, et laissez les cas d'usage porter les noms que le produit utilise déjà.

