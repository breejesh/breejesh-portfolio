---
title: "Triple Pas: Dénombrement de Chemins d'Escalier en Programmation Dynamique (CTCI 8.1)"
description: "Calculez le nombre de façons pour un enfant de gravir un escalier de n marches en effectuant des sauts de 1, 2 ou 3 marches en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-1-triple-step.webp
previewImage: /assets/images/ctci-8-1-triple-step.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un enfant gravit un escalier de $n$ marches et peut sauter 1, 2 ou 3 marches à la fois. Implémentez une méthode pour compter le nombre total de façons possibles d'atteindre le sommet.
> * **La Solution Optimale:** Récurrence de Tribonacci : Le nombre de façons d'atteindre la marche $n$ vaut $W(n) = W(n - 1) + W(n - 2) + W(n - 3)$ avec cas de base $W(0) = 1, W(1) = 1, W(2) = 2$. L'utilisation de 3 variables glissantes élimine toute allocation de tableau, atteignant un temps $O(N)$ et un espace $O(1)$.
> * **Réalité en Production:** Modélisation combinatoire de processus de Markov et gestion des dépassements de capacité d'entiers (overflow).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.1), l'énoncé est :

*"Un enfant monte un escalier de n marches en sautant 1, 2 ou 3 marches a chaque pas. Combien de combinaisons permettent d'atteindre le sommet ?"*

## 2. Relation de Récurrence et Fenêtre Glissante

Pour atteindre la marche $n$, le dernier saut provient obligatoirement de :
* La marche $n - 1$ (saut de 1)
* La marche $n - 2$ (saut de 2)
* La marche $n - 3$ (saut de 3)

$$W(n) = W(n - 1) + W(n - 2) + W(n - 3)$$

**Cas de Base :**
* $W(0) = 1$
* $W(1) = 1$
* $W(2) = 2$
* $W(3) = 4$

## Implémentation de Production

```java
public class TripleStep {
    /**
     * Calcule le nombre de facons de gravir n marches avec sauts de 1, 2 ou 3 en memoire O(1).
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(1)
     */
    public static int countWays(int n) {
        if (n < 0) return 0;
        if (n == 0 || n == 1) return 1;
        if (n == 2) return 2;

        int a = 1; // W(0)
        int b = 1; // W(1)
        int c = 2; // W(2)

        for (int i = 3; i <= n; i++) {
            int d = a + b + c;
            a = b;
            b = c;
            c = d;
        }

        return c;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | $N - 2$ additions scalaires en temps constant. |
| Espace Auxiliaire | `O(1)` | Trois variables registres. |

## Ingénierie des Systèmes en Production

### Architecture Système : Débordement Arithmétique

1. **Dépassement de Capacité :** La suite croissant comme $O(1.839^n)$, un entier 32 bits déborde dès $n = 37$. On utilise en pratique des entiers 64 bits (`long`) ou de l'arithmétique modulaire.
2. **Exponentiation Matricielle :** Permet une évaluation en $O(\log N)$ sur de très grandes valeurs de $N$.

## Cas Limites et Robustesse

1. **$n = 0$ :** Renvoie 1.
2. **$n < 0$ :** Renvoie 0.
