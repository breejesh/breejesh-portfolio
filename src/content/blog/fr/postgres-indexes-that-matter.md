---
title: "Index PostgreSQL qui comptent: B-tree, partiels, composites, covering"
description: "Quels index Postgres baissent vraiment la latence: B-tree par défaut, filtres partiels, ordre des colonnes composites, INCLUDE covering, et quand un index vous freine."
date: "2026-07-16"
tags: [Backend et Bases de Données]
coverImage: /assets/images/postgres-indexes-that-matter.webp
previewImage: /assets/images/postgres-indexes-that-matter.webp
---

Les index sont le levier de performance le moins cher que beaucoup d'équipes utilisent encore mal. Ajoutez-en dix et les écritures rampent. Oubliez le bon et un rapport hebdo bloque le primaire pendant des minutes. Postgres ne vous sauve pas d'une mauvaise forme. Il récompense une bonne.

Ce billet est la liste courte que j'utilise sur des apps réelles: B-tree par défaut, index partiels pour les prédicats chauds, ordre des colonnes en composite, covering avec `INCLUDE`, et les cas où un index empire les choses. Pas de catalogue de toutes les méthodes d'accès. Seulement ceux qui reviennent dans `EXPLAIN (ANALYZE, BUFFERS)`.

---

## Modèle mental: toucher moins de pages heap

Un sequential scan lit la table. Un index scan parcourt une structure plus petite, puis (en général) va chercher les tuples dans le heap. Le gain, c'est **l'I/O et le CPU sur des lignes que vous ne touchez pas**.

Règles approximatives qui tiennent en production:

* Égalité et plage sur une colonne sélective: B-tree est le défaut, et c'est bien.
* Faible sélectivité (`status = 'active'` sur 90% des lignes): le planner peut ignorer l'index et scanner le heap. C'est souvent correct.
* Le coût d'un index se paie à chaque `INSERT`, `UPDATE` et `DELETE` qui touche les colonnes indexées.
* Les index gonflés ou inutilisés coûtent encore du WAL, du vacuum et du cache.

Si vous ne retenez qu'une phrase: *indexez la forme de requête que vous lancez souvent, pas chaque colonne qui apparaît dans un `WHERE`.*

---

## Schéma d'exemple

```sql
CREATE TABLE orders (
  id           bigserial PRIMARY KEY,
  customer_id  bigint NOT NULL,
  status       text NOT NULL,          -- 'pending', 'paid', 'shipped', 'cancelled'
  region       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  total_cents  integer NOT NULL,
  metadata     jsonb
);

-- Assume millions of rows, heavy reads on recent paid orders by customer.
```

Les primary keys et les contraintes unique créent déjà des index B-tree. Commencez là avant d'en inventer d'autres.

---

## B-tree: le défaut qui gagne le plus souvent

`CREATE INDEX` sans `USING` construit un **B-tree**. Il gère `=`, `<`, `<=`, `>`, `>=`, `BETWEEN` et `IN` sur la ou les colonnes de tête. Il gère aussi un `ORDER BY` qui suit l'ordre de l'index, ce qui évite un sort.

```sql
CREATE INDEX orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

Requête qui l'utilise proprement:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

Vous voulez quelque chose comme `Index Scan using orders_customer_created_idx` (ou un bitmap index scan sur de plus gros ensembles), pas un seq scan plus un sort.

**Pièges:**

* Colonne de tête d'abord. Un filtre uniquement sur `created_at` n'utilisera pas bien cet index (ou pas du tout).
* Des fonctions sur la colonne cassent le match sauf si vous indexez l'expression:

```sql
-- Bad for a plain index on email
WHERE lower(email) = 'a@b.com'

-- Index the expression you filter on
CREATE INDEX users_email_lower_idx ON users (lower(email));
```

* `LIKE 'foo%'` peut utiliser un B-tree texte. `LIKE '%foo%'` non. Pour une sous-chaîne, il faut `pg_trgm` (ou un autre design).

B-tree n'est pas exotique. C'est le cheval de trait. Réglez l'ordre des colonnes et la sélectivité avant de courir après GIN ou BRIN.

---

## Index partiels: n'indexer que les lignes interrogées

Un index partiel ne stocke des entrées que pour les lignes qui matchent un `WHERE`. Index plus petit, mises à jour plus légères sur le reste de la table, et forme idéale pour les requêtes sur un "sous-ensemble chaud".

```sql
-- Only open work needs fast lookup
CREATE INDEX orders_pending_region_idx
  ON orders (region, created_at)
  WHERE status = 'pending';
