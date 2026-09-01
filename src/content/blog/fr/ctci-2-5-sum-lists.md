---
title: "Somme de Listes: Additionner des Nombres Représentés par des Listes Chaînées (CTCI 2.5)"
description: "Additionnez deux nombres stockes dans l'ordre inverse et direct sous forme de listes chainees avec propagation de retenue en temps O(N) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Deux nombres sont représentes par des listes chaînées où chaque nœud contient un seul chiffre stocke dans l'ordre inverse (les unités en tête). Écrivez une fonction qui additionne ces deux nombres. *Question subsidiaire :* Résolvez le problème lorsque les chiffres sont stockés dans l'ordre direct.
> * **La Solution Optimale:** (1) Ordre inverse : Additionneur récursif avec propagation de retenue en temps $O(\max(N, M))$ ; (2) Ordre direct : Remplissage avec des zéros à gauche, descente récursive et propagation ascendante de la retenue.
> * **Réalité en Production:** Arithmétique à précision arbitraire (BigInteger), calcul financier haute fidélité et cryptographie asymétrique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 2.5), l'énoncé est :

*"Vous avez deux nombres représentes par une liste chaînée, où chaque nœud contient un seul chiffre. Les chiffres sont stockés dans l'ordre inverse, de telle sorte que le chiffre des unités est en tête de liste. Écrivez une fonction qui additionne les deux nombres et renvoie la somme sous forme de liste chaînée."*

**Exemple (Ordre Inverse) :**
* Entrée : `(7 -> 1 -> 6)` + `(5 -> 9 -> 2)`. Soit $617 + 295$.
* Sortie : `2 -> 1 -> 9`. Soit $912$.

**Question Subsidiaire (Ordre Direct) :**
* Entrée : `(6 -> 1 -> 7)` + `(2 -> 9 -> 5)`. Soit $617 + 295$.
* Sortie : `9 -> 1 -> 2`. Soit $912$.

## 2. Addition en Ordre Inverse (Additionneur Récursif)

Puisque les unités sont en tête de liste :
1. Additionner les chiffres correspondants plus la retenue : `valeur = (l1.data + l2.data + carry) % 10`.
2. Calculer la nouvelle retenue : `carry = (l1.data + l2.data + carry) / 10`.
3. Appeler récursivement `addLists(l1.next, l2.next, carry)`.
4. Cas de base : Si les deux nœuds sont `null` et que `carry == 0`, terminer l'exécution.

## 3. Ordre Direct (Remplissage et Récursion Post-Ordre)

En ordre direct (chiffre le plus significatif en tête), l'addition directe est impossible si les longueurs diffèrent :
1. Calculer les longueurs des deux listes.
2. Compléter la liste la plus courte avec des zéros à gauche.
3. Descendre récursivement jusqu'à la fin pour additionner d'abord les unités.
4. Au retour de pile, créer le nœud somme et propager la retenue vers le haut avec un objet wrapper `PartialSum`.
5. Si une retenue finale subsiste, insérer un nœud en tête.

## Implémentation de Production

```java
public class SumLists {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    // Partie 1: Ordre Inverse
    public static LinkedListNode addListsReverse(LinkedListNode l1, LinkedListNode l2, int carry) {
        if (l1 == null && l2 == null && carry == 0) {
            return null;
        }

        int value = carry;
        if (l1 != null) value += l1.data;
        if (l2 != null) value += l2.data;

        LinkedListNode result = new LinkedListNode(value % 10);

        if (l1 != null || l2 != null) {
            LinkedListNode more = addListsReverse(
                l1 == null ? null : l1.next,
                l2 == null ? null : l2.next,
                value >= 10 ? 1 : 0
            );
            result.next = more;
        }

        return result;
    }

    // Partie 2: Ordre Direct
    private static class PartialSum {
        public LinkedListNode sum = null;
        public int carry = 0;
    }

    public static LinkedListNode addListsForward(LinkedListNode l1, LinkedListNode l2) {
        int len1 = length(l1);
        int len2 = length(l2);

        if (len1 < len2) l1 = padList(l1, len2 - len1);
        else l2 = padList(l2, len1 - len2);

        PartialSum sum = addListsHelper(l1, l2);

        if (sum.carry == 0) return sum.sum;
        else {
            LinkedListNode result = insertBefore(sum.sum, sum.carry);
            return result;
        }
    }

    private static PartialSum addListsHelper(LinkedListNode l1, LinkedListNode l2) {
        if (l1 == null && l2 == null) return new PartialSum();

        PartialSum sum = addListsHelper(l1.next, l2.next);
        int val = sum.carry + l1.data + l2.data;

        LinkedListNode full_result = insertBefore(sum.sum, val % 10);
        sum.sum = full_result;
        sum.carry = val / 10;
        return sum;
    }

    private static int length(LinkedListNode n) {
        int count = 0;
        while (n != null) { count++; n = n.next; }
        return count;
    }

    private static LinkedListNode padList(LinkedListNode l, int padding) {
        LinkedListNode head = l;
        for (int i = 0; i < padding; i++) head = insertBefore(head, 0);
        return head;
    }

    private static LinkedListNode insertBefore(LinkedListNode list, int data) {
        LinkedListNode node = new LinkedListNode(data);
        if (list != null) node.next = list;
        return node;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(max(N, M))` | Parcours linéaire des listes de longueurs $N$ et $M$. |
| Espace Auxiliaire | `O(max(N, M))` | Allocation des $\max(N, M) + 1$ nœuds de la somme et trames de pile récursive. |

## Ingénierie des Systèmes en Production

### Architecture Système : Bibliothèques BigInteger et Clés RSA

1. **Arithmétique à Précision Arbitraire (GMP, Java BigInteger) :** Les opérations sur les clés RSA de 2048 bits chaînent des blocs de registres avec report de retenue.
2. **Systèmes Comptables Financiers :** Évite les imprécisions d'arrondi des nombres flottants IEEE 754.

## Cas Limites et Robustesse

1. **Listes de longueurs différentes (`9->9` + `1`) :** La retenue propage correctement l'extension de taille (`0->0->1`).
2. **Retenue finale sur le chiffre de tête :** Insère un nouveau nœud en tête.
