---
title: "The Heavy Pill: trouver le flacon lourd avec une seule pesée (Java)"
description: "Problème style CTCI 6.1 pour débutants: 20 flacons de pilules, un a des pilules de 1.1 g au lieu de 1.0 g. Identifiez-le avec une seule pesée en prenant 1, 2, ..., 20 pilules et en lisant l'excès de poids."
date: "2026-04-05"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-1-the-heavy-pill.webp
previewImage: /assets/images/ctci-6-1-the-heavy-pill.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.1 pour débutants: 20 flacons de pilules, un a des pilules de 1.1 g au lieu de 1.0 g. Identifiez-le avec une seule pesée en prenant 1, 2, ..., 20 pilules et en lisant l'excès de poids.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Vous avez **20 flacons** de pilules. Dix-neuf contiennent des pilules normales de **1.0 gramme** chacune. Un flacon contient des pilules lourdes de **1.1 grammes** chacune. Les flacons sont identiques. Vous avez une balance qui donne le poids exact, et vous ne pouvez l'utiliser **qu'une seule fois**. Quel flacon est lourd ?

C'est d'abord un puzzle de raisonnement, le code vient ensuite. L'astuce classique est de mettre un nombre différent de pilules de chaque flacon sur la balance pour que la masse en trop encode l'indice du flacon. Ce billet est un enseignement original pour débutants, avec du **Java** optionnel pour simuler la pesée. Même famille que les puzzles mathématiques d'entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 6, maths et logique, commence ici.

---

## 1. Analogie du quotidien

Imaginez vingt bocaux de café scellés. Dix-neuf ont des grains ordinaires. Un est rempli de grains un peu plus denses. On vous laisse un seul passage sur la balance de cuisine.

Si vous pesez un grain du bocal 1, un du 2, et ainsi de suite, une lecture plus élevée dit seulement "quelque chose cloche". Elle ne dit pas lequel.

Donnez à chaque bocal une **empreinte unique** dans le tas. Mettez **1** grain du bocal 1, **2** du 2, ..., **20** du 20. Si tous les grains étaient normaux, le total serait fixe. Tout poids en trop vient uniquement du bocal dense, et la taille de cet excès est proportionnelle au nombre de grains que vous en avez pris. L'excès est le numéro du bocal.

---

## 2. Énoncé en mots simples

**Mise en place:**

* 20 flacons, étiquetés de 1 à 20 (ou de 0 à 19; choisissez et tenez-vous-y).
* 19 flacons: chaque pilule pèse **1.0 g**.
* 1 flacon: chaque pilule pèse **1.1 g**.
* Vous ne savez pas lequel est lourd.
* Balance numérique (pas seulement une balance à plateaux qui dit gauche/droite/égal).
* **Une seule pesée.**

**But:** nommer le flacon lourd après cette unique mesure.

**Hypothèses à formuler en entretien:**

* Assez de pilules dans chaque flacon (au moins 20 dans le flacon 20).
* Les pilules d'un flacon sont uniformes.
* Exactement un flacon lourd (ni zéro, ni deux).
* La précision de la balance voit des pas de 0.1 g (ou mieux).

**Forme de signature si vous codez un simulateur:**

```java
// bottles[i] is true if bottle i (1-based in comments, 0-based in arrays) is heavy
// returns the 1-based bottle index inferred from one weighing
int findHeavyBottle(boolean[] isHeavy);
```

Ou, plus honnête pour le puzzle:

```java
// given the true heavy bottle (1..20), simulate the weighing strategy and recover it
int identifyHeavy(int trueHeavyBottle);
```

**Petit aperçu numérique:**

Vous prenez `1 + 2 + ... + 20 = 210` pilules au total. Si toutes faisaient 1.0 g, la balance affiche **210.0 g**.

Si le flacon `k` est lourd, ces `k` pilules contribuent chacune un extra de **0.1 g**, donc:

```
measured = 210.0 + 0.1 * k
k = (measured - 210.0) / 0.1
```

Exemple: mesure **210.7 g** → excès **0.7 g** → flacon **7**.

---

## 3. Réfléchir d'abord

### Pourquoi une pilule par flacon échoue

Une pilule de chaque flacon: 20 pilules. Attendu 20.0 g si tout est normal. S'il y a un flacon lourd parmi eux, vous obtenez 20.1 g. Vous apprenez qu'un flacon lourd existe, mais chaque flacon lourd ajouterait le même +0.1 g. Zéro information sur *lequel*.

