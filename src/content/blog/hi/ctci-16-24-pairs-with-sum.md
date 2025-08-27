---
title: "Pairs with Sum: Find All Pairs in Array Summing to Target Value (CTCI 16.24)"
description: "CTCI problem 16.24: find all pairs of integers in an array that sum to a target value in O(N) time."
date: "2025-08-27"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.२४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.२४: find all pairs of integers in an array that sum to a target value in O(N) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.२४** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.२४: find all pairs of integers in an array that sum to a target value in O(N) time.

## २. कोड और कार्यान्वयन

```java
public static List<int[]> printPairSums(int[] array, int sum) {
    List<int[]> pairs = new ArrayList<>();
    Map<Integer, Integer> counts = new HashMap<>();
    for (int x : array) {
        int complement = sum - x;
        if (counts.getOrDefault(complement, 0) > 0) {
            pairs.add(new int[]{x, complement});
            counts.put(complement, counts.get(complement) - 1);
        } else {
            counts.put(x, counts.getOrDefault(x, 0) + 1);
        }
    }
    return pairs;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।