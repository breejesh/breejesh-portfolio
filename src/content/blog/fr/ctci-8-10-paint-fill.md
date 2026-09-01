---
title: "Remplissage de Peinture: Algorithme Flood Fill sur Matrice 2D (CTCI 8.10)"
description: "Implémentez l'outil de remplissage par pot de peinture sur une matrice 2D par parcours récursif DFS en temps O(R * C) et espace O(R * C)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-10-paint-fill.webp
previewImage: /assets/images/ctci-8-10-paint-fill.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez la fonction « pot de peinture » (paint fill). Étant donné un écran 2D de couleurs, un point $(r, c)$ et une nouvelle couleur `ncolor`, remplissez la zone contiguë de couleur uniforme jusqu'aux frontières.
> * **La Solution Optimale:** Remplissage par Inondation (Flood Fill DFS) : (1) Mémoriser la couleur initiale $O = screen[r][c]$ ; (2) Si $O == ncolor$, s'arrêter immédiatement (évite toute récursion infinie) ; (3) Muter $screen[r][c] = ncolor$ ; (4) Propager la récursion vers les 4 voisins cardinaux (haut, bas, gauche, droite) en **temps $O(R \times C)$** et espace $O(R \times C)$.
> * **Réalité en Production:** Outil pot de peinture dans Photoshop/GIMP et segmentation en vision par ordinateur (OpenCV).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.10), l'énoncé est :

*"Implementez la fonction de pot de peinture permettant d'etendre une couleur sur une region connexe de couleur uniforme dans une image matricielle 2D."*

## 2. Algorithme de Remplissage par Inondation

1. **Garde Initiale :** Si la couleur d'origine est déjà égale à la nouvelle couleur, terminer immédiatement.
2. **Contrôle des Limites :** Si $(r, c)$ est en dehors de la grille, retourner.
3. **Coloration et Propagation :** Remplacer la couleur et propager l'appel sur les 4 cases adjacentes.

## Implémentation de Production

```java
public class PaintFill {
    public enum Color { Black, White, Red, Yellow, Blue, Green }

    /**
     * Remplit la zone connexe de couleur uniforme.
     * Complexite Temporelle: O(R * C)
     * Complexite Spatiale: O(R * C)
     */
    public static boolean paintFill(Color[][] screen, int r, int c, Color ncolor) {
        if (screen == null || r < 0 || r >= screen.length || c < 0 || c >= screen[0].length) {
            return false;
        }
        if (screen[r][c] == ncolor) {
            return false;
        }
        return paintFillHelper(screen, r, c, screen[r][c], ncolor);
    }

    private static boolean paintFillHelper(Color[][] screen, int r, int c,
                                          Color ocolor, Color ncolor) {
        if (r < 0 || r >= screen.length || c < 0 || c >= screen[0].length) {
            return false;
        }

        if (screen[r][c] == ocolor) {
            screen[r][c] = ncolor;
            paintFillHelper(screen, r - 1, c, ocolor, ncolor);
            paintFillHelper(screen, r + 1, c, ocolor, ncolor);
            paintFillHelper(screen, r, c - 1, ocolor, ncolor);
            paintFillHelper(screen, r, c + 1, ocolor, ncolor);
        }

        return true;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(R * C)` | Chaque pixel de la zone est visité et modifié exactement une fois. |
| Espace Auxiliaire | `O(R * C)` | Profondeur maximale de la pile de récursion. |

## Ingénierie des Systèmes en Production

### Architecture Système : Remplissage par Lignes de Balayage

1. **Remplissage Scanline (Photoshop) :** Remplissage par segments horizontaux pour réduire la profondeur de pile de $O(R \times C)$ à $O(R)$.
2. **Étiquetage de Composantes Connexes (OpenCV) :** Extraction d'objets distincts dans des masques binaires.

## Cas Limites et Robustesse

1. **Couleur Cible Identique :** Arrêt précoce évitant une boucle infinie.
2. **Coordonnées Hors Bornes :** Traitement sécurisé par contrôles de limites.
