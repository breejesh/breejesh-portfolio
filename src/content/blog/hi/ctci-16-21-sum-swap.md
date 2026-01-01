---
title: "Sum Swap: Find Element Pair to Swap for Equal Array Sums (CTCI 16.21)"
description: "CTCI problem 16.21: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time."
date: "2026-01-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-21-sum-swap.webp
previewImage: /assets/images/ctci-16-21-sum-swap.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.२१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.२१: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.२१** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.२१: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time.

## २. कोड और कार्यान्वयन

```java
public static int[] findSwapValues(int[] array1, int[] array2) {
    int sum1 = Arrays.stream(array1).sum();
    int sum2 = Arrays.stream(array2).sum();
    int target = (sum1 - sum2);
    if (target % 2 != 0) return null;
    int targetDiff = target / 2;
    Set<Integer> set2 = Arrays.stream(array2).boxed().collect(Collectors.toSet());
    for (int one : array1) {
        if (set2.contains(one - targetDiff)) return new int[]{one, one - targetDiff};
    }
    return null;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।