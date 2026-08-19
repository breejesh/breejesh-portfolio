---
title: "Lambda Random: Random Subset Generation with Java Streams (CTCI 13.8)"
description: "CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions."
date: "2026-02-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १३.८ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १३.८: generating a random subset of a list using जावा Streams and lambda expressions.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१३.८** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १३.८: generating a random subset of a list using जावा Streams and lambda expressions.

## २. कोड और कार्यान्वयन

```java
public List<Integer> getRandomSubset(List<Integer> list) {
    Random rand = new Random();
    return list.stream()
        .filter(item -> rand.nextBoolean())
        .collect(Collectors.toList());
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।