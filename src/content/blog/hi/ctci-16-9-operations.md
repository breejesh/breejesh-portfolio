---
title: "अंकगणितीय संचालन (Operations): केवल जोड़ ऑपरेटर द्वारा घटाव, गुणा और भाग (सीटीसीआई १६.९)"
description: "केवल जोड़ (+) ऑपरेटर का उपयोग करके पूर्णांकों के लिए घटाव, गुणा और भाग संचालन को घातीय दोहरीकरण (Exponential Doubling) द्वारा O(log N) में लागू करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-9-operations.webp
previewImage: /assets/images/ctci-16-9-operations.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** पूर्णांकों के लिए गुणा, घटाव और भाग संचालन को लागू करने के लिए विधियाँ लिखें। आप केवल जोड़ (`+`) ऑपरेटर का उपयोग कर सकते हैं।
> * **मुख्य समाधान:** **घातीय दोहरीकरण (Exponential Doubling) द्वारा ऋणात्मकता और भागफल निर्माण**:
>   1. **ऋणात्मकता (`negate(x)`)**: $\pm १$ जोड़ने के बजाय घातीय रूप से डेल्टा ($\Delta = -१, -२, -४, \dots$) को दोगुना करें। यह **$O(\log |x|)$ समय** में चलता है।
>   2. **घटाव (`subtract(a, b)`)**: $a - b = a + \text{negate}(b)$।
>   3. **गुणा (`multiply(a, b)`)**: $a$ को बार-बार $|b|$ बार जोड़ना।
>   4. **भाग (`divide(a, b)`)**: भाजक के घातीय गुणकों को जोड़कर भागफल का निर्माण करना।
>   5. नेगेशन **$O(\log |x|)$** और भाग **$O(\log^2 (a / b))$ समय** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** हार्डवेयर एएलयू (ALU) और बिना हार्डवेयर डिवाइडर वाले माइक्रोकंट्रोलर्स।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.९) में पूछा गया है:

*"केवल जोड़ ऑपरेटर (+) का उपयोग करके पूर्णांक घटाव, गुणा और भाग के लिए विधियाँ लिखें।"*

## २. घातीय दोहरीकरण द्वारा नेगेशन ($O(\log N)$)

ऋणात्मक मान प्राप्त करने के लिए स्टेप साइज को दोगुना ($\Delta \leftarrow \Delta + \Delta$) किया जाता है ताकि लॉगरिदमिक चरणों में लक्ष्य तक पहुंचा जा सके।

## प्रोडक्शन कार्यान्वयन

```java
public class Operations {

    /**
     * घातीय दोहरीकरण द्वारा O(log |a|) में संख्या को ऋणात्मक बनाता है।
     */
    public static int negate(int a) {
        if (a == 0) return 0;
        int negated = 0;
        int direction = (a < 0) ? 1 : -1;
        int delta = direction;

        while (a != 0) {
            boolean willExceed = (direction > 0) ? (a + delta > 0) : (a + delta < 0);
            if (willExceed) {
                delta = direction;
            }
            negated += delta;
            a += delta;
            delta += delta;
        }
        return negated;
    }

    public static int subtract(int a, int b) {
        return a + negate(b);
    }

    public static int multiply(int a, int b) {
        if (a == 0 || b == 0) return 0;
        if (abs(a) < abs(b)) return multiply(b, a);

        int absB = abs(b);
        int product = 0;
        for (int i = 0; i < absB; i++) {
            product += a;
        }
        return (b < 0) ? negate(product) : product;
    }

    public static int divide(int a, int b) {
        if (b == 0) throw new ArithmeticException("शून्य से विभाजन अमान्य है");
        if (a == 0) return 0;

        int absA = abs(a);
        int absB = abs(b);
        int quotient = 0;
        int total = 0;

        while (total + absB <= absA) {
            int currentProduct = absB;
            int currentQuotient = 1;
            while (total + currentProduct + currentProduct <= absA) {
                currentProduct += currentProduct;
                currentQuotient += currentQuotient;
            }
            total += currentProduct;
            quotient += currentQuotient;
        }

        boolean sameSign = (a > 0 && b > 0) || (a < 0 && b < 0);
        return sameSign ? quotient : negate(quotient);
    }

    private static int abs(int a) {
        return (a < 0) ? negate(a) : a;
    }
}
```

## जटिलता विश्लेषण

| ऑपरेशन | समय जटिलता | सहायक स्पेस | मुख्य रणनीति |
|---|---|---|---|
| **`negate(a)`** | $O(\log |a|)$ | $O(1)$ | घातीय दोहरीकरण ($\Delta \leftarrow \Delta + \Delta$) |
| **`subtract(a, b)`** | $O(\log |b|)$ | $O(1)$ | ऋणात्मक संख्या का सीधा जोड़ |
| **`multiply(a, b)`** | $O(\min(|a|, |b|))$ | $O(1)$ | बार-बार जोड़ना |
| **`divide(a, b)`** | $O(\log^2 (a / b))$ | $O(1)$ | बाइनरी भाजक स्केलिंग |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: एएलयू (ALU) माइक्रो-आर्किटेक्चर

१. **हार्डवेयर एडर्स:** कम लागत वाले माइक्रोकंट्रोलर्स हार्डवेयर डिवाइडर सिलिकॉन ब्लॉक के बिना माइक्रोकोड स्तर पर केवल एडर्स का उपयोग करके भाग संचालन करते हैं।
२. **टू कॉम्प्लीमेंट:** आधुनिक सीपीयू में नेगेशन `~x + 1` द्वारा एकल चक्र में निष्पादित होता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **शून्य से विभाजन:** `ArithmeticException` फेंकना।
