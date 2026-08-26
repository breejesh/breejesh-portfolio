---
title: "Bisect Squares: Find Line Bisecting Two Squares in 2D Space (CTCI 16.13)"
description: "CTCI problem 16.13: compute the 2D line equation that cuts two arbitrary squares in half by connecting their center points."
date: "2025-09-15"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१३: compute the २D line equation that cuts two arbitrary squares in half by connecting their center points.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.१३** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

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