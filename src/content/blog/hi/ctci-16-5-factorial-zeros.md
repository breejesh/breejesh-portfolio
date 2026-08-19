---
title: "Factorial Zeros: Count Trailing Zeros in n! (CTCI 16.5)"
description: "CTCI problem 16.5: count trailing zeros in n! by summing factors of 5 in O(log n) time."
date: "2025-11-04"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-5-factorial-zeros.webp
previewImage: /assets/images/ctci-16-5-factorial-zeros.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.५: count trailing zeros in n! by summing factors of ५ in O(log n) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.५: count trailing zeros in n! by summing factors of ५ in O(log n) time.

## २. कोड और कार्यान्वयन

```java
public static int countFactZeros(int num) {
    int count = 0;
    if (num < 0) return -1;
    for (int i = 5; num / i > 0; i *= 5) {
        count += num / i;
    }
    return count;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।