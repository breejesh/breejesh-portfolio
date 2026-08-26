---
title: "Multiple Apartments: SQL Query for Tenants with Multiple Leases (CTCI 14.1)"
description: "CTCI problem 14.1 in SQL: write a query to find all tenants who are currently renting more than one apartment."
date: "2026-03-24"
tags: [Backend & Databases, Algorithms & Data Structures]
coverImage: /assets/images/ctci-14-1-multiple-apartments.webp
previewImage: /assets/images/ctci-14-1-multiple-apartments.webp
---

> **TL;DR**
> * **The Goal:** Write an optimal SQL query to list tenant names and IDs who hold more than one active apartment lease.
> * **The Insight:** Join `Tenants` to `AptTenants`, group by `TenantID`, and filter aggregate counts using `HAVING COUNT(*) > 1`.
> * **Complexity:** $O(N \log N)$ or $O(N)$ with hash aggregation.

In property management schemas, a tenant can hold leases across multiple units. Finding tenants with multiple apartments is a classic `GROUP BY ... HAVING` database query.

---

## 1. Schema Definition

```sql
-- Tenants: TenantID, TenantName
-- AptTenants: TenantID, AptID
```

---

## 2. Idiomatic SQL Solution

```sql
SELECT 
    t.TenantID,
    t.TenantName,
    COUNT(at.AptID) AS ApartmentCount
FROM 
    Tenants t
INNER JOIN 
    AptTenants at ON t.TenantID = at.TenantID
GROUP BY 
    t.TenantID,
    t.TenantName
HAVING 
    COUNT(at.AptID) > 1;
```

---

## 3. Query Execution & Indexing Optimization

| Without Index | With Index on `AptTenants(TenantID)` |
| --- | --- |
| Full table scan on `AptTenants` | Fast Index Scan / Hash Join |
| Temp table sort for aggregation | Stream aggregation directly from sorted index |
