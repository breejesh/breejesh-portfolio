---
title: "Student Attendance: SQL Query for Student Course Grades (CTCI 14.3)"
description: "CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages."
date: "2026-02-15"
tags: [Algorithms & Data Structures, Backend & Databases]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 14.3 technical mechanics.
> * **The Approach:** CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **14.3**: SQL update query to update student attendance status and compute GPA averages. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages.

## 2. Technical Code & Mechanics

```sql
UPDATE StudentCourses
SET Status = 'Passed'
WHERE Grade >= 60;
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.