---
title: "Letters and Numbers: Find Longest Subarray with Equal Letters and Digits (CTCI 17.5)"
description: "CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time."
date: "2026-01-10"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.५: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.५** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.५: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.

## २. कोड और कार्यान्वयन

```java
public static char[] findLongestSubarray(char[] array) {
    int[] deltas = computeDeltaArray(array);
    int[] match = findLongestMatch(deltas);
    return extractSubarray(array, match[0] + 1, match[1]);
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।