---
title: "Entier Manquant: Vecteur de Bits et Découpage en Deux Passes (CTCI 10.7)"
description: "Trouvez un entier absent parmi quatre milliards de nombres avec 1 Go et 10 Mo de RAM via vecteurs de bits et principe des tiroirs en temps O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-7-missing-int.webp
previewImage: /assets/images/ctci-10-7-missing-int.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un fichier contenant quatre milliards d'entiers non négatifs. Proposez un algorithme pour générer un entier absent avec 1 Go de RAM. SUITE : Qu'en est-il avec seulement 10 Mo de mémoire ?
> * **La Solution Optimale:** **Vecteurs de Bits et Comptage par Blocs en Deux Passes** : (1) **Avec 1 Go de RAM** : Un vecteur de bits de $2^{32}\text{ bits} = 512\text{ Mo}$ identifie les entiers présents en 1 seule passe linéaire ; (2) **Avec 10 Mo de RAM** : La première passe compte les fréquences par blocs de $2^{16}$ entiers ($256\text{ Ko}$ de RAM). Par le principe des tiroirs, au moins un bloc compte moins de $2^{16}$ éléments ; (3) La seconde passe alloue un sous-vecteur de bits de $8\text{ Ko}$ ($2^{16}\text{ bits}$) pour ce bloc déficitaire et localise l'entier manquant en temps $O(N)$.
> * **Réalité en Production:** Attribution d'adresses IPv4 et index Roaring Bitmaps dans Apache Lucene.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.7), l'énoncé est :

*"Trouvez un entier non present parmi 4 milliards de valeurs dans un fichier avec 1 Go de RAM, puis avec une contrainte stricte de 10 Mo de RAM."*

## 2. Dimensionnement Mémoire et Principe des Tiroirs

L'ensemble des entiers 32 bits non signés compte $2^{32} \approx 4{,}29$ milliards de valeurs.

### Cas 1 : 1 Go de RAM (Une Passe)
Un tableau de bits pour $2^{32}$ entiers requiert :
$$2^{32}\text{ bits} = 512\text{ Mo}$$
Ce tableau s'insère sans difficulté dans 1 Go de RAM.

---

### Cas 2 : 10 Mo de RAM (Deux Passes)
1. **Passe 1 (Comptage par Blocs) :**
   * Découpage en $2^{16} = 65\,536$ plages de nombres.
   * `int[] blocks = new int[65536]` occupe $256\text{ Ko}$ en RAM.
   * Identification du bloc $B$ où `blocks[B] < 65536`.
2. **Passe 2 (Vecteur de Bits Dédié) :**
   * Allocation d'un vecteur de $65\,536\text{ bits} = 8\text{ Ko}$ pour le bloc $B$.
   * Relecture du fichier et localisation du premier bit à 0.

## Implémentation de Production

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class MissingIntFinder {
    /**
     * Solution 1 Go de RAM: Vecteur de bits 512 Mo.
     */
    public static int findMissingInt1GB(String filename) throws IOException {
        byte[] bitfield = new byte[1 << 26]; // 512Mo
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                bitfield[n / 8] |= (1 << (n % 8));
            }
        }

        for (int i = 0; i < bitfield.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitfield[i] & (1 << b)) == 0) {
                    return i * 8 + b;
                }
            }
        }
        return -1;
    }

    /**
     * Solution 10 Mo de RAM: Comptage par blocs en deux passes.
     */
    public static int findMissingInt10MB(String filename) throws IOException {
        int rangeSize = 1 << 16;
        int[] blocks = new int[rangeSize]; // 256Ko RAM

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                blocks[n / rangeSize]++;
            }
        }

        int selectedBlock = -1;
        for (int i = 0; i < blocks.length; i++) {
            if (blocks[i] < rangeSize) {
                selectedBlock = i;
                break;
            }
        }
        if (selectedBlock == -1) return -1;

        byte[] bitVector = new byte[rangeSize / 8]; // 8Ko RAM
        int startingInt = selectedBlock * rangeSize;
        int endingInt = startingInt + rangeSize;

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                if (n >= startingInt && n < endingInt) {
                    int offset = n - startingInt;
                    bitVector[offset / 8] |= (1 << (offset % 8));
                }
            }
        }

        for (int i = 0; i < bitVector.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitVector[i] & (1 << b)) == 0) {
                    return startingInt + i * 8 + b;
                }
            }
        }

        return -1;
    }
}
```

## Analyse de Complexité et Mémoire

| Mode | Complexité Temporelle | Mémoire RAM | Passes Disque |
|---|---|---|---|
| Solution 1 Go | `O(N)` | `512 Mo` | 1 Passe |
| Solution 10 Mo | `O(N)` | `264 Ko` | 2 Passes |

## Ingénierie des Systèmes en Production

### Architecture Système : Registres d'Adresses IP

1. **Tables de Routage IPv4 :** Les registres Internet allouent les sous-réseaux 32 bits libres via des vecteurs de bits en mémoire en temps $O(1)$.
2. **Roaring Bitmaps :** Adaptation dynamique entre représentations creuses et denses pour préserver les lignes de cache CPU.

## Cas Limites et Robustesse

1. **Aucun Entier Manquant :** Renvoie `-1` en cas d'exhaustivité.
2. **Valeur $n = 0$ Manquante :** Détectée immédiatement au premier bit.
