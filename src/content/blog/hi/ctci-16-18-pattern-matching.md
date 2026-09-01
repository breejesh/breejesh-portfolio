---
title: "पैटर्न मिलान (Pattern Matching): डायोफैंटाइन स्ट्रिंग अपघटन (सीटीसीआई १६.१८)"
description: "रैखिक डायोफैंटाइन लंबाई समीकरण और उम्मीदवार स्ट्रिंग सत्यापन का उपयोग करके दो-चर पैटर्न ('a' और 'b') के साथ स्ट्रिंग मिलान का O(N^2) एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-18-pattern-matching.webp
previewImage: /assets/images/ctci-16-18-pattern-matching.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपको दो स्ट्रिंग दी गई हैं, `pattern` (केवल `'a'` और `'b'` से मिलकर बनी) और `value`। निर्धारित करें कि क्या `value` उस `pattern` से मेल खाती है (उदा. `catcatgocatgo` पैटर्न `aabab` से मेल खाती है जहाँ `a = "cat"` और `b = "go"` है)।
> * **मुख्य समाधान:** **रैखिक डायोफैंटाइन लंबाई समीकरण (Linear Diophantine Equation)**:
>   1. **कैनोनिकल सामान्यीकरण**: यदि पैटर्न `'b'` से शुरू होता है, तो वर्णों को बदलें ताकि यह हमेशा `'a'` से शुरू हो।
>   2. **आवृत्ति गणना**: पैटर्न में `'a'` ($c_a$) और `'b'` ($c_b$) की कुल आवृत्ति गिनें।
>   3. **लंबाई बाधा**: कुल लंबाई $L = |\text{value}|$ के लिए:
>      $$c_a \cdot L_a + c_b \cdot L_b = L \implies L_b = \frac{L - c_a \cdot L_a}{c_b}$$
>   4. **$L_a$ की पुनरावृत्ति**: $L_a \in [०, \lfloor L / c_a \rfloor]$ पर लूप चलाएं और उम्मीदवार सबस्ट्रिंग $s_a$ और $s_b$ की जांच करें।
>   5. यह **$O(L^2)$ समय** और **$O(L)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** रेगुलर एक्सप्रेशन इंजन (PCRE) और कंपाइलर मैक्रो एक्सपेंशन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.१८) में पूछा गया है:

*"निर्धारित करें कि क्या कोई स्ट्रिंग दो चरों 'a' और 'b' द्वारा परिभाषित पैटर्न के अनुसार पूरी तरह से विभाजित की जा सकती है।"*

## २. डायोफैंटाइन लंबाई समीकरण

लंबाई की बाधा खोज स्पेस को $O(२^L)$ से घटाकर केवल $O(L^२)$ कर देती है।

## प्रोडक्शन कार्यान्वयन

```java
public class PatternMatching {

    public static boolean matches(String pattern, String value) {
        if (pattern == null || value == null) return false;
        if (pattern.isEmpty()) return value.isEmpty();

        char mainChar = pattern.charAt(0);
        char altChar = (mainChar == 'a') ? 'b' : 'a';
        int size = value.length();

        int countOfMain = 0;
        int countOfAlt = 0;
        for (char c : pattern.toCharArray()) {
            if (c == mainChar) countOfMain++;
            else countOfAlt++;
        }

        if (countOfAlt == 0) {
            if (size % countOfMain != 0) return false;
            int len = size / countOfMain;
            String cand = value.substring(0, len);
            return verifyPattern(pattern, value, cand, "", mainChar);
        }

        int firstAlt = pattern.indexOf(altChar);
        int maxMainSize = size / countOfMain;

        for (int mainSize = 0; mainSize <= maxMainSize; mainSize++) {
            int remainingLength = size - (mainSize * countOfMain);
            if (remainingLength % countOfAlt == 0) {
                int altSize = remainingLength / countOfAlt;
                int altIndex = firstAlt * mainSize;

                String mainSub = value.substring(0, mainSize);
                String altSub = value.substring(altIndex, altIndex + altSize);

                if (!mainSub.equals(altSub)) {
                    if (verifyPattern(pattern, value, mainSub, altSub, mainChar)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static boolean verifyPattern(String pattern, String value, String mainSub, String altSub, char mainChar) {
        int stringIndex = 0;
        for (char c : pattern.toCharArray()) {
            String target = (c == mainChar) ? mainSub : altSub;
            if (target.isEmpty()) continue;

            if (stringIndex + target.length() > value.length() ||
                !value.startsWith(target, stringIndex)) {
                return false;
            }
            stringIndex += target.length();
        }
        return stringIndex == value.length();
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(L^2)` | $L / c_a$ उम्मीदवार लूप और रैखिक स्ट्रिंग सत्यापन। |
| सहायक स्पेस | `O(L)` | सबस्ट्रिंग निर्माण के लिए मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: रेगुलर एक्सप्रेशन इंजन

१. **रेगेक्स बैक-रेफरेंस:** PCRE और जावा रेगेक्स इंजन समान डायोफैंटाइन लंबाई प्रूनिंग द्वारा बैक-रेफरेंस पैटर्न का मूल्यांकन करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **विशिष्टता की शर्त:** `!mainSub.equals(altSub)` यह सुनिश्चित करती है कि 'a' और 'b' दोनों अलग-अलग मानों का प्रतिनिधित्व करें।
