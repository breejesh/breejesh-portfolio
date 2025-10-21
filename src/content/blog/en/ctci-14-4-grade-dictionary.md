---
title: "Grade Dictionary: Outer Joins and Aggregations (CTCI 14.4)"
description: "CTCI problem 14.4: writing SQL queries to join Students, Courses, and Teachers with aggregate functions."
date: "2025-10-21"
tags: [Algorithms]
coverImage: /assets/images/ctci-14-4-grade-dictionary.webp
previewImage: /assets/images/ctci-14-4-grade-dictionary.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 14.4 technical mechanics.
> * **The Approach:** CTCI problem 14.4: writing SQL queries to join Students, Courses, and Teachers with aggregate functions.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **14.4**.

## 1. Context and Problem Statement
CTCI problem 14.4: writing SQL queries to join Students, Courses, and Teachers with aggregate functions.

## 2. Technical Code & Mechanics

```java
SELECT Students.StudentName, Courses.CourseName, StudentCourses.Grade
FROM Students
INNER JOIN StudentCourses ON Students.StudentID = StudentCourses.StudentID
INNER JOIN Courses ON StudentCourses.CourseID = Courses.CourseID;
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.