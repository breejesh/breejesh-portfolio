---
title: "Design Grade Database: Relational Database Schema for School Grades (CTCI 14.7)"
description: "CTCI problem 14.7: complete relational database schema design for tracking students, courses, professors, and grade histories."
date: "2025-10-14"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-14-7-design-grade-database.webp
previewImage: /assets/images/ctci-14-7-design-grade-database.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 14.7 technical mechanics.
> * **The Approach:** CTCI problem 14.7: complete relational database schema design for tracking students, courses, professors, and grade histories.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **14.7**.

## 1. Context and Problem Statement
CTCI problem 14.7: complete relational database schema design for tracking students, courses, professors, and grade histories.

## 2. Technical Code & Mechanics

```sql
CREATE TABLE Students (StudentID INT PRIMARY KEY, Name VARCHAR(100));
CREATE TABLE Courses (CourseID INT PRIMARY KEY, Name VARCHAR(100));
CREATE TABLE Grades (StudentID INT, CourseID INT, Grade FLOAT, PRIMARY KEY(StudentID, CourseID));
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.