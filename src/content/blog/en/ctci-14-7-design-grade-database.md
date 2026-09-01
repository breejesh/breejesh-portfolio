---
title: "Design Grade Database: Student GPA Analytics and Percentile Ranking Queries in SQL (CTCI 14.7)"
description: "Design a relational student grading schema in 3NF and compute the top 10% honors student cohort using SQL window functions (PERCENT_RANK / CUME_DIST)."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-14-7-design-grade-database.webp
previewImage: /assets/images/ctci-14-7-design-grade-database.webp
---

> **TL;DR**
> * **The Book Problem:** Design a database for a school system to track students, courses, teachers, and grades. Write a SQL query to find the top 10% of students based on GPA.
> * **The Optimal Solution:** **3NF Relational Schema + Window Ranking Function**:
>   1. **Schema Design**: Entities `Students`, `Courses`, `Teachers`, and junction table `CourseEnrollment` containing `Grade` and `Credits`.
>   2. **GPA Computation**: Weighted GPA calculation: $\text{GPA} = \frac{\sum (\text{Grade} \times \text{Credits})}{\sum \text{Credits}}$ grouped by `StudentID`.
>   3. **Top 10% Percentile Ranking**: Use modern SQL analytical window functions `PERCENT_RANK() OVER (ORDER BY GPA DESC)` or `CUME_DIST()`, filtering with `WHERE PctRank <= 0.10`.
>   4. Runs in **$O(N \log N)$ database query time** using index sorting.
> * **Production Reality:** University Student Information Systems (SIS), academic honors dean's list generators, and scholarship eligibility pipelines.

## 1. The Book Problem Formulation & Schema

In *Cracking the Coding Interview* (Problem 14.7), we are asked:

*"Design a database for a school system to track students, courses, teachers, and grades. Then, write a query to find the top 10% of students based on GPA."*

```
[Students] ────────1:N────────┐
                              ▼
[Courses]  ────────1:N──> [CourseEnrollment] (Grade, Credits)
                              ▲
[Teachers] ────────1:N────────┘
```

## 2. Production DDL Schema

```sql
CREATE TABLE Students (
    StudentID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StudentName VARCHAR(100) NOT NULL,
    EnrollmentDate DATE NOT NULL
);

CREATE TABLE Courses (
    CourseID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CourseName VARCHAR(100) NOT NULL,
    Credits INT NOT NULL CHECK (Credits > 0)
);

CREATE TABLE Teachers (
    TeacherID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TeacherName VARCHAR(100) NOT NULL
);

CREATE TABLE CourseEnrollment (
    EnrollmentID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StudentID BIGINT NOT NULL REFERENCES Students(StudentID) ON DELETE CASCADE,
    CourseID BIGINT NOT NULL REFERENCES Courses(CourseID) ON DELETE RESTRICT,
    TeacherID BIGINT NOT NULL REFERENCES Teachers(TeacherID) ON DELETE RESTRICT,
    Term VARCHAR(20) NOT NULL,
    Grade NUMERIC(3, 2) NOT NULL CHECK (Grade >= 0.00 AND Grade <= 4.00),
    CONSTRAINT uq_student_course_term UNIQUE (StudentID, CourseID, Term)
);

CREATE INDEX idx_enrollment_student_grade ON CourseEnrollment(StudentID, Grade);
```

## 3. Top 10% GPA Query Implementations

### Approach 1: Modern SQL Window Function (`PERCENT_RANK`)

```sql
WITH StudentGPA AS (
    SELECT 
        e.StudentID,
        -- Weighted GPA Calculation
        SUM(e.Grade * c.Credits) / SUM(c.Credits) AS GPA
    FROM CourseEnrollment e
    INNER JOIN Courses c ON e.CourseID = c.CourseID
    GROUP BY e.StudentID
    HAVING SUM(c.Credits) > 0
),
RankedCohort AS (
    SELECT 
        StudentID,
        GPA,
        PERCENT_RANK() OVER (ORDER BY GPA DESC) AS PctRank
    FROM StudentGPA
)
SELECT 
    s.StudentID,
    s.StudentName,
    ROUND(r.GPA, 2) AS FinalGPA,
    ROUND((r.PctRank * 100)::numeric, 1) AS PercentileTier
FROM RankedCohort r
INNER JOIN Students s ON r.StudentID = s.StudentID
WHERE r.PctRank <= 0.10
ORDER BY r.GPA DESC;
```

### Approach 2: Subquery with Variable Threshold (Older SQL / MySQL 5.7)

```sql
SELECT 
    s.StudentID,
    s.StudentName,
    gpa_table.GPA
FROM (
    SELECT 
        StudentID,
        AVG(Grade) AS GPA
    FROM CourseEnrollment
    GROUP BY StudentID
) gpa_table
INNER JOIN Students s ON gpa_table.StudentID = s.StudentID
WHERE gpa_table.GPA >= (
    -- Compute 90th percentile GPA cutoff value
    SELECT MIN(TopCutoff.GPA)
    FROM (
        SELECT TOP (10) PERCENT AVG(Grade) AS GPA
        FROM CourseEnrollment
        GROUP BY StudentID
        ORDER BY GPA DESC
    ) TopCutoff
)
ORDER BY gpa_table.GPA DESC;
```

## Performance & Execution Plan Analysis

| Stage | Operation | Algorithm | Complexity |
|---|---|---|---|
| 1. Compute GPAs | Hash Aggregate over `CourseEnrollment` | In-Memory Hash Table | $O(E)$ rows |
| 2. Window Sort | Quicksort / TimSort over student GPAs | Window Aggregator | $O(S \log S)$ |
| 3. Percent Filter | Stream filter `PctRank <= 0.10` | Linear pass | $O(S)$ |
| 4. Fetch Names | Index seek into `Students` | Clustered Index Seek | $O(K \times 1)$ |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Precomputed Cumulative GPA Caching

1. **Academic Analytics Pipelines:** Calculating weighted GPAs on the fly across 50,000 students and 1,000,000 grade records is computationally prohibitive during registration periods. SIS systems store precomputed `CumulativeGPA` on the `Students` table, refreshed asynchronously at term end.
2. **Tie-Breaker Invariants:** In scholarship allocations, students with identical GPAs at the 10% cutoff boundary must either all be included (`DENSE_RANK()`) or sorted by secondary criteria (e.g. total honors credits).

## Edge Cases & Production Hardening

1. **Zero Graded Credits:** Handled via `HAVING SUM(Credits) > 0` preventing division-by-zero errors.
2. **Small Class Cohorts ($N < 10$):** `PERCENT_RANK()` gracefully assigns 0.0 to the highest-ranking student, always returning at least the valedictorian.
