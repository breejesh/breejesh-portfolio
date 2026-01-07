---
title: "Object Reflection: How Java Reflection Works (CTCI 13.4)"
description: "CTCI problem 13.4: how Java Reflection API allows inspecting classes, invoking methods, and instantiating objects at runtime."
date: "2026-01-07"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-4-object-reflection.webp
previewImage: /assets/images/ctci-13-4-object-reflection.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १३.४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १३.४: how जावा Reflection एपीआई allows inspecting classes, invoking methods, and instantiating objects at runtime.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१३.४** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १३.४: how जावा Reflection एपीआई allows inspecting classes, invoking methods, and instantiating objects at runtime.

## २. कोड और कार्यान्वयन

```java
Class<?> clazz = Class.forName("com.example.MyClass");
Method method = clazz.getMethod("doSomething");
method.invoke(clazz.getDeclaredConstructor().newInstance());
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।