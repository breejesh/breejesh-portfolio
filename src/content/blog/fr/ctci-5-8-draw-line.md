---
title: "Draw Line: tracer une ligne horizontale sur un écran empaqueté en octets (Java)"
description: "Problème style CTCI 5.8 pour débutants: écran monochrome stocké en tableau d'octets, huit pixels par octet. Trace une ligne horizontale de (x1, y) à (x2, y) avec des masques de bits sur les octets partiels et 0xFF sur les complets."
date: "2026-02-16"
tags: [Algorithmes]
coverImage: /assets/images/ctci-5-8-draw-line.webp
previewImage: /assets/images/ctci-5-8-draw-line.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.8 pour débutants: écran monochrome stocké en tableau d'octets, huit pixels par octet. Trace une ligne horizontale de (x1, y) à (x2, y) avec des masques de bits sur les octets partiels et 0xFF sur les complets.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un vieil écran bon marché n'a pas de couleur. Chaque pixel est allumé ou éteint. La mémoire est serrée, donc le matériel range **huit pixels dans un octet**. On te donne un `byte[]` plat et une largeur. Ton travail: allumer chaque pixel d'une ligne horizontale, de la colonne `x1` à la colonne `x2` sur la ligne `y`, sans boucler sur chaque bit quand des octets entiers se trouvent au milieu.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien sur le dessin dans un buffer de bits, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 5, manipulation de bits, se termine ici.

---

## 1. Analogie du quotidien

Imagine une rangée d'interrupteurs sur un long mur. Ils viennent par paquets de huit: chaque paquet est une barrette en plastique, un octet. Tu bascules un interrupteur et ce pixel s'allume.

Tu as besoin d'une barre horizontale du commutateur `x1` au `x2` sur une étagère (rangée `y`).

Si la barre est courte et tient dans un seul paquet, tu ne touches qu'à ces interrupteurs. Si elle est longue, le milieu ce sont des paquets entiers allumés: tu allumes toute la barrette d'un coup (`0xFF`). Seules la première et la dernière barrette demandent des bascules partielles. C'est toute l'idée.

---

## 2. Énoncé en mots simples

**Entrée:**

* `byte[] screen`: framebuffer monochrome empaqueté. Bit `1` = pixel allumé, `0` = éteint.
* `int width`: largeur de l'écran en **pixels**. Garantie divisible par 8, donc une rangée ne coupe jamais un octet entre deux lignes.
* `int x1`, `int x2`: colonnes de début et de fin de la ligne (inclusives).
* `int y`: indice de rangée.

