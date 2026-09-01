---
title: "सतत माध्यिका (Continuous Median): डुअल-Heap स्ट्रीमिंग माध्यिका रखरखाव (सीटीसीआई १७.२०)"
description: "Max-Heap (निचला आधा) और Min-Heap (ऊपरी आधा) का उपयोग करके एक लाइव डेटा स्ट्रीम की चल माध्यिका को O(log N) प्रति सम्मिलन और O(1) प्रति क्वेरी में बनाए रखना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-20-continuous-median.webp
previewImage: /assets/images/ctci-17-20-continuous-median.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपको संख्याओं की एक स्ट्रीम प्राप्त हो रही है। प्रत्येक संख्या प्राप्त होने के बाद अब तक देखी गई सभी संख्याओं की माध्यिका की गणना करें।
> * **मुख्य समाधान:** **डुअल-Heap (निचला Max-Heap + ऊपरी Min-Heap)**:
>   1. दो Heap बनाए रखें: `lower` (छोटे आधे के लिए Max-Heap) और `upper` (बड़े आधे के लिए Min-Heap)।
>   2. **आकार अपरिवर्तनीय**: `lower.size() == upper.size()` या `lower.size() == upper.size() + 1`।
>   3. **सम्मिलन**: नई संख्या को सही Heap में डालें, फिर यदि आकार में अंतर १ से अधिक हो तो पुनः संतुलित करें।
>   4. **क्वेरी**: सम संख्या → `(lower.top() + upper.top()) / 2.0`। विषम → `lower.top()`।
>   5. **$O(\log N)$ सम्मिलन**, **$O(1)$ क्वेरी**।
> * **रियल-वर्ल्ड सिस्टम:** Prometheus/Grafana P50 लेटेंसी ट्रैकिंग और वित्तीय बाजार रियल-टाइम मूल्य।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.२०) में पूछा गया है:

*"संख्याएं यादृच्छिक रूप से उत्पन्न होती हैं और एक विधि को पास की जाती हैं। नए मान आने पर माध्यिका को खोजने और बनाए रखने के लिए एक प्रोग्राम लिखें।"*

## २. डुअल-Heap विभाजन अपरिवर्तनीय

```
स्ट्रीम: [5, 2, 4, 1, 7]

5 के बाद:  lower=[5]      upper=[]       माध्यिका=5
2 के बाद:  lower=[2]      upper=[5]      माध्यिका=(2+5)/2=3.5
4 के बाद:  lower=[2,4]    upper=[5]      माध्यिका=4
1 के बाद:  lower=[1,2]    upper=[4,5]    माध्यिका=(2+4)/2=3.0
7 के बाद:  lower=[1,2,4]  upper=[5,7]    माध्यिका=4
```

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class ContinuousMedian {

    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> upper = new PriorityQueue<>();

    public void addNumber(int num) {
        if (lower.isEmpty() || num <= lower.peek()) {
            lower.add(num);
        } else {
            upper.add(num);
        }
        rebalance();
    }

    private void rebalance() {
        if (lower.size() > upper.size() + 1) {
            upper.add(lower.poll());
        } else if (upper.size() > lower.size()) {
            lower.add(upper.poll());
        }
    }

    public double getMedian() {
        if (lower.isEmpty()) throw new IllegalStateException("कोई संख्या नहीं जोड़ी गई।");
        if (lower.size() == upper.size()) {
            return (lower.peek() + upper.peek()) / 2.0;
        }
        return lower.peek();
    }
}
```

## जटिलता विश्लेषण

| ऑपरेशन | जटिलता | विवरण |
|---|---|---|
| `addNumber()` | $O(\log N)$ | Heap सम्मिलन और अधिकतम एक पुनर्संतुलन। |
| `getMedian()` | $O(1)$ | Heap शीर्ष को देखना। |
| स्पेस | $O(N)$ | दोनों Heap मिलकर सभी N तत्व संग्रहीत करते हैं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

१. **Prometheus/Grafana P50 लेटेंसी:** API प्रतिक्रिया माध्यिका की लाइव SLO डैशबोर्ड निगरानी।
२. **वित्तीय बाजार टिक एनालिटिक्स:** एल्गोरिदमिक ट्रेडिंग के लिए ऑर्डर बुक मध्य मूल्य की रियल-टाइम गणना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली स्ट्रीम:** पहली क्वेरी से पहले `IllegalStateException` उत्पन्न करें।
२. **डुप्लिकेट मान:** दोनों Heap स्वाभाविक रूप से डुप्लिकेट को संभालते हैं।
