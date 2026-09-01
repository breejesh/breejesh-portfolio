---
title: "Fonctions de fenêtre SQL qui restent: ROW_NUMBER, RANK, LAG et totaux cumulés"
description: "Guide pratique des window functions SQL: partitions, ROW_NUMBER vs RANK, diffs LAG/LEAD, totaux cumulés, et le pattern CTE de filtrage dont vous avez besoin chaque semaine."
date: "2026-07-12"
tags: [Backend et Bases de Données]
coverImage: /assets/images/sql-window-functions-guide.webp
previewImage: /assets/images/sql-window-functions-guide.webp
---


La plupart du SQL analytique que vous écrivez, ce sont les mêmes cinq formes: dernière ligne par clé, top N par groupe, classement avec ex aequo, valeur face à la période précédente, et un total cumulé. Les fonctions de fenêtre résolvent ces formes sans self-joins qui font fondre le planner.

Ce billet est le modèle mental que je garde, plus les requêtes que je colle en prod. Postgres, BigQuery, Snowflake et MySQL moderne partagent la même syntaxe de base. Les dialectes divergent sur des extras, pas sur l'idée.

---

## Une idée: une fenêtre est un cadre sur des lignes déjà là

Un agrégat classique écrase les lignes:

```sql
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region;
```

Vous perdez le détail ligne. Une **fonction de fenêtre** calcule un agrégat ou un rang **par ligne**, tout en renvoyant chaque ligne:

```sql
SELECT
  region,
  order_id,
  amount,
  SUM(amount) OVER (PARTITION BY region) AS region_total
FROM sales;
```

Chaque commande reste. Vous avez aussi le total de la région à côté. C'est tout le tour de magie.

La clause qui définit la fenêtre est `OVER (...)`. Dedans, trois pièces comptent le plus souvent:

1. **`PARTITION BY`** - relance le calcul quand cette clé change (comme un `GROUP BY` doux).
2. **`ORDER BY`** - ordonne les lignes dans chaque partition (requis pour ranks, lag, sommes cumulées).
3. **Frame** - quelles lignes voisines comptent pour la ligne courante (`ROWS BETWEEN ...`). Les défauts comptent; plus bas.

Si vous ne retenez qu'une phrase: *la partition dit avec qui vous rivalisez, l'ordre dans quelle séquence, le frame jusqu'où regarde le calculateur.*

---

## Données d'exemple pour la suite

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

Volontairement petit. Lisez les résultats à voix haute une fois et les fonctions cessent d'avoir l'air magiques.

---

## ROW_NUMBER: choisir une ligne quand il y a des ex aequo

`ROW_NUMBER()` donne une séquence unique dans la partition. Les ex aequo sur le `ORDER BY` reçoivent quand même des numéros différents. C'est ce qu'il faut pour "exactement un gagnant."

**Pattern: dernière commande par client**

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

Notes qui évitent la douleur plus tard:

* Ajoutez toujours un **départage** (`order_id DESC` ici). Sans lui, quelle ligne a `rn = 1` est indéfini si deux dates coïncident.
* Filtrez le résultat de la fenêtre dans un **CTE ou une sous-requête**. `WHERE ROW_NUMBER() ...` est illégal en SQL standard car `WHERE` s'exécute avant les fenêtres.
* Même pattern pour "premier événement par utilisateur," "ligne d'abonnement courante," "dernier deploy par service."

---

## RANK et DENSE_RANK: quand les ex aequo partagent la place

`ROW_NUMBER` est unique. `RANK` et `DENSE_RANK` autorisent les ex aequo.

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

Pour `east`, montants 300, 50, 50:

| amount | RANK | DENSE_RANK | ROW_NUMBER |
| ---: | ---: | ---: | ---: |
| 300 | 1 | 1 | 1 |
| 50 | 2 | 2 | 2 |
| 50 | 2 | 2 | 3 |

Ensuite la valeur distincte suivante serait:

* **RANK**: saute à 4 (saute des places après un double ex aequo en 2)
* **DENSE_RANK**: passe à 3 (sans trous)
* **ROW_NUMBER**: a déjà utilisé 1, 2, 3 sans regarder les ex aequo

Quand utiliser quoi:

| Besoin | Fonction |
| --- | --- |
| Une ligne par groupe, pas d'ex aequo dans le résultat | `ROW_NUMBER` + filtre `rn = 1` |
| Classement qui peut sauter des places après ex aequo | `RANK` |
| Classement sans trous dans les places | `DENSE_RANK` |
| Top 3 *montants* même s'il y a plus de 3 lignes ex aequo | filtrer `DENSE_RANK() <= 3` |

**Pattern: top 2 commandes par montant dans chaque région**

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

## LAG et LEAD: précédent et suivant sans self-join

`LAG(expr, n)` regarde **n lignes en arrière** dans la partition (après le `ORDER BY`). `LEAD` regarde en avant. Le `n` par défaut est 1.

**Pattern: variation période à période par client**

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

Pour le client 101:

| order_date | amount | prev_amount | delta | pct_change |
| --- | ---: | ---: | ---: | ---: |
| 2025-11-01 | 120 | NULL | NULL | NULL |
| 2025-11-15 | 80 | 120 | -40 | -33.3 |
| 2025-12-01 | 200 | 80 | 120 | 150.0 |

La première ligne n'a pas de valeur précédente, donc `LAG` renvoie `NULL`. C'est normal. Utilisez `LAG(amount, 1, 0)` si vous voulez un défaut au lieu de `NULL` (Postgres et beaucoup de moteurs acceptent le troisième argument).

**Pattern: jours depuis la commande précédente**

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

Sous Postgres, soustraire des dates donne un entier de jours. Ailleurs il peut falloir `DATEDIFF` ou `DATE_DIFF`.

