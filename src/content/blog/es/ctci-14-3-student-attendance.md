---
title: "Student Attendance: SQL Query for Student Course Grades (CTCI 14.3)"
description: "CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages."
date: "2026-02-15"
tags: [Algorithms]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 14.3 technical mechanics.
> * **The Approach:** CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **14.3**.

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