---
title: "Reverse String: In-Place C-Style Null-Terminated String Reverse (CTCI 12.2)"
description: "CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic."
date: "2025-08-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.२ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.२ in C++: reverse a null-terminated C-style string स्थान पर ही (इन-प्लेस) using pointer arithmetic.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१२.२** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.२ in C++: reverse a null-terminated C-style string स्थान पर ही (इन-प्लेस) using pointer arithmetic.

## २. कोड और कार्यान्वयन

```cpp
void reverse(char* str) {
    char* end = str;
    char tmp;
    if (str) {
        while (*end) { ++end; }
        --end;
        while (str < end) {
            tmp = *str;
            *str++ = *end;
            *end-- = tmp;
        }
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।