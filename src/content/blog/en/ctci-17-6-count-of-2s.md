---
title: "Count of 2s: Count Total Occurrences of Digit 2 Between 0 and N (CTCI 17.6)"
description: "CTCI problem 17.6: count occurrences of digit 2 in all numbers from 0 to N using digit-by-digit math in O(log N) time."
date: "2025-10-16"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-6-count-of-2s.webp
previewImage: /assets/images/ctci-17-6-count-of-2s.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.6 technical mechanics.
> * **The Approach:** CTCI problem 17.6: count occurrences of digit 2 in all numbers from 0 to N using digit-by-digit math in O(log N) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.6**: count occurrences of digit 2 in all numbers from 0 to N using digit-by-digit math in O(log N) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.6: count occurrences of digit 2 in all numbers from 0 to N using digit-by-digit math in O(log N) time.

## 2. Technical Code & Mechanics

```java
public static int count2sInRange(int number) {
    int count = 0;
    int len = String.valueOf(number).length();
    for (int digit = 0; digit < len; digit++) {
        count += count2sAtDigit(number, digit);
    }
    return count;
}
private static int count2sAtDigit(int number, int d) {
    int pow10 = (int) Math.pow(10, d);
    int nextPow10 = pow10 * 10;
    int right = number % pow10;
    int roundDown = number - number % nextPow10;
    int roundUp = roundDown + nextPow10;
    int digit = (number / pow10) % 10;
    if (digit < 2) return roundDown / 10;
    if (digit == 2) return roundDown / 10 + right + 1;
    return roundUp / 10;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.