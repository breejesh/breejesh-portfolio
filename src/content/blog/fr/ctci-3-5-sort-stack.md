---
title: "Sort Stack: trier une pile avec une pile temporaire (Java)"
description: "Problème style CTCI 3.5 pour débutants: trier une pile pour que les plus petites valeurs soient au sommet. Une seule pile extra. Raisonnement insertion sort en Java clair."
date: "2025-11-28"
tags: [Algorithmes]
coverImage: /assets/images/ctci-3-5-sort-stack.webp
previewImage: /assets/images/ctci-3-5-sort-stack.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 3.5 pour débutants: trier une pile pour que les plus petites valeurs soient au sommet. Une seule pile extra. Raisonnement insertion sort en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as une pile d'assiettes en désordre. Tu ne peux soulever que l'assiette du dessus, et on te laisse une seule table d'appoint vide. Tu veux l'assiette la plus légère au sommet à la fin (la plus petite valeur en haut). Tu ne peux pas les aligner par terre. Pas de troisième pile. Cette contrainte, c'est tout l'énigme de **sort stack**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien sur le tri par piles, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 3, piles et files.

---

## 1. Analogie du quotidien

Imagine deux piles de cartes numérotées:

* **Pile source `s`**: le tas désordonné que tu dois laisser trié (tu recharges `s` avec la réponse à la fin).
* **Pile temporaire `r`**: ta seule table d'appoint. Elle tient des cartes déjà dans un ordre trié qui grandit.
* Tu n'as droit qu'à push, pop et peek sur le sommet. Pas de tableaux, pas de listes, pas de maps.

Le truc ressemble à **insertion sort**. Tu tires une carte de `s`. Tu gares sur `s` les cartes plus grandes de `r` jusqu'à ce qu'elle tienne. Tu la poses sur `r`. Tu répètes. Quand `s` est vide, tu verses `r` sur `s` pour obtenir l'ordre voulu.

---

## 2. Problème en mots simples

**Entrée:** une pile d'entiers (ou de valeurs comparables). Le sommet est ce que renvoie `pop`.

**Sortie:** la même pile, triée pour que les valeurs **les plus petites** soient **au sommet**. Les grandes descendent vers le fond.

**Règles:**

* Tu peux utiliser **une** pile temporaire supplémentaire.
* Tu ne peux pas utiliser de tableaux, listes chaînées, arbres ou autres collections comme buffer.
* Tu peux utiliser des constantes et quelques variables locales (la valeur que tu tiens en main).

**Exemples** (la valeur la plus à droite est le sommet):

| Avant (fond → sommet) | Après (fond → sommet) | Sommet final |
| --- | --- | --- |
| `3, 1, 4, 2` | `4, 3, 2, 1` | 1 |
| `5` | `5` | 5 |
| vide | vide | n/a |
| `2, 2, 1` | `2, 2, 1` | 1 |
| `1, 2, 3` (sommet 3) | `3, 2, 1` | 1 |

Si fond→sommet est `1, 2, 3`, le sommet est 3 (le plus grand). Après tri, fond→sommet est `3, 2, 1` donc le sommet est 1 (le plus petit).

**À clarifier avant de coder:**

