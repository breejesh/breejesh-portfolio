---
title: "Is Unique: Check if a String Has All Distinct Characters (Java)"
description: "CTCI-style problem 1.1 for beginners: decide whether every character in a string appears only once. Analogy, brute force, boolean array, HashSet, sort, and complexity."
date: "2025-09-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-1-1-is-unique.webp
previewImage: /assets/images/ctci-1-1-is-unique.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 1.1 for beginners: decide whether every character in a string appears only once. Analogy, brute force, boolean array, HashSet, sort, and complexity.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You are checking guest names at a small party. Every person must enter once. If someone already signed the list, you stop them. That is the whole idea behind "is unique": walk through characters and notice the first repeat.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic interview arrays-and-strings warmups, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## 1. Everyday analogy

Imagine a roll of stickers. Each sticker has a letter. You peel them one by one onto a table.

* If you pick a letter you have never seen, put it down and keep going.
* If you pick a letter already on the table, the roll is **not unique**.

A string is just that roll of stickers. Your job is to say yes (all different) or no (at least one letter shows up twice).

---

## 2. Plain problem statement

**Input:** a string `s` (for example `"abc"`, `"hello"`, or `""`).

**Output:** `true` if every character appears at most once, otherwise `false`.

**Examples:**

| Input | Result | Why |
| --- | --- | --- |
| `"abc"` | `true` | a, b, c each once |
| `"hello"` | `false` | `l` appears twice |
| `"Aa"` | `true` if case matters (default) | `A` and `a` are different characters in Java |
| `""` | `true` | empty has no duplicates |
| `"a"` | `true` | single character |

**Clarify before coding** (say this out loud in an interview):

* Is the alphabet ASCII (0 to 127), extended ASCII (0 to 255), or full Unicode?
* Does case matter? (`"AbA"` has two `A` if you ignore case.)
* Can the string be empty or null?
* Do we need the first duplicate index, or only yes/no?

For this article we assume: non-null Java `String`, case sensitive, and we often optimize for ASCII first because interviews love that path.

---

## 3. Think first (brute force, then better)

### Brute force

For each index `i`, scan every later character and ask "is `s.charAt(j)` equal to `s.charAt(i)`?"

* Time: about O(n²) comparisons for length n.
* Space: O(1) extra memory.
* Fine for tiny strings. Painful when n grows.

```java
boolean isUniqueBrute(String s) {
    int n = s.length();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (s.charAt(i) == s.charAt(j)) {
                return false;
            }
        }
    }
    return true;
}
```

### Better idea: remember what you already saw

You do not need to re-scan the whole string for every character. Keep a **set of seen characters**. When you meet one already in the set, answer false. One pass.

That is the same mental move as the sticker table.

### Even tighter for ASCII: fixed-size flags

If you know there are only 128 (or 256) possible codes, you do not need a growing set. Use a boolean array of that size. Index by character code. Same O(n) time, O(1) space relative to the alphabet size (not relative to n).

Quick win: if length is greater than the alphabet size, you **must** have a duplicate (pigeonhole principle). Return false immediately.

---

## 4. Java solutions

### (a) Boolean array (ASCII)

Classic interview answer when the interviewer accepts "assume ASCII".

```java
boolean isUniqueAscii(String s) {
    // More chars than codes? Duplicate is forced.
    if (s.length() > 128) {
        return false;
    }

    boolean[] seen = new boolean[128];
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c >= 128) {
            // Outside our assumed alphabet; handle or reject.
            throw new IllegalArgumentException("Non-ASCII char");
        }
        if (seen[c]) {
            return false; // already used this code
        }
        seen[c] = true;
    }
    return true;
}
```

**Bit-vector version** (same idea, less memory for a-z only):

If the string is lowercase English letters only (`a` to `z`), 26 flags fit in one `int` (32 bits). Bit `k` means "letter with code `a + k` already appeared".

```java
boolean isUniqueLowercaseBits(String s) {
    if (s.length() > 26) {
        return false;
    }
    int mask = 0;
    for (int i = 0; i < s.length(); i++) {
        int bit = s.charAt(i) - 'a';
        if (bit < 0 || bit > 25) {
            throw new IllegalArgumentException("Expected a-z only");
        }
        int flag = 1 << bit;
        if ((mask & flag) != 0) {
            return false;
        }
        mask |= flag;
    }
    return true;
}
```

Bits are optional flair. Know the boolean array first. Use bits only if alphabet is tiny and the interviewer asks about space.

### (b) HashSet (works for general characters)

```java
import java.util.HashSet;
import java.util.Set;

boolean isUniqueHashSet(String s) {
    Set<Character> seen = new HashSet<>();
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (!seen.add(c)) {
            // add returns false when the value was already present
            return false;
        }
    }
    return true;
}
```

This handles Unicode without a fixed 128-slot array. Space grows with distinct characters (up to n). Clean, easy to explain, safe default in production code when the alphabet is open-ended.

### (c) Sort, then walk neighbors (optional, extra space or mutating)

If you may rearrange a copy of the characters, sort them. Any duplicate becomes adjacent.

```java
import java.util.Arrays;

boolean isUniqueSort(String s) {
    char[] chars = s.toCharArray();
    Arrays.sort(chars);
    for (int i = 1; i < chars.length; i++) {
        if (chars[i] == chars[i - 1]) {
            return false;
        }
    }
    return true;
}
```

* Time: O(n log n) from the sort.
* Space: O(n) for the `char[]` copy (Java `String` is immutable).
* Nice when you cannot use extra hash structures but sorting is allowed.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Nested loops | O(n²) | O(1) | No extra structures |
| Boolean array (ASCII) | O(n) | O(1) alphabet | Assumes 128 or 256 codes |
| Bit mask (a-z) | O(n) | O(1) | Only lowercase English |
| HashSet | O(n) average | O(k) | k = distinct chars |
| Sort + scan | O(n log n) | O(n) | Copy then sort |

Prefer **boolean array** when alphabet is fixed and small. Prefer **HashSet** when you cannot assume ASCII. Prefer **sort** only if hash structures are banned.

---

## 6. Edge cases

Interviewers poke these:

* **Empty string** → usually `true` (no pair of equal characters).
* **Single character** → `true`.
* **All same character** (`"aaaa"`) → `false`.
* **Length greater than alphabet size** → immediate `false` for fixed alphabets.
* **Null** → decide: throw, or return false. Do not crash silently.
* **Spaces and punctuation** → they count as characters (`"a b"` has two spaces if written that way; `"ab "` is three unique chars).
* **Unicode / surrogates** → `char` is UTF-16. Emoji can use two `char` units. For strict Unicode code points, walk with `codePoints()`.
* **Case** → `"God"` vs `"god"`: different if case sensitive.

Minimal null-safe wrapper:

```java
boolean isUniqueSafe(String s) {
    if (s == null) {
        throw new IllegalArgumentException("string is null");
    }
    return isUniqueHashSet(s);
}
```

---

## 7. Explain to a friend recap

"Is unique" asks: does this string reuse any character?

1. Brute force compares every pair. Slow but correct.
2. Remember what you saw: a set (or boolean flags for a fixed alphabet).
3. On each character, if already seen, return false; else mark it seen.
4. If the string is longer than the alphabet, a duplicate is inevitable.
5. Sorting is a backup plan when you can copy and sort, then check neighbors.

If you can say that in thirty seconds and write the HashSet or boolean-array version without freezing, you own problem 1.1.

Next in the series: [Check Permutation](/blog/en/ctci-1-2-check-permutation) (are two strings rearrangements of each other?).