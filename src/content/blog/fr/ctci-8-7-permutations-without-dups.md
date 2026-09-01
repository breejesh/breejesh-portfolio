---
title: "Permutations sans Doublons: Génération de Permutations de Caractères Uniques (CTCI 8.7)"
description: "Calculez les N! permutations d'une chaîne de caractères uniques par insertion récursive en temps optimal O(N! * N) et espace O(N! * N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-7-permutations-without-dups.webp
previewImage: /assets/images/ctci-8-7-permutations-without-dups.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode pour calculer toutes les permutations d'une chaîne de caractères uniques.
> * **La Solution Optimale:** Insertion Récursive dans les Sous-Chaînes : (1) Le cas de base pour `""` est `[""]` ; (2) Isoler le premier caractère $c = S[0]$ et calculer récursivement les $(N-1)!$ permutations de la sous-chaîne restante ; (3) Insérer $c$ à chaque position possible $0 \dots |mot|$ de chaque sous-permutation ; (4) Génère $N!$ chaînes en **$O(N! \cdot N)$ temps** et **$O(N! \cdot N)$ espace**.
> * **Réalité en Production:** Générateurs de matrices de test combinatoires et solveurs d'anagrammes.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.7), l'énoncé est :

*"Calculez toutes les permutations possibles d'une chaine de caracteres uniques."*

## 2. Algorithme d'Insertion Récursive

Pour $S = \text{"abc"}$ :
1. Permutations de `"c"` : `["c"]`.
2. Insérer `'b'` dans `"c"` : `["bc", "cb"]`.
3. Insérer `'a'` dans `"bc"` et `"cb"` :
   * Depuis `"bc"` : `"abc"`, `"bac"`, `"bca"`.
   * Depuis `"cb"` : `"acb"`, `"cab"`, `"cba"`.
   * Total $= 6 = 3!$ permutations.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsWithoutDups {
    /**
     * Calcule toutes les permutations de caracteres uniques.
     * Complexite Temporelle: O(N! * N)
     * Complexite Spatiale: O(N! * N)
     */
    public static List<String> getPerms(String str) {
        if (str == null) return null;
        List<String> permutations = new ArrayList<>();

        if (str.length() == 0) {
            permutations.add("");
            return permutations;
        }

        char first = str.charAt(0);
        String remainder = str.substring(1);
        List<String> words = getPerms(remainder);

        for (String word : words) {
            for (int j = 0; j <= word.length(); j++) {
                String s = insertCharAt(word, first, j);
                permutations.add(s);
            }
        }

        return permutations;
    }

    private static String insertCharAt(String word, char c, int i) {
        String start = word.substring(0, i);
        String end = word.substring(i);
        return start + c + end;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N! * N)` | Génère $N!$ chaînes, avec $O(N)$ pour chaque création. |
| Espace Auxiliaire | `O(N! * N)` | Stockage de la totalité des chaînes en mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Génération Combinatoire

1. **Matrices de Test Orthogonales :** Génération exhaustive de configurations pour valider des chemins d'exécution critiques.
2. **Outils d'Analyse Lexicale et Cryptanalyse :** Traitement distribué des dictionnaires de permutations.

## Cas Limites et Robustesse

1. **Chaîne Vide :** Renvoie `[""]`.
2. **Chaîne de 1 Caractère :** Renvoie `["a"]`.
