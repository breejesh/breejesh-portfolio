---
title: "Number Max: Find Maximum of Two Numbers Without Comparison Operators (CTCI 16.7)"
description: "CTCI problem 16.7: find maximum of two integers without using if-else or comparison operators using bitwise sign shift."
date: "2026-01-03"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-7-number-max.webp
previewImage: /assets/images/ctci-16-7-number-max.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.७ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.७: find maximum of two integers without using if-else or comparison operators using bitwise sign shift.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.७** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.७: find maximum of two integers without using if-else or comparison operators using bitwise sign shift.

## २. कोड और कार्यान्वयन

```java
public static int getMax(int a, int b) {
    int k = sign(a - b);
    int q = flip(k);
    return a * k + b * q;
}
private static int sign(int a) { return flip((a >> 31) & 0x1); }
private static int flip(int bit) { return 1 ^ bit; }
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।