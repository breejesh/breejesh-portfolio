---
title: "File via Piles: Implémenter une File d'Attente avec Deux Piles (CTCI 3.4)"
description: "Implémentez une file d'attente FIFO à l'aide de deux piles LIFO avec transfert paresseux en temps amorti O(1) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez la classe `MyQueue` pour construire une file d'attente à l'aide de deux piles.
> * **La Solution Optimale:** Maintenez deux piles : `stackNewest` (reçoit les nouveaux éléments) et `stackOldest` (fournit les extractions et consultations dans l'ordre FIFO). Transférez les éléments de manière paresseuse uniquement lorsque `stackOldest` est vide, assurant un temps amorti de $O(1)$ par opération.
> * **Réalité en Production:** Boîtes aux lettres d'acteurs concurrents (Erlang/Akka) et boucles de rendu à double tampon.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 3.4), l'énoncé est :

*"Implémentez une classe MyQueue qui implémente une file d'attente à l'aide de deux piles."*

**Principe Fondamental :**
Une pile fonctionne selon le principe LIFO (Last-In, First-Out), tandis qu'une file suit le principe FIFO (First-In, First-Out). En empilant des éléments sur une première pile puis en les dépilant vers une seconde pile, l'ordre s'inverse parfaitement, transformant LIFO en FIFO.

## 2. Transfert Paresseux (Lazy Shifting)

1. **`add(value)` :** Empiler systématiquement sur `stackNewest`.
2. **`shiftStacks()` :** Si et seulement si `stackOldest` est vide, dépiler tous les éléments de `stackNewest` pour les empiler sur `stackOldest`.
3. **`remove()` / `peek()` :** Exécuter `shiftStacks()`, puis dépiler ou consulter depuis `stackOldest`.

Chaque élément est inséré une seule fois dans `stackNewest`, transféré une seule fois et dépilé une seule fois de `stackOldest`, ce qui garantit un coût amorti par élément de $O(1)$.

## Implémentation de Production

```java
import java.util.NoSuchElementException;
import java.util.Stack;

public class MyQueue<T> {
    private final Stack<T> stackNewest;
    private final Stack<T> stackOldest;

    public MyQueue() {
        stackNewest = new Stack<>();
        stackOldest = new Stack<>();
    }

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /**
     * Enfile un element a la fin de la file.
     * Complexite Temporelle: O(1)
     */
    public void add(T value) {
        stackNewest.push(value);
    }

    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /**
     * Consulte l'element en tete de file.
     * Complexite Temporelle: O(1) amorti
     */
    public T peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.peek();
    }

    /**
     * Defile l'element en tete.
     * Complexite Temporelle: O(1) amorti
     */
    public T remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.pop();
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| add(T) | `O(1)` | Insertion directe dans stackNewest. |
| remove() / peek() | `O(1) amorti` | Pire cas en $O(N)$ lors du transfert, mais chaque élément est déplacé au plus une fois. |
| Espace Auxiliaire | `O(N)` | $N$ éléments répartis sur les deux piles. |

## Ingénierie des Systèmes en Production

### Architecture Système : Modèle d'Acteurs et Double Tampon

1. **Boîtes aux Lettres d'Acteurs (Erlang / Akka) :** Les messages entrants sont enregistrés dans un tampon sans bloquer le thread de traitement actif.
2. **Double Tamponnage Graphique :** Alternance fluide entre la mémoire de tracé et la mémoire d'affichage.

## Cas Limites et Robustesse

1. **Extraction d'une file vide :** Lève `NoSuchElementException`.
2. **Alternance d'opérations d'ajout et de retrait :** Le transfert paresseux ne se déclenche que lorsque `stackOldest` est vide, préservant strictement l'ordre FIFO.
