---
title: "ग्रिड में रोबोट (Robot in a Grid): मेमोइज़्ड बैकट्रैकिंग से भूलभुलैया पाथफाइंडिंग (सीटीसीआई ८.२)"
description: "बाधाओं वाले r x c ग्रिड में दाएं और नीचे चलने वाले रोबोट के लिए मेमोइज़्ड DFS बैकट्रैकिंग द्वारा O(R * C) समय में वैध मार्ग की खोज।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कल्पना कीजिए कि $r$ पंक्तियों और $c$ स्तंभों वाले ग्रिड के शीर्ष-बाएं कोने पर एक रोबोट बैठा है। रोबोट केवल दो दिशाओं (दाएं और नीचे) में चल सकता है, लेकिन कुछ सेल बाधाएं हैं। शीर्ष-बाएं से नीचे-दाएं कोने तक रोबोट के लिए रास्ता खोजने के लिए एक एल्गोरिदम डिज़ाइन करें।
> * **मुख्य समाधान:** **मेमोइज़्ड रिवर्स DFS बैकट्रैकिंग**: (१) गंतव्य $(r-1, c-1)$ से मूल $(0, 0)$ की ओर उल्टी खोज करें; (२) यदि ऊपरी या बाएं सेल से रास्ता संभव है, तो वर्तमान बिंदु जोड़ें; (३) असफल रास्तों को `HashSet<Point> failedPoints` में कैश करें, जिससे समय जटिलता $O(2^{R+C})$ से घटकर **$O(R \times C)$ समय** और **$O(R + C)$ स्पेस** हो जाती है।
> * **रियल-वर्ल्ड सिस्टम:** वेयरहाउस स्वायत्त रोबोट (Amazon Kiva) और वीएलएसआई (VLSI) सर्किट वायर रूटिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.२) में पूछा गया है:

*"बाधाओं वाले r x c ग्रिड में केवल दाएं और नीचे जाकर रोबोट के लिए वैध मार्ग खोजें।"*

## २. डायनामिक प्रोग्रामिंग और `failedPoints` प्रूनिंग

मेमोइज़ेशन के बिना, बार-बार समान उप-समस्याओं की गणना करने से घातीय जटिलता ($O(2^{R+C})$) उत्पन्न होती है।

एक `failedPoints` हैश सेट में उन सभी बिंदुओं को रिकॉर्ड करके जहाँ से शुरुआत तक नहीं पहुँचा जा सकता, भविष्य में उन सेलों पर आने पर खोज तुरंत $O(१)$ समय में समाप्त हो जाती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Objects;

public class RobotInGrid {
    public static class Point {
        public final int row;
        public final int col;

        public Point(int r, int c) { this.row = r; this.col = c; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Point)) return false;
            Point p = (Point) o;
            return row == p.row && col == p.col;
        }

        @Override
        public int hashCode() { return Objects.hash(row, col); }
    }

    public static ArrayList<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0) return null;
        ArrayList<Point> path = new ArrayList<>();
        HashSet<Point> failedPoints = new HashSet<>();

        if (getPathHelper(maze, maze.length - 1, maze[0].length - 1, path, failedPoints)) {
            return path;
        }
        return null;
    }

    private static boolean getPathHelper(boolean[][] maze, int row, int col,
                                         ArrayList<Point> path, HashSet<Point> failedPoints) {
        if (row < 0 || col < 0 || !maze[row][col]) return false;

        Point p = new Point(row, col);
        if (failedPoints.contains(p)) return false;

        boolean isAtOrigin = (row == 0) && (col == 0);

        if (isAtOrigin || getPathHelper(maze, row - 1, col, path, failedPoints)
                       || getPathHelper(maze, row, col - 1, path, failedPoints)) {
            path.add(p);
            return true;
        }

        failedPoints.add(p);
        return false;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(R * C)` | प्रत्येक सेल को अधिकतम एक बार देखा जाता है। |
| सहायक मेमोरी | `O(R * C)` | असफल बिंदुओं का सेट और कॉल स्टैक $O(R + C)$। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: ग्रिड रूटिंग

१. **वेयरहाउस रोबोटिक्स (Amazon Kiva):** समय-स्थानिक आरक्षण तालिकाओं द्वारा स्वायत्त वाहनों का पथ समन्वय।
२. **वीएलएसआई सर्किट लेआउट:** सिलिकॉन वेफर पर तारों को बिना टकराव के जोड़ने के लिए ली (Lee) का एल्गोरिदम।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **प्रारंभिक या अंतिम सेल बंद होना:** तुरंत `null` लौटाना।
२. **कोई रास्ता न होना:** सुरक्षित रूप से `null` लौटाना।