**Sortie:** muter `screen` pour que chaque pixel de `(x1, y)` à `(x2, y)` soit allumé. Les autres restent (utilise OR, pas d'écrasement aveugle sur les octets partiels).

**Disposition (MSB à gauche):**

* Octets par rangée: `width / 8`.
* Indice d'octet du pixel `(x, y)`: `(width / 8) * y + (x / 8)`.
* Bit dans l'octet: l'offset `x % 8` correspond au bit `(7 - (x % 8))`. Le pixel le plus à gauche de l'octet est le bit de poids fort.

**Forme de la signature:**

```java
void drawLine(byte[] screen, int width, int x1, int x2, int y)
```

**Petit exemple:** largeur `16` (deux octets par rangée). Tracer de `x1 = 3` à `x2 = 12` sur `y = 0`.

```
byte 0 of row 0          byte 1 of row 0
pixels 0 1 2 3 4 5 6 7   8 9 10 11 12 13 14 15
bits   7 6 5 4 3 2 1 0   7 6  5  4  3  2  1  0

before: 00000000 00000000
after:  00011111 11111000
        ^^^start mask     end mask^^^
        full run in the middle is just those bits; no full middle byte here
```

Si la ligne était plus longue et traversait trois colonnes d'octets ou plus, les colonnes du milieu passeraient à `0xFF` en une écriture chacune.

**Clarifie avant de coder:**

* `x1` et `x2` sont-ils inclusifs? (Oui.)
* Et si `x1 > x2`? (Échange, ou laisse vide. En entretien, le swap passe souvent.)
* MSB ou LSB à gauche? (Annonce ta convention. Ici MSB = pixel de gauche.)
* Le dessin efface-t-il les autres pixels? (Non. Sur les bords, `|=`.)
* La largeur est-elle toujours un multiple de 8? (Oui, dans l'énoncé classique.)

---

## 3. Réfléchis d'abord

### Naïf: un pixel à la fois

```
for x from x1 to x2:
    setBit(screen, width, x, y)
```

`setBit` trouve l'octet, construit un masque d'un bit, fait un OR. Correct. Simple. Pour une ligne de longueur L tu touches L bits. Correct pour les petites lignes. Mauvais quand L vaut des milliers et que la plupart de ces bits vivent dans des octets du milieu que tu pourrais remplir d'un coup.

### Mieux: octets complets + masques sur les bords

Trouve les colonnes d'octets de `x1` et `x2` sur la rangée `y`.

1. **Octet partiel de début**: masque depuis l'offset de départ jusqu'à la fin de cet octet.
2. **Octets du milieu complets**: chaque octet strictement entre début et fin devient `0xFF` (ou `|= 0xFF`).
3. **Octet partiel de fin**: masque du début de cet octet jusqu'à l'offset final.
4. **Cas même octet**: si `x1` et `x2` partagent un octet, AND des deux masques, une seule application. Ne lance pas la logique des octets complets, sinon tu casses l'intervalle.

Offsets:

```
startOffset = x1 % 8
endOffset   = x2 % 8
startByte   = x1 / 8
endByte     = x2 / 8
```

Masque de début (allumer de `startOffset` à la fin de l'octet):

```
startMask = 0xFF >>> startOffset
// startOffset 0 -> 11111111
// startOffset 3 -> 00011111
```

Masque de fin (allumer du début de l'empaquetage jusqu'à `endOffset`):

```
endMask = 0xFF << (7 - endOffset)   // puis garder les 8 bits bas
// endOffset 0 -> 10000000
// endOffset 3 -> 11110000
// endOffset 7 -> 11111111
```

Premier et dernier index d'octet complet:

* Si la ligne commence au milieu d'un octet, le premier octet *complet* est `startByte + 1`.
* Si elle finit au milieu (pas sur le dernier bit), le dernier octet *complet* est `endByte - 1`.
* Si `firstFull > lastFull`, il n'y a pas d'octets du milieu. Couvre les lignes courtes et le cas même-octet.

La hauteur est `screen.length / (width / 8)`. Tu n'en as souvent pas besoin si `y` est valide.

---

## 4. Solution Java

### Helpers (optionnels mais clairs)

```java
/** Bytes in one scanline. width is in pixels and divisible by 8. */
static int bytesPerRow(int width) {
    return width / 8;
}

static int byteIndex(int width, int x, int y) {
    return bytesPerRow(width) * y + (x / 8);
}
```

### Principale: masques + octets complets

```java
void drawLine(byte[] screen, int width, int x1, int x2, int y) {
    if (screen == null || width <= 0 || (width % 8) != 0) {
        return;
    }
    if (x1 > x2) {
        int t = x1;
        x1 = x2;
        x2 = t;
    }
    // optional: clamp or reject out-of-range x/y in a real graphics API

    int bytesPerRow = width / 8;
    int rowBase = bytesPerRow * y;

    int startOffset = x1 % 8;
    int endOffset = x2 % 8;
    int startByte = x1 / 8;
    int endByte = x2 / 8;

    // masks use int then cast; Java bytes are signed
    int startMask = 0xFF >>> startOffset;
    int endMask = 0xFF << (7 - endOffset);
    endMask &= 0xFF;

    if (startByte == endByte) {
        // both ends inside one byte
        int mask = startMask & endMask;
        screen[rowBase + startByte] |= (byte) mask;
        return;
    }

    // left partial (if any bits remain from startOffset to end of byte)
    screen[rowBase + startByte] |= (byte) startMask;

    // full middle bytes
    for (int b = startByte + 1; b <= endByte - 1; b++) {
        screen[rowBase + b] = (byte) 0xFF;
        // or |= (byte) 0xFF if you prefer pure OR everywhere
    }

    // right partial
    screen[rowBase + endByte] |= (byte) endMask;
}
```

Parcours, largeur `32` (4 octets/rangée), ligne `x1 = 5`, `x2 = 26`, `y = 0`:

| Morceau | Col. octet | Masque / valeur | Sens |
| --- | --- | --- | --- |
| start | 0 | `0xFF >>> 5` = `0x07` | pixels 5,6,7 |
| full | 1 | `0xFF` | pixels 8-15 |
| full | 2 | `0xFF` | pixels 16-23 |
| end | 3 | `0xFF << (7-2)` = `0xE0` | pixels 24,25,26 (`endOffset = 2`) |

`startByte = 0`, `endByte = 3`. La boucle du milieu fait `b = 1` et `b = 2`. Le chemin même-octet n'est pas pris.

### Vérification même octet

`x1 = 10`, `x2 = 13`, largeur `32`: les deux dans la colonne d'octet `1`, offsets `2` et `5`.

```
startMask = 0xFF >>> 2 = 00111111
endMask   = 0xFF << (7-5) = 11111100   (low 8)
combined  = 00111100
```

Les pixels 10,11,12,13 s'allument. Les voisins 8,9,14,15 restent éteints s'ils l'étaient.

### Référence naïve (pour les tests)

```java
void drawLineNaive(byte[] screen, int width, int x1, int x2, int y) {
    if (x1 > x2) {
        int t = x1;
        x1 = x2;
        x2 = t;
    }
    for (int x = x1; x <= x2; x++) {
        int index = (width / 8) * y + (x / 8);
        int bit = 7 - (x % 8);
        screen[index] |= (byte) (1 << bit);
    }
}
```

Compare les deux sur des intervalles aléatoires. S'ils divergent, la version masques est fausse.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Boucle setBit par pixel | O(L) | O(1) | L = x2 - x1 + 1 |
| Octets complets + 2 masques | O(B) | O(1) | B ≈ colonnes d'octets touchées, ~L/8 |
| Construire toute une rangée | O(width) | O(width/8) | Excessif pour une ligne |

B est environ huit fois plus petit que L sur les longues lignes. C'est pourquoi les intervieweurs veulent le remplissage en masse. Sur les lignes courtes les deux marchent; la version masques montre que tu comprends l'empaquetage.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs testent ça:

* **`x1 == x2`**: un pixel. Chemin même-octet avec un masque d'un bit.
* **`x1` et `x2` dans le même octet, plusieurs pixels**: il faut un AND des masques. L'oublier est le bug classique.
* **Ligne d'octets entiers exacts** (`x1 % 8 == 0` et `x2 % 8 == 7`): masques de début et de fin = `0xFF`. La structure même-octet vs multi reste correcte.
* **Pas d'octets du milieu**: seulement deux partiels adjacents. Le corps de la boucle ne s'exécute pas.
* **`x1 > x2`**: swap d'abord ou définis vide. Ne dessine pas rien en silence sans le dire.
* **`y` hors plage / `x` au-delà de la largeur**: le vrai code doit valider. Le croquis d'entretien le note.
* **`byte` signé en Java**: `(byte) 0xFF` vaut `-1`. Correct pour des motifs de bits. Calcule les masques en `int`, puis cast.
* **`>>` sur des entiers de masque déjà négatifs**: construis depuis `0xFF` positif.
* **Écraser les partiels avec `=` au lieu de `|=`**: efface des pixels de l'octet hors ligne.
* **Supposer LSB à gauche**: annonce MSB-gauche (ou inverse les masques).

Erreurs fréquentes:

1. **Pas de branche même-octet.** Masque de début, puis de fin, parfois un `0xFF` qui ne devrait pas exister.
2. **Off-by-one sur la plage d'octets complets.** Inclure `startByte` ou `endByte` dans la boucle `0xFF` casse les partiels.
3. **Mauvaise formule de masque de fin.** Préfère `0xFF << (7 - endOffset)` avec un masque 8 bits.
4. **Oublier le stride `width / 8`.** L'index est `rowBase + byteCol`, pas un `x` plat.
5. **Traiter width comme des octets.** Dans l'énoncé classique ce sont des pixels.
6. **Effacer tout l'écran.** Dessiner allume les bits de la ligne, ne réécrit pas le buffer uniquement avec cette ligne.

Test minimal:

```java
byte[] screen = new byte[4]; // width 16, height 2
drawLine(screen, 16, 3, 12, 0);
// row 0: expect roughly 00011111 11111000
System.out.printf("%8s %8s%n",
    String.format("%8s", Integer.toBinaryString(screen[0] & 0xFF)).replace(' ', '0'),
    String.format("%8s", Integer.toBinaryString(screen[1] & 0xFF)).replace(' ', '0'));

byte[] a = new byte[8];
byte[] b = new byte[8];
drawLine(a, 32, 5, 26, 0);
drawLineNaive(b, 32, 5, 26, 0);
// assert Arrays.equals(a, b)
```

---

## 7. Résumé pour un ami

Draw Line empaquette un écran monochrome en octets, huit pixels chacun. Tu peins un segment horizontal.

1. Mappe `(x, y)` vers un index d'octet avec le stride `width / 8` et le bit depuis `x % 8` (MSB à gauche).
2. Naïf: boucle chaque pixel et OR d'un masque d'un bit. Correct, O(longueur).
3. Mieux: masque du premier octet partiel, `0xFF` sur chaque octet du milieu, masque du dernier partiel.
4. Si début et fin partagent un octet, AND des deux masques et une seule application.
5. Utilise `|=` sur les bords pour ne pas effacer les voisins. Attention aux octets signés en Java et à l'off-by-one de la plage complète.

Si tu peux dessiner une rangée de 16 pixels sur papier, marquer `x1` et `x2`, écrire les deux masques en binaire et expliquer pourquoi le même octet est spécial, tu maîtrises le 5.8. Le chapitre 5 se ferme sur un morceau de graphismes qui est en réalité une mise à jour d'intervalle sur un bitset.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Pairwise Swap](/blog/fr/ctci-5-7-pairwise-swap)
* Suivant: [The Heavy Pill](/blog/fr/ctci-6-1-the-heavy-pill)