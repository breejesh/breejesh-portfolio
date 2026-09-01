---
title: "सर्वोत्तम रेखा (Best Line): ढलान हैशिंग द्वारा अधिकतम संरेखीय बिंदु (सीटीसीआई १६.१४)"
description: "अंकगणितीय GCD द्वारा सरलीकृत परिमेय भिन्न ढलान हैशिंग का उपयोग करके अधिकतम बिंदुओं से गुजरने वाली २डी सीधी रेखा खोजने का O(N^2) एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-14-best-line.webp
previewImage: /assets/images/ctci-16-14-best-line.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** २डी ग्राफ पर बिंदुओं का एक सेट दिया गया है, एक ऐसी सीधी रेखा खोजें जो सबसे अधिक बिंदुओं से होकर गुजरती हो।
> * **मुख्य समाधान:** **सटीक परिमेय ढलान (Rational Slope) हैशिंग**:
>   1. **फ्लोटिंग पॉइंट त्रुटि से बचाव**: `double` ढलान में राउंडिंग गलतियों से बचने के लिए ढलान को $\frac{\Delta y}{\Delta x}$ भिन्न के रूप में $\gcd(\Delta x, \Delta y)$ से विभाजित करके संग्रहीत करें।
>   2. **एंकर बिंदु पुनरावृत्ति**: प्रत्येक बिंदु $P_i$ के लिए, अन्य सभी बिंदुओं $P_j$ के साथ ढलान की गणना करें और `HashMap<SlopeFraction, Integer>` में आवृत्ति ट्रैक करें।
>   3. यह **$O(N^2)$ समय** और **$O(N)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** कंप्यूटर विज़न (Hough Transform) और स्वायत्त वाहनों में LiDAR पॉइंट-क्लाउड फिटिंग (RANSAC)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.१४) में पूछा गया है:

*"२डी तल पर स्थित बिंदुओं के समूह में से अधिकतम संरेखीय (Collinear) बिंदुओं से गुजरने वाली रेखा की पहचान करें।"*

## २. जीसीडी (GCD) परिमेय ढलान हैशिंग

भिन्न को उसके महत्तम समापवर्तक (GCD) द्वारा सरल करके, समान दिशा वाली रेखाएं हैश मैप में सटीक रूप से एक ही कुंजी साझा करती हैं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class BestLine {

    public static class Point {
        public final int x, y;
        public Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class SlopeFraction {
        public final int dy, dx;

        public SlopeFraction(int dy, int dx) {
            if (dx == 0) {
                this.dy = 1; this.dx = 0;
            } else if (dy == 0) {
                this.dy = 0; this.dx = 1;
            } else {
                int g = gcd(Math.abs(dy), Math.abs(dx));
                int sign = (dx < 0) ? -1 : 1;
                this.dy = (dy / g) * sign;
                this.dx = (dx / g) * sign;
            }
        }

        private static int gcd(int a, int b) {
            while (b != 0) {
                int temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SlopeFraction)) return false;
            SlopeFraction that = (SlopeFraction) o;
            return dy == that.dy && dx == that.dx;
        }

        @Override
        public int hashCode() {
            return Objects.hash(dy, dx);
        }
    }

    public static int findBestLine(Point[] points) {
        if (points == null || points.length == 0) return 0;
        if (points.length <= 2) return points.length;

        int maxCollinear = 0;

        for (int i = 0; i < points.length; i++) {
            Map<SlopeFraction, Integer> slopeCounts = new HashMap<>();
            int duplicates = 1;
            int localMax = 0;

            for (int j = i + 1; j < points.length; j++) {
                int dx = points[j].x - points[i].x;
                int dy = points[j].y - points[i].y;

                if (dx == 0 && dy == 0) {
                    duplicates++;
                    continue;
                }

                SlopeFraction slope = new SlopeFraction(dy, dx);
                int count = slopeCounts.getOrDefault(slope, 0) + 1;
                slopeCounts.put(slope, count);
                localMax = Math.max(localMax, count);
            }

            maxCollinear = Math.max(maxCollinear, localMax + duplicates);
        }

        return maxCollinear;
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N^2)` | $N(N-1)/2$ जोड़ीदार ढलान गणनाएं। |
| सहायक स्पेस | `O(N)` | प्रति एंकर बिंदु हैश मैप। |
| सटीकता | `१००% सटीक` | फ्लोटिंग पॉइंट ड्रिफ्ट के बिना पूर्णांक भिन्न। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: कंप्यूटर विज़न और LiDAR

१. **हफ ट्रांसफॉर्म (Hough Transform):** OpenCV में डिजिटल छवियों से रेखाओं का पता लगाने के लिए पिक्सल को पैरामीटर स्पेस में मैप करना।
२. **RANSAC एल्गोरिदम:** स्वायत्त वाहनों में लाखों LiDAR बिंदुओं में से सड़क सतह को सब-लीनियर समय में निकालना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **डुप्लीकेट बिंदु:** `duplicates` काउंटर द्वारा सुरक्षित रूप से जोड़े जाते हैं।
