---
title: "Factorial Zeros: Count Trailing Zeros in n! (CTCI 16.5)"
description: "CTCI problem 16.5: count trailing zeros in n! by summing factors of 5 in O(log n) time."
date: "2025-11-04"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-5-factorial-zeros.webp
previewImage: /assets/images/ctci-16-5-factorial-zeros.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.5 technical mechanics.
> * **The Approach:** CTCI problem 16.5: count trailing zeros in n! by summing factors of 5 in O(log n) time.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.5**.

## 1. Context and Problem Statement
CTCI problem 16.5: count trailing zeros in n! by summing factors of 5 in O(log n) time.

## 2. Technical Code & Mechanics

```java
public static int countFactZeros(int num) {
    int count = 0;
    if (num < 0) return -1;
    for (int i = 5; num / i > 0; i *= 5) {
        count += num / i;
    }
    return count;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.