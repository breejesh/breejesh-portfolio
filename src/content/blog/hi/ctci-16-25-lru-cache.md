---
title: "एलआरयू कैश (LRU Cache): O(1) समय में लीस्ट रिसेंटली यूज्ड इन-मेमोरी कैश आर्किटेक्चर (सीटीसीआई १६.२५)"
description: "डबली लिंक्ड लिस्ट और हैशमैप द्वारा O(1) get और put समय वाला LRU कैश डिजाइन और Redis तथा लिनक्स कर्नल में इसका उपयोग।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक निश्चित क्षमता वाला LRU (Least Recently Used) कैश बनाएं जिसमें `get(key)` और `put(key, value)` दोनों $O(1)$ समय में निष्पादित हों।
> * **मुख्य समाधान:** **हैशमैप** (त्वरित $O(1)$ कुंजी लुकअप) और **डबली लिंक्ड लिस्ट** (बिना एरे शिफ्टिंग के $O(1)$ में नोड्स को हेड पर लाने और टेल से हटाने के लिए) का संयोजन।
> * **रियल-वर्ल्ड सिस्टम:** Redis कैश निष्कासन (Eviction), लिनक्स वर्चुअल मेमोरी पेजिंग (Page Frame Reclaim), और CPU L1/L2/L3 कैश पदानुक्रम।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.२५) में पूछा गया है:

*"एक स्थिर क्षमता $C$ वाला LRU कैश डिजाइन करें जो get और put दोनों ऑपरेशनों को O(1) स्थिर समय में पूरा करे।"*

## २. डबली लिंक्ड लिस्ट और हैशमैप का संयोजन

* **`get(key)`**: हैशमैप से नोड का पता $O(1)$ में प्राप्त करें, उसे लिस्ट में उसके वर्तमान स्थान से हटाकर डमी हेड के ठीक बाद जोड़ें।
* **`put(key, value)`**: यदि कुंजी मौजूद है, तो मान अपडेट करें और हेड पर ले जाएं। यदि क्षमता पूरी हो चुकी है, तो टेल के पूर्ववर्ती नोड को हटाएं और मैप से भी निकालें।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCache<K, V> {
    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> prev, next;
        Node(K k, V v) { this.key = k; this.value = v; }
    }

    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private final Node<K, V> head = new Node<>(null, null); // Dummy head
    private final Node<K, V> tail = new Node<>(null, null); // Dummy tail

    public LRUCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("Capacity must be positive");
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized V get(K key) {
        Node<K, V> node = map.get(key);
        if (node == null) return null;

        moveToHead(node);
        return node.value;
    }

    public synchronized void put(K key, V value) {
        Node<K, V> node = map.get(key);
        if (node != null) {
            node.value = value;
            moveToHead(node);
        } else {
            if (map.size() >= capacity) {
                Node<K, V> evicted = popTail();
                map.remove(evicted.key);
            }
            Node<K, V> newNode = new Node<>(key, value);
            map.put(key, newNode);
            addHead(newNode);
        }
    }

    private void addHead(Node<K, V> node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node<K, V> node) {
        removeNode(node);
        addHead(node);
    }

    private Node<K, V> popTail() {
        Node<K, V> res = tail.prev;
        removeNode(res);
        return res;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| get(key) समय जटिलता | `O(1)` | सीधा हैशमैप लुकअप और ४ पॉइंटर अपडेट। |
| put(key, value) समय जटिलता | `O(1)` | हैश इंसर्शन और नोड स्प्लिसिंग। |
| स्पेस जटिलता | `O(C)` | हैशमैप और डबली लिंक्ड लिस्ट में ठीक C नोड्स। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: Redis और लिनक्स पेजिंग

१. **Redis एप्रोक्सीमेटेड LRU:** पॉइंटर्स के मेमोरी ओवरहेड को बचाने के लिए Redis यादृच्छिक ५ कीज़ का नमूना लेकर सबसे पुराने टाइमस्टैम्प वाले को निकालता है।
२. **Caffeine Cache:** लॉक-फ्री रिंग बफर्स और एसिंक्रोनस बैच ड्रेनिंग द्वारा मल्टी-कोर सीपीयू पर बिना लॉक विवाद के प्रति सेकंड लाखों ऑपरेशन्स निष्पादित करना।
३. **लिनक्स पेज फ्रेम रिक्लेम:** लिनक्स कर्नल सक्रिय और निष्क्रिय सूचियों का उपयोग करके कम उपयोग किए गए मेमोरी पेजों को स्वैप डिस्क में भेजता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **क्षमता १:** एकल तत्व आने पर पुराना नोड बिना किसी डैंगलिंग पॉइंटर के तुरंत बदल दिया जाता है।
२. **मल्टीथ्रेडिंग सुरक्षा:** समवर्ती थ्रेड एक्सेस के लिए `synchronized` या रीड-राइट लॉक का उपयोग।
