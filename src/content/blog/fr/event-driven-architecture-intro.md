---
title: "Architecture event-driven pour le backend : événements, brokers, idempotence, outbox"
description: "Intro pratique aux systèmes event-driven : événements vs commandes, choix de brokers, idempotence des consommateurs, outbox transactionnelle, et quand le request/response reste le meilleur choix."
date: "2026-07-11"
tags: [Backend, Cloud]
coverImage: /assets/images/event-driven-architecture-intro.webp
previewImage: /assets/images/event-driven-architecture-intro.webp
---

Le request/response synchrone est simple à raisonner. Le service A appelle le service B, attend, obtient une réponse ou une erreur. Ce modèle casse quand une action doit se propager vers plusieurs systèmes indépendants, quand ils scalent à des rythmes différents, ou quand une panne temporaire d'une dépendance ne doit pas bloquer tout le checkout.

L'**architecture event-driven** change le contrat : un producteur publie un fait sur quelque chose qui s'est déjà produit, et les consommateurs réagissent à leur rythme. Vous gagnez du découplage et de la scalabilité horizontale. Vous payez en cohérence éventuelle, en debug plus dur, et en modes de panne qui ne tiennent pas dans une seule stack trace.

Ce billet est une carte pour ingénieurs backend sur des systèmes à forte charge : la séparation événement/commande, les brokers, les consommateurs idempotents, le pattern outbox, et les cas où les événements sont le mauvais outil.

---

## Ce que « event-driven » veut vraiment dire

Dans un design event-driven, les composants communiquent en **émettant et en réagissant à des événements**, en général via un **message broker** ou un log. Les producteurs ne savent pas qui consomme. Les consommateurs ne rappellent pas le producteur pour le même fait. Le couplage passe de « je dois connaître ton API et être en ligne quand je t'appelle » à « nous devons nous entendre sur un schéma de message et sur la reprise quand la livraison est en retard ou dupliquée. »

Formes typiques sous forte charge :

| Forme | Exemple | Pourquoi les événements aident |
| --- | --- | --- |
| Fan-out après un write | Commande passée → stock, email, analytics, fidélité | Un write, beaucoup d'effets de bord indépendants |
| Handoff asynchrone | Upload terminé → antivirus → miniature → index de recherche | Le travail lent quitte le chemin de la requête |
| Intégration | Webhook de paiement → ledger + notification | Les systèmes externes arrivent à leur rythme |
| Stream processing | Click stream → score fraude → feature store | Continu, haut volume, peu de travail par item |

Les événements ne veulent **pas** dire « remplace chaque API HTTP par une file. » La plupart des systèmes restent hybrides : synchrone pour les lectures/écritures utilisateur qui demandent une réponse immédiate, asynchrone pour le travail qui peut finir plus tard.

---

## Événements vs commandes

Les gens mélangent les deux. Ce sont des contrats différents.

### Événement : un fait déjà survenu

Un **événement** est au passé et immuable une fois publié. Le producteur a déjà validé un changement d'état (ou au moins décidé que le fait est vrai). Les consommateurs peuvent :

- mettre à jour leurs propres modèles
- déclencher des workflows
- ignorer l'événement s'il ne les concerne pas

Exemples :

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

Le nom reste au passé : `OrderPlaced`, `PaymentCaptured`, `UserEmailChanged`. Le payload doit porter assez de données pour que les consommateurs agissent sans rappeler le producteur pour chaque champ (avec bon sens). Des événements trop fins, avec seulement un id, forcent chaque consommateur dans un chemin de lecture bavard sous charge.

### Commande : une instruction à exécuter

Une **commande** est impérative. Un émetteur veut qu'un récepteur précis fasse une action. Elle peut être acceptée, rejetée ou échouer. Le résultat n'est pas encore un fait.

Exemples : `PlaceOrder`, `ChargeCard`, `ReserveInventory`.

Les commandes voyagent souvent sur des files avec un seul groupe de consommateurs logique (ou un type de worker connu). Les événements vont souvent sur des topics avec beaucoup d'abonnés indépendants.

