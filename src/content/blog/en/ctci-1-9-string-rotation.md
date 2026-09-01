---
title: "String Rotation: Check If One String Is a Rotation of Another (CTCI 1.9)"
description: "Determine if s2 is a rotation of s1 using exactly one call to isSubstring via string self-concatenation in O(N) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-9-string-rotation.webp
previewImage: /assets/images/ctci-1-9-string-rotation.webp
---

> **TL;DR**
> * **The Book Problem:** Assume you have a method `isSubstring` which checks if one word is a substring of another. Given two strings, `s1` and `s2`, write code to check if `s2` is a rotation of `s1` using only one call to `isSubstring` (e.g., `'waterbottle'` is a rotation of `'erbottlewat'`).
> * **The Core Breakthrough:** If $s_2$ is a rotation of $s_1$, then $s_1$ can be split into two parts $x$ and $y$ such that $s_1 = xy$ and $s_2 = yx$. By concatenating $s_1$ with itself ($s_1s_1 = xyxy$), $yx$ ($s_2$) is guaranteed to be a contiguous substring of $s_1s_1$.
> * **Production Reality:** Circular buffer wrapping in kernel IPC rings, network token ring synchronization, and circular genome sequence alignment in computational biology.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.9), we are asked:

*"Assume you have a method isSubstring which checks if one word is a substring of another. Given two strings, s1 and s2, write code to check if s2 is a rotation of s1 using only one call to isSubstring (e.g., 'waterbottle' is a rotation of 'erbottlewat')."*

**Mathematical Foundation:**
If $s_2$ is a rotation of $s_1$, there exists a rotation point that splits $s_1$ into two slices:
* $s_1 = x + y$ (e.g., $x = \text{"wat"}$, $y = \text{"erbottle"}$)
* $s_2 = y + x$ (e.g., $y = \text{"erbottle"}$, $x = \text{"wat"}$)

Consider the concatenation $s_1s_1$:
$$s_1s_1 = s_1 + s_1 = (x + y) + (x + y) = x + (y + x) + y = x + s_2 + y$$

Because $s_2 = yx$, $s_2$ is clearly a substring of $s_1s_1$. Therefore, checking `isSubstring(s1s1, s2)` verifies the rotation property in exactly one invocation.

## 2. The Naive Approach & Inefficiencies

A brute-force solution would generate all $N$ cyclic rotations of $s_1$ by shifting characters one position at a time and comparing each against $s_2$:
* **Time Complexity:** $O(N^2)$ due to $N$ rotations each requiring an $O(N)$ string comparison.
* **Space Complexity:** $O(N)$ to allocate each rotated string variant.

Generating rotations individually wastes CPU cycles and violates the constraint to use only one call to `isSubstring`.

## 3. Optimal Algorithmic Mechanics

1. Check if both strings are of equal non-zero length. If lengths differ or strings are empty, return `false` immediately in $O(1)$ time.
2. Concatenate $s_1$ with itself: `String s1s1 = s1 + s1`.
3. Invoke `isSubstring(s1s1, s2)` (or `s1s1.contains(s2)` in standard libraries) and return the boolean result.

## Production Implementation

```java
public class StringRotation {
    /**
     * Checks if s2 is a cyclic rotation of s1 using exactly one substring check.
     * Time Complexity: O(N) assuming isSubstring runs in O(N + M) time.
     * Space Complexity: O(N) to store concatenated string s1s1.
     */
    public static boolean isRotation(String s1, String s2) {
        int len = s1 != null ? s1.length() : 0;

        // Check that s1 and s2 are equal, non-zero length
        if (len == s2.length() && len > 0) {
            // Concatenate s1 and s1 within new buffer
            String s1s1 = s1 + s1;
            return isSubstring(s1s1, s2);
        }

        return false;
    }

    /**
     * Helper method to check if sub is a substring of big.
     */
    public static boolean isSubstring(String big, String sub) {
        return big.contains(sub);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Creating $s_1s_1$ takes $O(N)$ time. Substring search (KMP / Boyer-Moore / Rabin-Karp) takes $O(2N + N) = O(N)$. |
| Auxiliary Space | `O(N)` | Allocates memory for the doubled string $s_1s_1$ of length $2N$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Ring Buffers and Circular Sequences

1. **Lock-Free Ring Buffers (LMAX Disruptor / Linux Kfifo):** Circular ring buffers wrap head and tail indices using modulo arithmetic (`idx % buffer_size`). The concatenation concept mirrors doubling buffer memory maps (`mmap`) to allow contiguous reads across the wrap-around boundary without branching.
2. **Circular DNA Plasmids in Bioinformatics:** Bacterial genomes and plasmids are circular DNA rings. Alignment tools match gene markers by creating doubled sequence windows.
3. **Network Token Ring Topology:** Token rotation and fault detection in cyclic routing networks.

## Edge Cases & Production Hardening

1. **Different lengths (`"water"`, `"waterbottle"`):** Returns `false` in $O(1)$ time.
2. **Empty strings (`""`, `""`):** Handled by `len > 0` check, returning `false`.
3. **Identical strings (`"apple"`, `"apple"`):** Rotation by 0 positions, returns `true`.
4. **Single character strings (`"a"`, `"a"`):** Returns `true`.
5. **Null strings:** Guarded by null checks before length invocation.
