---
title: "URLify: Replacing Spaces with '%20' In-Place from the Back (CTCI 1.3)"
description: "How to replace all spaces in a string with '%20' in-place using a two-pointer backwards merge algorithm in O(N) time without extra string allocations."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-3-urlify.webp
previewImage: /assets/images/ctci-1-3-urlify.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to replace all spaces in a string with '%20'. You are given the "true" length of the string and sufficient buffer at the end.
> * **The Breakthrough:** Count spaces to calculate `newLength = trueLength + spaces * 2`. Scan backwards from `trueLength - 1`, writing characters into `newLength - 1`, expanding `' '` into `'0'`, `'2'`, `'%'` in-place in $O(N)$ time.
> * **Production Reality:** HTTP URI percent-encoding in web servers (Nginx) and kernel socket URL parsers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.3), we are asked:

*"Write a method to replace all spaces in a string with '%20'. You are given the 'true' length of the string and an array with sufficient trailing buffer space."*

Example: `"Mr John Smith    ", 13` $\to$ `"Mr%20John%20Smith"`.

## 2. Why Forward Shifting Fails & The Reverse Write Solution

Replacing spaces starting from index 0 requires shifting all subsequent characters 2 positions to the right on every space encountered, degrading to $O(N^2)$ time.

*Optimal Backward Pass:* We compute final length `newLength = trueLength + (spaceCount * 2)`. Moving backward, we copy non-space characters directly to `newLength - 1`, and when a space is encountered, write `'0'`, `'2'`, `'%'` backwards without shifting.

## Production Implementation

```java
public class URLify {
    /**
     * Replaces spaces with '%20' in-place in a character array.
     * Time: O(N)
     * Space: O(1) auxiliary space
     */
    public static void replaceSpaces(char[] str, int trueLength) {
        int spaceCount = 0;
        for (int i = 0; i < trueLength; i++) {
            if (str[i] == ' ') spaceCount++;
        }

        int index = trueLength + spaceCount * 2;
        if (trueLength < str.length) str[trueLength] = '\0'; // End of original string

        for (int i = trueLength - 1; i >= 0; i--) {
            if (str[i] == ' ') {
                str[index - 1] = '0';
                str[index - 2] = '2';
                str[index - 3] = '%';
                index -= 3;
            } else {
                str[index - 1] = str[i];
                index -= 1;
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Two linear passes (one count, one reverse write). |
| Auxiliary Space | `O(1)` | Operates directly within allocated character buffer. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: HTTP URI Percent Encoding (RFC 3986)

Nginx, Envoy, and Netty web servers perform in-place URL percent-encoding and decoding on raw socket byte buffers to avoid allocating temporary string objects on high-throughput request paths.

## Edge Cases & Production Hardening

1. No spaces in string: Index remains equal to trueLength, array untouched.
2. Multiple consecutive spaces: Expanded to `%20%20` correctly.
