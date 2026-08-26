---
title: "Mistake: Debugging an Unsigned Loop Bug in C/Java (CTCI 11.1)"
description: "CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug."
date: "2025-12-20"
tags: [एल्गोरिदम और डेटा संरचनाएं, डेवलपर टूल्स]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या ११.१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem ११.१: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **११.१** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem ११.१: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.

## २. कोड और कार्यान्वयन

```java
void printCountdown() {
    unsigned int i;
    for (i = 100; i >= 0; --i) {
        printf("%d\n", i); // Flaw: i >= 0 is always true for unsigned int!
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।