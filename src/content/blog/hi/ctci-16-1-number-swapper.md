---
title: "Number Swapper: Swap Two Numbers In-Place Without Temporary Variables (CTCI 16.1)"
description: "CTCI problem 16.1: swap two numbers in-place using arithmetic addition/subtraction or bitwise XOR logic."
date: "2026-03-21"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-1-number-swapper.webp
previewImage: /assets/images/ctci-16-1-number-swapper.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१: swap two numbers स्थान पर ही (इन-प्लेस) using arithmetic addition/subtraction or bitwise XOR logic.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.१** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१: swap two numbers स्थान पर ही (इन-प्लेस) using arithmetic addition/subtraction or bitwise XOR logic.

## २. कोड और कार्यान्वयन

```java
public static void swap(int a, int b) {
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
    System.out.println("a: " + a + ", b: " + b);
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।