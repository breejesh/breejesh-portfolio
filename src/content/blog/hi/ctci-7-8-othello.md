---
title: "ओथेलो: बोर्ड, रंग, खेल और पलटने के नियम जावा वस्तु-उन्मुख डिज़ाइन में"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.८: ओथेलो (रिवर्सी) का डिज़ाइन बोर्ड, मोहरे का रंग, खेल प्रवाह और कब्जा पलटने की तर्क के साथ। मूल जावा स्केच, किताब की नकल नहीं।"
date: "2025-08-23"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.८: ओथेलो (रिवर्सी) का डिज़ाइन बोर्ड, मोहरे का रंग, खेल प्रवाह और कब्जा पलटने की तर्क के साथ। मूल जावा स्केच, किताब की नकल नहीं।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

**ओथेलो** (रिवर्सी भी कहते हैं) दो खिलाड़ियों का बोर्ड खेल है। हर मोहरा एक तरफ काला और दूसरी तरफ सफेद होता है। जब तुम विरोधी मोहरों को अपनी नई मोहरा और अपनी किसी पुरानी मोहरा के बीच सैंडविच कर देते हो, वे तुम्हारे रंग में पलट जाते हैं। अपनी बारी में कम से कम एक मोहरा कब्जा करना ज़रूरी है। जब किसी के पास वैध चाल नहीं रहती, खेल खत्म। जिसके पास ज़्यादा मोहरे, वही जीतता है।

यह **वस्तु-उन्मुख डिज़ाइन** की समस्या है। इंटरव्यूअर क्लास, ज़िम्मेदारियाँ और साफ पलटने वाला एल्गोरिदम चाहता है, पूरी कृत्रिम बुद्धिमत्ता नहीं। यह पोस्ट शुरुआती लोगों के लिए मूल शिक्षण है, **जावा** स्केच के साथ: `Color`, `Piece`, `Board`, `Player`, `Game`। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, वस्तु-उन्मुख डिज़ाइन।

---

## १. रोज़मर्रा की उपमा

हरा प्लास्टिक बोर्ड और दो तरफा सिक्कों का ढेर सोचो। काला और सफेद बीच में छोटे हीरे की तरह बैठे हैं। तुम अपने रंग का सिक्का ऐसे गिराते हो कि विरोधी रंग की सीधी रेखा को बोर्ड पर पहले से पड़े अपने सिक्के से दबा दे। उस रेखा के हर सिक्के को पलटो। फिर दूसरे की बारी।

डिज़ाइन का काम "ओथेलो के लिए स्टॉकफिश लिखना" नहीं है। काम यह है: ग्रिड किसके पास है, मोहरे का मौजूदा रंग कौन जानता है, चाल वैध है या नहीं कौन तय करता है, और जब वैध चालें खत्म हो जाएँ तो बारी कौन रखता है।

---

## २. समस्या सादे शब्दों में

**ज़ोर से कहने लायक नियम:**

* दो खिलाड़ी: काला और सफेद। मानक बोर्ड **८×८** है (आकार पूछो; कुछ स्केच १०×१० लेते हैं)।
* शुरुआत में बीच में चार मोहरे: दो काले, दो सफेद, बारी-बारी।
* वैध चाल तुम्हारे रंग को **खाली** खाने पर रखती है, ऐसी कि कम से कम एक सीधी रेखा (पंक्ति, स्तंभ या विकर्ण) में नई मोहरा और तुम्हारी दूसरी मोहरा के बीच एक या ज़्यादा विरोधी मोहरे घिर जाएँ।
* उन रेखाओं पर घिरे सभी विरोधी मोहरे **तुम्हारे रंग में पलटते** हैं।
* कम से कम एक मोहरा पलटना ज़रूरी। चाल रहते पास नहीं। अगर चाल नहीं, पास (या दोनों न खेल सकें तो खत्म; जो नियम चुनो साफ बोलो)।
* अंत: किसी तरफ वैध चाल नहीं (या बोर्ड भरा)। विजेता = ज़्यादा अपने रंग के मोहरे। बराबर हो तो ड्रॉ।

