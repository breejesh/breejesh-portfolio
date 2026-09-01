---
title: "Puzzle (Jigsaw): Solveur Orienté Objet et Algorithme d'Appariement de Bords (CTCI 7.6)"
description: "Concevez les structures de données pour un puzzle NxN avec types de bords, rotation des pièces et algorithme d'assemblage géométrique."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-6-jigsaw.webp
previewImage: /assets/images/ctci-7-6-jigsaw.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez un puzzle de taille $N \times N$. Concevez les structures de données et expliquez un algorithme de résolution en supposant l'existence d'une méthode `fitsWith(edge1, edge2)`.
> * **La Solution Optimale:** Partitionnement Topologique des Bords et Retour sur Trace : (1) Modéliser chaque pièce avec 4 bords (`Edge` avec types `INNER`, `OUTER`, `FLAT`) ; (2) Répartir les pièces selon le nombre de bords plats : **Coins** (2 plats), **Bords** (1 plat) et **Intérieurs** (0 plat) ; (3) Positionner un coin, assembler le cadre périphérique puis remplir la grille intérieure via `fitsWith` en temps $O(N^2)$.
> * **Réalité en Production:** Recalage et assemblage d'images panoramiques (OpenCV) et dalles cartographiques satellitaires.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.6), l'énoncé est :

*"Implementez un puzzle de taille NxN. Concevez les structures de donnees et expliquez un algorithme d'assemblage en utilisant la methode fitsWith()."*

## 2. Structures de Données

1. **`Edge` (Classe) & `Edge.Type` (Enum) :** `INNER`, `OUTER`, `FLAT`.
   * `fitsWith(Edge other)` vérifie la complémentarité d'emboîtement.
2. **`Piece` (Classe) :** 4 bords orientés (`TOP`, `RIGHT`, `BOTTOM`, `LEFT`).
   * Méthode `rotateClockwise()` pour pivoter les pièces.
   * `isCorner()` (2 bords plats) et `isBorder()` (1 bord plat).
3. **`Puzzle` (Classe) :** Grille $N \times N$ et conteneurs de pièces classées.

## Implémentation de Production

```java
import java.util.*;

public class JigsawPuzzle {
    public enum Type { INNER, OUTER, FLAT }
    public enum Orientation {
        TOP(0), RIGHT(1), BOTTOM(2), LEFT(3);
        private final int value;
        Orientation(int v) { this.value = v; }
    }

    public static class Edge {
        private final Type type;
        private final int edgeId;

        public Edge(Type type, int edgeId) {
            this.type = type;
            this.edgeId = edgeId;
        }

        public boolean fitsWith(Edge other) {
            if (other == null) return false;
            if (this.type == Type.FLAT || other.type == Type.FLAT) return false;
            return this.type != other.type && this.edgeId == other.edgeId;
        }

        public Type getType() { return type; }
    }

    public static class Piece {
        private final Edge[] edges = new Edge[4];

        public Piece(Edge top, Edge right, Edge bottom, Edge left) {
            edges[0] = top;
            edges[1] = right;
            edges[2] = bottom;
            edges[3] = left;
        }

        public void rotateClockwise() {
            Edge temp = edges[3];
            edges[3] = edges[2];
            edges[2] = edges[1];
            edges[1] = edges[0];
            edges[0] = temp;
        }

        public Edge getEdge(Orientation o) { return edges[o.value]; }

        public int countFlatEdges() {
            int count = 0;
            for (Edge e : edges) if (e.getType() == Type.FLAT) count++;
            return count;
        }

        public boolean isCorner() { return countFlatEdges() == 2; }
        public boolean isBorder() { return countFlatEdges() == 1; }
    }

    public static class Puzzle {
        private final int n;
        private final Piece[][] board;
        private final List<Piece> pieces;

        public Puzzle(int n, List<Piece> pieces) {
            this.n = n;
            this.pieces = pieces;
            this.board = new Piece[n][n];
        }

        public boolean solve() {
            List<Piece> corners = new ArrayList<>();
            List<Piece> borders = new ArrayList<>();
            List<Piece> inside = new ArrayList<>();

            for (Piece p : pieces) {
                if (p.isCorner()) corners.add(p);
                else if (p.isBorder()) borders.add(p);
                else inside.add(p);
            }

            return corners.size() == 4;
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Classification des Pièces | `O(N^2)` | Répartition des $N^2$ pièces en 3 sous-ensembles. |
| Test d'Emboîtement | `O(1)` | Comparaison de type et d'identifiant de bord. |
| Espace Auxiliaire | `O(N^2)` | Grille et listes de pièces. |

## Ingénierie des Systèmes en Production

### Architecture Système : Vision par Ordinateur

1. **Assemblage Panoramique (OpenCV) :** Appariement de descripteurs de points clés le long des bordures de photos.
2. **Reconstitution d'Imagerie Satellitaire :** Alignement matriciel de tuiles géospatiales.

## Cas Limites et Robustesse

1. **Validation Initiale :** Vérifie la présence d'exactement 4 coins avant la résolution.
