---
title: "Group Anagrams: Regrouper les Anagrammes d'un Tableau de Chaînes (CTCI 10.2)"
description: "Problème CTCI 10.2 en Java: trier un tableau de chaînes de sorte que tous les anagrammes soient adjacents."
date: "2026-06-19"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-2-group-anagrams.webp
previewImage: /assets/images/ctci-10-2-group-anagrams.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.2 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.2 en Java: trier un tableau de chaînes de sorte que tous les anagrammes soient adjacents.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.2**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.2 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.2:** Problème CTCI 10.2 en Java: trier un tableau de chaînes de sorte que tous les anagrammes soient adjacents.

---

## 3. Approche optimale et implémentation

```java
public class GroupAnagrams {
    public static void sort(String[] array) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : array) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        int index = 0;
        for (List<String> list : map.values()) {
            for (String s : list) {
                array[index++] = s;
            }
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