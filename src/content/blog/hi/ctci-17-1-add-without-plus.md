---
title: "Add Without Plus: Arithmetic Addition via Bitwise XOR and AND (CTCI 17.1)"
description: "CTCI problem 17.1: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry."
date: "2026-02-21"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-1-add-without-plus.webp
previewImage: /assets/images/ctci-17-1-add-without-plus.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.१** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry.

## २. कोड और कार्यान्वयन

```java
public static int add(int a, int b) {
    while (b != 0) {
        int sum = a ^ b; // Sum without carry
        int carry = (a & b) << 1; // Carry shifted left
        a = sum;
        b = carry;
    }
    return a;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।