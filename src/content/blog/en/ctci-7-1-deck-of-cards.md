---
title: "Deck of Cards: Object-Oriented Design for Blackjack & Card Games (CTCI 7.1)"
description: "Design the data structures for a generic deck of cards, extending the model to support a full Blackjack game with Ace valuation logic."
date: "2026-05-06"
tags: [Algorithms & Data Structures, System Design & Architecture]
coverImage: /assets/images/ctci-7-1-deck-of-cards.webp
previewImage: /assets/images/ctci-7-1-deck-of-cards.webp
---

> **TL;DR**
> * **The Book Problem:** Design the data structures for a generic deck of cards. Explain how you would subclass the data structures to implement Blackjack.
> * **The Core Breakthrough:** Polymorphic OOP Hierarchy: Generic `Card` (Suit, faceValue) and `Deck<T extends Card>` with generic shuffling, extended by `BlackJackCard` (handling Ace value 1 or 11) and `BlackJackHand`.
> * **Production Reality:** Game engine state modeling and Casino RNG gaming servers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.1), we are asked to design a clean object-oriented class hierarchy for a generic deck of playing cards and extend it for a Blackjack (21) game.

## 2. Polymorphic Class Structure

1. `enum Suit`: `Club`, `Diamond`, `Heart`, `Spade`.
2. `abstract class Card`: Encapsulates `suit`, `faceValue`, and abstract `int value()`.
3. `class Deck<T extends Card>`: Manages an array of 52 cards, deal pointer `dealtIndex`, and Fisher-Yates shuffling.
4. `class BlackJackCard extends Card`: Implements Blackjack scoring (`value() = Math.min(faceValue, 10)` for face cards, `minValue() = 1`, `maxValue() = 11` for Aces).
5. `class BlackJackHand extends Hand<BlackJackCard>`: Computes maximum possible score under 21 by evaluating dynamic Ace values.

## Production Implementation

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

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| dealCard() Time | `O(1)` | Direct index lookup and increment. |
| shuffle() Time | `O(N)` | In-place Fisher-Yates permutation. |
| Memory Overhead | `O(N)` | Exactly 52 card object instances in heap. |

## Real-World Systems Engineering Discussion

Online casino gaming engines and poker servers use cryptographic hardware RNGs to shuffle card arrays and stateful finite state machines to enforce game rules.

## Edge Cases & Production Hardening

1. Dealing from empty deck: Returns null gracefully.
2. Blackjack hand with multiple Aces: Hand evaluator tests combinations without busting.
