---
title: "प्रतिच्छेदन (Intersection): 2D कम्प्यूटेशनल ज्यामिति में रेखा खंड प्रतिच्छेदन (सीटीसीआई १६.३)"
description: "क्रैमर के नियम (Cramer's Rule), डिटरमिनेंट्स और बाउंडिंग बॉक्स विश्लेषण का उपयोग करके दो रेखा खंडों का सटीक २डी प्रतिच्छेदन बिंदु ज्ञात करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-3-intersection.webp
previewImage: /assets/images/ctci-16-3-intersection.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** दो सीधे रेखा खंड दिए गए हैं (प्रत्येक को प्रारंभ और समाप्ति बिंदु के रूप में दर्शाया गया है), यदि कोई हो तो सटीक प्रतिच्छेदन बिंदु की गणना करें।
> * **मुख्य समाधान:** **रैखिक बीजगणित डिटरमिनेंट (क्रैमर का नियम) + बाउंडिंग बॉक्स जांच**:
>   1. रेखाओं को मानक रूप $A_1 x + B_1 y = C_1$ और $A_2 x + B_2 y = C_2$ में बदलें।
>   2. डिटरमिनेंट $\Delta = A_1 B_2 - A_2 B_1$ की गणना करें।
>   3. **समानांतर या संरेखीय रेखाएं ($\Delta = 0$)**: यदि संरेखीय हैं, तो ओवरलैपिंग अंतराल की जांच करें और पहला बिंदु लौटाएं।
>   4. **प्रतिच्छेदी रेखाएं ($\Delta \neq 0$)**: क्रैमर के नियम से $(x, y)$ निकालें और जांचें कि क्या बिंदु **दोनों** खंडों के बाउंडिंग बॉक्स में स्थित है।
>   5. यह **$O(1)$ समय** और **$O(1)$ स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** गेम इंजन (Ray Tracing) और जीआईएस स्थानिक इंडेक्सिंग (PostGIS)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.३) में पूछा गया है:

*"दो २डी रेखा खंडों के बीच प्रतिच्छेदन बिंदु की गणना करें, जिसमें समानांतर, लंबवत और संरेखीय स्थितियों को सुरक्षित रूप से संभाला गया हो।"*

## २. डिटरमिनेंट्स और क्रैमर का नियम

$$\Delta = (p_2.y - p_1.y)(p_3.x - p_4.x) - (p_4.y - p_3.y)(p_1.x - p_2.x)$$

यदि $\Delta \neq 0$ है, तो क्रैमर के नियम द्वारा समीकरणों को हल करके $(x, y)$ प्राप्त किया जाता है और सीमाओं का सत्यापन किया जाता है।

## प्रोडक्शन कार्यान्वयन

```java
public class LineIntersection {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public static Point intersection(Point p1, Point p2, Point p3, Point p4) {
        double a1 = p2.y - p1.y;
        double b1 = p1.x - p2.x;
        double c1 = a1 * p1.x + b1 * p1.y;

        double a2 = p4.y - p3.y;
        double b2 = p3.x - p4.x;
        double c2 = a2 * p3.x + b2 * p3.y;

        double delta = a1 * b2 - a2 * b1;
        double epsilon = 1e-9;

        if (Math.abs(delta) < epsilon) {
            if (Math.abs(a1 * p3.x + b1 * p3.y - c1) < epsilon) {
                return getCollinearOverlap(p1, p2, p3, p4);
            }
            return null;
        }

        double x = (b2 * c1 - b1 * c2) / delta;
        double y = (a1 * c2 - a2 * c1) / delta;
        Point pt = new Point(x, y);

        if (isBetween(p1, pt, p2) && isBetween(p3, pt, p4)) {
            return pt;
        }
        return null;
    }

    private static boolean isBetween(Point start, Point middle, Point end) {
        double epsilon = 1e-9;
        return middle.x >= Math.min(start.x, end.x) - epsilon &&
               middle.x <= Math.max(start.x, end.x) + epsilon &&
               middle.y >= Math.min(start.y, end.y) - epsilon &&
               middle.y <= Math.max(start.y, end.y) + epsilon;
    }

    private static Point getCollinearOverlap(Point p1, Point p2, Point p3, Point p4) {
        Point left1 = (p1.x < p2.x || (p1.x == p2.x && p1.y < p2.y)) ? p1 : p2;
        Point right1 = (left1 == p1) ? p2 : p1;
        Point left2 = (p3.x < p4.x || (p3.x == p4.x && p3.y < p4.y)) ? p3 : p4;
        Point right2 = (left2 == p3) ? p4 : p3;

        if (isBetween(left1, left2, right1)) return left2;
        if (isBetween(left2, left1, right2)) return left1;
        return null;
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(1)` | प्रत्यक्ष अंकगणितीय मूल्यांकन। |
| सहायक स्पेस | `O(1)` | कोई गतिशील मेमोरी आवंटन नहीं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: फ्लोटिंग-पॉइंट एप्सिलॉन (Epsilon)

१. **एप्सिलॉन सहनशीलता ($\epsilon$):** फ्लोटिंग पॉइंट राउंडिंग त्रुटियों से बचने के लिए सीधे `x == y` तुलना के बजाय `|a - b| < 1e-9` का उपयोग करें।
२. **आर-ट्री (R-Tree) इंडेक्सिंग:** जीआईएस इंजनों में लाखों रेखाओं के प्रतिच्छेदन से पहले उनके न्यूनतम बाउंडिंग आयतों (MBR) की तेजी से जांच की जाती है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **लंबवत रेखाएं:** मानक रूप $Ax + By = C$ अनंत ढलान (Infinite Slope) के कारण होने वाले शून्य से विभाजन त्रुटियों को रोकता है।
