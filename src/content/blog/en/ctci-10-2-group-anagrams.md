---
title: "Group Anagrams: Sort Array of Strings so Anagrams Are Adjacent (CTCI 10.2)"
description: "CTCI problem 10.2 in Java: group an array of strings such that all anagrams are placed next to each other using HashMap bucket sorting."
date: "2026-06-19"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-2-group-anagrams.webp
previewImage: /assets/images/ctci-10-2-group-anagrams.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.2 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.2 in Java: group an array of strings such that all anagrams are placed next to each other using HashMap bucket sorting.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.2**: group an array of strings such that all anagrams are placed next to each other using HashMap bucket sorting. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.2 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.2:** CTCI problem 10.2 in Java: group an array of strings such that all anagrams are placed next to each other using HashMap bucket sorting.

---

## 3. Optimal approach and implementation

```java
public class GroupAnagrams {
    public static void sort(String[] array) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : array) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        int index = 0;
        for (List<String> list : map.values()) {
            for (String s : list) {
                array[index++] = s;
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