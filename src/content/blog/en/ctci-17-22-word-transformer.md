---
title: "Word Transformer: BFS Shortest Transformation Sequence on Implicit Word Graph (CTCI 17.22)"
description: "Find the shortest path between two words where each step changes exactly one letter and every intermediate word exists in a dictionary using BFS on an implicit word graph in O(N * L^2) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-22-word-transformer.webp
previewImage: /assets/images/ctci-17-22-word-transformer.webp
---

> **TL;DR**
> * **The Book Problem:** Given a source word, a target word, and a dictionary, find the shortest sequence of word transformations where each step differs by exactly one character and every intermediate word is in the dictionary.
> * **The Optimal Solution:** **Bidirectional BFS on Implicit Word Graph**:
>   1. Build a wildcard adjacency map: for each word, generate all patterns with one `*` substituted (e.g., `"hit"` → `{"*it", "h*t", "hi*"}`). Each pattern maps to a list of matching words.
>   2. Run **BFS from both source and target** simultaneously. The search terminates when the two frontiers intersect.
>   3. Bidirectional BFS reduces the explored state space from $O(b^d)$ to $O(2 \cdot b^{d/2})$ where $b$ is the branching factor.
>   4. Time: **$O(N \cdot L^2)$**, Space: **$O(N \cdot L)$**.
> * **Production Reality:** Spell-checker suggestion engines, lexicographic synonym graph traversal, and knowledge graph hop-path retrieval.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.22), we are asked:

*"Given a source and target word, find the shortest sequence of words where consecutive words differ by exactly one letter and all intermediate words are in the dictionary."*

## 2. Wildcard Pattern Map and BFS

```
dictionary = {"hit", "hot", "dot", "dog", "lot", "log", "cog"}
source = "hit", target = "cog"

Wildcard patterns:
  "hit" -> "*it", "h*t", "hi*"
  "hot" -> "*ot", "h*t", "ho*"
  ...
  "h*t" -> ["hit", "hot"]

BFS from "hit":
  Level 1: hot
  Level 2: dot, lot
  Level 3: dog, log
  Level 4: cog  <-- found

Shortest path: hit -> hot -> dot -> dog -> cog (length 5)
```

## Production Java Implementation

```java
import java.util.*;

public class WordTransformer {

    public static List<String> transform(String start, String stop, Set<String> dictionary) {
        if (!dictionary.contains(stop)) return null;

        Map<String, List<String>> wildcardMap = buildWildcardMap(dictionary);

        // Bidirectional BFS
        BFSData sourceData = new BFSData(start);
        BFSData destData   = new BFSData(stop);

        while (!sourceData.toVisit.isEmpty() && !destData.toVisit.isEmpty()) {
            String collision = extendBFS(sourceData, destData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);

            collision = extendBFS(destData, sourceData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
        }
        return null;
    }

    private static Map<String, List<String>> buildWildcardMap(Set<String> dict) {
        Map<String, List<String>> map = new HashMap<>();
        for (String word : dict) {
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                map.computeIfAbsent(pattern, k -> new ArrayList<>()).add(word);
            }
        }
        return map;
    }

    static class BFSData {
        Queue<String> toVisit = new LinkedList<>();
        Map<String, String> visited = new HashMap<>(); // word -> previous word

        BFSData(String start) {
            toVisit.add(start);
            visited.put(start, null);
        }
    }

    private static String extendBFS(BFSData primary, BFSData other, Map<String, List<String>> map) {
        int count = primary.toVisit.size();
        while (count-- > 0) {
            String word = primary.toVisit.poll();
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                for (String neighbor : map.getOrDefault(pattern, Collections.emptyList())) {
                    if (!primary.visited.containsKey(neighbor)) {
                        primary.visited.put(neighbor, word);
                        primary.toVisit.add(neighbor);
                    }
                    if (other.visited.containsKey(neighbor)) return neighbor;
                }
            }
        }
        return null;
    }

    private static List<String> mergePaths(BFSData src, BFSData dst, String collision) {
        LinkedList<String> pathSrc = new LinkedList<>();
        String curr = collision;
        while (curr != null) { pathSrc.addFirst(curr); curr = src.visited.get(curr); }

        List<String> pathDst = new ArrayList<>();
        curr = dst.visited.get(collision);
        while (curr != null) { pathDst.add(curr); curr = dst.visited.get(curr); }

        pathSrc.addAll(pathDst);
        return pathSrc;
    }
}
```

## Complexity Analysis

| Phase | Time Complexity | Detail |
|---|---|---|
| Wildcard Map Build | $O(N \cdot L)$ | $N$ words, $L$ patterns each. |
| Bidirectional BFS | $O(N \cdot L^2)$ | Pattern generation per neighbor per word visited. |
| **Total** | **$O(N \cdot L^2)$** | **Optimal for implicit word graph.** |

## Real-World Systems Engineering Discussion

1. **Spell-Checker Suggestion Engines:** Levenshtein distance-1 neighborhood is exactly the wildcard pattern adjacency graph, enabling GPU-parallel nearest-word candidate retrieval.
2. **Knowledge Graph Hop Paths:** Entity resolution in Wikidata uses similar BFS layering across semantic distance-1 predicate transformations.

## Edge Cases & Production Hardening

1. **Target Not in Dictionary:** Return `null` immediately.
2. **Source = Target:** Return single-element list.
