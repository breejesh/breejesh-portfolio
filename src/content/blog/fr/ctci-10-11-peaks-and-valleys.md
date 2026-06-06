---
title: "Peaks and Valleys: Trier un Tableau en Pics et Vallées Alternés (CTCI 10.11)"
description: "Problème CTCI 10.11 en Java: réorganiser un tableau d'entiers en une séquence alternée de pics et vallées en O(N)."
date: "2026-06-06"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
previewImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.11 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.11 en Java: réorganiser un tableau d'entiers en une séquence alternée de pics et vallées en O(N).
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.11**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.11 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.11:** Problème CTCI 10.11 en Java: réorganiser un tableau d'entiers en une séquence alternée de pics et vallées en O(N).

---

## 3. Approche optimale et implémentation

```java
public class PeaksAndValleys {
    public static void sortValleyPeak(int[] array) {
        for (int i = 1; i < array.length; i += 2) {
            int maxIndex = maxIndex(array, i - 1, i, i + 1);
            if (i != maxIndex) {
                swap(array, i, maxIndex);
            }
        }
    }

    private static int maxIndex(int[] array, int a, int b, int c) {
        int len = array.length;
        int aValue = (a >= 0 && a < len) ? array[a] : Integer.MIN_VALUE;
        int bValue = (b >= 0 && b < len) ? array[b] : Integer.MIN_VALUE;
        int cValue = (c >= 0 && c < len) ? array[c] : Integer.MIN_VALUE;
        int max = Math.max(aValue, Math.max(bValue, cValue));

        if (aValue == max) return a;
        else if (bValue == max) return b;
        else return c;
    }

    private static void swap(int[] array, int i, int j) {
        int temp = array[i];
        array[i] = array[j];
        array[j] = temp;
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