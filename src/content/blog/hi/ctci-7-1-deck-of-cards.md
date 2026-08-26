---
title: "ताश की गड्डी: कार्ड, डेक, हैंड और ब्लैकजैक (जावा)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.१: दोबारा इस्तेमाल होने वाली ताश कक्षाएँ (कार्ड, डेक, हैंड) डिज़ाइन करो और ब्लैकजैक के लिए ब्लैकजैककार्ड व ब्लैकजैकहैंड से विशेषज्ञ बनाओ, नरम इक्के सहित।"
date: "2025-12-19"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-1-deck-of-cards.webp
previewImage: /assets/images/ctci-7-1-deck-of-cards.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.१: दोबारा इस्तेमाल होने वाली ताश कक्षाएँ (कार्ड, डेक, हैंड) डिज़ाइन करो और ब्लैकजैक के लिए ब्लैकजैककार्ड व ब्लैकजैकहैंड से विशेषज्ञ बनाओ, नरम इक्के सहित।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

मानक ताश की गड्डी बावन पत्ते: चार रंग, हर रंग में तेरह रैंक। ब्लैकजैक उसी गड्डी पर बैठता है, अपने स्कोर नियमों के साथ (चेहरे वाले पत्ते दस, इक्का एक या ग्यारह)। इंटरव्यू में ऐसी कक्षा डिज़ाइन चाहिए जो सामान्य रहे, फिर खेल के लिए साफ विशेषज्ञता।

यह पोस्ट शुरुआती लोगों के लिए **जावा** में मूल शिक्षण है। क्लासिक ऑब्जेक्ट-ओरिएंटेड डिज़ाइन इंटरव्यू प्रॉम्प्ट का परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, ऑब्जेक्ट-ओरिएंटेड डिज़ाइन, यहीं शुरू होता है।

---

## १. मेज़ की उपमा

कैसिनो की मेज़ सोचो।

* **कार्ड:** एक भौतिक पत्ता। रंग और रैंक छपाई के बाद नहीं बदलते।
* **डेक:** जूता (शू)। फेंटो, एक-एक पत्ता दो, खाली कब है जानो।
* **हैंड:** खिलाड़ी के पास अभी जो पत्ते हैं। पत्ते जोड़ो, खेल के नियमों से स्कोर करो।
* **ब्लैकजैक:** वही पत्ते, अलग मूल्य मानचित्र। इक्का नरम रहता है जब तक उसे ग्यारह गिनने से हैंड फूट न जाए।

अगर सामान्य `Card` में "ब्लैकजैक मूल्य" जबरदस्ती ठूँस दो, हर दूसरे खेल (पोकर, वार, रमी) गलत नियम ले आएंगे। मूल्य खुला रखो। स्कोरिंग वहीं विशेषज्ञ करो जहाँ खेल रहता है।

---

## २. समस्या सादे शब्दों में

**लक्ष्य:** सामान्य ताश गड्डी की कक्षाएँ डिज़ाइन करो, फिर ब्लैकजैक के लिए उपकक्षा दिखाओ।

**जो प्रकार लोग अक्सर नाम लेते हैं:**

| प्रकार | भूमिका |
| --- | --- |
| `Suit` | क्लब, डायमंड, हार्ट, स्पेड (एनम) |
| `Card` | एक रंग + चेहरे का मूल्य (१-१३ या इक्का-बादशाह) |
| `Deck` | पत्तों की सूची; फेंटना, बाँटना, बचे पत्ते |
| `Hand` | खिलाड़ी के पास पत्तों का संग्रह |
| `BlackJackCard` | पत्ता जो ब्लैकजैक चेहरे मूल्य जानता है |
| `BlackJackHand` | हैंड जो ब्लैकजैक स्कोर करता है (नरम इक्के, फूटना) |

**इंटरव्यू में साफ करो:**

* एक गड्डी या कई गड्डियों का शू? (एक ५२ पत्तों की गड्डी से शुरू।)
* जोकर शामिल? (आमतौर पर नहीं।)
* चेहरे की कूट: इक्का = १, गुलाम = ११, रानी = १२, बादशाह = १३ आधार कक्षा के लिए ठीक।
* ब्लैकजैक स्कोर एक पत्ते से ज़्यादा हैंड की चिंता है जब इक्के १ और ११ के बीच पलट सकते हैं।
* खाली डेक पर बाँटना: `null` लौटाओ, अपवाद फेंको, या ऑप्शनल; एक अनुबंध चुनो।