| | Événement | Commande |
| --- | --- | --- |
| Temps | Passé (`OrderPlaced`) | Impératif (`PlaceOrder`) |
| Propriétaire du résultat | Déjà décidé par le producteur | Décidé par le handler |
| Couplage | Le producteur ignore les consommateurs | L'émetteur cible une responsabilité |
| Fan-out | Naturel (beaucoup d'abonnés) | En général un type de handler |
| Échec | Chaque consommateur retente son travail | La commande peut être rejetée ou compensée |

En pratique, un handler de commande qui réussit **émet souvent un événement**. `PlaceOrder` OK → publication de `OrderPlaced`. Cette séparation garde l'intention d'écriture et la diffusion du fait distinctes.

---

## Brokers et logs : ce que vous achetez vraiment

Le broker (ou log) est l'infrastructure partagée entre producteurs et consommateurs. Le produit compte moins que la sémantique de livraison pour laquelle vous concevez.

### Options courantes (modèle mental, pas un match)

| Système | Modèle | Bon défaut pour |
| --- | --- | --- |
| **Kafka / Redpanda** | Log append-only, offsets consommateur, partitions | Haut débit, replay, beaucoup de consumer groups |
| **RabbitMQ** | Files, exchanges, routing keys | Work queues, routage complexe, volume plus bas |
| **SQS (+ SNS)** | Files managées / fan-out | Workers natifs AWS, ops simples |
| **NATS / JetStream** | Messaging léger + persistance optionnelle | Faible latence, topologies plus simples |
| **Google Pub/Sub** | Topics/abonnements managés | Fan-out d'événements natif GCP |

### Garanties de livraison avec lesquelles vous vivrez

Presque tous les brokers de production donnent de l'**at-least-once** sur les chemins d'échec qui comptent. Un consommateur peut crasher après traitement mais avant l'ack. Le même message revient.

Concevez pour :

1. **At-least-once** comme base.
2. **Consommateurs idempotents** (section suivante).
3. **Ordre** seulement là où c'est nécessaire (souvent par clé d'agrégat, ex. `orderId`), pas un ordre global du système entier.
4. **Rétention / replay** si vous devez reconstruire un consommateur ou vous remettre d'un bug.

Le marketing « exactly-once » est en général une combinaison soignée de producteurs transactionnels, de consommateurs idempotents et de fonctionnalités broker. Traitez-le comme une propriété du **pipeline entier**, pas une case à cocher sur une fiche produit.

### Topics, partitions et clés

Pour les systèmes basés sur un log :

- Placez les événements qui doivent rester ordonnés pour une entité sur la **même partition key** (ex. `orderId`).
- Gardez les partitions équilibrées. Une clé chaude devient une partition chaude.
- Séparez les **topics d'intégration publics** (schémas stables) des topics **internes** que vous pouvez casser plus librement.

Pour les systèmes basés sur des files :

- Préférez des **competing consumers** sur une work queue pour paralléliser.
- Utilisez des **dead-letter queues (DLQ)** pour les messages poison après N échecs.
- Limitez la concurrence pour qu'un pic ne fasse pas fondre la base derrière les workers.

---

## Idempotence : les consommateurs verront des doublons

Si vous ne retenez qu'une règle opérationnelle : **chaque consommateur doit tolérer le même événement deux fois**.

Les doublons apparaissent quand :

- le broker relivre après un crash ou un blip réseau
- un producteur retente un publish qui a en fait réussi
- vous rejouez une partition après un correctif
- l'at-least-once rencontre un ack lent

### Patterns pratiques

**1. Clé d'idempotence stockée avant les effets de bord**

Utilisez un id stable du message (`eventId`, ou une clé naturelle comme `paymentId + status`). Dans la même transaction base que votre write :

```sql
INSERT INTO processed_events (event_id, consumer, processed_at)
VALUES ($1, 'inventory-service', now())
ON CONFLICT (event_id, consumer) DO NOTHING;
-- if insert did nothing, skip business work
```

Si l'insert gagne, appliquez le changement métier dans la même transaction. S'il perd, vous avez déjà traité cet événement.

**2. Idempotence naturelle dans le domaine**