* Plus petit au sommet, ou plus grand? (Ici: **plus petit au sommet**.)
* Doublons autorisés? (Oui. Pas d'exigence de stabilité entre égaux.)
* Récursion? La récursion est une pile implicite. On veut souvent la version itérative avec une pile temporaire explicite.
* Muter la pile donnée ou en renvoyer une autre? Muter en remplissant `s` à la fin.

---

## 3. Réfléchir d'abord (insertion sort avec pile temporaire)

### Ce que tu ne peux pas faire

Tout vider dans un tableau, appeler `Arrays.sort`, réempiler. Ça casse la règle "pas d'autres structures".

### Idée d'insertion

Garde la pile temporaire `r` triée avec le **plus grand au sommet** (et le plus petit au fond de `r`). Ensuite:

1. Dépile `tmp` de `s`.
2. Tant que `r` n'est pas vide et `r.peek() > tmp`, dépile de `r` et repousse ces valeurs sur `s`. Elles sont trop grandes pour rester sous `tmp` sur `r`.
3. Pousse `tmp` sur `r`. `r` a encore le plus grand au sommet parmi son contenu actuel.
4. Répète jusqu'à ce que `s` soit vide.
5. Vide `r` sur `s`. Chaque pop met le suivant plus grand sur `s`, donc à la fin le **plus petit est au sommet de `s`**.

Pourquoi regarer les grandes valeurs sur `s`? Parce que tu n'as qu'une pile temporaire. La pile source est le seul parking légal. Ces valeurs seront réinsérées plus tard, comme insertion sort revisite des éléments.

### Parcours: fond → sommet `3, 1, 4, 2` (sommet = 2)

| Étape | `tmp` | Action | `s` (fond → sommet) | `r` (fond → sommet) |
| --- | --- | --- | --- | --- |
| début | | | `3, 1, 4, 2` | vide |
| 1 | 2 | `r` vide, push 2 | `3, 1, 4` | `2` |
| 2 | 4 | `2 > 4`? non, push 4 | `3, 1` | `2, 4` |
| 3 | 1 | `4 > 1`, gare 4 sur `s`; `2 > 1`, gare 2 sur `s`; push 1 | `3, 4, 2` | `1` |
| 4 | 2 | `1 > 2`? non, push 2 | `3, 4` | `1, 2` |
| 5 | 4 | `2 > 4`? non, push 4 | `3` | `1, 2, 4` |
| 6 | 3 | `4 > 3`, gare 4 sur `s`; `2 > 3`? non, push 3 | `4` | `1, 2, 3` |
| 7 | 4 | `3 > 4`? non, push 4 | vide | `1, 2, 3, 4` |
| copie | | verse `r` → `s` | `4, 3, 2, 1` | vide |

Sommet de `s` = 1. Terminé.

---

## 4. Solution Java

Utilise `java.util.Stack` pour l'enseignement, ou tout type LIFO avec `push`, `pop`, `peek`, `isEmpty`.

```java
import java.util.Stack;

/**
 * Sorts stack so smallest values end on top.
 * Uses one temporary stack. Insertion-sort style moves.
 */
void sortStack(Stack<Integer> s) {
    Stack<Integer> r = new Stack<Integer>();

    while (!s.isEmpty()) {
        int tmp = s.pop();

        // Park larger values back onto s so tmp can sit on r.
        while (!r.isEmpty() && r.peek() > tmp) {
            s.push(r.pop());
        }
        r.push(tmp);
    }

    // r has largest on top. Reverse onto s so smallest ends on top.
    while (!r.isEmpty()) {
        s.push(r.pop());
    }
}
```

Si l'énoncé demande le **plus grand au sommet**, inverse la comparaison en `r.peek() < tmp` et revois la copie finale, ou trie pour plus petit au sommet puis inverse avec les deux mêmes piles. Confirme l'ordre à voix haute avant de coder.

Petit pilote:

```java
Stack<Integer> s = new Stack<Integer>();
s.push(3);
s.push(1);
s.push(4);
s.push(2); // top is 2
sortStack(s);
// pop order: 1, 2, 3, 4
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Pile temporaire (style insertion) | O(N²) pire cas | O(N) pour la pile temporaire | Chacune des N valeurs peut aller et venir souvent |
| Déjà presque trié (chance) | proche de O(N) | O(N) | Peu de garages si l'ordre aide |
| Tableau + sort (interdit ici) | O(N log N) | O(N) | Casse la règle d'une seule pile extra |

N est le nombre d'éléments. Le pire cas ressemble à une entrée "à l'envers" avec beaucoup de garages. L'espace extra est la deuxième pile jusqu'à N éléments, plus O(1) locaux. Avec seulement du LIFO, tu ne descends pas sous O(N) d'espace auxiliaire si tu dois tout réordonner.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent ceci:

* **Pile vide** → les deux boucles ne font rien. OK.
* **Un seul élément** → pop vers `r`, push vers `s`. Correct.
* **Tous égaux** → `r.peek() > tmp` n'est jamais vrai avec un `>` strict. Les doublons restent. Bien.
* **Déjà le plus petit au sommet** → on peut quand même repasser par `r`. La correction d'abord; la sortie anticipée est optionnelle.
* **Sommets strictement décroissants** → beaucoup de garages. Toujours O(N²) et correct.
* **Négatifs et zéros** → la comparaison marche pareil avec `Integer`.

Erreurs fréquentes:

1. **Mauvaise comparaison.** `r.peek() < tmp` construit l'ordre inverse sur `r`. Tu finis avec le plus grand au sommet de `s` après la copie, ou un chaos si tu mélanges les conditions.
2. **Oublier le versement final.** Laisser la réponse sur `r` échoue si l'appelant regarde encore `s`.
3. **Un autre type de buffer.** Un `ArrayList` comme parking viole l'énoncé même si le code "marche".
4. **Comparer après un pop sans peek.** Fais peek (ou garde la valeur) avant de décider de déplacer de `r` vers `s`.
5. **Boucle infinie.** Si tu repousses `tmp` sur `s` par erreur dans la boucle externe sans progrès, tu tournes. Garde `tmp` en local jusqu'à ce qu'il atterrisse sur `r`.

Entrée sûre si l'API accepte une pile nulle:

```java
void sortStackSafe(Stack<Integer> s) {
    if (s == null) {
        return;
    }
    sortStack(s);
}
```

---

## 7. Récap à raconter à un ami

Sort stack demande: réordonne une pile pour que les plus petites valeurs soient au sommet, avec une seule pile extra.

1. Tiens une pile temporaire `r`. Fais-la grandir avec le **plus grand au sommet de `r`**.
2. Dépile une valeur `tmp` de la pile d'entrée.
3. Tant que le sommet de `r` est plus grand que `tmp`, gare ces grandes valeurs sur la pile d'entrée.
4. Pousse `tmp` sur `r`. Répète jusqu'à vider l'entrée.
5. Verse `r` sur la pile d'entrée. L'inversion laisse le **plus petit au sommet**.

C'est insertion sort déguisé en pile. Temps O(N²), espace extra O(N) pour la pile d'aide. Vide, un élément et doublons sortent des mêmes boucles.

Si tu peux le dire en trente secondes, croquer le mouvement garage-et-insertion, et ne pas "tricher" avec un tableau, tu maîtrises le problème 3.5.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Queue via Stacks](/blog/fr/ctci-3-4-queue-via-stacks)
* Suivant: [Animal Shelter](/blog/fr/ctci-3-6-animal-shelter)