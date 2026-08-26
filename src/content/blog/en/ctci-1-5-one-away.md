---
title: "CTCI 1.5 One Away: One Edit, One Pass in Java"
description: "Check if two strings differ by at most one insert, remove, or replace. Walk through the length rule, a single pointer scan, and clean Java you can explain out loud."
date: "2025-08-05"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-5-one-away.webp
previewImage: /assets/images/ctci-1-5-one-away.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Check if two strings differ by at most one insert, remove, or replace. Walk through the length rule, a single pointer scan, and clean Java you can explain out loud.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You type a password once, mistype it once, and the system still unlocks. That is not magic. Someone decided that **one small edit** is close enough, and two edits are not.

That is the whole problem: given two strings, decide whether you can turn the first into the second with **at most one** of these operations:

1. **Replace** one character (`pale` → `bale`)
2. **Insert** one character (`ple` → `pale`)
3. **Remove** one character (`pale` → `ple`)

Zero edits (the strings are equal) also counts as true. Two or more edits is false.

This is CTCI-style problem **1.5, One Away**, Chapter 1 (Arrays and Strings). We will solve it in **one pass** over the shorter string, in plain Java.

Series home: [CTCI in Java](/blog/en/ctci-series-guide). Previous: [1.4 Palindrome Permutation](/blog/en/ctci-1-4-palindrome-permutation). Next: [1.6 String Compression](/blog/en/ctci-1-6-string-compression).

---

## Everyday picture

Think of two almost-identical shopping lists on paper.

* You crossed out one item: remove.
* You wrote one extra item: insert.
* You fixed one misspelled word: replace.

If the lists already match, you needed zero edits. If you changed two places, you are not "one away." You do not need a fancy data structure for that. You walk both lists with a finger on each, and you allow **one** mismatch to be explained by a single edit.

---

## Problem in plain words

**Input:** two strings, `a` and `b` (ASCII is fine for interview examples).

**Output:** `true` if `a` can become `b` with 0 or 1 edit of type insert, remove, or replace. Otherwise `false`.

**Examples:**

| a | b | Result | Why |
| --- | --- | --- | --- |
| `pale` | `ple` | true | remove `a` |
| `pales` | `pale` | true | remove `s` (or insert into the shorter) |
| `pale` | `bale` | true | replace `p` with `b` |
| `pale` | `bake` | false | two replaces |
| `pale` | `pale` | true | zero edits |
| `a` | `` | true | one remove |
| `abc` | `abxcd` | false | length gap is 2 |

Interview clarifying questions worth asking out loud:

* Are empty strings allowed? Yes, treat them as normal.
* Case sensitive? Yes, unless the interviewer says otherwise. `'A'` and `'a'` differ.
* Is "zero edits" true? Yes. "One away" usually means **at most one**.

---

## How to think before coding

### Step 1: length kills most cases

If the lengths differ by more than 1, you need at least two inserts (or removes). Return false immediately.

```
|len(a) - len(b)| > 1  →  false
```

That is free, and interviewers like hearing it first.

### Step 2: same length means only replace

If lengths are equal, insert and remove cannot help with a single edit (they change length). Walk both strings together. Count mismatches. If you ever see a second mismatch, return false. At the end, zero or one mismatch is fine.

### Step 3: length differs by 1 means insert or remove

Without loss of generality, call the shorter string `s` and the longer string `t`. One insert into `s` is the same as one remove from `t`.

Walk with two indices `i` (into `s`) and `j` (into `t`):

* If `s[i] == t[j]`, advance both.
* If they differ, that must be your **only** edit. Advance only `j` (you "skipped" the extra char in the longer string). If you already used your one edit, return false.

When the loop ends, either the strings matched with zero edits, or you skipped exactly one extra character. Either way you return true (remaining tail of the longer string is at most one char, and length already guarantees that).

### Step 4: one method, one pass

You do not need three separate functions in production interview code. One scan handles replace and insert/remove if you branch only when characters disagree.

---

## Java: one-pass solution

