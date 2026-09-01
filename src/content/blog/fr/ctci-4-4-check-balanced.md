---
title: "Vérifier l'Équilibre: Déterminer si un Arbre Binaire est Équilibré en Hauteur (CTCI 4.4)"
description: "Implémentez un algorithme pour vérifier si un arbre binaire est équilibré en temps O(N) et espace O(H) via un parcours post-ordre avec court-circuit."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-4-check-balanced.webp
previewImage: /assets/images/ctci-4-4-check-balanced.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez une fonction pour vérifier si un arbre binaire est équilibré (les hauteurs des deux sous-arbres de tout nœud ne diffèrent jamais de plus de un).
> * **La Solution Optimale:** Utilisez un **Parcours Post-Ordre Ascendant** : Calculez les hauteurs depuis les feuilles. Si un sous-arbre est déséquilibré ($|h_{gauche} - h_{droit}| > 1$), retournez immédiatement un code d'erreur (`Integer.MIN_VALUE`) pour interrompre le calcul, s'exécutant en temps $O(N)$ et espace de pile $O(H)$.
> * **Réalité en Production:** Validation des invariants d'arbres AVL et arbres Rouge-Noir dans les bases de données.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.4), l'énoncé est :

*"Implémentez une fonction pour vérifier si un arbre binaire est équilibré. Pour cette question, un arbre équilibré est défini comme un arbre dont les hauteurs des deux sous-arbres de chaque nœud ne diffèrent jamais de plus de un."*

## 2. Inefficacité du Parcours Descendant Naïf

Calculer `getHeight` à chaque niveau depuis la racine répète l'exploration des mêmes sous-arbres :
* Pour un arbre équilibré, la complexité est de $O(N \log N)$, et elle dégénère en $O(N^2)$ pour un arbre linéaire.

## 3. Approche Ascendante avec Court-Circuit

Nous calculons la hauteur et l'équilibre en une seule passe :
1. `checkHeight(node)` renvoie la hauteur réelle si le sous-arbre est équilibré.
2. Si $|h_{gauche} - h_{droit}| > 1$, ou si un fils a déjà retourné une erreur, propager `Integer.MIN_VALUE`.
3. Si équilibré, renvoyer $\max(h_{gauche}, h_{droit}) + 1$.

## Implémentation de Production

```java
public class CheckBalanced {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Verifie si un arbre binaire est equilibre en hauteur.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(H) ou H est la hauteur de l'arbre.
     */
    public static boolean isBalanced(TreeNode root) {
        return checkHeight(root) != Integer.MIN_VALUE;
    }

    private static int checkHeight(TreeNode root) {
        if (root == null) return -1;

        int leftHeight = checkHeight(root.left);
        if (leftHeight == Integer.MIN_VALUE) return Integer.MIN_VALUE;

        int rightHeight = checkHeight(root.right);
        if (rightHeight == Integer.MIN_VALUE) return Integer.MIN_VALUE;

        int heightDiff = Math.abs(leftHeight - rightHeight);
        if (heightDiff > 1) {
            return Integer.MIN_VALUE;
        } else {
            return Math.max(leftHeight, rightHeight) + 1;
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Chaque nœud est visité au plus une fois ; arrêt immédiat au premier déséquilibre. |
| Espace Auxiliaire | `O(H)` | Espace de pile proportionnel à la hauteur $H$ ($O(\log N)$ en moyenne). |

## Ingénierie des Systèmes en Production

### Architecture Système : Contrôle d'Invariants d'Arbres Équilibrés

1. **Moteurs de Stockage Clé-Valeur (RocksDB) :** Surveillance de la structure des arbres en mémoire (memtables) pour prévenir les goulets d'étranglement de lecture.
2. **Hiérarchies de Volumes Englobants (BVH) en Moteurs de Jeux :** Maintien d'un partitionnement spatial équilibré pour les calculs de collision.

## Cas Limites et Robustesse

1. **Arbre vide :** Retourne `true` (hauteur $-1$).
2. **Déséquilibre en profondeur :** Le code d'erreur stoppe immédiatement la récursion sur les autres branches.
