---
title: "Regrouper les Anagrammes: Hachage par Clé Canonique (CTCI 10.2)"
description: "Triez un tableau de chaînes pour regrouper les anagrammes côte à côte par hachage de signature canonique en temps O(N * K log K) et espace O(N * K)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-2-group-anagrams.webp
previewImage: /assets/images/ctci-10-2-group-anagrams.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode pour réorganiser un tableau de chaînes de caractères de sorte que tous les anagrammes soient adjacents.
> * **La Solution Optimale:** Hachage par Signature Canonique Triée : (1) Deux anagrammes possèdent la même séquence de lettres lorsqu'ils sont triés (ex. `"gare"`, `"rage"`, `"page"` partagent leurs lettres triées) ; (2) Regrouper les mots dans une table `HashMap<String, List<String>>` où la clé est la version triée du mot ; (3) Réécrire les listes concaténées dans le tableau d'origine ; (4) S'exécute en **temps $O(N \cdot K \log K)$** et **espace $O(N \cdot K)$**.
> * **Réalité en Production:** Moteurs de suggestions d'autocomplétion et groupement de codons génomiques.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.2), l'énoncé est :

*"Reorganisez un tableau de chaines de caracteres pour que tous les anagrammes soient adjacents."*

## 2. Démarche par Clé Canonique

Trier le tableau avec un `Comparator` personnalisé engendre une complexité de $O(N \log N \cdot K \log K)$.

En regroupant les mots par leur forme canonique dans une table de hachage, une seule passe linéaire de $N$ tris de taille $K$ est requise, abaissant la complexité à **$O(N \cdot K \log K)$**.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GroupAnagrams {
    /**
     * Regroupe les anagrammes de maniere contigue.
     * Complexite Temporelle: O(N * K log K)
     * Complexite Spatiale: O(N * K)
     */
    public static void sort(String[] array) {
        Map<String, List<String>> mapList = new HashMap<>();

        for (String s : array) {
            String key = sortChars(s);
            mapList.putIfAbsent(key, new ArrayList<>());
            mapList.get(key).add(s);
        }

        int index = 0;
        for (String key : mapList.keySet()) {
            List<String> list = mapList.get(key);
            for (String t : list) {
                array[index] = t;
                index++;
            }
        }
    }

    private static String sortChars(String s) {
        char[] content = s.toCharArray();
        Arrays.sort(content);
        return new String(content);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N * K log K)` | $N$ chaînes de longueur $K$ triées par Dual-Pivot Quicksort. |
| Espace Auxiliaire | `O(N * K)` | Table de hachage contenant les listes d'anagrammes. |

## Ingénierie des Systèmes en Production

### Architecture Système : Index Lexicaux

1. **Suggestions Orthographiques :** Regroupement de permutations pour générer des requêtes de correction phonétique ou typographique.
2. **Génomique Numérique :** Détection de permutations de nucléotides dans des bibliothèques de séquençage.

## Cas Limites et Robustesse

1. **Chaînes Vides ou Courtes :** Gérées sans exception par la clé `""`.
2. **Préservation des Caractères :** Restitution fidèle dans le tableau récepteur.
