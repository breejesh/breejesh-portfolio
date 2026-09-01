---
title: "जादुई सूचकांक (Magic Index): क्रमबद्ध सारणी में फिक्स्ड पॉइंट बाइनरी सर्च (सीटीसीआई ८.३)"
description: "संशोधित बाइनरी सर्च का उपयोग करके भिन्न और डुप्लिकेट पूर्णांकों वाले क्रमबद्ध ऐरे में O(log N) औसत समय में A[i] = i खोजना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक ऐरे $A[0 \dots n - 1]$ में एक जादुई इंडेक्स (Magic Index) ऐसा इंडेक्स है जहां $A[i] = i$। विशिष्ट पूर्णांकों के क्रमबद्ध ऐरे में जादुई इंडेक्स खोजने के लिए एक विधि लिखें। फॉलो-अप: यदि मान अद्वितीय न हों (डुप्लिकेट हों)?
> * **मुख्य समाधान:** **बाइनरी सर्च फिक्स्ड पॉइंट**: (१) **अद्वितीय तत्व**: यदि $A[\text{mid}] > \text{mid}$, तो जादुई इंडेक्स केवल बाईं ओर हो सकता है ($O(\log N)$ समय); (२) **डुप्लिकेट तत्व**: बाईं ओर $[start, \min(\text{mid}-1, A[\text{mid}])]$ और दाईं ओर $[\max(\text{mid}+1, A[\text{mid}]), end]$ में खोज प्रूनिंग (औसत $O(\log N)$ और सबसे खराब स्थिति $O(N)$ समय)।
> * **रियल-वर्ल्ड सिस्टम:** कंपाइलर डेटा-फ्लो विश्लेषण में फिक्स्ड-पॉइंट पुनरावृत्ति।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.३) में पूछा गया है:

*"क्रमबद्ध ऐरे में वह इंडेक्स i खोजें जहां A[i] = i हो। अद्वितीय और डुप्लिकेट दोनों मामलों को हल करें।"*

## २. एल्गोरिदम विश्लेषण

१. **अद्वितीय पूर्णांक:** चूंकि तत्व सख्ती से बढ़ रहे हैं:
   * यदि $A[\text{mid}] > \text{mid}$, तो दाईं ओर सभी तत्वों के लिए $A[j] > j$ होगा, अतः दाईं ओर को छोड़ दें।
   * यदि $A[\text{mid}] < \text{mid}$, तो बाईं ओर को छोड़ दें।
२. **डुप्लिकेट पूर्णांक:** सीमाओं $\min(\text{mid}-1, A[\text{mid}])$ और $\max(\text{mid}+1, A[\text{mid}])$ द्वारा अनावश्यक अनुक्रमों को प्रून करें।

## प्रोडक्शन कार्यान्वयन

```java
public class MagicIndex {
    /**
     * अद्वितीय (DISTINCT) पूर्णांक।
     * समय जटिलता: O(log N)
     * स्पेस जटिलता: O(log N)
     */
    public static int magicDistinct(int[] array) {
        return magicDistinct(array, 0, array.length - 1);
    }

    private static int magicDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int mid = start + (end - start) / 2;
        if (array[mid] == mid) {
            return mid;
        } else if (array[mid] > mid) {
            return magicDistinct(array, start, mid - 1);
        } else {
            return magicDistinct(array, mid + 1, end);
        }
    }

    /**
     * डुप्लिकेट (DUPLICATE) पूर्णांक।
     * समय जटिलता: O(log N) औसत, O(N) सबसे खराब स्थिति।
     * स्पेस जटिलता: O(log N)
     */
    public static int magicNonDistinct(int[] array) {
        return magicNonDistinct(array, 0, array.length - 1);
    }

    private static int magicNonDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int midIndex = start + (end - start) / 2;
        int midValue = array[midIndex];

        if (midValue == midIndex) {
            return midIndex;
        }

        int leftIndex = Math.min(midIndex - 1, midValue);
        int left = magicNonDistinct(array, start, leftIndex);
        if (left >= 0) return left;

        int rightIndex = Math.max(midIndex + 1, midValue);
        return magicNonDistinct(array, rightIndex, end);
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मोड | समय जटिलता | सहायक मेमोरी | तकनीकी विवरण |
|---|---|---|---|
| अद्वितीय पूर्णांक | `O(\log N)` | `O(\log N)` | मानक बाइनरी सर्च। |
| डुप्लिकेट पूर्णांक | `O(\log N)` औसत / `O(N)` | `O(\log N)` | प्रून्ड द्वि-शाखा खोज। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: कंपाइलर फिक्स्ड पॉइंट

१. **डेटा-फ्लो विश्लेषण:** कंपाइलर सक्रिय चरों और अभिव्यक्तियों का पता लगाने के लिए फिक्स्ड-पॉइंट समीकरणों ($f(x) = x$) का उपयोग करते हैं।
२. **डेटाबेस इंडेक्स पार्टिशनिंग:** बाइनरी सर्च रेंज इंटरसेक्शन द्वारा प्राकृतिक विभाजन बिंदुओं का पता लगाना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई जादुई इंडेक्स नहीं:** सुरक्षित रूप से `-1` लौटाना।
२. **खाली ऐरे:** शून्य-जांच द्वारा सुरक्षित हैंडलिंग।