**क्लासिक ओथेलो बनाम पतला कथन:** पूरा ओथेलो **आठ** दिशाओं में पलटता है (विकर्ण सहित)। कुछ समस्याएँ सिर्फ बाएँ/दाएँ और ऊपर/नीचे कहती हैं। इंटरव्यू में पूछो। नीचे **आठ दिशाएँ** हैं, क्योंकि असली खेल यही है और यही कठिन मामला है।

**क्या डिज़ाइन करना है:**

* क्लास और एनम
* चाल कैसे जाँची और लागू होती है
* स्कोर और बारी कौन रखता है
* खेल खत्म कब माना जाए

**जब तक न माँगा जाए ज़रूरी नहीं:** मिनीमैक्स कृत्रिम बुद्धिमत्ता, नेटवर्क मल्टीप्लेयर, ग्राफिक्स, पूर्ववत इतिहास।

---

## ३. पहले सोचो

### मुख्य वस्तुएँ

| वस्तु | काम |
| --- | --- |
| `Color` | `BLACK`, `WHITE`, और शायद खानों के लिए `EMPTY` |
| `Piece` | एक मोहरा: मौजूदा रंग, `flip()` |
| `Board` | ग्रिड, चाल रखना, रेखाएँ पलटना, स्कोर गिनती |
| `Player` | रंग, चाल आज़माना |
| `Game` | दो खिलाड़ी, किसकी बारी, शुरू, अंत, विजेता |

### ज़ोर से कहने लायक डिज़ाइन के फैसले

**क्या `BlackPiece` और `WhitePiece` उपक्लास?** आमतौर पर नहीं। मोहरा कई बार पलटता है। हर पलट पर काली वस्तु मिटाकर सफेद बनाना शोर है। एक `Piece` और `Color` फ़ील्ड सादा है।

**क्या `Game` और `Board` अलग?** हाँ, अगर परत सह सकते हो। `Board` ज्यामिति और पलट जानता है। `Game` बारी, पास और "कौन जीता" जानता है। मिलाना छोटे स्केच में चलता है; अलग क्लास इंटरव्यू में साफ पढ़ती हैं।

**स्कोर किसके पास?** `Board` काले/सफेद की चलती गिनती रख सकता है और जोड़ने या पलटने पर अपडेट करे। हर चाल के बाद पूरा ग्रिड स्कैन करना भी ८×८ पर ठीक है (आकार अचर)।

**क्या `Game` सिंगलटन?** वैकल्पिक। एक इंस्टेंस से सब पहुँचना आसान। टेस्ट में दो साथ-साथ खेल चाहिए तो अटपटा। इंटरव्यूअर न धकेले तो सामान्य इंस्टेंस बेहतर।

**खाली खाने:** `Piece[][]` में `null`, या संतरी रंग `EMPTY`। दोनों चलते हैं। `null` सावधानी माँगता है। `EMPTY` वाला `Color` कभी-कभी जाँच साफ करता है।

### पलटने का एल्गोरिदम (कठिन केंद्र)

आठ दिशा सदिश:

```
(-1,-1) (-1,0) (-1,1)
( 0,-1)        ( 0,1)
( 1,-1) ( 1,0) ( 1,1)
```

उम्मीदवार खाना `(r, c)` और रंग `me` के लिए:

१. खाना सीमा में और खाली होना चाहिए।
२. हर दिशा `d` पर:
   * एक कदम: कम से कम एक विरोधी मोहरा चाहिए।
   * जब तक विरोधी मोहरे हों, चलते रहो।
   * फिर अगर `me` का मोहरा मिले, यह दिशा **कब्जा रेखा** है। बीच के खाने जमा करो।
   * अगर `me` से पहले खाली या किनारा मिले, दिशा फेल।
३. कोई दिशा न कब्जा करे तो चाल अवैध।
४. वैध हो: `(r, c)` पर `me` रखो, जमा विरोधी पलटो, स्कोर अपडेट, बारी बदलो।

