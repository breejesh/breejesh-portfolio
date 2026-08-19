---
title: "Deck of Cards: Card, Deck, Hand, and Blackjack (Java)"
description: "CTCI-style problem 7.1 for beginners: design reusable card classes (Card, Deck, Hand) and specialize them for blackjack with BlackJackCard and BlackJackHand, including soft aces."
date: "2025-12-19"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-1-deck-of-cards.webp
previewImage: /assets/images/ctci-7-1-deck-of-cards.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 7.1 for beginners: design reusable card classes (Card, Deck, Hand) and specialize them for blackjack with BlackJackCard and BlackJackHand, including soft aces.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A standard deck is fifty-two cards: four suits, thirteen ranks each. Blackjack sits on top of that deck with its own scoring rules (face cards worth ten, aces worth one or eleven). Interviewers want class design that stays general, then a clean specialization for the game.

This post is original teaching for beginners in **Java**. Same problem family as classic OOD interview prompts, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design, starts here.

---

## 1. Table analogy

Think of a casino table.

* **Card:** one physical card. Suit and rank never change after print.
* **Deck:** the shoe. You shuffle, deal one card at a time, and know when it is empty.
* **Hand:** the cards a player is holding right now. Add cards, score them by game rules.
* **Blackjack:** same cards, different value map. An ace is soft until counting it as eleven would bust.

If you hard-code "blackjack value" into a generic `Card`, every other game (poker, war, rummy) inherits wrong rules. Keep value open. Specialize scoring where the game lives.

---

## 2. Plain problem statement

**Goal:** design classes for a generic deck of cards, then show how to subclass them for blackjack.

**Core types people usually name:**

| Type | Role |
| --- | --- |
| `Suit` | Club, Diamond, Heart, Spade (enum) |
| `Card` | one suit + face value (1-13 or Ace-King) |
| `Deck` | list of cards; shuffle, deal, remaining count |
| `Hand` | collection of cards a player holds |
| `BlackJackCard` | card that knows blackjack face value |
| `BlackJackHand` | hand that scores blackjack (soft aces, bust) |

**Clarify in an interview:**

* One deck or multi-deck shoe? (Start with one 52-card deck.)
* Are jokers included? (Usually no.)
* Face value encoding: ace = 1, jack = 11, queen = 12, king = 13 is fine for the base class.
* Blackjack score is a hand concern more than a single-card concern when aces can flip between 1 and 11.
* Empty deck on deal: return `null`, throw, or optional; pick one contract.

**Method shapes (sketch):**

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

## 3. Think first

### Separate identity from game value

A card **is** a suit and a rank. That is stable. What the card is **worth** depends on the game.

Two clean options:

1. Base `Card` exposes `value()` as face rank (1-13). Blackjack maps that to 1, 2, ..., 10, 10, 10, 10.
2. Abstract `value()` on `Card`, concrete in `BlackJackCard`.

Option 1 is simpler for a multi-game library. Option 2 is fine when the exercise is "subclass for blackjack." This post uses a base `Card` with face value, then `BlackJackCard` that overrides the effective value used in scoring, and puts multi-ace logic on `BlackJackHand`.

### Deck is a shuffle + deal container

`Deck` owns an `ArrayList<Card>` (or `LinkedList`). Construction fills 52 cards. `shuffle` uses `Collections.shuffle` (or Fisher-Yates by hand if they ban the library). `dealCard` removes from the end (or a cursor index) in O(1).

Do not recompute the whole list on every deal. A deal index (`dealt`) works too: cards after the index are still in the shoe.

### Hand is a list; scoring is polymorphic

`Hand` holds cards. Generic `score()` might sum face values. `BlackJackHand` overrides scoring: count aces, sum non-aces, then assign each ace 11 or 1 without going over 21 when possible.

### Inheritance vs composition

* **Inheritance:** `BlackJackCard extends Card`, `BlackJackHand extends Hand`. Matches the classic prompt wording ("subclass").
* **Composition:** a `BlackjackScorer` strategy on a plain `Hand`. Cleaner for many games later; mention it as a follow-up if the interviewer digs.

For this problem, inheritance is the expected first answer.

### Soft aces algorithm (core of blackjack scoring)

1. Sum every non-ace as min(face, 10). Count aces.
2. Total = nonAceSum + aces (each ace starts as 1).
3. For each ace, if total + 10 <= 21, add 10 (promote that ace from 1 to 11). At most one promotion is useful for a single hand total under standard rules, but looping is clear and correct.