**विधियों का आकार (रेखाचित्र):**

```java
// Deck
void shuffle();
Card dealCard();
int remainingCards();

// Hand
void addCard(Card c);
int score(); // game-specific in subclasses

// BlackJackHand
boolean isBusted();
boolean is21();
boolean isBlackjack(); // natural 2-card 21
```

---

## ३. पहले सोचो

### पहचान को खेल मूल्य से अलग रखो

एक पत्ता **है** रंग और रैंक। यह स्थिर है। पत्ता **कितने** का है खेल पर निर्भर करता है।

दो साफ विकल्प:

१. आधार `Card` `value()` को चेहरे रैंक (१-१३) के रूप में दिखाए। ब्लैकजैक उसे १, २, ..., १०, १०, १०, १० पर मैप करे।
२. `Card` पर अमूर्त `value()`, `BlackJackCard` में ठोस।

विकल्प १ बहु-खेल पुस्तकालय के लिए सरल है। विकल्प २ तब ठीक जब अभ्यास "ब्लैकजैक के लिए उपकक्षा" हो। यह पोस्ट आधार `Card` चेहरे मूल्य के साथ लेता है, फिर `BlackJackCard` जो स्कोरिंग में प्रभावी मूल्य ओवरराइड करता है, और बहु-इक्का तर्क `BlackJackHand` पर रखता है।

### डेक फेंटना + बाँटना वाला पात्र है

`Deck` के पास `ArrayList<Card>` (या `LinkedList`) है। निर्माण ५२ पत्ते भरता है। `shuffle` `Collections.shuffle` इस्तेमाल करता है (या हाथ से फिशर-येट्स अगर पुस्तकालय मना हो)। `dealCard` अंत से हटाता है (या कर्सर सूचकांक) ओ(१) में।

हर बाँट पर पूरी सूची फिर से मत बनाओ। `dealt` सूचकांक भी चलता है: उसके बाद के पत्ते अभी शू में हैं।

### हैंड सूची है; स्कोरिंग बहुरूपी है

`Hand` पत्ते रखता है। सामान्य `score()` चेहरे मूल्य जोड़ सकता है। `BlackJackHand` ओवरराइड करता है: इक्के गिनो, गैर-इक्के जोड़ो, फिर हर इक्के को ११ या १ दो बिना २१ पार किए जहाँ संभव हो।

### वंशागति बनाम संरचना

* **वंशागति:** `BlackJackCard extends Card`, `BlackJackHand extends Hand`। क्लासिक प्रॉम्प्ट ("subclass") से मेल खाता है।
* **संरचना:** सादे `Hand` पर `BlackjackScorer` रणनीति। बाद में कई खेलों के लिए साफ; अगर साक्षात्कारकर्ता गहराई में जाए तो बताओ।

इस समस्या के लिए वंशागति पहली अपेक्षित उत्तर है।

### नरम इक्के का कलनविधि (ब्लैकजैक स्कोर का मूल)

१. हर गैर-इक्के को min(चेहरा, १०) जोड़ो। इक्के गिनो।
२. कुल = nonAceSum + इक्के (हर इक्का १ से शुरू)।
३. हर इक्के के लिए, अगर कुल + १० <= २१, तो १० जोड़ो (उस इक्के को १ से ११ पर बढ़ावा)। मानक नियमों में एक हैंड कुल के लिए ज़्यादातर एक बढ़ावा काफी, पर लूप साफ और सही है।

उदाहरण: इक्का + ६ = नरम १७ (१+६+१०)। इक्का + इक्का + ९ = २१ (१+१+९+१०)। इक्का + १० + १० = इक्के १ पर २१।

---

## ४. जावा समाधान

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

enum Suit {
    CLUB, DIAMOND, HEART, SPADE
}

