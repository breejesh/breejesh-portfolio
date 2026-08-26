---
title: "Basket: Un tir contre marquer 2 sur 3 (probabilité)"
description: "Problème style CTCI 6.2 pour débutants: avec une proba p de réussite, choisir Jeu 1 (un panier) ou Jeu 2 (au moins deux sur trois). Algèbre: p contre 3p^2(1-p)+p^3, et quand chacun gagne."
date: "2026-01-12"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-2-basketball.webp
previewImage: /assets/images/ctci-6-2-basketball.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.2 pour débutants: avec une proba p de réussite, choisir Jeu 1 (un panier) ou Jeu 2 (au moins deux sur trois). Algèbre: p contre 3p^2(1-p)+p^3, et quand chacun gagne.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu es sous le panier. On te propose deux jeux de fête foraine. **Jeu 1:** un seul tir; tu gagnes s'il rentre. **Jeu 2:** trois tirs; tu gagnes si au moins deux rentrent. Même tireur à chaque fois. Même chance `p` de marquer à chaque essai. Tirs indépendants. Lequel prends-tu?

L'intuition est brouillée. Si tu es froid, un seul essai peut sembler plus sûr que d'avoir besoin de deux réussites. Si tu es chaud, trois essais avec une barre à deux peut sembler plus sûr qu'un tout ou rien. L'entretien veut l'algèbre qui transforme ce feeling en règle propre en fonction de `p`.

Ce billet est un enseignement original pour débutants en **Java** (un peu de code pour comparer les courbes). Même famille de problèmes que les classiques maths et logique en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, puzzles maths et logique, problème 6.2.

---

## 1. Analogie du quotidien

Pense aux lancers francs au parc.

* **Jeu 1** est la "money ball": un essai. Tu marques, tu prends le prix. La proba de gagner, c'est juste ta réussite habituelle: `p`.
* **Jeu 2** est une mini série: trois essais, il te faut **deux réussites ou plus**. Tu rates les deux premiers, le troisième ne te sauve pas. Tu marques les deux premiers, tu peux même rater le troisième.

Si tu tires très mal (`p` près de 0), avoir besoin de deux paniers est brutal. Un seul tir chanceux est le meilleur pari. Si tu tires très bien (`p` près de 1), rater deux fois est rare, donc le Jeu 2 t'avantage. Quelque part au milieu les deux jeux s'égalent. C'est ce point qu'on résout.

---

## 2. Énoncé en mots simples

**Donné:**

* Tu marques chaque tir avec proba `p`, indépendamment, `0 <= p <= 1`.
* Jeu 1: tu gagnes si tu fais **1** sur **1**.
* Jeu 2: tu gagnes si tu fais **au moins 2** sur **3**.

**Trouver:**

* Proba de gagner chaque jeu en fonction de `p`.
* Pour quelles valeurs de `p` tu préfères le Jeu 1, le Jeu 2, ou tu es indifférent.

**Hypothèses à dire à voix haute:**

* Tirs i.i.d. Bernoulli avec proba de succès `p`.
* Pour le Jeu 2, seul compte le nombre de réussites, pas l'ordre.
* "Préférer" = plus grande proba de gagner (pas plus de fun espéré, pas une autre utilité).

**Forme de signature s'ils veulent du code:**

```java
// positive: prefer game1; negative: prefer game2; zero: equal
int compareGames(double p)

double probGame1(double p)
double probGame2(double p)
```

**Clarifie avant l'algèbre:**

* `p` est connu, ou on laisse des intervalles de `p`? (Intervalles de `p`.)
* Tirs indépendants? (Oui, énoncé classique.)
* Exactement deux, ou au moins deux? (**Au moins deux**: MMF, MFM, FMM et MMM.)
* Et `p = 0`, `p = 1`? (Les deux jeux paient pareil: jamais gagner, ou toujours gagner.)

---

## 3. Réfléchir d'abord

### Proba de gagner le Jeu 1

Un tir. Une réussite.

```
P(Jeu1) = p
```

Rien à développer.

### Proba de gagner le Jeu 2

Trois tirs indépendants. Tu gagnes avec exactement 2 réussites ou exactement 3.

Coefficients binomiaux:

* Exactement 2 réussites: `C(3, 2) = 3` suites: MMF, MFM, FMM. Chacune de proba `p^2 (1-p)`.
* Exactement 3 réussites: `C(3, 3) = 1` suite: MMM. Proba `p^3`.

```
P(Jeu2) = 3 * p^2 * (1 - p) + p^3
        = 3p^2 - 3p^3 + p^3
        = 3p^2 - 2p^3
```

Aussi: "1 moins P(0 réussites) moins P(1 réussite)":

```
P(0) = (1-p)^3
P(1) = 3 p (1-p)^2
P(Jeu2) = 1 - (1-p)^3 - 3p(1-p)^2
```