Example: Ace + 6 = soft 17 (1+6+10). Ace + Ace + 9 = 21 (1+1+9+10). Ace + 10 + 10 = 21 with aces as 1.

---

## 4. Java solution

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

Walkthrough of scoring:

| Hand | Computation | Score |
| --- | --- | --- |
| Ace, 6 | 1+6, promote ace +10 | 17 (soft) |
| King, Queen | 10+10 | 20 |
| Ace, King | 1+10, promote +10 | 21 (blackjack if two cards) |
| Ace, Ace, 9 | 1+1+9, one promote +10 | 21 |
| 10, 9, 5 | 10+9+5 | 24 (bust) |

Deal loop sketch:

```java
Deck shoe = Deck.blackjackDeck();
shoe.shuffleFresh(new Random(42));

BlackJackHand player = new BlackJackHand();
player.addCard(shoe.dealCard());
player.addCard(shoe.dealCard());

System.out.println(player.score());
System.out.println(player.isBlackjack());
```

Factory note: the private `Deck(boolean blackjack)` constructor keeps one place that fills suits and ranks. A pure design interview can skip the factory and only draw UML plus the scoring method.

---

## 5. Design notes and complexity

| Piece | Time | Space / notes |
| --- | --- | --- |
| Build deck | O(1) | fixed 52 cards (or 52 * n for multi-deck) |
| `shuffle` | O(N) | N remaining or full deck |
| `dealCard` | O(1) | advance index; avoid remove(0) on ArrayList |
| `Hand.addCard` | O(1) amortized | list append |
| `BlackJackHand.score` | O(K) | K cards in hand (tiny in practice) |

Design checklist interviewers like:

* **Encapsulation:** face value and suit are final on `Card`.
* **Enum for suit:** no magic strings, easy to loop.
* **Extension point:** scoring lives on the hand (and card value map), not scattered in the dealer loop.
* **Null deal contract:** document `dealCard() -> null` when empty so callers check `remainingCards()`.
* **Immutability of cards:** cards do not change suit mid-game; hands change membership.

Multi-deck shoe: construct `n * 52` cards the same way, or compose `List<Deck>`. Scoring does not care how many decks exist.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty deck:** `dealCard` returns `null` (or throws). Never index past `cards.size()`.
* **Shuffle mid-hand:** either shuffle only remaining cards or reset `dealt` for a full reshuffle. State both options.
* **Ace scoring twice:** do not count ace as 11 in `BlackJackCard.value()` and again in the hand. Keep ace as 1 on the card; promote on the hand.
* **Multiple aces:** Ace+Ace+9 = 21, not 31. The promote loop must stop at 21.
* **Bust with aces:** Ace+10+10 must stay 21 with ace as 1, not force 31.
* **Natural vs later 21:** `isBlackjack` is two cards and 21. Five-card 21 is not a natural.
* **Mixing plain `Card` into `BlackJackHand`:** either forbid it or map face values as in the score loop above.
* **Jokers / incomplete decks:** out of scope unless asked; state the assumption.

Common mistakes:

1. **Hard-coding blackjack into `Card` only.** Poker cannot reuse it cleanly.
2. **`ArrayList.remove(0)` for deal.** O(N) per deal. Use an index or remove from the end.
3. **Forgetting face cards are 10.** Jack is not 11 points in blackjack.
4. **Returning all possible totals** without picking one best <= 21. Soft-hand logic needs a single score for bust checks.
5. **No enum for suits.** Stringly-typed suits invite typos.
6. **Mutable public card fields.** Prefer private final + getters.

Minimal smoke idea:

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

## 7. Explain to a friend recap

Deck of Cards is an OOD starter, not a hard algorithm:

1. Model **Card** as suit + face value. Suit is an enum. Face stays 1-13.
2. **Deck** builds 52 cards, shuffles, deals in O(1) with a cursor.
3. **Hand** holds cards. Generic score can sum face values.
4. **BlackJackCard** maps faces to blackjack pips (ace 1 at card level, 10 for 10/J/Q/K).
5. **BlackJackHand** scores soft aces: start aces as 1, promote to 11 while total stays <= 21. Bust and natural blackjack are thin wrappers on that score.
6. Keep game rules on the subclass so a plain deck still works for other games.

If you can draw the five types, explain why ace promotion lives on the hand, and deal without O(N) removes, you own problem 7.1. Next up in chapter 7: call center call routing and employee levels.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Poison](/blog/en/ctci-6-10-poison)
* Next: [Call Center](/blog/en/ctci-7-2-call-center)