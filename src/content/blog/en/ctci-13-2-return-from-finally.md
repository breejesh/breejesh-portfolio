---
title: "Return from Finally: Try-Catch-Finally Execution Order in Java (CTCI 13.2)"
description: "CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution."
date: "2025-08-07"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-2-return-from-finally.webp
previewImage: /assets/images/ctci-13-2-return-from-finally.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 13.2 technical mechanics.
> * **The Approach:** CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **13.2**.

## 1. Context and Problem Statement
CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution.

## 2. Technical Code & Mechanics

```java
public static int testFinally() {
    try {
        return 1;
    } finally {
        return 2; // Finally block overrides try return, returns 2!
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.