---
title: "हैश टेबल बनाम एसटीएल मैप (Hash Table vs. STL Map): आंतरिक डेटा संरचनाएं और प्रदर्शन तुलना (सीटीसीआई १२.३)"
description: "सी++ में std::unordered_map (हैश टेबल) और std::map (रेड-ब्लैक ट्री) की तुलना, बकेट चेनिंग और छोटे इनपुट चॉइस का विश्लेषण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
previewImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** हैश टेबल और एसटीएल (STL) मैप की तुलना करें। हैश टेबल कैसे लागू की जाती है? यदि इनपुट की संख्या कम हो, तो आप किसका उपयोग करेंगे?
> * **मौलिक अंतर:** (१) **आंतरिक संरचना**: `std::unordered_map` बकेट चेनिंग वाली **हैश टेबल** है, जबकि `std::map` एक स्व-संतुलित **रेड-ब्लैक बाइनरी सर्च ट्री** है; (२) **समय जटिलता**: `unordered_map` $O(1)$ औसत खोज ($O(N)$ टकराव की स्थिति में) प्रदान करता है, जबकि `std::map` $O(\log N)$ की गारंटी देता है; (३) **क्रम**: `std::map` कुंजियों को `operator<` द्वारा पूरी तरह क्रमबद्ध रखता है, जबकि हैश टेबल में कोई क्रम नहीं होता।
> * **छोटे इनपुट का निर्णय:** छोटे संग्रहों ($N \le 50$) के लिए `std::map` (या सॉर्टेड `std::vector`) को प्राथमिकता दी जाती है क्योंकि इसमें हैश गणना और खाली बकेट्स की बर्बादी नहीं होती।
> * **रियल-वर्ल्ड सिस्टम:** उच्च-आवृत्ति ट्रेडिंग ऑर्डर बुक्स (ट्री) बनाम वेब कैश की-वैल्यू स्टोर (Google Abseil flat_hash_map)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १२.३) में पूछा गया है:

*"हैश टेबल और सी++ एसटीएल मैप के बीच तुलना करें, हैश टेबल के कार्यान्वयन की व्याख्या करें और छोटे डेटा सेट के लिए उपयुक्त विकल्प चुनें।"*

## २. संरचनात्मक तुलना

| विशेषता | `std::unordered_map` (हैश टेबल) | `std::map` (रेड-ब्लैक ट्री) |
|---|---|---|
| **अंतर्निहित संरचना** | बकेट्स और लिंक्ड लिस्ट का ऐरे (Chaining)। | स्व-संतुलित रेड-ब्लैक बीएसटी। |
| **खोज (औसत)** | $O(1)$ | $O(\log N)$ |
| **खोज (सबसे खराब स्थिति)** | $O(N)$ (सभी टकराव)। | $O(\log N)$ गारंटीकृत। |
| **कुंजियों का क्रम** | अक्रमित / यादृच्छिक। | पूर्णतः क्रमबद्ध (`<`)। |
| **आवश्यकताएं** | `std::hash` और `operator==`। | `operator<`। |

## प्रोडक्शन हैश टेबल कार्यान्वयन

```cpp
#include <iostream>
#include <string>
#include <vector>

template <typename K, typename V>
class SimpleHashTable {
private:
    struct HashNode {
        K key;
        V value;
        HashNode* next;
        HashNode(const K& k, const V& v) : key(k), value(v), next(nullptr) {}
    };

    static const int BUCKET_COUNT = 101;
    HashNode* table[BUCKET_COUNT];

    int hashFunction(const K& key) const {
        return std::hash<K>{}(key) % BUCKET_COUNT;
    }

public:
    SimpleHashTable() {
        for (int i = 0; i < BUCKET_COUNT; i++) table[i] = nullptr;
    }

    void insert(const K& key, const V& value) {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];

        while (entry != nullptr) {
            if (entry->key == key) {
                entry->value = value;
                return;
            }
            entry = entry->next;
        }

        HashNode* newNode = new HashNode(key, value);
        newNode->next = table[idx];
        table[idx] = newNode;
    }

    bool get(const K& key, V& outValue) const {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];
        while (entry != nullptr) {
            if (entry->key == key) {
                outValue = entry->value;
                return true;
            }
            entry = entry->next;
        }
        return false;
    }
};
```

## छोटे इनपुट के लिए `std::map` क्यों बेहतर है?

$N < 50$ के लिए:
१. **शून्य हैश ओवरहेड:** जटिल स्ट्रिंग हैश फंक्शन सीपीयू के कई चक्र लेते हैं।
२. **कोई खाली बकेट बर्बादी नहीं:** अप्रयुक्त बकेट पॉइंटर्स नहीं बनते।
३. **कैश लोकैलिटी:** बाइनरी सर्च वाला एक समतल `std::vector<std::pair<K,V>>` L1/L2 कैश के कारण दोनों से तेज़ चलता है।

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: मॉडर्न स्विस टेबल्स (Google Abseil)

१. **Abseil `flat_hash_map`:** सिमडी (SIMD) निर्देशों द्वारा एक साथ १६ मेटाडेटा बाइट्स की जांच।
२. **हैश DoS सुरक्षा:** SipHash द्वारा यादृच्छिक हैश टकराव हमलों से बचाव।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **नियतात्मक पुनरावृत्ति (Deterministic Iteration):** वितरित आम सहमति (Consensus) इंजनों में `std::map` सभी नोड्स पर समान क्रम की गारंटी देता है।
