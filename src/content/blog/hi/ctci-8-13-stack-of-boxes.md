---
title: "बक्सों का ढेर (Stack of Boxes): LIS डायनामिक प्रोग्रामिंग द्वारा ३D बॉक्स स्टैकिंग (सीटीसीआई ८.१३)"
description: "सॉर्टिंग और मेमोइज़्ड डायनामिक प्रोग्रामिंग का उपयोग करके O(N^2) समय और O(N) स्पेस में ३D बक्सों के सबसे ऊंचे संभव ढेर की गणना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपके पास $n$ बक्सों का एक सेट है, जिनकी चौड़ाई $w_i$, ऊंचाई $h_i$ और गहराई $d_i$ है। बक्सों को घुमाया नहीं जा सकता और उन्हें केवल तभी एक दूसरे के ऊपर रखा जा सकता है यदि ढेर में प्रत्येक बॉक्स नीचे वाले बॉक्स से चौड़ाई, ऊंचाई और गहराई तीनों में सख्ती से छोटा हो। सबसे ऊंचे संभावित ढेर की ऊंचाई की गणना करें।
> * **मुख्य समाधान:** **सॉर्टेड ३D LIS डायनामिक प्रोग्रामिंग**: (१) बक्सों को ऊंचाई के घटते क्रम में सॉर्ट करें; (२) तालिका `stackMap[i]` में बॉक्स `i` को आधार मानकर अधिकतम ऊंचाई सहेजें; (३) बॉक्स $j > i$ की खोज करें जिसके आयाम सख्ती से छोटे हों $(w_j < w_i, h_j < h_i, d_j < d_i)$; (४) यह **$O(N^2)$ समय** और **$O(N)$ स्पेस** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** लॉजिस्टिक्स वेयरहाउस ३D बिन पैकिंग (Amazon) और डायरेक्टेड एसाइक्लिक ग्राफ (DAG) शेड्यूलिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.१३) में पूछा गया है:

*"त्रिविमीय (३D) बक्सों के ढेर की अधिकतम ऊंचाई ज्ञात करें जहां प्रत्येक ऊपरी बॉक्स तीनों आयामों में सख्ती से छोटा होना चाहिए।"*

## २. गणितीय मॉडलिंग: DAG और सॉर्टिंग

ऊंचाई के आधार पर बक्सों को घटते क्रम में छांटने से बॉक्स $j$ केवल तभी $i$ के ऊपर रखा जा सकता है जब $j > i$ हो। इससे समस्या एक निर्देशित चक्रीय ग्राफ (DAG) पर सबसे लंबे बढ़ते/घटते अनुक्रम (LIS) में बदल जाती है।

$$\text{maxHeight}(i) = h_i + \max_{j > i, \text{canBeAbove}(i, j)} \text{maxHeight}(j)$$

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class StackOfBoxes {
    public static class Box {
        public final int width;
        public final int height;
        public final int depth;

        public Box(int w, int h, int d) {
            this.width = w;
            this.height = h;
            this.depth = d;
        }

        public boolean canBeAbove(Box other) {
            if (other == null) return true;
            return this.width < other.width &&
                   this.height < other.height &&
                   this.depth < other.depth;
        }
    }

    /**
     * बक्सों के ढेर की अधिकतम ऊंचाई की गणना करता है।
     * समय जटिलता: O(N^2)
     * स्पेस जटिलता: O(N)
     */
    public static int createStack(List<Box> boxes) {
        if (boxes == null || boxes.isEmpty()) return 0;

        Collections.sort(boxes, new Comparator<Box>() {
            @Override
            public int compare(Box b1, Box b2) {
                return Integer.compare(b2.height, b1.height);
            }
        });

        int[] stackMap = new int[boxes.size()];
        int maxHeight = 0;

        for (int i = 0; i < boxes.size(); i++) {
            int height = createStackHelper(boxes, i, stackMap);
            maxHeight = Math.max(maxHeight, height);
        }

        return maxHeight;
    }

    private static int createStackHelper(List<Box> boxes, int bottomIndex, int[] stackMap) {
        if (bottomIndex < boxes.size() && stackMap[bottomIndex] > 0) {
            return stackMap[bottomIndex];
        }

        Box bottom = boxes.get(bottomIndex);
        int maxSubHeight = 0;

        for (int i = bottomIndex + 1; i < boxes.size(); i++) {
            if (boxes.get(i).canBeAbove(bottom)) {
                int height = createStackHelper(boxes, i, stackMap);
                maxSubHeight = Math.max(maxSubHeight, height);
            }
        }

        int totalHeight = maxSubHeight + bottom.height;
        stackMap[bottomIndex] = totalHeight;
        return totalHeight;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N^2)` | सॉर्टिंग $O(N \log N)$ और मेमोइज़्ड पुनरावृत्ति में जोड़े $(i, j)$ का मूल्यांकन। |
| सहायक मेमोरी | `O(N)` | १D मेमोइज़ेशन ऐरे और $O(N)$ कॉल स्टैक गहराई। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: ३D बिन पैकिंग

१. **अमेज़न वेयरहाउस लॉजिस्टिक्स:** स्थिरता बाधाओं के तहत कंटेनरों की मात्रा घनत्व को अधिकतम करने के लिए ३D बॉक्स स्टैकिंग।
२. **कंपाइलर में DAG शेड्यूलिंग:** सीपीयू पाइपलाइन लेटेंसी को न्यूनतम करने के लिए नोड ऊंचाई का मूल्यांकन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई बॉक्स स्टैक नहीं हो सकता:** सबसे बड़े एकल बॉक्स की ऊंचाई लौटाना।
२. **खाली सूची:** ० लौटाना।
