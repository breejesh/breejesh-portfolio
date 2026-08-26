---
title: "Permutations with Dups: Unique Strings via Frequency Map (Java)"
description: "CTCI-style problem 8.8 for beginners: list every unique permutation of a string that may contain duplicate characters. Build a frequency map, backtrack by remaining counts, skip the n! blowup of naive swaps."
date: "2026-01-05"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.8 for beginners: list every unique permutation of a string that may contain duplicate characters. Build a frequency map, backtrack by remaining counts, skip the n! blowup of naive swaps.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You already know how to list every ordering of distinct characters: pick a next letter, recurse, put it back. That is problem **8.7**. The moment the string has repeats (`"aab"`, `"mississippi"`), the naive tree prints the same string many times. Problem **8.8** asks for the **unique** permutations only, without dumping a giant list and filtering later.

This post is original teaching for beginners in **Java**. Same problem family as classic multiset-permutation interviews, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8 recursion and DP, problem **8.8**.

---

## 1. Everyday analogy

You have Scrabble tiles face up: two `A`s and one `B`. How many **different** words can you spell by rearranging all tiles?

If the two `A` tiles were painted different colors, you could swap them and pretend the words are different. They are not. The reader only sees letters. So:

* Distinct letters, all unique: count is `n!`.
* With duplicates: count is `n! / (f1! · f2! · …)` where `fi` is how often letter `i` appears.

For `"aab"` that is `3! / 2! = 3` strings: `aab`, `aba`, `baa`. Not six.

The algorithm should grow only those three branches. It should not grow six and throw three away.

---

## 2. Plain problem statement

**Input:** a string `s` of length `n`. Characters may repeat. Case and alphabet are whatever the interviewer sets; treat the string as a multiset of chars.

**Output:** all **distinct** strings that use every character of `s` exactly once (full-length permutations of the multiset). Order of the list does not matter unless they ask for sorted output.

**Examples:**

| Input | Unique permutations |
| --- | --- |
| `""` | one empty string (or empty list: pick a convention and stick to it) |
| `"a"` | `["a"]` |
| `"ab"` | `["ab", "ba"]` |
| `"aab"` | `["aab", "aba", "baa"]` |
| `"aaa"` | `["aaa"]` |

**Clarify before coding:**

* Empty input: return `[""]` or `[]`? Teaching choice here: one empty result, same as 8.7 style base case.
* Case sensitive? Yes unless told otherwise (`A` ≠ `a`).
* Need sorted output? Not required. Easy to sort at the end if they want it.
* Mutate caller input? No. Work on a map and a builder.

You are **not** asked for permutations of a subset (that is closer to power set). Full length only.

---

## 3. Think first

### Why "generate all then put in a Set" is weak

You can run the 8.7 swap recursion and shove every string into a `HashSet`. Correct on tiny `n`. Cost is still proportional to **all** multiset orderings in the search tree, which for many duplicates is far larger than the unique count. Interviewers want you to **not create duplicates**, not to hide them in a set.

### Frequency map idea

Count how many times each character remains available:

```
"aab" → { a: 2, b: 1 }
```

At every step of the partial string:

1. For each character `c` that still has count `> 0`, choose `c` next.
2. Decrement `count[c]`, append `c`, recurse.
3. After the recursive call, restore: pop `c`, increment `count[c]`.

Because both `a` tiles share one key in the map, there is only **one** branch that starts with `a`, not two. That is the whole trick.

### Recursion shape

```
prefix = ""
counts = {a:2, b:1}

  pick a → prefix "a", counts {a:1, b:1}
    pick a → "aa", {a:0, b:1}
      pick b → "aab"  (done)
    pick b → "ab", {a:1, b:0}
      pick a → "aba"  (done)
  pick b → prefix "b", counts {a:2, b:0}
    pick a → "ba", {a:1, b:0}
      pick a → "baa"  (done)
```

Three leaves. No duplicate leaves.

### Compare to 8.7

| | 8.7 no dups | 8.8 with dups |
| --- | --- | --- |
| Source of choices | remaining indices / unused letters | characters with remaining count > 0 |
| Branch factor | distinct unused positions | distinct character keys still available |
| Result size | `n!` | `n! / ∏ fi!` |
| Extra structure | boolean used array, or swap | `Map` or array of counts |

If every character is unique, the frequency approach still works and produces `n!` results. It is a strict generalization of 8.7.

### Data structure for counts

* **Array of size 26** if the problem is lowercase English only. Fast and simple.
* **`HashMap<Character, Integer>`** for general Unicode / mixed case. Slightly more code, clearer for interviews when the alphabet is unknown.

Use a map in the main solution below so the code does not silently assume `a-z`.

### Builder choice

`StringBuilder` for the current prefix. Append before recurse, `setLength` or `deleteCharAt` on the way back. Avoid `String` concat in the hot path if you care about intermediate garbage; either is fine for whiteboard `n`.

---

