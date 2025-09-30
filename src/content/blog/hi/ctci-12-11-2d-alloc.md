---
title: "2D Alloc: Allocate 2D Array in C with Single Malloc (CTCI 12.11)"
description: "CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity."
date: "2025-09-30"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.११ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.११ in C: allocate a २D array dynamically using a single malloc call to guarantee memory contiguity.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१२.११** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.११ in C: allocate a २D array dynamically using a single malloc call to guarantee memory contiguity.

## २. कोड और कार्यान्वयन

```java
int** my2DAlloc(int rows, int cols) {
    int header = rows * sizeof(int*);
    int data = rows * cols * sizeof(int);
    int** rowptr = (int**)malloc(header + data);
    int* buf = (int*)(rowptr + rows);
    for (int i = 0; i < rows; i++) {
        rowptr[i] = buf + i * cols;
    }
    return rowptr;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।