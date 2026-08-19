---
title: "Copy Node: Deep Copy a Graph / Data Structure in C++ (CTCI 12.8)"
description: "CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup."
date: "2026-02-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.8.
> * **L'Approche:** CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.8**.

## 1. Contexte et Énoncé
CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.

## 2. Code et Implémentation

```cpp
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

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.