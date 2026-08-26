---
title: "CTCI 1.4 Palindrome Permutation in Java: Count Odds, Not Rearrangements"
description: "Check if any rearrangement of a string is a palindrome. Frequency counts, at most one odd character, optional space and case rules, and clean Java."
date: "2025-12-10"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-4-palindrome-permutation.webp
previewImage: /assets/images/ctci-1-4-palindrome-permutation.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Check if any rearrangement of a string is a palindrome. Frequency counts, at most one odd character, optional space and case rules, and clean Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A **palindrome** reads the same left to right and right to left: `kayak`, `level`, `a man a plan a canal panama` if you ignore spaces. A **permutation** is any shuffle of the same multiset of characters. This problem asks a quieter question: *could some shuffle of this string be a palindrome?* You do not need to build that shuffle. You only need to know whether one is possible.

This is problem **1.4** in the *Cracking the Coding Interview* style set (arrays and strings). The article is original teaching, not a paste of any book solution.

---

## Everyday picture

Think of letter tiles on a table. You want to line them into a word that looks the same from both ends.

Pairs sit on matching seats: one `a` on the left needs another `a` on the right, and so on. If a letter appears an odd number of times, one tile is left over. That leftover can sit in the **middle** of the line. If two different letters each leave a leftover, you would need two middles. A single line only has one middle seat.

So the rule is blunt:

* Every character count is even, **or**
* Exactly one character has an odd count (and the rest are even).

That is the whole algorithm, once you agree what to count (letters only? case? spaces?).

---

## Problem in plain words

**Input:** a string `s`.

**Output:** `true` if there exists some rearrangement of the characters in `s` that forms a palindrome; otherwise `false`.

**Clarifications you should ask in an interview**

| Question | Typical teaching choice |
| --- | --- |
| Spaces? | Often ignore spaces (phrases like `Tact Coa` → `tacocat`) |
| Case? | Often treat as case-insensitive (`T` and `t` are the same letter) |
| Empty string? | Usually `true` (empty is a palindrome) |
| Only ASCII letters? | Confirm; a general map works for any char set |

Classic sample people use: `"Tact Coa"` can rearrange to `"taco cat"` (ignoring spaces and case), so the answer is `true`.

You are **not** asked to return the palindrome string. Only yes or no.

---

## How to think before coding

### Brute force (do not ship this)

Generate every permutation and test `isPalindrome`. That is factorial time. Interviewers want you to mention it once and leave it behind.

### Better idea: use the middle-seat rule

1. Count how often each character appears.
2. Count how many characters have an **odd** frequency.
3. Accept if that odd count is `0` or `1`.

Why this is enough:

* Even length palindrome: every pair matches; zero odds.
* Odd length palindrome: one character sits in the center; exactly one odd.

You never build the string. You only inspect counts.

### Optional bit-vector twist (if alphabet is tiny)

If you only care about lowercase English letters, you can toggle bits in an `int` (26 bits fit). A character with even count ends with bit 0; odd ends with bit 1. At the end, the bit set must have at most one bit set (`x & (x - 1) == 0`). Nice in interviews when the alphabet is fixed. The map version below is clearer and general.

---

## Java solution: count odds

This version lowercases letters, skips non-letters, and uses a `HashMap`. Adjust the filter if the interviewer wants every character, including spaces.

```java
import java.util.HashMap;
import java.util.Map;

public class PalindromePermutation {

    /**
     * Returns true if some permutation of the letters in s is a palindrome.
     * Spaces and punctuation are ignored. Case is ignored.
     */
    public static boolean isPalindromePermutation(String s) {
        if (s == null) {
            return false;
        }

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (!Character.isLetter(c)) {
                continue;
            }
            c = Character.toLowerCase(c);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        int oddCount = 0;
        for (int freq : counts.values()) {
            if (freq % 2 != 0) {
                oddCount++;
                if (oddCount > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindromePermutation("Tact Coa")); // true  (taco cat)
        System.out.println(isPalindromePermutation("hello"));    // false
        System.out.println(isPalindromePermutation("aab"));      // true  (aba)
        System.out.println(isPalindromePermutation(""));         // true
        System.out.println(isPalindromePermutation("Aa"));       // true  (aa / Aa)
    }
}
```

