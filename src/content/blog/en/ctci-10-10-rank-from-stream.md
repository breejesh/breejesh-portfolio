---
title: "Rank from Stream: Order Statistic Trees for Dynamic Stream Ranking (CTCI 10.10)"
description: "Maintain and query the rank of numbers in an incoming stream of integers using an Augmented Binary Search Tree (Order Statistic Tree) in O(log N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine you are reading in a stream of integers. Periodically, you wish to look up the rank of a number $x$ (the number of values less than or equal to $x$). Implement `track(int x)` and `getRankOfNumber(int x)`.
> * **The Optimal Solution:** **Augmented Binary Search Tree (Order Statistic Tree)**: (1) Each node maintains its value `data`, child pointers, and an integer `left_size` tracking the exact count of nodes in its left subtree; (2) `track(x)`: When descending left, increment `left_size++`; (3) `getRankOfNumber(x)`: If $x == \text{data}$, return `left_size`; if $x < \text{data}$, recurse left; if $x > \text{data}$, return `left_size + 1 + right.getRank(x)`; (4) Executes in **$O(\log N)$ time** per stream insertion and rank query on balanced trees and **$O(N)$ space**.
> * **Production Reality:** Real-time percentile tracking in Datadog/Prometheus (t-digest), online quantile summaries, and live gaming multiplayer leaderboard ranks.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.10), we are asked:

*"Imagine you are reading in a stream of integers. Periodically, you wish to be able to look up the rank of a number x (the number of values less than or equal to x). Implement track(int x) and getRankOfNumber(int x)."*

## 2. Order Statistic Tree Invariant

An array or list requires either $O(1)$ insert and $O(N)$ rank scan, or $O(N)$ sorted insert and $O(\log N)$ binary search.

By augmenting a Binary Search Tree with a `left_size` attribute:
```
       Node(20, left_size = 4)
      /                       \
  Node(15, left_size = 3)    Node(25, left_size = 0)
```
When querying rank for $x > \text{data}$, we know that the current node, all nodes in its left subtree, and nodes in the right subtree smaller than $x$ are strictly $\le x$:
$$\text{Rank}(x) = \text{left\_size} + 1 + \text{right.getRank}(x)$$

## Production Implementation

```java
public class RankFromStream {
    public static class RankNode {
        public int left_size = 0;
        public RankNode left, right;
        public int data = 0;

        public RankNode(int d) {
            this.data = d;
        }

        public void insert(int d) {
            if (d <= data) {
                left_size++;
                if (left != null) {
                    left.insert(d);
                } else {
                    left = new RankNode(d);
                }
            } else {
                if (right != null) {
                    right.insert(d);
                } else {
                    right = new RankNode(d);
                }
            }
        }

        public int getRank(int d) {
            if (d == data) {
                return left_size;
            } else if (d < data) {
                if (left == null) return -1;
                return left.getRank(d);
            } else {
                int right_rank = (right == null) ? -1 : right.getRank(d);
                if (right_rank == -1) return -1;
                return left_size + 1 + right_rank;
            }
        }
    }

    private RankNode root = null;

    public void track(int number) {
        if (root == null) {
            root = new RankNode(number);
        } else {
            root.insert(number);
        }
    }

    public int getRankOfNumber(int number) {
        if (root == null) return -1;
        return root.getRank(number);
    }
}
```

## Complexity & Memory Analysis

| Operation | Balanced BST Complexity | Degraded Tree Complexity | Technical Detail |
|---|---|---|---|
| Stream Ingestion (`track`) | `O(log N)` | `O(N)` | Single branch descent incrementing `left_size`. |
| Rank Query (`getRankOfNumber`) | `O(log N)` | `O(N)` | Traversal accumulating subtree weights. |
| Total Space | `O(N)` | `O(N)` | Exactly 1 `RankNode` per stream element. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Dynamic Stream Quantiles

1. **APM Percentile Metric Engines (Prometheus / Datadog):** Ingests millions of HTTP request latencies per second, using dynamic tree structures (T-Digest / GK-Quantiles) to answer P50, P95, and P99 queries in sub-millisecond time.
2. **Multiplayer Matchmaking (MMR):** Tracks relative player skill ranks in real-time streams.

## Edge Cases & Production Hardening

1. **Duplicates in Stream ($d == \text{data}$):** Placed in the left subtree; `left_size` automatically accounts for duplicate entries.
2. **Non-Existent Query Number:** Gracefully propagates `-1` if the number was never inserted into the stream.