Même polynôme après développement. La forme "exactement 2 plus exactement 3" est plus courte pour comparer à `p`.

### Checks de santé avant de comparer

| `p` | Jeu1 | Jeu2 | Commentaire |
| --- | --- | --- | --- |
| 0 | 0 | 0 | tous deux impossibles |
| 0.5 | 0.5 | `3*(0.25)-2*(0.125)=0.5` | égaux |
| 1 | 1 | 1 | tous deux certains |
| 0.25 | 0.25 | `3*(0.0625)-2*(0.015625)=0.15625` | Jeu1 meilleur |
| 0.75 | 0.75 | `3*(0.5625)-2*(0.421875)=0.84375` | Jeu2 meilleur |

Si ta forme fermée rate ces cinq points, corrige la formule avant les inégalités.

---

## 4. Algèbre: quand le Jeu 1 est-il meilleur?

Tu préfères le Jeu 1 quand `P(Jeu1) > P(Jeu2)`:

```
p > 3p^2 - 2p^3
p - 3p^2 + 2p^3 > 0
p (1 - 3p + 2p^2) > 0
p (2p^2 - 3p + 1) > 0
```

Factorise le quadratique:

```
2p^2 - 3p + 1 = (2p - 1)(p - 1)
```

Vérif: `(2p - 1)(p - 1) = 2p^2 - 2p - p + 1 = 2p^2 - 3p + 1`. OK.

Donc:

```
p (2p - 1)(p - 1) > 0
```

Tableau de signes de `f(p) = p(2p-1)(p-1)` sur `(0, 1)`:

* Points critiques: `p = 0`, `p = 1/2`, `p = 1`.
* Sur `(0, 1/2)`: `p > 0`, `(2p-1) < 0`, `(p-1) < 0` → positif × négatif × négatif = **positif** → Jeu1 meilleur.
* Sur `(1/2, 1)`: `p > 0`, `(2p-1) > 0`, `(p-1) < 0` → positif × positif × négatif = **négatif** → Jeu2 meilleur.
* En `p = 1/2`: `f = 0` → égaux.
* Aux extrémités `0` et `1`: même proba de gagner (tous deux 0, ou tous deux 1).

### La réponse (mémorise cette forme)

| Intervalle de `p` | Préférence |
| --- | --- |
| `0 < p < 1/2` | **Jeu 1** (un tir) |
| `p = 0`, `p = 1/2`, ou `p = 1` | **Indifférent** |
| `1/2 < p < 1` | **Jeu 2** (au moins 2 sur 3) |

En clair: **si tu marques moins de la moitié de tes tirs, prends le tir unique. Si tu marques plus de la moitié, prends le jeu à trois. À exactement la moitié (ou aux bouts triviaux), ça ne change rien.**

Ça colle à l'intuition du parc. Les mauvais tireurs détestent devoir réussir deux fois. Les bons font de trois essais un filet de sécurité.

---

## 5. Aides Java (calculer et comparer)

Pas besoin de code sur un tableau de maths pure, mais un petit helper rend les courbes vérifiables.

```java
public final class BasketballGames {

    /** P(win Game 1) = p. */
    public static double probGame1(double p) {
        return p;
    }

    /**
     * P(win Game 2) = C(3,2) p^2 (1-p) + C(3,3) p^3
     *               = 3p^2(1-p) + p^3
     *               = 3p^2 - 2p^3
     */
    public static double probGame2(double p) {
        return 3 * p * p * (1 - p) + p * p * p;
    }

    /**
     * +1 prefer Game1, -1 prefer Game2, 0 equal (within epsilon).
     */
    public static int compareGames(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("p must be in [0, 1], got " + p);
        }
        double d = probGame1(p) - probGame2(p);
        final double eps = 1e-12;
        if (Math.abs(d) <= eps) {
            return 0;
        }
        return d > 0 ? 1 : -1;
    }

    /** Closed-form preference without floating noise near known roots. */
    public static String preferClosedForm(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("p must be in [0, 1]");
        }
        if (p == 0.0 || p == 0.5 || p == 1.0) {
            return "indifferent";
        }
        return p < 0.5 ? "game1" : "game2";
    }
}
```

### Optionnel: balayer l'intervalle et imprimer le basculement

```java
public static void main(String[] args) {
    for (int i = 0; i <= 20; i++) {
        double p = i / 20.0;
        double g1 = BasketballGames.probGame1(p);
        double g2 = BasketballGames.probGame2(p);
        String who = BasketballGames.preferClosedForm(p);
        System.out.printf("p=%.2f  g1=%.5f  g2=%.5f  -> %s%n", p, g1, g2, who);
    }
    // p=0.00 ... indifferent
    // p=0.25 ... game1
    // p=0.50 ... indifferent
    // p=0.75 ... game2
    // p=1.00 ... indifferent
}
```

