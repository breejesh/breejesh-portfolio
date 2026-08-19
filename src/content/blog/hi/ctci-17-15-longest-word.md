---
title: "Longest Word: Find Longest Word Built from Other Words (CTCI 17.15)"
description: "CTCI problem 17.15: find the longest word in an array that can be built by concatenating other words in the array."
date: "2025-10-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-15-longest-word.webp
previewImage: /assets/images/ctci-17-15-longest-word.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१५: find the longest word in an array that can be built by concatenating other words in the array.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१७.१५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१५: find the longest word in an array that can be built by concatenating other words in the array.

## २. कोड और कार्यान्वयन

```java
public static String printLongestWord(String[] arr) {
    Arrays.sort(arr, (a, b) -> Integer.compare(b.length(), a.length()));
    Set<String> map = new HashSet<>(Arrays.asList(arr));
    for (String word : arr) {
        if (canBuildWord(word, true, map)) return word;
    }
    return "";
}
private static boolean canBuildWord(String str, boolean isOriginal, Set<String> map) {
    if (map.contains(str) && !isOriginal) return true;
    for (int i = 1; i < str.length(); i++) {
        String left = str.substring(0, i);
        String right = str.substring(i);
        if (map.contains(left) && canBuildWord(right, false, map)) return true;
    }
    return false;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।