---
title: "लिस्टों का जोड़ (Sum Lists): लिंक्ड लिस्ट द्वारा दर्शाई गई संख्याओं का योग (सीटीसीआई २.५)"
description: "सिंगली लिंक्ड लिस्ट में उल्टे और सीधे क्रम में संग्रहीत अंकों का योग हासिल (Carry) के साथ O(N) समय में निकालने वाला एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपके पास लिंक्ड लिस्ट द्वारा दर्शाई गई दो संख्याएं हैं, जहां प्रत्येक नोड में एक अंक उल्टे क्रम में संग्रहीत है (इकाई का अंक शुरुआत में)। दोनों संख्याओं को जोड़कर योग को लिंक्ड लिस्ट के रूप में लौटाएं। *फॉलो-अप:* यदि अंक सीधे क्रम में संग्रहीत हों तो हल करें।
> * **मुख्य समाधान:** (१) उल्टा क्रम: हासिल (Carry) के साथ रिकर्सिव जोड़ $O(\max(N, M))$ समय में; (२) सीधा क्रम: छोटी लिस्ट में आगे शून्य जोड़ना (पैडिंग), अंत तक रिकर्शन और हासिल को ऊपर की ओर लौटाना।
> * **रियल-वर्ल्ड सिस्टम:** मनमानी-सटीकता अंकगणित (BigInteger), वित्तीय लेजर प्रणाली और क्रिप्टोग्राफिक गणना।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या २.५) में पूछा गया है:

*"आपके पास लिंक्ड लिस्ट द्वारा दर्शाई गई दो संख्याएं हैं, जहां प्रत्येक नोड में एक अंक होता है। अंक उल्टे क्रम में संग्रहीत हैं, जिससे इकाई का अंक लिस्ट के हेड पर है। एक ऐसा फ़ंक्शन लिखें जो दोनों संख्याओं को जोड़कर योग को लिंक्ड लिस्ट के रूप में लौटाए।"*

**उदाहरण (उल्टा क्रम):**
* इनपुट: `(7 -> 1 -> 6)` + `(5 -> 9 -> 2)`। यानी $६१७ + २९५$।
* आउटपुट: `2 -> 1 -> 9`। यानी $९१२$।

**फॉलो-अप (सीधा क्रम):**
* इनपुट: `(6 -> 1 -> 7)` + `(2 -> 9 -> 5)`। यानी $६१७ + २९५$।
* आउटपुट: `9 -> 1 -> 2`। यानी $९१२$।

## २. उल्टा क्रम जोड़ (रिकर्सिव फुल-एडर)

चूंकि अंक इकाई के स्थान से शुरू होते हैं:
१. दोनों अंकों और पिछले हासिल को जोड़ें: `मान = (l1.data + l2.data + carry) % 10`।
२. नया हासिल निकालें: `carry = (l1.data + l2.data + carry) / 10`।
३. अगले नोड्स के लिए रिकर्सिव कॉल करें: `addLists(l1.next, l2.next, carry)`।
४. आधार स्थिति: जब दोनों नोड्स `null` हों और हासिल `0` हो, तो समाप्त करें।

## ३. सीधा क्रम फॉलो-अप (शून्य पैडिंग और पोस्ट-ऑर्डर रिकर्शन)

सीधे क्रम में अलग-अलग लंबाई की लिस्ट्स को आगे से सीधे नहीं जोड़ा जा सकता:
१. दोनों लिस्टों की लंबाई मापें।
२. छोटी लिस्ट के आगे `0` नोड्स जोड़कर दोनों की लंबाई बराबर करें।
३. इकाई अंक पहले जोड़ने के लिए रिकर्शन से अंत तक जाएं।
४. स्टैक वापसी पर नया नोड बनाएं और हासिल को ऊपर भेजें।
५. यदि अंत में हासिल बचता है, तो नया नोड सबसे आगे जोड़ें।

## प्रोडक्शन कार्यान्वयन

```java
public class SumLists {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    // भाग 1: उल्टा क्रम जोड़
    public static LinkedListNode addListsReverse(LinkedListNode l1, LinkedListNode l2, int carry) {
        if (l1 == null && l2 == null && carry == 0) {
            return null;
        }

        int value = carry;
        if (l1 != null) value += l1.data;
        if (l2 != null) value += l2.data;

        LinkedListNode result = new LinkedListNode(value % 10);

        if (l1 != null || l2 != null) {
            LinkedListNode more = addListsReverse(
                l1 == null ? null : l1.next,
                l2 == null ? null : l2.next,
                value >= 10 ? 1 : 0
            );
            result.next = more;
        }

        return result;
    }

    // भाग 2: सीधा क्रम सहायक वर्ग
    private static class PartialSum {
        public LinkedListNode sum = null;
        public int carry = 0;
    }

    public static LinkedListNode addListsForward(LinkedListNode l1, LinkedListNode l2) {
        int len1 = length(l1);
        int len2 = length(l2);

        // छोटी लिस्ट में शून्य की पैडिंग करें
        if (len1 < len2) l1 = padList(l1, len2 - len1);
        else l2 = padList(l2, len1 - len2);

        PartialSum sum = addListsHelper(l1, l2);

        if (sum.carry == 0) return sum.sum;
        else {
            LinkedListNode result = insertBefore(sum.sum, sum.carry);
            return result;
        }
    }

    private static PartialSum addListsHelper(LinkedListNode l1, LinkedListNode l2) {
        if (l1 == null && l2 == null) return new PartialSum();

        PartialSum sum = addListsHelper(l1.next, l2.next);
        int val = sum.carry + l1.data + l2.data;

        LinkedListNode full_result = insertBefore(sum.sum, val % 10);
        sum.sum = full_result;
        sum.carry = val / 10;
        return sum;
    }

    private static int length(LinkedListNode n) {
        int count = 0;
        while (n != null) { count++; n = n.next; }
        return count;
    }

    private static LinkedListNode padList(LinkedListNode l, int padding) {
        LinkedListNode head = l;
        for (int i = 0; i < padding; i++) head = insertBefore(head, 0);
        return head;
    }

    private static LinkedListNode insertBefore(LinkedListNode list, int data) {
        LinkedListNode node = new LinkedListNode(data);
        if (list != null) node.next = list;
        return node;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(max(N, M))` | दोनों लिस्टों का एकल रैखिक स्कैन। |
| सहायक मेमोरी | `O(max(N, M))` | परिणामी योग लिस्ट के लिए $\max(N, M) + 1$ नोड्स का आवंटन। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: बिग-इंटीजर और क्रिप्टोग्राफी

१. **मनमानी सटीकता अंकगणित (जीएमपी, जावा बिगइंटीजर):** सीपीयू के ६४-बिट रजिस्टर सीमा से बड़े क्रिप्टोग्राफिक अंकों का जोड़।
२. **वित्तीय गणना प्रणालियां:** फ्लोटिंग-पॉइंट परिशुद्धता त्रुटियों को रोकने के लिए सटीक पूर्णांक श्रृंखला।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **असमान लंबाई की लिस्टें (`9->9` + `1`):** हासिल के प्रसार से लिस्ट का आकार सही बढ़ता है (`0->0->1`)।
२. **अंतिम अंक पर हासिल बचना:** लिस्ट के सबसे आगे नया नोड सुरक्षित रूप से जुड़ता है।
