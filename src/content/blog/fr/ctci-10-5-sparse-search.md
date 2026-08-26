---
title: "Sparse Search: Recherche dans un Tableau Clairsemé de Chaînes (CTCI 10.5)"
description: "Problème CTCI 10.5 en Java: chercher une chaîne dans un tableau trié entrecoupé de chaînes vides."
date: "2026-01-23"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.5 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.5 en Java: chercher une chaîne dans un tableau trié entrecoupé de chaînes vides.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.5**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.5 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.5:** Problème CTCI 10.5 en Java: chercher une chaîne dans un tableau trié entrecoupé de chaînes vides.

---

## 3. Approche optimale et implémentation

```java
public class SparseSearch {
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) return -1;
        return search(strings, str, 0, strings.length - 1);
    }

    private static int search(String[] strings, String str, int first, int last) {
        if (first > last) return -1;
        int mid = (first + last) / 2;

        if (strings[mid].isEmpty()) {
            int left = mid - 1, right = mid + 1;
            while (true) {
                if (left < first && right > last) return -1;
                if (right <= last && !strings[right].isEmpty()) { mid = right; break; }
                if (left >= first && !strings[left].isEmpty()) { mid = left; break; }
                right++; left--;
            }
        }

        if (strings[mid].equals(str)) return mid;
        else if (strings[mid].compareTo(str) < 0) return search(strings, str, mid + 1, last);
        else return search(strings, str, first, mid - 1);
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