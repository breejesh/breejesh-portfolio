---
title: "Supprimer un Nœud Intermédiaire: Suppression dans une Liste Chaînée avec Accès Direct Unique (CTCI 2.3)"
description: "Implémentez un algorithme pour supprimer un nœud intermédiaire d'une liste simplement chaînée avec un accès direct au nœud en temps O(1) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-3-delete-middle-node.webp
previewImage: /assets/images/ctci-2-3-delete-middle-node.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez un algorithme pour supprimer un nœud situé au milieu d'une liste simplement chaînée (c'est-à-dire n'importe quel nœud sauf le premier et le dernier), en ayant uniquement accès à ce nœud.
> * **La Solution Optimale:** Copiez la valeur et le pointeur du nœud suivant dans le nœud courant (`n.data = n.next.data; n.next = n.next.next;`), ce qui permet d'écraser et de supprimer efficacement le successeur en temps $O(1)$ et espace $O(1)$.
> * **Réalité en Production:** Files d'attente simplement chaînées sans verrou (lock-free), annulation de temporisateurs dans les boucles d'événements et recyclage de structures intrusives.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 2.3), la question posée est :

*"Implémentez un algorithme pour supprimer un nœud situé au milieu (tout nœud sauf le premier et le dernier, pas nécessairement le centre exact) d'une liste simplement chaînée, en ayant uniquement accès à ce nœud."*

**Exemple :**
* Entrée : le nœud `c` de la liste `a -> b -> c -> d -> e -> f`
* Résultat : aucune valeur retournée, mais la liste devient `a -> b -> d -> e -> f`

## 2. Le Défi Central et Inefficacités

Dans une suppression standard sur liste simplement chaînée, il est nécessaire de parcourir la liste depuis la tête (`head`) pour retrouver le nœud précédent `prev` et appliquer `prev.next = current.next` en temps $O(N)$.

Cependant, lorsque nous ne disposons **que de la référence vers le nœud cible `n`**, nous n'avons aucun moyen de remonter vers le prédécesseur puisque les liens sont unidirectionnels.

## 3. Mécanique Optimale par Copie de Valeur

Au lieu de détacher physiquement le nœud cible `n` de son prédécesseur, nous copions l'état de son successeur immédiat dans `n` :
1. Copier la donnée : `n.data = n.next.data`.
2. Court-circuiter le successeur : `n.next = n.next.next`.

Cette opération remplace l'identité du nœud cible par celle de son voisin et détache ce dernier en temps $O(1)$.

## Implémentation de Production

```java
public class DeleteMiddleNode {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Supprime un noeud intermediaire en ayant uniquement acces a celui-ci.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static boolean deleteNode(LinkedListNode n) {
        if (n == null || n.next == null) {
            return false; // Impossible de supprimer un noeud null ou le dernier noeud
        }

        LinkedListNode next = n.next;
        n.data = next.data;
        n.next = next.next;
        return true;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Assignations directes de variables sans parcours. |
| Espace Auxiliaire | `O(1)` | Modifie les pointeurs en place. |

## Ingénierie des Systèmes en Production

### Architecture Système : Listes Intrusives et Gestionnaires d'Événements

1. **Listes Intrusives du Noyau Linux (`struct list_head`) :** Permettent des suppressions $O(1)$. Pour les listes simplement chaînées à faible empreinte mémoire, la copie de données permet une suppression immédiate.
2. **Gestionnaires de Temporisateurs (Timer Wheels) :** Annulation rapide des rappels d'événements sans balayage complet de la file d'attente.

## Cas Limites et Robustesse

1. **Nœud cible null :** Vérifié par `if (n == null) return false;`.
2. **Nœud cible situé en fin de liste (`n.next == null`) :** Ce problème **ne peut pas** être résolu si le nœud cible est le dernier élément de la liste, car nous ne pouvons pas forcer le pointeur du prédécesseur à null. Cette contrainte doit être explicitée à l'examinateur.