```

```sql
SELECT id, customer_id, created_at
FROM orders
WHERE status = 'pending'
  AND region = 'eu-west'
ORDER BY created_at
LIMIT 50;
```

Postgres peut utiliser l'index partiel quand le prédicat de la requête **implique** le prédicat de l'index. Si vous retirez `status = 'pending'` de la query, cet index est hors jeu.

**Bons candidats partiels:**

* Tables en soft-delete: `WHERE deleted_at IS NULL`
* Lignes de file / outbox: `WHERE processed_at IS NULL`
* Flags actifs multi-tenant, foreign keys non nulles que vous filtrez toujours
* Valeurs de status rares qui alimentent des dashboards ops

**Mauvais candidats partiels:**

* Prédicats qui changent à chaque requête (`created_at > now() - interval '1 day'` est maladroit en partiel statique sauf redesign)
* Filtres qui matchent presque toute la table (vous réduisez à peine l'index)

Les partiels aident aussi l'unicité sur un sous-ensemble:

```sql
CREATE UNIQUE INDEX users_active_email_uidx
  ON users (email)
  WHERE deleted_at IS NULL;
```

Plusieurs lignes soft-deleted peuvent partager un email. Une seule ligne vivante le peut.

---

## Index composites: l'ordre des colonnes est le produit

`(a, b, c)` n'est pas `(b, a, c)`. Un B-tree composite est ordonné de gauche à droite. Voyez-le comme des clés de tri imbriquées.

**Règle du préfixe gauche (version pratique):**

| Filtres de la query | Index `(customer_id, status, created_at)` |
| --- | --- |
| `customer_id = ?` | Oui |
| `customer_id = ? AND status = ?` | Oui |
| `customer_id = ? AND status = ? ORDER BY created_at` | Oui |
| `status = ?` seul | Non (mauvaise colonne de tête) |
| `created_at > ?` seul | Non |

Égalité d'abord, puis plage, puis clé de tri, est un motif courant:

```sql
-- Filter equality, then range on time
CREATE INDEX orders_status_created_idx
  ON orders (status, created_at);
```

```sql
SELECT id, customer_id
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-01-01'
  AND created_at <  '2026-02-01';
```

Si vous mettez `created_at` en premier, l'égalité seule sur `status` est faible. Si presque toutes les requêtes sont "par client, puis le temps", mettez `customer_id` en premier.

**Unicité multi-colonnes**, même structure:

```sql
CREATE UNIQUE INDEX orders_idempotency_uidx
  ON orders (customer_id, idempotency_key);
```

Ne créez pas à la fois `(a, b)` et `(a)` sauf besoin mesuré. L'index plus long sert souvent le préfixe plus court. Les index en trop sont du coût d'écriture pur.

---

## Covering indexes: répondre depuis l'index seul

Une recherche d'index normale visite encore le heap pour les colonnes non indexées. Un scan **covering** (index-only) renvoie la ligne depuis l'index quand toutes les colonnes nécessaires y sont et que le visibility map dit que la page est all-visible.

Postgres 11+ permet d'ajouter des colonnes non-clé avec `INCLUDE`. Elles sont stockées dans la feuille mais ne participent ni à l'ordre de tri ni au contrôle d'unicité:

```sql
CREATE INDEX orders_customer_covering_idx
  ON orders (customer_id, created_at DESC)
  INCLUDE (total_cents, status);
```

```sql
SELECT total_cents, status, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

Avec un cache chaud et une table bien vacuumed, `EXPLAIN` peut montrer `Index Only Scan`. C'est le prix: moins de hits heap.

**Quand le covering aide:**

* Chemins de lecture chauds qui sélectionnent toujours les mêmes quelques colonnes
* Endpoints de liste (`id`, `status`, `created_at`) des milliers de fois par minute

**Quand le sauter:**

* Listes `INCLUDE` larges qui gonflent l'index au-delà du gain heap
* Colonnes mises à jour sans arrêt (`status` qui bascule chaque seconde) forcent des updates d'index même si la clé n'a pas bougé
* Vous n'avez pas confirmé avec `EXPLAIN (ANALYZE, BUFFERS)` que les heap fetches sont le goulot

`INCLUDE` n'est pas magique. Le vacuum doit tenir le visibility map à jour, sinon vous retombez sur des checks heap.

---

## Quand les index font mal

Les index ne sont pas gratuits. Ils font mal de façons prévisibles.

