---
title: "Word Frequencies: Efficient Frequency Lookup in Large Text (CTCI 16.2)"
description: "CTCI problem 16.2: design a precomputed HashMap lookup table to query word frequencies in O(1) time."
date: "2025-12-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.२ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.२: design a precomputed हैशमैप lookup table to query word frequencies in O(१) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.२** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.२: design a precomputed हैशमैप lookup table to query word frequencies in O(१) time.

## २. कोड और कार्यान्वयन

```java
public class WordFrequency {
    private final Map<String, Integer> dictionary = new HashMap<>();
    public void setup(String[] book) {
        for (String word : book) {
            word = word.trim().toLowerCase();
            if (!word.isEmpty()) dictionary.put(word, dictionary.getOrDefault(word, 0) + 1);
        }
    }
    public int getFrequency(String word) { return dictionary.getOrDefault(word.toLowerCase(), 0); }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।