Les idées de type recherche binaire (moitié des flacons, puis encore moitié) demandent **plusieurs** pesées. Le problème vous fige à une seule.

### Encoder l'indice du flacon dans l'excès

Chaque flacon doit laisser une **signature distincte** sur le poids total. Des comptes différents le font:

| Flacon | Pilules prises | Extra si lourd |
| --- | --- | --- |
| 1 | 1 | 0.1 g |
| 2 | 2 | 0.2 g |
| 3 | 3 | 0.3 g |
| ... | ... | ... |
| 20 | 20 | 2.0 g |

Baseline tout-normal:

```
sum = 1 + 2 + ... + 20 = n(n+1)/2 = 20*21/2 = 210
baseline weight = 210.0 g
```

Seules les pilules du flacon lourd pèsent 0.1 g de plus. Si le flacon `k` est lourd:

```
weight = (210 - k) * 1.0 + k * 1.1
       = 210 + 0.1 * k
```

Donc:

```
k = round((weight - 210.0) / 0.1)
```

En code, utilisez un arrondi car le flottant est sale. Sur papier, l'arithmétique exacte suffit.

### Pourquoi c'est "math and logic", pas du tri

Il n'y a pas de tableau à trier. L'idée est la **théorie de l'information sur une mesure continue**: un nombre réel a assez de résolution pour porter un ID entier si vous concevez l'échantillon avec soin. Les interviewers veulent que vous inventiez l'encodage, pas que vous mémorisiez "210".

### Variantes qu'on amène

* **Certains flacons légers, certains lourds, ou direction inconnue:** d'autres puzzles classiques (souvent avec une balance et plus de pesées). Ne les mélangez pas sauf demande.
* **Flacons 0..19:** 0 pilules du flacon 0 ? Inutile. Renumérotez 1..20, ou prenez `i+1` du flacon `i`.
* **Seulement une balance à plateaux (gauche vs droite):** ici la balance est en général numérique. Clarifiez. Avec seulement gauche/droite il faut une autre stratégie et souvent plus d'usages.

---

## 4. Solution Java (simulation)

Le puzzle se résout par le raisonnement. Le code montre proprement que vous pouvez implémenter le plan sans mines flottantes.

### Helper math de base

```java
/** Sum 1+2+...+n. For n=20 this is 210. */
static int triangular(int n) {
    return n * (n + 1) / 2;
}

/**
 * Infer heavy bottle (1..n) from measured total grams.
 * baseline is triangular(n) assuming 1.0 g pills.
 */
static int bottleFromWeight(double measuredGrams, int n) {
    double baseline = triangular(n); // 210.0 for n=20
    double excess = measuredGrams - baseline;
    // each heavy pill adds 0.1 g; k pills add 0.1*k
    int k = (int) Math.round(excess / 0.1);
    if (k < 1 || k > n) {
        throw new IllegalArgumentException(
            "weight does not match any bottle: " + measuredGrams);
    }
    return k;
}
```

### Simuler un vrai flacon lourd

```java
/**
 * Simulate the classic strategy for bottles 1..n.
 * trueHeavy is 1-based. Returns the bottle index recovered from one weighing.
 */
static int identifyHeavy(int trueHeavy, int n) {
    if (trueHeavy < 1 || trueHeavy > n) {
        throw new IllegalArgumentException("trueHeavy out of range");
    }

    // one weighing: take i pills from bottle i
    double weight = 0.0;
    for (int bottle = 1; bottle <= n; bottle++) {
        int count = bottle;
        double pillMass = (bottle == trueHeavy) ? 1.1 : 1.0;
        weight += count * pillMass;
    }

    return bottleFromWeight(weight, n);
}
```

### Auto-vérification des 20 cas

```java
static void verifyAll() {
    int n = 20;
    for (int heavy = 1; heavy <= n; heavy++) {
        int found = identifyHeavy(heavy, n);
        if (found != heavy) {
            throw new AssertionError("failed for bottle " + heavy);
        }
    }
    System.out.println("ok: all " + n + " bottles identified");
}
```

### Éviter le float dans le modèle (optionnel, plus propre)

Travaillez en **dixièmes de gramme**: pilule normale = 10 unités, lourde = 11. Tout reste entier.

