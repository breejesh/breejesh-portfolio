---
title: "Synchronized Methods: Java Object Locks & Class Locks (CTCI 15.6)"
description: "CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java."
date: "2026-03-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-15-6-synchronized-methods.webp
previewImage: /assets/images/ctci-15-6-synchronized-methods.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १५.६ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १५.६: understanding thread blocking behavior between synchronized instance methods vs static class methods in जावा.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१५.६** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १५.६: understanding thread blocking behavior between synchronized instance methods vs static class methods in जावा.

## २. कोड और कार्यान्वयन

```java
public synchronized void methodA() {} // Locks on 'this'
public static synchronized void methodB() {} // Locks on 'Foo.class'
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।