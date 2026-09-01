---
title: "English Int: Chunked Number-to-Words String Translation (CTCI 16.8)"
description: "Convert any 32-bit integer into its standard English grammatical phrase representation using modular 3-digit chunking and string tokenization in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-8-english-int.webp
previewImage: /assets/images/ctci-16-8-english-int.webp
---

> **TL;DR**
> * **The Book Problem:** Given any integer, print an English phrase that describes the integer (e.g., "One Thousand Two Hundred Thirty Four").
> * **The Optimal Solution:** **3-Digit Triplet Chunking**:
>   1. **Magnitude Hierarchy**: English numbers are grouped into 3-digit chunks: Base ($10^0$), Thousands ($10^3$), Millions ($10^6$), and Billions ($10^9$).
>   2. **Chunk Translation Subroutine**: A dedicated helper converts any number $0..999$ into words:
>      * Hundreds: `digits[n / 100] + " Hundred"`.
>      * Tens & Units: If remainder $< 20$, lookup directly in `small[]` (`"Twelve"`); if $\ge 20$, combine `tens[rem / 10]` with `small[rem % 10]` (`"Thirty Four"`).
>   3. **Iteration**: Divide by 1000 in a loop, prepending non-zero chunk phrases with their magnitude unit.
>   4. Runs in **$O(1)$ time** (at most 4 chunk iterations for 32-bit integers) and **$O(1)$ space**.
> * **Production Reality:** Financial check-printing software, banking invoicing systems, and text-to-speech (TTS) synthesis engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.8), we are asked:

*"Given any integer (positive, negative, or zero), return its grammatically correct English word representation without redundant spaces or missing magnitudes."*

## 2. Chunking Decomposition Pipeline

```
Input: 1,234,567,890
           │
           ├─> Chunk 3: 1           ──> "One" + " Billion"
           ├─> Chunk 2: 234         ──> "Two Hundred Thirty Four" + " Million"
           ├─> Chunk 1: 567         ──> "Five Hundred Sixty Seven" + " Thousand"
           └─> Chunk 0: 890         ──> "Eight Hundred Ninety"
           │
Result: "One Billion Two Hundred Thirty Four Million Five Hundred Sixty Seven Thousand Eight Hundred Ninety"
```

## Production Java Implementation

```java
import java.util.LinkedList;

public class EnglishIntConverter {

    private static final String[] SMALLS = {
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private static final String[] BIGS = {
        "", "Thousand", "Million", "Billion"
    };

    public static String convertToWords(int num) {
        if (num == 0) return "Zero";
        if (num == Integer.MIN_VALUE) {
            return "Negative Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Eight";
        }

        if (num < 0) {
            return "Negative " + convertToWords(-num);
        }

        LinkedList<String> parts = new LinkedList<>();
        int chunkCount = 0;

        while (num > 0) {
            int chunk = num % 1000;
            if (chunk != 0) {
                String chunkStr = convertChunk(chunk);
                if (!BIGS[chunkCount].isEmpty()) {
                    chunkStr += " " + BIGS[chunkCount];
                }
                parts.addFirst(chunkStr);
            }
            num /= 1000;
            chunkCount++;
        }

        return String.join(" ", parts).trim();
    }

    private static String convertChunk(int number) {
        StringBuilder sb = new StringBuilder();

        // Convert Hundreds
        if (number >= 100) {
            sb.append(SMALLS[number / 100]).append(" Hundred");
            number %= 100;
            if (number > 0) sb.append(" ");
        }

        // Convert Tens and Units
        if (number >= 20) {
            sb.append(TENS[number / 10]);
            number %= 10;
            if (number > 0) sb.append(" ");
        }

        if (number > 0 && number < 20) {
            sb.append(SMALLS[number]);
        }

        return sb.toString();
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Maximum 4 triplets processed for 32-bit signed integers. |
| Auxiliary Space | `O(1)` | Bounded string builder allocation. |
| String Allocations | Minimal | Avoids trailing space collisions via clean `LinkedList` joining. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Internationalization & TTS Engines

1. **Text-to-Speech (TTS) Normalization:** In voice assistants (Google Assistant / Siri), text normalization pipelines expand numeric tokens (`$1,234.50`) into phonetic text representations before synthesizing audio waveforms.
2. **Grammatical Locale Variability:** Unlike English, languages such as French (e.g. *quatre-vingt-dix* for 90) or Hindi require non-modular numeral rules and gender-aware declensions.

## Edge Cases & Production Hardening

1. **`Integer.MIN_VALUE` ($-2,147,483,648$):** Negating `Integer.MIN_VALUE` directly overflows in 32-bit two's complement; handled via dedicated base case.
2. **Intermediate Zeros:** Numbers like `1,000,005` cleanly skip empty thousand/hundred chunks, producing `"One Million Five"`.
