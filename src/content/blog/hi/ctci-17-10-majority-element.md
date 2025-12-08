---
title: "Majority Element: Boyer-Moore Majority Vote Algorithm (CTCI 17.10)"
description: "CTCI problem 17.10: find the element that appears more than N/2 times in an array in O(N) time and O(1) space."
date: "2025-12-08"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-10-majority-element.webp
previewImage: /assets/images/ctci-17-10-majority-element.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१० का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१०: find the element that appears more than N/२ times in an array in O(N) time and O(१) space.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.१०** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१०: find the element that appears more than N/२ times in an array in O(N) time and O(१) space.

## २. कोड और कार्यान्वयन

```java
public static int findMajorityElement(int[] array) {
    int candidate = getCandidate(array);
    return validate(array, candidate) ? candidate : -1;
}
private static int getCandidate(int[] array) {
    int majority = 0, count = 0;
    for (int n : array) {
        if (count == 0) majority = n;
        if (n == majority) count++;
        else count--;
    }
    return majority;
}
private static boolean validate(int[] array, int candidate) {
    int count = 0;
    for (int n : array) if (n == candidate) count++;
    return count > array.length / 2;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।