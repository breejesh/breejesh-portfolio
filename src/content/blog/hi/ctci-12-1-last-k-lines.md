---
title: "Last K Lines: Print Last K Lines of File in C++ (CTCI 12.1)"
description: "CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory."
date: "2026-01-06"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-1-last-k-lines.webp
previewImage: /assets/images/ctci-12-1-last-k-lines.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.१ in C++: print the last K lines of a file using a circular array buffer for O(K) memory.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१२.१** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.१ in C++: print the last K lines of a file using a circular array buffer for O(K) memory.

## २. कोड और कार्यान्वयन

```java
#include <iostream>
#include <fstream>
#include <string>

void printLastKLines(const char* fileName, int K) {
    std::ifstream file(fileName);
    std::string L[K];
    int size = 0;
    std::string line;
    while (std::getline(file, line)) {
        L[size % K] = line;
        size++;
    }
    int start = size > K ? (size % K) : 0;
    int count = std::min(K, size);
    for (int i = 0; i < count; i++) {
        std::cout << L[(start + i) % K] << std::endl;
    }
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।