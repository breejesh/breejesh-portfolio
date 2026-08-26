---
title: "Rand7 from Rand5: Implement Random Number Generator 1 to 7 (CTCI 16.23)"
description: "CTCI problem 16.23: generate uniform random number from 1 to 7 using only a rand5() random generator."
date: "2025-10-09"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
previewImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.२३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.२३: generate uniform random number from १ to ७ using only a rand५() random generator.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.२३** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.२३: generate uniform random number from १ to ७ using only a rand५() random generator.

## २. कोड और कार्यान्वयन

```java
public static int rand7() {
    while (true) {
        int num = 5 * rand5() + rand5(); // 0 to 24 uniform
        if (num < 21) return num % 7;
    }
}
private static int rand5() { return (int)(Math.random() * 5); }
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।