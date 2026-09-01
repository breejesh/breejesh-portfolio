---
title: "कैश (Cache): वितरित क्वेरी कैशिंग और टियर इनवैलिडेशन आर्किटेक्चर (सीटीसीआई ९.५)"
description: "सर्च इंजन क्वेरी क्लस्टर के लिए O(१) LRU निष्कासन और अतुल्यकालिक (asynchronous) कैश अमान्यीकरण के साथ वितरित कैशिंग आर्किटेक्चर का सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक सरलीकृत सर्च इंजन के वेब सर्वर की कल्पना करें जिसमें १०० मशीनें सर्च क्वेरीज़ का जवाब देती हैं, जो बदले में एक महंगे `processSearch(string query)` क्लस्टर को कॉल करती हैं। १०० मशीनों पर यादृच्छिक रूप से क्वेरीज़ भेजी जाती हैं। हाल की क्वेरीज़ के लिए एक कैशिंग तंत्र डिज़ाइन करें और बताएं कि डेटा बदलने पर कैश को कैसे अपडेट करेंगे।
> * **मुख्य समाधान:** **द्वि-स्तरीय हाइब्रिड कैश आर्किटेक्चर**: (१) **L1 लोकल कैश**: प्रत्येक सर्वर सबसे लोकप्रिय क्वेरीज़ के लिए रैम में एक स्थानीय LRU कैश रखता है (शून्य नेटवर्क लेटेंसी); (२) **L2 वितरित कैश क्लस्टर**: कंसिस्टेंट हैशिंग द्वारा पार्टिशन किया गया रेडिस/मेमकैश क्लस्टर; (३) **LRU डेटा संरचना**: डबल लिंक्ड लिस्ट + हैश मैप जो $O(१)$ समय में लुकअप और निष्कासन करता है; (४) **अमान्यीकरण (Invalidation)**: टीटीएल (TTL) टाइम-डीके और इंडेक्स अपडेट होने पर पब/सब (Kafka) इवेंट्स द्वारा कैश क्लियर करना।
> * **रियल-वर्ल्ड सिस्टम:** गूगल / बिंग सर्च इंजन कैश और अकामाई (Akamai) एज कैशिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.५) में पूछा गया है:

*"१०० फ्रंटएंड मशीनों वाले सर्च इंजन क्लस्टर के लिए वितरित क्वेरी कैश और डेटा परिवर्तन पर कैश अमान्यीकरण तंत्र डिज़ाइन करें।"*

## २. आर्किटेक्चर विकल्प: स्थानीय बनाम वितरित बनाम हाइब्रिड

१. **अलग-थलग स्थानीय कैश:** शून्य नेटवर्क लेटेंसी, लेकिन कम हिट-दर क्योंकि समान क्वेरी १०० मशीनों पर दोहराई जाती है।
२. **समर्पित वितरित कैश:** उच्च हिट-दर और इष्टतम मेमोरी उपयोग (`hash(query)` द्वारा निश्चित नोड मैपिंग)।
३. **हाइब्रिड L1/L2 कैश (अनुशंसित):** शीर्ष १% वायरल खोजों के लिए स्थानीय L1 कैश और शेष ट्रैफ़िक के लिए वितरित L2 क्लस्टर।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashMap;
import java.util.Map;

public class LRUQueryCache {
    public static class Node {
        public String query;
        public String[] results;
        public Node prev;
        public Node next;

        public Node(String q, String[] res) {
            this.query = q;
            this.results = res;
        }
    }

    private final int capacity;
    private final Map<String, Node> map = new HashMap<>();
    private final Node head = new Node(null, null);
    private final Node tail = new Node(null, null);

    public LRUQueryCache(int cap) {
        this.capacity = cap;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized String[] get(String query) {
        Node node = map.get(query);
        if (node == null) return null;

        detach(node);
        attach(node);
        return node.results;
    }

    public synchronized void put(String query, String[] results) {
        if (map.containsKey(query)) {
            Node node = map.get(query);
            node.results = results;
            detach(node);
            attach(node);
            return;
        }

        if (map.size() >= capacity) {
            Node lru = tail.prev;
            detach(lru);
            map.remove(lru.query);
        }

        Node newNode = new Node(query, results);
        attach(newNode);
        map.put(query, newNode);
    }

    private void attach(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void detach(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}
```

## जटिलता और आर्किटेक्चर विश्लेषण

| ऑपरेशन | समय जटिलता | तकनीकी विवरण |
|---|---|---|
| कैश रीड (`get`) | `O(1)` | हैश मैप लुकअप और लिंक्ड लिस्ट में शीर्ष पर री-अटैच। |
| कैश राइट (`put`) | `O(1)` | हैश मैप इंसर्शन और डबल लिंक्ड लिस्ट नोड जोड़ना। |
| मेमोरी क्षमता | `O(C)` | कॉन्फ़िगर की गई क्षमता $C$ तक सख्ती से सीमित। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: कैश अमान्यीकरण रणनीतियां

१. **टीटीएल (Time to Live) समाप्ति:** प्रत्येक कैश परिणाम को एक समाप्ति समय (उदा. ३०० सेकंड) दिया जाता है।
२. **इवेंट-संचालित पब/सब (Kafka):** नए दस्तावेज़ों के इंडेक्स होने पर काफ्का संदेश भेजकर वितरित क्लस्टर से संबंधित क्वेरीज़ को अमान्य करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कैश स्टैम्पीड (Thundering Herd):** लोकप्रिय क्वेरी समाप्त होने पर सिंगल-फ्लाइट म्युटेक्स (Mutex) लॉक का उपयोग करके केवल एक बैकएंड कॉल सुनिश्चित करना।
२. **कैश पेनेट्रेशन:** गैर-मौजूद शब्दों के लिए छोटे टीटीएल के साथ खाली परिणाम कैश करना।
