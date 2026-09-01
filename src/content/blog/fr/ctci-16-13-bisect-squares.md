---
title: "Bisection de Carrés: Géométrie des Centroïdes et Découpe Équitable (CTCI 16.13)"
description: "Déterminez la droite exacte coupant deux carrés 2D en deux aires égales en reliant leurs centres géométriques et en calculant leurs bords en O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit deux carrés dans un plan 2D (les côtés supérieur et inférieur étant parallèles à l'axe des abscisses), trouvez une droite coupant ces deux carrés exactement en deux aires égales.
> * **La Solution Optimale:** **Alignement des Centres Géométriques (Centroïdes)** :
>   1. Toute droite passant par le centre géométrique d'un carré coupe sa surface en deux moitiés égales.
>   2. Par conséquent, la droite reliant le centre du Carré 1 ($C_1$) au centre du Carré 2 ($C_2$) **bissecte simultanément les deux figures**.
>   3. Étendre les extrémités jusqu'aux périmètres extérieurs.
>   4. S'exécute en **temps $O(1)$** et **espace $O(1)$**.
> * **Réalité en Production:** Découpage de parcelles dans les moteurs SIG (PostGIS) et détection de collisions physiques.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.13), l'énoncé est :

*"Identifiez le segment de droite qui separe deux carres 2D alignes sur les axes en deux portions de surfaces strictement identiques."*

## 2. Propriété des Centroïdes

$$C = \left(x_{\text{gauche}} + \frac{\text{taille}}{2}, y_{\text{bas}} + \frac{\text{taille}}{2}\right)$$

La pente $m = \frac{C_2.y - C_1.y}{C_2.x - C_1.x}$ définit la sécante commune.

## Implémentation de Production

```java
public class BisectSquares {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class Square {
        public final double left, right, top, bottom, size;

        public Square(double left, double top, double size) {
            this.left = left;
            this.top = top;
            this.bottom = top - size;
            this.right = left + size;
            this.size = size;
        }

        public Point middle() {
            return new Point(left + size / 2.0, bottom + size / 2.0);
        }

        public Point getIntersection(Point mid, double slope) {
            if (slope == Double.POSITIVE_INFINITY || slope == Double.NEGATIVE_INFINITY) {
                return new Point(mid.x, top);
            }
            if (Math.abs(slope) <= 1.0) {
                double x = (mid.x >= this.middle().x) ? right : left;
                double y = slope * (x - mid.x) + mid.y;
                return new Point(x, y);
            } else {
                double y = (mid.y >= this.middle().y) ? top : bottom;
                double x = (y - mid.y) / slope + mid.x;
                return new Point(x, y);
            }
        }
    }

    public static class LineSegment {
        public final Point p1, p2;
        public LineSegment(Point p1, Point p2) {
            this.p1 = p1;
            this.p2 = p2;
        }
    }

    public static LineSegment cut(Square sq1, Square sq2) {
        Point c1 = sq1.middle();
        Point c2 = sq2.middle();

        if (c1.x == c2.x && c1.y == c2.y) {
            return new LineSegment(new Point(c1.x, sq1.top), new Point(c1.x, sq2.bottom));
        }

        double slope = (c1.x == c2.x) ? Double.POSITIVE_INFINITY : (c2.y - c1.y) / (c2.x - c1.x);

        return new LineSegment(sq1.getIntersection(c1, slope), sq2.getIntersection(c2, slope));
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Calculs algébriques immédiats. |
| Espace Mémoire | `O(1)` | Aucune allocation lourde. |

## Ingénierie des Systèmes en Production

### Architecture Système : Géométrie dans les SIG

1. **Calcul de Centroïdes Généraux :** Pour des polygones convexes quelconques, l'intégration discrète des coordonnées généralise ce principe géométrique.

## Cas Limites et Robustesse

1. **Centres Alignés Verticalement :** Gestion de pente infinie sans erreur arithmétique.
