---
title: "हैश टेबल (Hash Table): कोलिजन चेनिंग के साथ इन-मेमोरी हैश मैप डिज़ाइन (सीटीसीआई ७.१२)"
description: "लिंक्ड-लिस्ट चेनिंग और बकेट एरे का उपयोग करके औसत O(१) समय में जावा में जेनेरिक हैश टेबल का ऑब्जेक्ट-ओरिएंटेड कार्यान्वयन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-12-hash-table.webp
previewImage: /assets/images/ctci-7-12-hash-table.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** टकराव (collision) को संभालने के लिए चेनिंग (लिंक्ड लिस्ट) का उपयोग करने वाली एक हैश टेबल डिज़ाइन और कार्यान्वित करें।
> * **मुख्य समाधान:** **बकेट एरे + लिंक्ड नोड चेनिंग**: `LinkedListNode<K, V>` की एक सरणी। कुंजी को `hashCode() % numBuckets` द्वारा हैश करें। टकराव होने पर, औसत $O(१)$ समय में नोड को बकेट सूची के शीर्ष पर जोड़ें।
> * **रियल-वर्ल्ड सिस्टम:** जावा `HashMap`, पायथन `dict`, और रेडिस (Redis) इन-मेमोरी डेटाबेस।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.१२) में, लिंक्ड-लिस्ट कोलिजन चेनिंग का उपयोग करके `put(K, V)`, `get(K)`, और `remove(K)` विधियों के साथ एक जेनेरिक `MyHashTable<K, V>` डिज़ाइन और लागू करने के लिए कहा गया है।

## २. कोलिजन चेनिंग और रीसाइज़िंग

१. **हैश वितरण:** `int index = Math.abs(key.hashCode()) % arr.length`।
२. **कोलिजन चेनिंग:** प्रत्येक बकेट एक लिंक्ड लिस्ट (`LinkedListNode<K, V>`) के शीर्ष को इंगित करता है। जब दो कुंजियाँ समान बकेट में हैश होती हैं, तो हम मौजूदा कुंजी को अपडेट करने या नया नोड जोड़ने के लिए सूची को पार करते हैं।
३. **लोड फैक्टर:** प्रोडक्शन में, जब आकार `०.७५ * क्षमता` से अधिक हो जाता है, तो औसत $O(१)$ लुकअप समय बनाए रखने के लिए तालिका क्षमता को दोगुना करती है और सभी तत्वों को री-हैश करती है।

## प्रोडक्शन कार्यान्वयन

```java
public class MyHashTable<K, V> {
    private static class LinkedListNode<K, V> {
        public LinkedListNode<K, V> next;
        public LinkedListNode<K, V> prev;
        public K key;
        public V value;
        public LinkedListNode(K k, V v) { this.key = k; this.value = v; }
    }

    private LinkedListNode<K, V>[] arr;

    @SuppressWarnings("unchecked")
    public MyHashTable(int capacity) {
        arr = (LinkedListNode<K, V>[]) new LinkedListNode[capacity];
    }

    private int getIndexForKey(K key) {
        return Math.abs(key.hashCode() % arr.length);
    }

    public void put(K key, V value) {
        LinkedListNode<K, V> node = getNodeForKey(key);
        if (node != null) {
            node.value = value;
            return;
        }
        int index = getIndexForKey(key);
        LinkedListNode<K, V> newNode = new LinkedListNode<>(key, value);
        if (arr[index] != null) {
            newNode.next = arr[index];
            arr[index].prev = newNode;
        }
        arr[index] = newNode;
    }

    public V get(K key) {
        LinkedListNode<K, V> node = getNodeForKey(key);
        return node == null ? null : node.value;
    }

    private LinkedListNode<K, V> getNodeForKey(K key) {
        int index = getIndexForKey(key);
        LinkedListNode<K, V> current = arr[index];
        while (current != null) {
            if (current.key.equals(key)) return current;
            current = current.next;
        }
        return null;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| get / put (औसत) | `O(१)` | बकेट सरणी में समान हैश वितरण। |
| get / put (सबसे खराब) | `O(N)` | सभी कुंजियाँ एकल बकेट लिंक्ड लिस्ट में टकराती हैं। |
| मेमोरी जटिलता | `O(N + क्षमता)` | बकेट सरणी और नोड इंस्टेंस। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: जावा हैशमैप रेड-ब्लैक ट्री

जावा ८ ने `HashMap` को अपग्रेड किया ताकि जब एक ही बकेट में ८ से अधिक प्रविष्टियां हों, तो लिंक्ड-लिस्ट बकेट को संतुलित रेड-ब्लैक ट्री (`TreeNode`) से बदल दिया जाए, जिससे हैश कोलिजन हमलों (DoS Attack) के तहत भी सबसे खराब स्थिति में $O(\log N)$ लुकअप की गारंटी मिलती है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **हैश कोड कोलिजन:** लिंक्ड नोड ट्रैवर्सल के माध्यम से सुरक्षित प्रबंधन।
२. **शून्य कुंजी (Null keys):** बकेट इंडेक्स ० पर सुरक्षित हैंडलिंग।