यही लूप लगभग पूरा खेल है। इंटरफ़ेस उसके चारों ओर सजावट है।

### आरंभ

मानक ८×८ केंद्र (०-आधार पंक्ति/स्तंभ, आकार `n = 8`):

```
(n/2-1, n/2-1) = WHITE
(n/2-1, n/2)   = BLACK
(n/2,   n/2-1) = BLACK
(n/2,   n/2)   = WHITE
```

काला अक्सर पहले चलता है। बोल दो।

---

## ४. जावा समाधान (डिज़ाइन स्केच)

यह शिक्षण कंकाल है, जहाज़ भेजने वाला उत्पाद नहीं। साफ मालिकाना हक और सही पलट महत्वपूर्ण हैं।

### रंग और दिशाएँ

```java
public enum Color {
    BLACK,
    WHITE,
    EMPTY;

    public Color opposite() {
        if (this == BLACK) return WHITE;
        if (this == WHITE) return BLACK;
        return EMPTY;
    }
}

/** Eight rays used by classic Othello / Reversi. */
public final class Directions {
    public static final int[][] DIRS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        { 0, -1},          { 0, 1},
        { 1, -1}, { 1, 0}, { 1, 1}
    };

    private Directions() {}
}
```

### मोहरा

```java
public class Piece {
    private Color color;

    public Piece(Color color) {
        if (color == null || color == Color.EMPTY) {
            throw new IllegalArgumentException("piece needs BLACK or WHITE");
        }
        this.color = color;
    }

    public Color getColor() {
        return color;
    }

    public void flip() {
        color = color.opposite();
    }
}
```

### बोर्ड: रखना, पलटना, स्कोर

```java
import java.util.ArrayList;
import java.util.List;

public class Board {
    private final int size;
    private final Piece[][] grid;
    private int blackCount;
    private int whiteCount;

    public Board(int size) {
        if (size < 2 || size % 2 != 0) {
            throw new IllegalArgumentException("size should be even and >= 2");
        }
        this.size = size;
        this.grid = new Piece[size][size];
    }

    public void initialize() {
        // clear
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                grid[r][c] = null;
            }
        }
        blackCount = 0;
        whiteCount = 0;

        int m = size / 2;
        setPiece(m - 1, m - 1, Color.WHITE);
        setPiece(m - 1, m, Color.BLACK);
        setPiece(m, m - 1, Color.BLACK);
        setPiece(m, m, Color.WHITE);
    }

    private void setPiece(int r, int c, Color color) {
        grid[r][c] = new Piece(color);
        if (color == Color.BLACK) blackCount++;
        else whiteCount++;
    }

    public boolean inBounds(int r, int c) {
        return r >= 0 && r < size && c >= 0 && c < size;
    }

    public Color colorAt(int r, int c) {
        if (!inBounds(r, c) || grid[r][c] == null) return Color.EMPTY;
        return grid[r][c].getColor();
    }

    /**
     * Returns cells that would flip if me plays at (r, c).
     * Empty list means illegal move.
     */
    public List<int[]> capturesIfPlace(int r, int c, Color me) {
        List<int[]> all = new ArrayList<>();
        if (!inBounds(r, c) || grid[r][c] != null || me == Color.EMPTY) {
            return all;
        }
        Color opp = me.opposite();

        for (int[] d : Directions.DIRS) {
            int nr = r + d[0];
            int nc = c + d[1];
            List<int[]> line = new ArrayList<>();

            // need at least one opponent
            while (inBounds(nr, nc) && colorAt(nr, nc) == opp) {
                line.add(new int[] { nr, nc });
                nr += d[0];
                nc += d[1];
            }

            // line ends with our color
            if (!line.isEmpty() && inBounds(nr, nc) && colorAt(nr, nc) == me) {
                all.addAll(line);
            }
        }
        return all;
    }

    public boolean isLegalMove(int r, int c, Color me) {
        return !capturesIfPlace(r, c, me).isEmpty();
    }

    /** Place me at (r, c). Returns false if illegal. */
    public boolean place(int r, int c, Color me) {
        List<int[]> flips = capturesIfPlace(r, c, me);
        if (flips.isEmpty()) return false;

        grid[r][c] = new Piece(me);
        if (me == Color.BLACK) blackCount++;
        else whiteCount++;

        for (int[] cell : flips) {
            Piece p = grid[cell[0]][cell[1]];
            Color before = p.getColor();
            p.flip();
            // one less for opponent, one more for me
            if (before == Color.BLACK) {
                blackCount--;
                whiteCount++;
            } else {
                whiteCount--;
                blackCount++;
            }
        }
        return true;
    }

    public boolean hasAnyMove(Color me) {
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                if (isLegalMove(r, c, me)) return true;
            }
        }
        return false;
    }

    public int getScore(Color c) {
        if (c == Color.BLACK) return blackCount;
        if (c == Color.WHITE) return whiteCount;
        return 0;
    }

    public int getSize() {
        return size;
    }
}
```

