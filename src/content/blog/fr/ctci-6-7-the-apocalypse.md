---
title: "The Apocalypse: garçons, filles, et une règle qui reste à 50/50 (Java)"
description: "Problème style CTCI 6.7 pour débutants: les familles ont des enfants jusqu'à un garçon, puis s'arrêtent. Le ratio garçons/filles reste environ 1:1. Série infinie et courte simulation Java."
date: "2026-04-18"
tags: [Algorithmes]
coverImage: /assets/images/ctci-6-7-the-apocalypse.webp
previewImage: /assets/images/ctci-6-7-the-apocalypse.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.7 pour débutants: les familles ont des enfants jusqu'à un garçon, puis s'arrêtent. Le ratio garçons/filles reste environ 1:1. Série infinie et courte simulation Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un gouvernement dystopique impose une règle: chaque famille continue d'avoir des enfants jusqu'à un garçon, puis s'arrête. Plus d'enfant après le premier garçon. L'intuition hurle que le monde se remplira de filles, de longues chaînes GGG...B, plus de filles que de garçons.

Ce n'est pas le cas. Avec des naissances équitables 50/50, le ratio mondial garçons/filles converge encore vers **1:1**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille d'énigmes mathématiques d'entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, maths et logique, problème 6.7.

---

## 1. Analogie du quotidien

Pense à une pièce équitable. Face = garçon, pile = fille. Chaque famille tire jusqu'à la première face, puis range la pièce.

* Certaines familles tirent une fois: **H**. Un garçon. Zéro fille.
* Certaines tirent **TH**. Une fille, puis un garçon.
* Certaines tirent **TTH**. Deux filles, puis un garçon.
* Des familles rares enchaînent une longue série de piles avant la première face.

Chaque famille se termine avec **exactement un garçon**. Le nombre de filles est aléatoire: 0, 1, 2, 3, ... avec une chance de plus en plus petite.

Somme un village entier. Beaucoup de familles à un seul garçon. Moins de familles avec beaucoup de filles. Les rares familles très chargées en filles sont exactement assez rares pour que, à la limite, le total des filles égale celui des garçons. La pièce ne "connaît" pas la politique. Chaque tirage reste moitié-moitié.

---

## 2. Énoncé en mots simples

**Cadre (forme classique):**

* Chaque naissance est indépendamment garçon ou fille avec probabilité `1/2`.
* Chaque famille continue jusqu'à un garçon, puis s'arrête.
* Familles indépendantes. Pas de jumeaux, pas de sélection de sexe, pas de tours de mortalité. Juste la règle d'arrêt.

**Question:** quel est le ratio garçons/filles dans la population (beaucoup de familles, sens limite)?

**Ce que les gens devinent souvent:** plus de filles que de garçons, parce que certaines familles produisent plusieurs filles avant le garçon.

**Ce que nous montrons:** l'espérance de garçons par famille égale celle de filles, toutes deux valent 1. Ratio **1:1**. Une simulation avec assez de familles tombe près de 50% de garçons.

**Clarifie avant de coder ou d'écrire la preuve:**

