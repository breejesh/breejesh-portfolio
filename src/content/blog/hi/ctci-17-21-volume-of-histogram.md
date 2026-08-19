---
title: "Volume of Histogram: Trapping Rain Water DP / Two-Pointer Solution (CTCI 17.21)"
description: "CTCI problem 17.21: compute total volume of water trapped between bars in a 2D histogram in O(N) time."
date: "2026-03-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-21-volume-of-histogram.webp
previewImage: /assets/images/ctci-17-21-volume-of-histogram.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.२१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.२१: compute total volume of water trapped between bars in a २D histogram in O(N) time.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.२१** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.२१: compute total volume of water trapped between bars in a २D histogram in O(N) time.

## २. कोड और कार्यान्वयन

```java
public static int computeVolume(int[] histo) {
    int left = 0, right = histo.length - 1;
    int leftMax = 0, rightMax = 0, volume = 0;
    while (left < right) {
        if (histo[left] < histo[right]) {
            if (histo[left] >= leftMax) leftMax = histo[left];
            else volume += leftMax - histo[left];
            left++;
        } else {
            if (histo[right] >= rightMax) rightMax = histo[right];
            else volume += rightMax - histo[right];
            right--;
        }
    }
    return volume;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।