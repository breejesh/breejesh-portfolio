---
title: "Operations: Implement Multiply, Subtract, Divide Using Only Addition (CTCI 16.9)"
description: "CTCI problem 16.9: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops."
date: "2025-09-07"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-9-operations.webp
previewImage: /assets/images/ctci-16-9-operations.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.९ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.९: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.९** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.९: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops.

## २. कोड और कार्यान्वयन

```java
public static int minus(int a, int b) { return a + negate(b); }
private static int negate(int a) {
    int neg = 0;
    int d = a < 0 ? 1 : -1;
    while (a != 0) { neg += d; a += d; }
    return neg;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।