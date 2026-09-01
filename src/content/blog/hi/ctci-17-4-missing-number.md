---
title: "लुप्त संख्या (Missing Number): बिट समता विभाजन द्वारा लीनियर समय खोज (सीटीसीआई १७.४)"
description: "केवल स्थिर-समय बिट एक्सेस fetch(i, j) का उपयोग करके ० से N तक की लुप्त संख्या को कॉलम-पैरिटी रिडक्शन द्वारा O(N) ज्यामितीय समय में खोजना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-4-missing-number.webp
previewImage: /assets/images/ctci-17-4-missing-number.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक सरणी में ० से $n$ तक के सभी पूर्णांक हैं, केवल एक लुप्त संख्या को छोड़कर। आप पूरे पूर्णांक को सीधे नहीं पढ़ सकते; केवल `fetch(i, j)` द्वारा किसी संख्या के $j$-वें बिट को $O(1)$ में पढ़ सकते हैं। लुप्त संख्या को $O(n)$ समय में खोजें।
> * **मुख्य समाधान:** **कॉलम-पैरिटी (Parity) आधारित रिकर्सिव निष्कासन**:
>   1. पूर्ण अनुक्रम $०..n$ में, सबसे कम महत्वपूर्ण बिट (LSB, कॉलम ०) पर शून्यों की संख्या हमेशा एक की संख्या से अधिक या बराबर होती है ($\text{zeros} \ge \text{ones}$)।
>   2. वर्तमान सरणी के LSB बिट्स गिनें:
>      * यदि $\text{zeros} \le \text{ones}$, तो हटाई गई संख्या का LSB **०** था। केवल LSB=० वाले तत्वों को रखें और अगले कॉलम पर रिकर्स करें।
>      * यदि $\text{zeros} > \text{ones}$, तो हटाई गई संख्या का LSB **१** था। केवल LSB=१ वाले तत्वों को रखें और अगले कॉलम पर रिकर्स करें।
>   3. **ज्यामितीय श्रृंखला**: $T(n) = n + \frac{n}{2} + \frac{n}{4} + \cdots = 2n = O(n)$ समय।
> * **रियल-वर्ल्ड सिस्टम:** ईसीसी रैम (ECC Memory) और कॉलम-स्टोर डेटाबेस (Apache Parquet)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.४) में पूछा गया है:

*"बिट-स्तरीय ऑपरेशनों के माध्यम से ० से n तक की लुप्त संख्या को O(n) समय में ज्ञात करने के लिए एल्गोरिदम लिखें।"*

## २. बिट पैरिटी का ज्यामितीय सिद्धांत

प्रत्येक स्तर पर तत्वों की संख्या आधी होने से कुल कार्य ज्यामितीय श्रृंखला $N + N/२ + N/४ + \dots = २N$ के रूप में समाप्त होता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.List;

public class MissingNumberFinder {

    public interface BitInteger {
        int fetch(int column);
    }

    public static int findMissing(List<BitInteger> array) {
        return findMissingHelper(array, 0);
    }

    private static int findMissingHelper(List<BitInteger> input, int column) {
        if (column >= 32 || input.isEmpty()) return 0;

        List<BitInteger> zeros = new ArrayList<>(input.size() / 2);
        List<BitInteger> ones = new ArrayList<>(input.size() / 2);

        for (BitInteger num : input) {
            if (num.fetch(column) == 0) {
                zeros.add(num);
            } else {
                ones.add(num);
            }
        }

        if (zeros.size() <= ones.size()) {
            int v = findMissingHelper(zeros, column + 1);
            return (v << 1) | 0;
        } else {
            int v = findMissingHelper(ones, column + 1);
            return (v << 1) | 1;
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N)` | ज्यामितीय श्रृंखला: $N + N/2 + N/4 + \dots = 2N$। |
| सहायक स्पेस | `O(N)` | रिकर्शन के प्रत्येक स्तर पर उप-सूचियां। |
| कुल बिट एक्सेस | $\le 2N$ | पूर्णतः लीनियर बिट-स्तरीय मेमोरी रीड। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: कॉलमर डेटाबेस और ईसीसी रैम

१. **Apache Parquet:** एनालिटिक्स इंजन पंक्तियों को डीकंप्रेस किए बिना सीधे बिट-वेक्टर पर फ़िल्टर चलाते हैं।
२. **ECC मेमोरी:** हैमिंग कोड द्वारा हार्डवेयर स्तर पर फ्लिप हुए बिट्स का पता लगाना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **शून्य का लुप्त होना:** सभी बिट कॉलमों पर ० पहचानकर सही ढंग से ० बनाना।
