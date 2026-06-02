---
title: "Call In Order: Synchronizing Method Execution Sequence (CTCI 15.5)"
description: "CTCI problem 15.5: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores."
date: "2026-06-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-15-5-call-in-order.webp
previewImage: /assets/images/ctci-15-5-call-in-order.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १५.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १५.५: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१५.५** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १५.५: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores.

## २. कोड और कार्यान्वयन

```java
public class Foo {
    private final Semaphore s1 = new Semaphore(0);
    private final Semaphore s2 = new Semaphore(0);

    public void first(Runnable r) { r.run(); s1.release(); }
    public void second(Runnable r) throws InterruptedException { s1.acquire(); r.run(); s2.release(); }
    public void third(Runnable r) throws InterruptedException { s2.acquire(); r.run(); }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।