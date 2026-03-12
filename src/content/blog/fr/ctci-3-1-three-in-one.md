---
title: "Three in One: trois piles dans un seul tableau (Java)"
description: "Problème style CTCI 3.1 pour débutants: implémenter trois piles avec un seul tableau. Tranches fixes égales, tableau sizes[], et un FixedMultiStack clair en Java."
date: "2026-03-12"
tags: [Algorithmes]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 3.1 pour débutants: implémenter trois piles avec un seul tableau. Tranches fixes égales, tableau sizes[], et un FixedMultiStack clair en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as une longue étagère et trois colocataires. Chacun reçoit une tranche fixe pour sa propre pile de livres. Tu ne mets jamais les livres de A dans la tranche de B. Quand une tranche est pleine, cette personne est bloquée même si les autres ont encore de la place. C'est **trois piles dans un tableau** avec division fixe.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien multi-piles, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 3 (piles et files) commence ici.

---

## 1. Analogie du quotidien

Imagine une bande de stationnement avec **trois zones égales** peintes sur l'asphalte:

* La zone 0 accueille les voitures de la pile 0.
* La zone 1 accueille les voitures de la pile 1.
* La zone 2 accueille les voitures de la pile 2.

Chaque zone se remplit depuis son bord gauche vers la droite. Un compteur de **taille** par zone indique combien de voitures sont déjà garées. Tu n'as pas besoin d'un pointeur de sommet séparé si tu stockes les tailles: le sommet de la pile `k` est dans la dernière case occupée de cette zone.

Si la zone 0 est pleine, tu refuses la voiture suivante pour la pile 0. Les places vides de la zone 2 n'aident pas. C'est le compromis de la division fixe: maths simples, espace gâché quand la charge est inégale.

Il existe une version plus dure où les murs de zone peuvent glisser (division flexible). On la mentionne brièvement. La valeur par défaut en entretien pour débutants, ce sont des parts fixes égales.

---

## 2. Problème en mots simples

**Entrée / objectif:** Concevoir une structure qui implémente **trois piles** avec **un seul** tableau sous-jacent.

**Opérations** (chacune prend un numéro de pile `0`, `1` ou `2`):

* `push(stackNum, value)`: empiler sur cette pile
* `pop(stackNum)`: retirer et renvoyer le sommet
* `peek(stackNum)`: renvoyer le sommet sans le retirer
* `isEmpty(stackNum)` / `isFull(stackNum)`: contrôles de capacité

**Approche principale de ce billet:** division fixe. Coupe le tableau en trois blocs contigus égaux de capacité `stackCapacity`. Suis le remplissage de chaque bloc avec `sizes[3]`.

**À clarifier avant de coder:**

* Les indices de pile sont `0`, `1`, `2` (base zéro).
* La longueur totale du tableau est `3 * stackCapacity`.
* Que faire au push si plein? Lever une exception (ou renvoyer une erreur). Même idée au pop si vide.
* Les piles sont-elles indépendantes? Oui. Un push sur la pile 0 ne doit pas corrompre la pile 1.

**Schéma pour `stackCapacity = 4` (tableau de longueur 12):**

| Indices | Pile | Signification |
| --- | --- | --- |
| `0..3` | 0 | première tranche |
| `4..7` | 1 | deuxième tranche |
| `8..11` | 2 | troisième tranche |

Si la pile 1 a actuellement une taille 2, ses valeurs sont aux indices `4` et `5`, et le sommet est à l'indice `5`.

---

## 3. Réfléchir d'abord (fixe vs flexible)

### Division fixe (enseigne ça en premier)

1. Alloue `values = new int[stackCapacity * 3]`.
2. Garde `sizes = new int[3]`, tous à zéro au départ.
3. L'**offset** de la pile `stackNum` est `stackNum * stackCapacity`.
4. L'**indice du sommet** après un push réussi (ou pour peek/pop) est `offset + sizes[stackNum] - 1`.
5. Push: si plein, échec. Sinon incrémente la taille, écris à l'indice du nouveau sommet.
6. Pop: si vide, échec. Sinon lis le sommet, efface la case (optionnel), décrémente la taille.
7. Peek: si vide, échec. Sinon renvoie `values[indexOfTop]`.

