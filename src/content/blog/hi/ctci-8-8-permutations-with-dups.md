---
title: "डुप्लिकेट के साथ क्रमपरिवर्तन (Permutations with Dups): दोहराए गए वर्णों के अद्वितीय क्रमपरिवर्तन (सीटीसीआई ८.८)"
description: "वर्ण आवृत्ति हैश टेबल और बैकट्रैकिंग का उपयोग करके बिना अनावश्यक शाखाओं के दोहराए गए वर्णों वाली स्ट्रिंग के अद्वितीय क्रमपरिवर्तनों की गणना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक स्ट्रिंग के सभी क्रमपरिवर्तनों की गणना करने के लिए एक विधि लिखें जिसके वर्ण आवश्यक रूप से अद्वितीय नहीं हैं। सूची में डुप्लिकेट नहीं होने चाहिए।
> * **मुख्य समाधान:** **आवृत्ति तालिका बैकट्रैकिंग (Frequency Map Backtracking)**: (१) वर्ण गणना तालिका `Map<Character, Integer>` बनाएं; (२) प्रत्येक पुनरावर्ती स्थिति में, गणना $> 0$ वाले प्रत्येक विशिष्ट वर्ण के लिए **केवल एक बार** शाखा बनाएं; (३) गणना घटाएं, पुनरावृत्ति में आगे बढ़ें और वापस आने पर गणना बहाल करें; (४) यह बिना डुप्लिकेट स्ट्रिंग उत्पन्न किए ठीक $\frac{N!}{n_1! \dots n_k!}$ अद्वितीय परिणाम देता है।
> * **रियल-वर्ल्ड सिस्टम:** जीनोमिक्स में डीएनए $k$-mer अनुक्रम संयोजन और डेटाबेस क्वेरी अनुकूलन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.८) में पूछा गया है:

*"दोहराए गए वर्णों वाली स्ट्रिंग के सभी अद्वितीय क्रमपरिवर्तन उत्पन्न करें बिना किसी मध्यवर्ती डुप्लिकेट शाखा के।"*

## २. आवृत्ति तालिका द्वारा प्रूनिंग

सभी $N!$ परिणाम उत्पन्न करके `HashSet` से छानना घातीय समय बर्बाद करता है।

### इष्टतम विधि: आवृत्ति तालिका
`"aab"` $\to \{'a': 2, 'b': 1\}$ के लिए:
१. पहले वर्ण के रूप में `'a'` चुनें $\implies$ `["aab", "aba"]` उत्पन्न करता है।
२. पहले वर्ण के रूप में `'b'` चुनें $\implies$ `["baa"]` उत्पन्न करता है।
कुल $= 3$ अद्वितीय परिणाम सीधे प्राप्त होते हैं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {
    /**
     * डुप्लिकेट वर्णों वाली स्ट्रिंग के अद्वितीय क्रमपरिवर्तनों की गणना करता है।
     * समय जटिलता: O(N * (N! / (n1! * n2! * ... * nk!)))
     * स्पेस जटिलता: O(N)
     */
    public static List<String> printPerms(String s) {
        List<String> result = new ArrayList<>();
        Map<Character, Integer> map = buildFreqTable(s);
        printPermsHelper(map, "", s.length(), result);
        return result;
    }

    private static Map<Character, Integer> buildFreqTable(String s) {
        Map<Character, Integer> map = new HashMap<>();
        for (char c : s.toCharArray()) {
            map.put(c, map.getOrDefault(c, 0) + 1);
        }
        return map;
    }

    private static void printPermsHelper(Map<Character, Integer> map, String prefix,
                                         int remaining, List<String> result) {
        if (remaining == 0) {
            result.add(prefix);
            return;
        }

        for (Character c : map.keySet()) {
            int count = map.get(c);
            if (count > 0) {
                map.put(c, count - 1);
                printPermsHelper(map, prefix + c, remaining - 1, result);
                map.put(c, count); // बैकट्रैक
            }
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | $O\left(\frac{N!}{n_1! \dots n_k!} \cdot N\right)$ | अद्वितीय क्रमपरिवर्तनों की बहुपदीय गुणांक संख्या। |
| सहायक मेमोरी | `O(N)` | स्ट्रिंग लंबाई $N$ द्वारा सीमित कॉल स्टैक। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: मल्टीसेट क्रमपरिवर्तन

१. **जीनोमिक डीएनए अनुक्रमण:** डी ब्रुइन (de Bruijn) ग्राफ़ पर दोहराए गए न्यूक्लियोटाइड टुकड़ों का संयोजन।
२. **एसक्यूएल प्रेडिकेट रीऑर्डरिंग:** डेटाबेस में अनावश्यक जॉइन ट्री मूल्यांकन से बचना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **सभी समान वर्ण (`"aaaa"`):** ठीक १ स्ट्रिंग उत्पन्न करता है।
२. **सभी अद्वितीय वर्ण:** मानक $N!$ फैक्टोरियल गणना में बदल जाता है।
