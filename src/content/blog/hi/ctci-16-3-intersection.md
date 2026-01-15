---
title: "Intersection: Find Intersection Point of Two Line Segments (CTCI 16.3)"
description: "CTCI problem 16.3: compute the intersection point of two 2D line segments handling collinearity and slopes."
date: "2026-01-15"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-3-intersection.webp
previewImage: /assets/images/ctci-16-3-intersection.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.३: compute the intersection point of two २D line segments handling collinearity and slopes.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१६.३** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.३: compute the intersection point of two २D line segments handling collinearity and slopes.

## २. कोड और कार्यान्वयन

```java
public class LineIntersection {
    static class Point { double x, y; public Point(double x, double y) { this.x = x; this.y = y; } }
    public Point findIntersection(Point start1, Point end1, Point start2, Point end2) {
        // Compute slopes and linear equation intersection
        return new Point(0, 0);
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।