---
title: "Trier un Fichier Volumineux: Tri Fusion Externe pour Données Massives (CTCI 10.6)"
description: "Triez un fichier de 20 Go sous contrainte stricte de mémoire vive grâce au tri fusion externe (External Merge Sort) et à un tas Min-Heap en temps O(N log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez un fichier de 20 Go contenant une chaîne de caractères par ligne. Expliquez comment vous trieriez ce fichier.
> * **La Solution Optimale:** **Tri Fusion Externe avec Min-Heap à K Voies** : (1) Découper le fichier de 20 Go en $K = 20$ morceaux de 1 Go (tenant facilement en RAM) ; (2) Charger chaque bloc en mémoire, le trier avec TimSort / Quicksort et écrire le résultat sur disque (`chunk_0.txt` ... `chunk_19.txt`) ; (3) Ouvrir un flux de lecture avec tampon pour chaque fichier et charger la première ligne dans un tas binaire Min-Heap (`PriorityQueue`) de taille $K$ ; (4) Extraire itérativement la plus petite chaîne, l'écrire dans le fichier final et réapprovisionner le tas depuis le flux source ; (5) S'exécute en **temps $O(N \log N)$** et **espace $O(M)$ en RAM**.
> * **Réalité en Production:** Algorithme de tri sous-jacent de PostgreSQL / MySQL (`work_mem`) et phase de tri dans Apache Hadoop.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.6), l'énoncé est :

*"Expliquez comment trier un fichier de 20 Go compose d'une chaine par ligne avec des ressources de memoire vive restreintes."*

## 2. Architecture du Tri Fusion Externe

La taille du fichier (20 Go) excédant la mémoire de processus allouée, l'opération se divise en deux étapes séquentielles :

1. **Génération des Blocs Triés :** Lecture de tronçons de 1 Go en mémoire, tri interne et persistance temporaire sur disque.
2. **Fusion à K Voies :** Un tas Min-Heap de taille 20 extrait continuellement le plus petit élément en streaming pour générer le fichier final en exactement 2 passes de disque.

## Implémentation de Production

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.PriorityQueue;

public class ExternalMergeSort {
    public static class HeapEntry implements Comparable<HeapEntry> {
        public final String value;
        public final int chunkIndex;

        public HeapEntry(String v, int idx) {
            this.value = v;
            this.chunkIndex = idx;
        }

        @Override
        public int compareTo(HeapEntry other) {
            return this.value.compareTo(other.value);
        }
    }

    public static void mergeSortedChunks(List<File> chunkFiles, File outputFile) throws IOException {
        int k = chunkFiles.size();
        BufferedReader[] readers = new BufferedReader[k];
        PriorityQueue<HeapEntry> minHeap = new PriorityQueue<>(k);

        try {
            for (int i = 0; i < k; i++) {
                readers[i] = new BufferedReader(new FileReader(chunkFiles.get(i)), 65536);
                String line = readers[i].readLine();
                if (line != null) {
                    minHeap.add(new HeapEntry(line, i));
                }
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile), 65536)) {
                while (!minHeap.isEmpty()) {
                    HeapEntry entry = minHeap.poll();
                    writer.write(entry.value);
                    writer.newLine();

                    String nextLine = readers[entry.chunkIndex].readLine();
                    if (nextLine != null) {
                        minHeap.add(new HeapEntry(nextLine, entry.chunkIndex));
                    }
                }
            }
        } finally {
            for (BufferedReader r : readers) {
                if (r != null) r.close();
            }
            for (File f : chunkFiles) {
                f.delete();
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Phase | Complexité Temporelle | Mémoire RAM | E/S Disque |
|---|---|---|---|
| Découpage et Tri | `O(N log(N / K))` | `O(M)` (1 Go) | 1 lecture + 1 écriture de 20 Go. |
| Fusion à K Voies | `O(N log K)` | `O(K * 64Ko)` ($\approx 1{,}3\text{ Mo}$) | 1 lecture + 1 écriture de 20 Go. |
| **Total Pipeline** | **$O(N \log N)$** | **$O(M)$** | **2 Passes Séquentielles** |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs de Bases de Données

1. **Débordement Mémoire de PostgreSQL :** Lorsqu'une clause `ORDER BY` dépasse `work_mem`, le moteur déverse des segments temporaires sur disque et applique un tri fusion externe.
2. **Phase Shuffle / Sort d'Hadoop :** Les nœuds workers fusionnent les partitions distribuées via des flux HTTP.

## Cas Limites et Robustesse

1. **Épuisement des Descripteurs de Fichiers :** Pour $K > 1024$, mise en œuvre d'un arbre de fusion hiérarchique à plusieurs passes (fusion par paquets de 32).
