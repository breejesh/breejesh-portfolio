---
title: "BiNode: Convert Binary Search Tree to Doubly Linked List In-Place (CTCI 17.12)"
description: "CTCI problem 17.12: convert a BST into a sorted doubly linked list in-place using BiNode data structures."
date: "2025-11-03"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-12-binode.webp
previewImage: /assets/images/ctci-17-12-binode.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.12 technical mechanics.
> * **The Approach:** CTCI problem 17.12: convert a BST into a sorted doubly linked list in-place using BiNode data structures.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.12**.

## 1. Context and Problem Statement
CTCI problem 17.12: convert a BST into a sorted doubly linked list in-place using BiNode data structures.

## 2. Technical Code & Mechanics

```java
public class BiNode {
    public BiNode node1, node2;
    public int data;
    public BiNode(int d) { data = d; }
}
public class BSTToLinkedList {
    public BiNode convert(BiNode root) {
        if (root == null) return null;
        BiNode part1 = convert(root.node1);
        BiNode part2 = convert(root.node2);
        if (part1 != null) { concat(getTail(part1), root); }
        if (part2 != null) { concat(root, part2); }
        return part1 == null ? root : part1;
    }
    private void concat(BiNode x, BiNode y) { x.node2 = y; y.node1 = x; }
    private BiNode getTail(BiNode node) { while (node.node2 != null) node = node.node2; return node; }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.