Certains writes sont sûrs à répéter par nature :

- `SET status = 'shipped' WHERE order_id = $1 AND status = 'paid'`
- Upsert par primary key avec le même payload
- « Ajoute l'item s'il manque » plutôt que « toujours incrémenter »

Préférez les checks de domaine quand ils collent. Ils se lisent mieux qu'une énorme table latérale pour chaque micro-update.

**3. Effets de bord sortants (email, webhooks, charges)**

Les API externes sont la partie dure. Un second envoi peut double-facturer ou spammer un utilisateur.

- Passez un **client request id** / clé d'idempotence aux fournisseurs qui le supportent (les API de paiement le font souvent).
- Enregistrez « notification déjà envoyée pour cet événement » avant ou après l'appel, avec une règle claire pour les pannes partielles.
- Préférez des tables « envoyer une fois » au fire-and-forget dans la boucle du consommateur.

### Ce qu'il ne faut pas faire

Ne vous fiez pas à « le broker a dit exactly once. » N'utilisez pas seulement des sets en mémoire « j'ai déjà vu ça » sur un consommateur multi-instances. Ne traitez pas l'ordre des messages comme un substitut d'idempotence ; réordonnancement et relivraison arrivent sous charge.

---

## Le problème dual-write et l'outbox

Voici l'échec classique :

```
1. BEGIN; INSERT order; COMMIT;
2. publish OrderPlaced to broker
```

Si l'étape 2 échoue après le commit, la commande existe et aucun consommateur n'en entend parler. Si vous inversez l'ordre et que le write DB échoue après le publish, les consommateurs traitent une commande fantôme.

Publier dans la même transaction DB n'est pas disponible sur la plupart des brokers. Deux systèmes indépendants ne partagent pas un commit atomique sans aide.

### Outbox transactionnelle

Écrivez la ligne métier **et** une ligne outbox dans la **même transaction base de données**. Un processus séparé (ou le CDC) publie les lignes outbox vers le broker, puis les marque envoyées.

```sql
BEGIN;

INSERT INTO orders (id, customer_id, total_cents, status)
VALUES ($1, $2, $3, 'placed');

INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload, created_at)
VALUES ($4, 'order', $1, 'OrderPlaced', $5::jsonb, now());

COMMIT;
```

Boucle du relay (simplifiée) :

```
1. SELECT pending outbox rows (FOR UPDATE SKIP LOCKED)
2. publish to broker
3. mark published_at (or delete)
```

Propriétés souhaitées :

| Préoccupation | Approche |
| --- | --- |
| Atomicité état + intention de publier | Même transaction DB |
| Pas d'événements perdus après commit | Le relay retente jusqu'au succès du publish |
| Pas de lignes bloquées sous concurrence | `SKIP LOCKED`, tailles de batch limitées |
| Publish dupliqué encore possible | Les consommateurs restent idempotents |
| Observabilité | Métriques de lag outbox, âge du plus ancien non envoyé |

### CDC comme variante d'outbox

Le Change Data Capture (Debezium et compagnie) lit le log de la base et transforme les changements de lignes en événements. Même idée : la source de vérité est le commit log, pas un publish best-effort de l'app après le commit. Vous concevez toujours schémas, filtres et idempotence des consommateurs.

### Inbox (miroir optionnel)

Certaines équipes utilisent aussi une table **inbox** côté consommateur comme stockage durable de « j'ai reçu l'événement X », puis traitent depuis là. Même thème : rendre le marqueur « traité » transactionnel avec le write de domaine.

---

## Pannes, retries et messages poison

Les systèmes à forte charge échouent de façon partielle. Concevez la boucle du consommateur comme si chaque dépendance pouvait timeout.

1. **Retry avec backoff** pour les erreurs transitoires (lock DB, blip réseau). Plafonnez les tentatives.
2. **DLQ** après N échecs pour qu'un mauvais payload ne bloque pas la partition ou la file pour toujours.
3. **Alertez sur la profondeur DLQ et le lag outbox.** Un lag silencieux est pire qu'une panne bruyante.
4. **Gardez les handlers courts.** Des handlers longs augmentent la chance de relivraison en vol.
5. **Séparez « traiter l'événement » de « appeler un tiers fragile »** quand vous pouvez : traitez vite, enfilez un job dédié pour l'appel fragile.

