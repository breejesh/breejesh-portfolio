---
title: "Premier Ancêtre Commun: Plus Proche Ancêtre Commun dans un Arbre Binaire (CTCI 4.8)"
description: "Concevez un algorithme pour identifier le premier ancêtre commun (LCA) de deux nœuds dans un arbre binaire en temps O(N) et espace O(H)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un algorithme et écrivez le code permettant de trouver le premier ancêtre commun (LCA) de deux nœuds dans un arbre binaire (qui n'est pas obligatoirement un arbre binaire de recherche), sans stocker de nœuds dans une structure auxiliaire.
> * **La Solution Optimale:** Utilisez une **Récursion Post-Ordre** : Un nœud $r$ est l'ancêtre commun si $p$ se trouve dans un sous-arbre et $q$ dans l'autre, ou si $r$ est l'un des nœuds et que l'autre est son descendant. Si les appels récursifs gauche et droit retournent des nœuds non nuls, le nœud courant est le LCA en temps $O(N)$ et espace $O(H)$.
> * **Réalité en Production:** Propagation d'événements dans le DOM (event bubbling) et calcul d'ancêtres communs dans les taxonomies.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.8), la question posée est :

*"Concevez un algorithme et écrivez le code pour trouver le premier ancêtre commun de deux nœuds dans un arbre binaire. Évitez de stocker des nœuds supplémentaires dans une structure de données."*

## 2. Mécanique Algorithmique (Récursion Post-Ordre)

1. Cas de base : Si `root == null`, retourner `null`.
2. Si `root == p || root == q`, retourner `root`.
3. Explorer récursivement le sous-arbre gauche et le sous-arbre droit.
4. Évaluer les retours :
   * Si les deux côtés retournent un nœud non nul, $p$ et $q$ sont situés dans des sous-arbres différents et `root` est le Plus Proche Ancêtre Commun (LCA).
   * Si un seul côté retourne un nœud, les deux éléments résident dans ce sous-arbre.
   * Si les deux retournent `null`, aucun des nœuds n'est présent.

## Implémentation de Production

```java
public class FirstCommonAncestor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Trouve le plus proche ancetre commun (LCA) des noeuds p et q.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(H) ou H est la hauteur de l'arbre.
     */
    public static TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (!covers(root, p) || !covers(root, q)) {
            return null;
        }
        return ancestorHelper(root, p, q);
    }

    private static TreeNode ancestorHelper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        boolean pIsOnLeft = covers(root.left, p);
        boolean qIsOnLeft = covers(root.left, q);

        if (pIsOnLeft != qIsOnLeft) {
            return root;
        }

        TreeNode childSide = pIsOnLeft ? root.left : root.right;
        return ancestorHelper(childSide, p, q);
    }

    private static boolean covers(TreeNode root, TreeNode p) {
        if (root == null) return false;
        if (root == p) return true;
        return covers(root.left, p) || covers(root.right, p);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Parcourt l'arbre pour localiser les nœuds $p$ et $q$. |
| Espace Auxiliaire | `O(H)` | Profondeur de pile bornée par la hauteur de l'arbre $H$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Résolution de Hiérarchies

1. **Propagation d'Événements dans le DOM :** Les moteurs de rendu identifient l'ancêtre commun le plus proche pour structurer la chaîne de transmission des événements.
2. **Arbres d'Habilitation IAM :** Détermination du groupe hiérarchique parent pour l'application des règles d'accès.

## Cas Limites et Robustesse

1. **Nœuds absents de l'arbre :** Le test préalable `covers` renvoie proprement `null`.
2. **$p$ est l'ancêtre de $q$ :** Renvoie $p$ comme ancêtre.
