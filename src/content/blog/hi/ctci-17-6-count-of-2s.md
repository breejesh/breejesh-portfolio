---
title: "२ की गिनती (Count of 2s): अंक-दर-अंक स्थानीय मान कॉम्बिनेटरिक्स (सीटीसीआई १७.६)"
description: "स्थानीय मान (Place-Value) गणित और कॉम्बिनेटोरियल अंक विश्लेषण का उपयोग करके ० से N तक के सभी पूर्णांकों में अंक २ की कुल आवृत्ति की O(log10 N) में गणना करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-6-count-of-2s.webp
previewImage: /assets/images/ctci-17-6-count-of-2s.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ० और $n$ (सम्मिलित) के बीच की सभी संख्याओं में आने वाले अंक २ की कुल संख्या की गणना करने के लिए एक विधि लिखें।
> * **मुख्य समाधान:** **स्थानीय मान (Place-Value) अंक अपघटन**:
>   1. १० की प्रत्येक घात ($d = १, १०, १००, \dots \le n$) के लिए तीन घटक अलग करें:
>      $$\text{higher} = \lfloor n / (10d) \rfloor,\quad \text{digit} = \lfloor n/d \rfloor \pmod{10},\quad \text{lower} = n \pmod d$$
>   2. **तीन स्थानीय स्थितियां**:
>      * $\text{digit} < 2 \implies \text{count} += \text{higher} \times d$
>      * $\text{digit} == 2 \implies \text{count} += (\text{higher} \times d) + \text{lower} + 1$
>      * $\text{digit} > 2 \implies \text{count} += (\text{higher} + 1) \times d$
>   3. यह **$O(\log_{10} n)$ समय** (३२-बिट पूर्णांकों के लिए अधिकतम १० पुनरावृत्तियाँ) और **$O(1)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** डेटाबेस प्राइमरी की फ्रैग्मेंटेशन विश्लेषण और बेनफोर्ड का नियम (Benford's Law)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.६) में पूछा गया है:

*"० से n तक की सभी संख्याओं में अंक २ कितनी बार आता है, इसे बिना किसी बड़े लूप के सब-माइक्रोसेकंड समय में ज्ञात करें।"*

## २. स्थानीय मान कॉम्बिनेटरिक्स

इकाई, दहाई और सैकड़ा स्थानों के २ की गिनती अलग-अलग गणितीय सूत्रों द्वारा की जाती है।

## प्रोडक्शन कार्यान्वयन

```java
public class CountOf2s {

    /**
     * O(log10 n) समय में [0..n] के बीच 2 की कुल आवृत्ति की गणना।
     */
    public static int count2sInRange(int n) {
        if (n < 2) return 0;

        int count = 0;
        int len = String.valueOf(n).length();

        for (int digit = 0; digit < len; digit++) {
            count += count2sAtDigit(n, digit);
        }

        return count;
    }

    private static int count2sAtDigit(int number, int d) {
        int powerOf10 = (int) Math.pow(10, d);
        int nextPowerOf10 = powerOf10 * 10;
        int right = number % powerOf10;

        int roundDown = number - (number % nextPowerOf10);
        int roundUp = roundDown + nextPowerOf10;

        int digit = (number / powerOf10) % 10;

        if (digit < 2) {
            return roundDown / 10;
        } else if (digit == 2) {
            return roundDown / 10 + right + 1;
        } else {
            return roundUp / 10;
        }
    }
}
```

## जटिलता विश्लेषण

| दृष्टिकोण | समय जटिलता | $N = 10^9$ के लिए चक्र | सहायक स्पेस |
|---|---|---|---|
| **स्थानीय मान गणित** | **$O(\log_{10} N)$** | **१० चक्र** | **$O(1)$** |
| **ब्रूट-फोर्स लूप** | $O(N \log_{10} N)$ | $९ \times १०^९$ ऑपरेशन्स | $O(1)$ |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: डेटाबेस कीज़ और वित्तीय ऑडिट

१. **कॉकक्रोचडीबी / स्पैनर:** बी-ट्री डेटाबेस में डिस्क का पूर्ण स्कैन किए बिना कीज़ के संख्यात्मक घनत्व का अनुमान लगाना।
२. **बेनफोर्ड का नियम (Benford's Law):** वित्तीय धोखाधड़ी का पता लगाने के लिए अंकों की अपेक्षित आवृत्ति की तुलना करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **$N < 2$:** तुरंत ० लौटाना।
२. **सीमांत मान ($N = 222$):** निचले अंकों के आंशिक योगदान को सटीक रूप से जोड़ना।
