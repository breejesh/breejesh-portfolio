---
title: "Test d'Échecs: Cadre de Tests Unitaires pour canMoveTo (CTCI 11.3)"
description: "Élaborez une suite de tests unitaires pour valider la méthode canMoveTo(x, y) aux échecs : conditions limites, géométrie des pièces et échecs au roi."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-11-3-chess-test.webp
previewImage: /assets/images/ctci-11-3-chess-test.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit la méthode `boolean canMoveTo(int x, int y)` de la classe `Piece` dans un jeu d'échecs ($x, y \in [0, 7]$). Comment testeriez-vous cette méthode ?
> * **La Solution Optimale:** **Matrice de Tests à Trois Niveaux** : (1) **Conditions Limites et Extrêmes** : Coordonnées hors plateau ($(-1, 0), (8, 8)$), coins ($(0,0), (7,7)$) ; (2) **Règles Géométriques par Pièce** : Pions (déplacement double, prise en diagonale), Cavaliers (sauts en L), Fous (diagonales), Tours (orthogonales), Dames et Rois (1 case et roque) ; (3) **Invariants d'État de Jeu** : Obstruction de trajectoire, collision alliée (interdite), prise adverse, pièces clouées et interdiction d'exposer son Roi à l'échec.
> * **Réalité en Production:** Moteurs d'échecs (Stockfish / Lichess) et moteurs de règles transactionnelles.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 11.3), l'énoncé est :

*"Concevez un plan de tests et une suite de tests unitaires pour valider exhaustivement la methode canMoveTo(x, y) d'un jeu d'echecs."*

## 2. Matrice de Catégories de Tests

1. **Tests de Bornes :** Rejet immédiat de toute coordonnée en dehors de $[0, 7]$.
2. **Géométrie Spécifique :** Validation des mouvements sans contact ou avec saut d'obstacles (Cavalier).
3. **Clouage et Invariants d'Échec :** Interdiction stricte de bouger une pièce absolue protégeant le Roi.

## Implémentation de Production

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

public class ChessPieceTest {
    private Board board;

    @BeforeEach
    public void setup() {
        board = new Board();
    }

    @ParameterizedTest
    @CsvSource({ "-1, 0", "0, -1", "8, 0", "0, 8", "-5, -5", "100, 100" })
    public void testOutOfBounds(int x, int y) {
        Piece knight = new Knight(board, 4, 4, Color.WHITE);
        assertFalse(knight.canMoveTo(x, y));
    }

    @Test
    public void testKnightObstacleJump() {
        Piece knight = new Knight(board, 1, 0, Color.WHITE);
        board.placePiece(new Pawn(board, 1, 1, Color.WHITE), 1, 1);
        
        assertTrue(knight.canMoveTo(2, 2));
        assertTrue(knight.canMoveTo(0, 2));
        assertFalse(knight.canMoveTo(1, 2));
    }

    @Test
    public void testPinnedPieceMovement() {
        King whiteKing = new King(board, 4, 0, Color.WHITE);
        Bishop whiteBishop = new Bishop(board, 4, 2, Color.WHITE);
        Rook blackRook = new Rook(board, 4, 7, Color.BLACK);

        board.placePiece(whiteKing, 4, 0);
        board.placePiece(whiteBishop, 4, 2);
        board.placePiece(blackRook, 4, 7);

        assertFalse(whiteBishop.canMoveTo(5, 3));
    }
}
```

## Analyse de Complexité et Performance

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Vérification des Bornes | `O(1)` | Comparaisons d'entiers en temps constant. |
| Parcours de Rayon | `O(1)` | Au maximum 7 cases examinées sur grille 8x8. |
| Invariant d'Échec | `O(1)` | Simulation de coup sur copie légère d'échiquier. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs d'Échecs

1. **Bitboards 64 bits :** Représentation de l'échiquier sous forme d'entiers `long` évaluant la légalité des coups en moins de 5 nanosecondes par masquage binaire.
2. **Tests aux Limites par Fuzzing :** Génération de millions de positions aléatoires pour traquer les régressions de règles.

## Cas Limites et Robustesse

1. **Prise en Passant :** Validation de la case cible vide avec capture du pion latéral.
2. **Roque à Travers l'Échec :** Strictement prohibé par les règlements FIDE.
