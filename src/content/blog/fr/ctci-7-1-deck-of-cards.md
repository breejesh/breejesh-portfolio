---
title: "Deck of Cards: Card, Deck, Hand et Blackjack (Java)"
description: "Problème style CTCI 7.1 pour débutants: concevoir des classes de cartes réutilisables (Card, Deck, Hand) et les spécialiser pour le blackjack avec BlackJackCard et BlackJackHand, as souples inclus."
date: "2025-12-19"
tags: [Algorithmes]
coverImage: /assets/images/ctci-7-1-deck-of-cards.webp
previewImage: /assets/images/ctci-7-1-deck-of-cards.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.1 pour débutants: concevoir des classes de cartes réutilisables (Card, Deck, Hand) et les spécialiser pour le blackjack avec BlackJackCard et BlackJackHand, as souples inclus.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un jeu standard, c'est cinquante-deux cartes: quatre couleurs, treize rangs chacune. Le blackjack s'appuie dessus avec ses propres règles de score (figures valent dix, as valent un ou onze). En entretien, on veut une conception de classes générale, puis une spécialisation propre pour le jeu.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de prompts OOD d'entretien, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 7, conception orientée objet, commence ici.

---

## 1. Analogie de la table

Imagine une table de casino.

* **Card:** une carte physique. Couleur et rang ne changent pas après impression.
* **Deck:** le sabot. Tu mélanges, tu donnes une carte à la fois, et tu sais quand il est vide.
* **Hand:** les cartes qu'un joueur tient maintenant. On ajoute des cartes, on les score selon les règles du jeu.
* **Blackjack:** les mêmes cartes, une autre table de valeurs. Un as est souple tant que le compter comme onze ferait sauter la main.

Si tu codes en dur la "valeur blackjack" dans un `Card` générique, tout autre jeu (poker, bataille, rami) hérite de mauvaises règles. Laisse la valeur ouverte. Spécialise le scoring là où vit le jeu.

---

## 2. Énoncé en mots simples

**Objectif:** concevoir des classes pour un jeu de cartes générique, puis montrer comment les sous-classer pour le blackjack.

**Types que l'on nomme souvent:**

| Type | Rôle |
| --- | --- |
| `Suit` | Club, Diamond, Heart, Spade (enum) |
| `Card` | une couleur + valeur de face (1-13 ou As-Roi) |
| `Deck` | liste de cartes; mélanger, donner, cartes restantes |
| `Hand` | collection de cartes tenues par un joueur |
| `BlackJackCard` | carte qui connaît la valeur de face au blackjack |
| `BlackJackHand` | main qui score le blackjack (as souples, bust) |

**À clarifier en entretien:**

* Un seul jeu ou sabot multi-jeux? (Commence avec un jeu de 52.)
* Jokers inclus? (En général non.)
* Encodage de face: as = 1, valet = 11, dame = 12, roi = 13 convient à la classe de base.
* Le score blackjack est plus une affaire de main que de carte unique quand les as peuvent basculer entre 1 et 11.
* Jeu vide au deal: renvoyer `null`, lever une exception ou optional; choisis un contrat.

**Forme des méthodes (esquisse):**

```java
// Deck
void shuffle();
Card dealCard();
int remainingCards();

// Hand
void addCard(Card c);
int score(); // spécifique au jeu dans les sous-classes

// BlackJackHand
boolean isBusted();
boolean is21();
boolean isBlackjack(); // natural 2 cartes à 21
```

---

## 3. Réfléchir d'abord

### Séparer l'identité de la valeur de jeu

Une carte **est** une couleur et un rang. C'est stable. Ce qu'elle **vaut** dépend du jeu.

Deux options propres:

1. Le `Card` de base expose `value()` comme rang de face (1-13). Le blackjack mappe vers 1, 2, ..., 10, 10, 10, 10.
2. `value()` abstrait sur `Card`, concret dans `BlackJackCard`.

L'option 1 est plus simple pour une bibliothèque multi-jeux. L'option 2 convient quand l'exercice est "sous-classe pour le blackjack". Ce billet utilise un `Card` de base avec valeur de face, puis `BlackJackCard` qui redéfinit la valeur effective pour le scoring, et place la logique multi-as sur `BlackJackHand`.

### Deck est un conteneur mélanger + donner

`Deck` possède un `ArrayList<Card>` (ou `LinkedList`). La construction remplit 52 cartes. `shuffle` utilise `Collections.shuffle` (ou Fisher-Yates à la main si la librairie est interdite). `dealCard` retire de la fin (ou avance un index) en O(1).

Ne reconstruis pas toute la liste à chaque donne. Un index `dealt` marche aussi: les cartes après l'index restent dans le sabot.

### Hand est une liste; le scoring est polymorphe

`Hand` tient des cartes. Un `score()` générique peut sommer les valeurs de face. `BlackJackHand` redéfinit: compte les as, somme les non-as, puis assigne à chaque as 11 ou 1 sans dépasser 21 si possible.

### Héritage vs composition

* **Héritage:** `BlackJackCard extends Card`, `BlackJackHand extends Hand`. Correspond au libellé classique ("subclass").
* **Composition:** un `BlackjackScorer` en stratégie sur un `Hand` plat. Plus propre si beaucoup de jeux ensuite; mentionne-le si l'intervieweur creuse.

Pour ce problème, l'héritage est la première réponse attendue.

### Algorithme des as souples (cœur du scoring)

