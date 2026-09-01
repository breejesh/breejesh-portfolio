---
title: "सबसे छोटे K तत्व (Smallest K): क्विक-सेलेक्ट बनाम बाउंडेड मैक्स-हीप (सीटीसीआई १७.१४)"
description: "होरे (Hoare) के क्विक-सेलेक्ट एल्गोरिदम द्वारा O(N) औसत समय में और बाउंडेड मैक्स-हीप द्वारा O(N log K) में सरणी के सबसे छोटे K तत्वों को खोजना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-14-smallest-k.webp
previewImage: /assets/images/ctci-17-14-smallest-k.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक अव्यवस्थित सरणी में से सबसे छोटे $k$ नंबर खोजने के लिए एक एल्गोरिदम डिज़ाइन करें।
> * **मुख्य समाधान:**
>   1. **क्विक-सेलेक्ट (Hoare's Quickselect Algorithm)**:
>      * पिवट के आधार पर सरणी का विभाजन करें।
>      * यदि `pivotIndex == k`, तो सबसे छोटे $k$ तत्व `array[0..k-1]` में आ चुके हैं।
>      * यदि $k < \text{pivotIndex}$, केवल बाईं ओर रिकर्स करें; अन्यथा दाईं ओर।
>      * यह **अपेक्षित $O(N)$ समय** और **$O(1)$ सहायक स्पेस** में चलता है।
>   2. **बाउंडेड मैक्स-हीप (Max-Heap)**:
>      * $k$ आकार का मैक्स-हीप बनाए रखें। नए तत्वों की तुलना हीप के रूट से करके बड़े तत्वों को बाहर निकालें।
>      * यह **$O(N \log K)$ समय** और **$O(K)$ स्पेस** में चलता है (स्ट्रीमिंग डेटा के लिए आदर्श)।
> * **रियल-वर्ल्ड सिस्टम:** PostgreSQL और Apache Spark में `SELECT ... ORDER BY col LIMIT K` क्वेरी अनुकूलन (Top-N Sort)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.१४) में पूछा गया है:

*"पूरी सरणी को सॉर्ट किए बिना $N$ तत्वों में से सबसे छोटे $K$ तत्वों को रैखिक औसत समय में निकालें।"*

## २. पिवट विभाजन द्वारा ज्यामितीय कमी

क्विक-सेलेक्ट प्रत्येक चरण में आधी सरणी को छोड़ देता है, जिससे कुल कार्य ज्यामितीय रूप से $O(N)$ पर समाप्त होता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class SmallestK {

    /**
     * क्विक-सेलेक्ट एल्गोरिदम (अपेक्षित O(N) समय, O(1) स्पेस)।
     */
    public static int[] smallestKQuickselect(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        quickselect(array, 0, array.length - 1, k);

        int[] result = new int[k];
        System.arraycopy(array, 0, result, 0, k);
        return result;
    }

    private static void quickselect(int[] arr, int left, int right, int k) {
        if (left >= right) return;

        int pivotIndex = partition(arr, left, right);

        if (pivotIndex == k) {
            return;
        } else if (k < pivotIndex) {
            quickselect(arr, left, pivotIndex - 1, k);
        } else {
            quickselect(arr, pivotIndex + 1, right, k);
        }
    }

    private static int partition(int[] arr, int left, int right) {
        int pivot = arr[right];
        int i = left;

        for (int j = left; j < right; j++) {
            if (arr[j] <= pivot) {
                swap(arr, i, j);
                i++;
            }
        }
        swap(arr, i, right);
        return i;
    }

    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    /**
     * बाउंडेड मैक्स-हीप समाधान (O(N log K) समय, O(K) स्पेस)।
     */
    public static int[] smallestKHeap(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(k, Collections.reverseOrder());

        for (int x : array) {
            if (maxHeap.size() < k) {
                maxHeap.add(x);
            } else if (x < maxHeap.peek()) {
                maxHeap.poll();
                maxHeap.add(x);
            }
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = maxHeap.poll();
        }
        return result;
    }
}
```

## जटिलता विश्लेषण

| रणनीति | समय जटिलता | सहायक स्पेस | इन-प्लेस म्यूटेशन | स्ट्रीमिंग समर्थन |
|---|---|---|---|---|
| **क्विक-सेलेक्ट** | **अपेक्षित $O(N)$** | **$O(1)$** | **हाँ** | नहीं |
| **बाउंडेड मैक्स-हीप** | **$O(N \log K)$** | **$O(K)$** | **नहीं** | **हाँ** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: डेटाबेस में Top-N क्वेरी ऑप्टिमाइज़ेशन

१. **PostgreSQL Top-N हीप सॉर्ट:** डेटाबेस पूरी टेबल को सॉर्ट किए बिना रैम में केवल K तत्वों का हीप बनाए रखकर क्वेरी को निष्पादित करते हैं।
२. **इलास्टिकसर्च TopDocs:** वितरित नोड्स से शीर्ष १० प्रासंगिक परिणाम एकत्र करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **$k \ge n$:** पूरी सरणी की प्रतिलिपि लौटाना।
२. **$k \le 0$:** सुरक्षित रूप से खाली सरणी लौटाना।
