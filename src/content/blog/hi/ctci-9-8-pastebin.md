---
title: "पेस्टबिन (Pastebin): स्केलेबल टेक्स्ट स्टोरेज और यूआरएल शॉर्टनर आर्किटेक्चर (सीटीसीआई ९.८)"
description: "Base62 एन्कोडिंग, S3 ऑब्जेक्ट स्टोरेज और की-जनरेशन सर्विस (KGS) का उपयोग करके पेस्टबिन टेक्स्ट शेयरिंग प्लेटफॉर्म का बड़े पैमाने पर सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-8-pastebin.webp
previewImage: /assets/images/ctci-9-8-pastebin.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** पेस्टबिन (Pastebin) जैसा सिस्टम डिज़ाइन करें, जहां उपयोगकर्ता टेक्स्ट दर्ज कर सकता है और इसे एक्सेस करने के लिए यादृच्छिक रूप से उत्पन्न यूआरएल प्राप्त कर सकता है।
> * **मुख्य समाधान:** **ऑब्जेक्ट स्टोरेज + की-जनरेशन सर्विस (KGS)**: (१) ७-अक्षरों का Base62 (`[a-zA-Z0-9]`) एन्कोडिंग जो $62^7 \approx 3.52\text{ ट्रिलियन}$ अद्वितीय यूआरएल प्रदान करता है; (२) **KGS सेवा**: मेमोरी में पूर्व-उत्पन्न अद्वितीय कुंजियां जो डेटाबेस टकराव और लॉक को समाप्त करती हैं; (३) **हाइब्रिड स्टोरेज**: कसांद्रा / डायनेमोडीबी में मेटाडेटा और अमेज़न S3 / MinIO में कच्चा टेक्स्ट कंटेंट; (४) **कैशिंग**: शीर्ष २०% वायरल टेक्स्ट को रेडिस में सब-मिलीसेकंड लुकअप के साथ कैश करना।
> * **रियल-वर्ल्ड सिस्टम:** Pastebin.com, गिटहब गिस्ट (GitHub Gist) और बिटली (Bitly) यूआरएल शॉर्टनर।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.८) में पूछा गया है:

*"टेक्स्ट शेयरिंग और यूआरएल शॉर्टनिंग के लिए पेस्टबिन जैसा अत्यधिक स्केलेबल सिस्टम आर्किटेक्चर डिज़ाइन करें।"*

## २. क्षमता और संसाधन अनुमान

* **राइट्स (Writes):** १० मिलियन पेस्ट/दिन ($\approx ११५\text{ पेस्ट/सेकंड}$)।
* **रीड्स (Reads):** १०० मिलियन रीड/दिन (१०:१ रीड/राइट अनुपात)।
* **औसत आकार:** १० KB प्रति टेक्स्ट।
* **स्टोरेज:** $१००\text{ GB/दिन} \implies ३६.५\text{ TB/वर्ष}$।
* **कुंजी स्पेस:** $६२^७ \approx ३.५२ \times १०^{१२}$ अद्वितीय अल्फ़ान्यूमेरिक यूआरएल।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class PastebinService {
    private static final String BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static class PasteMetadata {
        public final String slug;
        public final String content;
        public final long createdAt;
        public final long expiresAt;

        public PasteMetadata(String slug, String content, long ttlSeconds) {
            this.slug = slug;
            this.content = content;
            this.createdAt = System.currentTimeMillis();
            this.expiresAt = ttlSeconds > 0 ? this.createdAt + (ttlSeconds * 1000) : Long.MAX_VALUE;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private final AtomicLong counter = new AtomicLong(10000000000L);
    private final ConcurrentHashMap<String, PasteMetadata> pasteStorage = new ConcurrentHashMap<>();

    public String encodeBase62(long num) {
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            sb.append(BASE62.charAt((int) (num % 62)));
            num /= 62;
        }
        return sb.reverse().toString();
    }

    public String createPaste(String content, long ttlSeconds) {
        long id = counter.incrementAndGet();
        String slug = encodeBase62(id);
        PasteMetadata meta = new PasteMetadata(slug, content, ttlSeconds);
        pasteStorage.put(slug, meta);
        return slug;
    }

    public String getPaste(String slug) {
        PasteMetadata meta = pasteStorage.get(slug);
        if (meta == null || meta.isExpired()) {
            pasteStorage.remove(slug);
            return null;
        }
        return meta.content;
    }
}
```

## जटिलता और आर्किटेक्चर विश्लेषण

| ऑपरेशन | जटिलता | तकनीकी विवरण |
|---|---|---|
| पेस्ट बनाना | `O(1)` | एटॉमिक काउंटर + Base62 एन्कोडिंग + S3 स्टोरेज। |
| पेस्ट प्राप्त करना | `O(1)` | रेडिस मेमोरी या NoSQL से सीधा लुकअप। |
| टकराव की संभावना | `0%` | KGS केंद्रीय आवंटक द्वारा शून्य टकराव की गारंटी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: की-जनरेशन सर्विस (KGS)

१. **मेमोरी में पूर्व-उत्पन्न कुंजियां:** KGS क्लस्टर पृष्ठभूमि में कुंजियां तैयार करता है। अनुरोध आने पर बिना डेटाबेस लॉक के तुरंत एक कुंजी मिल जाती है।
२. **S3 ऑटोमेटेड लाइफसाइकिल:** समाप्त हो चुके टेक्स्ट को S3 नीतियां स्वचालित रूप से हटा देती हैं, जिससे मुख्य डेटाबेस पर कोई भार नहीं पड़ता।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **आकार सीमा:** प्रति पेस्ट अधिकतम १० एमबी की सीमा लागू करना।
२. **दुरुपयोग सुरक्षा:** टोकन बकेट एल्गोरिदम द्वारा प्रति आईपी दर सीमा।
