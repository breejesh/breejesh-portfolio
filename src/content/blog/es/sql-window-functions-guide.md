---
title: "Funciones de ventana SQL que se quedan: ROW_NUMBER, RANK, LAG y totales acumulados"
description: "Guía práctica de window functions en SQL: particiones, ROW_NUMBER vs RANK, diffs con LAG/LEAD, totales acumulados y el patrón CTE para filtrar que usas cada semana."
date: "2026-07-12"
tags: [Backend y Bases de Datos]
coverImage: /assets/images/sql-window-functions-guide.webp
previewImage: /assets/images/sql-window-functions-guide.webp
---

La mayor parte del SQL analítico que escribes son las mismas cinco formas: última fila por clave, top N por grupo, ranking con empates, valor frente al periodo anterior y un total acumulado. Las funciones de ventana resuelven esas formas sin self-joins que aplastan al planner.

Este post es el modelo mental que mantengo, más las consultas que pego en trabajo real. Postgres, BigQuery, Snowflake y MySQL moderno comparten la misma sintaxis base. Los dialectos cambian en extras pequeños, no en la idea.

---

## Una idea: una ventana es un marco sobre filas que ya tienes

Un agregado normal colapsa filas:

```sql
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region;
```

Pierdes el detalle a nivel de línea. Una **función de ventana** calcula un agregado o ranking **por fila**, y sigue devolviendo cada fila:

```sql
SELECT
  region,
  order_id,
  amount,
  SUM(amount) OVER (PARTITION BY region) AS region_total
FROM sales;
```

Cada pedido se queda. También tienes el total de la región al lado. Ese es todo el truco.

La cláusula que define la ventana es `OVER (...)`. Dentro suelen importar tres piezas:

1. **`PARTITION BY`** - reinicia el cálculo cuando cambia esta clave (como un `GROUP BY` suave).
2. **`ORDER BY`** - ordena filas dentro de cada partición (necesario para ranks, lag, sumas acumuladas).
3. **Frame** - qué filas vecinas cuentan para la fila actual (`ROWS BETWEEN ...`). Los defaults importan; más abajo.

Si recuerdas solo una frase: *la partición dice con quién compites, el orden en qué secuencia, el frame hasta dónde mira la calculadora.*

---

## Datos de ejemplo para el resto del post

```sql
CREATE TABLE orders (
  order_id   int PRIMARY KEY,
  customer_id int,
  region     text,
  order_date date,
  amount     numeric
);

INSERT INTO orders VALUES
  (1, 101, 'west',  '2025-11-01', 120),
  (2, 101, 'west',  '2025-11-15',  80),
  (3, 101, 'west',  '2025-12-01', 200),
  (4, 202, 'east',  '2025-11-03',  50),
  (5, 202, 'east',  '2025-11-20',  50),
  (6, 202, 'east',  '2025-12-10', 300),
  (7, 303, 'west',  '2025-11-08',  90),
  (8, 303, 'west',  '2025-12-05', 110);
```

Pequeño a propósito. Lee los resultados en voz alta una vez y las funciones dejan de parecer magia.

---

## ROW_NUMBER: elige una fila cuando hay empates

`ROW_NUMBER()` asigna una secuencia única dentro de la partición. Los empates en el `ORDER BY` siguen recibiendo números distintos. Eso quieres para "exactamente un ganador."

**Patrón: último pedido por cliente**

```sql
WITH ranked AS (
  SELECT
    order_id,
    customer_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, order_id DESC
    ) AS rn
  FROM orders
)
SELECT order_id, customer_id, order_date, amount
FROM ranked
WHERE rn = 1;
```

| order_id | customer_id | order_date | amount |
| ---: | ---: | --- | ---: |
| 3 | 101 | 2025-12-01 | 200 |
| 6 | 202 | 2025-12-10 | 300 |
| 8 | 303 | 2025-12-05 | 110 |

Notas que te ahorran dolor:

* Siempre añade un **desempate** (`order_id DESC` aquí). Sin él, qué fila es `rn = 1` no está definido si coinciden dos fechas.
* Filtra el resultado de la ventana en un **CTE o subconsulta**. `WHERE ROW_NUMBER() ...` es ilegal en SQL estándar porque `WHERE` corre antes que las ventanas.
* El mismo patrón sirve para "primer evento por usuario," "fila actual de suscripción," "último deploy por servicio."

---

## RANK y DENSE_RANK: cuando los empates comparten puesto

`ROW_NUMBER` es único. `RANK` y `DENSE_RANK` permiten empates.

```sql
SELECT
  region,
  order_id,
  amount,
  RANK()       OVER (PARTITION BY region ORDER BY amount DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY region ORDER BY amount DESC) AS dense_rnk,
  ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC, order_id) AS rn
FROM orders
ORDER BY region, amount DESC, order_id;
```

