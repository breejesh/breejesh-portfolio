---
title: "Transformateur de Mots: BFS Bidirectionnel sur Graphe Implicite de Mots (CTCI 17.22)"
description: "Trouvez la séquence de transformation la plus courte entre deux mots, chaque étape changeant un seul caractère avec chaque mot intermédiaire dans le dictionnaire, par BFS bidirectionnel en O(N * L^2) temps."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-22-word-transformer.webp
previewImage: /assets/images/ctci-17-22-word-transformer.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un mot source, un mot cible et un dictionnaire, trouvez la séquence de transformations la plus courte où chaque étape diffère d'exactement un caractère et chaque mot intermédiaire appartient au dictionnaire.
> * **La Solution Optimale:** **BFS Bidirectionnel sur Graphe Implicite de Mots**:
>   1. Construire une carte de motifs joker : pour chaque mot, générer tous les motifs avec un `*` substitué (ex. `"hit"` → `{"*it", "h*t", "hi*"}`).
>   2. Lancer le **BFS simultanément depuis la source et la cible**. Terminer quand les deux fronts s'intersectent.
>   3. Le BFS bidirectionnel réduit l'espace exploré de $O(b^d)$ à $O(2 \cdot b^{d/2})$.
>   4. Temps : **$O(N \cdot L^2)$**, Espace : **$O(N \cdot L)$**.
> * **Réalité en Production:** Correcteurs orthographiques, graphes de synonymes et récupération de chemins dans les graphes de connaissances.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.22), l'énoncé est :

*"Trouvez la sequence de transformation la plus courte entre deux mots, chaque etape changeant un seul caractere avec chaque mot intermediaire dans le dictionnaire."*

## 2. Carte de Motifs Joker et BFS

La carte de motifs joker construit implicitement le graphe d'adjacence sans parcourir le dictionnaire pour chaque nouvel état.

## Implémentation de Production

```java
import java.util.*;

public class WordTransformer {

    public static List<String> transform(String start, String stop, Set<String> dictionary) {
        if (!dictionary.contains(stop)) return null;
        Map<String, List<String>> wildcardMap = buildWildcardMap(dictionary);
        BFSData sourceData = new BFSData(start);
        BFSData destData   = new BFSData(stop);

        while (!sourceData.toVisit.isEmpty() && !destData.toVisit.isEmpty()) {
            String collision = extendBFS(sourceData, destData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
            collision = extendBFS(destData, sourceData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
        }
        return null;
    }

    private static Map<String, List<String>> buildWildcardMap(Set<String> dict) {
        Map<String, List<String>> map = new HashMap<>();
        for (String word : dict) {
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                map.computeIfAbsent(pattern, k -> new ArrayList<>()).add(word);
            }
        }
        return map;
    }

    static class BFSData {
        Queue<String> toVisit = new LinkedList<>();
        Map<String, String> visited = new HashMap<>();
        BFSData(String start) { toVisit.add(start); visited.put(start, null); }
    }

    private static String extendBFS(BFSData primary, BFSData other, Map<String, List<String>> map) {
        int count = primary.toVisit.size();
        while (count-- > 0) {
            String word = primary.toVisit.poll();
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                for (String neighbor : map.getOrDefault(pattern, Collections.emptyList())) {
                    if (!primary.visited.containsKey(neighbor)) {
                        primary.visited.put(neighbor, word);
                        primary.toVisit.add(neighbor);
                    }
                    if (other.visited.containsKey(neighbor)) return neighbor;
                }
            }
        }
        return null;
    }

    private static List<String> mergePaths(BFSData src, BFSData dst, String collision) {
        LinkedList<String> pathSrc = new LinkedList<>();
        String curr = collision;
        while (curr != null) { pathSrc.addFirst(curr); curr = src.visited.get(curr); }
        List<String> pathDst = new ArrayList<>();
        curr = dst.visited.get(collision);
        while (curr != null) { pathDst.add(curr); curr = dst.visited.get(curr); }
        pathSrc.addAll(pathDst);
        return pathSrc;
    }
}
```

## Analyse de Complexité

| Phase | Complexité Temporelle | Détail |
|---|---|---|
| Construction de la Carte Joker | $O(N \cdot L)$ | N mots, L motifs par mot. |
| BFS Bidirectionnel | $O(N \cdot L^2)$ | Génération de motifs par voisin visité. |
| **Total** | **$O(N \cdot L^2)$** | **Optimal pour graphe implicite de mots.** |

## Ingénierie des Systèmes en Production

1. **Correcteurs Orthographiques :** Le voisinage à distance de Levenshtein-1 est exactement le graphe de motifs joker.
2. **Graphes de Connaissances :** Récupération de chemins par BFS sur transformations sémantiques de distance-1.

## Cas Limites et Robustesse

1. **Cible Absente du Dictionnaire :** Retourne `null` immédiatement.
2. **Source = Cible :** Retourne une liste d'un seul élément.
