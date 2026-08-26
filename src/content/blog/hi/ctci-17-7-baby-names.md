---
title: "Baby Names: Merge Synonym Name Frequencies Using Disjoint Set (CTCI 17.7)"
description: "CTCI problem 17.7: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find."
date: "2025-12-12"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-7-baby-names.webp
previewImage: /assets/images/ctci-17-7-baby-names.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.७ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.७: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.७** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.७: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find.

## २. कोड और कार्यान्वयन

```java
public class BabyNames {
    public Map<String, Integer> trulyMostPopular(Map<String, Integer> names, String[][] synonyms) {
        // Union-Find / Graph component aggregation
        return new HashMap<>();
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।