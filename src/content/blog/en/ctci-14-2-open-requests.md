---
title: "Open Requests: Left Join Preservation and Aggregation Nuances in SQL (CTCI 14.2)"
description: "Write a SQL query to list all buildings and their count of open maintenance requests, detailing Left Join null preservation and COUNT(col) vs COUNT(*) semantics."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-14-2-open-requests.webp
previewImage: /assets/images/ctci-14-2-open-requests.webp
---

> **TL;DR**
> * **The Book Problem:** Write a SQL query to get a list of all buildings and the number of open requests (Requests in which status equals 'Open').
> * **The Optimal Solution:** **Multi-Tier LEFT JOIN with Predicate in ON Clause**:
>   1. **The Trap**: An `INNER JOIN` silently eliminates buildings with zero requests; a `WHERE Requests.Status = 'Open'` converts a `LEFT JOIN` into an `INNER JOIN`.
>   2. **The Fix**: `LEFT JOIN` from `Buildings` $\to$ `Apartments`, and `LEFT JOIN` to `Requests` with the status filter placed directly in the join condition: `ON Apartments.AptID = Requests.AptID AND Requests.Status = 'Open'`.
>   3. **Aggregation Nuance**: Use `COUNT(Requests.RequestID)` (which evaluates NULL rows to 0) rather than `COUNT(*)` (which evaluates a NULL outer join row to 1).
>   4. Alternatively, aggregate open requests in an inner-joined subquery and `LEFT JOIN` it back to `Buildings` using `COALESCE(sub.count, 0)`.
> * **Production Reality:** Operational ticketing dashboards and facility SLA compliance metrics in enterprise asset management databases.

## 1. The Book Problem Formulation & Schema

In *Cracking the Coding Interview* (Problem 14.2), we are given the property management schema:

```
[Buildings] ──1:N──> [Apartments] ──1:N──> [Requests]
 BuildingID (PK)      AptID (PK)            RequestID (PK)
 BuildingName         BuildingID (FK)       AptID (FK)
                                            Status ('Open' / 'Closed')
```

*"Write a SQL query to get a list of all buildings and the number of open requests (Requests in which status equals 'Open')."*

## 2. The Left Join Pitfalls

```
[Buildings] (All 100 Buildings)
     │
     ▼ (LEFT JOIN: Preserves all buildings)
[Apartments]
     │
     ▼ (LEFT JOIN with ON status = 'Open')
[Requests]
     │
     ▼
COUNT(Requests.RequestID) ──> Evaluates NULLs to 0!
```

* **Pitfall 1:** Placing `WHERE Requests.Status = 'Open'` filters out the generated `NULL` rows of buildings with 0 requests, destroying the outer join.
* **Pitfall 2:** Using `COUNT(*)` on a building with 0 apartments counts the single synthesized `NULL` row as 1 open request.

## Production SQL Implementations

### Approach 1: Multi-Table Left Join (Canonical & Elegant)

```sql
SELECT 
    b.BuildingID,
    b.BuildingName,
    COUNT(r.RequestID) AS NumberOfOpenRequests
FROM Buildings b
LEFT JOIN Apartments a 
    ON b.BuildingID = a.BuildingID
LEFT JOIN Requests r 
    ON a.AptID = r.AptID 
   AND r.Status = 'Open'
GROUP BY 
    b.BuildingID, 
    b.BuildingName;
```

### Approach 2: Aggregated Derived Subquery with COALESCE

```sql
SELECT 
    b.BuildingID,
    b.BuildingName,
    COALESCE(open_counts.TotalOpen, 0) AS NumberOfOpenRequests
FROM Buildings b
LEFT JOIN (
    SELECT 
        a.BuildingID,
        COUNT(r.RequestID) AS TotalOpen
    FROM Apartments a
    INNER JOIN Requests r 
        ON a.AptID = r.AptID
    WHERE r.Status = 'Open'
    GROUP BY a.BuildingID
) open_counts 
ON b.BuildingID = open_counts.BuildingID;
```

## Performance & Execution Plan Analysis

| Stage | Operation | Index Recommendation | Complexity |
|---|---|---|---|
| 1. Scan Buildings | Clustered index scan | `PK_Buildings (BuildingID)` | $O(B)$ |
| 2. Lookup Apartments | Index seek on foreign key | `IX_Apartments_BuildingID` | $O(B \log A)$ |
| 3. Filter Open Requests | Filtered index scan | `IX_Requests_AptID_Status WHERE Status='Open'` | $O(A \log R)$ |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Partial / Filtered Indexes

1. **Filtered Index Optimization:** In production databases with 10 million historical closed requests and 5,000 open requests, creating a filtered index `CREATE INDEX idx_open_requests ON Requests(AptID) WHERE Status = 'Open'` reduces index size by $99.9\%$, keeping all open request data resident in L1/L2 database buffer cache.
2. **Denormalized Counters:** For millisecond-latency UI dashboards, systems maintain an asynchronous summary counter table updated via database change-data-capture (CDC / Debezium).

## Edge Cases & Production Hardening

1. **Building with Zero Apartments:** Preserved correctly with `0` open requests.
2. **Building with Apartments but Zero Requests:** Preserved correctly with `0` open requests.
