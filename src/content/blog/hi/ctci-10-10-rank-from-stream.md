---
title: "स्ट्रीम से रैंक (Rank from Stream): डायनामिक रैंकिंग के लिए ऑर्डर स्टेटिस्टिक ट्री (सीटीसीआई १०.१०)"
description: "ऑगमेंटेड बाइनरी सर्च ट्री (Order Statistic Tree) का उपयोग करके पूर्णांकों के निरंतर डेटा स्ट्रीम में O(log N) समय में संख्याओं की रैंक ट्रैक और क्वेरी करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कल्पना करें कि आप पूर्णांकों का एक स्ट्रीम पढ़ रहे हैं। समय-समय पर, आप किसी संख्या $x$ की रैंक (यानी $x$ से छोटी या उसके बराबर संख्याओं की संख्या) देखना चाहते हैं। `track(int x)` और `getRankOfNumber(int x)` को लागू करें।
> * **मुख्य समाधान:** **ऑगमेंटेड बाइनरी सर्च ट्री (Order Statistic Tree)**: (१) प्रत्येक नोड अपने मान `data`, चाइल्ड पॉइंटर्स और बाएं सबट्री में कुल नोड्स की संख्या `left_size` को ट्रैक करता है; (२) `track(x)`: बाईं ओर जाते समय `left_size++` बढ़ाता है; (३) `getRankOfNumber(x)`: यदि $x == \text{data}$, तो `left_size` लौटाएं; यदि $x < \text{data}$, तो बाईं ओर जाएं; यदि $x > \text{data}$, तो `left_size + 1 + right.getRank(x)` लौटाएं; (४) यह संतुलित ट्री पर **$O(\log N)$ समय** और **$O(N)$ स्पेस** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** प्रोमेथियस / डेटाडॉग में रियल-टाइम परसेंटाइल (P95/P99) गणना और मल्टीप्लेयर गेमिंग लीडरबोर्ड रैंकिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १०.१०) में पूछा गया है:

*"डेटा स्ट्रीम में संख्याओं को ट्रैक करने और किसी भी संख्या की रैंक वास्तविक समय में प्राप्त करने के लिए डेटा संरचना और एल्गोरिदम लागू करें।"*

## २. ऑगमेंटेड बाइनरी सर्च ट्री इनवेरिएंट

बीएसटी में `left_size` विशेषता जोड़कर:
* जब $x > \text{data}$ के लिए रैंक खोजी जाती है, तो वर्तमान नोड, उसका पूरा बायां सबट्री और दाएं सबट्री के पात्र तत्व जुड़ते हैं:
$$\text{Rank}(x) = \text{left\_size} + 1 + \text{right.getRank}(x)$$

## प्रोडक्शन कार्यान्वयन

```java
public class RankFromStream {
    public static class RankNode {
        public int left_size = 0;
        public RankNode left, right;
        public int data = 0;

        public RankNode(int d) {
            this.data = d;
        }

        public void insert(int d) {
            if (d <= data) {
                left_size++;
                if (left != null) {
                    left.insert(d);
                } else {
                    left = new RankNode(d);
                }
            } else {
                if (right != null) {
                    right.insert(d);
                } else {
                    right = new RankNode(d);
                }
            }
        }

        public int getRank(int d) {
            if (d == data) {
                return left_size;
            } else if (d < data) {
                if (left == null) return -1;
                return left.getRank(d);
            } else {
                int right_rank = (right == null) ? -1 : right.getRank(d);
                if (right_rank == -1) return -1;
                return left_size + 1 + right_rank;
            }
        }
    }

    private RankNode root = null;

    public void track(int number) {
        if (root == null) {
            root = new RankNode(number);
        } else {
            root.insert(number);
        }
    }

    public int getRankOfNumber(int number) {
        if (root == null) return -1;
        return root.getRank(number);
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| ऑपरेशन | संतुलित BST | असंतुलित ट्री | तकनीकी विवरण |
|---|---|---|---|
| स्ट्रीम इंजेक्शन (`track`) | `O(\log N)` | `O(N)` | `left_size` बढ़ाते हुए सिंगल ब्रांच डिसेंट। |
| रैंक क्वेरी | `O(\log N)` | `O(N)` | सबट्री भारों का संचय। |
| कुल स्पेस | `O(N)` | `O(N)` | प्रति स्ट्रीम तत्व १ `RankNode`। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: रियल-टाइम परसेंटाइल

१. **APM मेट्रिक्स इंजन (Prometheus):** लाखों लेटेंसी इवेंट्स के बीच P50, P95 और P99 परसेंटाइल की त्वरित गणना।
२. **गेमिंग लीडरबोर्ड:** गतिशील खिलाड़ी रैंकिंग का प्रबंधन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **डुप्लिकेट तत्व:** बाएं सबट्री में जाते हैं और `left_size` को सही ढंग से बढ़ाते हैं।
२. **अनुपस्थित संख्या:** `-1` लौटाना।
