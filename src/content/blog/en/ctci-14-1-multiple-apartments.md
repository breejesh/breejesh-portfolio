---
title: "Multiple Apartments: Group By and Having Filter SQL Queries (CTCI 14.1)"
description: "Write an optimized SQL query to identify tenants renting multiple apartments using JOIN, GROUP BY, and HAVING aggregate filters in relational databases."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-14-1-multiple-apartments.webp
previewImage: /assets/images/ctci-14-1-multiple-apartments.webp
---

> **TL;DR**
> * **The Book Problem:** Write a SQL query to get a list of tenants who are renting more than one apartment.
> * **The Optimal Solution:** **Aggregated Subquery / Having Filtering**: (1) The database schema includes `Tenants(TenantID, TenantName)` and a junction table `AptTenants(TenantID, AptID)`; (2) Aggregate `AptTenants` grouping by `TenantID` with `HAVING COUNT(*) > 1`; (3) Join the filtered tenant IDs back to `Tenants` to retrieve the human-readable `TenantName`; (4) Alternatively, perform a direct `JOIN` between `Tenants` and `AptTenants` grouped by `Tenants.TenantID, Tenants.TenantName` with `HAVING COUNT(AptTenants.AptID) > 1`; (5) Runs in **$O(N \log N)$ or $O(N)$ query time** using index hash joins.
> * **Production Reality:** Property management multi-lease auditing and CRM fraud deduplication queries.

## 1. The Book Problem Formulation & Schema

In *Cracking the Coding Interview* (Problem 14.1), we are given a real estate database schema:

```
[Tenants]
  TenantID (PK)
  TenantName

[AptTenants] (Junction Table)
  TenantID (FK -> Tenants.TenantID)
  AptID    (FK -> Apartments.AptID)

[Apartments]
  AptID       (PK)
  UnitNumber
  BuildingID  (FK -> Buildings.BuildingID)
```

*"Write a SQL query to get a list of tenants who are renting more than one apartment."*

## 2. Query Execution Mechanics: WHERE vs HAVING

* **`WHERE` clause:** Filters individual table rows *before* aggregation occurs. Cannot evaluate aggregate functions like `COUNT(*)`.
* **`HAVING` clause:** Filters grouped records *after* the `GROUP BY` operation has computed aggregate counts.

## Production SQL Solutions

### Approach 1: Subquery with Inner Join (Index-Optimized)

```sql
SELECT 
    Tenants.TenantName
FROM Tenants
INNER JOIN (
    SELECT 
        TenantID
    FROM AptTenants
    GROUP BY TenantID
    HAVING COUNT(*) > 1
) MultiLeaseTenants 
ON Tenants.TenantID = MultiLeaseTenants.TenantID;
```

### Approach 2: Direct Group By with Join

```sql
SELECT 
    t.TenantID,
    t.TenantName
FROM Tenants t
INNER JOIN AptTenants at ON t.TenantID = at.TenantID
GROUP BY 
    t.TenantID, 
    t.TenantName
HAVING COUNT(at.AptID) > 1;
```

## Performance & Execution Plan Analysis

| Stage | Operation | Index Used | Complexity |
|---|---|---|---|
| 1. Scan `AptTenants` | Stream aggregate over `TenantID` | Composite `(TenantID, AptID)` | $O(M)$ sequential index scan |
| 2. Having Filter | Drop groups with `COUNT <= 1` | In-memory stream accumulator | $O(K)$ where $K \le M$ |
| 3. Join with `Tenants` | Primary key lookup on `TenantID` | Clustered Index `Tenants.TenantID` | $O(K \times 1)$ B-Tree lookups |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Indexing and Partitioning

1. **Covering Index on Junction Table:** Creating a composite index `CREATE INDEX idx_apt_tenants ON AptTenants(TenantID, AptID)` allows the query engine to resolve the entire aggregation solely from the B-Tree leaf pages (Index-Only Scan) without touching table heap pages.
2. **Distributed SQL Execution:** In distributed databases (CockroachDB, Google Cloud Spanner), grouping by `TenantID` is pushed down locally to each partition node before merging counts across network shards.

## Edge Cases & Production Hardening

1. **Duplicate Junction Rows:** If the schema allows duplicate `(TenantID, AptID)` pairs without a primary key constraint, use `HAVING COUNT(DISTINCT AptID) > 1`.
2. **Tenants with Zero Apartments:** Inner join automatically excludes inactive tenants without leases.
