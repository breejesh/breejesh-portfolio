---
title: "PostgreSQL Indexes That Matter: B-tree, Partial, Composite, Covering"
description: "Which Postgres indexes actually move latency: B-tree defaults, partial filters, composite column order, covering INCLUDE, and when indexes slow you down."
date: "2026-07-16"
tags: [Backend & Databases]
coverImage: /assets/images/postgres-indexes-that-matter.webp
previewImage: /assets/images/postgres-indexes-that-matter.webp
---

Indexes represent the highest-impact performance optimization in database management. Applying them strategically accelerates queries; misusing them degrades write throughput. Add ten of them and writes crawl. Skip the right one and a weekly report locks the primary for minutes. Postgres will not save you from a bad shape. It will reward a good one.

This post is the short list I reach for on real apps: default B-tree, partial indexes for hot predicates, composite column order, covering indexes with `INCLUDE`, and the cases where an index makes things worse. No catalog tour of every access method. Just the ones that keep showing up in `EXPLAIN (ANALYZE, BUFFERS)`.

---

## The mental model: find fewer heap pages

A sequential scan reads the table. An index scan walks a smaller structure, then (usually) fetches matching heap tuples. The win is **I/O and CPU on rows you never touch**.

Rough rules that hold in production:

* Equality and range on a selective column: B-tree is the default, and it is good.
* Low selectivity (`status = 'active'` on 90% of rows): the planner may ignore the index and scan the heap. That is often correct.
* The cost of an index is paid on every `INSERT`, `UPDATE`, and `DELETE` that touches the indexed columns.
* Bloated or unused indexes still cost WAL, vacuum, and cache space.

If you remember one sentence: *index for the query shape you run often, not for every column that appears in a `WHERE`.*

---

## Sample schema

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

Primary keys and unique constraints already create B-tree indexes. Start there before inventing more.

---

## B-tree: the default that usually wins

`CREATE INDEX` without `USING` builds a **B-tree**. It supports `=`, `<`, `<=`, `>`, `>=`, `BETWEEN`, and `IN` on the leading column(s). It also supports `ORDER BY` that matches the index order, which avoids a sort.

```sql
CREATE INDEX orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

Query that uses it cleanly:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

You want something like `Index Scan using orders_customer_created_idx` (or a bitmap index scan on larger sets), not a seq scan plus a sort.

**Gotchas:**

* Leading column first. A filter only on `created_at` will not use this index well (or at all).
* Functions on the column break the match unless you index the expression:

```sql
-- Bad for a plain index on email
WHERE lower(email) = 'a@b.com'

-- Index the expression you filter on
CREATE INDEX users_email_lower_idx ON users (lower(email));
```

* `LIKE 'foo%'` can use a B-tree text index. `LIKE '%foo%'` cannot. For substring search you need `pg_trgm` (or a different design).

B-tree is not exotic. It is the workhorse. Get column order and selectivity right before chasing GIN or BRIN.

---

## Partial indexes: index only the rows you query

A partial index stores entries only for rows matching a `WHERE` clause. Smaller index, faster updates on the rest of the table, and a perfect fit for "hot subset" queries.

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

Postgres can use the partial index when the query's predicate **implies** the index predicate. If you drop `status = 'pending'` from the query, this index is out.

**Good partial candidates:**

* Soft-delete tables: `WHERE deleted_at IS NULL`
* Queue / outbox rows: `WHERE processed_at IS NULL`
* Multi-tenant active flags, non-null foreign keys you always filter on
* Rare status values that drive operational dashboards

**Bad partial candidates:**

* Predicates that change every query (`created_at > now() - interval '1 day'` is awkward as a static partial unless you redesign)
* Filters that match most of the table (you barely shrink the index)

Partial indexes also help uniqueness on a subset:

```sql
CREATE UNIQUE INDEX users_active_email_uidx
  ON users (email)
  WHERE deleted_at IS NULL;
```

Multiple soft-deleted rows can share an email. Only one live row can.

---

## Composite indexes: column order is the product

`(a, b, c)` is not the same as `(b, a, c)`. A B-tree composite is ordered left to right. Think of it as nested sort keys.

**Leftmost prefix rule (practical version):**

| Query filters | Index `(customer_id, status, created_at)` |
| --- | --- |
| `customer_id = ?` | Yes |
| `customer_id = ? AND status = ?` | Yes |
| `customer_id = ? AND status = ? ORDER BY created_at` | Yes |
| `status = ?` only | No (wrong leading column) |
| `created_at > ?` only | No |

Equality columns first, then range, then the sort key, is a common pattern:

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

If you put `created_at` first, equality on `status` alone is weak. If almost every query is "by customer, then time," put `customer_id` first.

**Multicolumn uniqueness** is the same structure:

```sql
CREATE UNIQUE INDEX orders_idempotency_uidx
  ON orders (customer_id, idempotency_key);
