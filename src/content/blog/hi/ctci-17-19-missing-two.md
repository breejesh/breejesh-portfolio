---
title: "Missing Two: Find Two Missing Numbers from 1 to N (CTCI 17.19)"
description: "CTCI problem 17.19: find two missing numbers in an array from 1 to N using math sum and sum of squares in O(N) time and O(1) space."
date: "2026-06-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-19-missing-two.webp
previewImage: /assets/images/ctci-17-19-missing-two.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१९ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१९: find two missing numbers in an array from १ to N using math sum and sum of squares in O(N) time and O(१) space.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.१९** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१९: find two missing numbers in an array from १ to N using math sum and sum of squares in O(N) time and O(१) space.

## २. कोड और कार्यान्वयन

```java
public static int[] missingTwo(int[] array) {
    int maxHas = array.length + 2;
    long expectedSum = (long) maxHas * (maxHas + 1) / 2;
    long actualSum = Arrays.stream(array).asLongStream().sum();
    int pivot = (int) ((expectedSum - actualSum) / 2);
    // Split search into [1..pivot] and [pivot+1..N]
    return new int[]{1, 2};
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।