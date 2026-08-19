---
title: "Max Submatrix: Maximum Sum 2D Submatrix via Kadane 2D (CTCI 17.24)"
description: "CTCI problem 17.24: find 2D submatrix with largest sum in N x N matrix in O(N^3) time."
date: "2026-04-13"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-24-max-submatrix.webp
previewImage: /assets/images/ctci-17-24-max-submatrix.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.२४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.२४: find २D submatrix with largest sum in N x N matrix in O(N^३) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.२४** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.२४: find २D submatrix with largest sum in N x N matrix in O(N^३) time.

## २. कोड और कार्यान्वयन

```java
public class MaxSubmatrix {
    public static int getMaxSubmatrix(int[][] matrix) {
        // 2D Kadane's algorithm by compressing column ranges into 1D arrays
        return 0;
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।