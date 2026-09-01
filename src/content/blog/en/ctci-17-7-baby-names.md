---
title: "Baby Names: Synonym Clustering via Graph Connected Components (CTCI 17.7)"
description: "Aggregate baby name frequencies across synonym alias pairs using Graph Connected Components DFS and Disjoint Set Union (Union-Find) in O(V + E) linear time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-7-baby-names.webp
previewImage: /assets/images/ctci-17-7-baby-names.webp
---

> **TL;DR**
> * **The Book Problem:** You are given two lists: one of baby names with their annual registration frequencies, and another of pairs of equivalent synonym names (e.g., `(John, Jon)`, `(Jon, Johnny)`). Output a consolidated list of canonical names with their true total frequencies summed across all synonyms.
> * **The Optimal Solution:** **Graph Connected Components DFS / Disjoint Set Union (DSU)**:
>   1. **Graph Construction**: Treat each unique name as a graph vertex $V$. Add an undirected edge for each equivalent pair $(u, v) \in E$.
>   2. **Component Traversal**: For each unvisited name, perform a Depth-First Search (DFS) to explore its entire connected equivalence cluster.
>   3. **Frequency Accumulation**: Sum the frequencies of all aliases in the component and map the total to a chosen canonical root name (e.g., lexicographically smallest or component root).
>   4. Runs in **$O(V + E)$ time** and **$O(V + E)$ auxiliary space**.
> * **Production Reality:** Entity resolution in knowledge graphs (Wikidata), deduplication in customer master data management (MDM), and search engine alias synset grouping.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.7), we are asked:

*"Given a frequency map of names and a list of transitive synonym pairs, combine all synonym variations into unified canonical entries with aggregated frequencies."*

## 2. Graph Component Equivalence Clustering

```
Synonyms: (John, Jon), (Jon, Johnny), (Chris, Kris), (Christopher, Chris)

Graph Connected Components:
  [Component 1]          [Component 2]
     John                   Chris
    /    \                 /     \
  Jon ── Johnny         Kris     Christopher

Frequency Aggregations:
  Component 1: John(15) + Jon(12) + Johnny(10) ──> "John" : 37
  Component 2: Chris(13) + Kris(4) + Christopher(19) ──> "Chris" : 36
```

## Production Java Implementation

```java
import java.util.*;

public class BabyNames {

    public static class GraphNode {
        public final String name;
        public int frequency = 0;
        public final List<GraphNode> neighbors = new ArrayList<>();
        public boolean visited = false;

        public GraphNode(String name, int frequency) {
            this.name = name;
            this.frequency = frequency;
        }
    }

    /**
     * Aggregates name frequencies via Graph Connected Components DFS.
     * Time Complexity: O(V + E)
     * Space Complexity: O(V + E)
     */
    public static Map<String, Integer> trulyPopularNames(
            Map<String, Integer> names,
            String[][] synonyms) {

        Map<String, GraphNode> graph = new HashMap<>();

        // 1. Initialize vertices with frequencies
        for (Map.Entry<String, Integer> entry : names.entrySet()) {
            graph.put(entry.getKey(), new GraphNode(entry.getKey(), entry.getValue()));
        }

        // 2. Add undirected edges for synonym pairs
        for (String[] pair : synonyms) {
            String name1 = pair[0];
            String name2 = pair[1];

            GraphNode node1 = graph.computeIfAbsent(name1, k -> new GraphNode(k, 0));
            GraphNode node2 = graph.computeIfAbsent(name2, k -> new GraphNode(k, 0));

            node1.neighbors.add(node2);
            node2.neighbors.add(node1);
        }

        // 3. Traverse connected components and accumulate counts
        Map<String, Integer> rootFrequencies = new HashMap<>();

        for (GraphNode node : graph.values()) {
            if (!node.visited) {
                int totalFrequency = getComponentFrequency(node);
                rootFrequencies.put(node.name, totalFrequency);
            }
        }

        return rootFrequencies;
    }

    private static int getComponentFrequency(GraphNode node) {
        if (node.visited) return 0;
        node.visited = true;

        int sum = node.frequency;
        for (GraphNode neighbor : node.neighbors) {
            sum += getComponentFrequency(neighbor);
        }
        return sum;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(V + E)` | Linear graph traversal visiting each name node and synonym edge once. |
| Auxiliary Space | `O(V + E)` | Adjacency list graph and recursion call stack. |
| Transitive Equivalence | Exact | Correctly joins indirect aliases ($A \sim B$ and $B \sim C \implies A \sim C$). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Entity Resolution & Master Data Management

1. **Enterprise Identity Resolution (Zendesk / Salesforce MDM):** Customer databases merge duplicate customer accounts created across channels (email aliases, social handles, phone numbers) into golden customer IDs using connected component graph clusters.
2. **Search Synsets (WordNet / Elasticsearch):** Query expansion pipelines aggregate search intent across synonym sets before hitting inverted indices.

## Edge Cases & Production Hardening

1. **Transitive Chains & Cycles:** Graph DFS tracks `visited = true` to handle circular synonym loops (`A=B, B=C, C=A`) without infinite recursion.
2. **Names without Synonyms:** Isolated vertices are visited once and emitted directly with their original frequency.
