---
title: "Trois en Un: Implémenter Trois Piles dans un Tableau Unique (CTCI 3.1)"
description: "Découvrez comment utiliser un tableau unique pour implémenter trois piles indépendantes avec division fixe et partitionnement dynamique en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Décrivez comment vous pourriez utiliser un tableau unique pour implémenter trois piles indépendantes.
> * **La Solution Optimale:** (1) Division Fixe : Découpez le tableau en trois blocs contigus égaux $[0, N/3)$, $[N/3, 2N/3)$, $[2N/3, N)$ avec des compteurs de taille ; (2) Division Flexible : Permettez aux piles de partager dynamiquement la capacité via décalage circulaire modulo la capacité totale.
> * **Réalité en Production:** Allocateurs de piles d'exécution de threads et optimisation de cache L1.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 3.1), la question posée est :

*"Décrivez comment vous pourriez utiliser un seul tableau pour implémenter trois piles."*

## 2. Approche 1: Division Fixe (Simple et Rapide)

Nous découpons le tableau en trois segments égaux de taille `stackCapacity` :
* Pile 0 : indices $[0, \text{stackCapacity} - 1]$
* Pile 1 : indices $[\text{stackCapacity}, 2 \times \text{stackCapacity} - 1]$
* Pile 2 : indices $[2 \times \text{stackCapacity}, 3 \times \text{stackCapacity} - 1]$

Un tableau `sizes` de longueur 3 enregistre le nombre d'éléments dans chaque pile.
* `push(stackNum, value)` : Incrémente `sizes[stackNum]` et écrit à l'indice `stackNum * stackCapacity + sizes[stackNum] - 1`.
* `pop(stackNum)` : Récupère la valeur et décrémente la taille.

## Implémentation de Production

```java
import java.util.EmptyStackException;

public class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    public FixedMultiStack(int stackSize) {
        stackCapacity = stackSize;
        values = new int[stackSize * numberOfStacks];
        sizes = new int[numberOfStacks];
    }

    /**
     * Empile une valeur sur la pile specifiee (0, 1 ou 2).
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public void push(int stackNum, int value) throws Exception {
        if (isFull(stackNum)) {
            throw new Exception("La pile " + stackNum + " est pleine");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    /**
     * Depile l'element superieur de la pile specifiee.
     * Complexite Temporelle: O(1)
     */
    public int pop(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        int topIndex = indexOfTop(stackNum);
        int value = values[topIndex];
        values[topIndex] = 0;
        sizes[stackNum]--;
        return value;
    }

    public int peek(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        return values[indexOfTop(stackNum)];
    }

    public boolean isEmpty(int stackNum) {
        return sizes[stackNum] == 0;
    }

    public boolean isFull(int stackNum) {
        return sizes[stackNum] == stackCapacity;
    }

    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        int size = sizes[stackNum];
        return offset + size - 1;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| push / pop / peek | `O(1)` | Calcul d'indice immédiat via `offset + size - 1`. |
| Espace Auxiliaire | `O(N)` | Mémoire contiguë sans surcoût d'en-tête d'objets. |

## Ingénierie des Systèmes en Production

### Architecture Système : Arènes Mémoire Contiguës

1. **Systèmes Embarqués Temps Réel :** Allocation d'une arène plate unique pour les piles de contextes de threads, évitant la fragmentation du tas.
2. **Localité Spatiale du Cache CPU :** L'organisation contiguë maximise la mise en mémoire cache L1.

## Cas Limites et Robustesse

1. **Indice de pile invalide :** Protégé par la validation $0 \le \text{stackNum} < 3$.
2. **Débordement de pile :** Lève une exception claire lorsque `sizes[stackNum] == stackCapacity`.
3. **Pile vide :** Lève `EmptyStackException`.