### 1. Amplification d'écriture

Chaque changement de colonne indexée met à jour chaque index concerné. Les bulk loads avec dix index secondaires peuvent être plusieurs fois plus lents que charger puis indexer:

```sql
-- Load path for big migrations
ALTER TABLE orders DROP CONSTRAINT ...;  -- if needed
-- or: DROP INDEX concurrently on standbys carefully in prod

COPY orders FROM '...';

CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

Préférez `CREATE INDEX CONCURRENTLY` (et `DROP INDEX CONCURRENTLY`) en production pour ne pas bloquer les écritures pendant toute la construction. C'est plus long et plus gourmand, mais ça ne bloque pas le DML comme un `CREATE INDEX` simple.

### 2. Index peu sélectifs que le planner ignore

```sql
CREATE INDEX orders_status_idx ON orders (status);
-- if 80% of rows are 'paid', this rarely helps WHERE status = 'paid'
```

Vous payez quand même la maintenance. Vérifiez:

```sql
SELECT indexrelid::regclass AS index,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relid = 'orders'::regclass
ORDER BY idx_scan;
```

Presque zéro `idx_scan` après des semaines de vrai trafic: candidat à la suppression (après avoir confirmé que les réplicas et jobs ponctuels n'en ont pas besoin).

### 3. Mauvais ordre et piles redondantes

Trois index sur des préfixes qui se chevauchent:

```sql
-- Often redundant
CREATE INDEX ON orders (customer_id);
CREATE INDEX ON orders (customer_id, status);
CREATE INDEX ON orders (customer_id, status, created_at);
```

Gardez celui qui colle à vos vraies requêtes. Mesurez avant de supprimer; certains ORM génèrent des formes surprenantes.

### 4. Écritures aléatoires et pression cache

De gros index concurrencent le heap pour `shared_buffers`. Si le working set ne tient plus, vous échangez des lectures heap séquentielles contre de l'I/O aléatoire index + heap. Un seq scan sur une table moyenne froide peut battre une nested loop de lookups aléatoires.

### 5. Sur-indexer JSONB et expressions

GIN sur chaque colonne `jsonb` "au cas où" est un classique tueur d'écritures. Indexez les chemins que vous filtrez:

```sql
CREATE INDEX orders_meta_provider_idx
  ON orders ((metadata->>'provider'));
```

Ou un partiel + expression quand seules certaines lignes comptent.

---

## Checklist pratique avant d'ajouter un index

1. Capturez la requête lente avec `EXPLAIN (ANALYZE, BUFFERS)` (et `auto_explain` en staging si possible).
2. Nommez les colonnes de filtre, clés de jointure et la forme `ORDER BY` / `LIMIT`.
3. Préférez un composite (et optionnellement `INCLUDE`) à plein d'index mono-colonne.
4. Utilisez un partiel quand un prédicat stable définit un petit sous-ensemble chaud.
5. Créez avec `CONCURRENTLY` sur les systèmes live.
6. Revérifiez le plan après deploy. Surveillez `pg_stat_user_indexes` et la latence d'écriture quelques jours.
7. Supprimez ce qui ne scanne jamais. Documentez pourquoi les gardiens existent en un commentaire d'une ligne dans les migrations.

```sql
-- Migration comment example:
-- Serves GET /v1/customers/:id/orders?limit=20 (customer_id + created_at DESC)
CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

---

## À apprendre ensuite (hors scope ici)

* **BRIN** pour d'énormes séries temporelles append-only avec ordre physique corrélé
* **GIN** pour full-text, arrays et containment jsonb
* **Hash** indexes (usage limité face au B-tree égalité seule)
* **Index d'extensions** (`pg_trgm`, PostGIS)

Ce sont les bons outils quand B-tree et partiel/covering ne suffisent plus. La plupart des douleurs OLTP meurent avec les motifs ci-dessus.

---

## En bref

Commencez par un B-tree sur les clés que vous filtrez et triez. Égalité à gauche, plages et tri ensuite. Réduisez avec des partiels quand seul un sous-ensemble compte. Couvrez les listes de lecture chaudes avec `INCLUDE` quand les heap fetches apparaissent dans les buffers. Supprimez les index qui ne scannent jamais, et n'ajoutez pas cinq index mono-colonne quand un composite colle à la requête.

Si un changement n'apparaît pas dans `EXPLAIN (ANALYZE, BUFFERS)` sur des données réalistes, ce n'est pas encore une victoire d'index. C'est une hypothèse.
