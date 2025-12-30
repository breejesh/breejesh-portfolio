---
title: "माइनस्वीपर: बोर्ड, सेल, बम, और शून्य का फ्लड फिल (जावा)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.१०: सेल और बोर्ड से टेक्स्ट माइनस्वीपर डिज़ाइन करो, बम रखो, पड़ोसी गिनो, क्लिक नियम, और शून्य खोलने पर फ्लड फिल।"
date: "2025-12-30"
tags: [एल्गोरिदम]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.१०: सेल और बोर्ड से टेक्स्ट माइनस्वीपर डिज़ाइन करो, बम रखो, पड़ोसी गिनो, क्लिक नियम, और शून्य खोलने पर फ्लड फिल।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

एक **टेक्स्ट माइनस्वीपर** डिज़ाइन करो। `N x N` बोर्ड पर `B` बम छिपे हैं। बाकी सेल में या तो संख्या है (आठ पड़ोसियों में कितने बम) या शून्य (खाली)। बम पर क्लिक तो हार। संख्या पर क्लिक तो सिर्फ वही सेल खुले। शून्य पर क्लिक तो बोर्ड फैलता है: वह खाली, हर जुड़े खाली, और उस खाली क्षेत्र के किनारे की संख्याएँ सब खुलती हैं। जिन सेल को बम समझो उन पर झंडा लगाओ ताकि गलती से क्लिक न हो। जितनी सेल बम नहीं हैं वे सब खुल जाएँ तो जीत।

यह पोस्ट **जावा** में बिल्कुल शुरुआती लोगों के लिए मूल शिक्षण है। इंटरव्यू वाली ऑब्जेक्ट-ओरिएंटेड गेम डिज़ाइन का परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, ऑब्जेक्ट-ओरिएंटेड डिज़ाइन: बोर्ड, सेल, बम रखना, शून्य पर फ्लड फिल वाला क्लिक।

---

## १. रोज़मर्रा की उपमा

कागज़ की ग्रिड सोचो, ऊपर चिपचिपे नोट। कुछ के नीचे पिन (बम) है। बाकी के नीचे पास की पिनों की गिनती है, या कुछ नहीं।

एक नोट उतारो:

* नीचे पिन: खेल खत्म।
* संख्या: सिर्फ वही नोट उतरे।
* खाली: जो खाली नोट इससे छूते हैं वे भी उतारो, और उस खाली टुकड़े के किनारे वाली संख्या वाले नोट भी। संख्याओं पर रुक जाओ; संख्या के पार अगले खाली में मत घुसो, जब तक वह खाली शून्यों से पहले से जुड़ा न हो।

खाली का यह फैलाव **फ्लड फिल** है। बोर्ड सेलों की द्वि-आयामी ग्रिड है। गेम ऑब्जेक्ट देखता है कि अभी खेल चल रहा है, हार चुके हो, या जीत चुके हो।

---

## २. समस्या सादे शब्दों में

**लक्ष्य:** खेलने लायक टेक्स्ट माइनस्वीपर की क्लास और विधियाँ।

**मुख्य हिस्से:**

| हिस्सा | भूमिका |
| --- | --- |
| `Cell` | एक वर्ग: बम या नहीं, पड़ोसी गिनती, खुला?, झंडा? |
| `Board` | सेलों की ग्रिड; बम रखे; संख्याएँ निकाले; पलटे / फ्लड फिल |
| `Game` (वैकल्पिक पर साफ) | स्थिति, यूज़र क्लिक/झंडा, जीत/हार, बोर्ड छापना |

**नियम:**

* ग्रिड `N x N` है, ठीक `B` बम (या सामान्य करके `rows x cols`)।
* गैर-बम सेल की संख्या उसके अधिकतम ८ पड़ोसियों में बमों की गिनती है।
* बायाँ क्लिक (खोलना):
  * बम → हार (खुल जाता है; खेल खत्म)।
  * संख्या > ० → सिर्फ वही सेल खुले।
  * संख्या ० → शून्यों का फ्लड फिल, किनारे की संख्याएँ शामिल।
* दायाँ क्लिक (झंडा): छिपे सेल पर झंडा टॉगल। झंडा वाले सेल क्लिक से नहीं खुलते।
* जितनी सेल बम नहीं, सब खुल जाएँ तो जीत। जीत के लिए झंडों का बमों से मिलना ज़रूरी नहीं (क्लासिक नियम: सिर्फ सुरक्षित सेल खुलने चाहिए)।