* Compte-t-on seulement les enfants, pas les parents? (Oui. Garçons et filles parmi les enfants.)
* L'ordre des naissances est-il fixé par la politique? (Oui: zéro ou plusieurs filles, puis un garçon. Jamais une fille après un garçon dans cette famille.)
* Pièce équitable? (Oui. Si `P(garçon) = p` n'est pas 1/2, le ratio change. Défaut entretien: équitable.)
* Ratio de population ou de types de familles? (Comptes d'enfants dans la population.)

---

## 3. Réfléchir d'abord

### Intuition piège

"Beaucoup de familles ressemblent à GGGGB. Ce tas de G doit dominer."

Mauvaise unité. Ces familles sont **rares**. La probabilité de k filles puis un garçon est `(1/2)^{k+1}`. Quatre filles puis un garçon, ce n'est que `1/32` des familles. Tu surpondères les longues chaînes en regardant un cas extrême.

### Unité plus propre: une famille, espérances

Chaque famille produit **exactement un garçon** (le dernier enfant). Donc:

```
E[garçons par famille] = 1
```

Filles: avec proba `1/2` le premier est garçon, 0 fille. Avec proba `1/4`, motif GB, 1 fille. Avec proba `1/8`, GGB, 2 filles. Et ainsi de suite.

```
E[filles] = 0*(1/2) + 1*(1/4) + 2*(1/8) + 3*(1/16) + ...
          = sum_{k=0}^{inf} k * (1/2)^{k+1}
```

Série standard: `sum_{k=1}^{inf} k x^k = x / (1-x)^2` pour `|x| < 1`.

Ici `x = 1/2`:

```
sum_{k=1}^{inf} k (1/2)^k = (1/2) / (1/2)^2 = (1/2)/(1/4) = 2
```

Notre somme est `sum k * (1/2)^{k+1} = (1/2) * sum k (1/2)^k = (1/2)*2 = 1`.

Donc:

```
E[filles par famille]   = 1
E[garçons par famille]  = 1
ratio garçons : filles  = 1 : 1
```

### Autre vue: série de toutes les naissances

Compte les contributions espérées par forme de famille:

| Motif | Prob | Garçons | Filles | Contrib garçons | Contrib filles |
| --- | --- | --- | --- | --- | --- |
| B | 1/2 | 1 | 0 | 1/2 | 0 |
| GB | 1/4 | 1 | 1 | 1/4 | 1/4 |
| GGB | 1/8 | 1 | 2 | 1/8 | 2/8 |
| GGGB | 1/16 | 1 | 3 | 1/16 | 3/16 |
| ... | ... | 1 | k | ... | ... |

Somme des contributions garçons: `1/2 + 1/4 + 1/8 + ... = 1`.

Somme des contributions filles: `0 + 1/4 + 2/8 + 3/16 + ... = 1` (même série qu'au-dessus).

### Argument au niveau naissance (ligne courte d'entretien)

Chaque enfant naît garçon ou fille avec proba 1/2, indépendamment des naissances passées. La politique décide seulement **si la famille a un autre enfant**, pas le sexe du suivant. Sommer des naissances justes indépendantes ne crée pas un biais mondial vers les filles. La règle corrèle la taille de famille avec des garçons précoces, mais pas le sexe d'une naissance donnée.

---

## 4. Série infinie, écrite proprement

Soit `G` le nombre de filles dans une famille. `G` est géométrique: échecs avant le premier succès, proba de succès `1/2`.

```
P(G = k) = (1/2)^{k+1}   pour k = 0, 1, 2, ...
E[G]     = (1 - p) / p   pour géométrique échecs-avant-succès avec succès p
         = (1/2) / (1/2) = 1
```

Garçons `B = 1` toujours, donc `E[B] = 1`.

Pour n familles, total de garçons `n`, total de filles environ `n` en espérance. Le ratio des espérances vaut 1. Par la loi des grands nombres le ratio empirique tend vers 1 quand n croît.

Si on redemande la forme fermée pour les filles:

```
E[G] = sum_{k=0}^{inf} k (1/2)^{k+1}
     = (1/2) sum_{k=1}^{inf} k (1/2)^k
     = (1/2) * ( (1/2) / (1 - 1/2)^2 )
     = (1/2) * ( (1/2) / (1/4) )
     = (1/2) * 2
     = 1
```

---

## 5. Simulation Java

Les maths sont la preuve. La simulation est le contrôle instinctif au tableau ou en démo style test.

```java
import java.util.Random;

public final class ApocalypseRatio {
    private ApocalypseRatio() {}

    /** Une famille: enfants jusqu'à un garçon. Renvoie {garçons, filles}. */
    static int[] oneFamily(Random rng) {
        int boys = 0;
        int girls = 0;
        while (true) {
            // true = boy
            if (rng.nextBoolean()) {
                boys++;
                break;
            } else {
                girls++;
            }
        }
        return new int[] {boys, girls};
    }

    /**
     * Simule n familles. Renvoie {totalBoys, totalGirls}.
     */
    static long[] simulate(int families, long seed) {
        Random rng = new Random(seed);
        long boys = 0;
        long girls = 0;
        for (int i = 0; i < families; i++) {
            int[] bg = oneFamily(rng);
            boys += bg[0];
            girls += bg[1];
        }
        return new long[] {boys, girls};
    }

    public static void main(String[] args) {
        int n = 1_000_000;
        long[] totals = simulate(n, 42L);
        long b = totals[0];
        long g = totals[1];
        double ratioBoys = b / (double) (b + g);
        System.out.printf("families=%d boys=%d girls=%d boyFraction=%.4f%n",
                n, b, g, ratioBoys);
        // expect boys == n, girls ~ n, boyFraction ~ 0.50
    }
}
```

Notes:

* Chaque famille apporte exactement un garçon, donc `boys` doit égaler `families` toujours. Assert gratuit.
* `girls` est aléatoire autour de `families`. Avec un million de familles, la fraction se place près de 0.5 (erreur typique de l'ordre des millièmes).
* `Random.nextBoolean()` est une pièce équitable pour cet usage.

Helpers optionnels pour un apply de tests:

```java
static void assertInvariants(int families, long seed) {
    long[] t = simulate(families, seed);
    if (t[0] != families) {
        throw new AssertionError("every family has exactly one boy");
    }
    double frac = t[0] / (double) (t[0] + t[1]);
    if (Math.abs(frac - 0.5) > 0.01 && families >= 100_000) {
        throw new AssertionError("ratio drifted too far: " + frac);
    }
}
```

---

## 6. Cas limites et questions de suite

Les interviewers touchent à ça:

* **Pièce biaisée:** si `P(garçon) = p`, alors `E[garçons] = 1` toujours (arrêt au premier garçon), et `E[filles] = (1-p)/p`. Ratio garçons:filles = `1 : (1-p)/p` = `p : (1-p)`. Seulement à `p = 1/2` on a 1:1.
* **Arrêt après deux garçons, ou autres politiques:** change la règle d'arrêt et l'espérance change. Le slogan "chaque naissance est juste" tient par naissance, mais les poids de composition familiale changent. Refais la série.
* **Compter les parents:** si quelqu'un met mères et pères dans "population", la question est brouillée. Reste sur les enfants sauf demande contraire.
* **Petit n:** avec 10 familles le ratio est bruyant. Explique limite vs une seule run.
* **Le dernier enfant est toujours un garçon:** vrai, et les gens s'en servent pour crier au biais. Rappelle que le **nombre** de filles qui précèdent équilibre en espérance.
* **Corrélation vs biais:** la taille de famille corrèle avec combien de filles sont sorties d'abord. Ce n'est pas une proba de naissance biaisée.

Erreurs courantes:

1. **Moyenne des ratios par famille** (garçons/filles de chacune, puis moyenne). Familles à zéro fille: ratio indéfini ou infini. Utilise les totaux, ou les espérances de comptes.
2. **Ne lister que quelques motifs** sans sommer la queue. La queue infinie des familles rares compte pour la forme fermée.
3. **Confondre "la plupart des familles ont plus de filles"** avec "la plupart des enfants sont des filles." En fait la plupart des familles ont zéro ou une fille (B et GB couvrent 3/4). La queue longue remonte les filles jusqu'à égaler les garçons.
4. **Croire que la politique change les odds de chaque naissance.** Elle décide seulement s'il y a une autre naissance.

Contrôle mental minimal sans code:

```
1 famille espérée: 1 garçon, 1 fille
1000 familles espérées: 1000 garçons, 1000 filles
```

---

## 7. Explique à un ami

Politique Apocalypse: enfants jusqu'à un garçon, puis stop.

1. Chaque famille finit avec exactement un garçon. Espérance de garçons = 1.
2. Les filles suivent un compte géométrique (échecs avant le premier garçon). Espérance de filles = 1 si naissances équitables.
3. Série infinie: masse de garçons `1/2 + 1/4 + 1/8 + ... = 1`. La masse de filles somme aussi à 1.
4. Chaque naissance isolée reste 50/50. La règle décide seulement quand s'arrêter, pas le sexe du suivant.
5. Java: boucle familles, boucle interne jusqu'au garçon, cumule. Assert boys == nombre de familles; fraction près de 0.5 pour grand n.

Si tu peux écrire `E[G] = sum k/2^{k+1} = 1` au tableau et dire pourquoi le "plus de filles" du ventre échoue, tu possèdes le 6.7. Énergie chapitre maths: l'intuition est le piège, l'espérance est la correction.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Blue-Eyed Island](/blog/fr/ctci-6-6-blue-eyed-island)
* Suivant: [The Egg Drop Problem](/blog/fr/ctci-6-8-the-egg-drop-problem)