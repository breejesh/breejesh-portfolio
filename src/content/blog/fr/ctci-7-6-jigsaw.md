---
title: "Jigsaw: Apparier les bords IN OUT FLAT pour remplir le plateau (Java)"
description: "Problème 7.6 style CTCI pour débutants: modélise des pièces de puzzle avec quatre bords (INNER, OUTER, FLAT), tourne-les et remplis un plateau N sur N en appariant les côtés opposés. Conception objet et esquisse de solveur en Java."
date: "2026-01-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-6-jigsaw.webp
previewImage: /assets/images/ctci-7-6-jigsaw.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème 7.6 style CTCI pour débutants: modélise des pièces de puzzle avec quatre bords (INNER, OUTER, FLAT), tourne-les et remplis un plateau N sur N en appariant les côtés opposés. Conception objet et esquisse de solveur en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un jigsaw, c'est un plateau de pièces. Chaque pièce a quatre côtés. Un côté est soit une **languette** (qui dépasse), soit une **encoche** (qui rentre), soit **plat** (droit, seulement sur le pourtour du puzzle fini). Deux pièces s'emboîtent quand une languette rencontre une encoche. Les côtés plats ne touchent que le bord de la table, pas le plat d'une autre pièce au milieu.

C'est de la conception orientée objet classique avec une fine couche d'algorithme par-dessus. Il te faut des classes qui portent les bords et l'orientation, des règles du type "ces deux bords s'emboîtent-ils", et un moyen d'essayer des pièces dans des cases vides jusqu'à remplir le plateau. Enseignement original pour débutants en **Java**. Même famille que les puzzles OOD d'entretien, pas une copie du livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## 1. Analogie du quotidien

Imagine un puzzle enfants 3 sur 3 sur la table basse.

* Les **quatre coins** ont chacun deux côtés plats. Tu les repères d'abord au toucher.
* Les pièces de **bord** (pas coins) ont exactement un côté plat.
* La pièce du **centre** n'a aucun plat: seulement languettes et encoches.

Tu ne forces jamais deux plats au milieu. Tu ne mets jamais deux languettes face à face. La languette entre dans l'encoche. Une fois une pièce posée, son bord droit doit coller au bord gauche du voisin de droite, et pareil en haut et en bas.

La rotation compte. La même pièce physique peut s'asseoir dans quatre orientations. En code, tu fais tourner le tableau des bords ou tu stockes un index d'orientation et tu maps "haut" vers le bon côté physique.

---

## 2. Énoncé clair

**But:** concevoir types et méthodes pour un jigsaw **N sur N** et un solveur qui place chaque pièce pour que tous les bords adjacents s'emboîtent.

