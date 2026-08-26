---
title: "Fourmis sur un triangle: probabilité qu'elles ne se rencontrent pas (Java)"
description: "Problème style CTCI 6.4 pour débutants: trois fourmis aux sommets choisissent une direction au hasard. Compte les 8 cas, marque quand elles ne font que se suivre, et obtient la probabilité 1/4. Énumération Java incluse."
date: "2025-10-22"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
previewImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.4 pour débutants: trois fourmis aux sommets choisissent une direction au hasard. Compte les 8 cas, marque quand elles ne font que se suivre, et obtient la probabilité 1/4. Énumération Java incluse.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Trois fourmis sont aux trois coins d'un triangle. Au même instant chacune choisit gauche ou droite le long d'une arête et se met à marcher à la même vitesse. Vont-elles se percuter? La question d'entretien n'est pas de la physique. C'est un petit problème de dénombrement: combien de combinaisons de directions évitent une collision, parmi tous les choix équiprobables?

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les classiques maths-et-logique en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, maths et logique, problème 6.4.

---

## 1. Analogie du quotidien

Imagine trois personnes aux trois coins d'un chemin triangulaire dans un parc. Chacune lance une pièce: parcourir la boucle dans le sens horaire, ou dans le sens antihoraire. Même vitesse pour tout le monde.

Si les trois pièces donnent le même sens, elles restent espacées. Chacune poursuit celle devant et est poursuivie par celle derrière. Personne ne se croise face à face sur une arête. Elles tournent indéfiniment.

Si ne serait-ce qu'une personne part dans l'autre sens, deux personnes marchent l'une vers l'autre sur une arête. Elles se rencontrent de face. C'est une collision pour ce puzzle.

Donc le puzzle: trois pièces, pile ou face. À quelle fréquence les trois sont-elles d'accord?

---

## 2. Énoncé en mots simples

**Mise en place:**

* Triangle équilatéral (la forme exacte importe peu: trois sommets, trois arêtes).
* Une fourmi sur chaque sommet.
* Chaque fourmi choisit indépendamment une direction: sens horaire (CW) ou antihoraire (CCW), chacune avec probabilité `1/2`.
* Toutes marchent à la même vitesse constante le long des arêtes.

**Règle de collision (dis-la à voix haute en entretien):**

* Deux fourmis **entrent en collision** si elles vont l'une vers l'autre sur la même arête (rencontre de face).
* Si les trois choisissent la même direction, elles ne se croisent jamais de face. Elles restent espacées également et tournent pour toujours.
* On ignore "se croiser sur un sommet" comme cas à part dans le modèle habituel: seules les courses avec une seule orientation globale sont sans collision.

**Question:** quelle est la probabilité que les fourmis ne se rencontrent jamais?

**Clarifie avant de résoudre:**

* Directions indépendantes et équitables? (Oui: chaque fourmi, chaque direction, probabilité `1/2`.)
* La même vitesse compte? (Oui pour l'histoire de face. Des vitesses différentes changent les points de rencontre, mais la réponse classique repose toujours sur l'accord de direction.)
* Collision seulement de face, ou toute rencontre y compris rattraper par derrière? (Énoncé classique: de face. À vitesse égale, celles qui vont dans le même sens ne se rattrapent pas.)
* Généraliser à `n` fourmis sur un n-gone? Bon follow-up. Même idée: seules deux orientations globales marchent.

---

## 3. Réfléchis d'abord

### Espace d'échantillons

Chaque fourmi a 2 choix. Trois fourmis:

```
total outcomes = 2^3 = 8
```

