---
title: "Close All Requests: Multi-Table Relational Batch Updates in SQL (CTCI 14.3)"
description: "Execute safe, atomic multi-table batch update operations in SQL to close maintenance requests for a target building with subquery filtering and foreign key indexing."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---

> **TL;DR**
> * **The Book Problem:** Close all requests for apartments in building #11.
> * **The Optimal Solution:** **Atomic Batch UPDATE with Subquery / JOIN Filtering**:
>   1. **Subquery Approach**: `UPDATE Requests SET Status = 'Closed' WHERE AptID IN (SELECT AptID FROM Apartments WHERE BuildingID = 11)`;
>   2. **Direct JOIN Approach (T-SQL / PostgreSQL)**: `UPDATE Requests r SET Status = 'Closed' FROM Apartments a WHERE r.AptID = a.AptID AND a.BuildingID = 11`;
>   3. **ACID Invariants**: Wrap the batch modification in an explicit database transaction (`BEGIN TRANSACTION ... COMMIT`) with row-level write locks to prevent deadlocks and partial update corruptions.
> * **Production Reality:** Automated bulk operational closures in property management and incident management systems.

## 1. The Book Problem Formulation & Schema

In *Cracking the Coding Interview* (Problem 14.3), we are asked:

*"Close all maintenance requests for apartments located in building #11."*

```
[Buildings] ──> [Apartments] ──> [Requests]
 BuildingID=11   AptID            RequestID, Status, AptID
```

## 2. Relational Mutation Mechanics

Updating records in a child table (`Requests`) based on an attribute in a grandparent table (`Buildings`) requires navigating the foreign key hierarchy:

```
[Target: BuildingID = 11]
           │
           ▼ (Find all AptIDs in Building 11)
[Apartments: AptID 101, 102, 103]
           │
           ▼ (Bulk UPDATE Status = 'Closed')
[Requests: RequestID #501, #502, #503]
```

## Production SQL Implementations

### Approach 1: Subquery IN (Standard ANSI SQL)

```sql
BEGIN TRANSACTION;

UPDATE Requests
SET Status = 'Closed'
WHERE AptID IN (
    SELECT AptID
    FROM Apartments
    WHERE BuildingID = 11
);

COMMIT;
```

### Approach 2: Direct JOIN Update (PostgreSQL / SQL Server)

```sql
-- PostgreSQL Syntax
UPDATE Requests r
SET Status = 'Closed'
FROM Apartments a
WHERE r.AptID = a.AptID
  AND a.BuildingID = 11
  AND r.Status <> 'Closed'; -- Idempotency optimization: skips already closed records

-- MySQL Syntax
UPDATE Requests r
INNER JOIN Apartments a ON r.AptID = a.AptID
SET r.Status = 'Closed'
WHERE a.BuildingID = 11;
```

## Execution Plan & Locking Analysis

| Stage | Action | Index Utilized | Lock Type |
|---|---|---|---|
| 1. Find Apartments | Index seek for `BuildingID = 11` | `IX_Apartments_BuildingID` | Shared Lock (`S`) |
| 2. Locate Requests | Index seek for matching `AptID` | `IX_Requests_AptID` | Intent Exclusive (`IX`) |
| 3. Mutate Status | In-place page update + WAL write | Clustered Primary Key | Exclusive Row Lock (`X`) |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: High-Volume Batch Chunking

1. **Lock Escalation Defense:** Updating 500,000 requests in a single monolithic statement can cause the database lock manager to escalate row locks to an Exclusive Table Lock (`X`), freezing all concurrent user traffic. Production systems chunk batch updates into smaller transactions:
   ```sql
   -- Chunked batching loop
   WHILE (1=1) BEGIN
       UPDATE TOP (1000) Requests
       SET Status = 'Closed'
       WHERE Status = 'Open' AND AptID IN (SELECT AptID FROM Apartments WHERE BuildingID = 11);
       IF @@ROWCOUNT = 0 BREAK;
   END
   ```
2. **Write-Ahead Logging (WAL) Overhead:** Batched updates generate WAL logs; skipping already-closed rows (`AND Status <> 'Closed'`) avoids redundant disk I/O.

## Edge Cases & Production Hardening

1. **Building Has No Open Requests:** Update executes safely with zero rows affected.
2. **Concurrent Request Creation:** Wrapped in a transaction with appropriate isolation level (`READ COMMITTED` or `REPEATABLE READ`).