/** Generic playing card. faceValue: 1 = Ace, 11 = Jack, 12 = Queen, 13 = King. */
class Card {
    private final int faceValue; // 1..13
    private final Suit suit;

    public Card(int faceValue, Suit suit) {
        if (faceValue < 1 || faceValue > 13) {
            throw new IllegalArgumentException("faceValue must be 1..13");
        }
        this.faceValue = faceValue;
        this.suit = suit;
    }

    public int getFaceValue() {
        return faceValue;
    }

    public Suit getSuit() {
        return suit;
    }

    /** Default: raw face rank. Games can map this. */
    public int value() {
        return faceValue;
    }

    @Override
    public String toString() {
        return faceLabel() + " of " + suit;
    }

    private String faceLabel() {
        switch (faceValue) {
            case 1:  return "Ace";
            case 11: return "Jack";
            case 12: return "Queen";
            case 13: return "King";
            default: return String.valueOf(faceValue);
        }
    }
}

/** Deck of 52 cards. */
class Deck {
    private final List<Card> cards = new ArrayList<>();
    private int dealt = 0; // next index to deal; cards before it are gone

    public Deck() {
        for (Suit s : Suit.values()) {
            for (int v = 1; v <= 13; v++) {
                cards.add(new Card(v, s));
            }
        }
    }

    /** Build a blackjack shoe: same 52 ranks, but BlackJackCard instances. */
    public static Deck blackjackDeck() {
        Deck d = new Deck(true);
        return d;
    }

    private Deck(boolean blackjack) {
        for (Suit s : Suit.values()) {
            for (int v = 1; v <= 13; v++) {
                cards.add(blackjack ? new BlackJackCard(v, s) : new Card(v, s));
            }
        }
    }

    public void shuffle() {
        // only shuffle remaining cards if mid-shoe; full reshuffle resets dealt
        Collections.shuffle(cards.subList(dealt, cards.size()), new Random());
    }

    public void shuffleFresh(Random rng) {
        dealt = 0;
        Collections.shuffle(cards, rng);
    }

    public Card dealCard() {
        if (remainingCards() == 0) {
            return null;
        }
        return cards.get(dealt++);
    }

    public int remainingCards() {
        return cards.size() - dealt;
    }
}

/** Generic hand: just cards. */
class Hand {
    protected final List<Card> cards = new ArrayList<>();

    public void addCard(Card c) {
        if (c == null) {
            throw new IllegalArgumentException("card is null");
        }
        cards.add(c);
    }

    public List<Card> getCards() {
        return Collections.unmodifiableList(cards);
    }

    public int size() {
        return cards.size();
    }

    /** Sum of face values (not blackjack rules). */
    public int score() {
        int sum = 0;
        for (Card c : cards) {
            sum += c.value();
        }
        return sum;
    }
}

/** Card scored for blackjack: Ace 1 or 11 handled by the hand; face cards 10. */
class BlackJackCard extends Card {
    public BlackJackCard(int faceValue, Suit suit) {
        super(faceValue, suit);
    }

    public boolean isAce() {
        return getFaceValue() == 1;
    }

    public boolean isFaceCard() {
        int v = getFaceValue();
        return v >= 11 && v <= 13;
    }

    /** Fixed contribution before soft-ace adjustment: Ace counts as 1 here. */
    @Override
    public int value() {
        int v = getFaceValue();
        if (v == 1) {
            return 1;
        }
        if (v >= 10) {
            return 10; // 10, J, Q, K
        }
        return v;
    }
}

/** Blackjack hand: soft aces, bust, natural blackjack. */
class BlackJackHand extends Hand {

    @Override
    public int score() {
        int total = 0;
        int aces = 0;

        for (Card c : cards) {
            if (c instanceof BlackJackCard) {
                BlackJackCard bj = (BlackJackCard) c;
                total += bj.value(); // ace as 1, faces as 10
                if (bj.isAce()) {
                    aces++;
                }
            } else {
                // tolerate plain cards: map like blackjack
                int v = c.getFaceValue();
                if (v == 1) {
                    total += 1;
                    aces++;
                } else if (v >= 10) {
                    total += 10;
                } else {
                    total += v;
                }
            }
        }

        // promote aces from 1 to 11 while staying <= 21
        while (aces > 0 && total + 10 <= 21) {
            total += 10;
            aces--;
        }
        return total;
    }

