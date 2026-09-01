---
title: "Partitionner une Liste: Réorganiser une Liste Chaînée Autour d'une Valeur X (CTCI 2.4)"
description: "Partitionnez une liste simplement chaînée autour d'une valeur x afin que tous les nœuds inférieurs à x précèdent les nœuds supérieurs ou égaux en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-4-partition.webp
previewImage: /assets/images/ctci-2-4-partition.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez le code permettant de partitionner une liste chaînée autour d'une valeur $x$, de telle sorte que tous les nœuds inférieurs à $x$ apparaissent avant tous les nœuds supérieurs ou égaux à $x$.
> * **La Solution Optimale:** Maintenez deux pointeurs `head` et `tail`. Lors du parcours de la liste, insérez les éléments $< x$ en tête (`head`) et les éléments $\ge x$ en queue (`tail`), réalisant une partition en temps $O(N)$ et espace mémoire $O(1)$.
> * **Réalité en Production:** Partitionnement dans l'algorithme Quicksort pour listes chaînées et tri des files d'attente réseau par niveau de priorité QoS.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 2.4), la question posée est :

*"Écrivez le code permettant de partitionner une liste chaînée autour d'une valeur x, de telle sorte que tous les nœuds inférieurs à x apparaissent avant tous les nœuds supérieurs ou égaux à x. Si x est présent dans la liste, ses occurrences doivent simplement se situer après les éléments inférieurs à x."*

**Exemple :**
* Entrée : `3 -> 5 -> 8 -> 5 -> 10 -> 2 -> 1` [partition = `5`]
* Sortie : `1 -> 2 -> 3 -> 5 -> 8 -> 5 -> 10` (ou `3 -> 1 -> 2 -> 10 -> 5 -> 5 -> 8`)

## 2. Approches Algorithmiques

Il existe deux manières principales de concevoir cette partition :

### Approche par Croissance Tête / Queue (Compacte et Efficace)
Si la préservation de l'ordre relatif initial des éléments n'est pas requise (partition instable), nous étendons la liste simultanément par ses deux extrémités :
1. Initialisez `head = node` et `tail = node`.
2. Pour chaque nœud suivant :
   * Si `current.data < x`, insérez-le avant `head` (`current.next = head; head = current;`).
   * Si `current.data >= x`, insérez-le après `tail` (`tail.next = current; tail = current;`).
3. Terminez la liste en appliquant `tail.next = null`.

## Implémentation de Production

```java
public class PartitionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Partitionne une liste chainee autour de la valeur x.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(1) d'espace auxiliaire
     */
    public static LinkedListNode partition(LinkedListNode node, int x) {
        if (node == null) return null;

        LinkedListNode head = node;
        LinkedListNode tail = node;

        LinkedListNode current = node;
        while (current != null) {
            LinkedListNode next = current.next;
            if (current.data < x) {
                // Inserer le noeud en tete
                current.next = head;
                head = current;
            } else {
                // Inserer le noeud en queue
                tail.next = current;
                tail = current;
            }
            current = next;
        }
        tail.next = null;

        return head;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Un seul parcours linéaire sur les $N$ nœuds de la liste. |
| Espace Auxiliaire | `O(1)` | Modification des pointeurs directement en place sans structure externe. |

## Ingénierie des Systèmes en Production

### Architecture Système : Quicksort et Files de Priorité Réseau

1. **Quicksort sur Listes Chaînées :** La phase de partitionnement s'exécute directement sur les pointeurs sans nécessiter d'allocation de tableaux mémoire.
2. **Files d'Attente QoS Réseau :** Séparation des paquets selon des seuils de priorité pour router le trafic en temps réel.

## Cas Limites et Robustesse

1. **Liste vide ou à nœud unique :** Traité immédiatement en $O(1)$.
2. **Tous les éléments inférieurs ou supérieurs à $x$ :** L'assignation `tail.next = null` évite toute boucle circulaire accidentelle.
3. **Valeur $x$ non présente dans la liste :** Fonctionne correctement grâce à l'évaluation binaire stricte `< x`.
