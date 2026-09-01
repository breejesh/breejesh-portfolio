---
title: "Re-Space: Dynamic Programming & Trie Word Segmentation (CTCI 17.13)"
description: "Re-insert spaces into unspaced text documents to minimize unrecognized characters using memoized Dynamic Programming and Trie traversal in O(N · L) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-13-re-space.webp
previewImage: /assets/images/ctci-17-13-re-space.webp
---

> **TL;DR**
> * **The Book Problem:** You have accidentally removed all spaces, punctuation, and capitalization from a document (e.g. `"iresetthecomputeritstilldidntboot"`). Given a dictionary of valid words, re-insert spaces such that the total number of unrecognized/invalid characters is minimized.
> * **The Optimal Solution:** **Memoized Dynamic Programming + Trie**:
>   1. **DP State**: Let $DP[i]$ represent the optimal parsing starting at character index $i$ returning `(invalidCharCount, parsedString)`.
>   2. **Branching Options at Index $i$**:
>      * **Option A (Skip as Unrecognized)**: Treat $S[i]$ as an invalid character $\implies 1 + DP[i+1]$.
>      * **Option B (Dictionary Word Match)**: For every word $W$ found in a Trie prefix match from index $i$ to $j \implies 0 + DP[j+1]$.
>   3. Choose the branch yielding the strictly minimal invalid character count.
>   4. Runs in **$O(N \cdot L)$ time** (where $L$ is the maximum dictionary word length) and **$O(N + \text{TrieSize})$ space**.
> * **Production Reality:** Asian language NLP tokenization (Chinese / Japanese text segmentation in Jieba & MeCab), LLM Byte-Pair Encoding (BPE), and search query auto-correct.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.13), we are asked:

*"Given an unspaced string of length N and a dictionary of words, insert spaces into the sentence to minimize unrecognized characters."*

## 2. Dynamic Programming State-Space Tree

```
String: "jesslookedjustliketimherbrother"
Trie Matches at Index 0:
  - "jess"  ──> 0 invalid + DP(4) ["looked..."]
  - Skip 'j' ──> 1 invalid + DP(1) ["esslooked..."]

Optimal Memoized Path:
  "jess" + " " + "looked" + " " + "just" + " " + "like" + " " + "tim" + " " + "her" + " " + "brother"
  (Total Invalid Characters = 0!)
```

## Production Java Implementation

```java
import java.util.*;

public class ReSpace {

    public static class TrieNode {
        public boolean isWord = false;
        public final Map<Character, TrieNode> children = new HashMap<>();

        public void insert(String word) {
            TrieNode curr = this;
            for (char c : word.toCharArray()) {
                curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
            }
            curr.isWord = true;
        }
    }

    public static class ParseResult {
        public int invalid;
        public String parsed;

        public ParseResult(int invalid, String parsed) {
            this.invalid = invalid;
            this.parsed = parsed;
        }
    }

    /**
     * Re-spaces text to minimize unrecognized characters.
     * Time Complexity: O(N * L)
     * Space Complexity: O(N + Trie)
     */
    public static String reSpace(String document, HashSet<String> dictionary) {
        TrieNode root = new TrieNode();
        for (String word : dictionary) {
            root.insert(word);
        }

        ParseResult[] memo = new ParseResult[document.length()];
        ParseResult result = split(document, 0, root, memo);
        return result.parsed;
    }

    private static ParseResult split(String doc, int start, TrieNode root, ParseResult[] memo) {
        if (start >= doc.length()) {
            return new ParseResult(0, "");
        }
        if (memo[start] != null) {
            return memo[start];
        }

        // Option 1: Treat current character as unrecognized
        ParseResult best = split(doc, start + 1, root, memo);
        int minInvalid = best.invalid + 1;
        String bestParsed = doc.charAt(start) + (best.parsed.isEmpty() ? "" : " " + best.parsed);

        // Option 2: Search all valid dictionary words starting at index 'start' via Trie
        TrieNode curr = root;
        for (int i = start; i < doc.length(); i++) {
            char c = doc.charAt(i);
            curr = curr.children.get(c);
            if (curr == null) break; // Trie branch pruned

            if (curr.isWord) {
                ParseResult next = split(doc, i + 1, root, memo);
                if (next.invalid < minInvalid) {
                    minInvalid = next.invalid;
                    String word = doc.substring(start, i + 1);
                    bestParsed = word + (next.parsed.isEmpty() ? "" : " " + next.parsed);
                }
            }
        }

        memo[start] = new ParseResult(minInvalid, bestParsed);
        return memo[start];
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Space Complexity | Dictionary Branch Pruning |
|---|---|---|---|
| **DP + Trie Prefix Tree** | **$O(N \cdot L)$** | **$O(N + |\text{Trie}|)$** | **Instant branch termination** |
| **DP + HashSet Substrings** | $O(N^2 \cdot L)$ | $O(N)$ | Redundant string allocations |
| **Pure Backtracking** | $O(2^N)$ | $O(N)$ | Exponential explosion |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Asian Language NLP Tokenization

1. **Jieba & MeCab Text Segmentation:** Unlike Latin languages, written Chinese and Japanese do not contain whitespace between words. Production search tokenizers (Baidu, Elasticsearch IK Analyzer) segment CJK documents into indexed terms using Hidden Markov Models (HMM) and Trie-based DP Viterbi path decoders.
2. **Subword BPE Tokenization in LLMs:** Modern tokenizers (tiktoken / SentencePiece) segment unspaced token byte-sequences into dense subword vocabularies using dynamic programming.

## Edge Cases & Production Hardening

1. **Entire Document Unrecognized:** Correctly outputs character sequence separated by spaces with invalid count equal to string length.
2. **Dictionary Words Overlapping (`"reset"`, `"set"`):** Explores all branch possibilities to find the global optimum rather than a greedy local trap.
