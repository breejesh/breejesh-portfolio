---
title: "Continuous Median: Track Streaming Median via Dual Heaps (CTCI 17.20)"
description: "CTCI problem 17.20: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap."
date: "2025-10-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-20-continuous-median.webp
previewImage: /assets/images/ctci-17-20-continuous-median.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.२० का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.२०: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.२०** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.२०: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap.

## २. कोड और कार्यान्वयन

```java
public class ContinuousMedian {
    private final PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder()); // Left lower half
    private final PriorityQueue<Integer> minHeap = new PriorityQueue<>(); // Right upper half
    public void insert(int num) {
        if (maxHeap.isEmpty() || num <= maxHeap.peek()) maxHeap.offer(num);
        else minHeap.offer(num);
        if (maxHeap.size() > minHeap.size() + 1) minHeap.offer(maxHeap.poll());
        else if (minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
    }
    public double getMedian() {
        if (maxHeap.size() == minHeap.size()) return (maxHeap.peek() + minHeap.peek()) / 2.0;
        return maxHeap.peek();
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।