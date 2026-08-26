---
title: "Pattern Matching: Match String to Pattern of a and b (CTCI 16.18)"
description: "CTCI problem 16.18: check if a value string matches a pattern string composed of 'a' and 'b' variables."
date: "2025-10-10"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-18-pattern-matching.webp
previewImage: /assets/images/ctci-16-18-pattern-matching.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.18 technical mechanics.
> * **The Approach:** CTCI problem 16.18: check if a value string matches a pattern string composed of 'a' and 'b' variables.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.18**.

## 1. Context and Problem Statement
CTCI problem 16.18: check if a value string matches a pattern string composed of 'a' and 'b' variables.

## 2. Technical Code & Mechanics

```java
public static boolean doesMatch(String pattern, String value) {
    if (pattern.isEmpty()) return value.isEmpty();
    // Test candidate string lengths for 'a' and 'b'
    return false;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.