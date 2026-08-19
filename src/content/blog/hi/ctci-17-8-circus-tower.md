---
title: "Circus Tower: Longest Increasing Subsequence for Height and Weight (CTCI 17.8)"
description: "CTCI problem 17.8: build tallest human tower where each person is shorter and lighter than the person below."
date: "2026-04-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-8-circus-tower.webp
previewImage: /assets/images/ctci-17-8-circus-tower.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.८ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.८: build tallest human tower where each person is shorter and lighter than the person below.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.८** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.८: build tallest human tower where each person is shorter and lighter than the person below.

## २. कोड और कार्यान्वयन

```java
public class CircusTower {
    static class Person implements Comparable<Person> {
        int height, weight;
        public int compareTo(Person o) { return this.height != o.height ? Integer.compare(this.height, o.height) : Integer.compare(this.weight, o.weight); }
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।