1. Somme chaque non-as comme min(face, 10). Compte les as.
2. Total = nonAceSum + as (chaque as commence à 1).
3. Pour chaque as, si total + 10 <= 21, ajoute 10 (promeut cet as de 1 à 11). Au plus une promotion est utile pour un seul total de main sous les règles standard, mais la boucle est claire et correcte.

Exemple: As + 6 = soft 17 (1+6+10). As + As + 9 = 21 (1+1+9+10). As + 10 + 10 = 21 avec as à 1.

---

## 4. Solution Java

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

Parcours du scoring:

| Main | Calcul | Score |
| --- | --- | --- |
| As, 6 | 1+6, promeut as +10 | 17 (soft) |
| Roi, Dame | 10+10 | 20 |
| As, Roi | 1+10, promeut +10 | 21 (blackjack si deux cartes) |
| As, As, 9 | 1+1+9, une promotion +10 | 21 |
| 10, 9, 5 | 10+9+5 | 24 (bust) |

Esquisse de la boucle de donne:

```java
Deck shoe = Deck.blackjackDeck();
shoe.shuffleFresh(new Random(42));

BlackJackHand player = new BlackJackHand();
player.addCard(shoe.dealCard());
player.addCard(shoe.dealCard());

System.out.println(player.score());
System.out.println(player.isBlackjack());
```

Note sur la fabrique: le constructeur privé `Deck(boolean blackjack)` garde un seul endroit qui remplit couleurs et rangs. En entretien design pur, tu peux sauter la fabrique et ne dessiner que l'UML plus la méthode de scoring.

---

## 5. Notes de conception et complexité

| Pièce | Temps | Espace / notes |
| --- | --- | --- |
| Construire le jeu | O(1) | 52 fixes (ou 52 * n multi-jeux) |
| `shuffle` | O(N) | N restantes ou jeu complet |
| `dealCard` | O(1) | avancer l'index; évite remove(0) sur ArrayList |
| `Hand.addCard` | O(1) amorti | append sur la liste |
| `BlackJackHand.score` | O(K) | K cartes en main (petit en pratique) |

Checklist de conception appréciée:

* **Encapsulation:** valeur de face et couleur finales sur `Card`.
* **Enum pour la couleur:** pas de chaînes magiques, facile à parcourir.
* **Point d'extension:** le scoring vit sur la main (et le map de valeur de carte), pas éparpillé dans la boucle du croupier.
* **Contrat de donne nulle:** documente `dealCard() -> null` quand le jeu est vide pour que l'appelant regarde `remainingCards()`.
* **Immuabilité des cartes:** elles ne changent pas de couleur en cours de partie; les mains changent de membres.

Sabot multi-jeux: construis `n * 52` cartes de la même façon, ou compose `List<Deck>`. Le scoring se fiche du nombre de jeux.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs poussent ici:

* **Jeu vide:** `dealCard` renvoie `null` (ou lève). N'indexe jamais au-delà de `cards.size()`.
* **Mélanger en cours de main:** soit tu mélanges seulement le reste, soit tu remets `dealt` à zéro pour un reshuffle complet. Énonce les deux.
* **As compté deux fois:** ne compte pas l'as comme 11 dans `BlackJackCard.value()` et encore dans la main. Garde l'as à 1 sur la carte; promeus sur la main.
* **Plusieurs as:** As+As+9 = 21, pas 31. La boucle de promotion doit s'arrêter à 21.
* **Bust avec as:** As+10+10 doit rester 21 avec as à 1, pas forcer 31.
* **Natural vs 21 plus tard:** `isBlackjack` c'est deux cartes et 21. Un 21 en cinq cartes n'est pas un natural.
* **Mélanger un `Card` plain dans `BlackJackHand`:** soit tu l'interdis, soit tu mappe les faces comme dans la boucle de score ci-dessus.
* **Jokers / jeux incomplets:** hors scope sauf demande; énonce l'hypothèse.

Erreurs fréquentes:

1. **Coder le blackjack uniquement dans `Card`.** Le poker ne le réutilise pas proprement.
2. **`ArrayList.remove(0)` pour donner.** O(N) par carte. Utilise un index ou retire de la fin.
3. **Oublier que les figures valent 10.** Le valet n'est pas 11 points au blackjack.
4. **Renvoyer tous les totaux possibles** sans choisir le meilleur <= 21. La logique soft a besoin d'un seul score pour le bust.
5. **Pas d'enum pour les couleurs.** Des couleurs en string invitent les typos.
6. **Champs publics mutables sur la carte.** Préfère private final + getters.

Idée minimale de smoke:

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

## 7. Récap pour un ami

Deck of Cards est un démarrage OOD, pas un algorithme dur:

1. Modélise **Card** comme couleur + valeur de face. La couleur est un enum. La face reste 1-13.
2. **Deck** construit 52 cartes, mélange et donne en O(1) avec un curseur.
3. **Hand** tient des cartes. Le score générique peut sommer les faces.
4. **BlackJackCard** mappe les faces vers les pips blackjack (as 1 au niveau carte, 10 pour 10/J/Q/K).
5. **BlackJackHand** score les as souples: les as commencent à 1, passent à 11 tant que le total reste <= 21. Bust et blackjack natural sont de fines couches sur ce score.
6. Garde les règles du jeu sur la sous-classe pour qu'un jeu plain serve encore à d'autres jeux.

Si tu peux dessiner les cinq types, expliquer pourquoi la promotion de l'as vit sur la main, et donner sans remove O(N), tu maîtrises le 7.1. Suite du chapitre 7: routage d'appels du call center et niveaux d'employés.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Poison](/blog/fr/ctci-6-10-poison)
* Suivant: [Call Center](/blog/fr/ctci-7-2-call-center)