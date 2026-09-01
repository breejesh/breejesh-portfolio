---
title: "Une Seule Modification: Déterminer si Deux Chaînes Sont à une Distance d'Édition de Un (CTCI 1.5)"
description: "Implémentez un algorithme pour vérifier si deux chaînes sont à zéro ou une modification près (insertion, suppression ou remplacement) en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-5-one-away.webp
previewImage: /assets/images/ctci-1-5-one-away.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Trois types de modifications peuvent être appliquées à des chaînes : insérer un caractère, supprimer un caractère ou remplacer un caractère. Étant donné deux chaînes, écrivez une fonction pour vérifier si elles sont à une modification (ou zéro) d'écart.
> * **La Solution Optimale:** Comparez les longueurs. Si $|long_1 - long_2| > 1$, retournez faux immédiatement. Pour des longueurs égales, vérifiez au plus un remplacement ; pour une différence de longueur de 1, vérifiez au plus une insertion/suppression avec deux pointeurs en temps $O(N)$ et espace mémoire $O(1)$.
> * **Réalité en Production:** Tolérance aux fautes de frappe dans les moteurs de recherche (distance de Levenshtein), détection de mutations génomiques ponctuelles et suggestions de commandes en terminal.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 1.5), l'énoncé est le suivant :

*"Trois types de modifications peuvent être appliquées à des chaînes : insérer un caractère, supprimer un caractère ou remplacer un caractère. Étant donné deux chaînes, écrivez une fonction pour vérifier si elles sont à une modification (ou zéro) d'écart."*

**Exemples de tests :**
* `pale, ple -> true` (suppression / insertion de 'a')
* `pales, pale -> true` (insertion / suppression de 's')
* `pale, bale -> true` (remplacement de 'p' par 'b')
* `pale, bake -> false` (deux remplacements : 'p'->'b' et 'l'->'k')

## 2. Approche Naïve et Inefficacités

Une approche naïve consisterait à calculer la matrice complète de distance de Levenshtein via programmation dynamique :
* **Complexité Temporelle :** $O(N \times M)$ où $N$ et $M$ sont les longueurs des chaînes.
* **Complexité Spatiale :** $O(N \times M)$ d'espace mémoire auxiliaire.

Calculer l'intégralité de la matrice est disproportionné lorsque l'on souhaite uniquement vérifier si la distance d'édition est $\le 1$. Une seule passe linéaire suffit amplement.

## 3. Mécanique Algorithmique Optimale

Nous pouvons résoudre le problème en une seule passe à l'aide de deux pointeurs :

### Parcours Combiné à Deux Pointeurs
Regroupons les vérifications dans une seule boucle avec les pointeurs `index1` et `index2` :
1. Parcourez tant que les deux pointeurs se situent dans les limites des chaînes.
2. Lorsqu'une différence apparaît :
   * Si `foundDifference` est déjà `true`, retournez `false`.
   * Marquez `foundDifference = true`.
   * Si les longueurs sont égales, avancez les deux pointeurs (cas du remplacement).
   * Si les longueurs diffèrent, avancez uniquement le pointeur de la chaîne la plus longue (cas de l'insertion/suppression).
3. Si la boucle se termine sans violation, retournez `true`.

## Implémentation de Production

```java
public class OneAway {
    /**
     * Verifie si deux chaines sont a zero ou une modification pres.
     * Complexite Temporelle: O(N) ou N est la longueur de la chaine la plus courte.
     * Complexite Spatiale: O(1) d'espace auxiliaire.
     */
    public static boolean oneEditAway(String first, String second) {
        if (Math.abs(first.length() - second.length()) > 1) {
            return false;
        }

        // Identifier la chaine courte et la chaine longue
        String s1 = first.length() < second.length() ? first : second;
        String s2 = first.length() < second.length() ? second : first;

        int index1 = 0;
        int index2 = 0;
        boolean foundDifference = false;

        while (index2 < s2.length() && index1 < s1.length()) {
            if (s1.charAt(index1) != s2.charAt(index2)) {
                if (foundDifference) return false;
                foundDifference = true;

                if (s1.length() == s2.length()) {
                    index1++;
                }
            } else {
                index1++;
            }
            index2++;
        }

        return true;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Parcourt les chaînes en une seule passe où $N = \min(|first|, |second|)$. |
| Espace Auxiliaire | `O(1)` | Utilise uniquement des registres de pointeurs entiers sans allocation mémoire sur le tas. |

## Ingénierie des Systèmes en Production

### Architecture Système : Recherche Floue et Suggestions CLI

1. **Autocomplétion et Tolérance aux Erreurs (Elasticsearch / Lucene) :** Lucene génère des automates de Levenshtein pour filtrer les termes d'indexation avec une distance d'édition maximale de 1 ou 2.
2. **Correction Orthographique CLI / Git :** En saisissant `git stauts`, git analyse les commandes candidates à une distance de 1 pour proposer `git status`.
3. **Bio-informatique et Mutations Génomiques :** Détection d'événements de mutation ponctuelle ou d'insertion/délétion dans les séquences d'ADN.

## Cas Limites et Robustesse

1. **Chaînes identiques (`"pale", "pale"`) :** Retourne `true` (zéro modification).
2. **Chaînes vides (`"", ""`) :** Retourne `true`.
3. **Différence de longueur $\ge 2$ (`"p", "pale"`) :** Retourne `false` en $O(1)$ sans parcours mémoire.
4. **Entrées nulles :** Garde défensive `if (first == null || second == null) return false;`.