Sur des logs style Kafka, un consommateur bloqué sur un message poison peut stopper toute la partition. C'est pourquoi la DLQ (ou skip-and-metric avec prudence) n'est pas optionnelle à l'échelle.

---

## Schéma et évolution

Du JSON lâche sans contrat devient une douleur de production après le troisième consommateur.

Règles pratiques :

- Versionnez le **type d'événement** ou le schéma (`OrderPlaced.v1`, ou un champ `schemaVersion`).
- Préférez les changements **additifs** : nouveaux champs optionnels. Évitez de renommer ou de réutiliser des champs.
- Utilisez un registry (Avro/Protobuf/JSON Schema) quand beaucoup d'équipes partagent des topics.
- Documentez quels champs sont **requis pour la correction** vs une dénormalisation de confort.
- Ne mettez pas de secrets dans les payloads d'événements. Les événements sont souvent retenus et lisibles dans l'org.

Quand un breaking change est inévitable, faites du dual-publish un moment ou créez un nouveau topic et migrez les consommateurs volontairement.

---

## Quand ne pas utiliser un design event-driven

Les événements sont un compromis, pas une promotion. Évitez-les ou limitez-les quand :

| Situation | Préférez plutôt |
| --- | --- |
| L'utilisateur a besoin d'une réponse immédiate et correcte dans la même requête | API synchrone + transaction DB |
| Une équipe possède un seul déployable et il n'y a pas de fan-out | Appels in-process ou monolithe modulaire |
| Une cohérence forte entre plusieurs agrégats est requise en un clic | Une seule frontière de transaction, ou des sagas seulement si vous acceptez la complexité |
| L'équipe n'a pas d'ops pour brokers, métriques de lag, DLQ, revue de schéma | Architecture plus simple jusqu'à pouvoir opérer la plomberie |
| Le debug est fragile et le trafic est bas | Le request/response est plus facile à tracer de bout en bout |
| Vous n'avez besoin que d'un rapport nocturne | Job batch, pas un topic temps réel |

Évitez aussi le **« monolithe distribué sur Kafka »** : chaque service a encore besoin des événements de tous les autres pour terminer une seule action utilisateur, sans ownership clair. Vous avez les modes de panne des systèmes distribués sans les bénéfices d'isolation.

Un test utile : si perdre le broker 10 minutes rend le **produit core inutilisable** plutôt que de retarder seulement les effets de bord, vous avez peut-être mis de la logique de chemin critique sur le mauvais transport.

---

## Checklist minimale de production

Avant d'expédier un chemin d'événements sur un flux à forte charge :

1. **Événement vs commande** est nommé et possédé correctement.
2. Le **schéma** est documenté ; les consommateurs connaissent les champs requis.
3. Le **producteur** utilise outbox (ou CDC), pas l'espoir du dual-write.
4. Le **consommateur** est idempotent face à l'at-least-once.
5. L'**ordre** est défini par clé s'il compte ; pas supposé global.
6. **Retries + DLQ + alertes de lag** existent et sont testés.
7. **Backpressure** : consommateurs et pools DB ne fondent pas sous un replay ou un pic de trafic.
8. **Vous savez rejouer** une journée d'événements après un bug sans double-facturer les utilisateurs.

---

## Pour finir

L'architecture event-driven mérite sa place quand des systèmes indépendants doivent réagir aux mêmes faits à des vitesses différentes, et quand les chemins de requête ne peuvent pas attendre chaque effet de bord. Le coût d'ingénierie est réel : brokers, schémas, idempotence, outboxes et suivi du lag font partie de la feature, pas des extras.

Commencez avec un fait clair (`OrderPlaced`), une outbox, un consommateur idempotent et des métriques de lag. Élargissez seulement quand le prochain fan-out fait plus mal en appel synchrone qu'en abonné supplémentaire. Cette séquence garde les systèmes à forte charge flexibles sans transformer chaque write en mystère distribué.
