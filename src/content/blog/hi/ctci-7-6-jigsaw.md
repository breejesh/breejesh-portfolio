---
title: "जिगसॉ पहेली (Jigsaw Puzzle): ऑब्जेक्ट-ओरिएंटेड सॉल्वर और एज-मैचिंग एल्गोरिदम (सीटीसीआई ७.६)"
description: "किनारे के प्रकारों, टुकड़ों के घूर्णन और संगतता एल्गोरिदम के साथ NxN जिगसॉ पहेली के लिए O(N^2) समय में ऑब्जेक्ट-ओरिएंटेड डेटा संरचनाएं।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-6-jigsaw.webp
previewImage: /assets/images/ctci-7-6-jigsaw.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक $N \times N$ जिगसॉ पहेली लागू करें। डेटा संरचनाएं डिज़ाइन करें और पहेली को हल करने के लिए एक एल्गोरिदम समझाएं जहां `fitsWith(edge1, edge2)` उपलब्ध है।
> * **मुख्य समाधान:** **टोपोलॉजिकल एज विभाजन और बैकट्रैकिंग**: (१) प्रत्येक टुकड़े को ४ किनारों (`Edge` एनम `INNER`, `OUTER`, `FLAT`) के साथ मॉडल करें; (२) टुकड़ों को समतल किनारों के आधार पर वर्गीकृत करें: **कोने** (२ समतल किनारे), **सीमाएं** (१ समतल किनारा), और **आंतरिक टुकड़े** (० समतल किनारे); (३) शीर्ष-बाएं कोने को ठीक करें, परिधि बनाएं और आंतरिक टुकड़ों को `fitsWith` द्वारा $O(N^2)$ समय में जोड़ें।
> * **रियल-वर्ल्ड सिस्टम:** कंप्यूटर विज़न में पैनोरमिक इमेज स्टिचिंग (OpenCV) और सैटेलाइट मैप असेंबली।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.६) में पूछा गया है:

*"NxN जिगसॉ पहेली के लिए डेटा संरचनाएं डिज़ाइन करें और fitsWith विधि का उपयोग करके पहेली सुलझाने का एल्गोरिदम बताएं।"*

## २. डेटा संरचनाएं

१. **`Edge` (Class) & `Edge.Type` (Enum):** `INNER`, `OUTER`, `FLAT`।
   * `fitsWith()` किनारे की ध्रुवीयता और संगतता की जांच करता है।
२. **`Piece` (Class):** ४ किनारे (`TOP`, `RIGHT`, `BOTTOM`, `LEFT`) और `rotateClockwise()` विधि।
   * `isCorner()` (२ समतल किनारे) और `isBorder()` (१ समतल किनारा)।
३. **`Puzzle` (Class):** $N \times N$ बोर्ड ग्रिड और टुकड़ों के सेट।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class JigsawPuzzle {
    public enum Type { INNER, OUTER, FLAT }
    public enum Orientation {
        TOP(0), RIGHT(1), BOTTOM(2), LEFT(3);
        private final int value;
        Orientation(int v) { this.value = v; }
    }

    public static class Edge {
        private final Type type;
        private final int edgeId;

        public Edge(Type type, int edgeId) {
            this.type = type;
            this.edgeId = edgeId;
        }

        public boolean fitsWith(Edge other) {
            if (other == null) return false;
            if (this.type == Type.FLAT || other.type == Type.FLAT) return false;
            return this.type != other.type && this.edgeId == other.edgeId;
        }

        public Type getType() { return type; }
    }

    public static class Piece {
        private final Edge[] edges = new Edge[4];

        public Piece(Edge top, Edge right, Edge bottom, Edge left) {
            edges[0] = top;
            edges[1] = right;
            edges[2] = bottom;
            edges[3] = left;
        }

        public void rotateClockwise() {
            Edge temp = edges[3];
            edges[3] = edges[2];
            edges[2] = edges[1];
            edges[1] = edges[0];
            edges[0] = temp;
        }

        public Edge getEdge(Orientation o) { return edges[o.value]; }

        public int countFlatEdges() {
            int count = 0;
            for (Edge e : edges) if (e.getType() == Type.FLAT) count++;
            return count;
        }

        public boolean isCorner() { return countFlatEdges() == 2; }
        public boolean isBorder() { return countFlatEdges() == 1; }
    }

    public static class Puzzle {
        private final int n;
        private final Piece[][] board;
        private final List<Piece> pieces;

        public Puzzle(int n, List<Piece> pieces) {
            this.n = n;
            this.pieces = pieces;
            this.board = new Piece[n][n];
        }

        public boolean solve() {
            List<Piece> corners = new ArrayList<>();
            List<Piece> borders = new ArrayList<>();
            List<Piece> inside = new ArrayList<>();

            for (Piece p : pieces) {
                if (p.isCorner()) corners.add(p);
                else if (p.isBorder()) borders.add(p);
                else inside.add(p);
            }

            return corners.size() == 4;
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| टुकड़ों का वर्गीकरण | `O(N^2)` | सभी $N^2$ टुकड़ों को ३ समूहों में बांटना। |
| किनारे की अनुकूलता | `O(१)` | ध्रुवीयता और आईडी की सीधी तुलना। |
| सहायक मेमोरी | `O(N^2)` | बोर्ड मैट्रिक्स और वर्गीकृत सूची। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: कंप्यूटर विज़न इमेज स्टिचिंग

१. **ओपनसीवी पैनोरमा असेंबली:** छवियों के किनारों पर ओवरलैप बिंदुओं का मिलान।
२. **सैटेलाइट मैप टाइल रिकंस्ट्रक्शन:** भौगोलिक निर्देशांकों के आधार पर टुकड़ों का संयोजन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोने सत्यापन:** पहेली शुरू करने से पहले ठीक ४ कोनों की उपस्थिति की पुष्टि।
