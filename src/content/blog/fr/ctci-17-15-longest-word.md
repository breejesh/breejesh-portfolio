---
title: "Longest Word: Find Longest Word Built from Other Words (CTCI 17.15)"
description: "CTCI problem 17.15: find the longest word in an array that can be built by concatenating other words in the array."
date: "2025-10-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-15-longest-word.webp
previewImage: /assets/images/ctci-17-15-longest-word.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.15 technical mechanics.
> * **The Approach:** CTCI problem 17.15: find the longest word in an array that can be built by concatenating other words in the array.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.15**.

## 1. Context and Problem Statement
CTCI problem 17.15: find the longest word in an array that can be built by concatenating other words in the array.

## 2. Technical Code & Mechanics

```java
public static String printLongestWord(String[] arr) {
    Arrays.sort(arr, (a, b) -> Integer.compare(b.length(), a.length()));
    Set<String> map = new HashSet<>(Arrays.asList(arr));
    for (String word : arr) {
        if (canBuildWord(word, true, map)) return word;
    }
    return "";
}
private static boolean canBuildWord(String str, boolean isOriginal, Set<String> map) {
    if (map.contains(str) && !isOriginal) return true;
    for (int i = 1; i < str.length(); i++) {
        String left = str.substring(0, i);
        String right = str.substring(i);
        if (map.contains(left) && canBuildWord(right, false, map)) return true;
    }
    return false;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.