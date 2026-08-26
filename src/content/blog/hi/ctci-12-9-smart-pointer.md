---
title: "Smart Pointer: Building a Custom Reference Counting Pointer in C++ (CTCI 12.9)"
description: "CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation."
date: "2026-04-20"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.९ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.९: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१२.९** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.९: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.

## २. कोड और कार्यान्वयन

```cpp
template <typename T>
class SmartPointer {
    T* ref;
    unsigned* ref_count;
public:
    SmartPointer(T* ptr) : ref(ptr), ref_count(new unsigned(1)) {}
    ~SmartPointer() {
        if (--(*ref_count) == 0) {
            delete ref;
            delete ref_count;
        }
    }
};
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।