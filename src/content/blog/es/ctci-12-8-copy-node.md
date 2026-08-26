---
title: "Copy Node: Deep Copy a Graph / Data Structure in C++ (CTCI 12.8)"
description: "CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup."
date: "2026-02-24"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.8.
> * **El Enfoque:** CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.8**.

## 1. Contexto y Enunciado
CTCI problem 12.8: deep copying a data structure containing pointers and cycle references using std::map pointer lookup.

## 2. Código e Implementación

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

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.