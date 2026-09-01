---
title: "बीएसटी अनुक्रम (BST Sequences): दिए गए BST को बनाने वाले सभी संभावित एरे क्रम उत्पन्न करना (सीटीसीआई ४.९)"
description: "सबट्री वीविंग (Weaving) और बैकट्रैकिंग विधि द्वारा उन सभी संभावित इंसर्शन एरे क्रमों का पुनर्निर्माण करना जो एक विशिष्ट बाइनरी सर्च ट्री बनाते हैं।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक बाइनरी सर्च ट्री एक एरे के तत्वों को बाएं से दाएं सम्मिलित करके बनाया गया था। विशिष्ट तत्वों वाले दिए गए बीएसटी के लिए, उन सभी संभावित एरे अनुक्रमों को प्रिंट करें जो इस पेड़ को उत्पन्न कर सकते थे।
> * **मुख्य समाधान:** किसी भी सबट्री का रूट हमेशा उसके बच्चों से पहले प्रकट होना चाहिए। बाएं सबट्री के सभी अनुक्रम और दाएं सबट्री के सभी अनुक्रम प्राप्त करें, फिर दोनों के तत्वों के आंतरिक सापेक्ष क्रम को बनाए रखते हुए उन्हें **आपस में बुनें (weave)**।
> * **रियल-वर्ल्ड सिस्टम:** समवर्ती लेनदेन फज़िंग (Concurrency Fuzzing) और वितरित सर्वसम्मति प्रोटोकॉल (Raft/Paxos) परीक्षण।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ४.९) में पूछा गया है:

*"एक बाइनरी सर्च ट्री को एक एरे के माध्यम से तत्वों को सम्मिलित करके बनाया गया था। सभी संभावित एरे प्रिंट करें जो इस पेड़ को बना सकते थे।"*

**उदाहरण:**
* पेड़: रूट `2`, बायां बच्चा `1`, दायां बच्चा `3`
* आउटपुट: `[2, 1, 3]`, `[2, 3, 1]`

## २. सबट्री वीविंग (Weaving) तकनीक

१. रूट हमेशा अपने वंशजों से पहले आना चाहिए।
२. बाएं और दाएं सबट्री के नोड्स किसी भी क्रम में आपस में गूंथे जा सकते हैं, बशर्ते कि प्रत्येक सबट्री का अपना आंतरिक क्रम न टूटे।
३. `weaveLists` फ़ंक्शन बैकट्रैकिंग के माध्यम से सूचियों को जोड़ता है:
   * पहली सूची का सिर निकालें, प्रीफिक्स में जोड़ें और आगे बढ़ें।
   * बैकट्रैक करें।
   * दूसरी सूची का सिर निकालें, प्रीफिक्स में जोड़ें और आगे बढ़ें।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BSTSequences {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * दिए गए BST को बनाने वाले सभी संभावित एरे क्रम उत्पन्न करता है।
     */
    public static List<LinkedList<Integer>> allSequences(TreeNode node) {
        List<LinkedList<Integer>> result = new ArrayList<>();

        if (node == null) {
            result.add(new LinkedList<>());
            return result;
        }

        LinkedList<Integer> prefix = new LinkedList<>();
        prefix.add(node.val);

        List<LinkedList<Integer>> leftSeq = allSequences(node.left);
        List<LinkedList<Integer>> rightSeq = allSequences(node.right);

        for (LinkedList<Integer> left : leftSeq) {
            for (LinkedList<Integer> right : rightSeq) {
                List<LinkedList<Integer>> weaved = new ArrayList<>();
                weaveLists(left, right, weaved, prefix);
                result.addAll(weaved);
            }
        }

        return result;
    }

    private static void weaveLists(LinkedList<Integer> first, LinkedList<Integer> second,
                                   List<LinkedList<Integer>> results, LinkedList<Integer> prefix) {
        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> result = (LinkedList<Integer>) prefix.clone();
            result.addAll(first);
            result.addAll(second);
            results.add(result);
            return;
        }

        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | घातीय ($O(2^N \text{ से } N!)$) | संभावित वीविंग संयोजनों की संख्या पर निर्भर। |
| सहायक मेमोरी | $O(N \times K)$ | लंबाई $N$ के सभी $K$ संभावित अनुक्रमों का भंडारण। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: समवर्ती निष्पादन फज़िंग

१. **वितरित सर्वसम्मति परीक्षण (Jepsen):** रेस स्थितियों का पता लगाने के लिए घटनाओं के सभी संभावित वैध क्रम उत्पन्न करना।
२. **डेटाबेस लेनदेन सीरियलाइज़ेबिलिटी ऑडिट:** रीड और राइट ऑपरेशनों के क्रमचय का अनुकरण।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **नल पेड़:** एक खाली सूची युक्त सूची `[[]]` लौटाता है।
२. **रैखिक पेड़:** ठीक १ अनुक्रम लौटाता है।
