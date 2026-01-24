---
title: "CTCI 1.2 Check Permutation: Same Letters, Different Order (Java)"
description: "Decide if two strings are permutations of each other. Scrabble-tile analogy, sort vs count array vs HashMap in Java, complexity, and edge cases for beginners."
date: "2026-01-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-1-2-check-permutation.webp
previewImage: /assets/images/ctci-1-2-check-permutation.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** Decide if two strings are permutations of each other. Scrabble-tile analogy, sort vs count array vs HashMap in Java, complexity, and edge cases for beginners.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Two words can look different and still be built from the exact same letters. Interviewers love that idea because it forces you to talk about **frequency**, not just equality.

This is **problem 1.2** in the [CTCI Java series](/blog/en/ctci-series-guide): given two strings, decide whether one is a **permutation** of the other. We will stay novice-first: analogy, plain problem, how to think, then three clean Java versions.

---

## Everyday analogy: two piles of Scrabble tiles

You and a friend each dump a pile of letter tiles on the table.

- Your pile: `T`, `A`, `R`
- Friend's pile: `R`, `A`, `T`

If you sort each pile alphabetically, both become `A`, `R`, `T`. Same multiset of letters. That is a permutation.

If the friend has `R`, `A`, `T`, `S`, the piles are not the same. Extra tile means not a permutation.

**Permutation** here means: same characters with the same counts, possibly in a different order. Not "related words." Not "anagram in English only." Just bags of characters that match.

---

## The problem in plain words

**Input:** two strings, call them `a` and `b`.

**Output:** `true` if `a` is a rearrangement of `b`, else `false`.

**Examples**

| `a` | `b` | Result | Why |
| --- | --- | --- | --- |
| `"abc"` | `"bca"` | true | same three letters |
| `"abc"` | `"ab"` | false | different lengths |
| `"aabc"` | `"abac"` | true | two `a`, one `b`, one `c` |
| `"Dog"` | `"god"` | false if case matters | `D` is not `d` |
| `"ab c"` | `"abc"` | false if space counts | space is a character |

### Questions you should ask in an interview

1. **Case sensitive?** Usually yes unless they say otherwise. `"God"` and `"dog"` are different.
2. **Whitespace and punctuation count?** Usually yes. Treat every `char` equally.
3. **Charset?** ASCII only, or full Unicode? That choice picks **array of counts** vs **HashMap**.
4. **Null or empty?** Empty and empty can be true (both have zero characters). Null is a product decision; in interviews, state your rule.

For this post we assume:

* Case sensitive.
* Whitespace counts.
* Prefer a clear ASCII solution, then show a general `HashMap` version.

---

## How to think before coding

### Brute force that is too slow

Generate every permutation of `a` and see if `b` appears. For length `n`, that is roughly `n!` strings. Fine for length 4. Dead for length 20. Do not go there.

### Idea 1: sort both strings

If two strings are permutations, sorting their characters produces the same sequence.

1. If lengths differ, return false immediately.
2. Convert each string to a `char[]`.
3. Sort both arrays.
4. Compare array equality (or build strings and use `equals`).

This is easy to explain and hard to mess up. Cost is the sort: **O(n log n)** time.

### Idea 2: count characters (the interview upgrade)

Sorting reorders. Counting compares **how many** of each letter you have.

1. If lengths differ, return false.
2. Walk `a` and increment a count for each character.
3. Walk `b` and decrement.
4. If any count goes negative, or any count is left non-zero, they are not permutations.

If the alphabet is small and fixed (classic ASCII with 128 or 256 slots), an `int[]` is enough. If characters can be any Unicode code unit, use a `HashMap<Character, Integer>`.

Counting is usually **O(n)** time and **O(1)** extra space for a fixed alphabet (the array size does not grow with `n`).

### Which one do you say first?

In a real interview: start with sort, then say "we can do better with frequency counts if the alphabet is limited." That shows you can ship the simple version and still optimize.

---

## Java solution 1: sort both

```java
import java.util.Arrays;

public class CheckPermutation {

    /** True if a is a permutation of b (case sensitive, every char counts). */
    public static boolean permutationBySort(String a, String b) {
        if (a == null || b == null) {
            return a == b; // both null -> true; one null -> false
        }
        if (a.length() != b.length()) {
            return false;
        }

        char[] ca = a.toCharArray();
        char[] cb = b.toCharArray();
        Arrays.sort(ca);
        Arrays.sort(cb);
        return Arrays.equals(ca, cb);
    }
}
```

Notes for beginners:

* `toCharArray()` copies the characters so sorting does not try to mutate the immutable `String`.
* Length check is free early exit. Different length can never be a permutation.
* `Arrays.equals` compares each index after sorting.

---

## Java solution 2: count array (ASCII-friendly)

Assume characters fit in 0..127 (standard ASCII). If your problem says "extended ASCII," use size 256.

```java
public class CheckPermutation {

    private static final int ASCII = 128;

    public static boolean permutationByCountArray(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (a.length() != b.length()) {
            return false;
        }

        int[] counts = new int[ASCII];

        for (int i = 0; i < a.length(); i++) {
            char c = a.charAt(i);
            // Optional guard if you must reject non-ASCII input:
            // if (c >= ASCII) throw new IllegalArgumentException("non-ASCII");
            counts[c]++;
        }

        for (int i = 0; i < b.length(); i++) {
            char c = b.charAt(i);
            counts[c]--;
            if (counts[c] < 0) {
                // b has more of this char than a did
                return false;
            }
        }

        // Lengths matched and we never went negative, so all zeros.
        return true;
    }
}
```

