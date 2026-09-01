---
title: "Distance entre Mots: Index Inversé Positionnel et Deux Pointeurs (CTCI 17.11)"
description: "Calculez la distance minimale entre deux mots dans un document par parcours linéaire O(N) et index inversé positionnel à deux pointeurs en temps O(A + B)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-11-word-distance.webp
previewImage: /assets/images/ctci-17-11-word-distance.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un fichier texte volumineux, déterminez la plus courte distance (en nombre de mots) séparant deux mots donnés. Si la requête est répétée fréquemment sur le même document, optimisez la structure de données.
> * **La Solution Optimale:**
>   1. **Requête Unique (Parcours Linéaire)** :
>      * Parcourir le flux de mots en mémorisant `lastPos1` et `lastPos2`. Mettre à jour la distance minimale à chaque occurrence en temps $O(N)$ et espace $O(1)$.
>   2. **Requêtes Multiples (Index Inversé Positionnel)** :
>      * Précalculer une table `Map<String, List<Integer>>` associant chaque mot à la liste ordonnée de ses positions.
>      * Pour une paire $(W_1, W_2)$, faire converger deux pointeurs $p_1$ et $p_2$ en temps **$O(|L_1| + |L_2|)$**.
> * **Réalité en Production:** Recherche de proximité dans Apache Lucene / Elasticsearch (`SPAN_NEAR`) et requêtes de phrases exactes.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.11), l'énoncé est :

*"Evaluez la distance minimale separant deux mots dans un texte sous contrainte de requete unique ou de requetes repetees intensives."*

## 2. Balayage Positionnel à Deux Pointeurs

La structure d'index inversé stocke les listes d'indices ordonnées, permettant un rapprochement en temps linéaire sur la taille des deux listes.

## Implémentation de Production

```java
import java.util.*;

public class WordDistance {

    public static int findClosestSingleQuery(String[] words, String word1, String word2) {
        if (words == null || word1 == null || word2 == null) return -1;

        int lastPos1 = -1, lastPos2 = -1;
        int minDistance = Integer.MAX_VALUE;

        for (int i = 0; i < words.length; i++) {
            if (words[i].equals(word1)) {
                lastPos1 = i;
                if (lastPos2 >= 0) minDistance = Math.min(minDistance, lastPos1 - lastPos2);
            } else if (words[i].equals(word2)) {
                lastPos2 = i;
                if (lastPos1 >= 0) minDistance = Math.min(minDistance, lastPos2 - lastPos1);
            }
        }

        return (minDistance == Integer.MAX_VALUE) ? -1 : minDistance;
    }

    public static class WordDistanceMap {
        private final Map<String, List<Integer>> locations = new HashMap<>();

        public WordDistanceMap(String[] words) {
            for (int i = 0; i < words.length; i++) {
                locations.computeIfAbsent(words[i].toLowerCase(), k -> new ArrayList<>()).add(i);
            }
        }

        public int distance(String word1, String word2) {
            List<Integer> list1 = locations.get(word1.toLowerCase());
            List<Integer> list2 = locations.get(word2.toLowerCase());

            if (list1 == null || list2 == null || list1.isEmpty() || list2.isEmpty()) {
                return -1;
            }

            int p1 = 0, p2 = 0;
            int minDistance = Integer.MAX_VALUE;

            while (p1 < list1.size() && p2 < list2.size()) {
                int pos1 = list1.get(p1);
                int pos2 = list2.get(p2);

                minDistance = Math.min(minDistance, Math.abs(pos1 - pos2));
                if (minDistance == 1) return 1;

                if (pos1 < pos2) {
                    p1++;
                } else {
                    p2++;
                }
            }

            return minDistance;
        }
    }
}
```

## Analyse de Complexité

| Mode | Prétraitement | Temps par Requête | Espace Mémoire |
|---|---|---|---|
| **Passe Unique** | $O(0)$ | **$O(N)$** | **$O(1)$** |
| **Index Inversé Positionnel** | $O(N)$ | **$O(|L_1| + |L_2|)$** | **$O(N)$** |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs de Recherche (Elasticsearch)

1. **Listes de Postings Positionnelles :** Stockage compressé des positions de termes dans des fichiers `.pos` pour évaluer les requêtes de phrases sans décompresser le document entier.
2. **Bioinformatique :** Mesure de proximité spatiale entre motifs génomiques.

## Cas Limites et Robustesse

1. **Terme Absent du Fichier :** Renvoie `-1` en toute sécurité.
2. **Termes Contigus :** Renvoie `1` immédiatement sans parcourir le reste des listes.
