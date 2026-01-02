---
title: "Sub Sort: Find Minimum Subarray Index Range to Sort Entire Array (CTCI 16.16)"
description: "CTCI problem 16.16: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array."
date: "2026-01-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-16-sub-sort.webp
previewImage: /assets/images/ctci-16-16-sub-sort.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१६ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१६: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.१६** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१६: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array.

## २. कोड और कार्यान्वयन

```java
public static void findUnsortedSequence(int[] array) {
    int end_left = findLeftSequenceEnd(array);
    int start_right = findRightSequenceStart(array);
    // Expand bounds to cover max and min of unsorted section
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।