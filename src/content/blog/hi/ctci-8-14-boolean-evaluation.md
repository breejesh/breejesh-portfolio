---
title: "बूलियन मूल्यांकन (Boolean Evaluation): अंतराल डायनामिक प्रोग्रामिंग से कोष्ठक गणना (सीटीसीआई ८.१४)"
description: "अंतराल डायनामिक प्रोग्रामिंग का उपयोग करके वांछित बूलियन परिणाम प्राप्त करने के लिए 0, 1, &, |, ^ प्रतीकों वाले व्यंजक को कोष्ठकबद्ध करने के तरीकों की O(N^3) समय में गणना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** प्रतीकों `0` (false), `1` (true), `&` (AND), `|` (OR), और `^` (XOR) से युक्त एक बूलियन अभिव्यक्ति और एक वांछित बूलियन परिणाम `result` दिए जाने पर, अभिव्यक्ति को कोष्ठकबद्ध (parenthesize) करने के तरीकों की संख्या की गणना करने के लिए एक फ़ंक्शन लागू करें ताकि यह `result` के बराबर हो।
> * **मुख्य समाधान:** **अंतराल डायनामिक प्रोग्रामिंग (Interval Dynamic Programming)**: (१) अभिव्यक्ति को प्रत्येक विषम ऑपरेटर इंडेक्स $i = 1, 3, 5 \dots$ पर विभाजित करें; (२) बाएं और दाएं सबस्ट्रिंग के `true` और `false` परिणामों के तरीकों की पुनरावर्ती और मेमोइज़्ड गणना करें; (३) ऑपरेटरों `&`, `|` और `^` के लिए बूलियन सत्य तालिकाओं (Truth Tables) को लागू करें; (४) `HashMap<String, Integer>` द्वारा कैशिंग से यह **$O(N^3)$ समय** और **$O(N^2)$ स्पेस** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** एसक्यूएल क्वेरी ऑप्टिमाइज़र और डिजिटल लॉजिक सर्किट संश्लेषण।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.१४) में पूछा गया है:

*"वांछित बूलियन परिणाम प्राप्त करने के लिए एक तार्किक अभिव्यक्ति को कोष्ठकबद्ध करने के तरीकों की कुल संख्या की गणना करें।"*

## २. अंतराल विभाजन और सत्य सारणी

प्रत्येक ऑपरेटर विभाजन के लिए:
* कुल तरीके: $\text{total} = (l_t + l_f) \times (r_t + r_f)$
* `^` (XOR): $\text{totalTrue} = l_t \times r_f + l_f \times r_t$
* `&` (AND): $\text{totalTrue} = l_t \times r_t$
* `|` (OR): $\text{totalTrue} = l_t \times r_t + l_f \times r_t + l_t \times r_f$

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {
    /**
     * वांछित बूलियन मान देने वाले कोष्ठक संयोजनों की गणना करता है।
     * समय जटिलता: O(N^3)
     * स्पेस जटिलता: O(N^2)
     */
    public static int countEval(String s, boolean result) {
        return countEvalHelper(s, result, new HashMap<>());
    }

    private static int countEvalHelper(String s, boolean result, Map<String, Integer> memo) {
        if (s.length() == 0) return 0;
        if (s.length() == 1) {
            return stringToBool(s) == result ? 1 : 0;
        }

        String key = result + s;
        if (memo.containsKey(key)) return memo.get(key);

        int ways = 0;

        for (int i = 1; i < s.length(); i += 2) {
            char op = s.charAt(i);
            String left = s.substring(0, i);
            String right = s.substring(i + 1);

            int leftTrue = countEvalHelper(left, true, memo);
            int leftFalse = countEvalHelper(left, false, memo);
            int rightTrue = countEvalHelper(right, true, memo);
            int rightFalse = countEvalHelper(right, false, memo);

            int total = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int totalTrue = 0;

            if (op == '^') {
                totalTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            } else if (op == '&') {
                totalTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                totalTrue = leftTrue * rightTrue + leftFalse * rightTrue + leftTrue * rightFalse;
            }

            int subWays = result ? totalTrue : (total - totalTrue);
            ways += subWays;
        }

        memo.put(key, ways);
        return ways;
    }

    private static boolean stringToBool(String c) {
        return c.equals("1");
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N^3)` | $O(N^2)$ संभावित उप-समस्याएं, प्रत्येक में $O(N)$ ऑपरेटर बिंदु। |
| सहायक मेमोरी | `O(N^2)` | सबस्ट्रिंग कुंजियों को सहेजने के लिए मेमोइज़ेशन मैप। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: क्वेरी ऑप्टिमाइज़र

१. **एसक्यूएल प्रेडिकेट ट्री:** डिस्क आई/ओ को न्यूनतम करने के लिए बूलियन क्लॉज़ का पुनर्गठन।
२. **डिजिटल लॉजिक सर्किट सिंथेसिस:** चिप्स में प्रसार विलंब को न्यूनतम करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **एकल प्रतीक (`"1"`, true):** १ लौटाना।
२. **रिक्त स्ट्रिंग:** ० लौटाना।