### Walkthrough: `"Tact Coa"`

Letters after ignore and lowercasing: `t a c t c o a`

| Letter | Count |
| --- | --- |
| a | 2 |
| c | 2 |
| o | 1 |
| t | 2 |

Odd frequencies: only `o`. One middle seat is fine. Return `true`.

### Walkthrough: `"hello"`

`h:1 e:1 l:2 o:1` → three odds. Impossible. Return `false`.

### Fixed alphabet with a bit mask

Same idea, no `HashMap`, for `a`-`z` only after normalizing:

```java
public static boolean isPalindromePermutationBits(String s) {
    if (s == null) {
        return false;
    }
    int bitVector = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (!Character.isLetter(c)) {
            continue;
        }
        int idx = Character.toLowerCase(c) - 'a';
        if (idx < 0 || idx >= 26) {
            continue; // non a-z after lowercasing
        }
        bitVector ^= (1 << idx); // flip: even -> odd, odd -> even
    }
    // zero or one bit set
    return bitVector == 0 || (bitVector & (bitVector - 1)) == 0;
}
```

`x & (x - 1)` clears the lowest set bit. If the result is zero, `x` had zero or one bit set.

---

## Time and space

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Count with map | O(n) | O(k) distinct chars | Clear default answer |
| Count with `int[26]` | O(n) | O(1) | When alphabet is fixed Latin letters |
| Bit vector | O(n) | O(1) | Same fixed alphabet; clever but easy to botch |
| All permutations | O(n · n!) | O(n) recursion | Mention, then discard |

One pass for counting plus a short pass over keys (or a single running odd counter) is enough. You can track `oddCount` while updating the map if you prefer one structural loop.

---

## Edge cases interviewers poke

* **Null:** define behavior (`false` or throw). Say it out loud.
* **Empty / only spaces:** after filtering, no odds → `true`.
* **Single character:** one odd → `true`.
* **All even counts:** `true` (even-length palindrome).
* **Two odds:** `false`.
* **Unicode / accents:** `Character.isLetter` and `toLowerCase` are locale-sensitive in subtle ways. For interviews, state ASCII assumptions unless they ask for full Unicode.
* **Must include spaces in the palindrome:** then do **not** skip spaces; a space is just another character that needs an even or single-odd role.
* **Case sensitive:** drop `toLowerCase` if the problem says so.

Always restate the rules before coding. Half the bugs on this problem are mismatched assumptions, not wrong math.

---

## Common mistakes

1. **Building a palindrome** instead of checking possibility. Waste of time.
2. **Forgetting** that zero odds is valid (even length).
3. **Counting spaces** when the example clearly ignores them (or the reverse).
4. **Case mismatch:** counting `T` and `t` separately when the problem treats them as one.
5. **Bit tricks without a fixed alphabet.** A map is safer until the alphabet is constrained.

---

## Related ideas

* Checking whether a **string itself** is a palindrome is two pointers. That is a different problem (CTCI also has a linked-list palindrome later).
* **Anagram / permutation of another string** (problem 1.2 style) compares two full frequency maps. Here you only care about parity of one map.
* **Longest palindrome you can build** from a multiset is a close cousin: use all even counts, plus at most one odd leftover for the middle.

---

## Explain to a friend

You get letter tiles. Can you line them so the word mirrors itself?

Matching seats need pairs. Only one letter is allowed to have a leftover tile for the center. Count each letter. If more than one letter has an odd count, say no. Otherwise say yes.

In Java: walk the string, count letters (usually lowercased, spaces skipped), then check that at most one frequency is odd. That is O(n) time and you never generate permutations.

Next in the series: [One Away](/blog/en/ctci-1-5-one-away). Series map: [CTCI in Java](/blog/en/ctci-series-guide).