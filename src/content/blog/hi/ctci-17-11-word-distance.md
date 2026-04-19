---
title: "Word Distance: Shortest Distance Between Two Words in Large Text (CTCI 17.11)"
description: "CTCI problem 17.11: compute minimum word index distance between two words in a file in O(N) single pass time."
date: "2026-04-19"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-11-word-distance.webp
previewImage: /assets/images/ctci-17-11-word-distance.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.११ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.११: compute minimum word index distance between two words in a file in O(N) single pass time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.११** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.११: compute minimum word index distance between two words in a file in O(N) single pass time.

## २. कोड और कार्यान्वयन

```java
public static int findClosest(String[] words, String word1, String word2) {
    int min = Integer.MAX_VALUE;
    int last1 = -1, last2 = -1;
    for (int i = 0; i < words.length; i++) {
        if (words[i].equals(word1)) {
            last1 = i;
            if (last2 >= 0) min = Math.min(min, last1 - last2);
        } else if (words[i].equals(word2)) {
            last2 = i;
            if (last1 >= 0) min = Math.min(min, last2 - last1);
        }
    }
    return min;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।