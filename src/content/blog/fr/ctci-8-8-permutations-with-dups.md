---
title: "Permutations avec Doublons: Permutations Uniques de Caractères Répétés (CTCI 8.8)"
description: "Calculez toutes les permutations uniques d'une chaîne contenant des doublons sans branches redondantes par retour sur trace basé sur table de fréquences."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode pour calculer toutes les permutations d'une chaîne dont les caractères ne sont pas nécessairement uniques. La liste finale ne doit comporter aucun doublon.
> * **La Solution Optimale:** Retour sur Trace par Table de Fréquences : (1) Construire une table d'occurrences `Map<Character, Integer>` ; (2) À chaque niveau de récursion, ne créer **qu'une seule branche** par caractère distinct disponible (compteur $> 0$) ; (3) Décrémenter l'occurrence, descendre dans la récursion, puis restaurer l'état (backtrack) ; (4) Génère exactement $\frac{N!}{n_1! \dots n_k!}$ chaînes en temps optimal sans générer de branches redondantes.
> * **Réalité en Production:** Recombinaison de fragments d'ADN en génomique et déduplication d'arbres de requêtes relationnelles.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.8), l'énoncé est :

*"Calculez toutes les permutations uniques d'une chaine contenant des caracteres repetes sans generer de doublons intermediaires."*

## 2. Élagage par Table de Fréquences

Énumérer $N!$ permutations puis filtrer via un `HashSet` gaspille un temps exponentiel précieux.

### Méthode Optimale : Fréquences
Pour `"aab"` $\to \{'a': 2, 'b': 1\}$ :
1. Choisir `'a'` en première position $\implies$ engendre `["aab", "aba"]`.
2. Choisir `'b'` en première position $\implies$ engendre `["baa"]`.
Total $= 3$ permutations produites directement.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {
    /**
     * Calcule les permutations uniques pour une chaine avec doublons.
     * Complexite Temporelle: O(N * (N! / (n1! * n2! * ... * nk!)))
     * Complexite Spatiale: O(N)
     */
    public static List<String> printPerms(String s) {
        List<String> result = new ArrayList<>();
        Map<Character, Integer> map = buildFreqTable(s);
        printPermsHelper(map, "", s.length(), result);
        return result;
    }

    private static Map<Character, Integer> buildFreqTable(String s) {
        Map<Character, Integer> map = new HashMap<>();
        for (char c : s.toCharArray()) {
            map.put(c, map.getOrDefault(c, 0) + 1);
        }
        return map;
    }

    private static void printPermsHelper(Map<Character, Integer> map, String prefix,
                                         int remaining, List<String> result) {
        if (remaining == 0) {
            result.add(prefix);
            return;
        }

        for (Character c : map.keySet()) {
            int count = map.get(c);
            if (count > 0) {
                map.put(c, count - 1);
                printPermsHelper(map, prefix + c, remaining - 1, result);
                map.put(c, count);
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | $O\left(\frac{N!}{n_1! \dots n_k!} \cdot N\right)$ | Exactement le coefficient multinomial des chaînes uniques. |
| Espace Auxiliaire | `O(N)` | Profondeur de pile bornée par la longueur $N$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Permutations de Multi-Ensembles

1. **Assemblage de Séquences Génomiques :** Réassemblage de lectures courtes d'ADN sur graphes de de Bruijn sans permutations redondantes.
2. **Optimisation de Requêtes SQL :** Réordonnancement de filtres commutatifs sur bases relationnelles.

## Cas Limites et Robustesse

1. **Caractères Tous Identiques (`"aaaa"`) :** Génère 1 seule chaîne en temps linéaire.
2. **Caractères Tous Distincts :** Équivaut à la formule factorielle $N!$.
