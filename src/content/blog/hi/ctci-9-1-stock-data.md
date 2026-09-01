---
title: "स्टॉक डेटा (Stock Data): उच्च-थ्रूपुट वित्तीय डेटा वितरण आर्किटेक्चर (सीटीसीआई ९.१)"
description: "मेमोरी-मैप्ड कैश और स्टैटिक स्नैपशॉट फ़ाइलों का उपयोग करके १,००० क्लाइंट ऍप्लिकेशन्स के लिए सब-मिलीसेकंड लेटेंसी में स्टॉक मार्केट डेटा क्वेरी सेवा का सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-1-stock-data.webp
previewImage: /assets/images/ctci-9-1-stock-data.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कल्पना कीजिए कि आप एक सेवा बना रहे हैं जिसे १,००० क्लाइंट एप्लिकेशन हाल ही के स्टॉक डेटा (`open`, `close`, `high`, `low`) को क्वेरी करने के लिए कॉल करेंगे। अपनी धारणाएं बताएं, अपने दृष्टिकोण की रूपरेखा तैयार करें और बताएं कि आपका सिस्टम स्केलिंग और विफलताओं को कैसे संभालता है।
> * **मुख्य समाधान:** **पार्टिशन इन-मेमोरी कैश + फ्लैट फ़ाइल प्रकाशन**: (१) हाई-स्पीड यूडीपी (UDP) मल्टीकास्ट फीड से मार्केट डेटा प्राप्त करना; (२) रैम (RAM) में लॉक-फ्री `ConcurrentHashMap` डेटा संरचना; (३) प्रति सेकंड स्टैटिक फ्लैट फाइलों (JSON / Protobuf) का प्रकाशन जो NGINX / CDN द्वारा बिना डेटाबेस लोड के परोसी जाती हैं; (४) फीड रिडंडेंसी (Feed A / Feed B) द्वारा उच्च उपलब्धता।
> * **रियल-वर्ल्ड सिस्टम:** ब्लूमबर्ग टर्मिनल (Bloomberg Terminal) और नैस्डैक (Nasdaq ITCH/OUCH) प्रोटोकॉल।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.१) में पूछा गया है:

*"१,००० उद्यम क्लाइंट एप्लिकेशनों के लिए उच्च थ्रूपुट और न्यूनतम लेटेंसी वाली स्टॉक टिकर क्वेरी सेवा का सिस्टम आर्किटेक्चर डिज़ाइन करें।"*

## २. सिस्टम आर्किटेक्चर और आकार का अनुमान

### क्षमता आवश्यकताएं
* **क्लाइंट:** १,००० एप्लिकेशन लगातार क्वेरी कर रहे हैं ($\approx १०,०००\text{ QPS}$)।
* **टिकर:** $\approx १०,०००$ सक्रिय स्टॉक।
* **मेमोरी आकार:** $१०,००० \times ३२\text{ बाइट्स} \approx ३२०\text{ KB}$ (संपूर्ण बाजार स्थिति आसानी से रैम में समा जाती है)।

### प्रमुख घटक
१. **इंजेस्ट सेवा:** स्टॉक एक्सचेंजों से यूडीपी फीड पढ़कर इन-मेमोरी टेबल को अपडेट करना।
२. **स्नैपशॉट जनरेटर:** प्रति सेकंड मेमोरी-कैश से स्टैटिक फाइलें लिखना।
३. **वेब सर्वर / सीडीएन:** बिना डेटाबेस क्वेरी के ग्राहकों को स्टैटिक फाइलें प्रदान करना।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.concurrent.ConcurrentHashMap;

public class StockDataService {
    public static class StockQuote {
        public final String ticker;
        public final double open;
        public final double high;
        public final double low;
        public final double current;
        public final long volume;
        public final long timestamp;

        public StockQuote(String ticker, double open, double high, double low, double current, long volume) {
            this.ticker = ticker;
            this.open = open;
            this.high = high;
            this.low = low;
            this.current = current;
            this.volume = volume;
            this.timestamp = System.currentTimeMillis();
        }
    }

    private final ConcurrentHashMap<String, StockQuote> priceCache = new ConcurrentHashMap<>(16384);

    public void updatePrice(String ticker, double price, long volumeDelta) {
        priceCache.compute(ticker, (k, old) -> {
            if (old == null) {
                return new StockQuote(ticker, price, price, price, price, volumeDelta);
            }
            double newHigh = Math.max(old.high, price);
            double newLow = Math.min(old.low, price);
            return new StockQuote(ticker, old.open, newHigh, newLow, price, old.volume + volumeDelta);
        });
    }

    public StockQuote getLatestQuote(String ticker) {
        return priceCache.get(ticker);
    }
}
```

## जटिलता और प्रदर्शन विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| क्वेरी लेटेंसी | `O(1)` | ५ माइक्रोसेकंड से कम में समवर्ती इन-मेमोरी लुकअप। |
| मेमोरी पदचिह्न | `O(T)` | १०,००० टिकर के लिए १ एमबी से कम मेमोरी। |
| थ्रूपुट क्षमता | `> 500,000 QPS` | NGINX मेमोरी बफर से सीधी फाइल डिलीवरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: मार्केट डेटा गेटवे

१. **शेयर्ड मेमोरी रिंग बफ़र्स (LMAX Disruptor):** उच्च-आवृत्ति ट्रेडिंग इंजन टीसीपी ओवरहेड से बचने के लिए साझा मेमोरी का उपयोग करते हैं।
२. **सीडीएन एज ऑफलोडिंग:** स्टेटिक स्नैपशॉट कैशिंग द्वारा बैकएंड डेटाबेस को लोड से मुक्त रखना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **फीड विफलता:** बैकअप लाइन बी पर ऑटो-स्विच।
२. **पुराने डेटा की पहचान:** टाइमस्टैम्प द्वारा लेटेंसी विसंगति का पता लगाना।
