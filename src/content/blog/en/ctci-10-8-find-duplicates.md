---
title: "Find Duplicates: Find All Duplicates in N Numbers with 4 KB RAM (CTCI 10.8)"
description: "CTCI problem 10.8 in Java: print all duplicate numbers in an array of numbers from 1 to 32,000 using a BitSet with only 4 KB of memory."
date: "2025-08-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-8-find-duplicates.webp
previewImage: /assets/images/ctci-10-8-find-duplicates.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.8 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.8 in Java: print all duplicate numbers in an array of numbers from 1 to 32,000 using a BitSet with only 4 KB of memory.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **10.8**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 10.8 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.8:** CTCI problem 10.8 in Java: print all duplicate numbers in an array of numbers from 1 to 32,000 using a BitSet with only 4 KB of memory.

---

## 3. Optimal approach and implementation

```java
public class FindDuplicates {
    static class BitSetCustom {
        int[] bitset;
        public BitSetCustom(int size) {
            bitset = new int[(size >> 5) + 1];
        }
        public boolean get(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            return (bitset[wordNumber] & (1 << bitNumber)) != 0;
        }
        public void set(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            bitset[wordNumber] |= (1 << bitNumber);
        }
    }

    public static void checkDuplicates(int[] array) {
        BitSetCustom bs = new BitSetCustom(32000);
        for (int num : array) {
            int num0 = num - 1;
            if (bs.get(num0)) {
                System.out.println(num);
            } else {
                bs.set(num0);
            }
        }
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