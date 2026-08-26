---
title: "Shallow vs Deep Copy: C++ Copy Constructors & Memory Safety (CTCI 12.5)"
description: "CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes."
date: "2025-12-25"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.५: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१२.५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.५: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.

## २. कोड और कार्यान्वयन

```cpp
class MyArray {
    int* data;
    int size;
public:
    MyArray(const MyArray& other) { // Deep copy
        size = other.size;
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }
};
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।