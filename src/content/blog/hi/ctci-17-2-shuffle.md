---
title: "Shuffle: Fisher-Yates Card Deck Shuffling Algorithm (CTCI 17.2)"
description: "CTCI problem 17.2: shuffle a deck of cards uniformly using the Fisher-Yates (Knuth) in-place algorithm."
date: "2026-05-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-2-shuffle.webp
previewImage: /assets/images/ctci-17-2-shuffle.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.२ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.२: shuffle a deck of cards uniformly using the Fisher-Yates (Knuth) स्थान पर ही (इन-प्लेस) algorithm.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.२** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.२: shuffle a deck of cards uniformly using the Fisher-Yates (Knuth) स्थान पर ही (इन-प्लेस) algorithm.

## २. कोड और कार्यान्वयन

```java
public static void shuffleArray(int[] cards) {
    Random rand = new Random();
    for (int i = 0; i < cards.length; i++) {
        int k = rand.nextInt(i + 1);
        int temp = cards[i];
        cards[i] = cards[k];
        cards[k] = temp;
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।