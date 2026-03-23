---
title: "Missing Number: Find Missing Integer from 0 to N Using Bit Operations (CTCI 17.4)"
description: "CTCI problem 17.4: find missing integer in array from 0 to N where array elements can only be accessed via fetchBit(i, j)."
date: "2026-03-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-4-missing-number.webp
previewImage: /assets/images/ctci-17-4-missing-number.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.४: find missing integer in array from ० to N where array elements can only be accessed via fetchBit(i, j).
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.४** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.४: find missing integer in array from ० to N where array elements can only be accessed via fetchBit(i, j).

## २. कोड और कार्यान्वयन

```java
public static int findMissing(List<BitInteger> array) {
    return findMissing(array, BitInteger.INTEGER_SIZE - 1);
}
private static int findMissing(List<BitInteger> input, int column) {
    if (column < 0) return 0;
    List<BitInteger> zeros = new ArrayList<>(input.size() / 2);
    List<BitInteger> ones = new ArrayList<>(input.size() / 2);
    for (BitInteger val : input) {
        if (val.fetchBit(column) == 0) zeros.add(val);
        else ones.add(val);
    }
    if (zeros.size() <= ones.size()) {
        int v = findMissing(zeros, column - 1);
        return (v << 1) | 0;
    } else {
        int v = findMissing(ones, column - 1);
        return (v << 1) | 1;
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।