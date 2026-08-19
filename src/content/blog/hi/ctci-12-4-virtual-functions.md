---
title: "Virtual Functions: How vptr and vtable Work in C++ (CTCI 12.4)"
description: "CTCI problem 12.4: explaining dynamic dispatch, vtable, and vptr layout in C++ runtime polymorphism."
date: "2026-03-03"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-4-virtual-functions.webp
previewImage: /assets/images/ctci-12-4-virtual-functions.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.४: explaining dynamic dispatch, vtable, and vptr layout in C++ runtime polymorphism.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१२.४** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.४: explaining dynamic dispatch, vtable, and vptr layout in C++ runtime polymorphism.

## २. कोड और कार्यान्वयन

```cpp
class Shape {
public:
    virtual void draw() { std::cout << "Shape" << std::endl; }
};
class Circle : public Shape {
public:
    void draw() override { std::cout << "Circle" << std::endl; }
};
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।