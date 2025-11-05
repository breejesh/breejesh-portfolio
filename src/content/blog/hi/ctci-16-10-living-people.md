---
title: "Living People: Find Year with Maximum Living Population (CTCI 16.10)"
description: "CTCI problem 16.10: find the calendar year with the maximum number of living people using prefix sum array."
date: "2025-11-05"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-10-living-people.webp
previewImage: /assets/images/ctci-16-10-living-people.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१० का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१०: find the calendar year with the maximum number of living people using prefix sum array.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.१०** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१०: find the calendar year with the maximum number of living people using prefix sum array.

## २. कोड और कार्यान्वयन

```java
public static int maxAliveYear(int[][] people, int minYear, int maxYear) {
    int[] deltas = new int[maxYear - minYear + 2];
    for (int[] p : people) {
        deltas[p[0] - minYear]++;
        deltas[p[1] - minYear + 1]--;
    }
    int maxAlive = 0, maxYearIdx = 0, current = 0;
    for (int year = 0; year < deltas.length; year++) {
        current += deltas[year];
        if (current > maxAlive) { maxAlive = current; maxYearIdx = year; }
    }
    return minYear + maxYearIdx;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।