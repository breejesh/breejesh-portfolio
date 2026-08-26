---
title: "Call In Order: Synchronizing Method Execution Sequence (CTCI 15.5)"
description: "CTCI problem 15.5: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores."
date: "2026-06-02"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-15-5-call-in-order.webp
previewImage: /assets/images/ctci-15-5-call-in-order.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १५.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १५.५: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१५.५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

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