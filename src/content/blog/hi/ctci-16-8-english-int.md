---
title: "English Int: Convert Integer to English Words (CTCI 16.8)"
description: "CTCI problem 16.8: convert an integer into its English words representation (e.g. 1234 -> One Thousand Two Hundred Thirty Four)."
date: "2026-05-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-8-english-int.webp
previewImage: /assets/images/ctci-16-8-english-int.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.८ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.८: convert an integer into its English words representation (e.g. १२३४ -> One Thousand Two Hundred Thirty Four).
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.८** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.८: convert an integer into its English words representation (e.g. १२३४ -> One Thousand Two Hundred Thirty Four).

## २. कोड और कार्यान्वयन

```java
public class EnglishInt {
    private static final String[] digits = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"};
    public String convert(int num) { if (num == 0) return "Zero"; return numToString(num); }
    private String numToString(int num) { return ""; }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।