---
title: "यादृच्छिक नोड (Random Node): समान प्रायिकता के साथ बाइनरी ट्री नोड चयन (सीटीसीआई ४.११)"
description: "सबट्री आकार (Subtree Size) ट्रैकिंग का उपयोग करके O(log N) समय और O(१) स्पेस में समान प्रायिकता १/N के साथ यादृच्छिक ट्री नोड चुनना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आप स्क्रैच से एक बाइनरी ट्री क्लास लागू कर रहे हैं जिसमें `insert`, `find`, और `delete` के अलावा एक मेथड `getRandomNode()` है जो पेड़ से एक यादृच्छिक नोड लौटाता है। सभी नोड्स को चुने जाने की समान संभावना होनी चाहिए।
> * **मुख्य समाधान:** प्रत्येक नोड में सबट्री का आकार (`size`) स्टोर करें। `getRandomNode()` में, एक यादृच्छिक इंडेक्स $d \in [0, \text{size}-1]$ उत्पन्न करें। यदि $d < \text{left.size}$, तो बाएं जाएं। यदि $d == \text{left.size}$, तो वर्तमान नोड लौटाएं। यदि बड़ा है, तो दाएं जाएं ($O(\log N)$ समय और $O(१)$ स्पेस)।
> * **रियल-वर्ल्ड सिस्टम:** डेटाबेस क्वेरी इंडेक्स सैंपलिंग (PostgreSQL `ANALYZE`) और ट्रीप्स (Treaps)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ४.११) में पूछा गया है:

*"आप स्क्रैच से एक बाइनरी ट्री क्लास लागू कर रहे हैं जिसमें getRandomNode() मेथड है जो पेड़ से समान संभावना के साथ यादृच्छिक नोड लौटाता है।"*

## २. समान प्रायिकता (Uniform Probability) गणित

$N$ नोड्स वाले पेड़ में प्रत्येक नोड के चुने जाने की सटीक संभावना $1/N$ होनी चाहिए:
* वर्तमान नोड की प्रायिकता = $\frac{1}{N}$।
* बाएं सबट्री की प्रायिकता = $\frac{left.size}{N}$।
* दाएं सबट्री की प्रायिकता = $\frac{right.size}{N}$।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.Random;

public class RandomNodeTree {
    public static class TreeNode {
        private int data;
        public TreeNode left;
        public TreeNode right;
        private int size = 0;

        public TreeNode(int d) {
            data = d;
            size = 1;
        }

        public int data() { return data; }
        public int size() { return size; }

        public TreeNode getRandomNode() {
            int leftSize = left == null ? 0 : left.size();
            Random random = new Random();
            int index = random.nextInt(size);

            if (index < leftSize) {
                return left.getRandomNode();
            } else if (index == leftSize) {
                return this;
            } else {
                return right.getRandomNode();
            }
        }

        public void insertInOrder(int d) {
            if (d <= data) {
                if (left == null) {
                    left = new TreeNode(d);
                } else {
                    left.insertInOrder(d);
                }
            } else {
                if (right == null) {
                    right = new TreeNode(d);
                } else {
                    right.insertInOrder(d);
                }
            }
            size++;
        }

        public TreeNode find(int d) {
            if (d == data) {
                return this;
            } else if (d <= data) {
                return left != null ? left.find(d) : null;
            } else {
                return right != null ? right.find(d) : null;
            }
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| getRandomNode समय | `O(\log N)` | संतुलित पेड़ में ऊंचाई तक सीमित। |
| insert / find / delete समय | `O(\log N)` | `size` काउंटर अपडेट करते हुए रूट-टू-लीफ पथ ट्रैवर्सल। |
| सहायक मेमोरी | `O(१)` | इटरेटिव या टेल-रिकर्सिव निष्पादन। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: यादृच्छिक ट्री संरचनाएं

१. **एसक्यूएल क्वेरी ऑप्टिमाइज़र सांख्यिकी (PostgreSQL):** पूर्ण टेबल स्कैन से बचने के लिए इंडेक्स पेजों से यादृच्छिक नमूनाकरण।
२. **ट्रीप्स (Treaps):** यादृच्छिक प्राथमिकताओं द्वारा स्वतः संतुलित पेड़।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली पेड़:** `null` लौटाता है।
२. **एकल नोड पेड़:** `random.nextInt(1)` हमेशा 0 लौटाता है, जिससे वही नोड चुना जाता है।