Pourquoi des tailles plutôt que trois pointeurs de sommet? C'est équivalent. La taille est le nombre d'éléments vivants; l'indice du sommet est une fonction de l'offset et de la taille. Un petit tableau de trois ints se raisonne bien en entretien.

### Division flexible / dynamique (idée optionnelle plus dure)

Si une pile chauffe et qu'une autre reste vide, les tranches fixes gaspillent des cases. Un design flexible laisse les piles s'étendre dans l'espace libre: tu suis des bornes start/end par pile, et tu peux décaler des éléments quand un voisin a besoin de place. Correct, mais plus de code (bornes, décalages, détection de tableau plein sur toutes les piles). Mentionne-le si l'interviewer demande "peut-on mieux utiliser l'espace?" Propose le fixe d'abord, sauf s'ils veulent la version dure.

Pour cet article, livre le **fixe**.

### Maths d'indices à mémoriser

```
offset(stackNum)     = stackNum * stackCapacity
indexOfTop(stackNum) = offset + sizes[stackNum] - 1
isEmpty              = sizes[stackNum] == 0
isFull               = sizes[stackNum] == stackCapacity
```

Dessine une rangée de douze cases au tableau et parcours un push/pop sur la pile 1. Si les indices collent, la classe s'écrit presque toute seule.

---

## 4. Solution Java

```java
/**
 * Three stacks packed into one array with fixed equal slices.
 * stackNum is 0, 1, or 2.
 */
class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    FixedMultiStack(int stackCapacity) {
        if (stackCapacity <= 0) {
            throw new IllegalArgumentException("stackCapacity must be positive");
        }
        this.stackCapacity = stackCapacity;
        this.values = new int[stackCapacity * numberOfStacks];
        this.sizes = new int[numberOfStacks]; // all 0
    }

    void push(int stackNum, int value) {
        assertValidStack(stackNum);
        if (isFull(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is full");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    int pop(int stackNum) {
        assertValidStack(stackNum);
        if (isEmpty(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is empty");
        }
        int top = indexOfTop(stackNum);
        int value = values[top];
        values[top] = 0; // optional clear; helps debugging
        sizes[stackNum]--;
        return value;
    }

    int peek(int stackNum) {
        assertValidStack(stackNum);
        if (isEmpty(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is empty");
        }
        return values[indexOfTop(stackNum)];
    }

    boolean isEmpty(int stackNum) {
        assertValidStack(stackNum);
        return sizes[stackNum] == 0;
    }

    boolean isFull(int stackNum) {
        assertValidStack(stackNum);
        return sizes[stackNum] == stackCapacity;
    }

    /** Absolute index of the current top element for this stack. */
    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        return offset + sizes[stackNum] - 1;
    }

    private void assertValidStack(int stackNum) {
        if (stackNum < 0 || stackNum >= numberOfStacks) {
            throw new IllegalArgumentException("stackNum must be 0, 1, or 2");
        }
    }
}
```

Parcours avec `stackCapacity = 3` (tableau de longueur 9):

| Étape | Appel | sizes | Écriture / lecture au sommet |
| --- | --- | --- | --- |
| départ | (vide) | `[0,0,0]` | - |
| 1 | `push(0, 10)` | `[1,0,0]` | écrit `values[0] = 10` |
| 2 | `push(0, 20)` | `[2,0,0]` | écrit `values[1] = 20` |
| 3 | `push(1, 99)` | `[2,1,0]` | écrit `values[3] = 99` |
| 4 | `peek(0)` | inchangé | lit `20` à l'indice `1` |
| 5 | `pop(0)` | `[1,1,0]` | renvoie `20`, efface l'indice `1` |
| 6 | `push(0, 30)` | `[2,1,0]` | écrit `values[1] = 30` |

La pile 0 ne touche jamais les indices `3..8`. La pile 1 ne touche jamais `0..2` ni `6..8`.

