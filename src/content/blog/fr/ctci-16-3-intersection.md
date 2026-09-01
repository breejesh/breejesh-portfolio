---
title: "Intersection: Intersection de Segments en Géométrie Algorithmique (CTCI 16.3)"
description: "Calculez le point exact d'intersection entre deux segments 2D via la règle de Cramer, les déterminants vectoriels et la gestion du colinéaire."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-3-intersection.webp
previewImage: /assets/images/ctci-16-3-intersection.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit deux segments de droite (définis par leurs points de départ et d'arrivée), déterminez s'ils se coupent et calculez leur point d'intersection exact.
> * **La Solution Optimale:** **Déterminants d'Algèbre Linéaire (Règle de Cramer) et Boîtes Englobantes** :
>   1. Convertir les segments en équations cartésiennes $A_1 x + B_1 y = C_1$ et $A_2 x + B_2 y = C_2$.
>   2. Calculer le déterminant $\Delta = A_1 B_2 - A_2 B_1$.
>   3. **Parallèles ou Colinéaires ($\Delta = 0$)** : Tester le chevauchement des intervalles sur les axes.
>   4. **Droites Sécantes ($\Delta \neq 0$)** : Résoudre $(x, y)$ et vérifier l'appartenance du point aux boîtes englobantes des **deux** segments.
>   5. S'exécute en **temps $O(1)$** et **espace $O(1)$**.
> * **Réalité en Production:** Moteurs de rendu 3D (ray tracing) et indexation spatiale sous PostGIS.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.3), l'énoncé est :

*"Calculez le point d'intersection de deux segments 2D en traitant l'ensemble des cas limites : verticalite, parallelisme et colinearite."*

## 2. Déterminants et Règle de Cramer

$$\Delta = (p_2.y - p_1.y)(p_3.x - p_4.x) - (p_4.y - p_3.y)(p_1.x - p_2.x)$$

Lorsque $\Delta \neq 0$, le système linéaire à deux inconnues livre directement $(x, y)$, qu'il convient ensuite de valider sur les bornes des deux segments.

## Implémentation de Production

```java
public class LineIntersection {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public static Point intersection(Point p1, Point p2, Point p3, Point p4) {
        double a1 = p2.y - p1.y;
        double b1 = p1.x - p2.x;
        double c1 = a1 * p1.x + b1 * p1.y;

        double a2 = p4.y - p3.y;
        double b2 = p3.x - p4.x;
        double c2 = a2 * p3.x + b2 * p3.y;

        double delta = a1 * b2 - a2 * b1;
        double epsilon = 1e-9;

        if (Math.abs(delta) < epsilon) {
            if (Math.abs(a1 * p3.x + b1 * p3.y - c1) < epsilon) {
                return getCollinearOverlap(p1, p2, p3, p4);
            }
            return null;
        }

        double x = (b2 * c1 - b1 * c2) / delta;
        double y = (a1 * c2 - a2 * c1) / delta;
        Point pt = new Point(x, y);

        if (isBetween(p1, pt, p2) && isBetween(p3, pt, p4)) {
            return pt;
        }
        return null;
    }

    private static boolean isBetween(Point start, Point middle, Point end) {
        double epsilon = 1e-9;
        return middle.x >= Math.min(start.x, end.x) - epsilon &&
               middle.x <= Math.max(start.x, end.x) + epsilon &&
               middle.y >= Math.min(start.y, end.y) - epsilon &&
               middle.y <= Math.max(start.y, end.y) + epsilon;
    }

    private static Point getCollinearOverlap(Point p1, Point p2, Point p3, Point p4) {
        Point left1 = (p1.x < p2.x || (p1.x == p2.x && p1.y < p2.y)) ? p1 : p2;
        Point right1 = (left1 == p1) ? p2 : p1;
        Point left2 = (p3.x < p4.x || (p3.x == p4.x && p3.y < p4.y)) ? p3 : p4;
        Point right2 = (left2 == p3) ? p4 : p3;

        if (isBetween(left1, left2, right1)) return left2;
        if (isBetween(left2, left1, right2)) return left1;
        return null;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Calcul arithmétique direct. |
| Espace Mémoire | `O(1)` | Aucune allocation dynamique. |

## Ingénierie des Systèmes en Production

### Architecture Système : Tolérances Épsilon et Arbres R

1. **Seuils $\epsilon$ :** En calcul géométrique, l'égalité stricte entre réels est proscrite pour éviter les dérives de précision IEEE 754.
2. **Arbres R (R-Trees) :** Dans les moteurs SIG, les segments sont d'abord filtrés par leur rectangle englobant minimal avant de lancer le calcul d'intersection.

## Cas Limites et Robustesse

1. **Segments Verticaux :** La forme $Ax + By = C$ évite toute division par zéro liée à une pente infinie.
