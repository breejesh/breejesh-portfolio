---
title: "Pairs with Sum: Find All Pairs in Array Summing to Target Value (CTCI 16.24)"
description: "CTCI problem 16.24: find all pairs of integers in an array that sum to a target value in O(N) time."
date: "2025-08-27"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.२४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.२४: find all pairs of integers in an array that sum to a target value in O(N) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.२४** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.२४: find all pairs of integers in an array that sum to a target value in O(N) time.

## २. कोड और कार्यान्वयन

```java
public static List<int[]> printPairSums(int[] array, int sum) {
    List<int[]> pairs = new ArrayList<>();
    Map<Integer, Integer> counts = new HashMap<>();
    for (int x : array) {
        int complement = sum - x;
        if (counts.getOrDefault(complement, 0) > 0) {
            pairs.add(new int[]{x, complement});
            counts.put(complement, counts.get(complement) - 1);
        } else {
            counts.put(x, counts.getOrDefault(x, 0) + 1);
        }
    }
    return pairs;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।