---
title: "Search in Rotated Array: Recherche dans un Tableau Trié Et Pivoté (CTCI 10.3)"
description: "Problème CTCI 10.3 en Java: recherche binaire modifiée dans un tableau trié ayant subi une rotation."
date: "2026-03-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
previewImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.3 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.3 en Java: recherche binaire modifiée dans un tableau trié ayant subi une rotation.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.3**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.3 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.3:** Problème CTCI 10.3 en Java: recherche binaire modifiée dans un tableau trié ayant subi une rotation.

---

## 3. Approche optimale et implémentation

```java
public class SearchRotatedArray {
    public static int search(int[] a, int left, int right, int x) {
        if (left > right) return -1;
        int mid = left + (right - left) / 2;
        if (a[mid] == x) return mid;

        if (a[left] < a[mid]) { // Left half is normally sorted
            if (x >= a[left] && x < a[mid]) return search(a, left, mid - 1, x);
            else return search(a, mid + 1, right, x);
        } else if (a[mid] < a[left]) { // Right half is normally sorted
            if (x > a[mid] && x <= a[right]) return search(a, mid + 1, right, x);
            else return search(a, left, mid - 1, x);
        } else { // Duplicates handling
            int location = -1;
            if (a[mid] != a[right]) location = search(a, mid + 1, right, x);
            if (location == -1) location = search(a, left, mid - 1, x);
            return location;
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