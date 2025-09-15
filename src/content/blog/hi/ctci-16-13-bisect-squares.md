---
title: "Bisect Squares: Find Line Bisecting Two Squares in 2D Space (CTCI 16.13)"
description: "CTCI problem 16.13: compute the 2D line equation that cuts two arbitrary squares in half by connecting their center points."
date: "2025-09-15"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१३: compute the २D line equation that cuts two arbitrary squares in half by connecting their center points.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.१३** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१३: compute the २D line equation that cuts two arbitrary squares in half by connecting their center points.

## २. कोड और कार्यान्वयन

```java
public class SquareBisector {
    static class Square { double x, y, width; public double[] center() { return new double[]{x + width/2, y + width/2}; } }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।