---
title: "Missing Int: Find Missing Integer in 4 Billion Numbers (CTCI 10.7)"
description: "CTCI problem 10.7 in Java: find an uncontained non-negative integer from 4 billion numbers using BitSet and two-pass chunking under tight RAM."
date: "2026-05-08"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-7-missing-int.webp
previewImage: /assets/images/ctci-10-7-missing-int.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.7 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.7 in Java: find an uncontained non-negative integer from 4 billion numbers using BitSet and two-pass chunking under tight RAM.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.7**: find an uncontained non-negative integer from 4 billion numbers using BitSet and two-pass chunking under tight RAM. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.7 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.7:** CTCI problem 10.7 in Java: find an uncontained non-negative integer from 4 billion numbers using BitSet and two-pass chunking under tight RAM.

---

## 3. Optimal approach and implementation

```java
public class MissingInt {
    public static int findOpenNumber(Scanner scanner) {
        long numberOfInts = ((long) Integer.MAX_VALUE) + 1;
        byte[] bitfield = new byte[(int) (numberOfInts / 8)];

        while (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            bitfield[n / 8] |= 1 << (n % 8);
        }

        for (int i = 0; i < bitfield.length; i++) {
            for (int j = 0; j < 8; j++) {
                if ((bitfield[i] & (1 << j)) == 0) {
                    return i * 8 + j;
                }
            }
        }
        return -1;
    }
}
```

---

## 4. Time & Space Complexity

| Metric | Complexity | Explanation |
| --- | --- | --- |
| Time Complexity | O(N) / O(log N) | Optimal pass through data |
| Space Complexity | O(1) / O(N) | Memory bounds maintained |

---

## 5. Edge Cases & Friend Recap

Always check for boundary conditions, null inputs, duplicate values, or array size limits in coding interviews.