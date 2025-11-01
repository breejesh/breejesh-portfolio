---
title: "Sorted Search No Size: Recherche dans une Liste sans Méthode Taille (CTCI 10.4)"
description: "Problème CTCI 10.4 en Java: rechercher un élément dans une structure Listy sans connaître sa taille."
date: "2025-11-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
previewImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.4 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.4 en Java: rechercher un élément dans une structure Listy sans connaître sa taille.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.4**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.4 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.4:** Problème CTCI 10.4 en Java: rechercher un élément dans une structure Listy sans connaître sa taille.

---

## 3. Approche optimale et implémentation

```java
public class SortedSearchNoSize {
    static class Listy {
        private final int[] array;
        public Listy(int[] arr) { this.array = arr; }
        public int elementAt(int i) {
            return (i >= 0 && i < array.length) ? array[i] : -1;
        }
    }

    public static int search(Listy list, int value) {
        int index = 1;
        while (list.elementAt(index) != -1 && list.elementAt(index) < value) {
            index *= 2;
        }
        return binarySearch(list, value, index / 2, index);
    }

    private static int binarySearch(Listy list, int value, int low, int high) {
        while (low <= high) {
            int mid = low + (high - low) / 2;
            int middle = list.elementAt(mid);
            if (middle > value || middle == -1) high = mid - 1;
            else if (middle < value) low = mid + 1;
            else return mid;
        }
        return -1;
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