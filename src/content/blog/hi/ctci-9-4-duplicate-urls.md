---
title: "डुप्लिकेट यूआरएल (Duplicate URLs): बड़े पैमाने पर १० अरब यूआरएल की डुप्लीकेशन जांच (सीटीसीआई ९.४)"
description: "डिस्क पार्टिशनिंग, वितरित MapReduce और इन-मेमोरी ब्लूम फ़िल्टर (Bloom Filter) का उपयोग करके १० अरब यूआरएल में से डुप्लिकेट की पहचान का सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपके पास १० अरब (10 Billion) यूआरएल की सूची है। आप डुप्लिकेट यूआरएल का पता कैसे लगाएंगे?
> * **मुख्य समाधान:** **हार्डवेयर सीमाओं के आधार पर ३ आर्किटेक्चर**: (१) **इन-मेमोरी ब्लूम फ़िल्टर**: ०.१% त्रुटि दर के साथ $18\text{ GB}$ रैम की आवश्यकता होती है, जो ३२ जीबी रैम वाले एकल सर्वर में आसानी से समा जाता है; (२) **सिंगल-मशीन डिस्क पार्टिशनिंग (External Hashing)**: यूआरएल को `hash(URL) % 4000` द्वारा ४,००० फाइलों (प्रत्येक २५० एमबी) में विभाजित करना और प्रत्येक को रैम में लोड करके `HashSet` से डुप्लिकेट हटाना; (३) **वितरित MapReduce क्लस्टर**: `(hash(url), url)` को मैप और रिड्यूस करके अद्वितीय रिकॉर्ड उत्पन्न करना।
> * **रियल-वर्ल्ड सिस्टम:** सर्च इंजन वेब इंडेक्सिंग और स्नोफ्लेक (Snowflake) / बिगक्वेरी डेटा वेयरहाउस।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.४) में पूछा गया है:

*"१० अरब यूआरएल के विशाल डेटासेट में डुप्लिकेट यूआरएल की पहचान और निष्कासन के लिए बड़े पैमाने पर स्केलेबल सिस्टम डिज़ाइन करें।"*

## २. डेटासेट का आकार और संसाधन गणना

* **कुल यूआरएल ($N$):** $१०^{१०}$।
* **औसत लंबाई:** १०० बाइट्स।
* **कच्चा डेटा आकार:** $१०^{१०} \times १००\text{ बाइट्स} = १\text{ TB}$।

चूंकि १ टीबी सामान्य सर्वर रैम (३२-६४ जीबी) से अधिक है, इसलिए हम ३ व्यावहारिक समाधानों का विश्लेषण करते हैं।

---

### विधि १: एकल मशीन पर डिस्क पार्टिशनिंग
१. १ टीबी फाइल को क्रमिक रूप से पढ़ें।
२. $k = \text{hash}(\text{URL}) \pmod{4000}$ निकालें।
३. यूआरएल को डिस्क फाइल $F_k$ ($\approx २५०\text{ MB}$) में लिखें।
४. प्रत्येक फाइल को बारी-बारी से `HashSet<String>` में लोड करके डुप्लिकेट हटाएं।

---

### विधि २: वितरित MapReduce क्लस्टर
* **मैप:** प्रत्येक यूआरएल के लिए `(hash(url), url)` उत्सर्जित करता है।
* **शफल:** समान यूआरएल को एक ही रिड्यूसर पर भेजता है।
* **रिड्यूस:** डुप्लिकेट्स को हटाकर अद्वितीय यूआरएल लिखता है।

---

### विधि ३: इन-मेमोरी ब्लूम फ़िल्टर
$१०^{१०}$ रिकॉर्ड और ०.१% त्रुटि दर के लिए:
$$m \approx १४.४ \times १०^{१०}\text{ bits} \approx १८\text{ GB RAM}$$

एकल सर्वर में सब-माइक्रोसेकंड गति से डुप्लिकेट जांच संभव होती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class DuplicateUrlDetector {
    private static final int NUM_BUCKETS = 4000;

    public static void splitIntoBuckets(String inputFilePath, String tempDir) throws IOException {
        BufferedWriter[] writers = new BufferedWriter[NUM_BUCKETS];
        for (int i = 0; i < NUM_BUCKETS; i++) {
            writers[i] = new BufferedWriter(new FileWriter(new File(tempDir, "bucket_" + i + ".txt")));
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(inputFilePath))) {
            String url;
            while ((url = reader.readLine()) != null) {
                int bucketIndex = Math.abs(url.hashCode() % NUM_BUCKETS);
                writers[bucketIndex].write(url);
                writers[bucketIndex].newLine();
            }
        } finally {
            for (BufferedWriter w : writers) {
                if (w != null) w.close();
            }
        }
    }

    public static void processBuckets(String tempDir, BufferedWriter outputWriter) throws IOException {
        for (int i = 0; i < NUM_BUCKETS; i++) {
            File bucketFile = new File(tempDir, "bucket_" + i + ".txt");
            if (!bucketFile.exists()) continue;

            Set<String> uniqueUrls = new HashSet<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(bucketFile))) {
                String url;
                while ((url = reader.readLine()) != null) {
                    if (uniqueUrls.add(url)) {
                        outputWriter.write(url);
                        outputWriter.newLine();
                    }
                }
            }
            bucketFile.delete();
        }
    }
}
```

## जटिलता और आर्किटेक्चर विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| एकल-मशीन डिस्क I/O | `O(N)` | डिस्क पर २ क्रमिक पास (विभाजन + डुप्लीकेशन जांच)। |
| MapReduce समय | `O(N / M)` | $M$ कार्यकर्ता नोड्स में रैखिक स्केलिंग। |
| ब्लूम फ़िल्टर मेमोरी | `18 GB` | ३२ जीबी रैम वाले एकल सर्वर में पूरी तरह उपयुक्त। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: डेटा वेयरहाउस इंजेक्शन

१. **स्नोफ्लेक और बिगक्वेरी इंजेक्शन:** डुप्लिकेट लॉग घटनाओं को हटाने के लिए एक्सटर्नल हैश जॉइन का उपयोग।
२. **डीएनएस सिंकहोल ब्लॉकलिस्ट:** डिस्क एक्सेस से पहले त्वरित ब्लूम फ़िल्टर जांच।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **हैश विषमता:** यदि कोई बकेट ५०० एमबी से अधिक हो जाए, तो पुनरावर्ती उप-विभाजन लागू करना।
