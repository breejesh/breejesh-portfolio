---
title: "Smallest Difference: Minimum Pairwise Difference Between Two Arrays (CTCI 16.6)"
description: "CTCI problem 16.6: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers."
date: "2026-01-27"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-6-smallest-difference.webp
previewImage: /assets/images/ctci-16-6-smallest-difference.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.६ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.६: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.६** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.६: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers.

## २. कोड और कार्यान्वयन

```java
public static int findSmallestDifference(int[] a, int[] b) {
    Arrays.sort(a);
    Arrays.sort(b);
    int aIdx = 0, bIdx = 0;
    int minDiff = Integer.MAX_VALUE;
    while (aIdx < a.length && bIdx < b.length) {
        int diff = Math.abs(a[aIdx] - b[bIdx]);
        if (diff < minDiff) minDiff = diff;
        if (a[aIdx] < b[bIdx]) aIdx++;
        else bIdx++;
    }
    return minDiff;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।