---

## Totaux cumulés: SUM avec un frame ordonné

La requête classique "solde de compte" ou "revenu YTD."

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

Client 101:

| order_date | amount | running_total |
| --- | ---: | ---: |
| 2025-11-01 | 120 | 120 |
| 2025-11-15 | 80 | 200 |
| 2025-12-01 | 200 | 400 |

### Pourquoi écrire le frame

Pour `SUM` / `AVG` / `COUNT` avec `ORDER BY`, les moteurs utilisent souvent un frame **RANGE** du début de la partition jusqu'au groupe de pairs courant (même clé de tri). Si deux lignes partagent le même `order_date`, chacune peut absorber le montant de l'autre dans le total "cumulé", ce qui surprend.

`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` est l'ordre physique des lignes: chaque ligne s'ajoute une fois, dans l'ordre demandé. Préférez `ROWS` pour de vrais totaux cumulés. Gardez un `ORDER BY` unique (ajoutez `order_id`) pour une séquence stable.

**Moyenne mobile (3 dernières commandes):**

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

Les premières lignes ont moins de trois observations. C'est normal; la moyenne porte sur ce qui existe dans le frame.

---

## Partition seule: part du total sans join

Vous n'avez pas toujours besoin d'`ORDER BY`.

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

Même idée avec `amount / SUM(amount) OVER ()` quand le dénominateur est **tout le result set** (`OVER()` vide).

---

## FIRST_VALUE et NTH_VALUE: ancrer une baseline

**Pattern: chaque ligne face au montant de la première commande du client**

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

Certains moteurs ont besoin du frame large pour que `FIRST_VALUE` reste la vraie première ligne de la partition. Vérifiez la doc du dialecte si la valeur "colle" à la mauvaise ligne.

---

## Ordre d'exécution: pourquoi le pattern CTE existe

Ordre logique approximatif d'un `SELECT`:

1. `FROM` / `JOIN`
2. `WHERE`
3. `GROUP BY` / agrégats
4. `HAVING`
5. **Fonctions de fenêtre**
6. Liste du `SELECT`
7. `DISTINCT`
8. `ORDER BY`
9. `LIMIT` / `OFFSET`

Les fenêtres s'exécutent **après** `WHERE` et `GROUP BY`. Donc vous ne pouvez pas écrire:

```sql
-- invalide
SELECT *
FROM orders
WHERE ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1;
```

Enveloppez d'abord, filtrez ensuite. Pareil avec `QUALIFY` si votre warehouse l'a (BigQuery, Snowflake):

```sql
-- style BigQuery / Snowflake
SELECT *
FROM orders
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id
  ORDER BY order_date DESC, order_id DESC
) = 1;
```

`QUALIFY` est du sucre sur le pattern CTE. Utilisez-le si le moteur le supporte; CTE partout ailleurs.

---

## Erreurs fréquentes (et correctifs)

**1. `ORDER BY` manquant sur une fonction de ranking**  
`ROW_NUMBER() OVER (PARTITION BY customer_id)` n'a pas d'ordre défini. Ordonnez toujours explicitement.

**2. Filtrer le top N dans la même couche que la fenêtre**  
Utilisez CTE / sous-requête / `QUALIFY`.

**3. Défaut RANGE sur les totaux cumulés**  
Préférez `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` et un tri unique.

**4. Mauvais grain de partition**  
"Dernier par client" est `PARTITION BY customer_id`. "Dernier par client et région" demande les deux clés. Un mauvais grain produit des dashboards "presque justes" qui cassent en audit.

**5. Utiliser des fenêtres quand un agrégat suffit**  
Si vous voulez seulement un total par région sans détail ligne, `GROUP BY` est plus simple et souvent moins cher. Les fenêtres brillent quand vous avez besoin du **détail ligne plus** le contexte de groupe.

**6. Coût d'index et de sort**  
Les fenêtres forcent souvent un sort par partition. Aidez le planner avec des index alignés sur `PARTITION BY` + `ORDER BY` sur les grosses tables, et poussez les filtres lourds dans le CTE qui alimente la fenêtre pour garder les partitions petites.

---

## Mini aide-mémoire

```sql
-- dernière ligne par clé
ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC, id DESC)

-- classement avec ex aequo (sans trous)
DENSE_RANK() OVER (PARTITION BY key ORDER BY score DESC)

-- valeur précédente
LAG(col)  OVER (PARTITION BY key ORDER BY ts)
LEAD(col) OVER (PARTITION BY key ORDER BY ts)

-- total cumulé
SUM(col) OVER (
  PARTITION BY key
  ORDER BY ts, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)

-- part du groupe
col * 1.0 / SUM(col) OVER (PARTITION BY key)

-- total de tout le set sur chaque ligne
SUM(col) OVER ()
```

---

## Une requête "one-pager" d'analytics

Plusieurs pièces ensemble pour une vue d'activité client:

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

Un seul passage remplace une pile de sous-requêtes corrélées. Lisez de haut en bas: vous définissez les fenêtres une fois, vous projetez flags et écarts, terminé.

---

## Quoi pratiquer ensuite

1. Reconstruisez trois rapports que vous livrez déjà avec seulement des fenêtres (dernière ligne, top N, delta mois à mois).
2. Forcez un ex aequo volontaire et imprimez `ROW_NUMBER`, `RANK` et `DENSE_RANK` côte à côte jusqu'à ce que le saut de places soit ennuyeux.
3. Cassez un total cumulé avec des lignes le même jour, puis corrigez avec `ROWS` et un `ORDER BY` unique.

Quand ces trois gestes sont automatiques, le reste du catalogue (`NTILE`, `CUME_DIST`, clauses `WINDOW` nommées) n'est que du vocabulaire sur le même modèle: partition, ordre, frame.

