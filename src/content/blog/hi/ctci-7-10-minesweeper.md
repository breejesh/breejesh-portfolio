---
title: "माइनस्वीपर (Minesweeper): ऑब्जेक्ट-ओरिएंटेड ग्रिड इंजन और पुनरावर्ती फ्लड फिल (सीटीसीआई ७.१०)"
description: "यादृच्छिक बम प्लेसमेंट, पड़ोसी खान गणना और पुनरावर्ती खाली-सेल फ्लड फिल के साथ माइनस्वीपर गेम का O(R * C) समय में ऑब्जेक्ट-ओरिएंटेड कार्यान्वयन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक टेक्स्ट-आधारित माइनस्वीपर गेम डिज़ाइन और लागू करें। $N \times N$ ग्रिड में $B$ छिपे हुए बम हैं। बम पर क्लिक करने से हार होती है। खाली सेल पर क्लिक करने पर आसन्न बमों की संख्या दिखाई देती है। यदि वह संख्या ० है, तो आसपास के सेल पुनरावर्ती रूप से (फ्लड फिल) खुल जाते हैं।
> * **मुख्य समाधान:** **पुनरावर्ती BFS / DFS फ्लड-फिल ग्रिड इंजन**: (१) सेल स्थिति, बम स्थिति, अनावरित स्थिति और पड़ोसी बमों की संख्या को ट्रैक करने वाला `Cell` मॉडल; (२) $R \times C$ ग्रिड `Board` जो $B$ बमों को शफल करता है और पड़ोसी गणनाएं प्रीकंप्यूट करता है; (३) `clickCell()` जो ० मान वाले सेल पर $O(R \times C)$ समय और स्पेस में BFS फ्लड-फिल चलाता है; (४) गेम अवस्था (`RUNNING`, `WON`, `LOST`) का प्रबंधन करने वाला `Game` नियंत्रक।
> * **रियल-वर्ल्ड सिस्टम:** ग्राफिक्स एडिटर्स में पेंट बकेट टूल (Photoshop) और जीआईएस जल निकासी मॉडल।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.१०) में पूछा गया है:

*"माइनस्वीपर खेल के लिए ऑब्जेक्ट-ओरिएंटेड क्लास संरचना और खाली सेलों के पुनरावर्ती विस्तार के लिए एल्गोरिदम लागू करें।"*

## २. ऑब्जेक्ट-ओरिएंटेड क्लास संरचना

१. **`Cell`:** सेल निर्देशांक, बम स्थिति, खुली स्थिति और आसन्न बम काउंटर।
२. **`Board`:** $R \times C$ मैट्रिक्स, यादृच्छिक बम वितरण और बीएफएस (BFS) फ्लड-फिल विस्तार।
३. **`Game`:** खेल की जीत/हार अवस्था का प्रबंधन।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.Random;

public class MinesweeperGame {
    public enum GameState { RUNNING, WON, LOST }

    public static class Cell {
        private final int row;
        private final int col;
        private boolean isBomb = false;
        private boolean isExposed = false;
        private int adjacentMines = 0;

        public Cell(int r, int c) { this.row = r; this.col = c; }
        public boolean isBomb() { return isBomb; }
        public void setBomb(boolean bomb) { this.isBomb = bomb; }
        public boolean isExposed() { return isExposed; }
        public void expose() { this.isExposed = true; }
        public boolean isBlank() { return adjacentMines == 0; }
        public int getAdjacentMines() { return adjacentMines; }
        public void setAdjacentMines(int count) { this.adjacentMines = count; }
    }

    public static class Board {
        private final int rows;
        private final int cols;
        private final int totalBombs;
        private final Cell[][] cells;
        private int unexposedRemaining;

        public Board(int rows, int cols, int bombs) {
            this.rows = rows;
            this.cols = cols;
            this.totalBombs = bombs;
            this.unexposedRemaining = (rows * cols) - bombs;
            this.cells = new Cell[rows][cols];

            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    cells[r][c] = new Cell(r, c);
                }
            }
            placeBombs();
            calculateNeighborCounts();
        }

        private void placeBombs() {
            Random rand = new Random();
            int placed = 0;
            while (placed < totalBombs) {
                int r = rand.nextInt(rows);
                int c = rand.nextInt(cols);
                if (!cells[r][c].isBomb()) {
                    cells[r][c].setBomb(true);
                    placed++;
                }
            }
        }

        private void calculateNeighborCounts() {
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (!cells[r][c].isBomb()) {
                        int count = 0;
                        for (int dr = -1; dr <= 1; dr++) {
                            for (int dc = -1; dc <= 1; dc++) {
                                int nr = r + dr, nc = c + dc;
                                if (inBounds(nr, nc) && cells[nr][nc].isBomb()) {
                                    count++;
                                }
                            }
                        }
                        cells[r][c].setAdjacentMines(count);
                    }
                }
            }
        }

        private boolean inBounds(int r, int c) {
            return r >= 0 && r < rows && c >= 0 && c < cols;
        }

        public GameState clickCell(int r, int c) {
            if (!inBounds(r, c) || cells[r][c].isExposed()) return GameState.RUNNING;

            Cell cell = cells[r][c];
            if (cell.isBomb()) {
                cell.expose();
                return GameState.LOST;
            }

            Queue<Cell> queue = new LinkedList<>();
            cell.expose();
            unexposedRemaining--;
            queue.add(cell);

            while (!queue.isEmpty()) {
                Cell curr = queue.poll();
                if (curr.isBlank()) {
                    for (int dr = -1; dr <= 1; dr++) {
                        for (int dc = -1; dc <= 1; dc++) {
                            int nr = curr.row + dr, nc = curr.col + dc;
                            if (inBounds(nr, nc) && !cells[nr][nc].isExposed() && !cells[nr][nc].isBomb()) {
                                cells[nr][nc].expose();
                                unexposedRemaining--;
                                queue.add(cells[nr][nc]);
                            }
                        }
                    }
                }
            }

            return unexposedRemaining == 0 ? GameState.WON : GameState.RUNNING;
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| क्लिक समय | `O(R * C)` | सबसे खराब स्थिति में बीएफएस (BFS) सभी सुरक्षित सेलों को एक बार देखता है। |
| सहायक मेमोरी | `O(R * C)` | ग्रिड मैट्रिक्स और बीएफएस कतार मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: फ्लड-फिल इंजन

१. **ग्राफिक्स पेंट बकेट टूल (Photoshop):** एक समान रंग वाले सन्निहित पिक्सेल क्षेत्रों को भरने के लिए स्कैनलाइन फ्लड फिल।
२. **जीआईएस बाढ़ मॉडलिंग:** डिजिटल ऊंचाई मॉडल पर जल प्रवाह का सिमुलेशन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **सीमा सुरक्षा:** `inBounds(r, c)` सरणी इंडेक्स अपवादों से बचाता है।
