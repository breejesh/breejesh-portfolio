---
title: "Correspondance de Motif: Décomposition Diophantienne de Chaînes (CTCI 16.18)"
description: "Vérifiez si une chaîne de texte respecte un motif à deux variables ('a' et 'b') en résolvant l'équation linéaire des longueurs en O(N^2)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-18-pattern-matching.webp
previewImage: /assets/images/ctci-16-18-pattern-matching.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit deux chaînes, `pattern` (composé exclusivement de `'a'` et `'b'`) et `value`. Déterminez si `value` correspond à `pattern` (ex. `catcatgocatgo` correspond à `aabab` avec `a = "cat"` et `b = "go"`).
> * **La Solution Optimale:** **Équation Linéaire Diophantienne des Longueurs** :
>   1. **Normalisation** : Si le motif débute par `'b'`, intervertir tous les caractères pour garantir un début par `'a'`.
>   2. **Comptage** : Dénombrer les occurrences de `'a'` ($c_a$) et `'b'` ($c_b$).
>   3. **Contrainte Algébrique** : Pour une longueur $L = |\text{value}|$ :
>      $$c_a \cdot L_a + c_b \cdot L_b = L \implies L_b = \frac{L - c_a \cdot L_a}{c_b}$$
>   4. **Itération sur $L_a$** : Parcourir $L_a \in [0, \lfloor L / c_a \rfloor]$. Si le reste est divisible par $c_b$, extraire les sous-chaînes candidates et valider la correspondance complète.
>   5. S'exécute en **temps $O(L^2)$** et **espace $O(L)$**.
> * **Réalité en Production:** Rétro-références dans les moteurs d'expressions régulières (PCRE / Oniguruma).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.18), l'énoncé est :

*"Evaluez si une chaine de caracteres peut etre reconstituee a partir d'un patron de deux variables textuelles distinctes."*

## 2. Équation des Longueurs

En bornant la longueur de $a$, la longueur de $b$ est immédiatement déduite, ce qui réduit drastiquement l'arbre de recherche combinatoire.

## Implémentation de Production

```java
public class PatternMatching {

    public static boolean matches(String pattern, String value) {
        if (pattern == null || value == null) return false;
        if (pattern.isEmpty()) return value.isEmpty();

        char mainChar = pattern.charAt(0);
        char altChar = (mainChar == 'a') ? 'b' : 'a';
        int size = value.length();

        int countOfMain = 0;
        int countOfAlt = 0;
        for (char c : pattern.toCharArray()) {
            if (c == mainChar) countOfMain++;
            else countOfAlt++;
        }

        if (countOfAlt == 0) {
            if (size % countOfMain != 0) return false;
            int len = size / countOfMain;
            String cand = value.substring(0, len);
            return verifyPattern(pattern, value, cand, "", mainChar);
        }

        int firstAlt = pattern.indexOf(altChar);
        int maxMainSize = size / countOfMain;

        for (int mainSize = 0; mainSize <= maxMainSize; mainSize++) {
            int remainingLength = size - (mainSize * countOfMain);
            if (remainingLength % countOfAlt == 0) {
                int altSize = remainingLength / countOfAlt;
                int altIndex = firstAlt * mainSize;

                String mainSub = value.substring(0, mainSize);
                String altSub = value.substring(altIndex, altIndex + altSize);

                if (!mainSub.equals(altSub)) {
                    if (verifyPattern(pattern, value, mainSub, altSub, mainChar)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static boolean verifyPattern(String pattern, String value, String mainSub, String altSub, char mainChar) {
        int stringIndex = 0;
        for (char c : pattern.toCharArray()) {
            String target = (c == mainChar) ? mainSub : altSub;
            if (target.isEmpty()) continue;

            if (stringIndex + target.length() > value.length() ||
                !value.startsWith(target, stringIndex)) {
                return false;
            }
            stringIndex += target.length();
        }
        return stringIndex == value.length();
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(L^2)` | $L / c_a$ étapes avec vérification linéaire. |
| Espace Mémoire | `O(L)` | Sous-chaînes candidates instanciées. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs d'Expressions Régulières

1. **Rétro-références :** Dans PCRE, l'analyse arithmétique des longueurs permet d'élaguer les branches de retour arrière (backtracking) exponentielles.

## Cas Limites et Robustesse

1. **Sous-chaînes Distinctes :** `!mainSub.equals(altSub)` interdit que $a$ et $b$ désignent la même chaîne.