    public boolean isBusted() {
        return score() > 21;
    }

    public boolean is21() {
        return score() == 21;
    }

    /** Natural: exactly two cards totaling 21 (Ace + 10-value). */
    public boolean isBlackjack() {
        return cards.size() == 2 && score() == 21;
    }
}
```

स्कोर की चाल:

| हैंड | गणना | स्कोर |
| --- | --- | --- |
| इक्का, ६ | १+६, इक्का +१० | १७ (नरम) |
| बादशाह, रानी | १०+१० | २० |
| इक्का, बादशाह | १+१०, +१० | २१ (दो पत्तों पर ब्लैकजैक) |
| इक्का, इक्का, ९ | १+१+९, एक बढ़ावा +१० | २१ |
| १०, ९, ५ | १०+९+५ | २४ (फूटा) |

बाँट लूप का रेखाचित्र:

```java
Deck shoe = Deck.blackjackDeck();
shoe.shuffleFresh(new Random(42));

BlackJackHand player = new BlackJackHand();
player.addCard(shoe.dealCard());
player.addCard(shoe.dealCard());

System.out.println(player.score());
System.out.println(player.isBlackjack());
```

फैक्टरी नोट: निजी `Deck(boolean blackjack)` निर्माता रंग और रैंक भरने की एक जगह रखता है। शुद्ध डिज़ाइन साक्षात्कार में फैक्टरी छोड़ सकते हो और सिर्फ यूएमएल व स्कोर विधि बना सकते हो।

---

## ५. डिज़ाइन नोट और जटिलता

| टुकड़ा | समय | स्थान / नोट |
| --- | --- | --- |
| गड्डी बनाना | ओ(१) | स्थिर ५२ (या बहु-गड्डी पर ५२ × न) |
| `shuffle` | ओ(न) | बचे न या पूरी गड्डी |
| `dealCard` | ओ(१) | सूचकांक आगे; ऐरेलिस्ट पर remove(०) से बचो |
| `Hand.addCard` | ओ(१) औसत | सूची में जोड़ |
| `BlackJackHand.score` | ओ(क) | हैंड में क पत्ते (व्यवहार में छोटे) |

डिज़ाइन जाँच सूची जो पसंद आती है:

* **संपुटन:** `Card` पर चेहरे मूल्य और रंग अंतिम।
* **रंग के लिए एनम:** जादुई स्ट्रिंग नहीं, घूमना आसान।
* **विस्तार बिंदु:** स्कोरिंग हैंड पर (और पत्ते के मूल्य मानचित्र पर), डीलर लूप में बिखरी नहीं।
* **खाली बाँट अनुबंध:** दस्तावेज़ करो `dealCard() -> null` जब खाली हो ताकि कॉलर `remainingCards()` देखे।
* **पत्तों की अपरिवर्तनीयता:** खेल बीच में रंग नहीं बदलते; हैंड सदस्यता बदलती है।

बहु-गड्डी शू: उसी तरह `n * 52` पत्ते बनाओ, या `List<Deck>` जोड़ो। स्कोरिंग को गड्डियों की संख्या की परवाह नहीं।

---

## ६. किनारे के मामले और आम गलतियाँ

साक्षात्कारकर्ता यहाँ चुभते हैं:

* **खाली डेक:** `dealCard` `null` लौटाए (या अपवाद)। कभी `cards.size()` से आगे सूचकांक मत लगाओ।
* **हैंड बीच में फेंटना:** या सिर्फ बचे पत्ते फेंटो, या पूरे रीशफल के लिए `dealt` रीसेट करो। दोनों विकल्प बताओ।
* **इक्का दो बार गिना:** `BlackJackCard.value()` में ११ और फिर हैंड में दोबारा मत गिनो। पत्ते पर इक्का १ रखो; बढ़ावा हैंड पर।
* **कई इक्के:** इक्का+इक्का+९ = २१, ३१ नहीं। बढ़ावा लूप २१ पर रुके।
* **इक्कों के साथ फूटना:** इक्का+१०+१० इक्का १ पर २१ रहे, ३१ जबरदस्ती नहीं।
* **प्राकृतिक बनाम बाद का २१:** `isBlackjack` दो पत्ते और २१ है। पाँच पत्तों का २१ प्राकृतिक नहीं।
* **सादा `Card` `BlackJackHand` में:** या मना करो या ऊपर वाले स्कोर लूप जैसा मैप करो।
* **जोकर / अधूरी गड्डी:** जब तक न पूछें, दायरे से बाहर; अनुमान बताओ।

आम गलतियाँ:

१. **सिर्फ `Card` में ब्लैकजैक जबरदस्ती।** पोकर साफ दोबारा इस्तेमाल नहीं कर पाता।
२. **बाँट के लिए `ArrayList.remove(0)`।** हर बाँट ओ(न)। सूचकांक या अंत से हटाओ।
३. **चेहरे पत्ते १० भूलना।** ब्लैकजैक में गुलाम ११ अंक नहीं।
४. **सभी संभावित कुल लौटाना** बिना सर्वश्रेष्ठ <= २१ चुने। नरम-हैंड तर्क को फूट जाँच के लिए एक स्कोर चाहिए।
५. **रंगों के लिए एनम नहीं।** स्ट्रिंग रंग टाइपो बुलाते हैं।
६. **पत्ते पर सार्वजनिक परिवर्तनीय क्षेत्र।** निजी अंतिम + गेटर बेहतर।

न्यूनतम धुआँ परीक्षण विचार:

```java
BlackJackHand h = new BlackJackHand();
h.addCard(new BlackJackCard(1, Suit.SPADE));  // Ace
h.addCard(new BlackJackCard(13, Suit.HEART)); // King
assert h.score() == 21;
assert h.isBlackjack();

