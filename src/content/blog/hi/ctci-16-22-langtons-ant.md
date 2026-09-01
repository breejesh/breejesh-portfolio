---
title: "लैंगटन की चींटी (Langton's Ant): अनंत ग्रिड पर सेल्युलर ऑटोमेटा सिमुलेशन (सीटीसीआई १६.२२)"
description: "अनंत २डी तल पर लैंगटन की चींटी के सेल्युलर ऑटोमेटा का समन्वय हैशसेट (Coordinate HashSets) और बाउंडिंग बॉक्स द्वारा O(K) में सिमुलेशन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-22-langton-s-ant.webp
previewImage: /assets/images/ctci-16-22-langton-s-ant.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक चींटी सफेद कोशिकाओं के एक अनंत ग्रिड पर बैठी है। प्रत्येक चरण पर:
>   * सफेद वर्ग पर: वर्ग का रंग बदलकर काला करें, ९० डिग्री दाएं घूमें और एक इकाई आगे बढ़ें।
>   * काले वर्ग पर: वर्ग का रंग बदलकर सफेद करें, ९० डिग्री बाएं घूमें और एक इकाई आगे बढ़ें।
>   * पहले $K$ चालों का अनुकरण करने और अंतिम ग्रिड को प्रिंट करने के लिए एक प्रोग्राम लिखें।
> * **मुख्य समाधान:** **स्पार्स कोऑर्डिनेट हैशसेट और डायनामिक बाउंडिंग बॉक्स**:
>   1. **अनंत तल प्रतिनिधित्व**: असीम तल के लिए निश्चित २डी सरणी के बजाय केवल सक्रिय काली कोशिकाओं को `HashSet<Position>` में रखें।
>   2. **डायनामिक बाउंडिंग बॉक्स**: केवल विज़िट किए गए आयताकार क्षेत्र को प्रिंट करने के लिए `minRow`, `maxRow`, `minCol`, और `maxCol` को ट्रैक करें।
>   3. यह **$O(K)$ समय** और **$O(K)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** गेम भौतिकी इंजनों में स्थानिक हैशिंग और अराजकता सिद्धांत (Chaos Theory)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.२२) में पूछा गया है:

*"अनंत ग्रिड पर लैंगटन की चींटी के K चरणों का सिमुलेशन करें और परिणामी बोर्ड प्रदर्शित करें।"*

## २. सेल्युलर ऑटोमेटा की कार्यप्रणाली

शुरुआती यादृच्छिक प्रसार के बाद, चींटी १०४ चरणों वाले आवर्ती "हाईवे" पैटर्न में प्रवेश करती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class LangtonsAnt {

    public enum Orientation {
        RIGHT(0, 1), DOWN(1, 0), LEFT(0, -1), UP(-1, 0);

        public final int dRow, dCol;
        Orientation(int dRow, int dCol) {
            this.dRow = dRow; this.dCol = dCol;
        }

        public Orientation turnRight() { return values()[(ordinal() + 1) % 4]; }
        public Orientation turnLeft() { return values()[(ordinal() + 3) % 4]; }
    }

    public static class Position {
        public final int row, col;
        public Position(int row, int col) {
            this.row = row; this.col = col;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Position)) return false;
            Position pos = (Position) o;
            return row == pos.row && col == pos.col;
        }

        @Override
        public int hashCode() {
            return Objects.hash(row, col);
        }
    }

    public static class AntSimulation {
        private int row = 0, col = 0;
        private Orientation orientation = Orientation.RIGHT;
        private final Set<Position> blackCells = new HashSet<>();
        private int minRow = 0, maxRow = 0, minCol = 0, maxCol = 0;

        public void step() {
            Position currentPos = new Position(row, col);
            if (blackCells.contains(currentPos)) {
                blackCells.remove(currentPos);
                orientation = orientation.turnLeft();
            } else {
                blackCells.add(currentPos);
                orientation = orientation.turnRight();
            }

            row += orientation.dRow;
            col += orientation.dCol;

            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
        }

        public void simulate(int k) {
            for (int i = 0; i < k; i++) step();
        }

        public String printBoard() {
            StringBuilder sb = new StringBuilder();
            for (int r = minRow; r <= maxRow; r++) {
                for (int c = minCol; c <= maxCol; c++) {
                    if (r == row && c == col) {
                        sb.append(orientation.name().charAt(0));
                    } else if (blackCells.contains(new Position(r, c))) {
                        sb.append('X');
                    } else {
                        sb.append('_');
                    }
                }
                sb.append('\n');
            }
            return sb.toString();
        }
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(K)` | $K$ चरणों में अमॉर्टाइज़्ड $O(1)$ हैशसेट ऑपरेशंस। |
| सहायक स्पेस | `O(K)` | अधिकतम $K$ सक्रिय काली कोशिकाएं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: गेम भौतिकी में स्थानिक हैशिंग

१. **Box2D स्थानिक हैशिंग:** भौतिकी इंजन खुली दुनिया के सिमुलेशन में असीमित निर्देशांकों को ट्रैक करने के लिए समन्वय हैश तालिकाओं का उपयोग करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **ऋणात्मक निर्देशांक:** `Position` वर्ग द्वारा सुरक्षित रूप से प्रबंधित।