**इंटरव्यू में साफ करो:**

* पहला क्लिक हमेशा सुरक्षित हो? (अच्छा प्रोडक्ट नियम; क्लासिक बयान में अनिवार्य नहीं।)
* बम रखना: यादृच्छिक अलग-अलग सेल, या टेस्ट के लिए तय सूची?
* टेक्स्ट यूआई छिपा, झंडा, बम, खाली, संख्या कैसे छापे?
* सीमा से बाहर क्लिक: नज़रअंदाज़ या एक्सेप्शन?

**हस्ताक्षर का आकार:**

```java
class Cell { /* bomb, number, exposed, flagged */ }

class Board {
    Board(int n, int bombCount);
    void placeBombs(/* random or seed */);
    void setNumbers();
    // returns true if the click was safe (not a bomb), false if bomb hit
    boolean flipCell(int r, int c);
    void toggleFlag(int r, int c);
    boolean allNonBombsExposed();
    // optional: print for debugging
    void print(boolean revealAll);
}
```

---

## ३. पहले सोचो

### पहले क्लास, बाद में पिक्सेल

इंटरव्यूअर को चमकदार यूआई से ज़्यादा संरचना चाहिए।

* **`Cell`**: एक वर्ग का डेटा। हल्की लॉजिक (गेटर/सेटर, शायद `isBlank()`)।
* **`Board`**: द्वि-आयामी ऐरे, बम रखना, पड़ोसी गिनती, खोलना + फ्लड फिल।
* **`Game`**: लूप, इनपुट, जीत/हार संदेश। `Board` पर पतली परत।

छोटे इंटरव्यू में गेम को बोर्ड में मिला सकते हो। समय हो तो अलग रखना बेहतर।

### पहले बम, फिर पड़ोसी गिनती

क्रम मायने रखता है:

१. सभी सेल गैर-बम, संख्या ०, छिपे, बिना झंडे बनाओ।
२. `B` बम अलग-अलग यादृच्छिक सेलों पर रखो।
३. हर गैर-बम सेल के लिए ८ दिशाओं में बम पड़ोसी गिनो और गिनती रखो।

अगर पहले गिनोगे और बाद में बम रखोगे, हर संख्या गलत होगी।

```
directions (dr, dc):
  (-1,-1) (-1,0) (-1,1)
  ( 0,-1)        ( 0,1)
  ( 1,-1) ( 1,0) ( 1,1)
```

बोर्ड के बाहर निर्देशांक छोड़ो। कोने में ३ पड़ोसी, किनारे पर ५, बीच में ८।

### क्लिक नियम और फ्लड फिल

```
flip(r, c):
  if out of bounds or already exposed or flagged: return (no-op / still safe)
  if cell is bomb: expose it; return false (lose)
  // safe cell
  flood from (r, c) using BFS or DFS
  return true
```

फ्लड फिल (बीएफएस खाका):

१. कतार `(r, c)` से शुरू करो।
२. कतार खाली न हो तब तक सेल लो:
   * पहले से खुला हो तो छोड़ो।
   * खोलो।
   * अगर संख्या **० से बड़ी** हो तो इस सेल से **आगे मत फैलाओ** (यह खाली क्षेत्र का किनारा है)।
   * अगर संख्या **०** हो तो सीमा में रहने वाले ८ छिपे, बिना झंडे पड़ोसी कतार में डालो (बम नहीं; संख्याएँ सही हों तो शून्य बम पर नहीं बैठते)।

यह क्लासिक माइनस्वीपर से मेल खाता है: किनारे की संख्याएँ खुलती हैं, पर फ्लड उनके पार अलग शून्य क्षेत्रों में नहीं घुसता।

### सिर्फ क्लिक वाला शून्य क्यों नहीं?

अगर सिर्फ एक खाली खोलोगे, खेल टूटा लगता है। खिलाड़ी झरना चाहते हैं। इंटरव्यूअर "बीएफएस/डीएफएस फ्लड फिल" जुड़े खाली क्षेत्रों के एल्गोरिदम के रूप में सुनना चाहते हैं।

### झंडे

झंडे यूआई सुरक्षा हैं:

* छिपे सेल पर टॉगल।
* झंडा वाला सेल खोलने वाले क्लिक नज़रअंदाज़ करता है।
* झंडा बम लेआउट या पड़ोसी संख्या नहीं बदलता।
* खोलने से पहले झंडा हटाना पड़ता है।

### जीत की शर्त

सफल फ्लिप के बाद:

