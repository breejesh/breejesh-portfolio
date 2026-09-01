---
title: "Multi Search: Aho-Corasick Simultaneous Multi-Pattern String Matching (CTCI 17.17)"
description: "Find all occurrences of multiple small strings within a large document simultaneously using Aho-Corasick NFA-based pattern matching in O(B + sum(L) + M) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-17-multi-search.webp
previewImage: /assets/images/ctci-17-17-multi-search.webp
---

> **TL;DR**
> * **The Book Problem:** Given a string $B$ (big) and an array of smaller strings $S$ (smalls), find all locations in $B$ where each small string appears.
> * **The Optimal Solution:** **Aho-Corasick Multi-Pattern String Matching Automaton**:
>   1. **Phase 1 (Trie Construction)**: Build a Trie of all small strings. Each Trie leaf marks which small string is found at that node.
>   2. **Phase 2 (Failure Link BFS)**: For each Trie node, precompute a `fail` pointer to the longest proper suffix that is also a Trie prefix (Knuth-Morris-Pratt generalized across all patterns).
>   3. **Phase 3 (Linear Text Scan)**: Traverse $B$ character by character following Trie transitions or falling back via `fail` pointers. At each accepting node, follow `output` links to emit all matching patterns.
>   4. Runs in **$O(B + \sum L + M)$ total time** (where $M$ = total matches output) and **$O(\sum L)$ space**.
> * **Production Reality:** Linux `grep -F` with multiple patterns, Snort/Suricata intrusion detection signature scanning, and Google Cloud DLP content inspection.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.17), we are asked:

*"Find all occurrences of each small string within a large string B in time proportional to the document length and total pattern length, not O(B * sum(L))."*

## 2. Aho-Corasick Failure Link Automaton

```
Smalls: ["a", "aa", "aab", "ab"]
Big: "aab"

Trie:
  root
  └── 'a' (matches "a")
      ├── 'a' (matches "aa")
      │   └── 'b' (matches "aab")
      └── 'b' (matches "ab")

Linear Scan Over "aab":
  i=0, c='a': traverse to 'a', output "a" at pos 0
  i=1, c='a': traverse to 'aa', output "aa" at pos 0-1, output "a" at pos 1
  i=2, c='b': traverse to 'aab', output "aab" at pos 0-2, follow fail to "ab", output "ab" at pos 1-2
```

## Production Java Implementation

```java
import java.util.*;

public class MultiSearch {

    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        TrieNode fail = null;
        List<String> output = new ArrayList<>();
    }

    public static Map<String, List<Integer>> searchAll(String big, String[] smalls) {
        Map<String, List<Integer>> result = new HashMap<>();
        for (String s : smalls) result.put(s, new ArrayList<>());
        if (big == null || big.isEmpty() || smalls == null || smalls.length == 0) return result;

        // Phase 1: Build Trie
        TrieNode root = new TrieNode();
        for (String s : smalls) {
            if (s == null || s.isEmpty()) continue;
            TrieNode curr = root;
            for (char c : s.toCharArray()) {
                curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
            }
            curr.output.add(s);
        }

        // Phase 2: Build fail links via BFS
        Queue<TrieNode> queue = new LinkedList<>();
        for (TrieNode child : root.children.values()) {
            child.fail = root;
            queue.add(child);
        }
        while (!queue.isEmpty()) {
            TrieNode curr = queue.poll();
            for (Map.Entry<Character, TrieNode> e : curr.children.entrySet()) {
                char c = e.getKey();
                TrieNode child = e.getValue();
                TrieNode fail = curr.fail;
                while (fail != null && !fail.children.containsKey(c)) fail = fail.fail;
                child.fail = (fail == null) ? root : fail.children.getOrDefault(c, root);
                if (child.fail == child) child.fail = root;
                child.output.addAll(child.fail.output);
                queue.add(child);
            }
        }

        // Phase 3: Scan big string
        TrieNode curr = root;
        for (int i = 0; i < big.length(); i++) {
            char c = big.charAt(i);
            while (curr != root && !curr.children.containsKey(c)) curr = curr.fail;
            curr = curr.children.getOrDefault(c, root);
            for (String matched : curr.output) {
                result.get(matched).add(i - matched.length() + 1);
            }
        }

        return result;
    }
}
```

## Complexity Analysis

| Phase | Time Complexity | Technical Detail |
|---|---|---|
| Trie Construction | $O(\sum L)$ | One traversal per character of each small. |
| Failure Link BFS | $O(\sum L \cdot |\Sigma|)$ | Alphabet-size bounded BFS. |
| Text Scan | $O(B + M)$ | Amortized linear on document length B + M matches. |
| **Total** | **$O(B + \sum L + M)$** | **Optimal multi-pattern matching.** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Intrusion Detection and Content Filtering

1. **Snort / Suricata NIDS:** Network Intrusion Detection Systems scan packet payloads simultaneously against thousands of malware signature patterns using Aho-Corasick engines implemented in DPDK-accelerated ring buffers.
2. **Google Cloud DLP (Data Loss Prevention):** Inspects document corpora for hundreds of PII patterns (credit card regexes, SSNs, email formats) in parallel without sequential scanning.

## Edge Cases & Production Hardening

1. **Empty Smalls:** Returns empty hit lists for missing patterns.
2. **Overlapping Patterns (`"a"`, `"aa"`):** Output links chain correctly to emit all nested matches at each position.
