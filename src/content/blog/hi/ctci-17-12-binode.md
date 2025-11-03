---
title: "BiNode: Convert Binary Search Tree to Doubly Linked List In-Place (CTCI 17.12)"
description: "CTCI problem 17.12: convert a BST into a sorted doubly linked list in-place using BiNode data structures."
date: "2025-11-03"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-12-binode.webp
previewImage: /assets/images/ctci-17-12-binode.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १७.१२ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १७.१२: convert a बीएसटी into a sorted doubly linked list स्थान पर ही (इन-प्लेस) using BiNode data structures.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१७.१२** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १७.१२: convert a बीएसटी into a sorted doubly linked list स्थान पर ही (इन-प्लेस) using BiNode data structures.

## २. कोड और कार्यान्वयन

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

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।