* खुली गैर-बम सेल गिनो, या `remaining = N*N - B` रखो और खोलते समय घटाओ।
* `remaining` ० हो तो स्थिति जीत।
* बम पर तुरंत हार।

काउंटर से जीत जाँच ओ(१)। हर क्लिक पर पूरी ग्रिड स्कैन ओ(एन²), छोटे बोर्ड पर ठीक।

### क्या ज़्यादा न बनाओ

* पूरा ग्राफ़िक्स फ्रेमवर्क नहीं चाहिए।
* मल्टीप्लेयर या टाइमर न माँगे तो मत बनाओ।
* "नंबरसेल बनाम बॉमसेल" इनहेरिटेंस शायद ही फायदेमंद; साधारण `boolean isBomb` प्लस `int adjacent` काफी।

---

## ४. जावा समाधान

### सेल

```java
class Cell {
    private final int row;
    private final int col;
    private boolean bomb;
    private boolean exposed;
    private boolean flagged;
    private int adjacentBombs; // 0..8 for non-bombs; unused or 0 for bombs

    Cell(int row, int col) {
        this.row = row;
        this.col = col;
    }

    int getRow() { return row; }
    int getCol() { return col; }

    boolean isBomb() { return bomb; }
    void setBomb(boolean bomb) { this.bomb = bomb; }

    boolean isExposed() { return exposed; }
    void setExposed(boolean exposed) { this.exposed = exposed; }

    boolean isFlagged() { return flagged; }
    void setFlagged(boolean flagged) { this.flagged = flagged; }

    int getAdjacentBombs() { return adjacentBombs; }
    void setAdjacentBombs(int n) { this.adjacentBombs = n; }

    boolean isBlank() {
        return !bomb && adjacentBombs == 0;
    }
}
```

### बोर्ड: बनाना, बम रखना, संख्याएँ सेट

```java
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Queue;
import java.util.Random;
import java.util.Set;

class Board {
    private static final int[][] DIRS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        {0, -1},           {0, 1},
        {1, -1},  {1, 0},  {1, 1}
    };

    private final int n;
    private final int bombCount;
    private final Cell[][] grid;
    private int unexposedSafe; // non-bomb cells still hidden
    private boolean exploded;

    Board(int n, int bombCount, long seed) {
        if (n <= 0) {
            throw new IllegalArgumentException("n must be positive");
        }
        if (bombCount < 0 || bombCount > n * n) {
            throw new IllegalArgumentException("invalid bombCount");
        }
        this.n = n;
        this.bombCount = bombCount;
        this.grid = new Cell[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                grid[r][c] = new Cell(r, c);
            }
        }
        placeBombs(seed);
        setNumbers();
        this.unexposedSafe = n * n - bombCount;
        this.exploded = false;
    }

    private void placeBombs(long seed) {
        Random rng = new Random(seed);
        Set<Integer> used = new HashSet<>();
        while (used.size() < bombCount) {
            int idx = rng.nextInt(n * n);
            if (!used.add(idx)) {
                continue;
            }
            int r = idx / n;
            int c = idx % n;
            grid[r][c].setBomb(true);
        }
    }

    private void setNumbers() {
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c].isBomb()) {
                    continue;
                }
                int count = 0;
                for (int[] d : DIRS) {
                    int nr = r + d[0];
                    int nc = c + d[1];
                    if (inBounds(nr, nc) && grid[nr][nc].isBomb()) {
                        count++;
                    }
                }
                grid[r][c].setAdjacentBombs(count);
            }
        }
    }

    private boolean inBounds(int r, int c) {
        return r >= 0 && r < n && c >= 0 && c < n;
    }

    Cell getCell(int r, int c) {
        return grid[r][c];
    }

    boolean hasExploded() {
        return exploded;
    }

    boolean isWon() {
        return !exploded && unexposedSafe == 0;
    }
}
```

### बोर्ड: झंडा और फ्लड फिल वाला क्लिक