BlackJackHand soft = new BlackJackHand();
soft.addCard(new BlackJackCard(1, Suit.CLUB));
soft.addCard(new BlackJackCard(6, Suit.DIAMOND));
assert soft.score() == 17;

BlackJackHand bust = new BlackJackHand();
bust.addCard(new BlackJackCard(10, Suit.CLUB));
bust.addCard(new BlackJackCard(9, Suit.CLUB));
bust.addCard(new BlackJackCard(5, Suit.CLUB));
assert bust.isBusted();
```

---

## ७. दोस्त को समझाने वाला सार

ताश की गड्डी ऑब्जेक्ट-ओरिएंटेड डिज़ाइन की शुरुआत है, कठिन कलनविधि नहीं:

१. **कार्ड** को रंग + चेहरे मूल्य के रूप में मॉडल करो। रंग एनम है। चेहरा १-१३ रहता है।
२. **डेक** ५२ पत्ते बनाता है, फेंटता है, कर्सर से ओ(१) में बाँटता है।
३. **हैंड** पत्ते रखता है। सामान्य स्कोर चेहरे जोड़ सकता है।
४. **ब्लैकजैककार्ड** चेहरों को ब्लैकजैक पिप्स पर मैप करता है (पत्ते स्तर पर इक्का १, १०/गुलाम/रानी/बादशाह के लिए १०)।
५. **ब्लैकजैकहैंड** नरम इक्के स्कोर करता है: इक्के १ से शुरू, कुल <= २१ रहते हुए ११ पर बढ़ावा। फूटना और प्राकृतिक ब्लैकजैक उसी स्कोर पर पतली परतें हैं।
६. खेल नियम उपकक्षा पर रखो ताकि सादी गड्डी दूसरे खेलों के लिए भी चले।

अगर पाँच प्रकार बना सको, बता सको इक्का बढ़ावा हैंड पर क्यों है, और ओ(न) हटाव के बिना बाँट सको, तो समस्या ७.१ तुम्हारी है। अध्याय ७ में अगला: कॉल सेंटर कॉल रूटिंग और कर्मचारी स्तर।

---

## श्रृंखला

* गाइड: [सीटीसीआई श्रृंखला गाइड](/blog/hi/ctci-series-guide)
* पिछला: [पॉइज़न](/blog/hi/ctci-6-10-poison)
* अगला: [कॉल सेंटर](/blog/hi/ctci-7-2-call-center)