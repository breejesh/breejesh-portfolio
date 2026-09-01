---
title: "Tracer une Ligne: Rasterisation de Lignes Horizontales sur Écran Monochrome (CTCI 5.8)"
description: "Implémentez une fonction pour tracer une ligne horizontale de (x1, y) à (x2, y) sur un écran monochrome stocké sous forme de tableau d'octets en O(w / 8)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-8-draw-line.webp
previewImage: /assets/images/ctci-5-8-draw-line.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un écran monochrome est stocké sous forme d'un unique tableau d'octets, permettant de stocker huit pixels consécutifs par octet. L'écran a une largeur $w$ divisible par 8. Implémentez une fonction `drawLine(byte[] screen, int width, int x1, int x2, int y)` traçant une ligne horizontale de $(x_1, y)$ à $(x_2, y)$.
> * **La Solution Optimale:** Remplissage Rapide par Octets Alignés avec Masques de Bords : (1) Localiser les octets de départ et de fin ; (2) Remplir les octets intermédiaires avec `(byte) 0xFF` par blocs de 8 pixels ; (3) Appliquer les masques de bordure `start_mask` et `end_mask` en temps $O((x_2 - x_1) / 8)$ et espace $O(1)$.
> * **Réalité en Production:** Contrôleurs d'écrans E-Ink et moteurs de rendu de polices vectorielles (FreeType).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.8), l'énoncé est :

*"Un écran monochrome est représenté par un tableau d'octets, où chaque octet stocke 8 pixels consécutifs. La largeur w est divisible par 8. Implémentez une fonction qui trace une ligne horizontale de (x1, y) à (x2, y)."*

## 2. Organisation Mémoire et Masques Binaires

Chaque ligne de l'écran contient `width / 8` octets.
1. Pixel de début : `start_offset = x1 % 8`.
2. Pixel de fin : `end_offset = x2 % 8`.
3. Si $x_1$ et $x_2$ se trouvent dans le même octet : appliquer le masque fusionné `start_mask & end_mask`.
4. Si la ligne s'étend sur plusieurs octets :
   * Masque de début : `0xFF >> start_offset`.
   * Octets complets intermédiaires : `(byte) 0xFF`.
   * Masque de fin : `~(0xFF >> (end_offset + 1))`.

## Implémentation de Production

```java
public class DrawLine {
    /**
     * Trace une ligne horizontale sur un ecran monochrome.
     * Complexite Temporelle: O(longueur / 8)
     * Complexite Spatiale: O(1)
     */
    public static void drawLine(byte[] screen, int width, int x1, int x2, int y) {
        int start_offset = x1 % 8;
        int first_full_byte = x1 / 8;
        if (start_offset != 0) {
            first_full_byte++;
        }

        int end_offset = x2 % 8;
        int last_full_byte = x2 / 8;
        if (end_offset != 7) {
            last_full_byte--;
        }

        // Remplir les octets complets intermediaires
        for (int b = first_full_byte; b <= last_full_byte; b++) {
            screen[(width / 8) * y + b] = (byte) 0xFF;
        }

        byte start_mask = (byte) (0xFF >> start_offset);
        byte end_mask = (byte) ~(0xFF >> (end_offset + 1));

        if ((x1 / 8) == (x2 / 8)) {
            byte mask = (byte) (start_mask & end_mask);
            screen[(width / 8) * y + (x1 / 8)] |= mask;
        } else {
            if (start_offset != 0) {
                int byte_number = (width / 8) * y + first_full_byte - 1;
                screen[byte_number] |= start_mask;
            }
            if (end_offset != 7) {
                int byte_number = (width / 8) * y + last_full_byte + 1;
                screen[byte_number] |= end_mask;
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(longueur / 8)` | Remplit directement des octets entiers au lieu de traiter chaque pixel individuellement. |
| Espace Auxiliaire | `O(1)` | Modification sur place du tampon d'affichage. |

## Ingénierie des Systèmes en Production

### Architecture Système : Buffers Vidéo Bas Niveau

1. **Écrans E-Ink et OLED Monochromes (SSD1306) :** Transfert direct de lignes d'octets par bus SPI/I2C.
2. **Moteurs Typographiques (FreeType) :** Remplissage de segments de balayage horizontal dans des glyphes 1-bit monochrome.

## Cas Limites et Robustesse

1. **Ligne dans un seul octet :** Traitée via le masque combiné.
2. **Alignement parfait sur les frontières d'octets :** Remplissage direct sans masquage partiel.
