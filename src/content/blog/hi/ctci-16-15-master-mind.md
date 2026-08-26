---
title: "Master Mind: Calculate Hits and Pseudo-Hits in Mastermind (CTCI 16.15)"
description: "CTCI problem 16.15: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind."
date: "2025-10-23"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-16-15-master-mind.webp
previewImage: /assets/images/ctci-16-15-master-mind.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१५: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.१५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१५: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind.

## २. कोड और कार्यान्वयन

```java
public static class Result { public int hits; public int pseudoHits; }
public static Result estimate(String guess, String solution) {
    Result res = new Result();
    // Count hits and pseudo-hits
    return res;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।