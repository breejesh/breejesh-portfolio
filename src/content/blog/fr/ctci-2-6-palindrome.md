---
title: "Palindrome: Vérifier si une Liste Chaînée est un Palindrome (CTCI 2.6)"
description: "Vérifiez si une liste simplement chaînée est un palindrome en utilisant des pointeurs rapide/lent et une pile en temps O(N) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-6-palindrome.webp
previewImage: /assets/images/ctci-2-6-palindrome.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez une fonction pour vérifier si une liste chaînée est un palindrome.
> * **La Solution Optimale:** Utilisez la technique des pointeurs rapide et lent pour repérer le milieu de la liste tout en empilant les éléments de la première moitié dans une `Stack`. Si la longueur est impaire, ignorez l'élément central, puis comparez la seconde moitié en dépilant les valeurs en temps $O(N)$ et espace $O(N)$.
> * **Réalité en Production:** Validation de flux de données unidirectionnels en streaming et analyse de motifs symétriques en bio-informatique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 2.6), la question posée est :

*"Implémentez une fonction pour vérifier si une liste chaînée est un palindrome."*

**Exemples :**
* `0 -> 1 -> 2 -> 1 -> 0 -> true`
* `0 -> 1 -> 2 -> 2 -> 1 -> 0 -> true`
* `0 -> 1 -> 2 -> 3 -> 0 -> false`

## 2. Approche par Pointeurs Rapide/Lent et Pile

Pour éviter de dupliquer toute la liste, nous ne stockons que sa première moitié :
1. Initialisez un pointeur `slow` (avance d'un nœud) et un pointeur `fast` (avance de deux nœuds).
2. Pendant que `slow` parcourt la première moitié, empilez ses données dans une `Stack<Integer>`.
3. Lorsque `fast` atteint la fin :
   * Si `fast != null` (longueur impaire), avancez `slow` d'un cran pour ignorer l'élément central.
4. Continuez avec `slow` sur la seconde moitié en dépilant les éléments :
   * Si une valeur diffère : retournez `false`.
5. Si la pile est totalement dépilée : retournez `true`.

## Implémentation de Production

```java
import java.util.Stack;

public class PalindromeList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Verifie si une liste est un palindrome via pointeurs rapide/lent et pile.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(N) (stocke N/2 elements)
     */
    public static boolean isPalindrome(LinkedListNode head) {
        LinkedListNode fast = head;
        LinkedListNode slow = head;

        Stack<Integer> stack = new Stack<>();

        // Empiler la premiere moitie
        while (fast != null && fast.next != null) {
            stack.push(slow.data);
            slow = slow.next;
            fast = fast.next.next;
        }

        // Ignorer le centre si la longueur est impaire
        if (fast != null) {
            slow = slow.next;
        }

        // Comparer la seconde moitie avec la pile
        while (slow != null) {
            int top = stack.pop();

            if (top != slow.data) {
                return false;
            }
            slow = slow.next;
        }

        return true;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Le pointeur `fast` avance en $N/2$ étapes ; le balayage de la seconde moitié prend $N/2$ étapes. |
| Espace Auxiliaire | `O(N)` | La pile stocke exactement $\lfloor N/2 \rfloor$ éléments. |

## Ingénierie des Systèmes en Production

### Architecture Système : Validation de Séquences Réseau

1. **Analyse de Paquets Réseau Unidirectionnels :** Contrôle de checksums symétriques à la volée sans mise en mémoire tampon de la totalité de la charge utile.
2. **Génomique :** Identification de séquences palindromiques d'ADN.

## Cas Limites et Robustesse

1. **Liste vide (`null`) :** Retourne `true`.
2. **Nœud unique (`1`) :** `fast.next == null`, pile vide, saute le centre, retourne `true`.
3. **Palindrome de longueur paire (`1 -> 2 -> 2 -> 1`) :** `fast == null` en fin de boucle, compare parfaitement les deux moitiés.
4. **Palindrome de longueur impaire (`1 -> 2 -> 1`) :** `fast != null` active le saut du nœud médian.
