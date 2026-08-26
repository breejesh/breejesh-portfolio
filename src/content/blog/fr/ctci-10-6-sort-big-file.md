---
title: "Sort Big File: Tri Externe pour Fichier de 20 Go avec 2 Go de RAM (CTCI 10.6)"
description: "Problème CTCI 10.6: algorithme de tri par fusion externe pour trier un fichier massif de 20 Go avec 2 Go de RAM."
date: "2025-09-13"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.6 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.6: algorithme de tri par fusion externe pour trier un fichier massif de 20 Go avec 2 Go de RAM.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.6**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.6 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.6:** Problème CTCI 10.6: algorithme de tri par fusion externe pour trier un fichier massif de 20 Go avec 2 Go de RAM.

---

## 3. Approche optimale et implémentation

```java
// Conceptual External Merge Sort outline
public class ExternalMergeSort {
    public void sortLargeFile(File inputFile, int memoryLimitMB) {
        List<File> sortedChunks = createSortedChunks(inputFile, memoryLimitMB);
        mergeSortedChunks(sortedChunks, new File("sorted_output.txt"));
    }

    private List<File> createSortedChunks(File file, int limitMB) {
        // Read chunk of data fitting in limitMB, sort in RAM, write to temp file
        return new ArrayList<>();
    }

    private void mergeSortedChunks(List<File> chunks, File outputFile) {
        // K-way merge using PriorityQueue reading 1 line at a time from each chunk file
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