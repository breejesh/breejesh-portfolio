---
title: "Índices de PostgreSQL que importan: B-tree, parciales, compuestos y covering"
description: "Qué índices de Postgres bajan la latencia de verdad: B-tree por defecto, filtros parciales, orden de columnas compuesto, INCLUDE covering y cuándo un índice te frena."
date: "2026-07-16"
tags: [Backend y Bases de Datos]
coverImage: /assets/images/postgres-indexes-that-matter.webp
previewImage: /assets/images/postgres-indexes-that-matter.webp
---


Los índices son el atajo de rendimiento más barato que muchos equipos siguen usando mal. Añade diez y las escrituras se arrastran. Omite el correcto y un informe semanal bloquea el primario varios minutos. Postgres no te salva de una forma mala. Premia una buena.

Este post es la lista corta que uso en apps reales: B-tree por defecto, índices parciales para predicados calientes, orden de columnas en compuestos, covering con `INCLUDE`, y los casos en los que un índice empeora las cosas. Sin catálogo de todos los métodos de acceso. Solo los que aparecen una y otra vez en `EXPLAIN (ANALYZE, BUFFERS)`.

---

## Modelo mental: tocar menos páginas del heap

Un sequential scan lee la tabla. Un index scan camina una estructura más pequeña y luego (casi siempre) busca las tuplas en el heap. La ganancia es **I/O y CPU en filas que no tocas**.

Reglas burdas que se cumplen en producción:

* Igualdad y rango en una columna selectiva: B-tree es el default, y va bien.
* Baja selectividad (`status = 'active'` en el 90% de las filas): el planner puede ignorar el índice y escanear el heap. A menudo es lo correcto.
* El coste del índice se paga en cada `INSERT`, `UPDATE` y `DELETE` que toca las columnas indexadas.
* Índices hinchados o sin uso siguen costando WAL, vacuum y caché.

Si te quedas con una frase: *indexa la forma de consulta que corres a menudo, no cada columna que sale en un `WHERE`.*

---

## Esquema de ejemplo

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

Las primary keys y las unique constraints ya crean índices B-tree. Empieza ahí antes de inventar más.

---

## B-tree: el default que casi siempre gana

`CREATE INDEX` sin `USING` construye un **B-tree**. Soporta `=`, `<`, `<=`, `>`, `>=`, `BETWEEN` e `IN` en la(s) columna(s) líder(es). También soporta un `ORDER BY` que coincide con el orden del índice, y evita un sort.

```sql
CREATE INDEX orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

Consulta que lo usa limpio:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

Quieres algo como `Index Scan using orders_customer_created_idx` (o un bitmap index scan en sets grandes), no un seq scan más un sort.

**Trampas:**

* Columna líder primero. Un filtro solo en `created_at` no usará bien este índice (o no lo usará).
* Funciones sobre la columna rompen el match salvo que indexes la expresión:

```sql
-- Bad for a plain index on email
WHERE lower(email) = 'a@b.com'

-- Index the expression you filter on
CREATE INDEX users_email_lower_idx ON users (lower(email));
```

* `LIKE 'foo%'` puede usar un B-tree de texto. `LIKE '%foo%'` no. Para búsqueda de subcadena necesitas `pg_trgm` (u otro diseño).

B-tree no es exótico. Es el caballo de tiro. Acierta el orden de columnas y la selectividad antes de ir a por GIN o BRIN.

---

## Índices parciales: indexa solo las filas que consultas

Un índice parcial guarda entradas solo para filas que cumplen un `WHERE`. Índice más pequeño, updates más baratos en el resto de la tabla, y encaje perfecto para consultas de "subconjunto caliente".

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

Postgres puede usar el índice parcial cuando el predicado de la consulta **implica** el predicado del índice. Si quitas `status = 'pending'` de la query, este índice queda fuera.

**Buenos candidatos parciales:**

* Tablas con soft-delete: `WHERE deleted_at IS NULL`
* Filas de cola / outbox: `WHERE processed_at IS NULL`
* Flags activos multi-tenant, foreign keys no nulas que siempre filtras
* Valores de status raros que alimentan dashboards operativos

**Malos candidatos parciales:**

* Predicados que cambian en cada query (`created_at > now() - interval '1 day'` es incómodo como parcial estático salvo que rediseñes)
* Filtros que coinciden con casi toda la tabla (casi no reduces el índice)

Los parciales también ayudan a la unicidad en un subconjunto:

```sql
CREATE UNIQUE INDEX users_active_email_uidx
  ON users (email)
  WHERE deleted_at IS NULL;
```

Varias filas soft-deleted pueden compartir email. Solo una fila viva puede.

---

## Índices compuestos: el orden de columnas es el producto

`(a, b, c)` no es lo mismo que `(b, a, c)`. Un B-tree compuesto se ordena de izquierda a derecha. Piénsalo como claves de sort anidadas.

**Regla del prefijo izquierdo (versión práctica):**

| Filtros de la query | Índice `(customer_id, status, created_at)` |
| --- | --- |
| `customer_id = ?` | Sí |
| `customer_id = ? AND status = ?` | Sí |
| `customer_id = ? AND status = ? ORDER BY created_at` | Sí |
| solo `status = ?` | No (columna líder incorrecta) |
| solo `created_at > ?` | No |

Igualdad primero, luego rango, luego la clave de sort, es un patrón habitual:

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

Si pones `created_at` primero, la igualdad solo en `status` es débil. Si casi todas las queries son "por cliente, luego tiempo", pon `customer_id` primero.

**Unicidad multicolumna** es la misma estructura:

```sql
CREATE UNIQUE INDEX orders_idempotency_uidx
  ON orders (customer_id, idempotency_key);
