---
title: "Re-Space: Restore Spaces in Unspaced String Using Dynamic Programming (CTCI 17.13)"
description: "CTCI problem 17.13: re-insert spaces into a text string to minimize unrecognized characters using DP and Trie."
date: "2025-08-09"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-13-re-space.webp
previewImage: /assets/images/ctci-17-13-re-space.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.13 technical mechanics.
> * **The Approach:** CTCI problem 17.13: re-insert spaces into a text string to minimize unrecognized characters using DP and Trie.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.13**.

## 1. Context and Problem Statement
CTCI problem 17.13: re-insert spaces into a text string to minimize unrecognized characters using DP and Trie.

## 2. Technical Code & Mechanics

```java
public class ReSpace {
    public int reSpace(Set<String> dictionary, String sentence) {
        int[] memo = new int[sentence.length() + 1];
        Arrays.fill(memo, -1);
        return BEST_SPLIT(dictionary, sentence, 0, memo);
    }
    private int BEST_SPLIT(Set<String> dict, String sentence, int start, int[] memo) {
        if (start >= sentence.length()) return 0;
        if (memo[start] != -1) return memo[start];
        int minUnmatched = Integer.MAX_VALUE;
        String str = "";
        for (int i = start; i < sentence.length(); i++) {
            str += sentence.charAt(i);
            int invalid = dict.contains(str) ? 0 : str.length();
            if (invalid < minUnmatched) {
                int result = BEST_SPLIT(dict, sentence, i + 1, memo);
                minUnmatched = Math.min(minUnmatched, invalid + result);
            }
        }
        memo[start] = minUnmatched;
        return minUnmatched;
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.