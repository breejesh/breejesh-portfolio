---
title: "Open Requests: SQL Left Join for Open Maintenance Requests (CTCI 14.2)"
description: "CTCI problem 14.2: SQL query returning open maintenance requests per building using LEFT JOIN and GROUP BY."
date: "2026-06-05"
tags: [Algoritmos y Estructuras, Backend y Bases de Datos]
coverImage: /assets/images/ctci-14-2-open-requests.webp
previewImage: /assets/images/ctci-14-2-open-requests.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 14.2 technical mechanics.
> * **The Approach:** CTCI problem 14.2: SQL query returning open maintenance requests per building using LEFT JOIN and GROUP BY.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **14.2**.

## 1. Context and Problem Statement
CTCI problem 14.2: SQL query returning open maintenance requests per building using LEFT JOIN and GROUP BY.

## 2. Technical Code & Mechanics

```sql
SELECT Buildings.BuildingName, COUNT(Requests.RequestID) AS OpenRequests
FROM Buildings
LEFT JOIN Apartments ON Buildings.BuildingID = Apartments.BuildingID
LEFT JOIN Requests ON Apartments.AptID = Requests.AptID AND Requests.Status = 'Open'
GROUP BY Buildings.BuildingID, Buildings.BuildingName;
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.