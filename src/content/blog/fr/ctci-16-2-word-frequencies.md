---
title: "Fréquence des Mots: Index Inversé et Prétraitement par Hachage (CTCI 16.2)"
description: "Concevez des algorithmes de calcul de fréquence de mots pour requêtes ponctuelles et répétées à l'aide de tables de hachage et d'index inversés."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez une méthode pour trouver la fréquence d'occurrence d'un mot quelconque dans un livre. Comment adapteriez-vous l'algorithme si cette opération devait être répétée de nombreuses fois ?
> * **Les Solutions Optimales :**
>   1. **Requête Ponctuelle** : Parcourir le texte en une seule passe en **temps $O(N)$** et **espace $O(1)$**, en normalisant la casse et la ponctuation.
>   2. **Requêtes Répétées** : Prétraiter l'ouvrage au sein d'une table `HashMap<String, Integer>`.
>      * Prétraitement : **temps $O(N)$**, **espace $O(U)$** ($U = \text{mots uniques}$).
>      * Temps de Requête : **$O(1)$ amorti**.
> * **Réalité en Production:** Moteurs d'indexation plein texte (Apache Lucene, Elasticsearch).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.2), l'énoncé est :

*"Evaluez la frequence d'un terme dans un texte en optimisant la solution selon la nature ponctuelle ou repetitive des requetes."*

## 2. Balayage Unique vs Index de Hachage

* **Mode Requête Unique :** Parcours séquentiel sans surcoût mémoire.
* **Mode Requêtes Multiples :** Construction d'un index associatif en mémoire pour des réponses en temps constant $O(1)$.

## Implémentation de Production

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class WordFrequencyAnalyzer {
    private final Map<String, Integer> frequencyMap;

    public WordFrequencyAnalyzer(String[] book) {
        this.frequencyMap = buildDictionary(book);
    }

    private Map<String, Integer> buildDictionary(String[] book) {
        if (book == null) return Collections.emptyMap();
        Map<String, Integer> map = new HashMap<>();

        for (String word : book) {
            if (word == null) continue;
            String normalized = normalize(word);
            if (!normalized.isEmpty()) {
                map.put(normalized, map.getOrDefault(normalized, 0) + 1);
            }
        }
        return map;
    }

    public int getFrequency(String word) {
        if (word == null) return 0;
        return frequencyMap.getOrDefault(normalize(word), 0);
    }

    private static String normalize(String word) {
        return word.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
```

## Analyse de Complexité

| Profil d'Utilisation | Temps de Prétraitement | Espace Mémoire | Temps par Requête |
|---|---|---|---|
| **Requête Unique** | $0$ | $O(1)$ | $O(N)$ |
| **$Q$ Requêtes Répétées** | $O(N)$ | $O(U)$ | **$O(1)$** |

## Ingénierie des Systèmes en Production

### Architecture Système : Index Inversés sous Elasticsearch

1. **Dictionnaire de Termes et Listes de Postings :** Les moteurs de recherche créent des structures compressées (`Term -> [DocID, TF, [Positions]]`) pour calculer les scores de pertinence (BM25).
2. **Normalisation et Racinisation (Stemming) :** Suppression des mots vides et extraction du radical linguistique.

## Cas Limites et Robustesse

1. **Ponctuation et Majuscules :** Nettoyage systématique par expressions régulières pour éviter les doublons accidentels.
