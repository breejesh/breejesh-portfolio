---
title: "Sparse Search: Binary Search with Empty String Interleaving (CTCI 10.5)"
description: "Find the location of a target string in a sorted array interspersed with empty strings using expanding-pointer binary search in O(log N) average time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---

> **TL;DR**
> * **The Book Problem:** Given a sorted array of strings that is interspersed with empty strings, write a method to find the location of a given string.
> * **The Optimal Solution:** Expanding-Pointer Binary Search: (1) Compute `mid = (first + last) / 2`; (2) If `strings[mid]` is empty `""`, expand two pointers `left = mid - 1` and `right = mid + 1` outward until finding the nearest non-empty string; (3) If all elements in range are empty, terminate search; (4) Once a non-empty `mid` is established, execute standard binary search string comparisons; (5) Runs in **$O(\log N)$ average time** and $O(N)$ worst-case time (when array is populated almost entirely by empty strings).
> * **Production Reality:** Sparse matrix and inverted document index lookups, tombstoned key lookups in log-structured storage engines, and sparse column querying in analytical databases.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.5), we are asked:

*"Given a sorted array of strings that is interspersed with empty strings, write a method to find the location of a given string."*

**Example:**
`find("ball", {"at", "", "", "", "ball", "", "", "car", "", "", "dad", "", ""})` $\to 4$

## 2. Empty String Resolution & Midpoint Adjustment

When `strings[mid]` lands on an empty string `""`, standard binary search cannot determine whether to branch left or right.

We resolve this by radiating outward from `mid`:
```
       left <── mid ──> right
["at",  "",     "",      "",   "ball", ""]
```
We take the first non-empty string encountered on either side as our adjusted `mid`. If both `left` and `right` fall out of range, the entire segment is empty, allowing immediate termination.

## Production Implementation

```java
public class SparseSearch {
    /**
     * Searches for string str in a sparse sorted array.
     * Time Complexity: O(log N) average, O(N) worst case.
     * Space Complexity: O(log N)
     */
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) {
            return -1;
        }
        return searchHelper(strings, str, 0, strings.length - 1);
    }

    private static int searchHelper(String[] strings, String str, int first, int last) {
        if (first > last) return -1;

        int mid = (last + first) / 2;

        // If mid is empty, find closest non-empty string
        if (strings[mid].isEmpty()) {
            int left = mid - 1;
            int right = mid + 1;

            while (true) {
                if (left < first && right > last) {
                    return -1; // Entire range is empty strings
                } else if (right <= last && !strings[right].isEmpty()) {
                    mid = right;
                    break;
                } else if (left >= first && !strings[left].isEmpty()) {
                    mid = left;
                    break;
                }
                left--;
                right++;
            }
        }

        // Standard binary search comparisons
        if (str.equals(strings[mid])) {
            return mid; // Found target string!
        } else if (strings[mid].compareTo(str) < 0) {
            return searchHelper(strings, str, mid + 1, last); // Search right
        } else {
            return searchHelper(strings, str, first, mid - 1); // Search left
        }
    }
}
```

## Complexity & Memory Analysis

| Case | Time Complexity | Auxiliary Space | Technical Detail |
|---|---|---|---|
| Average Case (Well-Distributed Strings) | `O(log N)` | `O(log N)` | Finding nearest non-empty string takes $O(1)$ amortized steps. |
| Worst Case (Mostly Empty Strings) | `O(N)` | `O(log N)` | Midpoint search expands across entire array length. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Tombstone Records & Compaction

1. **LSM-Tree Tombstoned Key Indexing:** In Cassandra and RocksDB, deleted keys leave empty tombstones interspersed within SSTables before garbage compaction runs. Sparse search algorithms navigate around tombstones without index rebuilding.
2. **Columnar Database Null Bitmaps (Parquet / Arrow):** Locating active values in columns containing 90%+ null records uses bitmask skipping derived from sparse search principles.

## Edge Cases & Production Hardening

1. **Target String Empty or Null:** Returns `-1` immediately.
2. **All Elements Empty (`{"", "", "", ""}`):** Pointer expansion detects boundaries and returns `-1`.
