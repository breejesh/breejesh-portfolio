---
title: "Pond Sizes: Compute Connected Water Regions in Matrix (CTCI 16.19)"
description: "CTCI problem 16.19: compute sizes of all connected water ponds in a land matrix using 8-directional DFS traversal."
date: "2026-02-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-19-pond-sizes.webp
previewImage: /assets/images/ctci-16-19-pond-sizes.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १६.१९ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १६.१९: compute sizes of all connected water ponds in a land matrix using ८-directional डीएफएस traversal.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१६.१९** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १६.१९: compute sizes of all connected water ponds in a land matrix using ८-directional डीएफएस traversal.

## २. कोड और कार्यान्वयन

```java
public static List<Integer> computePondSizes(int[][] land) {
    List<Integer> sizes = new ArrayList<>();
    for (int r = 0; r < land.length; r++) {
        for (int c = 0; c < land[0].length; c++) {
            if (land[r][c] == 0) {
                sizes.add(computeSize(land, r, c));
            }
        }
    }
    return sizes;
}
private static int computeSize(int[][] land, int r, int c) {
    if (r < 0 || c < 0 || r >= land.length || c >= land[0].length || land[r][c] != 0) return 0;
    land[r][c] = -1; // Mark visited
    int size = 1;
    for (int dr = -1; dr <= 1; dr++) {
        for (int dc = -1; dc <= 1; dc++) size += computeSize(land, r + dr, c + dc);
    }
    return size;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।