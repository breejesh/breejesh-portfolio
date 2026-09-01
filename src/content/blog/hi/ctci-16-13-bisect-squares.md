---
title: "वर्गों का द्विभाजन (Bisect Squares): केंद्र बिंदु ज्यामिति और दोहरा क्षेत्रफल विभाजन (सीटीसीआई १६.१३)"
description: "दो २डी अक्ष-संरेखित वर्गों को उनके ज्यामितीय केंद्रों (Centroids) को जोड़कर और बाहरी सीमाओं को काटकर ठीक आधे हिस्से में बांटने वाली रेखा का O(1) एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** २डी तल पर दो वर्ग दिए गए हैं (जिनके ऊपर और नीचे के किनारे x-अक्ष के समानांतर हैं), एक ऐसी रेखा खोजें जो इन दोनों वर्गों को ठीक आधे हिस्से में काटती हो।
> * **ज्यामितीय सफलता:** **दोहरे केंद्र बिंदु संरेखण (Centroid Collinearity)**:
>   1. किसी भी वर्ग के सटीक ज्यामितीय केंद्र से गुजरने वाली कोई भी सीधी रेखा उसके क्षेत्रफल को ठीक दो बराबर भागों में विभाजित करती है।
>   2. इसलिए वर्ग १ के केंद्र ($C_1$) और वर्ग २ के केंद्र ($C_2$) को जोड़ने वाली अनूठी रेखा **दोनों वर्गों को एक साथ विभाजित करती है**।
>   3. रेखा के बिंदुओं को दोनों वर्गों की बाहरी परिधि सीमाओं तक बढ़ाएं।
>   4. यह **$O(1)$ समय** और **$O(1)$ स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** जीआईएस स्थानिक बहुभुज विभाजन (PostGIS) और भौतिकी इंजनों में टकराव विभाजन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.१३) में पूछा गया है:

*"दो २डी अक्ष-संरेखित वर्गों को समान क्षेत्रफल वाले दो हिस्सों में काटने वाले रेखा खंड की गणना करें।"*

## २. केंद्र बिंदु (Centroid) ज्यामिति

$$C = \left(x_{\text{left}} + \frac{\text{size}}{2}, y_{\text{bottom}} + \frac{\text{size}}{2}\right)$$

ढलान $m = \frac{C_2.y - C_1.y}{C_2.x - C_1.x}$ सार्वभौमिक विभाजक रेखा को परिभाषित करता है।

## प्रोडक्शन कार्यान्वयन

```java
public class BisectSquares {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class Square {
        public final double left, right, top, bottom, size;

        public Square(double left, double top, double size) {
            this.left = left;
            this.top = top;
            this.bottom = top - size;
            this.right = left + size;
            this.size = size;
        }

        public Point middle() {
            return new Point(left + size / 2.0, bottom + size / 2.0);
        }

        public Point getIntersection(Point mid, double slope) {
            if (slope == Double.POSITIVE_INFINITY || slope == Double.NEGATIVE_INFINITY) {
                return new Point(mid.x, top);
            }
            if (Math.abs(slope) <= 1.0) {
                double x = (mid.x >= this.middle().x) ? right : left;
                double y = slope * (x - mid.x) + mid.y;
                return new Point(x, y);
            } else {
                double y = (mid.y >= this.middle().y) ? top : bottom;
                double x = (y - mid.y) / slope + mid.x;
                return new Point(x, y);
            }
        }
    }

    public static class LineSegment {
        public final Point p1, p2;
        public LineSegment(Point p1, Point p2) {
            this.p1 = p1;
            this.p2 = p2;
        }
    }

    public static LineSegment cut(Square sq1, Square sq2) {
        Point c1 = sq1.middle();
        Point c2 = sq2.middle();

        if (c1.x == c2.x && c1.y == c2.y) {
            return new LineSegment(new Point(c1.x, sq1.top), new Point(c1.x, sq2.bottom));
        }

        double slope = (c1.x == c2.x) ? Double.POSITIVE_INFINITY : (c2.y - c1.y) / (c2.x - c1.x);

        return new LineSegment(sq1.getIntersection(c1, slope), sq2.getIntersection(c2, slope));
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(1)` | प्रत्यक्ष ज्यामितीय बिंदु और ढलान गणनाएं। |
| सहायक स्पेस | `O(1)` | स्थिर मेमोरी उपयोग। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: जीआईएस में बहुभुज विभाजन

१. **कम्प्यूटेशनल ज्यामिति (PostGIS):** उत्तल बहुभुजों के केंद्र की गणना करके भूखंडों को समान क्षेत्रफल वाले ज़ोन में विभाजित करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **लंबवत केंद्र संरेखण ($C_1.x = C_2.x$):** अनंत ढलान की स्थिति में लंबवत रेखा द्वारा सुरक्षित विभाजन।
