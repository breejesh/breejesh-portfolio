---
title: "बिक्री रैंक (Sales Rank): रियल-टाइम ई-कॉमर्स बेस्ट-सेलर रैंकिंग इंजन (सीटीसीआई ९.६)"
description: "रेडिस सॉर्टेड सेट्स (ZSET) और स्लाइडिंग विंडो एग्रीगेशन का उपयोग करके ई-कॉमर्स उत्पादों के लिए रियल-टाइम बेस्ट-सेलर रैंकिंग इंजन का सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक बड़ी ई-कॉमर्स कंपनी समग्र रूप से और श्रेणी के अनुसार सबसे अधिक बिकने वाले उत्पादों को सूचीबद्ध करना चाहती है (उदा. पिछले घंटे, २४ घंटे, ७ दिन, सर्वकालिक)। इन रैंकों को वास्तविक समय में ट्रैक और अपडेट करने के लिए डेटा संरचनाओं और एल्गोरिदम की रूपरेखा तैयार करें।
> * **मुख्य समाधान:** **रेडिस सॉर्टेड सेट्स (ZSET) + स्लाइडिंग विंडो**: (१) खरीदारी की घटनाएं अपाचे काफ्का (Kafka) पर प्रकाशित होती हैं; (२) रियल-टाइम लीडरबोर्ड रेडिस सॉर्टेड सेट्स (`ZSET` आधारित स्किप लिस्ट) द्वारा प्रबंधित होते हैं, जहाँ `ZINCRBY` और `ZREVRANK` $O(\log N)$ समय लेते हैं; (३) स्लाइडिंग विंडो बकेट (१ घंटे के लिए ६० १-मिनट के बकेट); (४) ७ दिन और ३० दिन की रैंकिंग के लिए बैच जॉब्स (Apache Flink / Spark)।
> * **रियल-वर्ल्ड सिस्टम:** अमेज़न बेस्ट सेलर्स रैंक (Amazon BSR) और ऐप स्टोर लीडरबोर्ड।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.६) में पूछा गया है:

*"ई-कॉमर्स उत्पादों के लिए विभिन्न श्रेणियों और समय अंतरालों में वास्तविक समय में बेस्ट-सेलर रैंक की गणना करने के लिए सिस्टम आर्किटेक्चर डिज़ाइन करें।"*

## २. डेटा संरचनाएं और आर्किटेक्चर

### रेडिस सॉर्टेड सेट्स (`ZSET`)
* कुंजी: `rank:category:window` (उदा. `rank:sports:24h`)।
* सदस्य: `product_id`।
* स्कोर: कुल संचित बिक्री संख्या।
* `ZINCRBY`: बिक्री संख्या को $O(\log N)$ समय में बढ़ाता है।
* `ZREVRANGE`: टॉप $K$ उत्पादों को $O(\log N + K)$ में लाता है।
* `ZREVRANK`: किसी उत्पाद की सटीक रैंक $O(\log N)$ में प्राप्त करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class SalesRankEngine {
    public static class ProductSales implements Comparable<ProductSales> {
        public final String productId;
        public int salesCount;

        public ProductSales(String id, int sales) {
            this.productId = id;
            this.salesCount = sales;
        }

        @Override
        public int compareTo(ProductSales other) {
            return Integer.compare(this.salesCount, other.salesCount);
        }
    }

    private final Map<String, Map<String, Integer>> categorySales = new HashMap<>();

    public synchronized void recordPurchase(String productId, String[] categories, int quantity) {
        for (String cat : categories) {
            categorySales.putIfAbsent(cat, new HashMap<>());
            Map<String, Integer> salesMap = categorySales.get(cat);
            salesMap.put(productId, salesMap.getOrDefault(productId, 0) + quantity);
        }
    }

    public synchronized PriorityQueue<ProductSales> getTopK(String category, int k) {
        Map<String, Integer> salesMap = categorySales.get(category);
        if (salesMap == null) return new PriorityQueue<>();

        PriorityQueue<ProductSales> minHeap = new PriorityQueue<>(k);

        for (Map.Entry<String, Integer> entry : salesMap.entrySet()) {
            ProductSales ps = new ProductSales(entry.getKey(), entry.getValue());
            if (minHeap.size() < k) {
                minHeap.add(ps);
            } else if (ps.salesCount > minHeap.peek().salesCount) {
                minHeap.poll();
                minHeap.add(ps);
            }
        }

        return minHeap;
    }
}
```

## जटिलता और प्रदर्शन विश्लेषण

| ऑपरेशन | जटिलता | तकनीकी विवरण |
|---|---|---|
| बिक्री इंजेक्शन | `O(log N)` | रेडिस स्किप लिस्ट में स्कोर अपडेट। |
| टॉप K खोज | `O(log N + K)` | सॉर्टेड सेट में रेंज स्कैन। |
| उत्पाद रैंक क्वेरी | `O(log N)` | फॉरवर्ड इंडेक्स रैंक लुकअप। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: अमेज़न BSR घातीय भार

१. **समय क्षय (Time Decay):** हाल की बिक्री को पुरानी बिक्री की तुलना में घातीय रूप से अधिक भार दिया जाता है ($S = \sum \text{qty} \cdot e^{-\lambda \Delta t}$)।
२. **सीडीएन टॉप १०० कैशिंग:** ९९% उपयोगकर्ता केवल टॉप १०० उत्पाद देखते हैं। स्टैटिक सीडीएन कैशिंग डेटाबेस लोड को शून्य कर देती है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **श्रेणी पदानुक्रम:** "रनिंग शूज़" में बिक्री होने पर "जूते", "स्पोर्ट्स" और मुख्य श्रेणी के काउंटर्स स्वचालित रूप से बढ़ते हैं।
