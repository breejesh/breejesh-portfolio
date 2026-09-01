---
title: "Évaluation Booléenne: Parenthésage par Programmation Dynamique d'Intervalles (CTCI 8.14)"
description: "Comptez le nombre de parenthésages d'une expression booléenne de 0, 1, &, |, ^ pour obtenir le résultat voulu via programmation dynamique en temps O(N^3)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une expression booléenne composée des symboles `0` (faux), `1` (vrai), `&` (ET), `|` (OU) et `^` (XOR), et un résultat booléen cible `result`. Comptez le nombre de parenthésages valides permettant d'évaluer l'expression à `result`.
> * **La Solution Optimale:** Programmation Dynamique par Intervalles : (1) Scinder l'expression sur chaque opérateur aux indices impairs $i = 1, 3, 5 \dots$ ; (2) Évaluer récursivement et mémoïser le nombre de combinaisons menant à `true` et `false` pour les sous-chaînes gauche et droite ; (3) Appliquer les tables de vérité booléennes pour `&`, `|` et `^` ; (4) Mémoïsation avec `HashMap<String, Integer>` en **temps $O(N^3)$** et **espace $O(N^2)$**.
> * **Réalité en Production:** Optimisation de requêtes SQL (filtres WHERE) et synthèse logique pour FPGA/ASIC.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.14), l'énoncé est :

*"Comptez le nombre de facons de parentheser une expression logique pour qu'elle s'evalue a la valeur booleenne attendue."*

## 2. Découpage par Intervalles et Tables de Vérité

Pour chaque opérateur :
* Total des arrangements : $\text{total} = (l_t + l_f) \times (r_t + r_f)$.
* `^` (XOR) : $\text{totalTrue} = l_t \times r_f + l_f \times r_t$.
* `&` (ET) : $\text{totalTrue} = l_t \times r_t$.
* `|` (OU) : $\text{totalTrue} = l_t \times r_t + l_f \times r_t + l_t \times r_f$.

## Implémentation de Production

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {
    /**
     * Calcule le nombre de parenthesages produisant la valeur souhaitee.
     * Complexite Temporelle: O(N^3)
     * Complexite Spatiale: O(N^2)
     */
    public static int countEval(String s, boolean result) {
        return countEvalHelper(s, result, new HashMap<>());
    }

    private static int countEvalHelper(String s, boolean result, Map<String, Integer> memo) {
        if (s.length() == 0) return 0;
        if (s.length() == 1) {
            return stringToBool(s) == result ? 1 : 0;
        }

        String key = result + s;
        if (memo.containsKey(key)) return memo.get(key);

        int ways = 0;

        for (int i = 1; i < s.length(); i += 2) {
            char op = s.charAt(i);
            String left = s.substring(0, i);
            String right = s.substring(i + 1);

            int leftTrue = countEvalHelper(left, true, memo);
            int leftFalse = countEvalHelper(left, false, memo);
            int rightTrue = countEvalHelper(right, true, memo);
            int rightFalse = countEvalHelper(right, false, memo);

            int total = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int totalTrue = 0;

            if (op == '^') {
                totalTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            } else if (op == '&') {
                totalTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                totalTrue = leftTrue * rightTrue + leftFalse * rightTrue + leftTrue * rightFalse;
            }

            int subWays = result ? totalTrue : (total - totalTrue);
            ways += subWays;
        }

        memo.put(key, ways);
        return ways;
    }

    private static boolean stringToBool(String c) {
        return c.equals("1");
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N^3)` | $O(N^2)$ sous-problèmes d'intervalles avec $O(N)$ points de découpage. |
| Espace Auxiliaire | `O(N^2)` | Table de mémoïsation stockant les clés de sous-chaînes. |

## Ingénierie des Systèmes en Production

### Architecture Système : Optimiseurs de Prédicats

1. **Optimisation de Prédicats SQL :** Restructuration des clauses logiques complexes pour favoriser l'élagage d'index.
2. **Synthèse Logique Silicium :** Réduction des temps de propagation sur circuits intégrés.

## Cas Limites et Robustesse

1. **Symbole Unique (`"1"`, true) :** Renvoie 1.
2. **Chaîne Vide :** Renvoie 0.