---

## 5. Tableau de complexité

| Opération | Temps | Espace extra hors tableau partagé | Notes |
| --- | --- | --- | --- |
| `push` / `pop` / `peek` | O(1) | O(1) | seulement arithmétique + accès tableau |
| `isEmpty` / `isFull` | O(1) | O(1) | lit une entrée de `sizes` |
| Construction | O(N) | O(1) hors le tableau | `N = 3 * stackCapacity` à l'allocation |
| Multi-pile fixe au global | - | O(N) pour values + O(1) pour sizes (3 ints) | cases perdues si la charge est inégale |
| Multi-pile flexible (idée) | push peut être O(N) si décalage | plus de comptabilité | meilleur usage de l'espace, code plus dur |

Les interviewers veulent surtout des ops en temps constant et une math d'indices correcte. Le décalage flexible est un suivi, pas la première solution.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent ceux-ci:

* **`stackCapacity = 1`:** chaque pile tient une valeur. Un second push sur la même pile doit échouer.
* **Pop / peek sur vide:** lever (ou renvoyer un sentinelle si convenu). Ne lis jamais `indexOfTop` quand la taille est 0; cet indice serait `offset - 1`, faux et peut croiser une autre pile.
* **Push sur plein:** lever. Ne pas écraser en silence.
* **`stackNum` invalide:** refuse hors de `{0,1,2}`.
* **Indépendance:** remplir la pile 2 doit laisser la pile 0 vide et utilisable.
* **Capacité nulle ou négative:** refuse dans le constructeur.
* **Pop puis push à nouveau:** la taille descend puis remonte; le même indice est réutilisé. C'est le comportement correct d'une pile.

Erreurs fréquentes:

1. **Utiliser `offset + size` comme sommet sans soustraire 1.** Quand size devient 1, le sommet est à `offset + 0`, pas `offset + 1`.
2. **Incrémenter size après avoir écrit avec l'ancienne size.** L'ordre compte: soit tu incréments d'abord puis tu écris à `indexOfTop`, soit tu écris à `offset + size` puis tu incréments. Choisis l'un et reste cohérent. Le code ci-dessus incrémente d'abord.
3. **Partager un seul pointeur de sommet pour les trois piles.** C'est une pile, pas trois.
4. **Oublier `isFull` avant le push.** Tu piétineras la tranche suivante.
5. **Laisser la pile 0 grandir au-delà de sa tranche vers la pile 1.** La division fixe l'interdit; applique la capacité par pile.

Esquisse minimale de smoke test:

```java
void demo() {
    FixedMultiStack stacks = new FixedMultiStack(2);
    stacks.push(0, 1);
    stacks.push(0, 2);
    // stacks.push(0, 3); // would throw: full
    stacks.push(2, 9);
    assert stacks.pop(0) == 2;
    assert stacks.peek(0) == 1;
    assert stacks.pop(2) == 9;
    assert stacks.isEmpty(1);
}
```

---

## 7. Récap à raconter à un ami

Three in One demande: peux-tu empaqueter trois piles indépendantes dans un seul tableau?

1. Coupe le tableau en trois tranches égales de longueur `stackCapacity`.
2. Garde `sizes[3]`. Le sommet de la pile `k` vit à `k * stackCapacity + sizes[k] - 1`.
3. Push seulement si pas plein: monte la size, écris au sommet. Pop seulement si pas vide: lis le sommet, efface, baisse la size.
4. Toutes les ops sont O(1). Le coût est l'espace gâché quand une pile chauffe et une autre dort.
5. Des murs flexibles qui volent des cases libres sont un suivi plus dur. Commence par des tranches fixes sauf demande contraire.

Si tu peux dessiner les trois tranches, citer la formule d'indice du sommet, et refuser les push pleins sans interférence entre piles, tu maîtrises le problème 3.1.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Loop Detection](/blog/fr/ctci-2-8-loop-detection)
* Suivant: [Stack Min](/blog/fr/ctci-3-2-stack-min)