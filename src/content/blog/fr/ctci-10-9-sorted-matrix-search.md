---
title: "Sorted Matrix Search: Recherche dans une Matrice M x N Triée (CTCI 10.9)"
description: "Problème CTCI 10.9 en Java: chercher un élément en temps O(M + N) dans une matrice triée en lignes et colonnes."
date: "2026-04-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
previewImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.9 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.9 en Java: chercher un élément en temps O(M + N) dans une matrice triée en lignes et colonnes.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.9**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.9 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.9:** Problème CTCI 10.9 en Java: chercher un élément en temps O(M + N) dans une matrice triée en lignes et colonnes.

---

## 3. Approche optimale et implémentation

```java
public class SortedMatrixSearch {
    public static boolean findElement(int[][] matrix, int elem) {
        int row = 0;
        int col = matrix[0].length - 1;
        while (row < matrix.length && col >= 0) {
            if (matrix[row][col] == elem) {
                return true;
            } else if (matrix[row][col] > elem) {
                col--;
            } else {
                row++;
            }
        }
        return false;
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