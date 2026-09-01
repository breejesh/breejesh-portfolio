---
title: "मल्टी सर्च (Multi Search): अहो-कोरासिक समवर्ती मल्टी-पैटर्न स्ट्रिंग मिलान (सीटीसीआई १७.१७)"
description: "अहो-कोरासिक (Aho-Corasick) NFA-आधारित पैटर्न मिलान द्वारा एक बड़े दस्तावेज़ में एक साथ कई छोटी स्ट्रिंग्स की सभी घटनाओं को O(B + sum(L) + M) समय में खोजना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-17-multi-search.webp
previewImage: /assets/images/ctci-17-17-multi-search.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक बड़ी स्ट्रिंग $B$ और छोटी स्ट्रिंग्स के सरणी $S$ को देखते हुए, $B$ में प्रत्येक छोटी स्ट्रिंग के सभी स्थान खोजें।
> * **मुख्य समाधान:** **अहो-कोरासिक मल्टी-पैटर्न मिलान ऑटोमेटन**:
>   1. **चरण १ (ट्राई निर्माण)**: सभी छोटी स्ट्रिंग्स का ट्राई बनाएं। प्रत्येक पत्ती पर मेल खाई गई स्ट्रिंग चिह्नित करें।
>   2. **चरण २ (फेल लिंक BFS)**: प्रत्येक ट्राई नोड के लिए, सबसे लंबे उचित प्रत्यय को `fail` पॉइंटर से जोड़ें जो एक वैध ट्राई उपसर्ग भी हो।
>   3. **चरण ३ (रैखिक स्कैन)**: $B$ को वर्ण-दर-वर्ण स्कैन करें, ट्राई संक्रमणों का अनुसरण करें या `fail` पॉइंटर्स पर वापस जाएं। प्रत्येक स्वीकृत नोड पर, सभी मेल खाए पैटर्न उत्सर्जित करें।
>   4. यह **$O(B + \sum L + M)$ कुल समय** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** Snort/Suricata नेटवर्क घुसपैठ पहचान और Google Cloud DLP सामग्री निरीक्षण।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.१७) में पूछा गया है:

*"एक बड़े टेक्स्ट में कई छोटे पैटर्न की सभी घटनाओं को $O(B \cdot \sum L)$ के बजाय $O(B + \sum L + M)$ में खोजें।"*

## २. अहो-कोरासिक फेल लिंक ऑटोमेटन

फेल लिंक्स KMP एल्गोरिदम का सामान्यीकरण हैं जो सभी पैटर्नों पर एक साथ कार्य करते हैं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class MultiSearch {

    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        TrieNode fail = null;
        List<String> output = new ArrayList<>();
    }

    public static Map<String, List<Integer>> searchAll(String big, String[] smalls) {
        Map<String, List<Integer>> result = new HashMap<>();
        for (String s : smalls) result.put(s, new ArrayList<>());
        if (big == null || big.isEmpty() || smalls == null || smalls.length == 0) return result;

        TrieNode root = new TrieNode();
        for (String s : smalls) {
            if (s == null || s.isEmpty()) continue;
            TrieNode curr = root;
            for (char c : s.toCharArray()) {
                curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
            }
            curr.output.add(s);
        }

        Queue<TrieNode> queue = new LinkedList<>();
        for (TrieNode child : root.children.values()) {
            child.fail = root;
            queue.add(child);
        }
        while (!queue.isEmpty()) {
            TrieNode curr = queue.poll();
            for (Map.Entry<Character, TrieNode> e : curr.children.entrySet()) {
                char c = e.getKey();
                TrieNode child = e.getValue();
                TrieNode fail = curr.fail;
                while (fail != null && !fail.children.containsKey(c)) fail = fail.fail;
                child.fail = (fail == null) ? root : fail.children.getOrDefault(c, root);
                if (child.fail == child) child.fail = root;
                child.output.addAll(child.fail.output);
                queue.add(child);
            }
        }

        TrieNode curr = root;
        for (int i = 0; i < big.length(); i++) {
            char c = big.charAt(i);
            while (curr != root && !curr.children.containsKey(c)) curr = curr.fail;
            curr = curr.children.getOrDefault(c, root);
            for (String matched : curr.output) {
                result.get(matched).add(i - matched.length() + 1);
            }
        }

        return result;
    }
}
```

## जटिलता विश्लेषण

| चरण | समय जटिलता | तकनीकी विवरण |
|---|---|---|
| ट्राई निर्माण | $O(\sum L)$ | प्रत्येक पैटर्न वर्ण का एक ट्रैवर्सल। |
| फेल लिंक BFS | $O(\sum L \cdot |\Sigma|)$ | वर्णमाला आकार से सीमित। |
| टेक्स्ट स्कैन | $O(B + M)$ | दस्तावेज़ पर आमोर्टाइज़्ड रैखिक। |
| **कुल** | **$O(B + \sum L + M)$** | **मल्टी-पैटर्न खोज के लिए इष्टतम।** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: नेटवर्क सुरक्षा और DLP

१. **Snort/Suricata NIDS:** नेटवर्क पैकेट पेलोड को हजारों मैलवेयर हस्ताक्षर पैटर्न के साथ एक साथ स्कैन करना।
२. **Google Cloud DLP:** बड़े दस्तावेज़ों में PII पैटर्न की समानांतर पहचान।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली स्ट्रिंग्स:** खाली घटनाएं सूचियां लौटाना।
२. **अतिव्यापी पैटर्न:** आउटपुट लिंक्स सभी नेस्टेड मिलानों को सही ढंग से उत्सर्जित करते हैं।
