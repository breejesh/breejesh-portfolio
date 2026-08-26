---
title: "Missing Number: Find Missing Integer from 0 to N Using Bit Operations (CTCI 17.4)"
description: "CTCI problem 17.4: find missing integer in array from 0 to N where array elements can only be accessed via fetchBit(i, j)."
date: "2026-03-23"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-4-missing-number.webp
previewImage: /assets/images/ctci-17-4-missing-number.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.4 technical mechanics.
> * **The Approach:** CTCI problem 17.4: find missing integer in array from 0 to N where array elements can only be accessed via fetchBit(i, j).
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.4**.

## 1. Context and Problem Statement
CTCI problem 17.4: find missing integer in array from 0 to N where array elements can only be accessed via fetchBit(i, j).

## 2. Technical Code & Mechanics

```java
public static int findMissing(List<BitInteger> array) {
    return findMissing(array, BitInteger.INTEGER_SIZE - 1);
}
private static int findMissing(List<BitInteger> input, int column) {
    if (column < 0) return 0;
    List<BitInteger> zeros = new ArrayList<>(input.size() / 2);
    List<BitInteger> ones = new ArrayList<>(input.size() / 2);
    for (BitInteger val : input) {
        if (val.fetchBit(column) == 0) zeros.add(val);
        else ones.add(val);
    }
    if (zeros.size() <= ones.size()) {
        int v = findMissing(zeros, column - 1);
        return (v << 1) | 0;
    } else {
        int v = findMissing(ones, column - 1);
        return (v << 1) | 1;
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.