```java
public final class OneAway {

    /**
     * Returns true if first and second are at most one edit apart
     * (insert, remove, or replace a single character).
     */
    public static boolean oneEditAway(String first, String second) {
        if (first == null || second == null) {
            return first == second;
        }

        int len1 = first.length();
        int len2 = second.length();
        if (Math.abs(len1 - len2) > 1) {
            return false;
        }

        // s = shorter (or equal), t = longer (or equal)
        String s = len1 <= len2 ? first : second;
        String t = len1 <= len2 ? second : first;

        int i = 0; // index in s
        int j = 0; // index in t
        boolean foundEdit = false;

        while (i < s.length() && j < t.length()) {
            if (s.charAt(i) == t.charAt(j)) {
                i++;
                j++;
                continue;
            }

            // Characters differ: this must be our only edit
            if (foundEdit) {
                return false;
            }
            foundEdit = true;

            if (s.length() == t.length()) {
                // Same length: treat as replace, move both
                i++;
                j++;
            } else {
                // Different length: skip the extra char in the longer string
                j++;
            }
        }

        // If longer has one leftover char and we never edited, that leftover is the insert.
        // Length check already limits leftovers to at most one.
        return true;
    }
}
```

### Trace: `pale` vs `ple` (remove / insert)

* `s = "ple"`, `t = "pale"`
* `p == p` → move both
* `l != a` → first edit, skip `a` in `t` (`j++` only)
* `l == l`, `e == e` → done, true

### Trace: `pale` vs `bale` (replace)

* lengths equal
* `p != b` → first edit, advance both
* rest matches → true

### Trace: `pale` vs `bake` (two replaces)

* `p != b` → first edit
* `a == a`
* `l != k` → second edit → false

---

## Time and space

| | |
| --- | --- |
| **Time** | O(n) where n is the length of the shorter string (one pass, constant work per character) |
| **Space** | O(1) extra (a few indices and a flag; no new string built) |

You do not need a character count map. Order matters here (`abc` vs `cba` is not one away), so a frequency table would lie.

---

## Edge cases interviewers poke

1. **Equal strings:** `oneEditAway("same", "same")` → true.
2. **Empty and one char:** `("", "x")` → true; `("", "xy")` → false.
3. **Edit at the start:** `("abc", "xabc")` → true (insert at front).
4. **Edit at the end:** `("abc", "abcd")` → true.
5. **Edit in the middle:** `("abc", "axc")` → true.
6. **Null policy:** decide and state it. The code above treats two nulls as equal and mixed null as false. Some teams ban null inputs entirely.
7. **Unicode / surrogates:** interview strings are usually BMP characters. `charAt` is fine for that. Real-world grapheme clusters are a different product problem.

Quick self-check apply:

```java
public static void main(String[] args) {
    assert oneEditAway("pale", "ple");
    assert oneEditAway("pales", "pale");
    assert oneEditAway("pale", "bale");
    assert !oneEditAway("pale", "bake");
    assert oneEditAway("pale", "pale");
    assert oneEditAway("", "a");
    assert !oneEditAway("abc", "abxcd");
    System.out.println("ok");
}
```

---

## Common mistakes

* **Forgetting the length shortcut.** Without it you still can be correct, but you waste work and miss an easy early exit.
* **Moving the wrong pointer on insert.** After a mismatch on different lengths, only the longer string advances.
* **Allowing two replaces.** The `foundEdit` flag is the whole point. Reset nothing; second mismatch means fail.
* **Treating anagram distance as edit distance.** One Away is **not** "same multiset of characters." Order is fixed except for the single edit.
* **Building full Levenshtein DP.** Classic edit distance is O(n·m). For *at most one* edit, that is overkill. Interviewers expect the linear scan.

---

## Explain to a friend

Two strings are one away if you can fix the difference with a single replace, insert, or delete (or they already match).

First check lengths. Gap bigger than one? Done, false.

Then walk both strings. When characters match, keep walking. The first time they disagree, spend your one allowed edit: if lengths match, treat it as a replace and keep both fingers moving; if lengths differ, skip the extra character on the longer side. A second disagreement means false.

That is one pass, constant extra memory, and easy to say on a whiteboard.

---

## Practice cue

Cover the code. Write `oneEditAway` from the length rule and the two pointer rules only. Then run the table of examples out loud. When that is automatic, open [1.6 String Compression](/blog/en/ctci-1-6-string-compression).