**Formes de bord (modèle d'entretien courant):**

| Forme | Sens |
| --- | --- |
| `FLAT` | Bord droit. Sur le pourtour extérieur du puzzle fini. |
| `INNER` | Encoche / creux. Accepte un `OUTER`. |
| `OUTER` | Languette / saillie. Entre dans un `INNER`. |

Certains textes écrivent `IN` / `OUT` au lieu de `INNER` / `OUTER`. Même idée.

**Pièce:**

* Quatre bords dans l'ordre: haut, droite, bas, gauche (ou tout ordre fixe que tu tiens).
* Id optionnel pour suivre quelle pièce physique est où.
* Capacité de **tourner** de 90 degrés dans le sens horaire (ou antihoraire). Quatre orientations.

**Puzzle / plateau:**

* Grille de taille `N x N`, chaque case vide ou tenant une pièce (avec orientation).
* Réserve de pièces libres pas encore placées.
* Méthode **solve**: remplir la grille pour que chaque bord partagé s'emboîte et que les cases extérieures aient des `FLAT` sur les vrais côtés externes.

**Règle d'appariement:**

* `INNER` va avec `OUTER` et `OUTER` avec `INNER`.
* `FLAT` ne va qu'avec un autre `FLAT` si tu compares jamais des plats (la logique de bord vérifie plutôt "ce côté regarde l'extérieur, donc il doit être FLAT").
* Deux pièces qui partagent un côté doivent présenter des formes complémentaires sur les bords qui se touchent.

**À clarifier en entretien:**

* Le puzzle est-il toujours carré? (En général oui, `N x N`.)
* Solution unique supposée? (Souvent oui pour le modèle jouet.)
* Les profils de bord sont-ils assez uniques, ou beaucoup d'arêtes partagent le même type? (Le matching par type seul est plus faible; les vrais puzzles ont des courbes uniques. En entretien on reste souvent sur les trois types.)
* Peut-on retourner (miroir)? Le style CTCI classique permet souvent **rotation seulement**, pas de flip.

**Esquisse de signatures:**

```java
enum EdgeType { INNER, OUTER, FLAT }

boolean fitsWith(EdgeType a, EdgeType b); // INNER+OUTER ou OUTER+INNER

class Piece {
    void rotateClockwise();
    EdgeType edgeAt(Orientation side); // TOP, RIGHT, BOTTOM, LEFT après rotation
}

class Puzzle {
    boolean solve();
    Piece[][] getBoard();
}
```

---

## 3. Réfléchis d'abord

### Classes que tu veux presque toujours

1. **`EdgeType`** (ou `Shape`): les trois valeurs.
2. **`Orientation`**: `TOP`, `RIGHT`, `BOTTOM`, `LEFT` (et helpers de rotation).
3. **`Piece`**: quatre bords, id, rotate, bord face à une direction.
4. **`Puzzle`**: plateau, liste libre, place/retire, solve.

Certaines solutions ajoutent un objet `Edge` avec pointeur vers la pièce parente et un flag "matched". Utile si tu groupes les bords par type. Pas obligatoire pour un petit solveur.

### Où chaque pièce peut aller (filtre géométrique)

Avant d'essayer chaque pièce libre dans chaque case:

| Emplacement | Nombre de plats / règle |
| --- | --- |
| Coin (4 cases) | Exactement deux flats, sur les deux côtés externes de ce coin |
| Bord hors coin | Exactement un flat, sur le côté externe |
| Intérieur | Zéro flat |

Ça coupe fort l'espace de recherche. Tu n'essaies pas une pièce de centre dans un coin.

### Stratégies de solveur

**A. Grouper puis placer (un peu gourmand)**

1. Sépare les pièces libres en coins, bords, intérieur selon le nombre de flats.
2. Place les quatre coins (essaie les orientations qui mettent les flats dehors).
3. Remplis les cases de bord, puis l'intérieur.
4. À chaque case, essaie les candidats restants dans chaque rotation; accepte le premier qui colle aux voisins déjà placés; backtrack en cas d'échec.

**B. Backtracking pur case par case**

Parcours les cases en ordre ligne par ligne. Pour chaque case vide, essaie chaque pièce restante et chaque rotation. Vérifie l'emboîtement avec les voisins déjà remplis (gauche et haut suffisent si tu remplis de gauche à droite, de haut en bas). Récursion. Annule en cas d'échec.

Les deux passent en entretien. Grouper coin/bord/intérieur montre que tu as pensé structure. Le backtracking pur est plus simple à coder sous pression.

### Vérification d'emboîtement avec les voisins

Quand tu places la pièce `p` en `(r, c)`:

* Si `c > 0` et la case de gauche est remplie: le LEFT de `p` doit coller au RIGHT du voisin.
* Si `r > 0` et celle du haut est remplie: le TOP de `p` doit coller au BOTTOM du voisin.
* Si tu es sur le pourtour: le(s) côté(s) qui regardent dehors doivent être `FLAT`.
* Optionnel, si droite/bas déjà remplis (rare si tu remplis dans l'ordre): vérifie aussi.

```java
static boolean edgesMatch(EdgeType a, EdgeType b) {
    if (a == EdgeType.FLAT || b == EdgeType.FLAT) {
        return a == EdgeType.FLAT && b == EdgeType.FLAT; // rare au milieu
    }
    return (a == EdgeType.INNER && b == EdgeType.OUTER)
        || (a == EdgeType.OUTER && b == EdgeType.INNER);
}
```

Pour le bord, préfère un check explicite "le côté extérieur doit être FLAT" plutôt qu'un voisin fantôme aux bords plats.

### Modèle de rotation

Stocke les bords dans un tableau de longueur 4: index `0 = TOP`, `1 = RIGHT`, `2 = BOTTOM`, `3 = LEFT`.

90 degrés horaire:

```
new[0] = old[3]  // l'ancien LEFT devient TOP
new[1] = old[0]  // l'ancien TOP devient RIGHT
new[2] = old[1]
new[3] = old[2]
```

Ou garde les bords d'origine fixes et stocke `orientation` dans `0..3`, puis mappe:

```
physicalIndex = (requestedSide + orientation) % 4
```

Les deux styles marchent. Choisis-en un et utilise-le partout.

---

## 4. Solution Java

Modèle compact: pièce avec quatre types de bord, plateau, et solve récursif de gauche à droite, de haut en bas. Les pièces sont des objets uniques dans une liste libre.

```java
import java.util.ArrayList;
import java.util.List;

enum EdgeType {
    INNER, OUTER, FLAT
}

enum Side {
    TOP, RIGHT, BOTTOM, LEFT;

    int index() {
        return ordinal(); // TOP=0 ... LEFT=3
    }
}

final class Piece {
    private final int id;
    // edges[0]=TOP, [1]=RIGHT, [2]=BOTTOM, [3]=LEFT dans l'orientation courante
    private final EdgeType[] edges;

    Piece(int id, EdgeType top, EdgeType right, EdgeType bottom, EdgeType left) {
        this.id = id;
        this.edges = new EdgeType[] { top, right, bottom, left };
    }

    int getId() {
        return id;
    }

    EdgeType edge(Side side) {
        return edges[side.index()];
    }

    void rotateClockwise() {
        EdgeType top = edges[0];
        edges[0] = edges[3];
        edges[3] = edges[2];
        edges[2] = edges[1];
        edges[1] = top;
    }

    int flatCount() {
        int n = 0;
        for (EdgeType e : edges) {
            if (e == EdgeType.FLAT) {
                n++;
            }
        }
        return n;
    }
}

final class Puzzle {
    private final int n;
    private final Piece[][] board;
    private final List<Piece> free;

    Puzzle(int n, List<Piece> pieces) {
        if (pieces.size() != n * n) {
            throw new IllegalArgumentException("Need n*n pieces");
        }
        this.n = n;
        this.board = new Piece[n][n];
        this.free = new ArrayList<>(pieces);
    }

    Piece[][] getBoard() {
        return board;
    }

    static boolean complementary(EdgeType a, EdgeType b) {
        return (a == EdgeType.INNER && b == EdgeType.OUTER)
            || (a == EdgeType.OUTER && b == EdgeType.INNER);
    }

    private boolean fits(Piece p, int r, int c) {
        // Le pourtour extérieur doit être FLAT dehors
        if (r == 0 && p.edge(Side.TOP) != EdgeType.FLAT) {
            return false;
        }
        if (r == n - 1 && p.edge(Side.BOTTOM) != EdgeType.FLAT) {
            return false;
        }
        if (c == 0 && p.edge(Side.LEFT) != EdgeType.FLAT) {
            return false;
        }
        if (c == n - 1 && p.edge(Side.RIGHT) != EdgeType.FLAT) {
            return false;
        }

        // Côtés intérieurs qui regardent dedans ne doivent pas être FLAT
        if (r > 0 && p.edge(Side.TOP) == EdgeType.FLAT) {
            return false;
        }
        if (r < n - 1 && p.edge(Side.BOTTOM) == EdgeType.FLAT) {
            return false;
        }
        if (c > 0 && p.edge(Side.LEFT) == EdgeType.FLAT) {
            return false;
        }
        if (c < n - 1 && p.edge(Side.RIGHT) == EdgeType.FLAT) {
            return false;
        }

        if (c > 0) {
            Piece left = board[r][c - 1];
            if (left != null && !complementary(left.edge(Side.RIGHT), p.edge(Side.LEFT))) {
                return false;
            }
        }
        if (r > 0) {
            Piece up = board[r - 1][c];
            if (up != null && !complementary(up.edge(Side.BOTTOM), p.edge(Side.TOP))) {
                return false;
            }
        }
        return true;
    }

    boolean solve() {
        return solveCell(0, 0);
    }

    private boolean solveCell(int r, int c) {
        if (r == n) {
            return true; // toutes les lignes remplies
        }
        int nextR = (c == n - 1) ? r + 1 : r;
        int nextC = (c == n - 1) ? 0 : c + 1;

        // Snapshot de la taille de free; on retire/ajoute par index
        for (int i = 0; i < free.size(); i++) {
            Piece p = free.remove(i);
            for (int rot = 0; rot < 4; rot++) {
                if (fits(p, r, c)) {
                    board[r][c] = p;
                    if (solveCell(nextR, nextC)) {
                        return true;
                    }
                    board[r][c] = null;
                }
                p.rotateClockwise();
            }
            free.add(i, p); // restaurer au même index
        }
        return false;
    }
}
```

Petite idée de smoke 2 sur 2 (quatre pièces de coin seulement):

```java
// Chaque pièce: deux flats sur les côtés externes après la bonne rotation.
// Pièce A prévue en haut-gauche: FLAT top, OUTER right, INNER bottom, FLAT left
List<Piece> pieces = new ArrayList<>();
pieces.add(new Piece(0, EdgeType.FLAT, EdgeType.OUTER, EdgeType.INNER, EdgeType.FLAT));
pieces.add(new Piece(1, EdgeType.FLAT, EdgeType.FLAT, EdgeType.OUTER, EdgeType.INNER));
pieces.add(new Piece(2, EdgeType.OUTER, EdgeType.INNER, EdgeType.FLAT, EdgeType.FLAT));
pieces.add(new Piece(3, EdgeType.INNER, EdgeType.FLAT, EdgeType.FLAT, EdgeType.OUTER));

Puzzle puzzle = new Puzzle(2, pieces);
System.out.println(puzzle.solve()); // true si les paires s'alignent
```

Parcours d'un placement:

| Étape | Action | Vérif |
| --- | --- | --- |
| 1 | Essayer une pièce en (0,0) | TOP et LEFT doivent être FLAT; BOTTOM/RIGHT pas FLAT |
| 2 | Essayer une pièce en (0,1) | TOP et RIGHT FLAT; LEFT complète le RIGHT de (0,0) |
| 3 | Essayer une pièce en (1,0) | BOTTOM et LEFT FLAT; TOP complète le BOTTOM de (0,0) |
| 4 | Essayer une pièce en (1,1) | BOTTOM et RIGHT FLAT; colle à gauche et au-dessus |
| 5 | Plus de cases | `solve` renvoie true |

Si une case n'a aucun candidat dans aucune rotation, backtrack: vide la case, tourne ou change la pièce précédente, continue.

### Optionnel: grouper les coins d'abord

```java
List<Piece> corners = new ArrayList<>();
List<Piece> borders = new ArrayList<>();
List<Piece> interior = new ArrayList<>();
for (Piece p : all) {
    int f = p.flatCount();
    if (f == 2) {
        corners.add(p);
    } else if (f == 1) {
        borders.add(p);
    } else if (f == 0) {
        interior.add(p);
    } else {
        throw new IllegalStateException("Odd flat count: " + f);
    }
}
// Pour N=2: pas d'intérieur ni de pièces à un seul flat.
// Pour N>=3: 4 coins, 4*(N-2) de bord, (N-2)*(N-2) intérieur.
```

Utilise la bonne liste pour chaque type de case. Même `fits` et backtracking, moins de candidats.

---

## 5. Tableau de complexité

| Élément | Temps | Notes |
| --- | --- | --- |
| `rotateClockwise` | O(1) | quatre slots de bord |
| `fits` | O(1) | quelques checks de voisins |
| `solve` pire cas | O((N^2)! * 4^{N^2}) naïf | toute permutation et rotation; le pruning aide beaucoup |
| Candidats groupés | toujours exponentiel | moins d'essais par case en pratique |
| Espace | O(N^2) | plateau + liste libre |

En entretien, l'important est de nommer la recherche exponentielle et le pruning (flats du pourtour, compléments de voisins, groupes de coins), pas d'inventer un algo polynomial de jigsaw. Les apps réelles ajoutent des signatures de bord uniques pour un matching quasi déterministe.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs poussent là:

* **N = 1:** une seule pièce, les quatre côtés FLAT. Solve = "place-la si tout est flat."
* **N = 2:** seulement des coins (chacun deux flats). Pas de pure bord ni d'intérieur.
* **Mauvais flat sur l'extérieur:** peut coller à un voisin et rester illégal sur le pourtour.
* **FLAT à l'intérieur:** ne mets jamais un flat contre INNER/OUTER d'une autre pièce.
* **Oublier la rotation:** la bonne pièce échoue partout jusqu'aux quatre tours.
* **Mauvaise mutation de free:** bugs remove/add sautent des pièces ou bouclent.
* **Comparer le même bord absolu après rotate sans maj:** un seul modèle de rotation partout.

Erreurs courantes:

1. **Modéliser seulement des images**, sans types de bord. Alors tu n'écris pas `fits`.
2. **Apparier INNER avec INNER.** Les languettes n'entrent pas dans des languettes.
3. **Traiter FLAT comme complémentaire de tout.** Flat, c'est pour le pourtour.
4. **Pas de backtracking.** La première pièce qui a l'air légale en case 0 peut bloquer la 3.
5. **Autoriser les flips sans le dire.** Le miroir change le cycle des bords; dis rotation seule sauf si on demande.
6. **Ne vérifier que le voisin de gauche**, oublier celui du haut (ou les règles FLAT extérieur).

Checks minimaux à dire à voix haute:

```java
// Après solve, pour chaque paire adjacente:
// complementary(left.RIGHT, right.LEFT)
// complementary(up.BOTTOM, down.TOP)
// Pour chaque côté extérieur d'une case du bord: edge == FLAT
```

---

## 7. Récap pour un ami

Jigsaw, c'est OOD d'abord, recherche ensuite:

1. Chaque pièce a quatre bords: `INNER`, `OUTER` ou `FLAT`.
2. `INNER` se verrouille avec `OUTER`. Les côtés du pourtour extérieur doivent être `FLAT`.
3. Tourne une pièce en cyclant ses quatre bords (quatre orientations).
4. Le plateau est `N x N`. Coins à deux flats, bord à un, intérieur à zéro.
5. Solveur: pour chaque case vide, essaie pièces libres et rotations; check pourtour + gauche + haut; récursion; annule si échec.
6. Grouper coin/bord/intérieur réduit la liste d'essais, mais c'est optionnel.

Si tu dessines quatre bords sur un carré, expliques languette contre encoche et fais un pas de backtracking sur un 2 sur 2, tu maîtrises le 7.6. Le design est le produit; le solveur prouve que le design tient.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Online Book Reader](/blog/fr/ctci-7-5-online-book-reader)
* Suivant: [Chat Server](/blog/fr/ctci-7-7-chat-server)