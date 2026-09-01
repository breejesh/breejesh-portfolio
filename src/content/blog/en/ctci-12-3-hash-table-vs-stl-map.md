---
title: "Hash Table vs. STL Map: Internal Data Structures and Performance Tradeoffs (CTCI 12.3)"
description: "Compare std::unordered_map (Hash Table) and std::map (Red-Black Tree) in C++, detailing bucket chaining, tree rebalancing, and small-input selection criteria."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
previewImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
---

> **TL;DR**
> * **The Book Problem:** Compare and contrast a hash table and an STL map. How is a hash table implemented? If the number of inputs is small, which would you use?
> * **The Fundamental Differences:** (1) **Data Structure**: `std::unordered_map` is a **Hash Table** with bucket chaining/open addressing, whereas `std::map` is a self-balancing **Red-Black Binary Search Tree**; (2) **Time Complexity**: `unordered_map` offers $O(1)$ average lookup ($O(N)$ worst case under collisions), whereas `std::map` guarantees strict $O(\log N)$ worst-case lookup; (3) **Ordering**: `std::map` maintains strict sorted order via `operator<`, while `unordered_map` has arbitrary bucket order.
> * **Small Input Decision:** For small inputs ($N \le 50$), `std::map` (or a flat sorted `std::vector`) is often preferred due to zero hash calculation overhead, no empty bucket array memory waste, and zero rehashing spikes.
> * **Production Reality:** High-frequency trading order books (flat arrays/trees) vs large-scale web cache key lookups (Swiss Tables / Abseil flat_hash_map).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.3), we are asked:

*"Compare and contrast a hash table and an STL map. How is a hash table implemented? If the number of inputs is small, which would you use?"*

## 2. Deep Structural Comparison

| Dimension | `std::unordered_map` (Hash Table) | `std::map` (Red-Black Tree) |
|---|---|---|
| **Underlying Structure** | Array of bucket linked lists (Separate Chaining). | Self-balancing Red-Black BST. |
| **Lookup (Average)** | $O(1)$ | $O(\log N)$ |
| **Lookup (Worst Case)** | $O(N)$ (All keys collide in 1 bucket). | $O(\log N)$ (Strict logarithmic bound). |
| **Key Ordering** | Unordered / Non-deterministic. | Strictly sorted (`operator<`). |
| **Memory Overhead** | Array of bucket pointers + node pointers. | 3 pointers (`parent`, `left`, `right`) + color bit per node. |
| **Key Requirements** | `std::hash<Key>` and `operator==`. | `std::less<Key>` (`operator<`). |

## Production Implementation & Benchmarks

```cpp
#include <iostream>
#include <map>
#include <unordered_map>
#include <string>
#include <vector>
#include <algorithm>

/**
 * Minimal Chained Hash Table Implementation (C++ Style)
 */
template <typename K, typename V>
class SimpleHashTable {
private:
    struct HashNode {
        K key;
        V value;
        HashNode* next;
        HashNode(const K& k, const V& v) : key(k), value(v), next(nullptr) {}
    };

    static const int BUCKET_COUNT = 101;
    HashNode* table[BUCKET_COUNT];

    int hashFunction(const K& key) const {
        return std::hash<K>{}(key) % BUCKET_COUNT;
    }

public:
    SimpleHashTable() {
        for (int i = 0; i < BUCKET_COUNT; i++) table[i] = nullptr;
    }

    void insert(const K& key, const V& value) {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];

        while (entry != nullptr) {
            if (entry->key == key) {
                entry->value = value;
                return;
            }
            entry = entry->next;
        }

        HashNode* newNode = new HashNode(key, value);
        newNode->next = table[idx];
        table[idx] = newNode;
    }

    bool get(const K& key, V& outValue) const {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];
        while (entry != nullptr) {
            if (entry->key == key) {
                outValue = entry->value;
                return true;
            }
            entry = entry->next;
        }
        return false;
    }
};
```

## Why Use `std::map` (or `std::vector`) for Small Inputs?

For small collections ($N < 50$):
1. **Zero Hash Calculation Overhead:** Complex string hash algorithms (MurmurHash, CityHash) require dozens of CPU instructions per key lookup.
2. **No Rehashing Penalties:** Hash tables periodically reallocate and re-index all buckets when the load factor exceeds threshold $\alpha \approx 1.0$.
3. **Cache Line Locality:** A sorted contiguous `std::vector<std::pair<K, V>>` with `std::lower_bound` outperforms both trees and hash maps on modern CPUs due to hardware prefetching.

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Modern Swiss Tables (Google Abseil)

1. **Abseil `absl::flat_hash_map`:** Modern C++ replaces node-based linked lists with closed-addressing flat arrays where 8-bit SSE/AVX SIMD instructions probe 16 metadata control bytes simultaneously.
2. **Deterministic Iteration:** Financial trading and consensus algorithms mandate `std::map` to eliminate nondeterministic hash table iteration order across cluster nodes.

## Edge Cases & Production Hardening

1. **Hash DoS Attacks:** Malicious actors sending crafted colliding strings degrade `std::unordered_map` lookups from $O(1)$ to $O(N)$. Production web servers use randomized SipHash seeds.
