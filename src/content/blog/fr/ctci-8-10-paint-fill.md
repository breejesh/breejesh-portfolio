---
title: "Paint Fill: remplir une region de couleur avec DFS ou BFS (Java)"
description: "Probleme style CTCI 8.10 pour debutants: seau de peinture sur un ecran 2D de couleurs. Remplace une region connexe par une nouvelle couleur avec DFS recursif ou BFS iteratif en Java."
date: "2025-12-26"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-10-paint-fill.webp
previewImage: /assets/images/ctci-8-10-paint-fill.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Probleme style CTCI 8.10 pour debutants: seau de peinture sur un ecran 2D de couleurs. Remplace une region connexe par une nouvelle couleur avec DFS recursif ou BFS iteratif en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Les editeurs d'images ont un outil **seau de peinture**. Tu cliques un pixel, choisis une nouvelle couleur, et tout le bloc connexe de l'ancienne couleur bascule. L'ecran est un tableau 2D de valeurs de couleur. Le clic est une ligne et une colonne. Le travail: recolorier chaque pixel joignable en marchant haut, bas, gauche et droite sans quitter la couleur d'origine.

Ce billet est un enseignement original pour debutants en **Java**. Meme famille que les questions classiques de flood fill en entretien, pas une copie de livre. Fait partie de la [serie CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, recursion et DP: recherche de graphe sur une grille, pas une table de memo cette fois.

---

## 1. Analogie du quotidien

Imagine un sol carrele peint par grandes taches de couleur. Tu te tiens sur un carreau bleu et tu veux peindre en rouge chaque carreau bleu atteignable a pied (en partageant un cote, pas seulement un coin).

* Pars du carreau clique. Souviens-toi qu'il etait bleu.
* Peins-le en rouge.
* Regarde les quatre voisins: nord, sud, est, ouest.
* Pour chaque voisin encore bleu, va y et fais pareil.
* Arrete-toi quand un voisin est hors limites, deja rouge, ou n'a jamais ete bleu (mur, tache verte, autre).

Tu ne sautes pas en diagonale sauf si l'interviewer demande une connectivite a huit. Tu ne repeins pas des carreaux qui n'avaient pas la couleur d'origine. C'est le flood fill: une region connexe grandit jusqu'a la frontiere de couleur.

Si le clic est deja la nouvelle couleur, ne fais rien. Peindre du bleu en bleu a l'infini est un vrai bug (recursion infinie ou BFS qui tourne sans fin).

---

## 2. Enonce en mots simples

**Entree:**

* `screen`: tableau 2D de couleurs (ints, enums ou chars; en entretien souvent `int[][]` ou `Color[][]`)
* `r`, `c`: coordonnees du clic
* `newColor`: couleur de remplissage

**Sortie:** le meme ecran, avec la region connexe de la couleur d'origine en `(r, c)` remplacee par `newColor`. Mutation in place ou retour du tableau; dis lequel.

**Connectivite (defaut pour ce probleme):** quatre directions, voisins par arete seulement:

```
(-1, 0), (1, 0), (0, -1), (0, 1)
```

**Forme de la signature:**

```java
void paintFill(int[][] screen, int r, int c, int newColor);
// ou avec un enum / type Color
boolean paintFill(Color[][] screen, int r, int c, Color newColor);
```

Retourner un `boolean` (avons-nous rempli?) est un polish optionnel de certains schemas de manuel. Muter en void suffit.

**A clarifier en entretien:**

* Voisins a quatre ou a huit?
* Regles de bornes et ecran vide?
* Que faire si `(r, c)` est hors limites?
* Clic meme couleur: no-op?
* Couleurs null possibles (si type objet)?
* Muter l'entree ou copier?

**Petit exemple:**

```
Avant (clic sur (1,1), nouvelle couleur = 9):

  1 1 1 2
  1 1 0 2
  1 0 1 2

Apres (remplissage 4-connexe de la region de 1 en haut a gauche):

  9 9 9 2
  9 9 0 2
  9 0 1 2
```

Le `1` isole du bas centre reste. Il ne partage qu'un coin avec la region remplie, pas une arete.

---

## 3. Reflechir d'abord

### C'est une recherche de graphe

Chaque cellule est un noeud. Une arete existe vers un voisin s'il est dans les bornes et a encore la couleur **d'origine**. Flood fill: "visiter chaque noeud de la composante connexe de la cellule de depart, et recolorier."

DFS (recursion ou pile explicite) et BFS (file) marchent tous les deux. Les interviewers acceptent l'un ou l'autre. Dis le cadre graphe a voix haute; ca montre que tu ne repetes pas seulement l'histoire du seau.

### Capture d'abord la couleur d'origine

```
oldColor = screen[r][c]
if oldColor == newColor: return
// puis inonde seulement les cellules egales a oldColor
```

Si tu recolories le depart avant de lire `oldColor`, tu perds la cible. Si tu sautes la sortie precoce quand les couleurs coincident, le DFS reentre des cellules que tu viens de peindre avec `newColor` quand `newColor` est ce que tu testes... en realite tu testes `oldColor`, donc si `oldColor == newColor` chaque cellule recoloriee "matche" encore et tu recurses sans fin. Protege ce cas.

### Schema DFS recursif

```
function fill(r, c):
  if out of bounds: return
  if screen[r][c] != oldColor: return
  screen[r][c] = newColor
  fill(r-1, c); fill(r+1, c); fill(r, c-1); fill(r, c+1)
```

Entree:

```
oldColor = screen[r][c]
if oldColor == newColor: return
fill(r, c)
```

### Schema BFS iteratif

```
queue.push(start)
screen[start] = newColor
while queue not empty:
  cell = queue.pop
  for each neighbor:
    if in bounds and screen[neighbor] == oldColor:
      screen[neighbor] = newColor
      queue.push(neighbor)
```

Peins a l'enfilement (ou marque visite) pour ne jamais enfiler deux fois la meme cellule. Sur une grille, quitter `oldColor` est la marque de visite. Pas besoin d'un `boolean[][]` separe.

### DFS vs BFS en entretien

| | DFS recursif | BFS iteratif |
| --- | --- | --- |
| Longueur de code | Court | Un peu plus (file + dirs) |
| Risque de pile | Une longue region en serpent peut faire exploser la pile d'appels | File sur le tas; plus sur pour de grands ecrans |
| Ordre | Profondeur d'abord | Par niveaux; meme resultat final |

Pour des tailles d'entretien, l'un ou l'autre convient. Mentionne la profondeur de pile du DFS sur un ecran `N x M` monochrome: pire profondeur environ `N*M`.

### Pourquoi c'est dans "Recursion and DP"

L'ecriture naturelle est recursive. Pas de table de memo fancy. Les "sous-problemes" sont les voisins. Toujours aligne au chapitre: recursion sur grille, meme famille que chemins de robot et inondation de labyrinthe.

### Esquisse au tableau

1. Dessine une grille 3x4 avec une tache de couleur `1` et d'autres couleurs.
2. Marque le clic. Ecris `old = 1`, `new = 9`.
3. Recolorie le depart, puis suis les quatre directions.
4. Montre une cellule qui arrete le flux (autre couleur ou borne).
5. Note la sortie precoce si `old == new`.

---

## 4. Solution Java

### Aides partagees

```java
static final int[][] DIRS = {
    {-1, 0}, {1, 0}, {0, -1}, {0, 1}
};

static boolean inBounds(int[][] screen, int r, int c) {
    return r >= 0 && r < screen.length
        && c >= 0 && c < screen[0].length;
}
```

Le code pedagogique suppose un ecran rectangulaire non vide. Protege les tableaux vides en production.

### DFS recursif

```java
/**
 * Paint-bucket fill: recolor the 4-connected region of screen[r][c].
 * Mutates screen in place.
 */
void paintFillDfs(int[][] screen, int r, int c, int newColor) {
    if (screen == null || screen.length == 0 || screen[0].length == 0) {
        return;
    }
    if (!inBounds(screen, r, c)) {
        return;
    }
    int oldColor = screen[r][c];
    if (oldColor == newColor) {
        return;
    }
    fill(screen, r, c, oldColor, newColor);
}

void fill(int[][] screen, int r, int c, int oldColor, int newColor) {
    if (!inBounds(screen, r, c)) {
        return;
    }
    if (screen[r][c] != oldColor) {
        return;
    }
    screen[r][c] = newColor;
    for (int[] d : DIRS) {
        fill(screen, r + d[0], c + d[1], oldColor, newColor);
    }
}
```

### BFS iteratif

```java
void paintFillBfs(int[][] screen, int r, int c, int newColor) {
    if (screen == null || screen.length == 0 || screen[0].length == 0) {
        return;
    }
    if (!inBounds(screen, r, c)) {
        return;
    }
    int oldColor = screen[r][c];
    if (oldColor == newColor) {
        return;
    }

    java.util.ArrayDeque<int[]> q = new java.util.ArrayDeque<>();
    screen[r][c] = newColor;
    q.add(new int[] {r, c});

    while (!q.isEmpty()) {
        int[] cell = q.removeFirst();
        int cr = cell[0];
        int cc = cell[1];
        for (int[] d : DIRS) {
            int nr = cr + d[0];
            int nc = cc + d[1];
            if (inBounds(screen, nr, nc) && screen[nr][nc] == oldColor) {
                screen[nr][nc] = newColor;
                q.add(new int[] {nr, nc});
            }
        }
    }
}
```

`ArrayDeque` en file est clair et assez rapide. Une file chainee manuelle va bien au tableau.

### Style optionnel avec enum Color

Certains schemas utilisent un enum pour coller a des "vrais" pixels:

```java
enum Color { RED, GREEN, BLUE, YELLOW }

boolean paintFill(Color[][] screen, int r, int c, Color newColor) {
    if (screen == null || screen.length == 0) {
        return false;
    }
    if (!inBoundsColor(screen, r, c)) {
        return false;
    }
    Color oldColor = screen[r][c];
    if (oldColor == newColor) {
        return false;
    }
    fillColor(screen, r, c, oldColor, newColor);
    return true;
}

void fillColor(Color[][] screen, int r, int c, Color oldColor, Color newColor) {
    if (!inBoundsColor(screen, r, c)) {
        return;
    }
    if (screen[r][c] != oldColor) {
        return;
    }
    screen[r][c] = newColor;
    fillColor(screen, r - 1, c, oldColor, newColor);
    fillColor(screen, r + 1, c, oldColor, newColor);
    fillColor(screen, r, c - 1, oldColor, newColor);
    fillColor(screen, r, c + 1, oldColor, newColor);
}

boolean inBoundsColor(Color[][] screen, int r, int c) {
    return r >= 0 && r < screen.length
        && c >= 0 && c < screen[0].length;
}
```

Meme algorithme. Les enums se lisent bien quand tu parles de "couleurs" plutot que d'ints magiques.

### Controles minimaux

```java
int[][] g = {
    {1, 1, 1, 2},
    {1, 1, 0, 2},
    {1, 0, 1, 2}
};
paintFillDfs(g, 1, 1, 9);
assert g[0][0] == 9 && g[0][1] == 9 && g[0][2] == 9;
assert g[1][0] == 9 && g[1][1] == 9;
assert g[2][0] == 9;
assert g[1][2] == 0; // not part of the 1-region via edges
assert g[2][1] == 0;
assert g[2][2] == 1; // diagonal only; four-way leaves it
assert g[0][3] == 2;

int[][] same = {{3, 3}, {3, 3}};
paintFillBfs(same, 0, 0, 3); // no-op, must not hang
assert same[1][1] == 3;

int[][] one = {{5}};
paintFillBfs(one, 0, 0, 7);
assert one[0][0] == 7;
```

---

## 5. Tableau de complexite

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| DFS recursif | O(R * C) | O(R * C) pile d'appels au pire | Visite chaque cellule de la region une fois; pire region = tout l'ecran |
| BFS iteratif | O(R * C) | O(R * C) file au pire | Meme borne de visite; pas de risque de pile JVM |
| Variante a huit | O(R * C) | identique | Plus d'aretes par cellule; toujours lineaire en cellules |

Tu n'as jamais besoin de plus qu'un travail constant par cellule. Ne revendique pas O(1) d'espace pour un DFS recursif sur de grands remplissages; la pile est reelle.

---

## 6. Cas limites et erreurs frequentes

Les interviewers touchent ces points:

* **Couleur du clic deja egale a la nouvelle:** return immediat. Sinon recursion / file infinies.
* **Clic hors limites:** return; ne lance pas d'exception sauf si l'API le promet.
* **Ecran 1x1:** une seule affectation si les couleurs different.
* **Tout l'ecran une seule couleur:** chaque cellule bascule; la profondeur DFS peut etre enorme.
* **Region qui touche les bords:** tests de bornes sur chaque voisin, pas seulement le depart.
* **Lignes irregulieres:** le code pedagogique suppose un rectangle; dis-le si les lignes peuvent differer.
* **Huit vs quatre directions:** une fuite diagonale change la reponse (voir cellule `(2,2)` de l'exemple).
* **Recolorier avant de sauver `oldColor`:** tu ne sais plus quoi egaler.

Erreurs courantes:

1. **Oublier le garde `oldColor == newColor`.**
2. **Tester `!= newColor` au lieu de `== oldColor`** a l'expansion (grimperait dans toute cellule non nouvelle).
3. **Manquer une direction** dans la liste a quatre.
4. **Utiliser huit directions par accident.**
5. **Enfiler sans recolorier** (BFS revisite sans fin) ou recolorier sans marque de visite.
6. **Bornes off-by-one** (`<= length` au lieu de `< length`).
7. **Supposer un ecran carre** quand seule `screen[0].length` sert de largeur (OK si rectangulaire; enonce l'hypothese).

---

## 7. Resume a raconter a un ami

Paint fill en une longue respiration:

1. L'ecran est une grille de couleurs. Clic sur une cellule et une nouvelle couleur.
2. Garde `oldColor`. Si deja egal a `newColor`, arrete.
3. Recolorie chaque cellule atteignable par des pas haut/bas/gauche/droite qui restent sur `oldColor`.
4. DFS recursif ou file BFS: meme image finale.
5. Recolorie (ou marque visite) a l'entree d'une cellule pour ne jamais la traiter deux fois.
6. Temps et espace lineaires dans la taille de la region remplie (pire cas: toute la grille).

Si tu peux parcourir l'exemple 3x4 a la main, ecrire le garde de sortie precoce et expliquer pourquoi le quatre-connexe laisse seule une cellule diagonale, tu maitrises le probleme 8.10. La suite du chapitre est le comptage style pieces de monnaie avec DP.

---

## Serie

* Guide: [Guide de la serie CTCI](/blog/fr/ctci-series-guide)
* Precedent: [Parens](/blog/fr/ctci-8-9-parens)
* Suivant: [Coins](/blog/fr/ctci-8-11-coins)