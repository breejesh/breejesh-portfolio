---
title: "Rank from Stream: Calculer le Rang d'un Nombre dans un Flux (CTCI 10.10)"
description: "Problème CTCI 10.10 en Java: arbre binaire de recherche avec suivi du sous-arbre gauche pour calculer le rang."
date: "2026-01-18"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.10 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.10 en Java: arbre binaire de recherche avec suivi du sous-arbre gauche pour calculer le rang.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.10**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.10 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.10:** Problème CTCI 10.10 en Java: arbre binaire de recherche avec suivi du sous-arbre gauche pour calculer le rang.

---

## 3. Approche optimale et implémentation

```java
public class RankNode {
    public int leftSize = 0;
    public RankNode left, right;
    public int data = 0;

    public RankNode(int d) { this.data = d; }

    public void insert(int d) {
        if (d <= data) {
            if (left != null) left.insert(d);
            else left = new RankNode(d);
            leftSize++;
        } else {
            if (right != null) right.insert(d);
            else right = new RankNode(d);
        }
    }

    public int getRank(int d) {
        if (d == data) return leftSize;
        else if (d < data) {
            if (left == null) return -1;
            return left.getRank(d);
        } else {
            int rightRank = (right == null) ? -1 : right.getRank(d);
            if (rightRank == -1) return -1;
            return leftSize + 1 + rightRank;
        }
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