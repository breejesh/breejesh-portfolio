---
title: "Word Rectangle: Trie-Pruned DFS for Largest Valid Word Grid (CTCI 17.25)"
description: "Find the largest rectangle of words where every row and column is a valid dictionary word by using a Trie for prefix pruning during iterative DFS column-word construction in O(W * L^2) amortized time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-25-word-rectangle.webp
previewImage: /assets/images/ctci-17-25-word-rectangle.webp
---

> **TL;DR**
> * **The Book Problem:** Given a list of millions of words, design an algorithm to create the largest possible rectangle of letters where every row forms a word reading left-to-right and every column forms a word reading top-to-bottom.
> * **The Optimal Solution:** **Trie-Pruned DFS Word Rectangle Search**:
>   1. **Group words by length** in a dictionary. Build a Trie for each word-length group.
>   2. **Enumerate rectangle dimensions** (width × height): try the largest area first.
>   3. **Row DFS**: Iteratively place a word of length `width` as the next row. After each word is placed, **prune columns** using the Trie for words of length `height` — if any column prefix is invalid, backtrack immediately.
>   4. Time: **exponential** worst-case with aggressive Trie pruning cutting almost all invalid branches.
> * **Production Reality:** Crossword puzzle generation engines, word game board validation, and constraint propagation in NLP lattice parsing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.25), we are asked:

*"Given a list of millions of words, design an algorithm to create the largest possible rectangle of letters such that every row and every column forms a word (reading left to right or top to bottom)."*

## 2. Trie-Based Column Pruning Strategy

```
Dictionary: ["cat", "can", "act", "tan"]
Width=3, Height=3

Place row 0: "cat"
  Column prefixes so far: c="c", c="a", c="t"
  Trie check: "c" valid prefix, "a" valid prefix, "t" valid prefix -> continue

Place row 1: "can"
  Column prefixes: "ca", "aa", "tn"
  "aa" has no valid prefix in Trie -> PRUNE, try next word

Place row 1: "act"
  Column prefixes: "ca", "ac", "tt"
  All valid -> continue
  ...
```

## Production Java Implementation

```java
import java.util.*;

public class WordRectangle {

    // TrieNode omitted for brevity — standard insert/startsWith implementation

    static Map<Integer, List<String>> groupByLength(String[] words) {
        Map<Integer, List<String>> map = new HashMap<>();
        for (String w : words) map.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
        return map;
    }

    static String[] maxRectangle;

    public static String[] findLargestRectangle(String[] words) {
        Map<Integer, List<String>> byLen = groupByLength(words);
        int maxLen = 0;
        for (String w : words) maxLen = Math.max(maxLen, w.length());

        // Try largest area rectangles first
        for (int area = maxLen * maxLen; area > 0; area--) {
            for (int width = maxLen; width >= 1; width--) {
                if (area % width != 0) continue;
                int height = area / width;
                if (height > maxLen) continue;
                List<String> widthWords  = byLen.getOrDefault(width, Collections.emptyList());
                List<String> heightWords = byLen.getOrDefault(height, Collections.emptyList());
                if (widthWords.isEmpty() || heightWords.isEmpty()) continue;

                // Build Trie for height-length words (column validation)
                Trie colTrie = new Trie();
                for (String w : heightWords) colTrie.insert(w);

                String[] result = makeRectangle(widthWords, colTrie, width, height);
                if (result != null) return result;
            }
        }
        return null;
    }

    static String[] makeRectangle(List<String> words, Trie colTrie, int width, int height) {
        return dfs(new String[height], words, colTrie, width, height, 0);
    }

    static String[] dfs(String[] rect, List<String> words, Trie colTrie, int width, int height, int row) {
        if (row == height) return rect;
        for (String word : words) {
            rect[row] = word;
            if (columnsValid(rect, colTrie, width, row + 1, height)) {
                String[] result = dfs(rect, words, colTrie, width, height, row + 1);
                if (result != null) return result;
            }
        }
        rect[row] = null;
        return null;
    }

    static boolean columnsValid(String[] rect, Trie colTrie, int width, int rowsFilled, int height) {
        for (int c = 0; c < width; c++) {
            StringBuilder col = new StringBuilder();
            for (int r = 0; r < rowsFilled; r++) col.append(rect[r].charAt(c));
            boolean isComplete = rowsFilled == height;
            if (isComplete) {
                if (!colTrie.contains(col.toString())) return false;
            } else {
                if (!colTrie.startsWith(col.toString())) return false;
            }
        }
        return true;
    }

    // Minimal Trie for illustration
    static class Trie {
        Map<Character, Trie> children = new HashMap<>();
        boolean isEnd;
        void insert(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Trie());
            node.isEnd = true;
        }
        boolean startsWith(String prefix) {
            Trie node = this;
            for (char c : prefix.toCharArray()) {
                node = node.children.get(c);
                if (node == null) return false;
            }
            return true;
        }
        boolean contains(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) {
                node = node.children.get(c);
                if (node == null) return false;
            }
            return node.isEnd;
        }
    }
}
```

## Complexity Analysis

| Phase | Complexity | Detail |
|---|---|---|
| Word Grouping | $O(W)$ | W = total words. |
| Trie Construction | $O(W \cdot L)$ | L = max word length. |
| DFS with Trie Pruning | Exponential worst, highly pruned | Invalid column prefixes cut tree early. |

## Real-World Systems Engineering Discussion

1. **Crossword Puzzle Generation:** Commercial puzzle engines use Trie-pruned backtracking grids to generate valid crossword fills from dictionary corpora.
2. **NLP Lattice Parsing:** Constraint propagation across a word-lattice grid applies prefix-validity pruning identical to this algorithm.

## Edge Cases & Production Hardening

1. **No Valid Rectangle:** Returns `null`.
2. **Single Character Words:** Width-1 or height-1 rectangles are found trivially.