### खिलाड़ी और खेल

```java
public class Player {
    private final Color color;

    public Player(Color color) {
        this.color = color;
    }

    public Color getColor() {
        return color;
    }
}

public class Game {
    public enum State { RUNNING, BLACK_WINS, WHITE_WINS, DRAW }

    private final Board board;
    private final Player black;
    private final Player white;
    private Color turn;
    private State state;

    public Game(int size) {
        board = new Board(size);
        black = new Player(Color.BLACK);
        white = new Player(Color.WHITE);
        turn = Color.BLACK;
        state = State.RUNNING;
        board.initialize();
    }

    public Color getTurn() {
        return turn;
    }

    public State getState() {
        return state;
    }

    public Board getBoard() {
        return board;
    }

    /**
     * Current player tries (r, c).
     * Returns true if the disc was placed.
     */
    public boolean play(int r, int c) {
        if (state != State.RUNNING) return false;
        if (!board.place(r, c, turn)) return false;
        advanceTurnOrFinish();
        return true;
    }

    private void advanceTurnOrFinish() {
        Color next = turn.opposite();
        if (board.hasAnyMove(next)) {
            turn = next;
            return;
        }
        // opponent must pass
        if (board.hasAnyMove(turn)) {
            // same player moves again
            return;
        }
        // neither can move
        finish();
    }

    private void finish() {
        int b = board.getScore(Color.BLACK);
        int w = board.getScore(Color.WHITE);
        if (b > w) state = State.BLACK_WINS;
        else if (w > b) state = State.WHITE_WINS;
        else state = State.DRAW;
    }
}
```

### छोटी मानसिक जाँच

`initialize()` के बाद ८×८ पर काला कोई वैध शुरुआती चाल खेलता है। `place` को चाहिए:

१. ऐसी खाली रेखाएँ अस्वीकार करे जो सफेद को न घेरें।
२. हर सफल किरण पर ठीक उतने सफेद पलटे जितने घिरे हों।
३. `blackCount + whiteCount` बोर्ड पर मोहरों की संख्या के बराबर रहे।

बाद में अगर सफेद की कोई चाल नहीं और काले की है, काला फिर चले। दोनों न खेल सकें तो `finish()`।

---

## ५. जटिलता

असली खेल में आकार `n` = ८ है, इसलिए व्यवहार में सब अचर समय। अगर `n` सामान्य हो:

| क्रिया | समय | स्थान |
| --- | --- | --- |
| `capturesIfPlace` | सबसे खराब `O(n)` (८ किरणें, हर एक अधिकतम `n` कदम) | पलट सूची के लिए `O(n)` |
| `place` | `O(n)` | `O(n)` |
| `hasAnyMove` | सरल `O(n² · n) = O(n³)` | `O(n)` |
| पूरा खेल (अधिकतम `n²` चालें) | हर बारी सरल `hasAnyMove` से `O(n⁵)` | बोर्ड `O(n²)` |

