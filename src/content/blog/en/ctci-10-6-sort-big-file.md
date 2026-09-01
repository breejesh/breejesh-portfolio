---
title: "Sort Big File: External Merge Sort for Terabyte-Scale Data (CTCI 10.6)"
description: "Sort a 20 GB file with one string per line under strict RAM constraints using External Merge Sort and a K-way Min-Heap merge pipeline in O(N log N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine you have a 20 GB file with one string per line. Explain how you would sort the file.
> * **The Optimal Solution:** **External Merge Sort with K-Way Min-Heap**: (1) **Chunk Partitioning**: Divide the 20 GB file into $K = 20$ chunks of $1\text{ GB}$ (fitting comfortably in RAM); (2) **In-Memory Run Sorting**: Read each chunk into memory, sort it with TimSort / Quicksort, and write the sorted run to disk (`chunk_0.txt` ... `chunk_19.txt`); (3) **K-Way Merge**: Open buffered readers for all $K$ runs and insert the first element of each into a Min-Heap (`PriorityQueue`) of size $K$; (4) Repeatedly extract the minimum string, write it to the final sorted output, and pull the next line from that stream; (5) Executes in **$O(N \log N)$ total time** and strictly **$O(M)$ RAM space** (where $M$ is chunk buffer size).
> * **Production Reality:** Core sorting mechanism in PostgreSQL / MySQL external sort, Apache Hadoop MapReduce shuffle/sort phase, and ClickHouse table merges.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.6), we are asked:

*"Imagine you have a 20 GB file with one string per line. Explain how you would sort the file."*

## 2. External Merge Sort Architecture

Because the dataset size ($20\text{ GB}$) exceeds available process memory limits (e.g. $4\text{ GB}$ heap), in-memory sorting algorithms cannot be directly applied.

```
[20 GB Raw File]
      │
      ▼
┌───────────────┐
│ Chunk Splitting│ ──> Read 1 GB into RAM ──> Sort ──> Write sorted run to disk
└───────────────┘
      │
      ▼
[20 Sorted Chunks on Disk: 1 GB each]
      │
      ▼
┌──────────────────┐
│ K-Way Min-Heap   │ ──> Pop smallest ──> Write to Final Output File
│ (Size K = 20)    │ ──> Refill stream buffer from corresponding chunk file
└──────────────────┘
```

## Production Implementation

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

public class ExternalMergeSort {
    public static class HeapEntry implements Comparable<HeapEntry> {
        public final String value;
        public final int chunkIndex;

        public HeapEntry(String v, int idx) {
            this.value = v;
            this.chunkIndex = idx;
        }

        @Override
        public int compareTo(HeapEntry other) {
            return this.value.compareTo(other.value);
        }
    }

    /**
     * Executes K-Way merge across sorted chunk files.
     * Time Complexity: O(N log K)
     * Space Complexity: O(K * BufferSize)
     */
    public static void mergeSortedChunks(List<File> chunkFiles, File outputFile) throws IOException {
        int k = chunkFiles.size();
        BufferedReader[] readers = new BufferedReader[k];
        PriorityQueue<HeapEntry> minHeap = new PriorityQueue<>(k);

        try {
            // Initialize readers and load first element from each chunk
            for (int i = 0; i < k; i++) {
                readers[i] = new BufferedReader(new FileReader(chunkFiles.get(i)), 65536); // 64KB buffer
                String line = readers[i].readLine();
                if (line != null) {
                    minHeap.add(new HeapEntry(line, i));
                }
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile), 65536)) {
                while (!minHeap.isEmpty()) {
                    HeapEntry entry = minHeap.poll();
                    writer.write(entry.value);
                    writer.newLine();

                    // Read next line from the chunk that produced this entry
                    String nextLine = readers[entry.chunkIndex].readLine();
                    if (nextLine != null) {
                        minHeap.add(new HeapEntry(nextLine, entry.chunkIndex));
                    }
                }
            }
        } finally {
            for (BufferedReader r : readers) {
                if (r != null) r.close();
            }
            for (File f : chunkFiles) {
                f.delete(); // Cleanup intermediate chunks
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Phase | Time Complexity | Auxiliary RAM | Disk I/O |
|---|---|---|---|
| Phase 1: Chunk Sort | `O(N log(N / K))` | `O(M)` (1 GB Buffer) | 1 full read + 1 full write of 20 GB. |
| Phase 2: K-Way Merge | `O(N log K)` | `O(K * 64KB)` ($\approx 1.3\text{ MB}$) | 1 full read + 1 full write of 20 GB. |
| **Total Pipeline** | **$O(N \log N)$** | **$O(M)$** | **2 Sequential Passes** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Relational External Sorters

1. **PostgreSQL / MySQL `work_mem` Spilling:** When an `ORDER BY` query exceeds `work_mem` (e.g. 64 MB), database engines automatically spawn temporary disk files and invoke external merge sort.
2. **Hadoop MapReduce Sort Phase:** Mappers write sorted partition files to local disk; reducers perform $K$-way merges over HTTP stream feeds.

## Edge Cases & Production Hardening

1. **File Descriptor Exhaustion:** If $K$ is very large ($K > 1024$), perform multi-pass hierarchical tree merges (merge 32 files at a time).
2. **Buffer Sizing:** Configured 64 KB buffered streams prevent disk head thrashing during concurrent reads.