```java
    /** Toggle flag on a hidden cell. No-op if already exposed. */
    void toggleFlag(int r, int c) {
        if (!inBounds(r, c) || exploded || isWon()) {
            return;
        }
        Cell cell = grid[r][c];
        if (cell.isExposed()) {
            return;
        }
        cell.setFlagged(!cell.isFlagged());
    }

    /**
     * Uncover cell (r, c). Returns false if a bomb was hit.
     * Returns true if the click was safe or ignored (flagged / already open).
     */
    boolean flipCell(int r, int c) {
        if (!inBounds(r, c) || exploded || isWon()) {
            return !exploded;
        }
        Cell start = grid[r][c];
        if (start.isExposed() || start.isFlagged()) {
            return true;
        }
        if (start.isBomb()) {
            start.setExposed(true);
            exploded = true;
            return false;
        }

        // BFS flood fill for zeros; expose bordering numbers
        Queue<Cell> q = new ArrayDeque<>();
        q.add(start);

        while (!q.isEmpty()) {
            Cell cur = q.poll();
            if (cur.isExposed() || cur.isFlagged() || cur.isBomb()) {
                continue;
            }
            cur.setExposed(true);
            unexposedSafe--;

            if (cur.getAdjacentBombs() > 0) {
                // number cell: stop expanding through it
                continue;
            }

            // blank (zero): expand to all neighbors
            int cr = cur.getRow();
            int cc = cur.getCol();
            for (int[] d : DIRS) {
                int nr = cr + d[0];
                int nc = cc + d[1];
                if (!inBounds(nr, nc)) {
                    continue;
                }
                Cell next = grid[nr][nc];
                if (!next.isExposed() && !next.isFlagged() && !next.isBomb()) {
                    q.add(next);
                }
            }
        }
        return true;
    }
```

### टेक्स्ट प्रिंट (वैकल्पिक सहायक)

```java
    /**
     * Text view. If revealAll is true, show bombs and numbers regardless of exposed.
     * Hidden: '.', flagged: 'F', bomb: '*', blank: ' ', number: digit char.
     */
    void print(boolean revealAll) {
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < n; c++) {
                Cell cell = grid[r][c];
                char ch;
                if (!revealAll && cell.isFlagged() && !cell.isExposed()) {
                    ch = 'F';
                } else if (!revealAll && !cell.isExposed()) {
                    ch = '.';
                } else if (cell.isBomb()) {
                    ch = '*';
                } else if (cell.getAdjacentBombs() == 0) {
                    ch = ' ';
                } else {
                    ch = (char) ('0' + cell.getAdjacentBombs());
                }
                line.append(ch).append(' ');
            }
            System.out.println(line.toString().trim());
        }
    }
```

### छोटा वॉकथ्रू

मानो ३×३ बोर्ड, एक बम `(1,1)` पर। आसपास की संख्याएँ सब `1`। बीच `*`। बम छूने वाले कोने-किनारे `1` दिखाते हैं। कोई शून्य क्षेत्र नहीं, तो हर सुरक्षित क्लिक ठीक एक सेल खोलता है। आठ सुरक्षित क्लिक जीत; बीच पर क्लिक हार।

अब ५×५ बोर्ड, बम सिर्फ कोनों के पास, बीच शून्यों का समुद्र। बीच पर क्लिक:

१. बीच ० → पड़ोसी कतार में।
२. हर पड़ोसी ० खुलता और फैलता है।
३. उस शून्य झील के किनारे की संख्या सेल एक बार खुलकर फ्लड रोकती हैं।
४. एक क्लिक दर्जनों सेल खोल सकता है। यही वो फीचर है जो इंटरव्यूअर सावधानी से देखना चाहते हैं।

### पूरी यूआई बिना नियत टेस्ट

```java
// fixed seed so bomb layout is stable in unit tests
Board board = new Board(5, 3, 42L);
assert board.flipCell(2, 2); // hope safe; adjust seed if needed
board.toggleFlag(0, 0);
assert !board.hasExploded();
// after enough safe flips:
// assert board.isWon();
```

इंटरव्यू डेमो के लिए यादृच्छिक की जगह तय बम स्थान रखो अगर कहानी स्थिर चाहिए।

```java
// alternative for demos: placeBombsFromList(List of [r,c])
```

---

## ५. जटिलता तालिका

| ऑपरेशन | समय | स्थान नोट |
| --- | --- | --- |
| ग्रिड बनाना | ओ(एन²) | एन² सेल |
| बी बम रखना | अपेक्षित ओ(बी) सेट से; घना हो तो सबसे खराब ओ(एन²) फिर कोशिश | इंडेक्स का सेट |
| `setNumbers` | ओ(एन²) | प्रति सेल ८ पड़ोसी जाँच |
| संख्या पर `flipCell` | ओ(१) | एक सेल खुले |
| बड़े शून्य क्षेत्र पर `flipCell` | खुली के सेलों के लिए ओ(के) (अधिकतम ओ(एन²)) | बीएफएस कतार ओ(के) |
| `toggleFlag` | ओ(१) | |
| काउंटर से जीत | ओ(१) | `unexposedSafe` |
| पूरी स्कैन से जीत | ओ(एन²) | कोई अतिरिक्त फ़ील्ड नहीं |

