---
title: "Similarité Creuse: Index Inversé pour la Similarité de Jaccard par Paires de Documents (CTCI 17.26)"
description: "Calculez l'indice de Jaccard entre paires de documents partageant des termes grâce à un index inversé évitant les comparaisons inutiles en temps O(D * W + P)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-26-sparse-similarity.webp
previewImage: /assets/images/ctci-17-26-sparse-similarity.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une collection de documents représentés par des ensembles d'entiers (mots). Calculez la similarité de Jaccard ($\frac{|A \cap B|}{|A \cup B|}$) pour toutes les paires de documents ayant une similarité $> 0$.
> * **La Solution Optimale:** **Index Inversé avec Comptage des Intersections par Paire**:
>   1. **Construire l'Index Inversé**: Associer chaque mot à la liste des documents le contenant : `mot -> [doc1, doc2, ...]`.
>   2. **Agréger les Intersections**: Pour chaque mot, incrémenter le compteur de mots partagés pour chaque paire `(docA, docB)` de sa liste.
>   3. **Calculer la Similarité de Jaccard**: Pour chaque paire avec intersection $> 0$ :
>      $$\text{similarité} = \frac{\text{intersection}}{|\text{docA}| + |\text{docB}| - \text{intersection}}$$
>   4. Temps : **$O(D \cdot W + P)$**, Espace : **$O(D \cdot W)$**.
> * **Réalité en Production:** Listes de publication inversées dans Apache Lucene/Elasticsearch et filtrage collaboratif de recommandation.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.26), l'énoncé est :

*"La similarité de deux documents est definie comme la taille de l'intersection divisee par l'union. Calculez la similarite de toutes les paires ayant une valeur strictement positive."*

## 2. Stratégie d'Intersection par Index Inversé

Au lieu de vérifier les $O(D^2)$ paires possibles, l'index inversé restreint le calcul aux seuls couples de documents partageant au moins un mot.

## Implémentation de Production

```java
import java.util.*;

public class SparseSimilarity {

    public static class DocPair {
        public final int doc1, doc2;
        public DocPair(int d1, int d2) {
            this.doc1 = Math.min(d1, d2);
            this.doc2 = Math.max(d1, d2);
        }
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DocPair)) return false;
            DocPair p = (DocPair) o;
            return doc1 == p.doc1 && doc2 == p.doc2;
        }
        @Override
        public int hashCode() {
            return Objects.hash(doc1, doc2);
        }
    }

    public static Map<DocPair, Double> computeSimilarities(Map<Integer, int[]> documents) {
        Map<Integer, List<Integer>> invertedIndex = new HashMap<>();
        for (Map.Entry<Integer, int[]> entry : documents.entrySet()) {
            int docId = entry.getKey();
            for (int word : entry.getValue()) {
                invertedIndex.computeIfAbsent(word, k -> new ArrayList<>()).add(docId);
            }
        }

        Map<DocPair, Integer> intersections = new HashMap<>();
        for (List<Integer> docList : invertedIndex.values()) {
            int size = docList.size();
            for (int i = 0; i < size; i++) {
                for (int j = i + 1; j < size; j++) {
                    DocPair pair = new DocPair(docList.get(i), docList.get(j));
                    intersections.merge(pair, 1, Integer::sum);
                }
            }
        }

        Map<DocPair, Double> result = new HashMap<>();
        for (Map.Entry<DocPair, Integer> entry : intersections.entrySet()) {
            DocPair pair = entry.getKey();
            int intersect = entry.getValue();
            int size1 = documents.get(pair.doc1).length;
            int size2 = documents.get(pair.doc2).length;
            double union = size1 + size2 - intersect;
            result.put(pair, intersect / union);
        }

        return result;
    }
}
```

## Analyse de Complexité

| Phase | Complexité Temporelle | Espace Auxiliaire |
|---|---|---|
| Construction Index Inversé | $O(\sum |D_i|)$ | $O(\sum |D_i|)$ |
| Comptage des Intersections | $O(\sum \binom{|L_w|}{2})$ | $O(\text{paires uniques})$ |
| Calcul de Similarité | $O(\text{paires avec intersection } > 0)$ | $O(\text{paires avec intersection } > 0)$ |
| **Total** | **$O(\sum |D_i| + P)$** | **$O(\sum |D_i|)$** |

## Ingénierie des Systèmes en Production

1. **Moteurs de Recherche (Lucene/Elasticsearch) :** Traitement des requêtes en temps constant par rapport au corpus total grâce aux listes de diffusion inversées.
2. **Filtrage Collaboratif Élément-Élément :** Les plateformes de e-commerce évaluent la proximité entre articles en inversant la matrice utilisateur-produit.

## Cas Limites et Robustesse

1. **Corpus Vide :** Retourne une carte vide.
2. **Aucun Mot Commun :** Retourne une carte vide sans allouer d'entrées inutiles.
3. **Documents Identiques :** Calcule une similarité exacte de `1.0`.
