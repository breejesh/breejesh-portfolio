---
title: "Contiguous Sequence: Maximum Sum Subarray via Kadane's Algorithm (CTCI 16.17)"
description: "CTCI problem 16.17: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm."
date: "2026-03-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-17-contiguous-sequence.webp
previewImage: /assets/images/ctci-16-17-contiguous-sequence.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१७ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१७: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.१७** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१७: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm.

## २. कोड और कार्यान्वयन

```java
public static int getMaxSum(int[] a) {
    int maxSum = 0;
    int currentSum = 0;
    for (int i = 0; i < a.length; i++) {
        currentSum += a[i];
        if (maxSum < currentSum) maxSum = currentSum;
        else if (currentSum < 0) currentSum = 0;
    }
    return maxSum;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।