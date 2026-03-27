---
title: "Context Switch: Measuring Thread vs Process Context Switching (CTCI 15.2)"
description: "CTCI problem 15.2: mechanics of OS context switching, CPU register saving, TLB flushing, and cache misses."
date: "2026-03-27"
tags: [Algorithms]
coverImage: /assets/images/ctci-15-2-context-switch.webp
previewImage: /assets/images/ctci-15-2-context-switch.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १५.२ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १५.२: mechanics of OS context switching, सीपीयू register saving, TLB flushing, and cache misses.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१५.२** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १५.२: mechanics of OS context switching, सीपीयू register saving, TLB flushing, and cache misses.

## २. कोड और कार्यान्वयन

```java
// Context switch cost:
// 1. Save CPU registers and program counter
// 2. Switch MMU page table (process switch)
// 3. Flush TLB cache
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।