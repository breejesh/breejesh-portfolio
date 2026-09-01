---
title: "प्रतिच्छेदन (Intersection): दो सिंगली लिंक्ड लिस्ट्स के प्रतिच्छेदन की जांच (सीटीसीआई २.७)"
description: "दो सिंगली लिंक्ड लिस्ट्स के मेमोरी रेफरेंस द्वारा प्रतिच्छेदित होने की O(N + M) समय और O(१) स्पेस में जांच करने वाला एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** दो सिंगली लिंक्ड लिस्ट्स दी गई हैं, यह निर्धारित करें कि क्या दोनों प्रतिच्छेद करती हैं। प्रतिच्छेदित नोड लौटाएं (प्रतिच्छेदन मान के आधार पर नहीं, बल्कि मेमोरी रेफरेंस के आधार पर परिभाषित है)।
> * **मुख्य समाधान:** दोनों लिस्टों की लंबाई और टेल नोड्स का पता लगाएं। यदि टेल्स भिन्न हैं (`tail1 != tail2`), तो कोई प्रतिच्छेदन नहीं है। यदि टेल्स समान हैं, तो लंबी लिस्ट के पॉइंटर को $|len_1 - len_2|$ कदम आगे बढ़ाएं, फिर दोनों पॉइंटर्स को एक साथ आगे बढ़ाते हुए टकराव बिंदु (`p1 == p2`) $O(N + M)$ समय और $O(१)$ स्पेस में खोजें।
> * **रियल-वर्ल्ड सिस्टम:** कचरा संग्रहण (Garbage Collection) में साझा ऑब्जेक्ट ग्राफ ट्रैकिंग और गिट डीएजी (Git DAG) मर्ज बेस रिजॉल्यूशन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या २.७) में पूछा गया है:

*"दो सिंगली लिंक्ड लिस्ट्स दी गई हैं, यह निर्धारित करें कि क्या वे प्रतिच्छेद करती हैं। प्रतिच्छेदित नोड लौटाएं।"*

**मुख्य अवधारणा:**
सिंगली लिंक्ड लिस्ट में प्रत्येक नोड के पास केवल एक `next` पॉइंटर होता है। जैसे ही दो लिस्ट्स किसी साझा नोड पर मिलती हैं, **उस बिंदु से आगे के सभी नोड्स दोनों के लिए समान और साझा होते हैं**, जिससे 'Y' आकार बनता है।

## २. लंबाई संरेखण और टेल सत्यापन कार्यप्रणाली

१. लिस्ट १ को स्कैन करें: लंबाई $len_1$ और अंतिम नोड $tail_1$ प्राप्त करें।
२. लिस्ट २ को स्कैन करें: लंबाई $len_2$ और अंतिम नोड $tail_2$ प्राप्त करें।
३. टेल्स की तुलना करें: यदि `tail1 != tail2`, तो तुरंत `null` लौटाएं (कोई प्रतिच्छेदन नहीं)।
४. दोनों लिस्टों के हेड पर दो पॉइंटर्स रखें।
५. लंबी लिस्ट के पॉइंटर को $|len_1 - len_2|$ नोड्स आगे बढ़ाएं।
६. दोनों पॉइंटर्स को एक-एक कदम तब तक आगे बढ़ाएं जब तक कि `p1 == p2` न हो जाए।
७. प्रतिच्छेदित नोड लौटाएं।

## प्रोडक्शन कार्यान्वयन

```java
public class IntersectionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    private static class Result {
        public LinkedListNode tail;
        public int size;
        public Result(LinkedListNode tail, int size) {
            this.tail = tail;
            this.size = size;
        }
    }

    /**
     * दो लिंक्ड लिस्ट्स का प्रतिच्छेदन नोड खोजता है।
     * समय जटिलता: O(A + B) जहां A और B लिस्ट की लंबाइयां हैं।
     * स्पेस जटिलता: O(1) सहायक स्पेस।
     */
    public static LinkedListNode findIntersection(LinkedListNode list1, LinkedListNode list2) {
        if (list1 == null || list2 == null) return null;

        Result result1 = getTailAndSize(list1);
        Result result2 = getTailAndSize(list2);

        // यदि टेल अलग हैं, तो कोई प्रतिच्छेदन नहीं है
        if (result1.tail != result2.tail) {
            return null;
        }

        LinkedListNode shorter = result1.size < result2.size ? list1 : list2;
        LinkedListNode longer = result1.size < result2.size ? list2 : list1;

        // लंबी लिस्ट के पॉइंटर को आगे बढ़ाएं
        longer = getKthNode(longer, Math.abs(result1.size - result2.size));

        // टकराव होने तक दोनों पॉइंटर्स को आगे बढ़ाएं
        while (shorter != longer) {
            shorter = shorter.next;
            longer = longer.next;
        }

        return longer;
    }

    private static Result getTailAndSize(LinkedListNode list) {
        if (list == null) return null;

        int size = 1;
        LinkedListNode current = list;
        while (current.next != null) {
            size++;
            current = current.next;
        }
        return new Result(current, size);
    }

    private static LinkedListNode getKthNode(LinkedListNode head, int k) {
        LinkedListNode current = head;
        while (k > 0 && current != null) {
            current = current.next;
            k--;
        }
        return current;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N + M)` | लंबाइयों के लिए $N + M$ और प्रतिच्छेदन स्कैन के लिए अधिकतम $\max(N, M)$। |
| सहायक मेमोरी | `O(१)` | केवल पॉइंटर चरों का उपयोग, बिना किसी हीप आवंटन के। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: गारबेज कलेक्शन और गिट ग्राफ

१. **मेमोरी मैनेजमेंट (JVM / V8):** गारबेज कलेक्टर सक्रिय रूट पॉइंटर्स के माध्यम से साझा हीप आवंटनों की पहचान करते हैं।
२. **गिट डायरेक्टेड असाइक्लिक ग्राफ (DAG):** साझा कमिट बेस खोजने के लिए ब्रांच ट्रिगरिंग।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई प्रतिच्छेदन न होना:** टेल तुलना द्वारा $O(N + M)$ में पहचाना जाता है।
२. **समान लिस्ट्स:** अंतर ० होता है और तुरंत हेड लौटाता है।
३. **हेड पर प्रतिच्छेदन:** शून्यवें चरण में ही टकराव की पहचान।
