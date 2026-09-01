---
title: "Dernières K Lignes: Tampon Circulaire en C++ pour Flux de Fichiers (CTCI 12.1)"
description: "Affichez les K dernières lignes d'un fichier en C++ à l'aide d'un tampon circulaire (Ring Buffer) en temps O(N) et mémoire bornée O(K) sans charger le fichier en RAM."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-1-last-k-lines.webp
previewImage: /assets/images/ctci-12-1-last-k-lines.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode en C++ pour afficher les $K$ dernières lignes d'un fichier d'entrée via les flux d'E/S de C++.
> * **La Solution Optimale:** **Tampon Circulaire de Taille K** : (1) Allouer un tableau ou vecteur de $K$ chaînes de caractères ; (2) Lire séquentiellement chaque ligne via `std::getline()`, en écrivant dans `ringBuffer[count % K]` ; (3) L'opérateur modulo `% K` écrase continuellement la ligne la plus ancienne sans décalage mémoire ; (4) À la fin du fichier, afficher depuis `(count < K ? 0 : count % K)` pour un total de $\min(count, K)$ lignes ; (5) S'exécute en **temps $O(N)$** et **espace $O(K)$ en RAM**.
> * **Réalité en Production:** Implémentation de la commande UNIX `tail -n K` et tampons de traces du noyau Linux (`dmesg`).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.1), l'énoncé est :

*"Ecrivez une methode en C++ permettant d'afficher les K dernieres lignes d'un fichier texte."*

## 2. Principe du Tampon Circulaire (Ring Buffer)

Pour un fichier de 50 Go et $K = 100$, charger l'intégralité du texte en mémoire provoquerait un crash.

En utilisant un vecteur de taille $K$, chaque nouvelle entrée remplace la plus ancienne :
$$\text{Indice} = \text{count} \pmod K$$
En fin de lecture, l'enregistrement le plus ancien réside à l'indice `start = count % K`.

## Implémentation de Production

```cpp
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>

void printLastKLines(const std::string& filename, int k) {
    if (k <= 0) return;

    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Erreur: Impossible d'ouvrir le fichier " << filename << std::endl;
        return;
    }

    std::vector<std::string> ringBuffer(k);
    int count = 0;
    std::string line;

    while (std::getline(file, line)) {
        ringBuffer[count % k] = std::move(line);
        count++;
    }

    int start = (count < k) ? 0 : (count % k);
    int totalToPrint = std::min(count, k);

    for (int i = 0; i < totalToPrint; i++) {
        std::cout << ringBuffer[(start + i) % k] << "\n";
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Un unique parcours séquentiel de $N$ lignes. |
| Espace Auxiliaire | `O(K)` | Strictement borné à $K$ chaînes allouées en RAM. |
| E/S Disque | `Séquentiel` | Lecture linéaire exploitant la mise en cache du noyau. |

## Ingénierie des Systèmes en Production

### Architecture Système : Tampons Circulaires Noyau

1. **Commande GNU `tail -n K` :** Pour les flux non indexables (pipes), alloue un tampon circulaire en RAM.
2. **Buffer de Logs Noyau Linux (`dmesg`) :** Utilise un tampon circulaire contigu (`__log_buf`) pour éviter toute saturation mémoire.

## Cas Limites et Robustesse

1. **Fichier avec Moins de K Lignes ($N < K$) :** Affiche exactement les $N$ lignes sans blancs.
2. **Fichier Vide ($N = 0$) :** Terminaison sans émission ni erreur.
