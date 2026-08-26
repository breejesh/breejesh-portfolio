---
title: "एलआरयू कैश: लीस्ट रीसेंटली यूज्ड कैश कार्यान्वयन (सीटीसीआई १६.२५)"
description: "जावा में सीटीसीआई प्रश्न १६.२५: हैशमैप और डबली लिंक्ड लिस्ट का उपयोग करके ओ(१) समय में एलआरयू कैश का निर्माण।"
date: "2026-04-09"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **संक्षेप**
> * **समस्या:** एक सीमित क्षमता वाली कैश संरचना तैयार करना जो भर जाने पर सबसे कम उपयोग की गई वस्तु को हटा दे, और `get` तथा `put` दोनों को ओ(१) समय में पूरा करे।
> * **समाधान:** हैशमैप कुंजी खोजने में ओ(१) समय देता है, जबकि डबली लिंक्ड लिस्ट नोड को स्थानांतरित करने और हटाने में ओ(१) समय प्रदान करती है।
> * **जटिलता:** दोनों संचालन ओ(१) समय में, मेमोरी क्षमता अनुसार सीमित।

---

## १. जावा कार्यान्वयन

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCacheCustom {
    private static class Node {
        int key;
        int value;
        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head;
    private final Node tail;

    public LRUCacheCustom(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
        this.capacity = capacity;
        this.map = new HashMap<>();

        this.head = new Node(0, 0);
        this.tail = new Node(0, 0);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }
        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        Node existingNode = map.get(key);

        if (existingNode != null) {
            existingNode.value = value;
            moveToHead(existingNode);
            return;
        }

        if (map.size() >= capacity) {
            Node lru = tail.prev;
            removeNode(lru);
            map.remove(lru.key);
        }

        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
}
```
