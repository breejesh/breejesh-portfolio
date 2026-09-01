---
title: "Parenthèses: Génération de Combinaisons Valides de Parenthèses (CTCI 8.9)"
description: "Générez toutes les combinaisons valides de n paires de parenthèses (Nombres de Catalan) par retour sur trace borné en temps O(4^N / sqrt(N))."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-9-parens.webp
previewImage: /assets/images/ctci-8-9-parens.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez un algorithme pour afficher toutes les combinaisons valides (correctement ouvertes et fermées) de $n$ paires de parenthèses.
> * **La Solution Optimale:** Retour sur Trace à Préfixe Borné : (1) Suivre les parenthèses restantes à ouvrir (`leftRem`) et à fermer (`rightRem`) ; (2) Placer `'('` si `leftRem > 0` ; (3) Placer `')'` si et seulement si `rightRem > leftRem` ; (4) Génère exactement le $n$-ième **Nombre de Catalan** $C_n = \frac{1}{n+1}\binom{2n}{n}$ combinaisons en temps $O(C_n \cdot N)$ et espace $O(N)$.
> * **Réalité en Production:** Analyseurs syntaxiques AST de compilateurs (Clang) et vérificateurs de flux JSON / XML.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.9), l'énoncé est :

*"Generez toutes les combinaisons bien parenthesees de n paires de parentheses."*

**Exemple ($n = 3$) :**
`["((()))", "(()())", "(())()", "()(())", "()()()"]`

## 2. Règle de Retour sur Trace Borné

Un préfixe est valide si :
1. Il reste des parenthèses ouvrantes (`leftRem > 0`) pour insérer `'('`.
2. Il reste plus de parenthèses fermantes qu'ouvrantes (`rightRem > leftRem`) pour insérer `')'`.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class ValidParens {
    /**
     * Genere les combinaisons valides de n paires de parentheses.
     * Complexite Temporelle: O(4^N / sqrt(N))
     * Complexite Spatiale: O(N)
     */
    public static List<String> generateParens(int count) {
        char[] str = new char[count * 2];
        List<String> list = new ArrayList<>();
        addParen(list, count, count, str, 0);
        return list;
    }

    private static void addParen(List<String> list, int leftRem, int rightRem,
                                 char[] str, int index) {
        if (leftRem < 0 || rightRem < leftRem) return;

        if (leftRem == 0 && rightRem == 0) {
            list.add(String.copyValueOf(str));
        } else {
            if (leftRem > 0) {
                str[index] = '(';
                addParen(list, leftRem - 1, rightRem, str, index + 1);
            }
            if (rightRem > leftRem) {
                str[index] = ')';
                addParen(list, leftRem, rightRem - 1, str, index + 1);
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | $O\left(\frac{4^N}{\sqrt{N}}\right)$ | Génère exactement $C_N = \frac{1}{N+1}\binom{2N}{N}$ chaînes valides. |
| Espace Auxiliaire | `O(N)` | Profondeur de pile bornée par $2N$ et tampon de caractères unique. |

## Ingénierie des Systèmes en Production

### Architecture Système : Analyseurs Syntaxiques (Parsers)

1. **Analyseurs AST de Compilateurs (LLVM / Clang) :** Validation des blocs de code et parenthèses imbriquées par automates à pile.
2. **Décodeurs JSON / XML :** Contrôle des limites de profondeur pour contrer les attaques par débordement de pile.

## Cas Limites et Robustesse

1. **$n = 0$ :** Renvoie `[""]`.
2. **$n = 1$ :** Renvoie `["()"]`.
