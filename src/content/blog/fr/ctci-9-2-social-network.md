---
title: "Social Network: Recherche des Plus Courts Chemins sur un Réseau Social (CTCI 9.2)"
description: "Problème CTCI 9.2: concevoir un système distribué pour calculer la séparation entre deux utilisateurs dans un graphe social géant."
date: "2026-04-26"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 9.2 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 9.2: concevoir un système distribué pour calculer la séparation entre deux utilisateurs dans un graphe social géant.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **9.2**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 9.2 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 9.2:** Problème CTCI 9.2: concevoir un système distribué pour calculer la séparation entre deux utilisateurs dans un graphe social géant.

---

## 3. Approche optimale et implémentation

```java
public class BidirectionalBreadthFirstSearch {
    public List<Long> findShortestPath(Map<Long, List<Long>> graph, long source, long target) {
        Queue<Long> qSource = new LinkedList<>(), qTarget = new LinkedList<>();
        Map<Long, Long> parentsSource = new HashMap<>(), parentsTarget = new HashMap<>();

        qSource.add(source); parentsSource.put(source, null);
        qTarget.add(target); parentsTarget.put(target, null);

        while (!qSource.isEmpty() && !qTarget.isEmpty()) {
            Long intersect = searchLevel(graph, qSource, parentsSource, parentsTarget);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
            intersect = searchLevel(graph, qTarget, parentsTarget, parentsSource);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
        }
        return Collections.emptyList();
    }
}
```

---

## 4. Complexité Temporelle et Spatiale

| Métrique | Complexité | Explication |
| --- | --- | --- |
| Complexité Temporelle | O(N) / O(log N) | Parcours optimal des données |
| Complexité Spatiale | O(1) / O(N) | Empreinte mémoire contrôlée |

---

## 5. Cas Limites et Résumé

Vérifiez toujours les conditions aux limites, les valeurs nulles et la taille des tableaux en entretien.