इंटरव्यू आकार (एन लगभग ८ से ३०) पर ऊपर सब ठीक। फ्लड फिल की सीमा बोलो: "खुली सेलों के अनुपात में काम।"

---

## ६. किनारे के मामले और आम गलतियाँ

इंटरव्यूअर ये छेड़ते हैं:

* **एन = १, बी = १:** अकेली सेल बम। पहला क्लिक हार। बिना खास नियम के जीत असंभव।
* **एन = १, बी = ०:** एक खाली। एक क्लिक और जीत।
* **बी = ०:** पूरा बोर्ड शून्य। एक क्लिक सब फ्लड फिल कर जीत।
* **बी = एन²:** हर सेल बम। कोई सुरक्षित क्लिक नहीं।
* **सीमा से बाहर क्लिक:** नज़रअंदाज़ या थ्रो; ठेका तय करो।
* **झंडा वाले सेल पर क्लिक:** नहीं खुले (पहले झंडा हटाओ)।
* **पहले से खुला क्लिक:** नो-ऑप, फिर भी सुरक्षित।
* **बीएफएस में दो बार खोलना:** `isExposed` से बचाव ताकि `unexposedSafe` दो बार न घटे।
* **संख्याओं के पार फ्लड:** गलत। संख्याएँ खुलती हैं पर पड़ोसी कतार में नहीं जातीं।
* **बमों की ओर फ्लड:** बम सेल कभी कतार में मत डालो। सुरक्षा के लिए `!isBomb()` भी जाँचो।

आम गलतियाँ:

१. **बम रखने से पहले पड़ोसी गिनना।**
२. **सिर्फ ४ दिशाएँ** ८ की जगह (माइनस्वीपर विकर्ण इस्तेमाल करता है)।
३. **सिर्फ क्लिक वाला शून्य खोलना** बिना फ्लड फिल।
४. **संख्याओं के पार** अलग क्षेत्रों में फैलना।
५. **झंडे क्लिक रोकते हैं**, यह भूलना।
६. **सभी बमों पर झंडा** को जीत मानना, जबकि जीत सभी गैर-बम खुलने पर है (क्लासिक जीत सुरक्षित सेल खोलना है)।
७. **कतार में सेल दोबारा आने पर** `unexposedSafe` में एक की गलती।
८. **खेल चलते हुए खिलाड़ी को बम छापना** (डिबग दृश्य बनाम खिलाड़ी दृश्य)।

न्यूनतम स्मोक विचार:

```java
Board empty = new Board(3, 0, 1L);
assert empty.flipCell(1, 1);
assert empty.isWon(); // all zeros opened in one flood

Board one = new Board(1, 1, 1L);
assert !one.flipCell(0, 0);
assert one.hasExploded();
```

---

## ७. दोस्त को समझाने वाला सार

माइनस्वीपर ओओडी समस्या के रूप में तीन बातें हैं:

१. **`Cell`** एक वर्ग के लिए बम, संख्या, खुला, झंडा रखता है।
२. **`Board`** `B` बम रखता है, फिर ८ दिशाओं से पड़ोसी गिनती लिखता है।
३. **क्लिक** या बम पर हार, या एक संख्या खोले, या शून्य क्षेत्र और उसके संख्या किनारे का **बीएफएस/डीएफएस फ्लड फिल**। झंडे सिर्फ गलती क्लिक रोकते हैं। जितनी सेल बम नहीं सब खुल जाएँ तो जीत।

अगर छोटा बोर्ड खींच, बम रख, संख्या भर, और हाथ से फ्लड फिल चला सको, तो समस्या ७.१० तुम्हारी है। इंटरव्यूअर चाहते हैं कि क्लास खेल के संज्ञा नामों से मिलें, और शून्य का फैलाव ग्रिड पर असली खोज हो, अस्पष्ट "पास की सेल खोल दो" नहीं।

---

## सीरीज़

* गाइड: [सीटीसीआई सीरीज़ गाइड](/blog/hi/ctci-series-guide)
* पिछला: [सर्कुलर ऐरे](/blog/hi/ctci-7-9-circular-array)
* अगला: [फाइल सिस्टम](/blog/hi/ctci-7-11-file-system)