Why the early `counts[c] < 0` return works:

* Total length is equal.
* Every time `b` uses a character, we subtract one from the stock built by `a`.
* If stock goes negative, `b` needed more of that character than `a` had.
* If that never happens and lengths match, the bags are equal. You do not need a third loop to scan for leftover positives.

If you prefer the textbook three-pass style: increment for `a`, decrement for `b`, then scan the array for any non-zero. Same big-O; slightly more code.

---

## Java solution 3: HashMap (general character set)

When you cannot assume ASCII, count with a map.

```java
import java.util.HashMap;
import java.util.Map;

public class CheckPermutation {

    public static boolean permutationByHashMap(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (a.length() != b.length()) {
            return false;
        }

        Map<Character, Integer> counts = new HashMap<>();

        for (int i = 0; i < a.length(); i++) {
            char c = a.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        for (int i = 0; i < b.length(); i++) {
            char c = b.charAt(i);
            Integer left = counts.get(c);
            if (left == null || left == 0) {
                return false;
            }
            if (left == 1) {
                counts.remove(c); // keeps the map tidy; optional
            } else {
                counts.put(c, left - 1);
            }
        }

        return counts.isEmpty();
    }
}
```

Tradeoff:

* Works for any `char` values Java stores (UTF-16 code units).
* Extra object overhead and hash cost vs a tight `int[]`.
* For interview ASCII string problems, the array is usually the sharper answer after you mention sort.

### Tiny smoke tests

```java
public static void main(String[] args) {
    System.out.println(permutationBySort("abc", "bca"));       // true
    System.out.println(permutationBySort("abc", "ab"));        // false
    System.out.println(permutationByCountArray("aabc", "abac")); // true
    System.out.println(permutationByHashMap("Dog", "god"));    // false
    System.out.println(permutationByHashMap("", ""));          // true
}
```

---

## Complexity

Let `n` be the common length when lengths match (if they differ we stop in O(1)).

| Approach | Time | Extra space | Best when |
| --- | --- | --- | --- |
| Sort both | O(n log n) | O(n) for char arrays (or O(1) if you ignore the copies) | You want the simplest correct code |
| Count array (size k) | O(n) | O(k) fixed, e.g. 128 or 256 | Alphabet is small and known |
| HashMap | O(n) average | O(min(n, alphabet)) | Characters are sparse or large |

Interview sound bite: **different length is an instant no. Same multiset of characters is a yes. Sorting proves the multiset. Counting proves it faster for a fixed alphabet.**

---

## Edge cases interviewers poke

1. **Different lengths** (`"ab"`, `"abc"`) → false without scanning contents if you check length first.
2. **Empty strings** (`""`, `""`) → true. (`""`, `"a"`) → false.
3. **One empty, one not** → false.
4. **Duplicates** (`"aab"`, `"aba"`) → true; (`"aab"`, `"abb"`) → false. Frequency matters, not just "uses a and b."
5. **Case** (`"Abc"`, `"abc"`) → false under case-sensitive rules.
6. **Spaces** (`"a b"`, `"ab "`) → true (same characters, different order); (`"a b"`, `"ab"`) → false.
7. **Null inputs** → agree on a policy before coding.
8. **Very long strings** → prefer O(n) counting over sorting if limits are huge and alphabet is fixed.
9. **Unicode / emoji** → Java `char` is a UTF-16 code unit. Full code-point handling is a deeper topic; mention it if the interviewer cares about emoji.

---

## Common mistakes

* Comparing strings with `==` in Java (reference equality). Use content comparison after sort, or never build strings and compare arrays / counts instead.
* Forgetting the length check and writing a long counting loop that "almost" works.
* Using a boolean "seen" set instead of counts. Sets destroy frequency. `"aab"` and `"abb"` would look identical to a set of characters `{a, b}`.
* Assuming case-insensitive without asking.
* Off-by-one on array size: 128 vs 256 vs `Character.MAX_VALUE + 1` (do not allocate 65k unless you mean to).

---

## Explain to a friend

A permutation check asks: **are these two strings the same bag of letters?**

Picture Scrabble tiles. If both of you have the same tiles, just laid out in a different order, you match. If either of you has an extra tile or a missing tile, you do not.

Fast mental algorithm:

1. Different length? No.
2. Either sort both piles and compare, or count how many of each letter each pile has.
3. Counts equal means yes.

In Java, sorting is the clear first draft. A fixed-size count array is the usual O(n) upgrade for ASCII. A `HashMap` is the general version when the alphabet is not tiny.

That is CTCI 1.2. Next in chapter 1 is often **URLify** (spaces to `%20` in place). Previous idea in the chapter is **Is Unique** (all characters distinct).

---

## Series

* Series guide: [Cracking the Coding Interview in Java](/blog/en/ctci-series-guide)
* Tag: **Algorithms** only for this series

Practice tip: implement sort first without looking, then rewrite with counts from memory the next day.