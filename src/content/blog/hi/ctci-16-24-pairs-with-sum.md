---
title: "योग के साथ जोड़े (Pairs with Sum): हैश मैप पूरक और टू-पॉइंटर स्कैन (सीटीसीआई १६.२४)"
description: "सरणी में निर्दिष्ट योग बनाने वाले पूर्णांक युग्मों को खोजने के लिए एकल-पास पूरक आवृत्ति हैश मैप और टू-पॉइंटर स्कैन का O(N) एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक सरणी के भीतर ऐसे सभी पूर्णांक जोड़े खोजने के लिए एक एल्गोरिदम डिज़ाइन करें जिनका योग एक निर्दिष्ट मान के बराबर हो।
> * **मुख्य समाधान:**
>   1. **एकल-पास फ़्रीक्वेंसी पूरक हैश मैप (समय के लिए सर्वोत्तम)**:
>      * प्रत्येक तत्व $x$ के लिए, आवश्यक पूरक $\text{complement} = \text{target} - x$ निकालें।
>      * यदि पूरक मैप में मौजूद है, तो जोड़ा बनाएं और उसकी आवृत्ति घटाएं।
>      * अन्यथा, $x$ को मैप में दर्ज करें।
>      * यह **$O(N)$ समय** और **$O(N)$ सहायक स्पेस** में चलता है।
>   2. **सॉर्टेड सरणी पर टू-पॉइंटर (मेमोरी के लिए सर्वोत्तम)**:
>      * सरणी को सॉर्ट करें और **$O(1)$ स्पेस** में दो पॉइंटर्स को पास लाएं।
> * **रियल-वर्ल्ड सिस्टम:** वित्तीय एक्सचेंजों में ऑर्डर मैचिंग इंजन (Matching Engines)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.२४) में पूछा गया है:

*"पूर्णांक सरणी में से ऐसे सभी तत्वों के जोड़े खोजें जिनका कुल योग लक्ष्य संख्या के बराबर हो।"*

## २. पूरक मान सिद्धांत

प्रत्येक संख्या $x$ के लिए केवल एक अद्वितीय पूरक $y = \text{target} - x$ योग की शर्त पूरी करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class PairsWithSum {

    public static class Pair {
        public final int first, second;
        public Pair(int first, int second) {
            this.first = first;
            this.second = second;
        }
    }

    public static List<Pair> findPairsHash(int[] array, int targetSum) {
        if (array == null || array.length < 2) return Collections.emptyList();

        List<Pair> result = new ArrayList<>();
        Map<Integer, Integer> unpaired = new HashMap<>();

        for (int x : array) {
            int comp = targetSum - x;
            int count = unpaired.getOrDefault(comp, 0);

            if (count > 0) {
                result.add(new Pair(x, comp));
                if (count == 1) {
                    unpaired.remove(comp);
                } else {
                    unpaired.put(comp, count - 1);
                }
            } else {
                unpaired.put(x, unpaired.getOrDefault(x, 0) + 1);
            }
        }

        return result;
    }

    public static List<Pair> findPairsSorted(int[] array, int targetSum) {
        if (array == null || array.length < 2) return Collections.emptyList();

        Arrays.sort(array);
        List<Pair> result = new ArrayList<>();
        int left = 0, right = array.length - 1;

        while (left < right) {
            int sum = array[left] + array[right];
            if (sum == targetSum) {
                result.add(new Pair(array[left], array[right]));
                left++;
                right--;
            } else if (sum < targetSum) {
                left++;
            } else {
                right--;
            }
        }

        return result;
    }
}
```

## जटिलता विश्लेषण

| रणनीति | समय जटिलता | सहायक स्पेस |
|---|---|---|
| **पूरक हैश मैप** | **$O(N)$** | **$O(N)$** |
| **सॉर्टेड टू-पॉइंटर** | $O(N \log N)$ | $O(1)$ |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: वित्तीय एक्सचेंज मैचिंग इंजन

१. **ऑर्डर बुक मैचिंग:** इलेक्ट्रॉनिक एक्सचेंज (Nasdaq) खरीद और बिक्री के ऑर्डरों का त्वरित मिलान करने के लिए इन-मेमोरी हैश तालिकाओं का उपयोग करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **डुप्लीकेट तत्व ($x = \text{complement}$):** आवृत्ति काउंटर द्वारा सही ढंग से प्रबंधित ताकि एक ही तत्व खुद के साथ जोड़ा न बना ले।
