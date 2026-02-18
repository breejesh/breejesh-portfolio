---
title: "Sorted Merge: Fusionner deux Tableaux Triés sur Place (CTCI 10.1)"
description: "Problème CTCI 10.1 en Java: fusionner deux tableaux triés A et B dans A en travaillant de la fin vers le début."
date: "2026-02-18"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-1-sorted-merge.webp
previewImage: /assets/images/ctci-10-1-sorted-merge.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.1 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.1 en Java: fusionner deux tableaux triés A et B dans A en travaillant de la fin vers le début.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.1**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.1 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.1:** Problème CTCI 10.1 en Java: fusionner deux tableaux triés A et B dans A en travaillant de la fin vers le début.

---

## 3. Approche optimale et implémentation

```java
public class SortedMerge {
    public static void merge(int[] a, int[] b, int lastA, int lastB) {
        int indexA = lastA - 1;
        int indexB = lastB - 1;
        int indexMerged = lastA + lastB - 1;

        while (indexB >= 0) {
            if (indexA >= 0 && a[indexA] > b[indexB]) {
                a[indexMerged] = a[indexA];
                indexA--;
            } else {
                a[indexMerged] = b[indexB];
                indexB--;
            }
            indexMerged--;
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