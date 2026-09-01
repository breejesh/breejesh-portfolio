---
title: "Copy Node: Deep Copying Cyclic Directed Graph Data Structures (CTCI 12.8)"
description: "Perform a deep copy of a directed graph or complex pointer network with cyclic references in C++ using pointer-mapping hash tables in O(V + E) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method that takes a pointer to a `Node` structure as a parameter and returns a complete copy of the passed-in data structure. The `Node` data structure contains two pointers to other `Node` structures.
> * **The Optimal Solution:** **Pointer Hash Map Deep Copy with Cycle Detection**: (1) The data structure can form arbitrary directed graphs, binary trees, or cyclic networks; (2) Maintain a lookup table `std::unordered_map<const Node*, Node*> nodeMap` mapping original node addresses to their cloned replicas; (3) When visiting a node: if `null`, return `null`; if already present in `nodeMap`, return the existing clone (preventing infinite recursive cycle loops); (4) Otherwise, allocate `Node* copy = new Node()`, register it in `nodeMap` *before* descending, and recursively duplicate `ptr1` and `ptr2`; (5) Executes in **$O(V + E)$ time** and **$O(V)$ space**.
> * **Production Reality:** Deep cloning of AST graph structures in compilers, serialization of object graphs in game state checkpoints, and neural network computational graph duplication.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.8), we are asked:

*"Write a method that takes a pointer to a Node structure as a parameter and returns a complete copy of the passed in data structure. The Node data structure contains two pointers to other Node structures."*

```cpp
struct Node {
    Node* ptr1;
    Node* ptr2;
};
```

## 2. Cyclic Pointer Traversal & Memoization

A naive recursive copy without cycle tracking will trigger an infinite recursion stack overflow on cyclic structures (e.g. `Node A -> Node B -> Node A`).

By registering the newly allocated node in a hash table **before** recursing into child pointers:
$$\text{nodeMap}[\text{original}] = \text{clone}$$
Any subsequent back-edges instantly resolve to the existing clone address, halting recursion.

## Production Implementation

```cpp
#include <iostream>
#include <unordered_map>

struct Node {
    Node* ptr1;
    Node* ptr2;
    int data;

    Node(int val = 0) : ptr1(nullptr), ptr2(nullptr), data(val) {}
};

class NodeCloner {
private:
    static Node* copyRecursive(const Node* root, std::unordered_map<const Node*, Node*>& nodeMap) {
        if (!root) return nullptr;

        // If already cloned, return the existing clone pointer (handles cycles)
        auto it = nodeMap.find(root);
        if (it != nodeMap.end()) {
            return it->second;
        }

        // Allocate new cloned node and record mapping immediately
        Node* clone = new Node(root->data);
        nodeMap[root] = clone;

        // Recursively clone outgoing pointers
        clone->ptr1 = copyRecursive(root->ptr1, nodeMap);
        clone->ptr2 = copyRecursive(root->ptr2, nodeMap);

        return clone;
    }

public:
    /**
     * Deep clones arbitrary graph/tree structure rooted at root.
     * Time Complexity: O(V + E)
     * Space Complexity: O(V)
     */
    static Node* copy(const Node* root) {
        std::unordered_map<const Node*, Node*> nodeMap;
        return copyRecursive(root, nodeMap);
    }
};
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(V + E)` | Every vertex and pointer edge is visited exactly once. |
| Auxiliary Space | `O(V)` | Hash table storing $V$ pointer pairs + recursion call stack. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Graph Serialization Engines

1. **Compiler AST Deep Clones (LLVM / Clang):** Intermediate Representation (IR) passes duplicate basic blocks and instruction DAGs using address-mapping clone maps.
2. **Object Graph Serializers (Protocol Buffers / FlatBuffers):** Resolves circular pointer references during serialization by assigning integer object IDs to memory pointers.

## Edge Cases & Production Hardening

1. **Self-Referential Nodes (`node->ptr1 = node`):** Handled cleanly without stack overflow.
2. **Diamond Graph Topologies:** Shared child nodes are cloned exactly once and referenced by both parent clones.
