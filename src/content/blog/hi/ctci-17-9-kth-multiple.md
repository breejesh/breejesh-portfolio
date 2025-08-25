---
title: "Kth Multiple: Find Kth Number Whose Only Prime Factors Are 3, 5, 7 (CTCI 17.9)"
description: "CTCI problem 17.9: find Kth number with prime factors 3, 5, 7 using 3 pointer queues in O(K) time."
date: "2025-08-25"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-9-kth-multiple.webp
previewImage: /assets/images/ctci-17-9-kth-multiple.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.९ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.९: find Kth number with prime factors ३, ५, ७ using ३ pointer queues in O(K) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.९** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.९: find Kth number with prime factors ३, ५, ७ using ३ pointer queues in O(K) time.

## २. कोड और कार्यान्वयन

```java
public static int getKthMagicNumber(int k) {
    if (k < 0) return 0;
    int val0 = 0;
    Queue<Integer> q3 = new LinkedList<>(), q5 = new LinkedList<>(), q7 = new LinkedList<>();
    q3.add(1);
    for (int i = 0; i <= k; i++) {
        int v3 = q3.isEmpty() ? Integer.MAX_VALUE : q3.peek();
        int v5 = q5.isEmpty() ? Integer.MAX_VALUE : q5.peek();
        int v7 = q7.isEmpty() ? Integer.MAX_VALUE : q7.peek();
        val0 = Math.min(v3, Math.min(v5, v7));
        if (val0 == v3) { q3.poll(); q3.add(3 * val0); q5.add(5 * val0); }
        else if (val0 == v5) { q5.poll(); q5.add(5 * val0); }
        else if (val0 == v7) { q7.poll(); }
        q7.add(7 * val0);
    }
    return val0;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।