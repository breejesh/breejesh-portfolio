---
title: "Sort Big File: External Merge Sort for 20 GB File with 2 GB RAM (CTCI 10.6)"
description: "CTCI problem 10.6: design external merge sort algorithm to sort a massive 20 GB text file when system memory is restricted to 2 GB."
date: "2025-09-13"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.6 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.6: design external merge sort algorithm to sort a massive 20 GB text file when system memory is restricted to 2 GB.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.6**: design external merge sort algorithm to sort a massive 20 GB text file when system memory is restricted to 2 GB. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.6 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.6:** CTCI problem 10.6: design external merge sort algorithm to sort a massive 20 GB text file when system memory is restricted to 2 GB.

---

## 3. Optimal approach and implementation

```java
// Conceptual External Merge Sort outline
public class ExternalMergeSort {
    public void sortLargeFile(File inputFile, int memoryLimitMB) {
        List<File> sortedChunks = createSortedChunks(inputFile, memoryLimitMB);
        mergeSortedChunks(sortedChunks, new File("sorted_output.txt"));
    }

    private List<File> createSortedChunks(File file, int limitMB) {
        // Read chunk of data fitting in limitMB, sort in RAM, write to temp file
        return new ArrayList<>();
    }

    private void mergeSortedChunks(List<File> chunks, File outputFile) {
        // K-way merge using PriorityQueue reading 1 line at a time from each chunk file
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