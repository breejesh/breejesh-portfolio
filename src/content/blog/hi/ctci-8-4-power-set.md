---
title: "पावर सेट (Power Set): किसी समुच्चय के सभी उपसमुच्चयों का निर्माण (सीटीसीआई ८.४)"
description: "संयोजन पुनरावृत्ति (Combinatorial Recursion) और बाइनरी बिटमास्क पुनरावृत्ति द्वारा O(N * 2^N) समय और स्पेस में समुच्चय के सभी 2^N उपसमुच्चयों का निर्माण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** किसी समुच्चय (Set) के सभी उपसमुच्चयों (Subsets) को वापस करने के लिए एक विधि लिखें।
> * **मुख्य समाधान:** **कॉम्बिनेटोरियल डबलिंग / बाइनरी बिटमास्क**: (१) **पुनरावर्ती विधि**: पिछले उपसमुच्चयों को क्लोन करें और नया तत्व जोड़कर सूची को दोगुना करें; (२) **बिटमास्क विधि**: ० से $2^N - 1$ तक लूप चलाएं, जहाँ $k$ का $i$-वां बिट तत्व $i$ की उपस्थिति तय करता है। दोनों दृष्टिकोण इष्टतम **$O(N \cdot 2^N)$ समय** और **$O(N \cdot 2^N)$ स्पेस** में चलते हैं।
> * **रियल-वर्ल्ड सिस्टम:** मशीन लर्निंग फीचर चयन और एसक्यूएल क्वेरी ऑप्टिमाइज़र जॉइन ट्री।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.४) में पूछा गया है:

*"दिए गए समुच्चय के सभी संभावित उपसमुच्चयों (पावर सेट) को उत्पन्न करने के लिए एक कुशल विधि लिखें।"*

## २. एल्गोरिदम के दृष्टिकोण

१. **पुनरावर्ती संयोजन विधि:** $P(n-1)$ प्राप्त करें, प्रत्येक उपसमुच्चय को कॉपी करके उसमें तत्व $n$ जोड़ें, और दोनों को मिला दें।
२. **बाइनरी बिटमास्क विधि:** $n$ आकार के सेट में $2^n$ उपसमुच्चय होते हैं। प्रत्येक पूर्णांक $k \in [0, 2^n - 1]$ एक अद्वितीय उपसमुच्चय का प्रतिनिधित्व करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSet {
    /**
     * बाइनरी बिटमास्क विधि।
     * समय जटिलता: O(N * 2^N)
     * स्पेस जटिलता: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsBitmask(List<Integer> set) {
        List<List<Integer>> allSubsets = new ArrayList<>();
        int max = 1 << set.size(); // 2^N उपसमुच्चय

        for (int k = 0; k < max; k++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < set.size(); i++) {
                if (((k >> i) & 1) == 1) {
                    subset.add(set.get(i));
                }
            }
            allSubsets.add(subset);
        }

        return allSubsets;
    }

    /**
     * पुनरावर्ती विधि (Combinatorial Doubling)।
     * समय जटिलता: O(N * 2^N)
     * स्पेस जटिलता: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsRecursive(List<Integer> set, int index) {
        List<List<Integer>> allSubsets;
        if (set.size() == index) {
            allSubsets = new ArrayList<>();
            allSubsets.add(new ArrayList<>());
        } else {
            allSubsets = getSubsetsRecursive(set, index + 1);
            int item = set.get(index);
            List<List<Integer>> moreSubsets = new ArrayList<>();
            for (List<Integer> subset : allSubsets) {
                List<Integer> newSubset = new ArrayList<>(subset);
                newSubset.add(item);
                moreSubsets.add(newSubset);
            }
            allSubsets.addAll(moreSubsets);
        }
        return allSubsets;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N * 2^N)` | $2^N$ उपसमुच्चय उत्पन्न करता है, प्रत्येक में औसतन $N / 2$ कॉपियां। |
| सहायक मेमोरी | `O(N * 2^N)` | हीप में पूर्ण पावर सेट संग्रह को संग्रहीत करने के लिए मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: संयोजन खोज

१. **एसक्यूएल क्वेरी ऑप्टिमाइज़र:** रिलेशनल डेटाबेस जॉइन ऑर्डर का इष्टतम मूल्यांकन।
२. **मशीन लर्निंग फीचर चयन:** इनपुट विशेषताओं के सबसे प्रभावी उपसमुच्चय की खोज।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **रिक्त समुच्चय ($\emptyset$):** `[[]]` लौटाता है।
२. **$N \ge 30$:** मेमोरी सुरक्षा जांच।