इंटरव्यू में बोलो: **८×८ बहुत छोटा है**। पलट की शुद्धता घातांकीय चतुराई से ज़्यादा मायने रखती है। अगर अनुकूलन माँगे, हर `place` के बाद वैध चालें पहले से गिनो, या सिर्फ खाली खाने देखो।

---

## ६. किनारे के मामले और गलतियाँ

* **भरे खाने पर चाल:** अवैध।
* **शून्य पलट वाली चाल:** खाली होने पर भी अवैध।
* **किनारे और कोने:** कम दिशाएँ; वही लूप काफ़ी।
* **सिर्फ विकर्ण कब्जा:** आठ दिशाएँ कहो तो चलना चाहिए।
* **विरोधी न खेल सके और तुम खेल सको:** वही रंग फिर; जल्दी खत्म मत करो।
* **दोनों अटके, खाली खाने बाकी:** फिर भी अंत; खाली अपने आप नहीं पलटते।
* **स्कोर बिगड़ना:** पलट पर दोनों गिनती ठीक करो। सिर्फ जीतने वाले रंग को बढ़ाने से आसानी से एक-एक गलती।
* **काले/सफेद उपक्लास:** टालो; रंग अवस्था है, प्रकार नहीं।
* **विकर्ण भूलना** जब असली ओथेलो अपेक्षित हो।
* **बिना पूछे १०×१०** बाँधना; मानक ८×८ है।

आम गलतियाँ:

१. पूरी किरण सहित खाली खाने पलटना।
२. किरण किनारे से टकराए और तुम्हारी बंद करने वाली मोहरा न हो, फिर भी पलटना।
३. सिर्फ एक विरोधी को "छूने" वाली चाल मानना बिना अंत में अपनी मोहरा के।
४. पहला पास आते ही खेल खत्म करना, दूसरे खिलाड़ी को जाँचे बिना।
५. सारे नियम सिर्फ `Player` में रखना ताकि बोर्ड कृत्रिम बुद्धिमत्ता या नेटवर्क चाल को एक ही तरह न जाँच सके।

न्यूनतम धुआँ जाँच:

```java
Game g = new Game(8);
// center is set; try an illegal far corner
System.out.println(g.play(0, 0)); // false
// try a known legal opening for Black on standard setup
// (exact coordinates depend on your center convention; assert isLegalMove first)
Board b = g.getBoard();
for (int r = 0; r < 8; r++) {
    for (int c = 0; c < 8; c++) {
        if (b.isLegalMove(r, c, Color.BLACK)) {
            System.out.println("legal " + r + "," + c);
        }
    }
}
```

---

## ७. दोस्त को समझाने वाला सार

१. ओथेलो ग्रिड पर सैंडविच-और-पलट है। नई मोहरा को विरोधी को सीधी रेखा में अपनी दूसरी मोहरा से घेरना चाहिए।
२. **रंग को डेटा** मानो, हर पलट पर दो उपक्लास नहीं बनाओ।
३. `Board` ग्रिड और पलट की गणित रखता है। `Game` बारी और अंत रखता है।
४. आठ दिशाएँ देखो। दिशा तभी गिनी जाए जब एक या ज़्यादा विरोधी पार करके खुद से मिलो।
५. अवैध = खाली खाना, शून्य कब्जा रेखा। वैध = रखो, पलटो, स्कोर अपडेट।
६. विरोधी की चाल न हो तो तुम फिर खेल सकते हो। दोनों न खेल सकें तो गिनती मिलाओ।

अगर कागज़ पर किरण की चाल खींच सको और बता सको किस क्लास की है, समस्या ७.८ तुम्हारी है। यहाँ वस्तु डिज़ाइन ज्यादातर यही है: पलट तर्क एक जगह रखो, बारी के नियम सादे रखो।

---

## सीरीज़

* गाइड: [सीटीसीआई सीरीज़ गाइड](/blog/hi/ctci-series-guide)
* पिछला: [चैट सर्वर](/blog/hi/ctci-7-7-chat-server)
* अगला: [वृत्ताकार सरणी](/blog/hi/ctci-7-9-circular-array)