---
title: "Meilleure Droite: Maximum de Points Colinéaires par Hachage de Pentes (CTCI 16.14)"
description: "Identifiez la droite 2D traversant le plus grand nombre de points à l'aide de fractions rationnelles simplifiées par PGCD en temps O(N^2)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-14-best-line.webp
previewImage: /assets/images/ctci-16-14-best-line.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un ensemble de points sur un plan 2D, trouvez la droite passant par le plus grand nombre de points.
> * **La Solution Optimale:** **Hachage de Pentes Rationnelles Exactes** :
>   1. **Le Piège des Flottants** : L'utilisation de types `double` pour stocker la pente provoque des erreurs d'arrondi et des collisions de clés de hachage.
>   2. **Représentation Rationnelle** : Réduire la fraction $\frac{\Delta y}{\Delta x}$ par leur $\gcd(\Delta x, \Delta y)$ en normalisant le signe.
>   3. **Balayage par Point Pivot** : Pour chaque point $P_i$, calculer les pentes vers tous les autres points $P_j$ et indexer les effectifs dans une table `HashMap<SlopeFraction, Integer>`.
>   4. S'exécute en **temps $O(N^2)$** et **espace $O(N)$**.
> * **Réalité en Production:** Transformée de Hough (OpenCV) et ajustement de plans RANSAC sur nuages de points LiDAR.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.14), l'énoncé est :

*"Determinez la droite traversant le nombre maximal de points colineaires a partir d'un ensemble de coordonnees 2D."*

## 2. Pentes Rationnelles et PGCD

La réduction de fraction via l'algorithme d'Euclide garantit que deux droites de même direction partagent une clé de hachage strictement identique.

## Implémentation de Production

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class BestLine {

    public static class Point {
        public final int x, y;
        public Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class SlopeFraction {
        public final int dy, dx;

        public SlopeFraction(int dy, int dx) {
            if (dx == 0) {
                this.dy = 1; this.dx = 0;
            } else if (dy == 0) {
                this.dy = 0; this.dx = 1;
            } else {
                int g = gcd(Math.abs(dy), Math.abs(dx));
                int sign = (dx < 0) ? -1 : 1;
                this.dy = (dy / g) * sign;
                this.dx = (dx / g) * sign;
            }
        }

        private static int gcd(int a, int b) {
            while (b != 0) {
                int temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SlopeFraction)) return false;
            SlopeFraction that = (SlopeFraction) o;
            return dy == that.dy && dx == that.dx;
        }

        @Override
        public int hashCode() {
            return Objects.hash(dy, dx);
        }
    }

    public static int findBestLine(Point[] points) {
        if (points == null || points.length == 0) return 0;
        if (points.length <= 2) return points.length;

        int maxCollinear = 0;

        for (int i = 0; i < points.length; i++) {
            Map<SlopeFraction, Integer> slopeCounts = new HashMap<>();
            int duplicates = 1;
            int localMax = 0;

            for (int j = i + 1; j < points.length; j++) {
                int dx = points[j].x - points[i].x;
                int dy = points[j].y - points[i].y;

                if (dx == 0 && dy == 0) {
                    duplicates++;
                    continue;
                }

                SlopeFraction slope = new SlopeFraction(dy, dx);
                int count = slopeCounts.getOrDefault(slope, 0) + 1;
                slopeCounts.put(slope, count);
                localMax = Math.max(localMax, count);
            }

            maxCollinear = Math.max(maxCollinear, localMax + duplicates);
        }

        return maxCollinear;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N^2)` | $N(N-1)/2$ couples évalués avec calcul de PGCD. |
| Espace Mémoire | `O(N)` | Table de hachage par point pivot. |

## Ingénierie des Systèmes en Production

### Architecture Système : Vision par Ordinateur et Nuages de Points

1. **Transformée de Hough :** Détection de lignes dans les images par accumulation de votes dans l'espace polaire $(\rho, \theta)$.
2. **Méthode RANSAC :** Ajustement robuste de plans et de droites sur des millions de points LiDAR sans parcourir toutes les paires possibles.

## Cas Limites et Robustesse

1. **Points Superposés :** Comptabilisés dans la variable `duplicates`.
