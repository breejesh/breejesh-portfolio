---
title: "FizzBuzz: Multi-Threaded Concurrent FizzBuzz in Java (CTCI 15.7)"
description: "CTCI problem 15.7: multi-threaded FizzBuzz using 4 concurrent threads for numbers divisible by 3, 5, 15, and others."
date: "2026-03-19"
tags: [Algorithms]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १५.७ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १५.७: multi-threaded FizzBuzz using ४ concurrent threads for numbers divisible by ३, ५, १५, and others.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१५.७** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १५.७: multi-threaded FizzBuzz using ४ concurrent threads for numbers divisible by ३, ५, १५, and others.

## २. कोड और कार्यान्वयन

```java
public class MultithreadedFizzBuzz {
    private int n;
    private int current = 1;
    public synchronized void fizz() throws InterruptedException {
        while (current <= n) {
            if (current % 3 == 0 && current % 5 != 0) {
                System.out.println("Fizz");
                current++;
                notifyAll();
            } else wait();
        }
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।