## 4. Java solution

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {

    public List<String> permutations(String s) {
        List<String> result = new ArrayList<>();
        if (s == null) {
            return result;
        }

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        backtrack(counts, new StringBuilder(), s.length(), result);
        return result;
    }

    private void backtrack(
            Map<Character, Integer> counts,
            StringBuilder path,
            int targetLen,
            List<String> result) {

        if (path.length() == targetLen) {
            result.add(path.toString());
            return;
        }

        // Iterate a snapshot of keys so we do not depend on map mutation order quirks.
        for (Character c : new ArrayList<>(counts.keySet())) {
            int remaining = counts.get(c);
            if (remaining <= 0) {
                continue;
            }

            counts.put(c, remaining - 1);
            path.append(c);

            backtrack(counts, path, targetLen, result);

            path.deleteCharAt(path.length() - 1);
            counts.put(c, remaining);
        }
    }
}
```

### Walkthrough: `"aab"`

1. Build counts `{a=2, b=1}`. `targetLen = 3`.
2. First top choice `a`: path `"a"`, counts `{a=1, b=1}`.
3. Next `a`: path `"aa"`, counts `{a=0, b=1}`. Only `b` left → `"aab"`. Record. Undo.
4. Still under path `"a"`, next choice `b`: path `"ab"`, then only `a` left → `"aba"`. Record. Undo.
5. Back at empty path, choice `b`: path `"b"`, then two `a`s forced in order → only `"baa"`. Record.
6. Done. Three strings.

### Why iterate keys every level

You only place a character if its count is positive. Keys with zero remaining are skipped. Some people remove zero keys from the map and reinsert on undo; that works but is easier to get wrong under pressure. Leaving the key and testing `remaining <= 0` is dull and safe.

### Optional: fixed alphabet array

If the interviewer locks you to lowercase `a-z`:

```java
int[] counts = new int[26];
for (int i = 0; i < s.length(); i++) {
    counts[s.charAt(i) - 'a']++;
}

// in backtrack:
for (int i = 0; i < 26; i++) {
    if (counts[i] == 0) {
        continue;
    }
    counts[i]--;
    path.append((char) ('a' + i));
    backtrack(counts, path, targetLen, result);
    path.deleteCharAt(path.length() - 1);
    counts[i]++;
}
```

Same control flow. Faster constants, narrower input contract.

### Smoke tests

```java
PermutationsWithDups p = new PermutationsWithDups();

assert p.permutations("").equals(List.of(""));
assert p.permutations("a").equals(List.of("a"));

List<String> ab = p.permutations("ab");
assert ab.size() == 2 && ab.contains("ab") && ab.contains("ba");

List<String> aab = p.permutations("aab");
assert aab.size() == 3;
assert aab.contains("aab") && aab.contains("aba") && aab.contains("baa");

assert p.permutations("aaa").equals(List.of("aaa"));
```

---

## 5. Complexity table

Let `n` be the string length. Let `k` be the number of distinct characters. Let `U` be the number of unique permutations, `U = n! / ∏ fi!`.

| Piece | Cost | Notes |
| --- | --- | --- |
| Build counts | O(n) time, O(k) space | One pass |
| Search tree size | Θ(U · n) nodes roughly | Each unique result is a path of length n; internal nodes share prefixes |
| Work per node | O(k) to scan keys (map) or O(1) amortized over 26 for array | Dominates the constant |
| Output size | O(U · n) | Must write each string |
| Extra stack | O(n) recursion depth | Path length |
| Total time | O(U · n · k) style | Better than O(n! · n) when many duplicates |
| Total space | O(n + k + U · n) | Stack + map + output |

Say this out loud: you still pay for every unique string you return. You do **not** pay for the canceled duplicate orderings that a swap+Set approach would visit.

Worst case all characters distinct: `U = n!`, same order as 8.7. Best case all characters equal: `U = 1`, and the tree is a single path.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **All identical characters** (`"aaaa"`) → exactly one result. Your map has one key; each step only one choice.
* **All distinct** (`"abcd"`) → `24` results. Frequency code must still work.
* **Empty string** → one empty permutation (if that is your base case).
* **Null** → empty list; do not NPE on `s.length()`.
* **Single character** → list of that one-char string.
* **Many of one letter, few of another** (`"aaab"`) → `4` unique results (`aaab`, `aaba`, `abaa`, `baaa`). Count formula: `4! / 3! = 4`.

Common mistakes:

1. **Generating all swap permutations and inserting into a Set.** Works on demos, wastes branching. Say the count formula, then prune at the source.
2. **Skipping only "same as previous" after sorting, but forgetting to sort or to skip correctly.** The sort-and-skip pattern (like unique subsets) can work for permutations too if you mark used indices carefully. Frequency map is clearer for multiset perms.
3. **Forgetting to restore counts** on the way back. Next sibling branch sees wrong remaining stock.
4. **Mutating the map key set while iterating** without a snapshot. Copy keys or use an array.
5. **Returning partial-length strings.** Stop only when `path.length() == n`.
6. **Treating `"Ab"` and case-folding without being asked.** Stick to exact chars unless they redefine equality.

---

## 7. Explain to a friend recap

Permutations with dups, interview version:

1. Count how many of each character you still own.
2. Build the answer one character at a time.
3. At each step, try every character whose remaining count is positive. Never try "which physical copy of `a`" separately.
4. Decrement, recurse, restore.
5. When the path length hits `n`, record the string.
6. Result size is `n! / ∏ fi!`, not `n!`.
7. Same skeleton as 8.7; the map replaces the used-index set so duplicates collapse for free.

If you can draw the three-leaf tree for `"aab"` and explain why two identical `a` tiles share one branch, you own problem 8.8. Next up, balanced parentheses generation uses a similar "choose next legal symbol" backtrack.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Permutations without Dups](/blog/en/ctci-8-7-permutations-without-dups)
* Next: [Parens](/blog/en/ctci-8-9-parens)