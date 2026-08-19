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

तकनीकी साक्षात्कार में आपसे समस्या **१७.१** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

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