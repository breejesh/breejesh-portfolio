---
title: "Letters and Numbers: Find Longest Subarray with Equal Letters and Digits (CTCI 17.5)"
description: "CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time."
date: "2026-01-10"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.५: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.५: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.

## २. कोड और कार्यान्वयन

```java
public static char[] findLongestSubarray(char[] array) {
    int[] deltas = computeDeltaArray(array);
    int[] match = findLongestMatch(deltas);
    return extractSubarray(array, match[0] + 1, match[1]);
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।