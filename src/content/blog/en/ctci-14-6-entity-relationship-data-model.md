---
title: "Entity-Relationship Data Modeling: Professional Career Network Schemas in SQL (CTCI 14.6)"
description: "Design a normalized Entity-Relationship (ER) data model for professional career networks (Companies, People, Jobs) with DDL schemas and M:N cardinalities."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
previewImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
---

> **TL;DR**
> * **The Book Problem:** Draw an Entity-Relationship (ER) diagram for a database with Companies, People, and Professionals (people who have had jobs at companies).
> * **The Optimal Solution:** **Normalized Relational Entity Modeling**:
>   1. **`People` Entity**: Core human identity (`PersonID (PK)`, `FirstName`, `LastName`, `Email`).
>   2. **`Companies` Entity**: Corporate organizations (`CompanyID (PK)`, `CompanyName`, `Industry`).
>   3. **`Professionals` (Inheritance / Role)**: Modeled either as a 1:1 subtype table sharing `PersonID`, or defined logically as any `Person` with at least 1 record in `JobHistory`.
>   4. **`JobHistory` (M:N Junction)**: Connects `People` to `Companies` (`PositionID (PK)`, `PersonID (FK)`, `CompanyID (FK)`, `Title`, `StartDate`, `EndDate`).
>   5. **`Education` (M:N Junction)**: Connects `People` to `Schools` (`Degree`, `GraduationYear`).
> * **Production Reality:** LinkedIn professional graph schemas, Workday HRIS databases, and applicant tracking systems (ATS).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 14.6), we are asked:

*"Design an Entity-Relationship (ER) diagram and relational SQL database schema for a system tracking People, Companies, Professionals, and employment histories."*

## 2. Entity-Relationship (ER) Architecture

```
┌──────────────────────────┐                   ┌──────────────────────────┐
│ People                   │                   │ Companies                │
├──────────────────────────┤                   ├──────────────────────────┤
│ PersonID (PK)            │                   │ CompanyID (PK)           │
│ FirstName, LastName      │                   │ CompanyName, Industry    │
│ Email, Phone             │                   │ HeadquartersAddress      │
└─────────────┬────────────┘                   └─────────────┬────────────┘
              │ 1                                            │ 1
              │                                              │
              │ ∞                                            │ ∞
              └───────────────────┐    ┌─────────────────────┘
                                  ▼    ▼
                    ┌──────────────────────────────────┐
                    │ JobHistory (M:N Junction)        │
                    ├──────────────────────────────────┤
                    │ PositionID (PK)                  │
                    │ PersonID (FK -> People)          │
                    │ CompanyID (FK -> Companies)      │
                    │ Title (e.g. Staff Engineer)      │
                    │ StartDate, EndDate (NULL=Current)│
                    └──────────────────────────────────┘
```

## Production DDL Implementation

```sql
-- 1. Base Human Entity
CREATE TABLE People (
    PersonID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(30),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Corporate Entity
CREATE TABLE Companies (
    CompanyID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL,
    Industry VARCHAR(100),
    HeadquartersCity VARCHAR(100),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employment History Junction Table (Many-to-Many)
CREATE TABLE JobHistory (
    PositionID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PersonID BIGINT NOT NULL REFERENCES People(PersonID) ON DELETE CASCADE,
    CompanyID BIGINT NOT NULL REFERENCES Companies(CompanyID) ON DELETE RESTRICT,
    Title VARCHAR(150) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE, -- NULL indicates current active role
    CONSTRAINT chk_dates CHECK (EndDate IS NULL OR EndDate >= StartDate)
);

-- 4. Fast Lookups via Composite Indexes
CREATE INDEX idx_job_history_person ON JobHistory(PersonID, StartDate DESC);
CREATE INDEX idx_job_history_company ON JobHistory(CompanyID, StartDate DESC);
```

## Modeling the "Professional" Subtype

There are two primary architectural patterns to model `Professionals`:

| Approach | Architecture | Tradeoff |
|---|---|---|
| **Approach A: Dynamic View (Recommended)** | `CREATE VIEW Professionals AS SELECT DISTINCT p.* FROM People p INNER JOIN JobHistory j ON p.PersonID = j.PersonID;` | Zero storage overhead; automatically updates as people gain job experience. |
| **Approach B: 1:1 Subtype Table** | `CREATE TABLE Professionals (PersonID BIGINT PRIMARY KEY REFERENCES People(PersonID), Summary TEXT);` | Useful when professionals have distinct attributes (e.g. professional certifications). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Bitemporal History Tracking

1. **Temporal History (SCD Type 2):** In enterprise HR systems, promotions, title changes, and salary adjustments are recorded with valid-time ranges (`ValidFrom`, `ValidTo`) to reconstruct historical organizational charts at any point in the past.
2. **Graph Database Projections:** Professional networks project these SQL tables into graph databases (Neo4j / Amazon Neptune) to compute 2nd and 3rd-degree connection paths in sub-millisecond latencies.

## Edge Cases & Production Hardening

1. **Overlapping Concurrent Jobs:** If multiple simultaneous roles are permitted (e.g. Advisory board + Full-time), omit unique constraints on active roles.
2. **Referential Integrity on Company Deletion:** Use `ON DELETE RESTRICT` on `Companies` to prevent accidental deletion of historical employer records.