Les huit sont équiprobables si les pièces sont justes. Liste-les comme triplet `(A, B, C)` où `0` signifie CW et `1` signifie CCW (n'importe quel étiquetage des sommets convient).

```
(0,0,0)  toutes CW
(0,0,1)
(0,1,0)
(0,1,1)
(1,0,0)
(1,0,1)
(1,1,0)
(1,1,1)  toutes CCW
```

### Lesquelles évitent la collision?

Seulement les deux lignes uniformes:

* Toutes CW: `(0,0,0)`
* Toutes CCW: `(1,1,1)`

Dans chaque ligne mixte, au moins une paire de voisins a choisi des directions opposées, donc elles marchent l'une vers l'autre sur l'arête entre elles et se percutent.

Donc:

```
favorable = 2
probability = 2 / 8 = 1/4
```

### Une autre façon de le dire

Fixe la fourmi A (direction libre, probabilité 1). B doit coller à A (`1/2`). C doit coller à A (`1/2`). Produit:

```
P(no collision) = 1 * (1/2) * (1/2) = 1/4
```

Même réponse sans lister huit lignes. Lister est mieux en entretien pour une histoire de débutant, parce que l'intervieweur voit que tu as compté.

### Pourquoi les directions mixtes collident toujours (même vitesse)

Étiquette les sommets `A`, `B`, `C` dans l'ordre CW. L'arête `AB` n'a que A et B au départ.

* Si A marche CW vers B et B marche CCW vers A: de face sur `AB`.
* Si A marche CCW (vers C) et B marche CW: ailleurs un de face apparaît encore, parce que les trois ne sont pas d'accord.

Tu n'as pas besoin de caser chaque motif mixte en entretien si tu énonces le théorème propre:

> Sans collision si et seulement si chaque fourmi choisit la même orientation.

Preuve "si": même direction, même vitesse, espacement constant, pas de de face.
Preuve "seulement si": si l'une diffère, cette fourmi et un voisin forment une paire opposée sur une arête partagée (ou le cycle force au moins une paire de voisins opposés sur un triangle).

Sur un triangle c'est particulièrement clair: deux directions impliquent au moins une arête avec trafic opposé.

### Follow-up: n fourmis sur un n-gone régulier

Même modèle: chacune choisit CW ou CCW avec probabilité `1/2`, même vitesse, collision = de face sur une arête.

Seules deux configurations sûres: toutes CW, toutes CCW.

```
P = 2 / 2^n = 2^(1-n)
```

Pour `n = 3`: `2^(1-3) = 2^(-2) = 1/4`. Même réponse.

Pour `n = 4`: `1/8`. Pour un grand `n` la probabilité s'effondre vers zéro. Presque toujours quelqu'un n'est pas d'accord.

---

## 4. Solution Java

Tu n'as pas besoin de code lourd pour la forme fermée. Quand même, énumérer les issues est une façon propre de montrer le compte, et ça se généralise à `n`.

### Forme fermée

```java
/** Probability all n ants agree on direction (fair coins, independent). */
static double noCollisionProbability(int n) {
    if (n < 1) {
        throw new IllegalArgumentException("n must be at least 1");
    }
    // 2 favorable out of 2^n
    return 2.0 / Math.pow(2, n);
}

// triangle
// noCollisionProbability(3) == 0.25
```

### Énumérer tous les masques 2^n

Le bit `i` est la direction de la fourmi `i` (`0` CW, `1` CCW). Un masque est sûr seulement si tous les bits sont 0 ou tous sont 1.

```java
/**
 * Count direction assignments with no head-on collision.
 * Bit i of the mask is ant i's direction.
 */
static int countSafeConfigs(int n) {
    if (n < 1 || n > 30) {
        throw new IllegalArgumentException("n out of supported range");
    }
    int total = 1 << n; // 2^n
    int safe = 0;
    int allOnes = total - 1; // n bits set
    for (int mask = 0; mask < total; mask++) {
        if (mask == 0 || mask == allOnes) {
            safe++;
        }
    }
    return safe; // always 2 for n >= 1
}

static double probabilityByEnumeration(int n) {
    int total = 1 << n;
    return (double) countSafeConfigs(n) / total;
}
```

### Table explicite du triangle (bien au tableau)

```java
static void printTriangleCases() {
    // ants A, B, C; 0 = CW, 1 = CCW
    String[] labels = {"CW", "CCW"};
    int safe = 0;
    for (int a = 0; a <= 1; a++) {
        for (int b = 0; b <= 1; b++) {
            for (int c = 0; c <= 1; c++) {
                boolean ok = (a == b) && (b == c);
                if (ok) {
                    safe++;
                }
                System.out.printf(
                    "(%s, %s, %s) -> %s%n",
                    labels[a], labels[b], labels[c],
                    ok ? "safe (all same)" : "collide");
            }
        }
    }
    System.out.println("safe / total = " + safe + " / 8 = " + (safe / 8.0));
}
```

Sortie approximative:

```
(CW, CW, CW) -> safe (all same)
(CW, CW, CCW) -> collide
(CW, CCW, CW) -> collide
(CW, CCW, CCW) -> collide
(CCW, CW, CW) -> collide
(CCW, CW, CCW) -> collide
(CCW, CCW, CW) -> collide
(CCW, CCW, CCW) -> safe (all same)
safe / total = 2 / 8 = 0.25
```

### Checks style tests unitaires

```java
assert Math.abs(noCollisionProbability(3) - 0.25) < 1e-9;
assert Math.abs(probabilityByEnumeration(3) - 0.25) < 1e-9;
assert countSafeConfigs(3) == 2;
assert countSafeConfigs(4) == 2;
assert Math.abs(noCollisionProbability(4) - 0.125) < 1e-9;
assert Math.abs(noCollisionProbability(1) - 1.0) < 1e-9; // one ant: never collides
```

---

## 5. Parcours des cas classiques

### Toutes dans le sens horaire

Fourmis en A, B, C toutes CW. Après un moment chacune a parcouru le même arc. Les distances entre fourmis restent égales à un côté (le long du périmètre). Personne ne marche face à un voisin. **Sûr.**

### Toutes dans le sens antihoraire

Même histoire, orientation opposée. **Sûr.**

### Deux CW, une CCW

Disons A et B sont CW, C est CCW. Alors A marche vers B sur AB pendant que B marche vers C... et C marche vers B ou A selon l'étiquetage. Sur un triangle, la direction minoritaire crée au moins une arête avec trafic opposé. **Collision.**

Concret: A en haut, B bas-droite, C bas-gauche. CW signifie A→B, B→C, C→A. CCW signifie A→C, C→B, B→A.

Si A et B choisissent CW et C choisit CCW:

* A marche vers B (CW).
* B marche vers C (CW).
* C marche vers B (CCW: C→B).

Donc B et C vont l'une vers l'autre sur l'arête BC. De face. Terminé.

Tout autre triplet mixte a la même forme après renommage des sommets.

### Arithmétique de probabilité

```
P(all CW)  = (1/2)^3 = 1/8
P(all CCW) = 1/8
P(safe)    = 1/8 + 1/8 = 1/4
```

Ou: `2` masques favorables sur `8`.

---

## 6. Complexité, cas limites, conseils d'entretien

| Approche | Temps | Espace | Notes |
| --- | --- | --- | --- |
| Forme fermée `2 / 2^n` | O(1) | O(1) | Meilleure réponse une fois le modèle clair |
| Énumérer `2^n` masques | O(2^n) | O(1) | OK pour n ≤ 20 en démo; excessif pour n = 3 |
| Boucles imbriquées pour n = 3 | O(1) | O(1) | Meilleur tableau pour débutants |

**Pièges et bords:**

1. **Oublier l'équiprobabilité.** Si tu dis seulement "deux bons cas" sans diviser par 8, tu n'as pas fini.
2. **Appeler collision toute rencontre, y compris même sens.** À vitesse égale elles ne se rattrapent pas. Reste sur de face sauf si l'intervieweur change le modèle.
3. **Croire que l'ordre de mouvement compte.** Choix simultané à vitesse égale: pure combinatoire.
4. **Fierté du flottant.** Préfère les fractions exactes: `2/8 = 1/4`. Utilise des doubles seulement en code.
5. **n = 2 "digone" absurde.** Reste à n ≥ 3 pour les polygones, ou note que n = 1 est trivialement 1.
6. **Supposer qu'elles rebondissent ou s'inversent.** Problème classique: elles choisissent une fois et continuent jusqu'à une rencontre potentielle.

**Comment le dire (version 30 secondes):**

1. Chaque fourmi a 2 directions, donc 8 issues équiprobables.
2. Elles évitent la collision seulement si toutes vont CW ou toutes vont CCW.
3. C'est 2 sur 8, probabilité `1/4`.
4. n-gone général: `2 / 2^n`.

**Où ça apparaît hors de l'énigme:**

* Espaces d'échantillons et indépendance en entretiens de probabilité.
* Événements d'"accord": tous les bits égaux, tous les votes identiques, toutes les horloges en phase.
* Arguments de symétrie: réduire un mouvement continu à un dénombrement de choix discrets.

---

## 7. Résumé à raconter à un ami

Fourmis sur un triangle est un problème de dénombrement déguisé en faune.

1. Trois fourmis, chacune choisit CW ou CCW avec probabilité `1/2`. Huit issues, toutes égales.
2. De face sur une arête compte comme collision. Même vitesse, même direction: elles ne font que se suivre, jamais de face.
3. Exactement deux issues sont sûres: toutes CW, toutes CCW.
4. Probabilité: `2/8 = 1/4`.
5. Pour n fourmis sur un n-gone: `2 / 2^n`.

Si tu peux lister les huit triplets, marquer les deux uniformes, et dire pourquoi un choix mixte force un de face, tu maîtrises le problème 6.4. Pas de calcul différentiel. Juste un dénombrement soigneux.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Dominos](/blog/fr/ctci-6-3-dominos)
* Suivant: [Cruches d'eau](/blog/fr/ctci-6-5-jugs-of-water)