---
title: "LRU Cache: Implement Least Recently Used Cache (CTCI 16.25)"
description: "CTCI problem 16.25: design and build a data structure for Least Recently Used (LRU) cache with O(1) get and put."
date: "2026-04-09"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.२५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.२५: design and build a data structure for Least Recently Used (LRU) cache with O(१) get and put.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.२५** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.२५: design and build a data structure for Least Recently Used (LRU) cache with O(१) get and put.

## २. कोड और कार्यान्वयन

```java
public class LRUCacheCustom {
    class Node { int key, value; Node prev, next; }
    private final Map<Integer, Node> map = new HashMap<>();
    private final int capacity;
    public LRUCacheCustom(int capacity) { this.capacity = capacity; }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।