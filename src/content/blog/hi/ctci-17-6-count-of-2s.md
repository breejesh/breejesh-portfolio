---
title: "Count of 2s: Count Total Occurrences of Digit 2 Between 0 and N (CTCI 17.6)"
description: "CTCI problem 17.6: count occurrences of digit 2 in all numbers from 0 to N using digit-by-digit math in O(log N) time."
date: "2025-10-16"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-6-count-of-2s.webp
previewImage: /assets/images/ctci-17-6-count-of-2s.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.६ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.६: count occurrences of digit २ in all numbers from ० to N using digit-by-digit math in O(log N) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.६** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.६: count occurrences of digit २ in all numbers from ० to N using digit-by-digit math in O(log N) time.

## २. कोड और कार्यान्वयन

```java
public static int count2sInRange(int number) {
    int count = 0;
    int len = String.valueOf(number).length();
    for (int digit = 0; digit < len; digit++) {
        count += count2sAtDigit(number, digit);
    }
    return count;
}
private static int count2sAtDigit(int number, int d) {
    int pow10 = (int) Math.pow(10, d);
    int nextPow10 = pow10 * 10;
    int right = number % pow10;
    int roundDown = number - number % nextPow10;
    int roundUp = roundDown + nextPow10;
    int digit = (number / pow10) % 10;
    if (digit < 2) return roundDown / 10;
    if (digit == 2) return roundDown / 10 + right + 1;
    return roundUp / 10;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।