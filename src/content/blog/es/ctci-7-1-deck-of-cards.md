---
title: "Deck of Cards: Card, Deck, Hand y Blackjack (Java)"
description: "Problema estilo CTCI 7.1 para principiantes: diseña clases reutilizables de cartas (Card, Deck, Hand) y especialízalas para blackjack con BlackJackCard y BlackJackHand, incluidos ases blandos."
date: "2025-12-19"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-1-deck-of-cards.webp
previewImage: /assets/images/ctci-7-1-deck-of-cards.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.1 para principiantes: diseña clases reutilizables de cartas (Card, Deck, Hand) y especialízalas para blackjack con BlackJackCard y BlackJackHand, incluidos ases blandos.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Una baraja estándar son cincuenta y dos cartas: cuatro palos, trece rangos cada uno. El blackjack se monta encima con sus propias reglas de puntuación (figuras valen diez, ases valen uno u once). En la entrevista quieren un diseño de clases general y luego una especialización limpia para el juego.

Este post es enseñanza original para principiantes en **Java**. Misma familia de prompts OOD de entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí empieza el capítulo 7, diseño orientado a objetos.

---

## 1. Analogía de la mesa

Piensa en una mesa de casino.

* **Card:** una carta física. Palo y rango no cambian después de imprimirse.
* **Deck:** el shoe. Barajas, repartes de una en una y sabes cuándo está vacío.
* **Hand:** las cartas que un jugador sostiene ahora. Añades cartas y las puntúas según las reglas del juego.
* **Blackjack:** las mismas cartas, otro mapa de valores. Un as es blando hasta que contarlo como once te pasaría.

Si metes a la fuerza el "valor de blackjack" en un `Card` genérico, cualquier otro juego (poker, guerra, rummy) hereda reglas incorrectas. Deja el valor abierto. Especializa la puntuación donde vive el juego.

---

## 2. Problema en palabras simples

**Objetivo:** diseñar clases para una baraja genérica y mostrar cómo subclasificarlas para blackjack.

**Tipos que la gente suele nombrar:**

| Tipo | Rol |
| --- | --- |
| `Suit` | Club, Diamond, Heart, Spade (enum) |
| `Card` | un palo + valor de cara (1-13 o As-Rey) |
| `Deck` | lista de cartas; barajar, repartir, cartas restantes |
| `Hand` | colección de cartas que sostiene un jugador |
| `BlackJackCard` | carta que conoce el valor de cara en blackjack |
| `BlackJackHand` | mano que puntúa blackjack (ases blandos, pasarse) |

**Aclara en la entrevista:**

* ¿Una baraja o shoe multi-baraja? (Empieza con una de 52.)
* ¿Incluyen comodines? (Normalmente no.)
* Codificación de cara: as = 1, jota = 11, reina = 12, rey = 13 vale para la clase base.
* La puntuación de blackjack es más asunto de la mano que de una sola carta cuando los ases pueden ser 1 u 11.
* Baraja vacía al repartir: devolver `null`, lanzar o optional; elige un contrato.

**Forma de métodos (bosquejo):**

```java
// Deck
void shuffle();
Card dealCard();
int remainingCards();

// Hand
void addCard(Card c);
int score(); // específico del juego en subclases

// BlackJackHand
boolean isBusted();
boolean is21();
boolean isBlackjack(); // natural de 2 cartas a 21
```

---

## 3. Piensa primero

### Separar identidad del valor de juego

Una carta **es** un palo y un rango. Eso es estable. Lo que **vale** depende del juego.

Dos opciones limpias:

1. El `Card` base expone `value()` como rango de cara (1-13). Blackjack lo mapea a 1, 2, ..., 10, 10, 10, 10.
2. `value()` abstracto en `Card`, concreto en `BlackJackCard`.

La opción 1 es más simple para una librería multi-juego. La 2 vale cuando el ejercicio es "subclasifica para blackjack". Este post usa un `Card` base con valor de cara, luego `BlackJackCard` que redefine el valor efectivo en la puntuación, y pone la lógica multi-as en `BlackJackHand`.

### Deck es contenedor de barajar + repartir

`Deck` posee un `ArrayList<Card>` (o `LinkedList`). La construcción llena 52 cartas. `shuffle` usa `Collections.shuffle` (o Fisher-Yates a mano si prohíben la librería). `dealCard` quita del final (o avanza un índice) en O(1).

No reconstruyas toda la lista en cada reparto. Un índice `dealt` también funciona: las cartas a partir de ahí siguen en el shoe.

### Hand es una lista; la puntuación es polimórfica

`Hand` guarda cartas. Un `score()` genérico puede sumar valores de cara. `BlackJackHand` redefine: cuenta ases, suma no-ases, y asigna a cada as 11 o 1 sin pasar de 21 cuando sea posible.

### Herencia vs composición

* **Herencia:** `BlackJackCard extends Card`, `BlackJackHand extends Hand`. Encaja con el enunciado clásico ("subclass").
* **Composición:** un `BlackjackScorer` como estrategia sobre un `Hand` plano. Más limpio si hay muchos juegos después; menciónalo si el entrevistador profundiza.

Para este problema, la herencia es la primera respuesta esperada.

### Algoritmo de ases blandos (núcleo de la puntuación)

1. Suma cada no-as como min(cara, 10). Cuenta ases.
2. Total = nonAceSum + ases (cada as empieza en 1).
3. Por cada as, si total + 10 <= 21, suma 10 (promueve ese as de 1 a 11). Como máximo una promoción es útil para un solo total de mano bajo reglas estándar, pero el bucle es claro y correcto.

