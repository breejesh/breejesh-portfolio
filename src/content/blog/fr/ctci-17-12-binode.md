---
title: "BiNode: Conversion Sur Place d'un ABR en Liste Doublement Chaînée (CTCI 17.12)"
description: "Transformez un arbre binaire de recherche (ABR) en liste doublement chaînée triée sur place par réassignation de pointeurs infixes en temps O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-12-binode.webp
previewImage: /assets/images/ctci-17-12-binode.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Une structure `BiNode` comporte `node1`, `node2` et `data` (fils gauche/droit dans un ABR, ou prev/next dans une Liste Doublement Chaînée). Convertissez un ABR en liste doublement chaînée ordonnée *sur place*.
> * **La Solution Optimale:** **Réassignation de Pointeurs lors d'un Parcours Infixe** :
>   1. Effectuer un parcours infixe (`Gauche -> Racine -> Droite`).
>   2. Mémoriser un pointeur `prev` pointant vers le dernier nœud traité.
>   3. Pour chaque nœud visité :
>      * Si `prev == null`, fixer `head = curr` (le plus petit élément).
>      * Sinon, relier `prev.node2 = curr` et `curr.node1 = prev`.
>      * Mettre à jour `prev = curr`.
>   4. S'exécute en **temps $O(N)$** et **espace de pile $O(H)$** avec strictement **zéro nouvelle allocation mémoire sur le tas**.
> * **Réalité en Production:** Chaînage séquentiel des feuilles dans les arbres B+ des moteurs de bases de données (MySQL InnoDB) et gestionnaires de mémoire.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.12), l'énoncé est :

*"Convertissez un arbre binaire de recherche en liste doublement chainee triee sur place en reconfigurant les pointeurs de nœuds existants."*

## 2. Réassignation Infixe de Pointeurs

Le parcours infixe garantit un ordre croissant strict, permettant de connecter immédiatement les pointeurs précédents et suivants sans copie.

## Implémentation de Production

```java
public class BiNodeConverter {

    public static class BiNode {
        public int data;
        public BiNode node1; // Gauche dans l'ABR / Précédent dans la liste
        public BiNode node2; // Droit dans l'ABR / Suivant dans la liste

        public BiNode(int data) {
            this.data = data;
        }
    }

    private static BiNode head = null;
    private static BiNode prev = null;

    public static BiNode convert(BiNode root) {
        head = null;
        prev = null;
        inOrderFlatten(root);
        return head;
    }

    private static void inOrderFlatten(BiNode current) {
        if (current == null) return;

        inOrderFlatten(current.node1);

        if (prev == null) {
            head = current;
        } else {
            prev.node2 = current;
            current.node1 = prev;
        }
        prev = current;

        inOrderFlatten(current.node2);
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Un seul parcours infixe visitant les N nœuds. |
| Espace Mémoire | `O(H)` | Pile d'appels récursive proportionnelle à la hauteur de l'arbre ($O(\log N)$ moyen). |
| Allocation de Nœuds | `0 octet` | Modification directe sur place. |

## Ingénierie des Systèmes en Production

### Architecture Système : Arbres B+ dans les Moteurs SQL

1. **Parcours par Plage (Range Scans) dans InnoDB :** Les moteurs de stockage chaînent les feuilles d'arbres B+ sous forme de listes doublement chaînées pour exécuter les requêtes `BETWEEN` séquentiellement.
2. **Gestionnaires de Blocs Mémoire :** Recyclage direct des nœuds libres.

## Cas Limites et Robustesse

1. **Arbre Vide :** Renvoie `null` immédiatement.
2. **Nœud Unique :** Affecte `head = root` avec des pointeurs nuls.
