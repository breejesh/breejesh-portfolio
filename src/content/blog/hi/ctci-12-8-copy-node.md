---
title: "Copy Node: Deep Copy a Graph / Data Structure in C++ (CTCI 12.8)"
description: "CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup."
date: "2026-02-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १२.८ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १२.८: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१२.८** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १२.८: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.

## २. कोड और कार्यान्वयन

```java
struct Node {
    int data;
    Node* ptr1;
    Node* ptr2;
};

Node* copyNode(Node* cur, std::map<Node*, Node*>& nodeMap) {
    if (!cur) return nullptr;
    if (nodeMap.count(cur)) return nodeMap[cur];
    Node* newNode = new Node{cur->data, nullptr, nullptr};
    nodeMap[cur] = newNode;
    newNode->ptr1 = copyNode(cur->ptr1, nodeMap);
    newNode->ptr2 = copyNode(cur->ptr2, nodeMap);
    return newNode;
}
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।