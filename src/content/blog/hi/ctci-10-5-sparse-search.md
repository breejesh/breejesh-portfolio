---
title: "स्पार्स सर्च: खाली स्ट्रिंग्स से भरे ऐरे में टारगेट स्ट्रिंग खोजें (CTCI 10.5)"
description: "सीटीसीआई समस्या १०.५: खाली स्ट्रिंग्स वाले सॉर्ट किए गए एरे में लक्षित स्ट्रिंग खोजने के लिए संशोधित बाइनरी सर्च।"
date: "2026-01-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---


> **टीएल;डीआर**
> * **समस्या:** उत्पादन-स्तरीय दक्षता के साथ सीटीसीआई समस्या १०.५ में महारत हासिल करना।
> * **दृष्टिकोण:** सीटीसीआई समस्या १०.५: खाली स्ट्रिंग्स वाले सॉर्ट किए गए एरे में लक्षित स्ट्रिंग खोजने के लिए संशोधित बाइनरी सर्च।
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१०.५** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं। हम समस्या के कथन की जांच करते हैं, इष्टतम समाधान की तुलना करते हैं और जावा (जावा) कोड लिखते हैं।

---

## १. वास्तविक जीवन की उपमा

सीटीसीआई समस्या १०.५ को वास्तविक जीवन में वस्तुओं को कुशलतापूर्वक व्यवस्थित करने की तरह सोचें। सही डेटा संरचना का चयन अनावश्यक पुनरावृत्तियों को समाप्त करता है।

---

## २. स्पष्ट समस्या कथन

**समस्या १०.५:** सीटीसीआई समस्या १०.५: खाली स्ट्रिंग्स वाले सॉर्ट किए गए एरे में लक्षित स्ट्रिंग खोजने के लिए संशोधित बाइनरी सर्च।

---

## ३. इष्टतम दृष्टिकोण और कार्यान्वयन

```java
public class SparseSearch {
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) return -1;
        return search(strings, str, 0, strings.length - 1);
    }

    private static int search(String[] strings, String str, int first, int last) {
        if (first > last) return -1;
        int mid = (first + last) / 2;

        if (strings[mid].isEmpty()) {
            int left = mid - 1, right = mid + 1;
            while (true) {
                if (left < first && right > last) return -1;
                if (right <= last && !strings[right].isEmpty()) { mid = right; break; }
                if (left >= first && !strings[left].isEmpty()) { mid = left; break; }
                right++; left--;
            }
        }

        if (strings[mid].equals(str)) return mid;
        else if (strings[mid].compareTo(str) < 0) return search(strings, str, mid + 1, last);
        else return search(strings, str, first, mid - 1);
    }
}
```

---

## ४. समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी)

| मीट्रिक | जटिलता | विवरण |
| --- | --- | --- |
| समय जटिलता | ओ(एन) / ओ(लॉग एन) | डेटा के माध्यम से इष्टतम पास |
| स्थान जटिलता | ओ(१) / ओ(एन) | मेमोरी सीमाएं बनी रहीं |

---

## ५. सीमांत मामले (एज केसेस) और सारांश

कोडिंग इंटरव्यू में हमेशा सीमांत स्थितियों, शून्य (null) इनपुट और एरे आकार की सीमाओं की जांच करें।