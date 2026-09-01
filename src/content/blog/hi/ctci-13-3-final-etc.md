---
title: "फ़ाइनल, फ़ाइनली और फ़ाइनलाइज़ (Final, Finally, and Finalize): जावा कीवर्ड्स और जीवनचक्र (सीटीसीआई १३.३)"
description: "जावा में final, finally और finalize के अंतर, अपरिवर्तनीयता (Immutability), सुरक्षित क्लीनअप और आधुनिक जेवीएम में Cleaner के उपयोग का विश्लेषण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-13-3-final-etc.webp
previewImage: /assets/images/ctci-13-3-final-etc.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** जावा में `final`, `finally`, और `finalize` के बीच क्या अंतर है?
> * **मुख्य समाधान:** **कीवर्ड वर्गीकरण और जीवनचक्र भूमिकाएं**: (१) **`final` (मॉडिफायर)**: वेरिएबल्स (मान/संदर्भ को अपरिवर्तनीय बनाता है), मेथड्स (ओवरराइडिंग रोकता है और JIT इनलाइनिंग सक्षम करता है) और क्लासेस (इनहेरिटेंस रोकता है, जैसे `String`); (२) **`finally` (कंट्रोल फ्लो ब्लॉक)**: `try-catch` से जुड़ा गारंटीकृत क्लीनअप ब्लॉक जो रिटर्न या एक्सेप्शन की स्थिति में भी चलता है; (३) **`finalize()` (GC मेथड)**: मेमोरी विमुक्ति से पहले गारबेज कलेक्टर द्वारा कॉल की जाने वाली `Object` क्लास की मेथड (**जावा 9 में बहिष्कृत और जावा 18+ में हटाई गई**; इसके स्थान पर `AutoCloseable` और `Cleaner` का उपयोग किया जाता है)।
> * **रियल-वर्ल्ड सिस्टम:** जावा रिकॉर्ड्स में थ्रेड-सुरक्षित डेटा मॉडल और `try-with-resources` द्वारा नेटिव मेमोरी प्रबंधन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १३.३) में पूछा गया है:

*"जावा में final, finally और finalize के बीच वाक्यात्मक, संरचनात्मक और प्रदर्शन संबंधी अंतरों की व्याख्या करें।"*

## २. संरचनात्मक तुलना

| मापदंड | `final` | `finally` | `finalize()` |
|---|---|---|---|
| **प्रकार** | एक्सेस मॉडिफायर / कीवर्ड | कंट्रोल फ्लो ब्लॉक | `java.lang.Object` का मेथड |
| **लागू होता है** | वेरिएबल्स, मेथड्स, क्लासेस | `try-catch` ब्लॉक्स | गारबेज कलेक्शन के अधीन ऑब्जेक्ट्स |
| **गारंटी** | अपरिवर्तनीयता और सबक्लासिंग प्रतिबंध | निश्चित क्लीनअप निष्पादन | **कोई समयबद्ध गारंटी नहीं** |
| **वर्तमान स्थिति** | मानक उत्पादन कोड | मानक उत्पादन कोड | **बहिष्कृत और समाप्त** |

## प्रोडक्शन कार्यान्वयन

```java
import java.lang.ref.Cleaner;

public final class SecurityToken {
    private final String token; // अपरिवर्तनीय संदर्भ

    public SecurityToken(String token) {
        this.token = token;
    }

    public final String getToken() {
        return token;
    }
}

public class NativeBufferWrapper implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();

    private static class CleanAction implements Runnable {
        private long address;
        CleanAction(long addr) { this.address = addr; }
        @Override
        public void run() {
            if (address != 0) {
                System.out.println("नेटिव मेमोरी मुक्त: " + address);
                address = 0;
            }
        }
    }

    private final Cleaner.Cleanable cleanable;

    public NativeBufferWrapper(long address) {
        this.cleanable = CLEANER.register(this, new CleanAction(address));
    }

    @Override
    public void close() {
        cleanable.clean(); // तात्कालिक और निश्चित क्लीनअप
    }
}
```

## `finalize()` को हटाने के कारण

१. **अनिश्चित निष्पादन:** जेवीएम इस बात की कोई गारंटी नहीं देता कि `finalize()` कब या चलेगा भी या नहीं।
२. **गारबेज कलेक्टर पर भार:** फ़ाइनलाइज़र वाले ऑब्जेक्ट्स जीसी मेमोरी रिलीज़ को विलंबित करते हैं।
३. **ऑब्जेक्ट पुनरुत्थान हमले (Object Resurrection):** `finalize()` के अंदर `this` को दोबारा असाइन करके असुरक्षित ऑब्जेक्ट को पुनर्जीवित किया जा सकता था।

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: JIT इनलाइनिंग ऑप्टिमाइज़ेशन

१. **मोनोमॉर्फिक इनलाइनिंग:** मेथड को `final` बनाने से HotSpot JIT कंपाइलर वर्चुअल मेथड टेबल लुकअप को बायपास करके मेथड को सीधे नेटिव असेंबली में इनलाइन करता है।
२. **जावा मेमोरी मॉडल (JMM) सुरक्षित प्रकाशन:** कंस्ट्रक्टर पूरा होते ही `final` फ़ील्ड्स सभी थ्रेड्स के लिए तुरंत दृश्यमान होते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **फ़ाइनल संदर्भ बनाम ऑब्जेक्ट अपरिवर्तनीयता:** `final List<String> list` वेरिएबल को दोबारा असाइन करने से रोकता है, लेकिन `list.add()` की अनुमति देता है। पूर्ण अपरिवर्तनीयता के लिए `List.of()` का उपयोग करें।
