---
title: "Malloc: Implement Aligned Malloc and Free in C (CTCI 12.10)"
description: "CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements."
date: "2026-03-16"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.१० का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.१०: implement aligned_malloc and aligned_free in C for memory alignment requirements.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१२.१०** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.१०: implement aligned_malloc and aligned_free in C for memory alignment requirements.

## २. कोड और कार्यान्वयन

```cpp
void* aligned_malloc(size_t bytes, size_t alignment) {
    void* p1;
    void** p2;
    int offset = alignment - 1 + sizeof(void*);
    if ((p1 = (void*)malloc(bytes + offset)) == NULL) return NULL;
    p2 = (void**)(((size_t)(p1) + offset) & ~(alignment - 1));
    p2[-1] = p1;
    return p2;
}
void aligned_free(void* p) {
    free(((void**)p)[-1]);
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।