Ejemplo: As + 6 = soft 17 (1+6+10). As + As + 9 = 21 (1+1+9+10). As + 10 + 10 = 21 con ases en 1.

---

## 4. Solución en Java

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

Recorrido de la puntuación:

| Mano | Cálculo | Puntuación |
| --- | --- | --- |
| As, 6 | 1+6, promueve as +10 | 17 (soft) |
| Rey, Reina | 10+10 | 20 |
| As, Rey | 1+10, promueve +10 | 21 (blackjack si dos cartas) |
| As, As, 9 | 1+1+9, una promoción +10 | 21 |
| 10, 9, 5 | 10+9+5 | 24 (pasado) |

Bosquejo del bucle de reparto:

```java
Deck shoe = Deck.blackjackDeck();
shoe.shuffleFresh(new Random(42));

BlackJackHand player = new BlackJackHand();
player.addCard(shoe.dealCard());
player.addCard(shoe.dealCard());

System.out.println(player.score());
System.out.println(player.isBlackjack());
```

Nota de fábrica: el constructor privado `Deck(boolean blackjack)` deja un solo sitio que llena palos y rangos. En una entrevista de diseño puro puedes saltarte la fábrica y dibujar solo UML más el método de puntuación.

---

## 5. Notas de diseño y complejidad

| Pieza | Tiempo | Espacio / notas |
| --- | --- | --- |
| Construir baraja | O(1) | 52 fijas (o 52 * n multi-baraja) |
| `shuffle` | O(N) | N restantes o baraja completa |
| `dealCard` | O(1) | avanzar índice; evita remove(0) en ArrayList |
| `Hand.addCard` | O(1) amortizado | append a la lista |
| `BlackJackHand.score` | O(K) | K cartas en la mano (pequeño en la práctica) |

Checklist de diseño que suele gustar:

* **Encapsulación:** valor de cara y palo finales en `Card`.
* **Enum para palo:** sin strings mágicos, fácil de recorrer.
* **Punto de extensión:** la puntuación vive en la mano (y el mapa de valor de carta), no repartida en el bucle del crupier.
* **Contrato de reparto nulo:** documenta `dealCard() -> null` cuando está vacía para que el caller mire `remainingCards()`.
* **Inmutabilidad de cartas:** no cambian de palo a mitad de partida; las manos cambian de miembros.

Shoe multi-baraja: construye `n * 52` cartas igual, o compón `List<Deck>`. La puntuación no mira cuántas barajas hay.

---

## 6. Casos borde y errores comunes

Los entrevistadores pinchan aquí:

* **Baraja vacía:** `dealCard` devuelve `null` (o lanza). Nunca indexes más allá de `cards.size()`.
* **Barajar a mitad de mano:** o barajas solo las restantes o reseteas `dealt` para un reshuffle completo. Di ambas opciones.
* **As contado dos veces:** no cuentes el as como 11 en `BlackJackCard.value()` y otra vez en la mano. Deja el as en 1 en la carta; promueve en la mano.
* **Varios ases:** As+As+9 = 21, no 31. El bucle de promoción debe parar en 21.
* **Pasarse con ases:** As+10+10 debe quedarse en 21 con as en 1, no forzar 31.
* **Natural vs 21 después:** `isBlackjack` es dos cartas y 21. Un 21 de cinco cartas no es natural.
* **Mezclar `Card` plano en `BlackJackHand`:** o lo prohíbes o mapeas valores de cara como en el bucle de score de arriba.
* **Comodines / barajas incompletas:** fuera de alcance salvo que pregunten; declara la asunción.

Errores comunes:

1. **Meter blackjack a la fuerza solo en `Card`.** El poker no lo reutiliza bien.
2. **`ArrayList.remove(0)` para repartir.** O(N) por reparto. Usa un índice o quita del final.
3. **Olvidar que las figuras valen 10.** La jota no son 11 puntos en blackjack.
4. **Devolver todos los totales posibles** sin elegir el mejor <= 21. La lógica soft necesita un solo score para el bust.
5. **Sin enum para palos.** Palos como string invitan a typos.
6. **Campos públicos mutables en la carta.** Prefiere private final + getters.

Idea mínima de smoke:

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

## 7. Resumen para contárselo a un amigo

Deck of Cards es un arranque de OOD, no un algoritmo duro:

1. Modela **Card** como palo + valor de cara. El palo es un enum. La cara se queda en 1-13.
2. **Deck** construye 52 cartas, baraja y reparte en O(1) con un cursor.
3. **Hand** guarda cartas. El score genérico puede sumar caras.
4. **BlackJackCard** mapea caras a pips de blackjack (as 1 a nivel carta, 10 para 10/J/Q/K).
5. **BlackJackHand** puntúa ases blandos: ases empiezan en 1, se promueven a 11 mientras el total quede <= 21. Bust y blackjack natural son capas finas sobre ese score.
6. Deja las reglas del juego en la subclase para que una baraja plana siga sirviendo a otros juegos.

Si puedes dibujar los cinco tipos, explicar por qué la promoción del as vive en la mano y repartir sin removes O(N), dominas el 7.1. Siguiente en el capítulo 7: enrutado de llamadas del call center y niveles de empleado.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Poison](/blog/es/ctci-6-10-poison)
* Siguiente: [Call Center](/blog/es/ctci-7-2-call-center)