---
title: "Sales Rank: Real-Time E-Commerce Best-Seller Rankings Engine (CTCI 9.6)"
description: "Design a scalable real-time best-seller ranking and leaderboard engine across categories and sliding time windows using Redis Sorted Sets and stream aggregation."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---

> **TL;DR**
> * **The Book Problem:** A large e-commerce company wishes to list the best-selling products, overall and by category. For example, a product might be #1056 overall, #13 under "Sports", and #24 under "Safety". Outline the data structures and algorithms to track and update these ranks across multiple sliding windows (1 hour, 24 hours, 7 days, all-time).
> * **The Optimal Solution:** **Dual-Stream Lambda / Kappa Ranking Engine**: (1) **Ingestion Stream**: Purchases publish events to Apache Kafka; (2) **Real-Time Leaderboard (Past 1h / 24h)**: Redis Sorted Sets (`ZSET` based on Skip Lists) maintaining category leaderboards with `ZINCRBY` and `ZREVRANK` in $O(\log N)$ time; (3) **Sliding Window Aggregation**: Circular ring-buffer time buckets (e.g. 60 1-minute buckets for 1 hour); (4) **Historical Analytics (7d / 30d)**: Asynchronous Apache Flink stream aggregations materialize static rank tables into cold storage.
> * **Production Reality:** Amazon Best Sellers Rank (BSR) algorithm, App Store top grossing leaderboards, and Steam concurrent player leaderboards.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.6), we are asked:

*"A large e-commerce company wishes to list the best-selling products, overall and by category, across varying time slices (past hour, past 24 hours, past 7 days, all time). Outline the data structures and architecture to support real-time querying and updates."*

## 2. Architecture & Data Structures

### Scale Estimation
* **Catalog:** 100 million products across 5,000 categories.
* **Transaction Velocity:** 50,000 purchases/second peak.

### Component Design:
1. **Redis Sorted Sets (`ZSET`):**
   * Key: `rank:category_id:window_id` (e.g., `rank:sports:24h`).
   * Member: `product_id`.
   * Score: Aggregated sales count.
   * `ZINCRBY(key, delta, product_id)`: Increments purchase count in $O(\log N)$.
   * `ZREVRANGE(key, 0, 99)`: Fetches Top 100 best-sellers in $O(\log N + M)$.
   * `ZREVRANK(key, product_id)`: Gets exact rank of a specific product in $O(\log N)$.
2. **Circular Time Buckets:**
   * For rolling 1-hour window: 60 discrete 1-minute buckets. At minute $T$, subtract minute $T - 60$ and add minute $T$.

## Production Implementation

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class SalesRankEngine {
    public static class ProductSales implements Comparable<ProductSales> {
        public final String productId;
        public int salesCount;

        public ProductSales(String id, int sales) {
            this.productId = id;
            this.salesCount = sales;
        }

        @Override
        public int compareTo(ProductSales other) {
            return Integer.compare(this.salesCount, other.salesCount);
        }
    }

    // Category -> (ProductId -> Sales)
    private final Map<String, Map<String, Integer>> categorySales = new HashMap<>();

    public synchronized void recordPurchase(String productId, String[] categories, int quantity) {
        for (String cat : categories) {
            categorySales.putIfAbsent(cat, new HashMap<>());
            Map<String, Integer> salesMap = categorySales.get(cat);
            salesMap.put(productId, salesMap.getOrDefault(productId, 0) + quantity);
        }
    }

    /**
     * Retrieves Top K best sellers in a category using a Min-Heap.
     * Time Complexity: O(N log K)
     * Space Complexity: O(K)
     */
    public synchronized PriorityQueue<ProductSales> getTopK(String category, int k) {
        Map<String, Integer> salesMap = categorySales.get(category);
        if (salesMap == null) return new PriorityQueue<>();

        PriorityQueue<ProductSales> minHeap = new PriorityQueue<>(k);

        for (Map.Entry<String, Integer> entry : salesMap.entrySet()) {
            ProductSales ps = new ProductSales(entry.getKey(), entry.getValue());
            if (minHeap.size() < k) {
                minHeap.add(ps);
            } else if (ps.salesCount > minHeap.peek().salesCount) {
                minHeap.poll();
                minHeap.add(ps);
            }
        }

        return minHeap;
    }
}
```

## Complexity & Architecture Analysis

| Operation | Complexity | Technical Detail |
|---|---|---|
| Purchase Ingestion | `O(log N)` | Redis `ZINCRBY` skip list score update. |
| Top-K Category Fetch | `O(log N + K)` | Range scan over top $K$ elements in skip list. |
| Specific Product Rank | `O(log N)` | Forward index rank offset query (`ZREVRANK`). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Amazon BSR Calculation

1. **Exponential Time Decay:** Recent sales are weighted higher than older sales using exponential half-life formulas ($S = \sum \text{qty} \cdot e^{-\lambda \Delta t}$).
2. **Top-N Edge Caching:** Over 99% of user traffic reads only the Top 100 products per category. Statically caching Top-100 JSON payloads on CDN edge nodes absorbs billions of read requests with zero database overhead.

## Edge Cases & Production Hardening

1. **Tie Breaking:** In the event of equal sales counts, break ties using historical all-time sales or lexicographical product ID.
2. **Category Hierarchy Propagation:** A purchase in "Tennis Shoes" automatically increments counters in parent categories "Shoes", "Apparel", and "Overall".
