---
title: "Dominos: Preuve de Pavage de l'Échiquier Mutilé avec 31 Dominos (CTCI 6.3)"
description: "Preuve mathématique de l'impossibilité de paver un échiquier 8x8 privé de deux coins opposés avec 31 dominos par invariant de coloration bipartite."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-3-dominos.webp
previewImage: /assets/images/ctci-6-3-dominos.webp
---

> **TL;DR**
> * **Le Problème du Livre:** On dispose d'un échiquier $8 \times 8$ dont deux coins diagonalement opposés ont été retirés. Vous avez 31 dominos, chaque domino couvrant exactement deux cases adjacentes. Pouvez-vous paver entièrement l'échiquier restant avec ces 31 dominos ?
> * **La Solution Optimale:** **Preuve par Invariant Bipartite** : Un échiquier standard compte 32 cases blanches et 32 cases noires. Deux coins opposés ont systématiquement la **même couleur** (par exemple blanches). En les retirant, il reste 30 cases blanches et 32 cases noires (62 cases). Chaque domino couvrant impérativement 1 case blanche et 1 case noire, 31 dominos doivent couvrir 31 cases de chaque couleur. Le pavage est donc mathématiquement **impossible**.
> * **Réalité en Production:** Couplage maximal dans les graphes bipartites (Hopcroft-Karp) et vérification d'invariants système.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.3), la question posée est :

*"Un échiquier 8x8 est amputé de deux coins opposés. Avec 31 dominos de taille 2x1, peut-on recouvrir tout l'échiquier ? Prouvez votre réponse."*

## 2. Preuve par Invariant de Parité

1. **Coloration Bipartite :** L'échiquier alterne cases blanches et noires (32 blanches, 32 noires).
2. **Parité des Coins Opposés :** Le coin supérieur gauche $(0, 0)$ et le coin inférieur droit $(7, 7)$ ont la même parité $(r + c) \pmod 2$. Retirer ces deux coins élimine **deux cases de même couleur**.
3. **Bilan des Cases :** 30 cases d'une couleur et 32 cases de l'autre.
4. **Propriété du Domino :** Tout domino posé horizontalement ou verticalement couvre exactement 1 case blanche et 1 case noire.
5. **Conclusion :** 31 dominos requièrent 31 blanches et 31 noires. Comme $31 \ne 30$, le pavage est impossible.

## Implémentation de Production

```java
public class DominosChessboard {
    /**
     * Verifie si une configuration d'echiquier mutile peut etre pavee.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static boolean canTileMutilatedBoard(int rows, int cols, int removedR1, int removedC1,
                                                int removedR2, int removedC2) {
        int totalSquares = (rows * cols) - 2;
        if (totalSquares % 2 != 0) return false;

        int color1 = (removedR1 + removedC1) % 2;
        int color2 = (removedR2 + removedC2) % 2;

        return color1 != color2; // Possible si 1 blanche et 1 noire retirees (Theoreme de Gomory)
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps d'Évaluation | `O(1)` | Calcul de parité des coordonnées des cases. |
| Espace Auxiliaire | `O(1)` | Zéro allocation mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Invariants et Graphes Bipartites

1. **Ordonnanceur Kubernetes :** Utilise des invariants bipartites pour valider les contraintes de placement de pods sans blocage.
2. **Entrelacement de Bancs DRAM :** Répartition alternée des accès mémoire pairs et impairs pour éliminer les contentions de bus.

## Cas Limites et Robustesse

1. **Retrait d'une case blanche et d'une noire :** Le théorème de Gomory garantit l'existence d'un cycle hamiltonien pavant l'échiquier.
2. **Grille impaire ($7 \times 7$) :** Nombre total de cases impair, pavage impossible.
