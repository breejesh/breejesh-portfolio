---
title: "ट्रीमौप बनाम हैशमैप बनाम लिंक्डहैशमैप (TreeMap vs HashMap vs LinkedHashMap): आंतरिक आर्किटेक्चर और चयन मानदंड (सीटीसीआई १३.५)"
description: "जावा कलेक्शंस में HashMap, TreeMap और LinkedHashMap की आंतरिक डेटा संरचनाओं, रेड-ब्लैक ट्री बकेट रूपांतरण और LRU कैश का तुलनात्मक विश्लेषण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
previewImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** `TreeMap`, `HashMap`, और `LinkedHashMap` के बीच के अंतर बताएं। प्रत्येक के लिए सर्वोत्तम उपयोग का एक उदाहरण दें।
> * **तीन मुख्य प्रतिमान:**
>   1. **`HashMap`**: लिंक्ड लिस्ट और रेड-ब्लैक ट्री बिन्स ($\ge 8$ टकराव) वाली हैश टेबल। **औसत $O(1)$ समय**, अक्रमित। उच्च-गति की-वैल्यू लुकअप के लिए सर्वोत्तम।
>   2. **`TreeMap`**: स्व-संतुलित **रेड-ब्लैक बाइनरी सर्च ट्री** (`NavigableMap`)। **गारंटीकृत $O(\log N)$ समय**, कुंजियों के अनुसार पूरी तरह क्रमबद्ध। रेंज क्वेरीज़ (`subMap`) के लिए सर्वोत्तम।
>   3. **`LinkedHashMap`**: डबल लिंक्ड लिस्ट से जुड़ी `HashMap`। **$O(1)$ समय**, **इन्सर्शन क्रम** या **एक्सेस क्रम** को बनाए रखती है। `removeEldestEntry()` द्वारा LRU कैश बनाने के लिए सर्वोत्तम।
> * **रियल-वर्ल्ड सिस्टम:** वेब सत्र कैशिंग (`HashMap`), वित्तीय ऑर्डर बुक (`TreeMap`) और सीमित आकार का LRU कैश (`LinkedHashMap`)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १३.५) में पूछा गया है:

*"जावा में TreeMap, HashMap और LinkedHashMap के आंतरिक डेटा संरचनाओं, जटिलता सीमाओं और चयन मानदंडों की व्याख्या करें।"*

## २. संरचनात्मक तुलनात्मक तालिका

| मापदंड | `HashMap` | `TreeMap` | `LinkedHashMap` |
|---|---|---|---|
| **आंतरिक संरचना** | हैश टेबल (बकेट्स + ट्री-बिन्स) | रेड-ब्लैक ट्री (`NavigableMap`) | हैश टेबल + डबल लिंक्ड लिस्ट |
| **खोज समय** | $O(1)$ औसत ($O(\log N)$ सबसे खराब) | $O(\log N)$ गारंटीकृत | $O(1)$ औसत |
| **कुंजियों का क्रम** | कोई क्रम नहीं (यादृच्छिक) | क्रमबद्ध (`Comparable` / `Comparator`) | प्रविष्टि या एक्सेस क्रम |
| **नल कुंजी समर्थन** | हाँ (१ नल कुंजी बकेट ० में) | **नहीं** (`NullPointerException`) | हाँ (१ नल कुंजी) |
| **मेमोरी ओवरहेड** | मध्यम | मध्यम (ट्री पॉइंटर्स) | सर्वाधिक (हैश + डबल लिंक्ड पॉइंटर्स) |

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class MapArchitectureShowcase {

    public static void demonstrateHashMap() {
        Map<String, String> sessionStore = new HashMap<>();
        sessionStore.put("sess_1", "उपयोगकर्ता एलिस");
        System.out.println("HashMap सत्र: " + sessionStore.get("sess_1"));
    }

    public static void demonstrateTreeMap() {
        NavigableMap<Double, Integer> orderBook = new TreeMap<>(Comparator.reverseOrder());
        orderBook.put(150.50, 100);
        orderBook.put(150.25, 500);

        // O(log N) में रेंज क्वेरी
        Map<Double, Integer> range = orderBook.subMap(150.50, true, 150.00, true);
        System.out.println("TreeMap रेंज: " + range);
    }

    public static class LRUCache<K, V> extends LinkedHashMap<K, V> {
        private final int maxCapacity;

        public LRUCache(int cap) {
            super(cap, 0.75f, true); // true एक्सेस ऑर्डर सक्रिय करता है
            this.maxCapacity = cap;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxCapacity; // सबसे पुरानी प्रविष्टि को स्वतः हटाता है
        }
    }
}
```

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: जावा 8 हैशमैप ट्रीइफिकेशन (JEP 180)

१. **हैश टकराव सुरक्षा:** जब किसी बकेट में टकरावों की संख्या ८ तक पहुंचती है, तो लिंक्ड लिस्ट स्वतः रेड-ब्लैक ट्री में बदल जाती है, जिससे खोज जटिलता $O(N)$ के बजाय $O(\log N)$ पर सीमित रहती है।
२. **एक्सेस-ऑर्डर ट्रैकिंग:** `LinkedHashMap` में `get(key)` कॉल होने पर नोड को $O(1)$ में लिस्ट के अंत में स्थानांतरित किया जाता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कंकरेंसी:** तीनों में से कोई भी थ्रेड-सुरक्षित नहीं है। मल्टी-थ्रेडेड वातावरण में `ConcurrentHashMap` का उपयोग करें।
२. **परिवर्तनीय कुंजियां (Mutable Keys):** प्रविष्टि के बाद कुंजी को संशोधित करने पर हैश कोड बदल जाता है और डेटा अप्राप्य हो जाता है। हमेशा अपरिवर्तनीय कुंजियों (`String`, `record`) का उपयोग करें।
