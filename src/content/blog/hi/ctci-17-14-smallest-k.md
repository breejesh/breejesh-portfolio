---
title: "Smallest K: Find Smallest K Elements via QuickSelect / Max-Heap (CTCI 17.14)"
description: "CTCI problem 17.14: find the smallest K numbers in an array using QuickSelect in O(N) average time."
date: "2025-08-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-14-smallest-k.webp
previewImage: /assets/images/ctci-17-14-smallest-k.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१४: find the smallest K numbers in an array using QuickSelect in O(N) average time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.१४** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१४: find the smallest K numbers in an array using QuickSelect in O(N) average time.

## २. कोड और कार्यान्वयन

```java
public static int[] smallestK(int[] array, int k) {
    if (k <= 0 || k > array.length) return new int[0];
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    for (int num : array) {
        maxHeap.offer(num);
        if (maxHeap.size() > k) maxHeap.poll();
    }
    return maxHeap.stream().mapToInt(Integer::intValue).toArray();
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।