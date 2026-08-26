---
title: "CTCI 1.3 URLify: Replace Spaces with %20 from the End"
description: "In-place URL encoding for a char array with true length. Count spaces, walk backward, write %20 without stomping characters you still need."
date: "2025-10-31"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-3-urlify.webp
previewImage: /assets/images/ctci-1-3-urlify.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** In-place URL encoding for a char array with true length. Count spaces, walk backward, write %20 without stomping characters you still need.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

URLs cannot carry raw spaces. A space becomes the three-character token `%20`. Interview versions of this problem do not ask you to call a library helper. They hand you a `char[]` that already has extra room at the end, plus the **true length** of the string (how many characters actually matter before the padding). Your job is to rewrite the array in place.

This is problem **1.3** in the Arrays and Strings chapter of the classic CTCI-style set. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## Everyday analogy

Picture a row of theater seats. The first thirteen seats hold the real people. Extra empty seats sit at the end of the row.

Each person who is standing (a space) needs three seats instead of one: the letters `%`, `2`, and `0`. If you start packing from the **front**, every person behind you has to shuffle right, again and again. That is slow and easy to mess up.

If you start from the **back**, you claim the empty seats first and place people (or `%20`) into free slots. Nobody you still need to move gets overwritten. That is the whole trick.

---

## Problem in plain words

**Input**

* `chars`: a character array. The real string lives in indices `0 .. trueLength - 1`. The rest of the array is spare buffer space.
* `trueLength`: how many characters of real content exist (not the full array length).

**Output**

* The same array, edited so every space in the true string is replaced by `%`, `2`, `0`.
* Return type is often `void` (mutate in place) or the final string for easy testing.

**Assumptions you should confirm out loud**

1. The array has enough spare capacity for the expansion. Each space adds two extra characters.
2. Only spaces inside the true-length region matter. Trailing buffer characters are not "content spaces."
3. In Java, use `char[]` so you can write in place. Building a new `String` with `StringBuilder` solves a different problem (still fine to mention as the easy path, then do the in-place version).

**Classic example**

```
Input:  chars = ['M','r',' ','J','o','h','n',' ','S','m','i','t','h',' ',' ',' ',' ']
        trueLength = 13
Output: ['M','r','%','2','0','J','o','h','n','%','2','0','S','m','i','t','h']
```

The string `"Mr John Smith"` has length 13 and two spaces. Final length is `13 + 2 * 2 = 17`.

---

## How to think before coding

### Brute force idea (and why it hurts)

Scan left to right. When you see a space, shift every later character two positions right, then write `%20`. Shifting is `O(n)` per space, so many spaces means roughly `O(n²)`. Interviewers will ask for better.

### Better idea: edit from the end

1. Count how many spaces sit in the true-length region.
2. Compute the final write index: you need `trueLength + 2 * spaceCount` slots (indices `0` through that number minus one).
3. Walk the true string from right to left.
4. For a non-space character, copy it into the next free slot from the end.
5. For a space, write `'0'`, then `'2'`, then `'%'` (still going backward, so the three characters land in the correct order when you read left to right).

Why backward works: every write goes into a slot that either was buffer or already held a character you finished processing. You never clobber unread input.

---

## Java solution

```java
public final class Urlify {
    private Urlify() {}

    /**
     * Replaces spaces with %20 in place.
     * chars must have room for the expansion: trueLength + 2 * spaceCount.
     */
    public static void urlify(char[] chars, int trueLength) {
        if (chars == null || trueLength < 0 || trueLength > chars.length) {
            throw new IllegalArgumentException("bad length");
        }

        int spaces = 0;
        for (int i = 0; i < trueLength; i++) {
            if (chars[i] == ' ') {
                spaces++;
            }
        }

        // Index of the last slot we will write into.
        int write = trueLength + spaces * 2 - 1;

        if (write >= chars.length) {
            throw new IllegalArgumentException("array too small for %20 expansion");
        }

        for (int read = trueLength - 1; read >= 0; read--) {
            char c = chars[read];
            if (c == ' ') {
                chars[write] = '0';
                chars[write - 1] = '2';
                chars[write - 2] = '%';
                write -= 3;
            } else {
                chars[write] = c;
                write--;
            }
        }
    }

    /** Convenience for tests: build a padded char array from a string and true length. */
    public static String urlifyString(String s, int trueLength) {
        int spaces = 0;
        for (int i = 0; i < trueLength; i++) {
            if (s.charAt(i) == ' ') {
                spaces++;
            }
        }
        int finalLen = trueLength + spaces * 2;
        char[] chars = new char[finalLen];
        for (int i = 0; i < trueLength; i++) {
            chars[i] = s.charAt(i);
        }
        urlify(chars, trueLength);
        return new String(chars);
    }
}
```

