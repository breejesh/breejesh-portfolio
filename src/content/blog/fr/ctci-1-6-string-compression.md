---
title: "String Compression: Run-Length Encoding in O(N) Time (CTCI 1.6)"
description: "Perform basic string compression using the counts of repeated characters (e.g. aabcccccaaa -> a2b1c5a3), returning the original string if compressed length is not shorter."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-6-string-compression.webp
previewImage: /assets/images/ctci-1-6-string-compression.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a method to perform basic string compression using counts of repeated characters. If compressed string is not smaller than original, return original.
> * **The Core Breakthrough:** StringBuilder Pre-allocation: Count consecutive repeats. Only allocate `StringBuilder` when compressed length is smaller than original to avoid heap churn.
> * **Production Reality:** Run-Length Encoding (RLE) in Bitmap images (BMP/TIFF) and columnar databases (Parquet/ClickHouse).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.6), we are asked:

*"Implement a method to perform basic string compression using the counts of repeated characters. For example, the string 'aabcccccaaa' would become 'a2b1c5a3'. If the 'compressed' string would not become smaller than the original string, your method should return the original string."*

## 2. Avoiding Quadratic String Concatenation

Using `str += char + count` inside a loop creates a new `String` object on every iteration, copying $1 + 2 + \dots + N$ characters for a disastrous $O(N^2)$ runtime.

*Optimal Implementation:* First calculate the compressed length in a linear scan. If `compressedLength >= originalLength`, return original immediately without allocating memory. Otherwise, build output with pre-sized `StringBuilder` in $O(N)$ time.

## Implémentation de production

```java
public class StringCompression {
    public static String compress(String str) {
        if (str == null || str.length() <= 2) return str;

        int finalLength = countCompression(str);
        if (finalLength >= str.length()) return str;

        StringBuilder compressed = new StringBuilder(finalLength);
        int countConsecutive = 0;

        for (int i = 0; i < str.length(); i++) {
            countConsecutive++;
            if (i + 1 >= str.length() || str.charAt(i) != str.charAt(i + 1)) {
                compressed.append(str.charAt(i));
                compressed.append(countConsecutive);
                countConsecutive = 0;
            }
        }
        return compressed.toString();
    }

    private static int countCompression(String str) {
        int compressedLength = 0;
        int countConsecutive = 0;
        for (int i = 0; i < str.length(); i++) {
            countConsecutive++;
            if (i + 1 >= str.length() || str.charAt(i) != str.charAt(i + 1)) {
                compressedLength += 1 + String.valueOf(countConsecutive).length();
                countConsecutive = 0;
            }
        }
        return compressedLength;
    }
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Time Complexity | `O(N)` | Two sequential passes over input string. |
| Auxiliary Space | `O(N)` | Pre-allocated StringBuilder buffer. |

## Analyse d'ingénierie système en production réelle

Columnar storage engines (Apache Parquet, ClickHouse) compress sorted columns containing repeating values (e.g. state codes) using Run-Length Encoding to reduce disk I/O by 80%.

## Cas limites et durcissement en production

1. Strings with no repeats (`"abcdef"`): Returns original `"abcdef"` in O(N).
2. Single character `"a"`: Returns `"a"`.
