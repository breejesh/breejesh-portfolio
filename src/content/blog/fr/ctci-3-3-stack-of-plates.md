---
title: "Pile d'Assiettes: Implémenter SetOfStacks avec Capacité Seuil (CTCI 3.3)"
description: "Implémentez SetOfStacks composé de plusieurs sous-piles limitées en capacité et réalisez l'opération popAt(index) en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez une pile d'assiettes susceptible de s'effondrer si elle devient trop haute. Implémentez `SetOfStacks` qui crée une nouvelle sous-pile dès que la précédente atteint sa capacité seuil. `push()` et `pop()` doivent fonctionner comme pour une pile unique. *Question subsidiaire :* Implémentez `popAt(int index)`.
> * **La Solution Optimale:** Gérez une liste dynamique `ArrayList<Stack>` de sous-piles. Dès que la sous-pile active est pleine, allouez-en une nouvelle. Pour `popAt`, dépilez directement à l'index désigné et retirez la sous-pile si elle devient vide.
> * **Réalité en Production:** Pagination de mémoire virtuelle et tampons segmentés de type `std::deque`.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 3.3), l'énoncé est :

*"Imaginez une pile d'assiettes. Si la pile devient trop haute, elle risque de basculer. Implémentez une structure de données SetOfStacks qui crée une nouvelle pile dès que la précédente dépasse une certaine capacité. push() et pop() doivent se comporter de manière identique à une pile unique."*

**Question Subsidiaire :**
*"Implémentez une fonction popAt(int index) qui effectue une opération de dépilement sur une sous-pile spécifique."*

## 2. Conception Structurelle

Nous maintenons une liste dynamique de sous-piles : `ArrayList<Stack> stacks = new ArrayList<>()`.
1. **`push(v)` :** Vérifier la dernière sous-pile. Si elle n'existe pas ou est pleine, créer une nouvelle sous-pile et y empiler la valeur.
2. **`pop()` :** Dépiler depuis la dernière sous-pile. Si elle devient vide, la retirer de la liste.
3. **`popAt(int index)` :** Dépiler directement depuis `stacks.get(index)` et supprimer la sous-pile si elle se vide.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.EmptyStackException;
import java.util.Stack;

public class SetOfStacks {
    private final ArrayList<Stack<Integer>> stacks = new ArrayList<>();
    private final int capacity;

    public SetOfStacks(int capacity) {
        this.capacity = capacity;
    }

    public Stack<Integer> getLastStack() {
        if (stacks.isEmpty()) return null;
        return stacks.get(stacks.size() - 1);
    }

    /**
     * Empile une valeur sur la sous-pile active.
     * Complexite Temporelle: O(1)
     */
    public void push(int v) {
        Stack<Integer> last = getLastStack();
        if (last != null && last.size() < capacity) {
            last.push(v);
        } else {
            Stack<Integer> stack = new Stack<>();
            stack.push(v);
            stacks.add(stack);
        }
    }

    /**
     * Depile depuis la derniere sous-pile.
     * Complexite Temporelle: O(1)
     */
    public int pop() {
        Stack<Integer> last = getLastStack();
        if (last == null) throw new EmptyStackException();
        int v = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return v;
    }

    /**
     * Depile depuis une sous-pile specifique.
     * Complexite Temporelle: O(1)
     */
    public int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException();
        }
        Stack<Integer> stack = stacks.get(index);
        int v = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return v;
    }

    public boolean isEmpty() {
        Stack<Integer> last = getLastStack();
        return last == null || last.isEmpty();
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| push / pop | `O(1)` | Accès direct à la queue de la liste de sous-piles. |
| popAt(index) | `O(1)` | Accès indexé direct sans décalage en cascade. |
| Espace Auxiliaire | `O(N)` | Mémoire proportionnelle au nombre d'éléments stockés. |

## Ingénierie des Systèmes en Production

### Architecture Système : Structures de Données Segmentées

1. **Mémoire Virtuelle Paginée :** Allocation de blocs de 4 Ko pour éviter la réservation excessive de mémoire physique continue.
2. **Files à Double Extrémité Segmentées (`std::deque`) :** Évite les copies lors de réallocations de grands tableaux.

## Cas Limites et Robustesse

1. **Dépilement d'un SetOfStacks vide :** Lève `EmptyStackException`.
2. **Sous-pile vidée :** Supprimée proprement de la liste pour éviter toute fuite mémoire.
