---
title: "Diving Board: Generate All Possible Board Lengths (CTCI 16.11)"
description: "CTCI problem 16.11: compute all possible total lengths of a diving board built using K planks of shorter or longer size."
date: "2025-11-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-11-diving-board.webp
previewImage: /assets/images/ctci-16-11-diving-board.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.११ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.११: compute all possible total lengths of a diving board built using K planks of shorter or longer size.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.११** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.११: compute all possible total lengths of a diving board built using K planks of shorter or longer size.

## २. कोड और कार्यान्वयन

```java
public static Set<Integer> allLengths(int k, int shorter, int longer) {
    Set<Integer> lengths = new HashSet<>();
    for (int i = 0; i <= k; i++) {
        int length = i * shorter + (k - i) * longer;
        lengths.add(length);
    }
    return lengths;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।