Para `east`, importes 300, 50, 50:

| amount | RANK | DENSE_RANK | ROW_NUMBER |
| ---: | ---: | ---: | ---: |
| 300 | 1 | 1 | 1 |
| 50 | 2 | 2 | 2 |
| 50 | 2 | 2 | 3 |

Luego el siguiente valor distinto sería:

* **RANK**: salta a 4 (omite puestos tras un empate doble en 2)
* **DENSE_RANK**: pasa a 3 (sin huecos)
* **ROW_NUMBER**: ya usó 1, 2, 3 sin mirar empates

Cuándo usar cada una:

| Necesitas | Función |
| --- | --- |
| Una fila por grupo, sin empates en el resultado | `ROW_NUMBER` + filtro `rn = 1` |
| Clasificación que puede saltar puestos tras empates | `RANK` |
| Clasificación sin huecos en los puestos | `DENSE_RANK` |
| Top 3 *importes* aunque haya más de 3 filas empatadas | filtrar `DENSE_RANK() <= 3` |

**Patrón: top 2 pedidos por importe en cada región**

```sql
WITH ranked AS (
  SELECT
    *,
    DENSE_RANK() OVER (
      PARTITION BY region
      ORDER BY amount DESC
    ) AS place
  FROM orders
)
SELECT region, order_id, amount, place
FROM ranked
WHERE place <= 2
ORDER BY region, place, order_id;
```

---

## LAG y LEAD: anterior y siguiente sin self-join

`LAG(expr, n)` mira **n filas atrás** dentro de la partición (tras el `ORDER BY`). `LEAD` mira hacia delante. El `n` por defecto es 1.

**Patrón: cambio periodo a periodo por cliente**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  LAG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS prev_amount,
  amount - LAG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS delta,
  ROUND(
    100.0 * (amount - LAG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
    ))
    / NULLIF(LAG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
    ), 0),
    1
  ) AS pct_change
FROM orders
ORDER BY customer_id, order_date;
```

Para el cliente 101:

| order_date | amount | prev_amount | delta | pct_change |
| --- | ---: | ---: | ---: | ---: |
| 2025-11-01 | 120 | NULL | NULL | NULL |
| 2025-11-15 | 80 | 120 | -40 | -33.3 |
| 2025-12-01 | 200 | 80 | 120 | 150.0 |

La primera fila no tiene valor previo, así que `LAG` devuelve `NULL`. Es esperado. Usa `LAG(amount, 1, 0)` si quieres un default en lugar de `NULL` (Postgres y muchos motores admiten el tercer argumento).

**Patrón: días desde el pedido anterior**

```sql
SELECT
  customer_id,
  order_date,
  order_date - LAG(order_date) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS days_since_prev
FROM orders;
```

En Postgres, restar fechas da un entero de días. En otros motores puede hacer falta `DATEDIFF` o `DATE_DIFF`.

---

## Totales acumulados: SUM con frame ordenado

La consulta clásica de "saldo de cuenta" o "ingresos YTD."

```sql
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders
ORDER BY customer_id, order_date;
```

Cliente 101:

| order_date | amount | running_total |
| --- | ---: | ---: |
| 2025-11-01 | 120 | 120 |
| 2025-11-15 | 80 | 200 |
| 2025-12-01 | 200 | 400 |

### Por qué escribir el frame

Para `SUM` / `AVG` / `COUNT` con `ORDER BY`, los motores suelen usar un frame **RANGE** desde el inicio de la partición hasta el grupo de peers actual (misma clave de orden). Si dos filas comparten `order_date`, ambas pueden sumar el importe de la otra en el total "acumulado", y eso confunde.

`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` es orden físico de filas: cada fila se añade una sola vez, en el orden que pediste. Prefiere `ROWS` para totales acumulados reales. Mantén un `ORDER BY` único (añade `order_id`) para que la secuencia sea estable.

**Media móvil (últimos 3 pedidos):**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS avg_last_3
FROM orders
ORDER BY customer_id, order_date;
```

Las primeras filas tienen menos de tres observaciones. Está bien; la media es sobre lo que exista en el frame.

---

## Solo partición: porcentaje del total sin join

No siempre hace falta `ORDER BY`.

```sql
SELECT
  region,
  order_id,
  amount,
  SUM(amount) OVER (PARTITION BY region) AS region_total,
  ROUND(
    100.0 * amount / SUM(amount) OVER (PARTITION BY region),
    1
  ) AS pct_of_region
FROM orders
ORDER BY region, order_id;
```

Misma idea con `amount / SUM(amount) OVER ()` cuando el denominador es **todo el result set** (`OVER()` vacío).

---

## FIRST_VALUE y NTH_VALUE: anclar una línea base

