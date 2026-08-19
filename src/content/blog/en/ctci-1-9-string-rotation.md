---
title: "CTCI 1.9 String Rotation: One isSubstring Call"
description: "Check whether s2 is a rotation of s1 with a single isSubstring call: concatenate s1 with itself and ask if s2 lives inside. Java walkthrough for beginners."
date: "2026-05-13"
tags: [Algorithms]
coverImage: /assets/images/ctci-1-9-string-rotation.webp
previewImage: /assets/images/ctci-1-9-string-rotation.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Check whether s2 is a rotation of s1 with a single isSubstring call: concatenate s1 with itself and ask if s2 lives inside. Java walkthrough for beginners.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A circular necklace of letter beads. You unclasp it between two beads, flip the loop so a new bead sits at the front, and close it again. The beads are the same, in the same cyclic order. Only the starting point moved. That is a **string rotation**.

This post is problem **1.9** from the [CTCI Java series](/blog/en/ctci-series-guide): given two strings, decide if one is a rotation of the other, and you may call `isSubstring` **only once**.

---

## The problem in plain words

You get two strings, `s1` and `s2`.

- A **rotation** of `s1` means: pick an index `i`, take the suffix `s1[i..]`, then glue the prefix `s1[0..i)` after it. Example: `waterbottle` rotated after `wat` becomes `erbottlewat`.
- You are given a helper `isSubstring(big, small)` that returns true when `small` appears somewhere inside `big`.
- Write `isRotation(s1, s2)` that returns true only when `s2` is some rotation of `s1`.
- **Constraint that interviews care about:** call `isSubstring` at most **one** time.

Assume characters are case-sensitive. `"Abc"` is not a rotation of `"bca"`.

---

## How to think before coding

### Brute force (do not ship this as the answer)

For every cut point `i` from `0` to `n-1`, build `s1.substring(i) + s1.substring(0, i)` and compare to `s2`. That is O(n) candidates, each comparison O(n), so O(n²) time and lots of temporary strings. It also never uses the one-call rule.

### The trick for the one-call constraint

If `s2` is a rotation of `s1`, then `s1` can be split as `x + y` and `s2` is `y + x` for some strings `x` and `y` (possibly empty).

Concatenate `s1` with itself:

```
s1 + s1 = x + y + x + y
```

The middle chunk is `y + x`, which is exactly `s2`. So **every rotation of `s1` is a substring of `s1 + s1`**.

The reverse direction needs one more guard: lengths must match. Otherwise `"ab"` would sit inside `"aa" + "aa"` without being a rotation of `"aa"` in the sense we care about for equal-length rotations (and shorter or longer strings are never rotations of each other).

So the full check is:

1. Same length (and usually non-null).
2. `isSubstring(s1 + s1, s2)` once.

Empty string: both empty have equal length, `"" + ""` is `""`, and `isSubstring("", "")` should be true. One empty and one non-empty fail the length check.

---

## Java solution

```java
/**
 * Returns true if s2 is a rotation of s1, using at most one isSubstring call.
 * Example: "waterbottle" and "erbottlewat" -> true.
 */
public static boolean isRotation(String s1, String s2) {
    if (s1 == null || s2 == null) {
        return false;
    }
    // Rotations preserve length. Different lengths cannot match.
    if (s1.length() != s2.length()) {
        return false;
    }
    // Optional: treat two empty strings as equal rotations.
    // s1 + s1 is still empty; isSubstring should return true for empty in empty.
    String doubled = s1 + s1;
    return isSubstring(doubled, s2);
}

/**
 * True if small appears inside big. In interviews this is "given".
 * In real Java you can implement it with indexOf.
 */
public static boolean isSubstring(String big, String small) {
    if (big == null || small == null) {
        return false;
    }
    return big.indexOf(small) != -1;
}
```

Walk the classic example:

| Step | Value |
| --- | --- |
| `s1` | `waterbottle` |
| `s2` | `erbottlewat` |
| lengths | both 11, OK |
| `s1 + s1` | `waterbottlewaterbottle` |
| `isSubstring` | finds `erbottlewat` starting after `wat` |

One call. Done.

---

## Complexity

| | Cost | Why |
| --- | --- | --- |
| Time | O(n) typical | Build `s1+s1` in O(n). `indexOf` is O(n) on average / O(n·m) naive worst case for length-n strings. Interview answer: linear in string length for a decent substring search. |
| Extra space | O(n) | The doubled string is length 2n. |

You cannot avoid reading both strings in the worst case, so linear work is the right order of magnitude.

---

## Edge cases interviewers poke

1. **Null inputs.** Return false (or throw if your contract says so). State the choice out loud.
2. **Different lengths.** Fast false. Never call `isSubstring` if you already know the answer (still counts as zero calls, which satisfies "at most one").
3. **Identical strings.** Rotation by zero. `s1+s1` contains `s1`. True.
4. **Empty strings.** Both empty: true. One empty: false via length.
5. **Single character.** `"a"` and `"a"` true; `"a"` and `"b"` false.
6. **Repeated letters.** `"aaaa"` and `"aaaa"` true. `"aaba"` and `"abaa"` true (rotation). `"aaba"` and `"aaab"` true as well. Use the doubled-string test; do not invent special cases.
7. **Case and spaces.** `"Ab"` is not a rotation of `"bA"` unless your problem ignores case. Default is exact match.
8. **Calling isSubstring more than once.** The whole point of the question. Building all rotations yourself fails the spirit even if it is correct.

---

## Common mistakes

- Forgetting the **length check** and only testing `isSubstring(s1+s1, s2)`. Then a shorter string that happens to appear in the doubled source can sneak through depending on how you define rotation.
- Calling `isSubstring` in a loop over cut points. That burns the budget.
- Using `contains` on `s2+s2` instead of `s1+s1` without swapping roles carefully. The doubled string must be the **original** (or either, if lengths match: if they are rotations of each other, doubling either works). Stick to one story: double `s1`, search for `s2`.
- Sorting both strings. That checks **anagram**, not rotation. `"abcd"` and `"acbd"` are anagrams, not rotations.

---

## Recap you can tell a friend

A rotation is the same circular necklace of characters, opened at a different clasp.

If `s2` really is a rotation of `s1`, then `s2` is some `y + x` while `s1` is `x + y`. Write `s1` twice in a row and that `y + x` sits in the middle. So check **same length**, then ask once: is `s2` a substring of `s1 + s1`?

That is the whole trick. One clever observation beats a nest of loops.

---

## Practice

1. Code `isRotation` from memory without looking.
2. Trace `isRotation("waterbottle", "erbottlewat")` on paper.
3. Trace a false case: `isRotation("waterbottle", "bottlewaterx")` (length) and `isRotation("abc", "acb")` (anagram, not rotation).
4. Explain why sorting both sides is the wrong tool.

This closes Chapter 1 (Arrays and Strings). Next up: linked lists with [Remove Dups](/blog/en/ctci-2-1-remove-dups). Full series map: [CTCI in Java](/blog/en/ctci-series-guide).