```

No crees a la vez `(a, b)` y `(a)` salvo que hayas medido una necesidad real. El índice más largo suele servir el prefijo más corto. Índices extra son coste de escritura puro.

---

## Covering indexes: responder solo desde el índice

Una búsqueda de índice normal aún visita el heap por columnas no indexadas. Un scan **covering** (o index-only) devuelve la fila desde el índice cuando todas las columnas necesarias están ahí y el visibility map dice que la página es all-visible.

Postgres 11+ deja añadir columnas no clave con `INCLUDE`. Se guardan en la hoja pero no forman parte del orden de sort ni del chequeo de unicidad:

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

Con caché caliente y una tabla bien vacuumed, `EXPLAIN` puede mostrar `Index Only Scan`. Ese es el premio: menos hits al heap.

**Cuándo ayuda el covering:**

* Caminos de lectura calientes que siempre seleccionan las mismas pocas columnas
* Endpoints de listado (`id`, `status`, `created_at`) miles de veces por minuto

**Cuándo saltártelo:**

* Listas `INCLUDE` anchas que hinchan el índice más de lo que ganas en heap
* Columnas que se actualizan sin parar (`status` cambiando cada segundo) fuerzan updates del índice aunque la clave no cambie
* No has confirmado con `EXPLAIN (ANALYZE, BUFFERS)` que los heap fetches son el cuello de botella

`INCLUDE` no es magia. Vacuum tiene que mantener el visibility map al día o sigues cayendo en chequeos al heap.

---

## Cuándo los índices hacen daño

Los índices no son gratis. Hacen daño de formas predecibles.

### 1. Amplificación de escritura

Cada cambio de columna indexada actualiza cada índice que la toca. Cargas masivas con diez índices secundarios pueden ser varias veces más lentas que cargar y luego indexar:

```sql
-- Load path for big migrations
ALTER TABLE orders DROP CONSTRAINT ...;  -- if needed
-- or: DROP INDEX concurrently on standbys carefully in prod

COPY orders FROM '...';

CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

Prefiere `CREATE INDEX CONCURRENTLY` (y `DROP INDEX CONCURRENTLY`) en producción para no bloquear escrituras durante toda la construcción. Tarda más y usa más recursos, pero no bloquea el DML como un `CREATE INDEX` normal.

### 2. Índices de baja selectividad que el planner ignora

```sql
CREATE INDEX orders_status_idx ON orders (status);
-- if 80% of rows are 'paid', this rarely helps WHERE status = 'paid'
```

Igual pagas por mantenerlo. Revisa:

```sql
SELECT indexrelid::regclass AS index,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relid = 'orders'::regclass
ORDER BY idx_scan;
```

Casi cero `idx_scan` tras semanas de tráfico real es candidato a borrar (después de confirmar que réplicas y jobs puntuales no lo necesitan).

### 3. Orden incorrecto y pilas redundantes

Tres índices en prefijos solapados:

```sql
-- Often redundant
CREATE INDEX ON orders (customer_id);
CREATE INDEX ON orders (customer_id, status);
CREATE INDEX ON orders (customer_id, status, created_at);
```

Quédate con el que encaja con tus queries reales. Mide antes de borrar; algunos ORMs generan formas sorprendentes.

### 4. Escrituras aleatorias y presión de caché

Índices enormes compiten con el heap por `shared_buffers`. Si el working set ya no cabe, cambias lecturas secuenciales del heap por I/O aleatorio índice + heap. Un seq scan en una tabla mediana fría puede ganar a un nested loop de lookups aleatorios.

### 5. Sobre-indexar JSONB y expresiones

GIN en cada columna `jsonb` "por si acaso" es un clásico asesino de escritura. Indexa los paths que filtras:

```sql
CREATE INDEX orders_meta_provider_idx
  ON orders ((metadata->>'provider'));
```

O un parcial + expresión cuando solo importan algunas filas.

---

## Checklist práctico antes de añadir un índice

1. Captura la query lenta con `EXPLAIN (ANALYZE, BUFFERS)` (y `auto_explain` en staging si puedes).
2. Nombra columnas de filtro, claves de join y la forma de `ORDER BY` / `LIMIT`.
3. Prefiere un compuesto (y opcional `INCLUDE`) a muchos índices de una sola columna.
4. Usa un parcial cuando un predicado estable define un subconjunto caliente pequeño.
5. Crea con `CONCURRENTLY` en sistemas en vivo.
6. Vuelve a mirar el plan tras el deploy. Observa `pg_stat_user_indexes` y la latencia de escritura unos días.
7. Borra lo que nunca escanea. Documenta por qué existen los que se quedan en un comentario de una línea en las migraciones.

```sql
-- Migration comment example:
-- Serves GET /v1/customers/:id/orders?limit=20 (customer_id + created_at DESC)
CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

---

## Qué aprender después (no cubierto aquí)

* **BRIN** para series temporales enormes append-only con orden físico correlacionado
* **GIN** para full-text, arrays y contención jsonb
* **Hash** indexes (uso limitado frente a B-tree solo-igualdad)
* **Índices de extensión** (`pg_trgm`, PostGIS)

Son las herramientas correctas cuando B-tree y partial/covering ya no encajan. La mayor parte del dolor OLTP se muere con los patrones de arriba.

---

## En resumen

Empieza con B-tree en las claves por las que filtras y ordenas. Igualdad a la izquierda, rangos y sort después. Encoge con parciales cuando solo te importa un subconjunto. Cubre listas de lectura calientes con `INCLUDE` cuando los heap fetches salen en buffers. Borra índices que nunca escanean, y no añadas cinco índices de una columna cuando un compuesto encaja con la query.

Si un cambio no aparece en `EXPLAIN (ANALYZE, BUFFERS)` con datos realistas, aún no es una victoria de índice. Es una suposición.

