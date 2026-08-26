---
title: "Multiple Apartments: Query Tenants with Multiple Apartments in SQL (CTCI 14.1)"
description: "CTCI problem 14.1: SQL query using GROUP BY and HAVING to find tenants renting more than one apartment."
date: "2026-04-03"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-14-1-multiple-apartments.webp
previewImage: /assets/images/ctci-14-1-multiple-apartments.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 14.1 technical mechanics.
> * **The Approach:** CTCI problem 14.1: SQL query using GROUP BY and HAVING to find tenants renting more than one apartment.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **14.1**.

## 1. Context and Problem Statement
CTCI problem 14.1: SQL query using GROUP BY and HAVING to find tenants renting more than one apartment.

## 2. Technical Code & Mechanics

```sql
SELECT TenantID, COUNT(*) AS ApartmentCount
FROM AptTenants
GROUP BY TenantID
HAVING COUNT(*) > 1;
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.