---
title: "शतरंज परीक्षण (Chess Test): canMoveTo के लिए व्यापक यूनिट टेस्टिंग रणनीति (सीटीसीआई ११.३)"
description: "शतरंज मोहरे के canMoveTo(x, y) सत्यापन विधि के लिए सीमा शर्तों, मोहरा ज्यामिति और चेकमेट इनवेरिएंट्स को कवर करने वाला टेस्टिंग फ्रेमवर्क।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-11-3-chess-test.webp
previewImage: /assets/images/ctci-11-3-chess-test.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** हमारे पास शतरंज के खेल में निम्नलिखित विधि है: `boolean canMoveTo(int x, int y)`। यह विधि `Piece` क्लास का हिस्सा है, जहाँ `x` और `y` बिसात के निर्देशांक ($0 \dots 7$) दर्शाते हैं। आप इस विधि का परीक्षण कैसे करेंगे?
> * **मुख्य समाधान:** **तीन-स्तरीय परीक्षण मैट्रिक्स**: (१) **सीमा और स्थानिक चरम सीमाएं**: बोर्ड से बाहर के निर्देशांक ($(-1, 0), (8, 8)$) और कोने ($(0,0), (7,7)$); (२) **मोहरा-विशिष्ट ज्यामितीय नियम**: प्यादा (दोहरी चाल, तिरछी चाल), घोड़ा (L-चाल, बाधा कूद), ऊंट (तिरछी चाल), हाथी (सीधी चाल), वजीर और राजा (१ कदम और कैसलिंग); (३) **बोर्ड टकराव और गेम स्टेट इनवेरिएंट्स**: अवरुद्ध रास्ते, मित्र मोहरे से टकराव (अवैध), शत्रु मोहरा मारना (वैध), पिन हुए मोहरे और राजा को चेक में डालने वाली चालें।
> * **रियल-वर्ल्ड सिस्टम:** शतरंज इंजन (Stockfish / Lichess) और गेम रूल्स इंजन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ११.३) में पूछा गया है:

*"शतरंज में मोहरे की canMoveTo(x, y) विधि के सत्यापन के लिए एक संपूर्ण यूनिट टेस्ट सूट डिज़ाइन करें।"*

## २. टेस्ट वर्गीकरण मैट्रिक्स

१. **सीमा परीक्षण:** ऋणात्मक निर्देशांक या ७ से बड़े मानों पर `false` लौटना।
२. **मोहरे की चाल ज्यामिति:** घोड़े द्वारा मोहरों के ऊपर से कूदने की क्षमता।
३. **चेक और पिन इनवेरिएंट्स:** पिन किया गया मोहरा राजा को चेक में छोड़कर नहीं हिल सकता।

## प्रोडक्शन कार्यान्वयन

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

public class ChessPieceTest {
    private Board board;

    @BeforeEach
    public void setup() {
        board = new Board();
    }

    @ParameterizedTest
    @CsvSource({ "-1, 0", "0, -1", "8, 0", "0, 8", "-5, -5", "100, 100" })
    public void testOutOfBounds(int x, int y) {
        Piece knight = new Knight(board, 4, 4, Color.WHITE);
        assertFalse(knight.canMoveTo(x, y));
    }

    @Test
    public void testKnightObstacleJump() {
        Piece knight = new Knight(board, 1, 0, Color.WHITE);
        board.placePiece(new Pawn(board, 1, 1, Color.WHITE), 1, 1);
        
        assertTrue(knight.canMoveTo(2, 2));
        assertTrue(knight.canMoveTo(0, 2));
        assertFalse(knight.canMoveTo(1, 2));
    }

    @Test
    public void testPinnedPieceMovement() {
        King whiteKing = new King(board, 4, 0, Color.WHITE);
        Bishop whiteBishop = new Bishop(board, 4, 2, Color.WHITE);
        Rook blackRook = new Rook(board, 4, 7, Color.BLACK);

        board.placePiece(whiteKing, 4, 0);
        board.placePiece(whiteBishop, 4, 2);
        board.placePiece(blackRook, 4, 7);

        assertFalse(whiteBishop.canMoveTo(5, 3));
    }
}
```

## जटिलता और प्रदर्शन विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| सीमा जांच | `O(1)` | स्थिर समय में पूर्णांक सीमा जांच। |
| किरण पथ ट्रैवर्सल | `O(1)` | ८x८ बोर्ड पर अधिकतम ७ वर्ग जांच। |
| चेक इनवेरिएंट सिमुलेशन | `O(1)` | बोर्ड स्थिति की त्वरित प्रतिलिपि पर मूल्यांकन। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: शतरंज इंजन

१. **६४-बिट बिटबोर्ड्स:** स्थिति को ६४-बिट `long` पूर्णांकों के रूप में संग्रहीत करके बिटवाइज़ ऑपरेशन्स द्वारा ५ नैनोसेकंड से कम में चाल की वैधता जांचना।
२. **प्रॉपर्टी-आधारित फज़िंग:** लाखों यादृच्छिक बोर्ड स्थितियों पर स्वचालित परीक्षण।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **एन पासेंट (En Passant) कैप्चर:** खाली लक्ष्य वर्ग पर चाल लेकिन बगल के प्यादे को मारना।
२. **चेक के दौरान कैसलिंग:** नियमों के तहत पूरी तरह प्रतिबंधित।
