---
title: "सोशल नेटवर्क: बड़े पैमाने पर सबसे छोटा कनेक्शन पथ खोजें (CTCI 9.2)"
description: "सीटीसीआई समस्या ९.२: एक अरब-नोड वाले सोशल ग्राफ में दो उपयोगकर्ताओं के बीच कनेक्शन पथ की गणना करने वाला वितरित सिस्टम डिजाइन करें।"
date: "2026-04-26"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---


> **टीएल;डीआर**
> * **समस्या:** उत्पादन-स्तरीय दक्षता के साथ सीटीसीआई समस्या ९.२ में महारत हासिल करना।
> * **दृष्टिकोण:** सीटीसीआई समस्या ९.२: एक अरब-नोड वाले सोशल ग्राफ में दो उपयोगकर्ताओं के बीच कनेक्शन पथ की गणना करने वाला वितरित सिस्टम डिजाइन करें।
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **९.२** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं। हम समस्या के कथन की जांच करते हैं, इष्टतम समाधान की तुलना करते हैं और जावा (जावा) कोड लिखते हैं।

---

## १. वास्तविक जीवन की उपमा

सीटीसीआई समस्या ९.२ को वास्तविक जीवन में वस्तुओं को कुशलतापूर्वक व्यवस्थित करने की तरह सोचें। सही डेटा संरचना का चयन अनावश्यक पुनरावृत्तियों को समाप्त करता है।

---

## २. स्पष्ट समस्या कथन

**समस्या ९.२:** सीटीसीआई समस्या ९.२: एक अरब-नोड वाले सोशल ग्राफ में दो उपयोगकर्ताओं के बीच कनेक्शन पथ की गणना करने वाला वितरित सिस्टम डिजाइन करें।

---

## ३. इष्टतम दृष्टिकोण और कार्यान्वयन

```java
public class BidirectionalBreadthFirstSearch {
    public List<Long> findShortestPath(Map<Long, List<Long>> graph, long source, long target) {
        Queue<Long> qSource = new LinkedList<>(), qTarget = new LinkedList<>();
        Map<Long, Long> parentsSource = new HashMap<>(), parentsTarget = new HashMap<>();

        qSource.add(source); parentsSource.put(source, null);
        qTarget.add(target); parentsTarget.put(target, null);

        while (!qSource.isEmpty() && !qTarget.isEmpty()) {
            Long intersect = searchLevel(graph, qSource, parentsSource, parentsTarget);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
            intersect = searchLevel(graph, qTarget, parentsTarget, parentsSource);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
        }
        return Collections.emptyList();
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