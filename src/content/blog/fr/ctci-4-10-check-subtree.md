---
title: "Vérifier le Sous-Arbre: Déterminer si un Arbre Binaire est un Sous-Arbre d'un Autre (CTCI 4.10)"
description: "Concevez un algorithme pour vérifier si un grand arbre binaire T2 est un sous-arbre de T1 via recherche et correspondance récursive en O(N + kM) temps."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-10-check-subtree.webp
previewImage: /assets/images/ctci-4-10-check-subtree.webp
---

> **TL;DR**
> * **Le Problème du Livre:** $T_1$ et $T_2$ sont deux très grands arbres binaires, $T_1$ étant beaucoup plus grand que $T_2$. Créez un algorithme pour déterminer si $T_2$ est un sous-arbre de $T_1$.
> * **La Solution Optimale:** Utilisez la **Correspondance Récursive d'Arbres** : Parcourez $T_1$ pour localiser les nœuds ayant la même valeur que la racine de $T_2$. Pour chaque candidat, appelez `matchTree(r1, r2)` qui compare la structure et les valeurs sans nécessiter de sérialisation géante en mémoire, s'exécutant en temps $O(N + kM)$ et espace $O(\log N + \log M)$.
> * **Réalité en Production:** Analyseurs de code statiques (AST Semgrep / ESLint) et factorisation de sous-expressions dans les compilateurs (LLVM).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.10), l'énoncé est :

*"T1 et T2 sont deux très grands arbres binaires, avec T1 beaucoup plus volumineux que T2. Créez un algorithme pour déterminer si T2 est un sous-arbre de T1."*

## 2. Comparaison des Approches

1. **Sérialisation Pré-Ordre en Chaîne de Caractères :** Encoder les nœuds avec sentinelles `X` pour les nœuds `null`. Bien que le temps soit $O(N + M)$, cela requiert $O(N + M)$ allocations mémoire, risquant l'épuisement mémoire sur des arbres géants.
2. **Correspondance d'Arbres Récursive :** Recherche ciblée sur les nœuds candidats, limitant l'espace mémoire à $O(\log N + \log M)$.

## Implémentation de Production

```java
public class CheckSubtree {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Verifie si t2 est un sous-arbre de t1.
     * Complexite Temporelle: O(N + kM)
     * Complexite Spatiale: O(log N + log M)
     */
    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) return true; // Un arbre vide est toujours un sous-arbre
        return subTree(t1, t2);
    }

    private static boolean subTree(TreeNode r1, TreeNode r2) {
        if (r1 == null) {
            return false;
        } else if (r1.val == r2.val && matchTree(r1, r2)) {
            return true;
        }
        return subTree(r1.left, r2) || subTree(r1.right, r2);
    }

    private static boolean matchTree(TreeNode r1, TreeNode r2) {
        if (r1 == null && r2 == null) {
            return true;
        } else if (r1 == null || r2 == null) {
            return false;
        } else if (r1.val != r2.val) {
            return false;
        } else {
            return matchTree(r1.left, r2.left) && matchTree(r1.right, r2.right);
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N + kM)` | $N$ nœuds dans $T_1$, $M$ nœuds dans $T_2$ et $k$ racines candidates. |
| Espace Auxiliaire | `O(log N + log M)` | Profondeur de la pile d'appels sur des arbres équilibrés. |

## Ingénierie des Systèmes en Production

### Architecture Système : Reconnaissance de Motifs dans les AST

1. **Linter et Détection de Failles (Semgrep / CodeQL) :** Correspondance de sous-arbres syntaxiques contre des motifs de vulnérabilité.
2. **Factorisation de Sous-Expressions (LLVM) :** Élimination des calculs redondants dans les graphes d'instructions.

## Cas Limites et Robustesse

1. **$T_2$ est null :** Renvoie `true` immédiatement.
2. **$T_1$ est null et $T_2$ non null :** Renvoie `false`.
