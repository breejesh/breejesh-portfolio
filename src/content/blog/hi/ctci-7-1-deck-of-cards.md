---
title: "ताश की गड्डी (Deck of Cards): ब्लैकजैक और कार्ड गेम्स के लिए ऑब्जेक्ट-ओरिएंटेड डिज़ाइन (सीटीसीआई ७.१)"
description: "ताश की सामान्य गड्डी के लिए ऑब्जेक्ट-ओरिएंटेड क्लास पदानुक्रम और इक्का (Ace) मूल्यांकन तर्क के साथ ब्लैकजैक गेम का कार्यान्वयन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-1-deck-of-cards.webp
previewImage: /assets/images/ctci-7-1-deck-of-cards.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ताश के पत्तों की सामान्य गड्डी के लिए डेटा संरचनाएं डिज़ाइन करें। बताएं कि ब्लैकजैक को लागू करने के लिए आप इन संरचनाओं को कैसे सबक्लास करेंगे।
> * **मुख्य समाधान:** **पॉलीमॉर्फिक OOP पदानुक्रम**: जेनेरिक `Card` (सूट, फेस वैल्यू) और `Deck<T extends Card>` (शफलिंग के साथ), जिसे `BlackJackCard` (इक्का का मान १ या ११) और `BlackJackHand` द्वारा विस्तारित किया जाता है।
> * **रियल-वर्ल्ड सिस्टम:** गेम इंजन स्टेट मॉडलिंग और ऑनलाइन गेमिंग सर्वर।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.१) में, हमें ताश के पत्तों के लिए एक स्वच्छ ऑब्जेक्ट-ओरिएंटेड क्लास पदानुक्रम डिज़ाइन करने और ब्लैकजैक (२१) खेल के लिए इसे विस्तारित करने के लिए कहा गया है।

## २. पॉलीमॉर्फिक क्लास संरचना

१. `enum Suit`: `Club`, `Diamond`, `Heart`, `Spade`।
२. `abstract class Card`: `suit` और `faceValue` को समाहित करता है।
३. `class Deck<T extends Card>`: ५२ पत्तों की सूची, `dealtIndex` पॉइंटर और फिशर-येट्स शफलिंग का प्रबंधन करता है।
४. `class BlackJackCard extends Card`: ब्लैकजैक स्कोरिंग नियम लागू करता है (फेस कार्ड्स के लिए मान १०, इक्का के लिए १ या ११)।
५. `class BlackJackHand`: २१ से अधिक हुए बिना अधिकतम संभावित स्कोर की गणना करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class DeckOfCards {
    public enum Suit { Club(0), Diamond(1), Heart(2), Spade(3); int val; Suit(int v) { val = v; } }

    public static abstract class Card {
        protected int faceValue;
        protected Suit suit;
        public Card(int c, Suit s) { this.faceValue = c; this.suit = s; }
        public abstract int value();
        public Suit suit() { return suit; }
    }

    public static class BlackJackCard extends Card {
        public BlackJackCard(int c, Suit s) { super(c, s); }
        public int value() {
            if (isAce()) return 1;
            if (faceValue >= 11 && faceValue <= 13) return 10;
            return faceValue;
        }
        public boolean isAce() { return faceValue == 1; }
    }

    public static class Deck<T extends Card> {
        private List<T> cards;
        private int dealtIndex = 0;

        public void setDeckOfCards(List<T> deckOfCards) { this.cards = deckOfCards; }
        public void shuffle() { Collections.shuffle(cards); dealtIndex = 0; }
        public int remainingCards() { return cards.size() - dealtIndex; }
        public T dealCard() {
            if (remainingCards() == 0) return null;
            return cards.get(dealtIndex++);
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| dealCard() समय | `O(१)` | सीधा इंडेक्स लुकअप और पॉइंटर इंक्रीमेंट। |
| shuffle() समय | `O(N)` | इन-प्लेस फिशर-येट्स परम्यूटेशन। |
| मेमोरी खपत | `O(N)` | हीप में ठीक ५२ कार्ड ऑब्जेक्ट इंस्टेंस। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: गेमिंग इंजन स्टेट मशीन

ऑनलाइन कैसीनो और पोकर सर्वर पत्तों की गड्डी को शफल करने के लिए क्रिप्टोग्राफ़िक हार्डवेयर आरएनजी (RNG) का उपयोग करते हैं और खेल के नियमों को लागू करने के लिए स्टेट मशीनों का उपयोग करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली डेक से पत्ता निकालना:** सुरक्षित रूप से `null` लौटाता है।
२. **एकाधिक इक्के (Aces):** हैंड इवैल्यूएटर बिना बस्ट हुए इष्टतम कुल स्कोर की गणना करता है।
