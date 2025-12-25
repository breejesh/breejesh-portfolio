---
title: "Shallow vs Deep Copy: C++ Copy Constructors & Memory Safety (CTCI 12.5)"
description: "CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes."
date: "2025-12-25"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.५ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.५: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१२.५** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.५: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.

## २. कोड और कार्यान्वयन

```java
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