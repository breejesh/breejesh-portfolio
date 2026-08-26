---
title: "CTCI 1.6 String Compression in Java: Counts and StringBuilder"
description: "Compress runs of letters (aabcccccaaa to a2b1c5a3) with StringBuilder, then return the original when compression does not help. Java walkthrough with edge cases."
date: "2025-11-13"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-6-string-compression.webp
previewImage: /assets/images/ctci-1-6-string-compression.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Compress runs of letters (aabcccccaaa to a2b1c5a3) with StringBuilder, then return the original when compression does not help. Java walkthrough with edge cases.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Imagine packing a suitcase where you own five identical black socks. You do not write "sock, sock, sock, sock, sock" on the packing list. You write "sock x 5". That is the whole idea of this problem: replace a run of the same character with the character plus how many times it appears in a row.

This is problem **1.6** from the classic *Cracking the Coding Interview* style set (Arrays and Strings). The write-up below is an original teaching walkthrough in Java, not a paste of any book solution text. Series map: [CTCI series guide](/blog/en/ctci-series-guide).

---

## The problem in plain words

Implement basic string compression using counts of **consecutive** repeated characters.

| Piece | Meaning |
| --- | --- |
| Input | A string of only uppercase and lowercase letters (`a`-`z`, `A`-`Z`) |
| Rule | Walk left to right. Each maximal run of the same character becomes that character followed by its count |
| Example | `aabcccccaaa` becomes `a2b1c5a3` |
| Catch | If the compressed form is **not shorter** than the original, return the original string |

Counts are written in decimal. A run of twelve `x` characters becomes `x12` (character plus digits), not twelve separate `1`s.

"Consecutive" matters. `aba` is three runs of length 1: `a1b1a1`. That is longer than `aba`, so you return `aba`.

---

## How to think before coding

**Brute instinct:** scan the string, build a new string by concatenating `"a" + "2" + "b" + ...` with `+` on `String`.

That is correct in shape and wrong in cost. In Java, each `String` concatenation that grows the result copies the whole prefix again. For a long string made of many short runs, you pay roughly quadratic time.

**Better shape:**

1. Walk the string once with an index `i`.
2. While the next character equals the current one, grow a counter.
3. Append the character and the count to a **`StringBuilder`**.
4. After the full pass, compare lengths. If the builder is not shorter, return the original.

`StringBuilder` keeps a mutable buffer. Appends are amortized O(1) per character written, so the whole build is linear in the output size (and the scan is linear in the input).

You can also pre-check "will this even shrink?" by counting runs first and estimating the compressed length. That avoids allocating a builder when compression loses. For interview speed, one pass into a builder plus a final length check is clear and usually enough.

---

## Java solution with StringBuilder

```java
public final class StringCompression {

    private StringCompression() {}

    /**
     * Compress consecutive runs: aabcccccaaa -> a2b1c5a3.
     * Returns the original string when compression is not strictly shorter.
     */
    public static String compress(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }

        StringBuilder compressed = new StringBuilder();
        int n = s.length();
        int i = 0;

        while (i < n) {
            char c = s.charAt(i);
            int count = 0;
            // grow the run of c starting at i
            while (i < n && s.charAt(i) == c) {
                count++;
                i++;
            }
            compressed.append(c);
            compressed.append(count);
        }

        // only keep compression when it truly shrinks the string
        if (compressed.length() >= n) {
            return s;
        }
        return compressed.toString();
    }
}
```

Walkthrough for `aabcccccaaa`:

1. Run of `a` length 2 → append `a`, `2`
2. Run of `b` length 1 → append `b`, `1`
3. Run of `c` length 5 → append `c`, `5`
4. Run of `a` length 3 → append `a`, `3`
5. Result `a2b1c5a3` has length 8. Original has length 10. Return compressed.

Notice `append(count)` works because `StringBuilder` has an `append(int)` overload. You do not need `String.valueOf(count)` unless you prefer it for clarity.

---

## Optional: stop early when compression cannot win

Each run becomes at least two characters (letter + at least one digit). If every run is length 1, compressed length is `2 * n`. For mixed runs, a quick upper bound is: number of runs times (1 + digits for that count). A simple early exit many people use:

```java
// rough check: if there are too many short runs, skip building
private static int countCompressedLength(String s) {
    int length = 0;
    int i = 0;
    int n = s.length();
    while (i < n) {
        char c = s.charAt(i);
        int count = 0;
        while (i < n && s.charAt(i) == c) {
            count++;
            i++;
        }
        length += 1 + String.valueOf(count).length();
    }
    return length;
}
```

Call this first. If `countCompressedLength(s) >= s.length()`, return `s` without a second pass into a builder. Two linear passes still beat quadratic concat. In an interview, say the trade-off out loud: extra pass vs. never allocating a large builder when you will discard it.

For most whiteboards, the single-pass builder version is enough.

---

## Complexity

| Metric | Bound | Why |
| --- | --- | --- |
| Time | O(n) | One scan of the input; each index advances at most once |
| Extra space | O(n) | Builder holds up to roughly O(n) characters in the worst case |
| With early length check | O(n) time, O(1) extra if you return original without building | Second pass only when compression helps |

`n` is the length of the input string. Digit strings for counts are short (`log10(count) + 1` digits per run), so they do not change the big-O picture for normal interview inputs.

---

## Edge cases interviewers poke

| Input | Expected | Why |
| --- | --- | --- |
| `""` | `""` | Empty stays empty (define null policy with the interviewer) |
| `"a"` | `"a"` | `a1` is longer |
| `"aa"` | `"aa"` | Compressed form `a2` has the same length, so keep the original |
| `"aaa"` | `"a3"` | Clearly shorter |
| `"aabbcc"` | `"aabbcc"` | Compressed `a2b2c2` is length 6, not smaller |
| `"AAAAA"` | `"A5"` | Case is preserved; `A` and `a` are different characters |
| `"aAaA"` | `"aAaA"` | Alternating case: four runs of 1 |

Be explicit about the comparison: **strictly shorter**. Same length means return the original. That matches the usual statement of this problem.

Also confirm: counts are for **consecutive** runs only, not total frequency of the character in the whole string. `aba` is not `a2b1`.

---

## Common mistakes

1. **Using `String` `+` in a loop.** Correct answer, slow complexity. Interviewers will ask runtime.
2. **Forgetting the last run.** If you only flush when the *next* character differs, you still need a flush after the loop ends (or structure the loop like the code above so the inner while consumes the final run).
3. **Total counts instead of run lengths.** Frequency maps solve a different problem.
4. **Returning compressed when lengths are equal.** The problem wants the original when compression does not shrink.
5. **Mixing `A` and `a`.** They are different runs.

---

## Explain to a friend

You walk the string and group neighbors that look the same. Each group becomes "letter + how many". You glue those pieces with a `StringBuilder` so you do not rebuild the whole string on every append. At the end you measure: if the new writing is not shorter, you throw it away and keep the original packing list.

That is run-length style compression for letters, with a honesty check that compression must actually help.

---

## Practice next

Still in Chapter 1:

- Previous style warm-up if you have not done runs yet: walk a string and count groups out loud on paper for `aaabbc`.
- Next in the series plan: [Rotate Matrix](/blog/en/ctci-1-7-rotate-matrix) (1.7).
- Series home: [CTCI in Java guide](/blog/en/ctci-series-guide).

Re-code `compress` from memory tomorrow without looking. If you can explain why `StringBuilder` matters in one sentence, you own this problem.