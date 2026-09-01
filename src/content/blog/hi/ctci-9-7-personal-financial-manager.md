---
title: "व्यक्तिगत वित्तीय प्रबंधक (Personal Financial Manager): वितरित वित्तीय एकत्रीकरण प्लेटफॉर्म (सीटीसीआई ९.७)"
description: "बैंक एपीआई इंटीग्रेशन, मशीन लर्निंग ट्रांजेक्शन वर्गीकरण और बजट अनुशंसाओं के साथ व्यक्तिगत वित्तीय प्रबंधक (Mint / Plaid) का सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-7-personal-financial-manager.webp
previewImage: /assets/images/ctci-9-7-personal-financial-manager.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** बताएं कि आप एक व्यक्तिगत वित्तीय प्रबंधक (जैसे Mint.com) कैसे डिज़ाइन करेंगे। यह सिस्टम उपयोगकर्ता के बैंक खातों से जुड़ेगा, उनकी खर्च करने की आदतों का विश्लेषण करेगा और वित्तीय सिफारिशें करेगा।
> * **मुख्य समाधान:** **मल्टी-स्टेज वित्तीय इंजेक्शन पाइपलाइन**: (१) **बैंकिंग इंजेक्शन टियर**: हार्डवेयर सिक्योरिटी मॉड्यूल (AWS KMS) द्वारा सुरक्षित टोकन के साथ ओपन बैंकिंग / प्लेड (Plaid) एपीआई से जुड़ने वाले एसिंक्रोनस वर्कर्स; (२) **वर्गीकरण पाइपलाइन**: १० मिलीसेकंड से कम में मर्चेंट स्ट्रिंग्स (उदा. `"STARBUCKS"` $\to$ `"Dining"`) को टैग करने वाला हाइब्रिड रेगेक्स + एमएल क्लासिफायर; (३) **दोहरा डेटाबेस टियर**: एसीआईडी (ACID) लेनदेन के लिए पोस्टग्रेएसक्यूएल + त्वरित समय-श्रृंखला खर्च विश्लेषण के लिए क्लिकहाउस (ClickHouse); (४) **सिफारिश इंजन**: ब्याज दरों और बजट सीमाओं पर अलर्ट देने वाला नियम इंजन।
> * **रियल-वर्ल्ड सिस्टम:** प्लेड (Plaid) वित्तीय डेटा एकत्रीकरण और मिंट (Mint / Intuit) बजटिंग इंजन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.७) में पूछा गया है:

*"बैंक खातों को जोड़ने, लेनदेन का स्वचालित वर्गीकरण करने और बजटिंग सिफारिशें देने वाले व्यक्तिगत वित्तीय प्रबंधक का सिस्टम आर्किटेक्चर डिज़ाइन करें।"*

## २. सिस्टम आर्किटेक्चर और घटक डिज़ाइन

१. **बैंक इंजेक्शन और सिंक वर्कर्स:** एन्क्रिप्टेड वॉल्ट में संग्रहीत OAuth टोकन द्वारा आवधिक डेटा सिंक।
२. **लेनदेन वर्गीकरण इंजन:**
   * ज्ञात मर्चेंट स्ट्रिंग्स के लिए नियम-आधारित त्वरित कैश।
   * अज्ञात लेनदेन विवरणों के लिए मशीन लर्निंग (ML) टेक्स्ट वर्गीकरण।
३. **खर्च विश्लेषण और सिफारिशें:** मासिक श्रेणी योग की गणना और बजट ओवरशूट अलर्ट।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PersonalFinancialManager {
    public static class Transaction {
        public final String id;
        public final String rawMerchant;
        public final double amount;
        public final long timestamp;
        public String category;

        public Transaction(String id, String rawMerchant, double amount) {
            this.id = id;
            this.rawMerchant = rawMerchant;
            this.amount = amount;
            this.timestamp = System.currentTimeMillis();
        }
    }

    public static class CategorizationEngine {
        private final Map<String, String> exactRules = new HashMap<>();

        public CategorizationEngine() {
            exactRules.put("STARBUCKS", "Dining");
            exactRules.put("UBER", "Transportation");
            exactRules.put("NETFLIX", "Subscriptions");
        }

        public String categorize(String rawMerchant) {
            String upper = rawMerchant.toUpperCase();
            for (Map.Entry<String, String> entry : exactRules.entrySet()) {
                if (upper.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
            return "Uncategorized";
        }
    }

    public static class BudgetAnalyzer {
        public static Map<String, Double> summarizeSpending(List<Transaction> transactions) {
            Map<String, Double> summary = new HashMap<>();
            for (Transaction t : transactions) {
                summary.put(t.category, summary.getOrDefault(t.category, 0.0) + t.amount);
            }
            return summary;
        }

        public static List<String> generateRecommendations(Map<String, Double> summary, double monthlyIncome) {
            List<String> recommendations = new ArrayList<>();
            double dining = summary.getOrDefault("Dining", 0.0);

            if (dining > 0.3 * monthlyIncome) {
                recommendations.add("चेतावनी: भोजन खर्च मासिक आय के ३०% से अधिक है।");
            }
            return recommendations;
        }
    }
}
```

## जटिलता और आर्किटेक्चर विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| वर्गीकरण लेटेंसी | `O(1)` | नियम हैश टेबल लुकअप और एमएल फॉलबैक। |
| विश्लेषणात्मक एकत्रीकरण | `O(N)` | क्लिकहाउस में उपयोगकर्ता लेनदेन का स्तंभ-आधारित स्कैन। |
| सुरक्षा एन्क्रिप्शन | `AES-256-GCM` | केएमएस (KMS) द्वारा बैंक क्रेडेंशियल्स और टोकन का एन्क्रिप्शन। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: बैंक एपीआई विश्वसनीयता

१. **सर्किट ब्रेकर्स (Circuit Breakers):** अस्थिर बैंक एपीआई विफलताओं को अलग करके कैश किए गए लेजर बैलेंस पर स्विच करना।
२. **आइडम्पोटेंट इंजेक्शन:** डुप्लिकेट लेनदेन प्रविष्टियों को रोकने के लिए क्रिप्टोग्राफ़िक हैश कुंजी (`hash(खाता, राशि, तिथि)`) का उपयोग।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **लंबित बनाम पुष्ट लेनदेन:** कार्ड प्राधिकरणों की दोहरी गिनती से बचने के लिए स्थिति नियंत्रण।
२. **बहु-मुद्रा रूपांतरण:** वास्तविक समय विनिमय दरों पर सामान्यीकरण।
