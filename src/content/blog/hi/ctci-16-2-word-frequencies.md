---
title: "शब्द आवृत्तियाँ (Word Frequencies): इनवर्टेड इंडेक्सिंग और हैश टेबल प्री-प्रोसेसिंग (सीटीसीआई १६.२)"
description: "हैश मैप्स और इनवर्टेड इंडेक्सिंग का उपयोग करके एकल और बार-बार पूछे जाने वाले प्रश्नों के लिए किसी पुस्तक में शब्दों की आवृत्ति खोजने का कुशल एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** किसी पुस्तक में किसी दिए गए शब्द की आवृत्ति (Frequency) खोजने के लिए एक विधि डिज़ाइन करें। यदि हम इस एल्गोरिदम को कई बार चला रहे हों तो क्या बदलाव करेंगे?
> * **मुख्य समाधान:**
>   1. **एकल क्वेरी**: विराम चिह्नों को हटाकर पुस्तक को एक बार स्कैन करें। यह **$O(N)$ समय** और **$O(1)$ स्पेस** में चलता है।
>   2. **बार-बार क्वेरी**: इनिशियलाइज़ेशन के दौरान संपूर्ण पुस्तक को `HashMap<String, Integer>` में प्री-प्रोसेस करें।
>      * प्री-प्रोसेसिंग: **$O(N)$ समय**, **$O(U)$ स्पेस** ($U = \text{अद्वितीय शब्द}$)।
>      * क्वेरी समय: **$O(1)$ अनाकारिक (Amortized)**।
> * **रियल-वर्ल्ड सिस्टम:** अपाचे ल्यूसीन (Apache Lucene) और इलास्टिकसर्च (Elasticsearch) में इनवर्टेड इंडेक्स।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.२) में पूछा गया है:

*"किसी पुस्तक में किसी शब्द की आवृत्ति की गणना करने के लिए एकल बनाम बार-बार निष्पादित होने वाले प्रश्नों के लिए उपयुक्त एल्गोरिदम डिज़ाइन करें।"*

## २. एकल स्कैन बनाम प्रीकंप्यूटेड हैश इंडेक्स

* **एकल क्वेरी मोड:** अतिरिक्त मेमोरी के बिना सरल रैखिक स्कैन।
* **मल्टी-क्वेरी मोड:** $O(1)$ में तत्काल उत्तर देने के लिए इन-मेमोरी हैश टेबल इंडेक्स।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class WordFrequencyAnalyzer {
    private final Map<String, Integer> frequencyMap;

    public WordFrequencyAnalyzer(String[] book) {
        this.frequencyMap = buildDictionary(book);
    }

    private Map<String, Integer> buildDictionary(String[] book) {
        if (book == null) return Collections.emptyMap();
        Map<String, Integer> map = new HashMap<>();

        for (String word : book) {
            if (word == null) continue;
            String normalized = normalize(word);
            if (!normalized.isEmpty()) {
                map.put(normalized, map.getOrDefault(normalized, 0) + 1);
            }
        }
        return map;
    }

    public int getFrequency(String word) {
        if (word == null) return 0;
        return frequencyMap.getOrDefault(normalize(word), 0);
    }

    private static String normalize(String word) {
        return word.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
```

## जटिलता विश्लेषण

| वर्कलोड पैटर्न | प्री-प्रोसेसिंग समय | सहायक स्पेस | क्वेरी समय |
|---|---|---|---|
| **एकल क्वेरी** | $0$ (शून्य) | $O(1)$ | $O(N)$ |
| **$Q$ बार-बार प्रश्न** | $O(N)$ एकल पास | $O(U)$ अद्वितीय शब्दावली | **$O(1)$ प्रति क्वेरी** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: इलास्टिकसर्च में इनवर्टेड इंडेक्स

१. **टर्म डिक्शनरी और पोस्टिंग लिस्ट:** सर्च इंजन शब्दों की पोस्टिंग लिस्ट (`Term -> [DocID, TF]`) बनाते हैं ताकि प्रासंगिकता (BM25) की तेजी से गणना की जा सके।
२. **स्टेमिंग और नॉर्मलाइजेशन:** स्टॉप वर्ड्स को हटाना और मूल शब्द रूप (Stemming) निकालना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **विराम चिह्न और केस संवेदनशीलता:** `"apple,"` और `"Apple."` दोनों को `"apple"` के रूप में सामान्यीकृत किया जाता है ताकि सही गणना हो सके।
