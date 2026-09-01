---
title: "Successeur: Trouver le Successeur Infixe dans un BST (CTCI 4.6)"
description: "Écrivez un algorithme pour trouver le successeur infixe (in-order) d'un nœud dans un arbre binaire de recherche avec pointeurs parents en temps O(H) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-6-successor.webp
previewImage: /assets/images/ctci-4-6-successor.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez un algorithme pour trouver le nœud suivant (successeur in-order) d'un nœud donné dans un arbre binaire de recherche. Vous pouvez supposer que chaque nœud dispose d'un lien vers son parent.
> * **La Solution Optimale:** (1) Si le nœud a un sous-arbre droit, le successeur est le **nœud le plus à gauche du sous-arbre droit** ; (2) Sinon, remontez les pointeurs parents jusqu'à trouver un nœud qui est le **fils gauche** de son parent en temps $O(H)$ et espace $O(1)$.
> * **Réalité en Production:** Curseurs de lecture séquentielle dans les moteurs de bases de données (B-Trees) et itérateurs ordonnés.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.6), la question posée est :

*"Écrivez un algorithme pour trouver le nœud suivant (successeur in-order) d'un nœud donné dans un arbre binaire de recherche. Vous pouvez supposer que chaque nœud dispose d'un lien vers son parent."*

## 2. Analyse des Cas et Mécanique Algorithmique

Il existe deux cas distincts :

### Cas 1: Le Nœud Possède un Sous-Arbre Droit
Si `node.right != null`, le successeur est le plus petit élément du sous-arbre droit :
* Aller à droite : `curr = node.right`.
* Descendre à gauche autant que possible : `while (curr.left != null) curr = curr.left;`.

### Cas 2: Le Nœud Ne Possède Pas de Sous-Arbre Droit
Si `node.right == null`, il faut examiner les ancêtres :
* Remonter la chaîne des parents jusqu'à trouver un nœud qui est le **fils gauche** de son parent.
* Si l'on atteint la racine sans trouver de parent valide, le nœud était le maximum de l'arbre et n'a pas de successeur (`null`).

## Implémentation de Production

```java
public class Successor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode parent;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Trouve le successeur in-order d'un noeud dans un BST.
     * Complexite Temporelle: O(H) ou H est la hauteur de l'arbre.
     * Complexite Spatiale: O(1)
     */
    public static TreeNode inorderSucc(TreeNode n) {
        if (n == null) return null;

        // Cas 1: Fils droit present -> plus a gauche du sous-arbre droit
        if (n.right != null) {
            return leftMostChild(n.right);
        } else {
            // Cas 2: Remonter jusqu'a etre a gauche du parent
            TreeNode q = n;
            TreeNode x = q.parent;

            while (x != null && x.left != q) {
                q = x;
                x = x.parent;
            }
            return x;
        }
    }

    private static TreeNode leftMostChild(TreeNode n) {
        if (n == null) return null;
        while (n.left != null) {
            n = n.left;
        }
        return n;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(H)` | Descente vers la feuille la plus à gauche ou remontée de la chaîne d'ancêtres bornée par la hauteur $H$. |
| Espace Auxiliaire | `O(1)` | Parcours itératif sans récursion ni allocation sur le tas. |

## Ingénierie des Systèmes en Production

### Architecture Système : Curseurs de Données et Itérateurs

1. **Balayage d'Intervalles B-Tree :** Les moteurs SQL exécutent des requêtes de plage (`BETWEEN`) en avançant séquentiellement de nœud en successeur.
2. **Itérateurs `std::map` en C++ :** Parcours en temps amorti $O(1)$ par incrément grâce aux liens parents des arbres Rouge-Noir.

## Cas Limites et Robustesse

1. **Élément maximal de l'arbre :** La boucle de remontée atteint `x == null` et renvoie `null`.
2. **Nœud racine :** S'il a un fils droit, renvoie le minimum du sous-arbre droit ; sinon renvoie `null`.
