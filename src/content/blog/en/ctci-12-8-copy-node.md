---
title: "Copy Node: Deep Copy a Graph / Data Structure in C++ (CTCI 12.8)"
description: "CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup."
date: "2026-02-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 12.8 technical mechanics.
> * **The Approach:** CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **12.8**.

## 1. Context and Problem Statement
CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.

## 2. Technical Code & Mechanics

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

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.