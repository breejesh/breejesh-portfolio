---
title: "Random Set: Generate Uniform Random Subset of Size M from Array of Size N (CTCI 17.3)"
description: "CTCI problem 17.3: sample a random subset of size m from an array of n elements uniformly."
date: "2025-08-29"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-3-random-set.webp
previewImage: /assets/images/ctci-17-3-random-set.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.३: sample a random subset of size m from an array of n elements uniformly.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.३** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.३: sample a random subset of size m from an array of n elements uniformly.

## २. कोड और कार्यान्वयन

```java
public static int[] pickRandomly(int[] original, int m) {
    int[] subset = new int[m];
    for (int i = 0; i < m; i++) subset[i] = original[i];
    Random rand = new Random();
    for (int i = m; i < original.length; i++) {
        int k = rand.nextInt(i + 1);
        if (k < m) subset[k] = original[i];
    }
    return subset;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।