```java
static int identifyHeavyInt(int trueHeavy, int n) {
    // units of 0.1 g: normal=10, heavy=11
    int weightUnits = 0;
    for (int bottle = 1; bottle <= n; bottle++) {
        int count = bottle;
        int pill = (bottle == trueHeavy) ? 11 : 10;
        weightUnits += count * pill;
    }
    int baselineUnits = triangular(n) * 10; // 2100
    int extraUnits = weightUnits - baselineUnits; // equals trueHeavy
    return extraUnits; // 1..n
}
```

Phrase d'entretien utile: "Je raisonnerais en dixièmes de gramme pour ne jamais diviser des floats au tableau."

### Chiffres détaillés

Flacon 12 lourd, `n = 20`:

```
baseline = 210.0 g
extra    = 12 * 0.1 = 1.2 g
measured = 211.2 g
k        = 1.2 / 0.1 = 12
```

Unités entières:

```
baseline = 2100
measured = 2100 + 12 = 2112
extra    = 12
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Prendre i pilules du flacon i, une pesée | O(n) pour préparer | O(1) | n flacons; à la main c'est pareil |
| Une pilule par flacon (inutile seule) | O(n) | O(1) | détecte seulement "il y a un flacon lourd" |
| Recherche binaire multi-pesées | O(log n) pesées | O(1) | viole la règle d'une pesée |
| Comparer des flacons entiers | variable | O(1) | stratégie de balance différente; autre puzzle |

Le coût intéressant est le **nombre de pesées: 1**, pas le runtime asymptotique. En code, construire l'échantillon est de l'arithmétique O(n).

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent à:

* **Le flacon 1 est lourd:** excès 0.1 g. Facile à manquer si on ne pense qu'aux "gros" écarts.
* **Le flacon 20 est lourd:** excès 2.0 g. Mesure 212.0 g. Toujours unique.
* **Étiquetage off-by-one:** flacons 0..19 vs 1..20. Déclarez les labels. Mappez `extra/0.1` vers votre schéma d'indices.
* **Virgule flottante:** `211.2 - 210.0` peut valoir `1.199999...`. Préférez `Math.round` ou des dixièmes entiers.
* **Pas assez de pilules dans un flacon:** la stratégie demande 20 du flacon 20. Confirmez que l'énoncé le permet (oui dans le classique).
* **Balance qui ne compare que deux plateaux:** autre problème. Demandez.
* **Possibilité de tout normal ou plusieurs lourds:** le 6.1 classique suppose exactement un flacon lourd.
* **Même compte pour chaque flacon:** toutes les signatures s'effondrent en une seule valeur d'excès.

Erreurs courantes:

1. **Peser des flacons entiers une fois** sans plan qui isole un indice.
2. **Utiliser des groupes binaires** comme si vous aviez log₂(20) pesées.
3. **Oublier la baseline** et interpréter le poids absolu sans soustraire 210.
4. **Diviser l'excès par 1.1 ou par 0.01** (mauvaise unité). L'excès par pilule lourde est **0.1 g**.
5. **Dire que la complexité est O(1) pesées** puis écrire un algorithme qui boucle des pesées en code sans voir la contradiction.

Idée de smoke minimale:

```java
verifyAll();
System.out.println(identifyHeavy(7, 20));  // 7
System.out.println(identifyHeavy(20, 20)); // 20
System.out.println(identifyHeavyInt(12, 20)); // 12
```

---

## 7. Résumé à un ami

Vingt flacons. Un a des pilules plus lourdes. Une pesée sur balance numérique.

1. Ne prenez pas le même nombre de pilules de chaque flacon. Cela dit seulement "quelqu'un est lourd".
2. Prenez **1** du flacon 1, **2** du 2, ..., **20** du 20.
3. Si tout était normal, la masse totale est **210 g**.
4. Le flacon lourd `k` ajoute **0.1 × k** grammes.
5. Calculez `k = (mesuré - 210) / 0.1`. C'est la réponse.
6. En code, préférez des dixièmes de gramme entiers pour que le float ne vous ridiculise pas.

Si vous expliquez pourquoi l'excès *est* le numéro du flacon sans écrire de boucle, vous maîtrisez le 6.1. Le chapitre 6 est plein de ce style: inventez une mesure ou un invariant, puis le code reste court.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Draw Line](/blog/fr/ctci-5-8-draw-line)
* Suivant: [Basketball](/blog/fr/ctci-6-2-basketball)