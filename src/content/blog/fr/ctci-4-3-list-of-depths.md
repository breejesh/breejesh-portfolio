---
title: "Liste des Profondeurs: Créer des Listes Chaînées de Nœuds par Niveau (CTCI 4.3)"
description: "Concevez un algorithme pour générer une liste chaînée de tous les nœuds à chaque profondeur d'un arbre binaire en temps O(N) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-3-list-of-depths.webp
previewImage: /assets/images/ctci-4-3-list-of-depths.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un arbre binaire, concevez un algorithme qui crée une liste chaînée de tous les nœuds à chaque niveau de profondeur (par exemple, si l'arbre a une profondeur $D$, vous obtiendrez $D$ listes chaînées).
> * **La Solution Optimale:** Utilisez un **BFS Itératif par Niveaux** : Maintenez `ArrayList<LinkedList<TreeNode>>`. Pour le niveau $i+1$, parcourez les nœuds de la liste du niveau $i$ et ajoutez leurs enfants non nuls dans une nouvelle liste en temps $O(N)$ et espace $O(N)$ sans structure de file d'attente externe.
> * **Réalité en Production:** Composition des couches du DOM dans les moteurs de rendu et arbres de syntaxe abstraite (AST).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.3), l'énoncé est :

*"Étant donné un arbre binaire, concevez un algorithme qui crée une liste chaînée de tous les nœuds à chaque profondeur (par exemple, pour un arbre de profondeur D, vous aurez D listes chaînées)."*

## 2. Parcours par Niveaux (BFS sans File Externe)

Puisque la liste du niveau $i$ contient l'ensemble des parents du niveau $i+1$ :
1. Initialiser `current = new LinkedList<TreeNode>()` contenant la racine.
2. Tant que `current` n'est pas vide :
   * Ajouter `current` à la liste des résultats.
   * Créer une nouvelle liste vide pour les enfants.
   * Pour chaque nœud `parent` de `current` :
     * Si `parent.left != null`, l'ajouter à la nouvelle liste.
     * Si `parent.right != null`, l'ajouter à la nouvelle liste.
   * Remplacer `current` par la nouvelle liste.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ListOfDepths {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Cree des listes chainees de noeuds a chaque niveau de profondeur.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(N)
     */
    public static List<LinkedList<TreeNode>> createLevelLinkedList(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        if (root == null) return result;

        LinkedList<TreeNode> current = new LinkedList<>();
        current.add(root);

        while (!current.isEmpty()) {
            result.add(current); // Ajouter le niveau precedent
            LinkedList<TreeNode> parents = current;
            current = new LinkedList<>();

            for (TreeNode parent : parents) {
                if (parent.left != null) {
                    current.add(parent.left);
                }
                if (parent.right != null) {
                    current.add(parent.right);
                }
            }
        }

        return result;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Chaque nœud de l'arbre est visité et inséré exactement une fois. |
| Espace Auxiliaire | `O(N)` | La structure de liste résultante stocke l'ensemble des $N$ nœuds. |

## Ingénierie des Systèmes en Production

### Architecture Système : Composition et Découpage par Niveaux

1. **Rendu Web et Composition de Couches (Chromium) :** Regroupement des éléments du DOM par profondeur d'empilement pour rasterisation matérielle.
2. **Arbres Syntaxiques (AST) :** Détermination de la portée lexicale par niveau d'imbrication des blocs.

## Cas Limites et Robustesse

1. **Arbre vide :** Renvoie une liste vide.
2. **Arbre dégénéré (linéaire) :** Produit $N$ listes de 1 nœud en $O(N)$.
