---
title: "Missing Number: Bit-by-Bit Parity Partitioning in Linear Time (CTCI 17.4)"
description: "Find the single missing integer from 0 to N with bit-level constant-time access using recursive column-parity elimination in O(N) geometric time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-4-missing-number.webp
previewImage: /assets/images/ctci-17-4-missing-number.webp
---

> **TL;DR**
> * **The Book Problem:** An array contains all integers from $0$ to $n$, except for one missing number. You cannot access a full integer directly; you can only query the $j$-th bit of $A[i]$ in $O(1)$ time via `fetch(i, j)`. Find the missing integer in $O(n)$ time.
> * **The Optimal Solution:** **Recursive Column-Parity Halving**:
>   1. In a complete range $0..n$, the count of $0$s at the Least Significant Bit (LSB, column $0$) is always greater than or equal to the count of $1$s:
>      $$\text{count}(0) \ge \text{count}(1)$$
>   2. Count the LSB bits of all elements in the array:
>      * If $\text{count}(0) \le \text{count}(1)$, the removed number must have had an LSB of **$0$**. Filter the list to retain only numbers with LSB $= 0$ and recurse on column $1$.
>      * If $\text{count}(0) > \text{count}(1)$, the removed number must have had an LSB of **$1$**. Filter the list to retain only numbers with LSB $= 1$ and recurse on column $1$.
>   3. Reconstruct the missing value: $\text{missing} = (\text{recurse}(\text{filtered}, \text{col} + 1) \ll 1) \mid \text{bit}$.
>   4. **Geometric Time Series**: $T(n) = n + \frac{n}{2} + \frac{n}{4} + \cdots = 2n = O(n)$ time and $O(n)$ space.
> * **Production Reality:** Fault-tolerant memory parity checking, ECC memory bit-flip detection, and compressed column-store bitvector queries (Apache Parquet).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.4), we are given a `BitInteger` abstraction where full numbers cannot be read in a single cycle:

*"Find the missing number from 0 to n in O(n) bit-level accesses using only fetch(i, j)."*

## 2. Bit Partitioning Recurrence

```
Full Sequence (0 .. 7 in Binary):
  0: 0 0 0    4: 1 0 0
  1: 0 0 1    5: 1 0 1
  2: 0 1 0    6: 1 1 0
  3: 0 1 1    7: 1 1 1

Column 0 (LSB): 4 zeros, 4 ones (count(0) >= count(1))
If number 5 (101) is removed:
  Remaining Column 0: 4 zeros, 3 ones  ──> count(0) > count(1)  ──> Missing LSB is 1!
  Discard all elements with LSB = 0 (size reduced to N/2).
  Recurse on Column 1 with elements {1, 3, 7}.
```

## Production Java Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class MissingNumberFinder {

    public interface BitInteger {
        int fetch(int column); // Returns 0 or 1 at given bit column
    }

    /**
     * Finds missing number in O(N) total bit accesses.
     */
    public static int findMissing(List<BitInteger> array) {
        return findMissingHelper(array, 0);
    }

    private static int findMissingHelper(List<BitInteger> input, int column) {
        // Base case: Maximum 32-bit integer reached
        if (column >= 32 || input.isEmpty()) {
            return 0;
        }

        List<BitInteger> zeros = new ArrayList<>(input.size() / 2);
        List<BitInteger> ones = new ArrayList<>(input.size() / 2);

        for (BitInteger num : input) {
            if (num.fetch(column) == 0) {
                zeros.add(num);
            } else {
                ones.add(num);
            }
        }

        // Parity analysis: in 0..N, count(0) >= count(1)
        if (zeros.size() <= ones.size()) {
            // Missing number has 0 in this bit column
            int v = findMissingHelper(zeros, column + 1);
            return (v << 1) | 0;
        } else {
            // Missing number has 1 in this bit column
            int v = findMissingHelper(ones, column + 1);
            return (v << 1) | 1;
        }
    }
}
```

## Complexity Analysis

| Metric | Complexity | Mathematical Derivation |
|---|---|---|
| Time Complexity | `O(N)` | Geometric series: $N + N/2 + N/4 + \cdots = N \sum_{i=0}^\infty (1/2)^i = 2N$. |
| Auxiliary Space | `O(N)` | Lists holding halved subsets at each recursion depth. |
| Total Bit Accesses | $\le 2N$ | Strictly linear bit-level memory reads. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Columnar Databases & ECC RAM

1. **Parquet / ORC Column Bit-Vectors:** In columnar analytics engines (Apache Arrow / ClickHouse), dictionary-encoded integer arrays evaluate queries directly over compressed bit-vectors by filtering columns sequentially without materializing whole rows.
2. **Error-Correcting Code (ECC) Memory:** Hardware parity checkers isolate bit-flips in DRAM memory arrays using orthogonal parity-check matrices (Hamming codes).

## Edge Cases & Production Hardening

1. **Missing Zero:** If $0$ is missing, $\text{zeros.size}() \le \text{ones.size}()$ triggers on all bit columns, correctly assembling $0$.
2. **Missing $N$:** Evaluated accurately across all bit positions.