### Walkthrough of the example

Start: true content `"Mr John Smith"`, two spaces, `write` starts at index `16`.

| Step | read char | Action | write after |
| --- | --- | --- | --- |
| 1 | `h` | copy to 16 | 15 |
| 2 | `t` | copy to 15 | 14 |
| 3 | `i` | copy to 14 | 13 |
| 4 | `m` | copy to 13 | 12 |
| 5 | `S` | copy to 12 | 11 |
| 6 | space | write `%20` at 9-11 | 8 |
| 7 | `n` | copy to 8 | 7 |
| ... | ... | keep going | ... |
| last spaces / letters | ... | finish at the front | done |

When you finish, the array holds `"Mr%20John%20Smith"`.

---

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | `O(n)` | One pass to count spaces, one pass to rewrite. `n` is `trueLength`. |
| Extra space | `O(1)` | Only a few integers. The output reuses the given array. |

If the interviewer allows a new string, `StringBuilder` is also `O(n)` time and `O(n)` extra space. The in-place version is the point of this prompt.

---

## Edge cases interviewers poke

* **Zero spaces:** final length equals `trueLength`. The reverse loop just copies each character onto itself (or onto the same index if there is no growth). Still correct.
* **All spaces:** every character expands to `%20`. Need `3 * trueLength` capacity.
* **Leading or trailing spaces in true content:** still encode them. `" hi "` with true length 4 becomes `"%20hi%20"`.
* **Empty true length (`0`):** nothing to do. Guard against negative lengths.
* **Array too small:** fail fast. In a whiteboard setting, state the capacity formula: final size = `trueLength + 2 * spaceCount`.
* **Tabs or other whitespace:** the classic problem only replaces the space character `' '`. Ask if other whitespace counts. Usually it does not.
* **Unicode / multi-byte:** `char` in Java is UTF-16 code unit. For interview URL-encoding of ASCII text, stick to spaces.

---

## Common mistakes

1. **Editing forward** and shifting repeatedly: quadratic, and hard to get right under pressure.
2. **Using `chars.length` as true length.** The buffer padding spaces at the end are not content. That is why `trueLength` is given separately.
3. **Writing `%`, `2`, `0` in the wrong order when going backward.** Remember: the rightmost of the three slots gets `'0'` first when you write from the end.
4. **Off-by-one on `write`.** Start at `trueLength + 2 * spaces - 1`, not at `trueLength + 2 * spaces`.
5. **Mutating while still reading ahead of the write head in the wrong direction.** Backward avoids that collision.

---

## Quick check you can run

```java
public static void main(String[] args) {
    // 13 chars of content, room for two spaces -> +4
    char[] chars = "Mr John Smith    ".toCharArray(); // length 17
    Urlify.urlify(chars, 13);
    System.out.println(new String(chars)); // Mr%20John%20Smith

    System.out.println(Urlify.urlifyString("Mr John Smith", 13));
    System.out.println(Urlify.urlifyString("nospace", 7)); // nospace
    System.out.println(Urlify.urlifyString("  ", 2));      // %20%20
}
```

---

## Explain to a friend

You have a character array with the real string up front and empty seats at the end. Spaces must become three characters, `%20`. Count the spaces, figure out how far the string will grow, then walk from the last real character backward. Copy normal letters into free seats from the back. When you hit a space, drop `%20` into three seats. Because you fill from the end, you never overwrite a character you still need to read. One count pass, one write pass, linear time, constant extra memory.

Next in Chapter 1: [Palindrome Permutation](/blog/en/ctci-1-4-palindrome-permutation). Previous: [Check Permutation](/blog/en/ctci-1-2-check-permutation).