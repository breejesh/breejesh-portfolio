---
title: "Inverser un Bit pour Gagner: Plus Longue Séquence de 1s avec un Seul Bit Inversé (CTCI 5.3)"
description: "Trouvez la longueur de la plus longue séquence de 1s obtenue en inversant exactement un bit 0 en 1 dans un entier en temps O(b) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
previewImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous disposez d'un entier et vous pouvez inverser exactement un bit de 0 à 1. Écrivez le code permettant de trouver la longueur de la plus longue séquence consécutive de 1s que vous pouvez créer.
> * **La Solution Optimale:** Suivi de Plages en Passe Unique : Maintenez deux compteurs, `currentLength` et `previousLength`. Lorsque vous rencontrez un `0`, si le bit suivant est `1`, `previousLength = currentLength` ; s'il vaut `0`, `previousLength = 0`. Mettez à jour $\text{maxLength} = \max(\text{maxLength}, \text{previousLength} + \text{currentLength} + 1)$ en temps $O(b)$ et espace $O(1)$.
> * **Réalité en Production:** Allocation de pages mémoire par masques de bits et algorithmes de compression par plages (RLE).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.3), la question posée est :

*"Vous avez un entier et vous pouvez inverser exactement un bit de 0 à 1. Écrivez un code pour trouver la longueur de la plus longue séquence de 1s que vous pourriez créer."*

**Exemple :**
* Entrée : `1775` (binaire `11011101111_2`)
* Sortie : `8` (en inversant le 0 à l'indice 4).

## 2. Mécanique Algorithmique

1. Initialiser `currentLength = 0`, `previousLength = 0`, `maxLength = 1`.
2. Examiner le bit de poids faible (`a & 1`) :
   * Si `1` : incrémenter `currentLength++`.
   * Si `0` :
     * Si le bit suivant (`a & 2`) est aussi 0, `previousLength = 0`.
     * Sinon, `previousLength = currentLength`.
     * Réinitialiser `currentLength = 0`.
3. Mettre à jour `maxLength = Math.max(previousLength + currentLength + 1, maxLength)`.
4. Décaler à droite avec `a >>>= 1`.

## Implémentation de Production

```java
public class FlipBitToWin {
    /**
     * Calcule la plus longue sequence de 1s réalisable avec une inversion de bit.
     * Complexite Temporelle: O(b) ou b est le nombre de bits (<= 32 pour int).
     * Complexite Spatiale: O(1)
     */
    public static int flipBit(int a) {
        if (~a == 0) return Integer.BYTES * 8;

        int currentLength = 0;
        int previousLength = 0;
        int maxLength = 1;

        while (a != 0) {
            if ((a & 1) == 1) {
                currentLength++;
            } else if ((a & 1) == 0) {
                previousLength = ((a & 2) == 0) ? 0 : currentLength;
                currentLength = 0;
            }
            maxLength = Math.max(previousLength + currentLength + 1, maxLength);
            a >>>= 1;
        }

        return maxLength;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(b)` | Inspecte au plus 32 bits par opérations bit-à-bit. |
| Espace Auxiliaire | `O(1)` | Utilise uniquement des variables entières en registres. |

## Ingénierie des Systèmes en Production

### Architecture Système : Bitmap et Allocation Mémoire

1. **Allocateur de Pages Système (Noyau OS) :** Balaye les bitmaps de trames de page pour identifier les segments contigus disponibles.
2. **Compression de Données (Snappy / LZ4) :** Détection de séquences répétitives d'octets.

## Cas Limites et Robustesse

1. **Que des 1s (`-1` / `0xFFFFFFFF`) :** Renvoie 32.
2. **Que des 0s (`0`) :** Renvoie 1.
