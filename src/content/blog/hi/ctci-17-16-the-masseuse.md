---
title: "The Masseuse: Maximize Non-Adjacent Appointment Minutes (CTCI 17.16)"
description: "CTCI problem 17.16: optimal dynamic programming allocation of appointments with mandatory 15-min break between bookings."
date: "2026-06-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-16-the-masseuse.webp
previewImage: /assets/images/ctci-17-16-the-masseuse.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१६ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१६: optimal dynamic programming allocation of appointments with mandatory १५-min break between bookings.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.१६** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१६: optimal dynamic programming allocation of appointments with mandatory १५-min break between bookings.

## २. कोड और कार्यान्वयन

```java
public static int maxMinutes(int[] requests) {
    int oneAway = 0, twoAway = 0;
    for (int i = requests.length - 1; i >= 0; i--) {
        int bestWith = requests[i] + twoAway;
        int bestWithout = oneAway;
        int current = Math.max(bestWith, bestWithout);
        twoAway = oneAway;
        oneAway = current;
    }
    return oneAway;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।