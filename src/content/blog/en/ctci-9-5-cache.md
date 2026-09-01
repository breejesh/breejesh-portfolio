---
title: "Cache: Distributed Query Caching and Tiered Invalidation Architecture (CTCI 9.5)"
description: "Design a high-throughput distributed caching tier for an expensive search engine query processing cluster with O(1) LRU eviction and asynchronous cache invalidation."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine a web server for a simplified search engine with 100 machines responding to search queries, which call an expensive `processSearch(string query)` cluster. Queries are routed at random across the 100 frontend machines. Design a caching mechanism for the most recent queries. Explain how you would update the cache when data changes.
> * **The Optimal Solution:** Tiered Hybrid Cache Architecture: (1) **L1 Local Cache**: Each frontend machine maintains a local high-velocity in-memory LRU cache ($O(1)$ access without network hops for viral queries); (2) **L2 Distributed Cache Cluster**: Sharded Redis / Memcached tier where queries map to dedicated cache nodes via consistent hashing `hash(query) % num_cache_nodes`; (3) **LRU Data Structure**: Doubly linked list + hash map executing $O(1)$ lookups and $O(1)$ evictions; (4) **Invalidation & Refresh**: TTL time-decay + event-driven pub/sub invalidation when document indexes update.
> * **Production Reality:** Web search cache architectures at Google / Bing, Akamai edge caching, and GraphQL query response caching.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.5), we are asked:

*"Imagine a web server for a simplified search engine with 100 frontends calling an expensive processSearch() backend. Design a caching mechanism for the most recent queries and detail cache invalidation when underlying search index data changes."*

## 2. Architectural Analysis: Local vs Distributed vs Hybrid

| Architecture | Pros | Cons |
|---|---|---|
| **Option 1: Isolated Local Cache** | Zero network latency. | Low cache hit rate (same query routed to 100 different machines duplicates cache entries 100 times). |
| **Option 2: Dedicated Distributed Cache** | High cache hit rate; optimal memory utilization; query maps to single dedicated cache server. | Extra network hop (1-2 ms) on cache hit. |
| **Option 3: Two-Tier Hybrid (Recommended)** | L1 local cache holds top 1% viral queries (80% traffic); L2 distributed cluster handles remaining tail queries. | Slightly higher architectural complexity. |

## Production Implementation

```java
import java.util.HashMap;
import java.util.Map;

public class LRUQueryCache {
    public static class Node {
        public String query;
        public String[] results;
        public Node prev;
        public Node next;

        public Node(String q, String[] res) {
            this.query = q;
            this.results = res;
        }
    }

    private final int capacity;
    private final Map<String, Node> map = new HashMap<>();
    private final Node head = new Node(null, null); // Dummy head
    private final Node tail = new Node(null, null); // Dummy tail

    public LRUQueryCache(int cap) {
        this.capacity = cap;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized String[] get(String query) {
        Node node = map.get(query);
        if (node == null) return null;

        // Move accessed node to head (most recently used)
        detach(node);
        attach(node);
        return node.results;
    }

    public synchronized void put(String query, String[] results) {
        if (map.containsKey(query)) {
            Node node = map.get(query);
            node.results = results;
            detach(node);
            attach(node);
            return;
        }

        if (map.size() >= capacity) {
            // Evict least recently used (node before tail)
            Node lru = tail.prev;
            detach(lru);
            map.remove(lru.query);
        }

        Node newNode = new Node(query, results);
        attach(newNode);
        map.put(query, newNode);
    }

    private void attach(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void detach(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}
```

## Complexity & Architecture Analysis

| Operation | Time Complexity | Technical Detail |
|---|---|---|
| Cache Read (`get`) | `O(1)` | Hash map pointer lookup + constant-time linked list detachment. |
| Cache Write (`put`) | `O(1)` | Hash map insertion + node prepending to doubly linked list. |
| Memory Capacity | `O(C)` | Bounded to exact configured capacity $C$ items. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Cache Invalidation Strategies

1. **TTL (Time to Live) Expiration:** Every cached query payload is tagged with an expiration timestamp (e.g., 300 seconds).
2. **Event-Driven Pub/Sub Invalidation:** When search indexers ingest a new document batch, they publish mutated keyword events over Apache Kafka to invalidate matching cached queries across the distributed cache cluster.

## Edge Cases & Production Hardening

1. **Thundering Herd / Cache Stampede:** If a popular query expires, thousands of concurrent requests attempt to recalculate `processSearch()`. Production caches use single-flight mutex locks (mutex locks per key) so only one backend call is made while others await the cached result.
2. **Cache Penetration:** Cache null results for empty searches with a short TTL to prevent repeated expensive lookups on non-existent terms.
