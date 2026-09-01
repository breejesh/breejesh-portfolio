---
title: "Calculatrice: Évaluation d'Expressions avec Priorité des Opérateurs (CTCI 16.26)"
description: "Comment évaluer des expressions arithmétiques comportant +, -, *, / en temps linéaire O(N) à l'aide d'une pile et de la priorité des opérateurs."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-26-calculator.webp
previewImage: /assets/images/ctci-16-26-calculator.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Évaluer une expression arithmétique composée d'entiers positifs et des opérateurs `+`, `-`, `*`, `/` (sans parenthèses) en respectant la priorité des opérations.
> * **La Solution Optimale:** **Priorité des Opérateurs via Pile (Stack)** :
>   1. À la rencontre de `*` ou `/`, dépiler le dernier nombre, calculer immédiatement le produit ou quotient et empiler le résultat.
>   2. À la rencontre de `+` ou `-`, empiler `+valeur` ou `-valeur`.
>   3. À la fin du parcours, sommer l'ensemble des éléments de la pile.
>   4. S'exécute en **temps $O(N)$** et **espace $O(N)$**.
> * **Réalité en Production:** Évaluateurs d'expressions dans les moteurs SQL (DuckDB, ClickHouse) et tableurs (Excel, Google Sheets).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.26), l'énoncé est :

*"Evaluez une expression arithmetique textuelle sans parentheses en respectant la priorite des operateurs en temps O(N)."*

## 2. Algorithme d'Évaluation par Pile

Le traitement immédiat des multiplications et divisions aplatit l'expression en une simple série d'additions sommées en fin de parcours.

## Implémentation de Production

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class BasicCalculator {

    public static double compute(String expression) {
        if (expression == null || expression.isEmpty()) return 0.0;

        Deque<Double> stack = new ArrayDeque<>();
        double currentNum = 0.0;
        char lastOp = '+';

        for (int i = 0; i < expression.length(); i++) {
            char c = expression.charAt(i);

            if (Character.isDigit(c)) {
                currentNum = currentNum * 10 + (c - '0');
            }

            if ((!Character.isDigit(c) && c != ' ') || i == expression.length() - 1) {
                switch (lastOp) {
                    case '+': stack.push(currentNum); break;
                    case '-': stack.push(-currentNum); break;
                    case '*': stack.push(stack.pop() * currentNum); break;
                    case '/': 
                        if (currentNum == 0.0) throw new ArithmeticException("Division par zéro");
                        stack.push(stack.pop() / currentNum); 
                        break;
                }
                lastOp = c;
                currentNum = 0.0;
            }
        }

        double total = 0.0;
        while (!stack.isEmpty()) {
            total += stack.pop();
        }
        return total;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Une seule passe séquentielle sur la chaîne. |
| Espace Mémoire | `O(N)` | Pile contenant au plus N nombres. |
| Structure | `O(1)` | Aucun arbre syntaxique AST lourd alloué. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs SQL et Tableurs

1. **Moteurs SQL :** Compilation des formules arithmétiques en notation polonaise inverse (NPI / RPN) exécutée sur bytecode JIT.
2. **Algorithme Shunting-Yard de Dijkstra :** Utilisé dans les moteurs de tableurs pour évaluer les dépendances de formules de cellules.

## Cas Limites et Robustesse

1. **Division par Zéro :** Levée d'exception explicite `ArithmeticException`.
2. **Espaces Mixtes :** Ignorés naturellement lors du balayage de la chaîne.
