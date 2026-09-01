---
title: "Intersection: Déterminer si Deux Listes Chaînées S'Intersectent (CTCI 2.7)"
description: "Déterminez si deux listes simplement chaînées s'intersectent par référence et retournez le nœud d'intersection en temps O(N + M) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné deux listes simplement chaînées, déterminez si elles s'intersectent. Retournez le nœud d'intersection (défini par référence mémoire, et non par valeur).
> * **La Solution Optimale:** Parcourez les deux listes pour calculer leurs longueurs et leurs nœuds de fin (`tail`). Si les queues diffèrent (`tail1 != tail2`), il n'y a pas d'intersection. Si elles coïncident, avancez le pointeur de la liste la plus longue de $|long_1 - long_2|$ crans, puis avancez les deux pointeurs en parallèle jusqu'à ce que `p1 == p2` en temps $O(N + M)$ et espace $O(1)$.
> * **Réalité en Production:** Détection de graphes de références partagées dans les ramasse-miettes (Garbage Collectors) et résolution de commits dans les DAGs Git.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 2.7), la question posée est :

*"Étant donné deux listes simplement chaînées, déterminez si elles s'intersectent. Retournez le nœud d'intersection. L'intersection est définie par référence mémoire et non par valeur de données."*

**Aperçu Fondamental :**
Dans une liste simplement chaînée, chaque nœud ne possède qu'un seul pointeur `next`. Dès lors que deux listes se rejoignent sur un nœud partagé, **tous les nœuds suivants sont strictement identiques**, formant une structure en "Y" menant au même nœud final.

## 2. Alignement des Longueurs et Vérification de Queue

1. Parcourir la Liste 1 : calculer la longueur $len_1$ et le dernier nœud $tail_1$.
2. Parcourir la Liste 2 : calculer la longueur $len_2$ et le dernier nœud $tail_2$.
3. Comparer les queues : si `tail1 != tail2`, retourner `null` immédiatement.
4. Positionner deux pointeurs en tête des deux listes.
5. Décaler le pointeur de la liste la plus longue de $|len_1 - len_2|$ nœuds.
6. Avancer les deux pointeurs de concert jusqu'à collision (`p1 == p2`).
7. Retourner `p1` (le nœud d'intersection).

## Implémentation de Production

```java
public class IntersectionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    private static class Result {
        public LinkedListNode tail;
        public int size;
        public Result(LinkedListNode tail, int size) {
            this.tail = tail;
            this.size = size;
        }
    }

    /**
     * Trouve le noeud d'intersection entre deux listes chainees.
     * Complexite Temporelle: O(A + B)
     * Complexite Spatiale: O(1)
     */
    public static LinkedListNode findIntersection(LinkedListNode list1, LinkedListNode list2) {
        if (list1 == null || list2 == null) return null;

        Result result1 = getTailAndSize(list1);
        Result result2 = getTailAndSize(list2);

        // Si les queues sont differentes, aucune intersection
        if (result1.tail != result2.tail) {
            return null;
        }

        LinkedListNode shorter = result1.size < result2.size ? list1 : list2;
        LinkedListNode longer = result1.size < result2.size ? list2 : list1;

        // Aligner le pointeur le plus long
        longer = getKthNode(longer, Math.abs(result1.size - result2.size));

        // Avancer jusqu'a la collision
        while (shorter != longer) {
            shorter = shorter.next;
            longer = longer.next;
        }

        return longer;
    }

    private static Result getTailAndSize(LinkedListNode list) {
        if (list == null) return null;

        int size = 1;
        LinkedListNode current = list;
        while (current.next != null) {
            size++;
            current = current.next;
        }
        return new Result(current, size);
    }

    private static LinkedListNode getKthNode(LinkedListNode head, int k) {
        LinkedListNode current = head;
        while (k > 0 && current != null) {
            current = current.next;
            k--;
        }
        return current;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N + M)` | Mesurer les longueurs prend $N + M$ ; la traversée d'intersection prend au plus $\max(N, M)$. |
| Espace Auxiliaire | `O(1)` | Utilise uniquement des variables de référence sans allocation sur le tas. |

## Ingénierie des Systèmes en Production

### Architecture Système : Ramasse-Miettes et Gestion de Versions

1. **Garbage Collection (JVM / V8) :** Les ramasse-miettes par traçage détectent les structures de mémoire partagées en observant la convergence des pointeurs racines.
2. **Graphes Orientés Acycliques Git (DAG) :** Résolution des points de fusion (`merge base`) entre deux branches divergentes.

## Cas Limites et Robustesse

1. **Aucune intersection :** Identifié en $O(N + M)$ grâce au test sur les queues.
2. **Listes identiques :** Le décalage est de 0 et renvoie la tête immédiatement.
3. **Intersection en tête :** Collision instantanée à l'étape 0.
