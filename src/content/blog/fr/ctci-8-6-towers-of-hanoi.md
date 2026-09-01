---
title: "Tours de Hanoï: Déplacement Récursif de Disques et Modèle de Piles (CTCI 8.6)"
description: "Résolvez le problème des Tours de Hanoï pour N disques sur 3 tiges avec un modèle orienté objet et récurrence diviser pour régner en O(2^N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Dans le problème classique des Tours de Hanoï, vous disposez de 3 tiges et $N$ disques de tailles décroissantes. Vous ne pouvez déplacer qu'un seul disque à la fois et un grand disque ne peut jamais reposer sur un plus petit. Déplacez tous les disques de la première à la dernière tige.
> * **La Solution Optimale:** Décomposition Récursive de Piles : (1) Déplacer $n - 1$ disques de l'`Origine` vers le `Buffer` via la `Destination` ; (2) Déplacer le disque $n$ vers la `Destination` ; (3) Déplacer les $n - 1$ disques du `Buffer` vers la `Destination` via l'`Origine`. L'algorithme réalise exactement $2^N - 1$ déplacements en temps $O(2^N)$ et espace $O(N)$.
> * **Réalité en Production:** Stratégies de rotation de sauvegardes Grand-père-Père-Fils (GFS).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.6), l'énoncé est :

*"Deplacez N disques d'une tige initiale a une tige finale selon les regles de Hanoi a l'aide de piles d'objets."*

## 2. Décomposition Récursive

Pour déplacer $n$ disques de la Tour 1 vers la Tour 3 :
1. Déplacer les $n - 1$ disques du dessus vers la Tour 2.
2. Déplacer le disque $n$ vers la Tour 3.
3. Déplacer les $n - 1$ disques de la Tour 2 vers la Tour 3.

Formule de récurrence : $T(n) = 2T(n - 1) + 1 = 2^n - 1$.

## Implémentation de Production

```java
import java.util.Stack;

public class TowersOfHanoi {
    public static class Tower {
        private final Stack<Integer> disks = new Stack<>();
        private final int index;

        public Tower(int i) { this.index = i; }

        public void add(int d) {
            if (!disks.isEmpty() && disks.peek() <= d) {
                throw new IllegalStateException("Impossible de placer le disque " + d + " sur " + disks.peek());
            }
            disks.push(d);
        }

        public void moveTopTo(Tower t) {
            int top = disks.pop();
            t.add(top);
        }

        public void moveDisks(int quantity, Tower destination, Tower buffer) {
            if (quantity <= 0) return;

            moveDisks(quantity - 1, buffer, destination);
            moveTopTo(destination);
            buffer.moveDisks(quantity - 1, destination, this);
        }

        public Stack<Integer> getDisks() { return disks; }
    }

    public static void solveHanoi(int n) {
        Tower[] towers = new Tower[3];
        for (int i = 0; i < 3; i++) {
            towers[i] = new Tower(i);
        }

        for (int i = n - 1; i >= 0; i--) {
            towers[0].add(i);
        }

        towers[0].moveDisks(n, towers[2], towers[1]);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(2^N)` | Effectue exactement $2^N - 1$ transferts de disques. |
| Espace Auxiliaire | `O(N)` | Profondeur d'appels et hauteur de pile limitées à $N$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Rotation de Sauvegardes

1. **Stratégie GFS (Grand-père-Père-Fils) :** Schéma hiérarchique de rotation de bandes magnétiques calqué sur les cycles de Hanoï pour minimiser l'usure des supports.
2. **Gestion de Registres CPU :** Débordement ordonné de cadres de pile vers la mémoire vive.

## Cas Limites et Robustesse

1. **Contrôle d'Invariant :** `Tower.add()` déclenche une exception si un disque plus grand est empilé sur un plus petit.