La comparaison flottante près de `0.5` peut bouger; en entretien, utilise la forme fermée `p ? 1/2`. Les helpers numériques servent à **vérifier**, pas à **découvrir** le seuil en balayant seul.

---

## 6. Parcours numérique et une erreur fréquente

### Cas A: tireur froid, `p = 0.2`

```
P1 = 0.2
P2 = 3*(0.04)*(0.8) + 0.008 = 0.096 + 0.008 = 0.104
```

Le Jeu 1 gagne (`0.2 > 0.104`). Avoir besoin de deux paniers à 20% fait mal.

### Cas B: pièce équitable, `p = 0.5`

```
P1 = 0.5
P2 = 3*(0.25)*(0.5) + 0.125 = 0.375 + 0.125 = 0.5
```

Égaux. Bon point de contrôle de l'algèbre.

### Cas C: tireur chaud, `p = 0.8`

```
P1 = 0.8
P2 = 3*(0.64)*(0.2) + 0.512 = 0.384 + 0.512 = 0.896
```

Le Jeu 2 gagne. Rater deux fois sur trois est peu probable.

### Erreurs courantes

1. **Ne compter que exactement deux réussites** et oublier trois: sous-estime le Jeu 2 de `p^3`.
2. **Traiter le Jeu 2 comme "deux d'affilée"** au lieu de n'importe lesquels deux sur trois: autre événement.
3. **Comparer le nombre espéré de paniers** au lieu de P(gagner): le Jeu 1 espère `p` paniers, le Jeu 2 espère `3p`. Autre question. Ce qui compte, c'est la **règle de victoire**.
4. **Assumer des tirs dépendants** (fatigue, pression) sans qu'on le demande. Dis l'indépendance sauf si l'intervieweur ajoute autre chose.
5. **Résoudre `p = 3p^2 - 2p^3` et s'arrêter** sans tableau de signes. Les racines seules ne disent pas quel côté préfère quel jeu.

---

## 7. Complexité, bords, conseils d'entretien

| Sujet | Réponse |
| --- | --- |
| Modèle | Tirs Bernoulli indépendants avec succès `p` |
| P(Jeu1) | `p` |
| P(Jeu2) | `3p^2(1-p) + p^3 = 3p^2 - 2p^3` |
| Préfère Jeu1 | `0 < p < 1/2` |
| Préfère Jeu2 | `1/2 < p < 1` |
| Indifférent | `p ∈ {0, 1/2, 1}` |
| Temps (forme fermée) | Arithmétique O(1) |
| Espace extra | O(1) |

**Comment le dire (version 45 secondes):**

1. Le Jeu 1, c'est juste `p`.
2. Le Jeu 2 est binomial: trois façons d'avoir exactement deux réussites, une pour trois: `3p^2(1-p)+p^3`.
3. Pose `p > 3p^2-2p^3`, factorise `p(2p-1)(p-1) > 0`.
4. Sur `(0,1)`, ça tient pour `p < 1/2`.
5. Vérifie les extrémités et `p = 1/2` comme égalités.

**Relances possibles:**

* Généraliser à "faire `k` sur `n`" contre un tir: même idée, polynômes plus sales.
* Et si la proba change après un raté? L'indépendance tombe; il faut un arbre de cas.
* Risque: si le prix est énorme et que tu aimes le risque, l'utilité peut ne pas être P(gagner). La réponse classique CTCI reste sur P(gagner).

**Voisins de la série:**

* Puzzle précédent: [La pilule lourde](/blog/fr/ctci-6-1-the-heavy-pill).
* Suivant style pavage / coloriage: [Dominos](/blog/fr/ctci-6-3-dominos).

---

## 8. Résumé à raconter à un ami

Basket (problème 6.2) est une **comparaison de probabilités**, pas un grind de code.

1. La chance du Jeu 1 est `p`.
2. Celle du Jeu 2: au moins deux sur trois tirs indépendants: `3p^2(1-p) + p^3`.
3. Simplifie en `3p^2 - 2p^3`.
4. Préfère le Jeu 1 quand `p > 3p^2 - 2p^3`, qui factorise en `p(2p-1)(p-1) > 0`.
5. Entre 0 et 1, hors des racines: **prends un tir si `p < 1/2`, prends deux-sur-trois si `p > 1/2`.** En `0`, `1/2` et `1` les jeux sont égaux.

Si tu écris les deux probas, factorises l'inégalité et nommes le basculement à un demi sans fiche, tu possèdes le 6.2.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [La pilule lourde](/blog/fr/ctci-6-1-the-heavy-pill)
* Suivant: [Dominos](/blog/fr/ctci-6-3-dominos)