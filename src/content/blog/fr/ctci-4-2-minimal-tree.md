---
title: "Arbre Minimal: Construire un Arbre Binaire de Recherche de Hauteur Minimale (CTCI 4.2)"
description: "Construisez un arbre binaire de recherche de hauteur minimale à partir d'un tableau trié grâce à la méthode diviser pour régner en temps O(N) et espace O(log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-2-minimal-tree.webp
previewImage: /assets/images/ctci-4-2-minimal-tree.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un tableau trié (dans l'ordre croissant) contenant des entiers uniques, écrivez un algorithme pour créer un arbre binaire de recherche de hauteur minimale.
> * **La Solution Optimale:** Utilisez **Diviser pour Régner** : L'élément médian du tableau devient la racine. Construisez récursivement le sous-arbre gauche à partir de la moitié gauche et le sous-arbre droit à partir de la moitié droite en temps $O(N)$ et espace de pile $O(\log N)$.
> * **Réalité en Production:** Chargement en masse d'index B-Tree dans les bases de données relationnelles et arbres KD pour le ray-tracing.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.2), la question posée est :

*"Étant donné un tableau trié (ordre croissant) avec des éléments entiers uniques, écrivez un algorithme pour créer un arbre binaire de recherche de hauteur minimale."*

**Fondement Mathématique :**
Pour minimiser la hauteur de l'arbre, le nombre de nœuds dans le sous-arbre gauche doit être aussi proche que possible de celui du sous-arbre droit. Par conséquent, la racine de chaque sous-arbre doit toujours être l'**élément médian** du segment de tableau correspondant.

## 2. Mécanique Récursive Diviser pour Régner

Pour un sous-tableau `arr[start ... end]` :
1. Cas de base : Si `end < start`, retourner `null`.
2. Calcul du point milieu : `mid = (start + end) / 2`.
3. Créer le nœud racine : `TreeNode n = new TreeNode(arr[mid])`.
4. Construire récursivement le fils gauche : `n.left = createMinimalBST(arr, start, mid - 1)`.
5. Construire récursivement le fils droit : `n.right = createMinimalBST(arr, mid + 1, end)`.
6. Retourner `n`.

## Implémentation de Production

```java
public class MinimalTree {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Construit un BST de hauteur minimale a partir d'un tableau trie.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(log N) dans la pile d'appels
     */
    public static TreeNode createMinimalBST(int[] array) {
        if (array == null || array.length == 0) return null;
        return createMinimalBST(array, 0, array.length - 1);
    }

    private static TreeNode createMinimalBST(int[] arr, int start, int end) {
        if (end < start) {
            return null;
        }

        int mid = (start + end) / 2;
        TreeNode n = new TreeNode(arr[mid]);
        n.left = createMinimalBST(arr, start, mid - 1);
        n.right = createMinimalBST(arr, mid + 1, end);
        return n;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Chaque élément du tableau est converti en nœud exactement une fois. |
| Espace Auxiliaire | `O(log N)` | Profondeur de pile égale à la hauteur de l'arbre équilibré ($\lceil \log_2 N \rceil$). |

## Ingénierie des Systèmes en Production

### Architecture Système : Chargement en Masse d'Index

1. **Génération d'Index B-Tree (PostgreSQL) :** La division par médiane construit directement des pages équilibrées sans rotations dynamiques coûteuses.
2. **Arbres KD en Rendu 3D :** Partitionnement spatial géométrique pour des requêtes d'intersection en $O(\log N)$.

## Cas Limites et Robustesse

1. **Tableau vide ou null :** Retourne `null` en $O(1)$.
2. **Tableau à un seul élément :** Retourne un nœud feuille.
3. **Nombre pair d'éléments :** La division entière sélectionne la médiane inférieure, conservant un équilibre strict.