```

Do not create both `(a, b)` and `(a)` unless you have measured a real need. The longer index often serves the shorter prefix. Extra indexes are pure write cost.

---

## Covering indexes: answer from the index alone

A normal index lookup still visits the heap for non-indexed columns. A **covering** (or index-only) scan returns the row from the index when every needed column is present and the visibility map says the page is all-visible.

Postgres 11+ lets you add non-key columns with `INCLUDE`. They are stored in the leaf but not part of the sort order or uniqueness check:

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

With a warm cache and a well-vacuumed table, `EXPLAIN` can show `Index Only Scan`. That is the prize: fewer heap hits.

**When covering helps:**

* Hot read paths that always select the same few columns
* List endpoints (`id`, `status`, `created_at`) hit thousands of times per minute

**When to skip it:**

* Wide `INCLUDE` lists that bloat the index past the heap win
* Columns that update constantly (`status` flipping every second) force index updates even if the key did not change
* You have not confirmed with `EXPLAIN (ANALYZE, BUFFERS)` that heap fetches are the bottleneck

`INCLUDE` is not magic. Vacuum must keep the visibility map honest or you still fall back to heap checks.

---

## When indexes hurt

Indexes are not free. They hurt in predictable ways.

### 1. Write amplification

Every indexed column change updates every matching index. Bulk loads with ten secondary indexes can be several times slower than load-then-index:

```sql
-- Load path for big migrations
ALTER TABLE orders DROP CONSTRAINT ...;  -- if needed
-- or: DROP INDEX concurrently on standbys carefully in prod

COPY orders FROM '...';

CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

Prefer `CREATE INDEX CONCURRENTLY` (and `DROP INDEX CONCURRENTLY`) in production so you do not lock writes for the whole build. It takes longer and uses more resources, but it does not block DML the same way a plain `CREATE INDEX` does.

### 2. Low-selectivity indexes the planner ignores

```sql
CREATE INDEX orders_status_idx ON orders (status);
-- if 80% of rows are 'paid', this rarely helps WHERE status = 'paid'
```

You still pay for maintaining it. Check:

```sql
SELECT indexrelid::regclass AS index,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relid = 'orders'::regclass
ORDER BY idx_scan;
```

Near-zero `idx_scan` after weeks of real traffic is a candidate for drop (after confirming replicas and one-off jobs do not need it).

### 3. Wrong order and redundant stacks

Three indexes on overlapping prefixes:

```sql
-- Often redundant
CREATE INDEX ON orders (customer_id);
CREATE INDEX ON orders (customer_id, status);
CREATE INDEX ON orders (customer_id, status, created_at);
```

Keep the one that matches your real queries. Measure before deleting; some ORMs generate surprising shapes.

### 4. Random writes and cache pressure

Huge indexes compete with the heap for `shared_buffers`. If the working set no longer fits, you trade sequential heap reads for random index + heap I/O. A seq scan on a cold medium table can beat a nested loop of random lookups.

### 5. Over-indexing JSONB and expressions

GIN on every `jsonb` column "just in case" is a classic write killer. Index the paths you filter:

```sql
CREATE INDEX orders_meta_provider_idx
  ON orders ((metadata->>'provider'));
```

Or a partial + expression when only some rows matter.

---

## A practical checklist before you add an index

1. Capture the slow query with `EXPLAIN (ANALYZE, BUFFERS)` (and `auto_explain` in staging if you can).
2. Name the filter columns, join keys, and `ORDER BY` / `LIMIT` shape.
3. Prefer one composite (and optional `INCLUDE`) over many single-column indexes.
4. Use a partial index when a stable predicate defines a small hot set.
5. Create with `CONCURRENTLY` on live systems.
6. Re-check the plan after deploy. Watch `pg_stat_user_indexes` and write latency for a few days.
7. Drop what never scans. Document why the keepers exist in a one-line comment in migrations.

```sql
-- Migration comment example:
-- Serves GET /v1/customers/:id/orders?limit=20 (customer_id + created_at DESC)
CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

---

## What to learn next (not covered here)

* **BRIN** for huge append-only time series on correlated physical order
* **GIN** for full-text, arrays, and jsonb containment
* **Hash** indexes (limited use vs B-tree for equality-only)
* **Extension indexes** (`pg_trgm`, PostGIS)

Those are the right tools when B-tree and partial/covering no longer fit. Most OLTP pain dies with the patterns above.

---

## Bottom line

Start with B-tree on the keys you filter and sort by. Put equality columns left, ranges and sort keys after. Shrink with partial indexes when you only care about a subset. Cover hot read lists with `INCLUDE` when heap fetches show up in buffers. Drop indexes that never scan, and never add five single-column indexes when one composite matches the query.

If a change does not show up in `EXPLAIN (ANALYZE, BUFFERS)` on realistic data, it is not an index win yet. It is a guess.
`)