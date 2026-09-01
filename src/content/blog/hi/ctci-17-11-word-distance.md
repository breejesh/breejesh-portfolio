---
title: "शब्द दूरी (Word Distance): स्थितीय इनवर्टेड इंडेक्स और दो-पॉइंटर निकटता खोज (सीटीसीआई १७.११)"
description: "एकल स्कैन और स्थितीय इनवर्टेड इंडेक्स (Positional Inverted Index) का उपयोग करके दस्तावेज़ में किन्हीं दो शब्दों के बीच की न्यूनतम दूरी की O(A + B) में गणना करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-11-word-distance.webp
previewImage: /assets/images/ctci-17-11-word-distance.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक बड़े टेक्स्ट फ़ाइल में किन्हीं दो शब्दों के बीच सबसे छोटी दूरी (शब्दों की संख्या में) ज्ञात करें। यदि एक ही फ़ाइल के लिए अलग-अलग शब्दों के साथ यह प्रक्रिया बार-बार दोहराई जाएगी, तो समाधान को अनुकूलित करें।
> * **मुख्य समाधान:**
>   1. **एकल क्वेरी (रैखिक स्कैन)**:
>      * शब्दों के प्रवाह को स्कैन करते हुए `lastPos1` और `lastPos2` ट्रैक करें। न्यूनतम दूरी को $O(N)$ समय और $O(1)$ स्पेस में अपडेट करें।
>   2. **एकाधिक क्वेरी (स्थितीय इनवर्टेड इंडेक्स)**:
>      * प्रत्येक शब्द के लिए दस्तावेज़ में उसके सभी सूचकांकों का क्रमबद्ध मैप `Map<String, List<Integer>>` प्रीकंप्यूट करें।
>      * क्वेरी $(W_1, W_2)$ के लिए दो पॉइंटर्स को सूचियों पर चलाकर **$O(|L_1| + |L_2|)$ समय** में न्यूनतम अंतर ज्ञात करें।
> * **रियल-वर्ल्ड सिस्टम:** Apache Lucene और Elasticsearch में वाक्यांश और निकटता खोज (`SPAN_NEAR`)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.११) में पूछा गया है:

*"दस्तावेज़ में दो शब्दों के बीच निकटतम दूरी ज्ञात करें, जिसमें एकल क्वेरी और बार-बार पूछे जाने वाले उच्च-आवृत्ति खोज दोनों समर्थित हों।"*

## २. दो-पॉइंटर स्थितीय खोज

क्रमबद्ध स्थिति सूचियों पर दो पॉइंटर्स आगे बढ़ाकर बिना पूरे दस्तावेज़ को पुनः पढ़े त्वरित दूरी निकाली जाती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class WordDistance {

    /**
     * एकल क्वेरी स्कैन: O(N) समय, O(1) स्पेस।
     */
    public static int findClosestSingleQuery(String[] words, String word1, String word2) {
        if (words == null || word1 == null || word2 == null) return -1;

        int lastPos1 = -1, lastPos2 = -1;
        int minDistance = Integer.MAX_VALUE;

        for (int i = 0; i < words.length; i++) {
            if (words[i].equals(word1)) {
                lastPos1 = i;
                if (lastPos2 >= 0) minDistance = Math.min(minDistance, lastPos1 - lastPos2);
            } else if (words[i].equals(word2)) {
                lastPos2 = i;
                if (lastPos1 >= 0) minDistance = Math.min(minDistance, lastPos2 - lastPos1);
            }
        }

        return (minDistance == Integer.MAX_VALUE) ? -1 : minDistance;
    }

    /**
     * एकाधिक क्वेरी संरचना: स्थितीय इनवर्टेड इंडेक्स।
     */
    public static class WordDistanceMap {
        private final Map<String, List<Integer>> locations = new HashMap<>();

        public WordDistanceMap(String[] words) {
            for (int i = 0; i < words.length; i++) {
                locations.computeIfAbsent(words[i].toLowerCase(), k -> new ArrayList<>()).add(i);
            }
        }

        public int distance(String word1, String word2) {
            List<Integer> list1 = locations.get(word1.toLowerCase());
            List<Integer> list2 = locations.get(word2.toLowerCase());

            if (list1 == null || list2 == null || list1.isEmpty() || list2.isEmpty()) {
                return -1;
            }

            int p1 = 0, p2 = 0;
            int minDistance = Integer.MAX_VALUE;

            while (p1 < list1.size() && p2 < list2.size()) {
                int pos1 = list1.get(p1);
                int pos2 = list2.get(p2);

                minDistance = Math.min(minDistance, Math.abs(pos1 - pos2));
                if (minDistance == 1) return 1;

                if (pos1 < pos2) {
                    p1++;
                } else {
                    p2++;
                }
            }

            return minDistance;
        }
    }
}
```

## जटिलता विश्लेषण

| मोड | प्रीप्रोसेसिंग | क्वेरी समय | सहायक स्पेस |
|---|---|---|---|
| **एकल स्कैन** | $O(0)$ | **$O(N)$** | **$O(1)$** |
| **इनवर्टेड इंडेक्स** | $O(N)$ | **$O(|L_1| + |L_2|)$** | **$O(N)$** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: सर्च इंजन (Lucene / Elasticsearch)

१. **पोजिशनल पोस्टिंग लिस्ट्स (`.pos`):** सर्च इंजन वाक्यांश खोज को डिस्क से पूरे टेक्स्ट को पढ़े बिना सीधे इनवर्टेड इंडेक्स पोस्टिंग सूचियों को मर्ज करके हल करते हैं।
२. **बायोइन्फॉर्मेटिक्स:** डीएनए अनुक्रमों में ट्रांसक्रिप्शन कारकों के बीच निकटता की गणना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अनुपस्थित शब्द:** सुरक्षित रूप से `-१` लौटाना।
२. **आसन्न शब्द (दूरी १):** तुरंत `१` लौटाकर शेष लूप से बाहर निकलना।
