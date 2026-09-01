---
title: "वेब क्रॉलर (Web Crawler): वितरित क्रॉलर्स में अनंत लूप की रोकथाम (सीटीसीआई ९.३)"
description: "यूआरएल नॉर्मलाइज़ेशन, ब्लूम फ़िल्टर और सिम-हैश (SimHash) का उपयोग करके वितरित वेब क्रॉलर में अनंत लूप और स्पाइडर ट्रैप्स को रोकने का सिस्टम डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-3-web-crawler.webp
previewImage: /assets/images/ctci-9-3-web-crawler.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** यदि आप एक वेब क्रॉलर डिज़ाइन कर रहे थे, तो आप अनंत लूप (Infinite Loops) में पड़ने से कैसे बचेंगे?
> * **मुख्य समाधान:** **मल्टी-टियर लूप और ट्रैप डिफेंस पाइपलाइन**: (१) **यूआरएल नॉर्मलाइज़ेशन**: ट्रैकिंग पैरामीटर (`utm_*`, `sid`) हटाना, क्वेरी पैरामीटर सॉर्ट करना और रिलेटिव पाथ हल करना; (२) **विज़िटेड यूआरएल रजिस्ट्री**: मेमोरी में वितरित ब्लूम फ़िल्टर (Bloom Filter); (३) **कंटेंट फिंगरप्रिंटिंग (SimHash)**: अलग-अलग यूआरएल पर समान सामग्री परोसने वाले स्पाइडर ट्रैप्स की पहचान; (४) **डोमेन क्रॉल बजट और गहराई सीमा**: अधिकतम पाथ गहराई ($d \le 15$) और प्रति डोमेन दर सीमा।
> * **रियल-वर्ल्ड सिस्टम:** गूगलबॉट (Googlebot) आर्किटेक्चर और अपाचे नच (Apache Nutch)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ९.३) में पूछा गया है:

*"वितरित वेब क्रॉलर में अनंत लूप, चक्रीय पथों और स्पाइडर ट्रैप्स से बचने के लिए रक्षा तंत्र डिज़ाइन करें।"*

## २. स्पाइडर ट्रैप्स और रक्षा तंत्र

### अनंत लूप के कारण
१. **ग्राफ चक्र:** $A \to B \to A$।
२. **अनंत पाथ ट्री:** गतिशील कैलेंडर (`/events?year=2026...`) या नेस्टेड सिम्लिंक डायरेक्टरी (`/a/b/a/b/...`)।
३. **सत्र आईडी उत्परिवर्तन:** समान पेज अलग-अलग सत्र आईडी वाले यूआरएल पर उपलब्ध होना।

### सुरक्षात्मक पाइपलाइन
१. **यूआरएल नॉर्मलाइज़र:** यूआरएल को मानक रूप में बदलना।
२. **ब्लूम फ़िल्टर:** विज़िट किए गए यूआरएल की त्वरित इन-मेमोरी पहचान।
३. **सिम-हैश (SimHash):** पेज सामग्री का ६४-बिट हैश बनाकर लगभग समान पेजों को छोड़ना।
४. **गहराई नियंत्रण:** प्रति डोमेन अधिकतम गहराई तय करना।

## प्रोडक्शन कार्यान्वयन

```java
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.Set;

public class WebCrawlerLoopGuard {
    private final Set<String> visitedCanonicalUrls = new HashSet<>();
    private final Set<Long> contentSimHashes = new HashSet<>();
    private final int MAX_PATH_DEPTH = 10;

    public String normalizeUrl(String rawUrl) {
        try {
            URI uri = new URI(rawUrl.trim()).normalize();
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();
            
            if (path.endsWith("/") && path.length() > 1) {
                path = path.substring(0, path.length() - 1);
            }

            return uri.getScheme() + "://" + host + path;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    public boolean shouldCrawl(String url, int currentDepth) {
        if (currentDepth > MAX_PATH_DEPTH) return false;

        String canonical = normalizeUrl(url);
        if (canonical == null || visitedCanonicalUrls.contains(canonical)) {
            return false;
        }

        if (hasRepeatingPathSegments(canonical)) {
            return false;
        }

        visitedCanonicalUrls.add(canonical);
        return true;
    }

    private boolean hasRepeatingPathSegments(String url) {
        String[] segments = url.split("/");
        Set<String> seenSegments = new HashSet<>();
        int repeatCount = 0;
        for (String segment : segments) {
            if (!segment.isEmpty() && !seenSegments.add(segment)) {
                repeatCount++;
                if (repeatCount >= 3) return true;
            }
        }
        return false;
    }

    public boolean isDuplicateContent(long simHash64) {
        return !contentSimHashes.add(simHash64);
    }
}
```

## जटिलता और आर्किटेक्चर विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| यूआरएल डुप्लीकेशन जांच | `O(1)` | ब्लूम फ़िल्टर द्वारा मेमोरी में त्वरित जांच। |
| सामग्री डुप्लीकेशन | `O(1)` | सिम-हैश तालिका में टकराव की जांच। |
| पाथ सत्यापन | `O(L)` | $L$ लंबाई की यूआरएल स्ट्रिंग का विभाजन और निरीक्षण। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: गूगलबॉट क्रॉल बजट

१. **होस्ट-स्तरीय प्राथमिकता कतारें:** सर्वर पर लोड कम करने के लिए प्रति डोमेन न्यूनतम विलंब (उदा. ५०० मिलीसेकंड)।
२. **स्वचालित ट्रैप अलगाव:** बिना उपयोगी सामग्री के हजारों यूआरएल उत्पन्न करने वाले सब-डोमेन को क्वारंटाइन करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **चक्रीय रीडायरेक्ट (HTTP 301/302):** रीडायरेक्ट हॉप्स अधिकतम ५ तक सीमित।
२. **अमान्य यूआरएल सिंटैक्स:** एक्सेप्शन हैंडलिंग द्वारा सुरक्षित।
