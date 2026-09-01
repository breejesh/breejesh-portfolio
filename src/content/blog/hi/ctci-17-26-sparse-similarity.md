---
title: "विरल समानता (Sparse Similarity): दस्तावेज़ जैकार्ड समानता के लिए उल्टा सूचकांक (सीटीसीआई १७.२६)"
description: "O(D * W + P) समय में बिना प्रतिच्छेदन वाले दस्तावेज़ युग्मों को छोड़ने के लिए उल्टे सूचकांक (Inverted Index) का उपयोग करके जैकार्ड समानता की गणना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-26-sparse-similarity.webp
previewImage: /assets/images/ctci-17-26-sparse-similarity.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपके पास दस्तावेज़ों का एक संग्रह है, प्रत्येक को पूर्णांकों (शब्दों) के एक समूह द्वारा दर्शाया गया है। समानता $> 0$ वाले सभी दस्तावेज़ युग्मों के लिए जैकार्ड समानता ($\frac{|A \cap B|}{|A \cup B|}$) की गणना करें।
> * **मुख्य समाधान:** **उल्टे सूचकांक और युग्म प्रतिच्छेदन समुच्चय**:
>   1. **उल्टा सूचकांक बनाएं**: प्रत्येक शब्द को उन दस्तावेज़ों की सूची से मैप करें जिनमें वह शामिल है: `शब्द -> [doc1, doc2, ...]`.
>   2. **प्रतिच्छेदन की गणना करें**: प्रत्येक शब्द के लिए, उसकी सूची में मौजूद प्रत्येक दस्तावेज़ युग्म `(docA, docB)` के लिए साझा शब्द गणना बढ़ाएं।
>   3. **जैकार्ड समानता की गणना**: प्रतिच्छेदन $> 0$ वाले प्रत्येक युग्म के लिए:
>      $$\text{समानता} = \frac{\text{प्रतिच्छेदन}}{|\text{docA}| + |\text{docB}| - \text{प्रतिच्छेदन}}$$
>   4. समय: **$O(D \cdot W + P)$**, स्पेस: **$O(D \cdot W)$**।
> * **रियल-वर्ल्ड सिस्टम:** Apache Lucene/Elasticsearch पोस्टिंग सूचियां और सहयोगात्मक फ़िल्टरिंग सिफ़ारिश प्रणाली।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.२६) में पूछा गया है:

*"दो दस्तावेज़ों की समानता को प्रतिच्छेदन के आकार को संघ के आकार से विभाजित करके परिभाषित किया जाता है। शून्य से अधिक समानता वाले सभी दस्तावेज़ युग्मों की समानता की गणना के लिए एक एल्गोरिदम डिज़ाइन करें।"*

## २. उल्टे सूचकांक की प्रतिच्छेदन रणनीति

```
दस्तावेज़:
  १३: {१४, १५, १००, ९, ३}
  १६: {३२, १, ९, ३, ५}
  १९: {१५, २९, २, ६, ८, ७}
  २४: {७, १०}

उल्टा सूचकांक:
  १५ -> [१३, १९] ==> युग्म (१३, १९) +१
  ९  -> [१३, १६] ==> युग्म (१३, १६) +१
  ३  -> [१३, १६] ==> युग्म (१३, १६) +१
  ७  -> [१९, २४] ==> युग्म (१९, २४) +१

युग्म (१३, १६) के लिए जैकार्ड:
  |१३| = ५, |१६| = ५, प्रतिच्छेदन = २
  संघ = ५ + ५ - २ = ८
  समानता = २ / ८ = ०.२५
```

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class SparseSimilarity {

    public static class DocPair {
        public final int doc1, doc2;
        public DocPair(int d1, int d2) {
            this.doc1 = Math.min(d1, d2);
            this.doc2 = Math.max(d1, d2);
        }
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DocPair)) return false;
            DocPair p = (DocPair) o;
            return doc1 == p.doc1 && doc2 == p.doc2;
        }
        @Override
        public int hashCode() {
            return Objects.hash(doc1, doc2);
        }
    }

    public static Map<DocPair, Double> computeSimilarities(Map<Integer, int[]> documents) {
        Map<Integer, List<Integer>> invertedIndex = new HashMap<>();
        for (Map.Entry<Integer, int[]> entry : documents.entrySet()) {
            int docId = entry.getKey();
            for (int word : entry.getValue()) {
                invertedIndex.computeIfAbsent(word, k -> new ArrayList<>()).add(docId);
            }
        }

        Map<DocPair, Integer> intersections = new HashMap<>();
        for (List<Integer> docList : invertedIndex.values()) {
            int size = docList.size();
            for (int i = 0; i < size; i++) {
                for (int j = i + 1; j < size; j++) {
                    DocPair pair = new DocPair(docList.get(i), docList.get(j));
                    intersections.merge(pair, 1, Integer::sum);
                }
            }
        }

        Map<DocPair, Double> result = new HashMap<>();
        for (Map.Entry<DocPair, Integer> entry : intersections.entrySet()) {
            DocPair pair = entry.getKey();
            int intersect = entry.getValue();
            int size1 = documents.get(pair.doc1).length;
            int size2 = documents.get(pair.doc2).length;
            double union = size1 + size2 - intersect;
            result.put(pair, intersect / union);
        }

        return result;
    }
}
```

## जटिलता विश्लेषण

| चरण | समय जटिलता | सहायक स्पेस |
|---|---|---|
| उल्टा सूचकांक निर्माण | $O(\sum |D_i|)$ | $O(\sum |D_i|)$ |
| युग्म प्रतिच्छेदन गणना | $O(\sum \binom{|L_w|}{2})$ | $O(\text{अद्वितीय ओवरलैपिंग युग्म})$ |
| समानता गणना | $O(\text{प्रतिच्छेदन } > ० \text{ वाले युग्म})$ | $O(\text{प्रतिच्छेदन } > ० \text{ वाले युग्म})$ |
| **कुल** | **$O(\sum |D_i| + P)$** | **$O(\sum |D_i|)$** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

१. **सर्च इंजन पोस्टिंग सूचियां:** Apache Lucene और Elasticsearch बिना किसी दस्तावेज़ को अनुक्रमिक रूप से पढ़े सीधे क्वेरी शब्दों का मिलान करते हैं।
२. **सिफ़ारिश प्रणालियों में सहयोगात्मक फ़िल्टरिंग:** ई-कॉमर्स इंजन उपयोगकर्ता-उत्पाद इंटरैक्शन ग्राफ़ को उलटकर उत्पादों के बीच समानता स्कोर निकालते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली दस्तावेज़ संग्रह:** सुरक्षित रूप से खाली मैप लौटाना।
२. **कोई साझा शब्द नहीं:** बिना अतिरिक्त मेमोरी के खाली मैप लौटाना।
३. **समान दस्तावेज़:** सही रूप से `१.०` समानता की गणना।