**Patrón: cada fila frente al importe del primer pedido del cliente**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  FIRST_VALUE(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS first_order_amount,
  amount - FIRST_VALUE(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS vs_first
FROM orders
ORDER BY customer_id, order_date;
```

Algunos motores necesitan el frame ancho para que `FIRST_VALUE` se quede en la primera fila real de la partición. Revisa la doc de tu dialecto si el valor se "pega" a la fila equivocada.

---

## Orden de ejecución: por qué existe el patrón CTE

Orden lógico aproximado de un `SELECT`:

1. `FROM` / `JOIN`
2. `WHERE`
3. `GROUP BY` / agregados
4. `HAVING`
5. **Funciones de ventana**
6. Lista del `SELECT`
7. `DISTINCT`
8. `ORDER BY`
9. `LIMIT` / `OFFSET`

Las ventanas corren **después** de `WHERE` y `GROUP BY`. Por eso no puedes escribir:

```sql
-- inválido
SELECT *
FROM orders
WHERE ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1;
```

Envuelve primero, filtra después. Igual con `QUALIFY` si tu warehouse lo tiene (BigQuery, Snowflake):

```sql
-- estilo BigQuery / Snowflake
SELECT *
FROM orders
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id
  ORDER BY order_date DESC, order_id DESC
) = 1;
```

`QUALIFY` es azúcar sobre el patrón CTE. Úsalo si el motor lo soporta; CTE en el resto.

---

## Errores habituales (y arreglos)

**1. Falta `ORDER BY` en una función de ranking**  
`ROW_NUMBER() OVER (PARTITION BY customer_id)` no tiene orden definido. Ordénalo siempre.

**2. Filtrar top N en la misma capa que la ventana**  
Usa CTE / subconsulta / `QUALIFY`.

**3. Default RANGE en totales acumulados**  
Prefiere `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` y un sort único.

**4. Grano de partición incorrecto**  
"Último por cliente" es `PARTITION BY customer_id`. "Último por cliente y región" necesita ambas claves. Un grano mal puesto da dashboards "casi bien" que fallan en auditoría.

**5. Usar ventanas cuando basta un agregado**  
Si solo necesitas un total por región y nada de detalle de línea, `GROUP BY` es más simple y a menudo más barato. Las ventanas brillan cuando necesitas **detalle de fila más** contexto de grupo.

**6. Coste de índice y sort**  
Las ventanas suelen forzar un sort por partición. Ayuda al planner con índices que encajen con `PARTITION BY` + `ORDER BY` en tablas grandes, y empuja filtros pesados al CTE que alimenta la ventana para que las particiones se queden pequeñas.

---

## Mini cheatsheet

```sql
-- última fila por clave
ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC, id DESC)

-- ranking con empates (sin huecos)
DENSE_RANK() OVER (PARTITION BY key ORDER BY score DESC)

-- valor anterior
LAG(col)  OVER (PARTITION BY key ORDER BY ts)
LEAD(col) OVER (PARTITION BY key ORDER BY ts)

-- total acumulado
SUM(col) OVER (
  PARTITION BY key
  ORDER BY ts, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)

-- porcentaje del grupo
col * 1.0 / SUM(col) OVER (PARTITION BY key)

-- total del set completo en cada fila
SUM(col) OVER ()
```

---

## Una query "one-pager" de analytics

Varias piezas juntas para una vista de actividad del cliente:

```sql
WITH base AS (
  SELECT
    customer_id,
    order_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, order_id DESC
    ) AS recency_rn,
    LAG(order_date) OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
    ) AS prev_order_date,
    SUM(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS lifetime_to_date,
    SUM(amount) OVER (PARTITION BY customer_id) AS lifetime_total
  FROM orders
)
SELECT
  customer_id,
  order_id,
  order_date,
  amount,
  prev_order_date,
  order_date - prev_order_date AS days_since_prev,
  lifetime_to_date,
  lifetime_total,
  recency_rn = 1 AS is_latest_order
FROM base
ORDER BY customer_id, order_date;
```

Un solo pase sustituye un montón de subconsultas correlacionadas. Léela de arriba abajo: defines las ventanas una vez, proyectas flags y gaps, listo.

---

## Qué practicar después

1. Reescribe tres reportes que ya envías usando solo ventanas (última fila, top N, delta mes a mes).
2. Fuerza un empate a propósito e imprime `ROW_NUMBER`, `RANK` y `DENSE_RANK` lado a lado hasta que el salto de puestos te aburra.
3. Rompe un total acumulado con filas del mismo día, y arréglalo con `ROWS` y un `ORDER BY` único.

Cuando esas tres se sientan automáticas, el resto del catálogo (`NTILE`, `CUME_DIST`, cláusulas `WINDOW` con nombre) es vocabulario encima del mismo modelo: partición, orden, frame.
