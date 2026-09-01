---
title: "Le Plus Long Mot: Décomposition Récursive de Mots Composés (CTCI 17.15)"
description: "Trouvez le plus long mot formé par concaténation d'autres mots d'un dictionnaire par tri par longueur et découpage récursif mémorisé en temps O(N · L^2)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-15-longest-word.webp
previewImage: /assets/images/ctci-17-15-longest-word.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une liste de mots, trouvez le plus long mot pouvant être intégralement formé par la concaténation d'autres mots de la même liste.
> * **La Solution Optimale:** **Tri par Longueur Décroissante + Découpage Récursif Mémorisé** :
>   1. **Tri Initial** : Trier les mots par ordre de longueur décroissante.
>   2. **Table de Mémorisation** : Conserver l'état de validation dans `Map<String, Boolean>`.
>   3. **Exploration des Préfixes** : Pour chaque mot, tester les points de scission $i \in [1, \text{longueur}-1]$ :
>      * Vérifier si le préfixe gauche est présent dans le dictionnaire ET que la récursion sur le suffixe droit renvoie `true`.
>   4. Le premier mot validé est mathématiquement le mot composé le plus long.
>   5. S'exécute en **temps $O(N \log N + N \cdot L^2)$** et **espace $O(N \cdot L)$**.
> * **Réalité en Production:** Décomposition morphologique des mots composés germaniques dans Apache Lucene et détection de typosquattage de noms de domaine.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.15), l'énoncé est :

*"Isolez le mot de taille maximale pouvant etre integralement fabrique a partir d'au moins deux autres mots du lexique."*

## 2. Découpage Récursif et Mémorisation

Le tri préalable garantit une terminaison anticipée dès la première validation d'une combinaison.

## Implémentation de Production

```java
import java.util.*;

public class LongestWord {

    public static String printLongestWord(String[] list) {
        if (list == null || list.length == 0) return "";

        Arrays.sort(list, (a, b) -> Integer.compare(b.length(), a.length()));

        Map<String, Boolean> map = new HashMap<>();
        for (String w : list) {
            map.put(w, true);
        }

        for (String w : list) {
            if (canBuildWord(w, true, map)) {
                return w;
            }
        }

        return "";
    }

    private static boolean canBuildWord(String str, boolean isOriginalWord, Map<String, Boolean> map) {
        if (map.containsKey(str) && !isOriginalWord) {
            return map.get(str);
        }

        for (int i = 1; i < str.length(); i++) {
            String left = str.substring(0, i);
            String right = str.substring(i);

            if (map.containsKey(left) && map.get(left) && canBuildWord(right, false, map)) {
                map.put(str, true);
                return true;
            }
        }

        map.put(str, false);
        return false;
    }
}
```

## Analyse de Complexité

| Étape | Complexité Temporelle | Espace Mémoire | Sortie Anticipée |
|---|---|---|---|
| **Tri des Mots** | $O(N \log N)$ | $O(1)$ | Longueur décroissante |
| **Recherche Récursive** | **$O(N \cdot L^2)$** | **$O(N \cdot L)$** | **Immédiate au premier succès** |

## Ingénierie des Systèmes en Production

### Architecture Système : Analyseurs Lexicaux dans Lucene

1. **Décomposition Lexicale (Lucene Decompounder) :** Les analyseurs de recherche séparent les mots composés allemands sans espaces en leurs unités de base.
2. **Cybersécurité :** Détection de noms de domaine frauduleux par décomposition de chaînes d'adresses.

## Cas Limites et Robustesse

1. **Aucun Mot Composé :** Renvoie une chaîne vide `""`.
2. **Auto-Correspondance :** Le booléen `isOriginalWord` interdit à un mot de se valider trivialement sur lui-même.
