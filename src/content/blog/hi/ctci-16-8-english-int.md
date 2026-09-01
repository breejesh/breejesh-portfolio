---
title: "संख्या से शब्द (English Int): ३-अंकीय चंकिंग द्वारा पूर्णांक को शब्दों में बदलना (सीटीसीआई १६.८)"
description: "मॉड्यूलर ३-अंकीय चंकिंग और स्ट्रिंग टोकनाइज़ेशन का उपयोग करके किसी भी ३२-बिट पूर्णांक को अंग्रेजी शब्दों में बदलने का O(1) एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-8-english-int.webp
previewImage: /assets/images/ctci-16-8-english-int.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कोई भी पूर्णांक दिया गया हो, उस पूर्णांक का वर्णन करने वाला एक अंग्रेजी वाक्यांश प्रिंट करें (उदा. "One Thousand Two Hundred Thirty Four")।
> * **मुख्य समाधान:** **३-अंकीय चंकिंग (Chunking)**:
>   1. **परिमाण पदानुक्रम**: संख्याओं को ३-अंकीय समूहों में विभाजित करें: इकाइयाँ ($१०^०$), हज़ार ($१०^३$), मिलियन ($१०^६$) और बिलियन ($१०^९$)।
>   2. **चंक अनुवाद**: ० से ९९९ तक की संख्याओं को शब्दों में बदलना:
>      * सैकड़ा: `digits[n / 100] + " Hundred"`।
>      * दहाई और इकाई: यदि शेष $< २०$ तो तालिका से सीधे लें; यदि $\ge २०$ तो दहाई और इकाई को जोड़ें।
>   3. **संयोजन**: गैर-शून्य चंक्स को उनके परिमाण प्रत्यय के साथ जोड़ें।
>   4. यह **$O(1)$ समय** और **$O(1)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** बैंकिंग चेक प्रिंटिंग और टेक्स्ट-टू-स्पीच (TTS) सिंथेसिस।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.८) में पूछा गया है:

*"किसी पूर्णांक (धनात्मक, ऋणात्मक या शून्य) को उसके व्याकरणिक रूप से सही अंग्रेजी शब्द प्रतिनिधित्व में परिवर्तित करने के लिए एल्गोरिदम लिखें।"*

## २. ३-अंकीय चंकिंग पाइपलाइन

संख्या को १००० से बार-बार विभाजित करके प्रत्येक ३-अंकीय ब्लॉक को स्वतंत्र रूप से संसाधित किया जाता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.LinkedList;

public class EnglishIntConverter {

    private static final String[] SMALLS = {
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private static final String[] BIGS = {
        "", "Thousand", "Million", "Billion"
    };

    public static String convertToWords(int num) {
        if (num == 0) return "Zero";
        if (num == Integer.MIN_VALUE) {
            return "Negative Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Eight";
        }
        if (num < 0) return "Negative " + convertToWords(-num);

        LinkedList<String> parts = new LinkedList<>();
        int chunkCount = 0;

        while (num > 0) {
            int chunk = num % 1000;
            if (chunk != 0) {
                String chunkStr = convertChunk(chunk);
                if (!BIGS[chunkCount].isEmpty()) {
                    chunkStr += " " + BIGS[chunkCount];
                }
                parts.addFirst(chunkStr);
            }
            num /= 1000;
            chunkCount++;
        }

        return String.join(" ", parts).trim();
    }

    private static String convertChunk(int number) {
        StringBuilder sb = new StringBuilder();

        if (number >= 100) {
            sb.append(SMALLS[number / 100]).append(" Hundred");
            number %= 100;
            if (number > 0) sb.append(" ");
        }

        if (number >= 20) {
            sb.append(TENS[number / 10]);
            number %= 10;
            if (number > 0) sb.append(" ");
        }

        if (number > 0 && number < 20) {
            sb.append(SMALLS[number]);
        }

        return sb.toString();
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(1)` | ३२-बिट पूर्णांकों के लिए अधिकतम ४ चंक चक्र। |
| सहायक स्पेस | `O(1)` | स्ट्रिंग बिल्डर के लिए सीमित मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: टेक्स्ट-टू-स्पीच (TTS)

१. **टेक्स्ट नॉर्मलाइजेशन:** वॉयस असिस्टेंट्स (Google Assistant / Siri) ऑडियो जनरेट करने से पहले संख्याओं और मुद्राओं को शब्दों में बदलते हैं।
२. **स्थानीयकरण नियम:** भाषा के आधार पर व्याकरण और लिंग-विशिष्ट नियमों का प्रबंधन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **`Integer.MIN_VALUE`:** $-२^{३१}$ के नकारात्मक मान को बदलने पर ओवरफ्लो से बचने के लिए अलग बेस केस।
२. **मध्यवर्ती शून्य:** `1,000,005` जैसी संख्याएँ बिना अनावश्यक रिक्त स्थान के `"One Million Five"` बनाती हैं।
