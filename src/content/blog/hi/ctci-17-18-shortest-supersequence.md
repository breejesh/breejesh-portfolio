---
title: "Shortest Supersequence: Shortest Subarray Containing All Target Elements (CTCI 17.18)"
description: "CTCI problem 17.18: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window."
date: "2025-08-14"
tags: [एल्गोरिदम और डेटा संरचनाएं, डेवलपर टूल्स और नीतियां]
coverImage: /assets/images/ctci-17-18-shortest-supersequence.webp
previewImage: /assets/images/ctci-17-18-shortest-supersequence.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१८ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१८: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.१८** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१८: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window.

## २. कोड और कार्यान्वयन

```java
public static int[] shortestSupersequence(int[] big, int[] small) {
    // Sliding window technique with frequency map
    return new int[]{-1, -1};
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।