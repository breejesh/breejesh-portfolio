---
title: "ओथेलो (Othello): ऑब्जेक्ट-ओरिएंटेड गेम आर्किटेक्चर और डायरेक्शनल फ्लिप लॉजिक (सीटीसीआई ७.८)"
description: "८-दिशात्मक रेकास्टिंग और टर्न-आधारित स्कोरिंग के साथ ओथेलो (रिवर्सि) गेम इंजन के लिए O(१) समय में ऑब्जेक्ट-ओरिएंटेड क्लास डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ओथेलो में प्रत्येक गोटी एक तरफ सफेद और दूसरी तरफ काली होती है। जब कोई गोटी विपरीत रंग की गोटियों से क्षैतिज, लंबवत या तिरछी रेखा में घिर जाती है, तो वह पलट जाती है। खेल डिज़ाइन करें।
> * **मुख्य समाधान:** **दिशात्मक रेकास्टिंग बोर्ड आर्किटेक्चर**: (१) एनम `Color` (`Black`, `White`) और `Direction` (८ दिशाएं); (२) गोटी मॉडल `Piece` और पलटने की विधि `flip()`; (३) $8 \times 8$ ग्रिड में `placeColor()` जो घिरी हुई विरोधी गोटियों को पहचानने और पलटने के लिए सभी ८ दिशाओं में रे-वेक्टर प्रोजेक्ट करता है; (४) नियंत्रक `Game` जो $O(१)$ समय में स्कोर और बारी का प्रबंधन करता है।
> * **रियल-वर्ल्ड सिस्टम:** टर्न-आधारित बोर्ड गेम इंजन (शतरंज / गो) और मिनिमेक्स (Minimax) निर्णय ट्री।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.८) में पूछा गया है:

*"ओथेलो (रिवर्सि) गेम के लिए ऑब्जेक्ट-ओरिएंटेड डेटा संरचनाएं और सभी ८ दिशाओं में गोटियों को पलटने का तर्क लागू करें।"*

## २. ऑब्जेक्ट-ओरिएंटेड क्लास संरचना

१. **`Color` & `Direction` (Enums):** सफेद/काला रंग और ८ दिशात्मक डेल्टा निर्देशांक।
२. **`Piece`:** बोर्ड पर मौजूद गोटी और उसका `flip()` ऑपरेशन।
३. **`Board`:** $8 \times 8$ ग्रिड, स्कोर काउंटर और `placeColor()` रेकास्टिंग।
४. **`Game`:** खिलाड़ियों की बारी और खेल समाप्ति का नियंत्रण।

## प्रोडक्शन कार्यान्वयन

```java
public class OthelloGame {
    public enum Color {
        White, Black;
        public Color getOpposite() { return this == White ? Black : White; }
    }

    public enum Direction {
        UP(-1, 0), DOWN(1, 0), LEFT(0, -1), RIGHT(0, 1),
        UP_LEFT(-1, -1), UP_RIGHT(-1, 1), DOWN_LEFT(1, -1), DOWN_RIGHT(1, 1);

        public final int dRow;
        public final int dCol;
        Direction(int dr, int dc) { this.dRow = dr; this.dCol = dc; }
    }

    public static class Piece {
        private Color color;
        public Piece(Color c) { this.color = c; }
        public void flip() { color = color.getOpposite(); }
        public Color getColor() { return color; }
    }

    public static class Board {
        public static final int ROWS = 8;
        public static final int COLS = 8;
        private final Piece[][] board = new Piece[ROWS][COLS];
        private int blackCount = 2;
        private int whiteCount = 2;

        public Board() {
            board[3][3] = new Piece(Color.White);
            board[3][4] = new Piece(Color.Black);
            board[4][3] = new Piece(Color.Black);
            board[4][4] = new Piece(Color.White);
        }

        public boolean placeColor(int row, int col, Color color) {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col] != null) {
                return false;
            }

            int flipped = 0;
            for (Direction dir : Direction.values()) {
                flipped += flipSection(row, col, color, dir);
            }

            if (flipped <= 0) return false;

            board[row][col] = new Piece(color);
            if (color == Color.Black) {
                blackCount += flipped + 1;
                whiteCount -= flipped;
            } else {
                whiteCount += flipped + 1;
                blackCount -= flipped;
            }
            return true;
        }

        private int flipSection(int row, int col, Color color, Direction dir) {
            int r = row + dir.dRow;
            int c = col + dir.dCol;
            int count = 0;

            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] != null) {
                if (board[r][c].getColor() == color) {
                    if (count == 0) return 0;
                    int currR = row + dir.dRow;
                    int currC = col + dir.dCol;
                    while (currR != r || currC != c) {
                        board[currR][currC].flip();
                        currR += dir.dRow;
                        currC += dir.dCol;
                    }
                    return count;
                }
                count++;
                r += dir.dRow;
                c += dir.dCol;
            }
            return 0;
        }

        public int getBlackCount() { return blackCount; }
        public int getWhiteCount() { return whiteCount; }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| चाल चलना | `O(१)` | निश्चित $8 \times 8$ ग्रिड में अधिकतम ६४ सेल्स का निरीक्षण। |
| सहायक मेमोरी | `O(१)` | निश्चित $8 \times 8$ ग्रिड मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: गेम इंजन और बिटबोर्ड

१. **बिटबोर्ड आर्किटेक्चर:** $8 \times 8$ बोर्ड को दो ६४-बिट पूर्णांकों (`long`) में समाहित करके बिटवाइज़ शिफ्ट द्वारा समानांतर चाल गणना।
२. **मिनिमेक्स एआई मूल्यांकन:** स्थिर कोनों और गतिशीलता का अनुमान।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अवैध चाल:** कोई भी गोटी न पलटने पर सुरक्षित रूप से `false` लौटाना।
