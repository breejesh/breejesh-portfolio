---
title: "Poison: trouver la bouteille empoisonnée avec 10 bandelettes en un mois (Java)"
description: "Problème style CTCI 6.10 pour débutants: 1000 bouteilles, une empoisonnée, 10 bandelettes, le résultat prend un mois. Encode chaque bouteille en motif de bits pour qu'un seul tour de gorgées la nomme."
date: "2026-03-22"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-10-poison.webp
previewImage: /assets/images/ctci-6-10-poison.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.10 pour débutants: 1000 bouteilles, une empoisonnée, 10 bandelettes, le résultat prend un mois. Encode chaque bouteille en motif de bits pour qu'un seul tour de gorgées la nomme.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as **1000 bouteilles** de soda. Exactement **une** est empoisonnée. Tu as **10 bandelettes de test**. Une bandelette reste propre ou devient positive après avoir goûté du poison. Chaque test demande un **mois** complet avant lecture, et tu n'as qu'un mois. Comment trouver la bouteille empoisonnée?

C'est d'abord un puzzle de raisonnement, le code ensuite. L'astuce est binaire: traite chaque bouteille comme un nombre, et laisse chaque bandelette jouer le rôle d'un bit. Ce billet est un enseignement original pour débutants, avec du **Java** optionnel pour encoder les gorgées et décoder les résultats. Même famille que les puzzles d'info-théorie en entretien, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 6, maths et logique, se termine ici.

---

## 1. Analogie du quotidien

Imagine 1000 briques de jus scellées. Une est avariée. Tu as dix papiers de tournesol et une nuit avant la fête. Chaque papier ne se lit que le matin, donc tu as **un seul lot** de tests, pas un arbre de recherches avec des suites.

Si tu plonges la bandelette 1 dans la brique 1, la 2 dans la 2, et ainsi de suite, tu ne couvres que dix briques. La recherche binaire demande plusieurs tours parce que chaque résultat doit arriver avant de choisir le groupe suivant. Tu n'as pas plusieurs tours.

Donne à chaque brique un **ID binaire**. La brique 13 est `0000001101` sur dix bits. Pour chaque bit à `1`, cette brique laisse une goutte sur le papier correspondant. Le matin, le motif des papiers sales est exactement l'ID binaire de la brique avariée. Dix papiers, dix bits, jusqu'à 1024 IDs. Tu n'as besoin que de 1000.

---

## 2. Énoncé simple

**Mise en place:**

* 1000 bouteilles, étiquetées `0` à `999` (ou `1` à `1000`; choisis et tiens-toi-y).
* Exactement une bouteille est empoisonnée. Le reste est sûr.
* 10 bandelettes. Chacune peut servir dans le seul tour de test en buvant un mélange de gouttes de plusieurs bouteilles.
* Si une bandelette goûte du poison (même mélangé à du liquide sûr), elle devient **positive** après un mois. Sinon elle reste **négative**.
* Tu lances **un** tour de tests maintenant, tu attends un mois, tu lis toutes les bandelettes d'un coup.

**Objectif:** nommer la bouteille empoisonnée à partir de cette lecture.

**Hypothèses à clarifier en entretien:**

* Le poison est assez fort: toute quantité positive sur une bandelette la déclenche (pas de cas limites de dilution).
* Pas de faux positifs ni de faux négatifs.
* Exactement une bouteille empoisonnée (ni zéro, ni deux).
* Mélanger des gouttes sur une bandelette est autorisé et gratuit.
* Pas de second tour après les résultats (budget temps: un mois).

**Forme de signature si tu codes un simulateur:**

```java
// bottle ids 0..999; strips 0..9
// returns which bottles strip s should sip
int[] bottlesForStrip(int stripIndex, int bottleCount);

// after one month: positive[s] is true if strip s turned positive
// recover the poisoned bottle id
int decodePoisonedBottle(boolean[] positive);
```

Ou, plus honnête pour le puzzle:

```java
// given the true poisoned bottle, simulate sips + one month, recover the id
int identifyPoisoned(int truePoisoned, int bottleCount, int stripCount);
```

**Petit aperçu numérique (8 bouteilles, 3 bandelettes):**

Bouteilles `0..7`, bandelettes pour les bits `0, 1, 2` (bit 0 = moins significatif):

| Bouteille | Binaire | Gorgées sur bandelettes |
| --- | --- | --- |
| 0 | 000 | aucune |
| 1 | 001 | 0 |
| 2 | 010 | 1 |
| 3 | 011 | 0, 1 |
| 4 | 100 | 2 |
| 5 | 101 | 0, 2 |
| 6 | 110 | 1, 2 |
| 7 | 111 | 0, 1, 2 |

Si la bouteille **5** est empoisonnée, les bandelettes **0** et **2** deviennent positives, la **1** reste propre. Lecture en bits: `101` binaire = **5**.

Avec **10** bandelettes tu couvres `2^10 = 1024` motifs, assez pour 1000 bouteilles avec de la marge.

---

## 3. Réfléchir d'abord

### Pourquoi le séquentiel ou la recherche binaire échoue

Une bouteille par bandelette: 10 bouteilles couvertes, 990 intactes. Inutile.

Recherche binaire: moitié des bouteilles sur la bandelette 1, attendre un mois, puis la moitié de la moitié restante, etc. Environ `log2(1000) ≈ 10` **tours**, donc environ **10 mois**. Le problème te fige à **un** mois.

### Budget d'information

Chaque bandelette a 2 issues: positive ou négative. Dix bandelettes indépendantes donnent `2^10 = 1024` motifs possibles. Il faut distinguer 1000 possibilités (quelle bouteille est mauvaise). **1024 ≥ 1000**, donc en théorie un tour suffit. La question est comment mapper bouteilles vers motifs.

### Encoder l'index de bouteille comme motif de bandelettes

Numérote les bouteilles de `0` à `999`. Écris chaque index en binaire sur au plus 10 bits:

```
bottle b -> bits b0 b1 ... b9
  where bi = 1 if (b & (1 << i)) != 0
```

**Encodage (ce que tu fais aujourd'hui):**

* Pour chaque bandelette `i` dans `0..9`:
  * la bandelette `i` boit une goutte de chaque bouteille `b` dont le bit `i` de `b` est à 1.

**Décodage (ce que tu fais dans un mois):**

* Soit `result = 0`.
* Pour chaque bandelette `i`, si elle est positive, active le bit `i` dans `result`: `result |= (1 << i)`.
* `result` est l'index de la bouteille empoisonnée.

Pourquoi ça marche: seule la bouteille empoisonnée apporte du poison. La bandelette `i` devient positive **si et seulement si** la bouteille empoisonnée a le bit `i` à 1. Le vecteur des résultats est exactement la représentation binaire de cette bouteille.

### Étiquettes 1..1000 vs 0..999

Les deux marchent.

* **0..999:** les motifs sont les nombres eux-mêmes. La bouteille 0 ne boit nulle part. Si toutes les bandelettes restent négatives, la bouteille 0 est empoisonnée (seulement si tu autorises la bouteille 0).
* **1..1000:** utilise le binaire de l'étiquette, ou de `label - 1`. Dis-le. `2^10 = 1024` couvre encore 1..1000.

Les interviewers veulent que tu **inventes la carte de bits**, pas que tu mémorises "indices à partir de 0".

### Variantes qu'on ramène

* **Plusieurs bouteilles empoisonnées:** un motif peut collisionner. Il faut plus de bandelettes ou un autre code (correction d'erreurs / group testing).
* **Bandelettes réutilisables sur plusieurs tours dans le temps:** autre problème; plus d'info au fil du temps.
* **Seulement k bandelettes, n bouteilles:** il faut `2^k >= n` pour un tour, ou plus de tours si le temps le permet.
* **Faux positifs:** alors il faut un codage redondant. Hors du 6.10 classique.

---

## 4. Solution Java (simulation)

Le puzzle se résout par le raisonnement. Le code montre que tu peux encoder et décoder sans off-by-one sur les indices de bits.

### Décoder les résultats vers un id de bouteille

```java
/**
 * positive[i] == true means strip i turned positive after one month.
 * Returns bottle id in 0 .. (2^strips - 1).
 */
static int decodePoisonedBottle(boolean[] positive) {
    int id = 0;
    for (int i = 0; i < positive.length; i++) {
        if (positive[i]) {
            id |= (1 << i);
        }
    }
    return id;
}
```

### De quelles bouteilles la bandelette i boit-elle?

```java
/**
 * Bottles are 0 .. bottleCount-1.
 * Strip i sips every bottle whose bit i is set.
 */
static boolean stripSipsBottle(int stripIndex, int bottleId) {
    return ((bottleId >> stripIndex) & 1) == 1;
}
```

### Simuler une vraie bouteille empoisonnée

```java
/**
 * bottleCount typically 1000, stripCount typically 10.
 * truePoisoned is 0-based in [0, bottleCount).
 */
static int identifyPoisoned(int truePoisoned, int bottleCount, int stripCount) {
    if (truePoisoned < 0 || truePoisoned >= bottleCount) {
        throw new IllegalArgumentException("truePoisoned out of range");
    }
    if ((1 << stripCount) < bottleCount) {
        throw new IllegalArgumentException("not enough strips for one round");
    }

    boolean[] positive = new boolean[stripCount];
    for (int strip = 0; strip < stripCount; strip++) {
        // strip turns positive iff the poisoned bottle has this bit set
        // (equivalent to mixing all bottles with that bit and waiting)
        positive[strip] = stripSipsBottle(strip, truePoisoned);
    }
    int found = decodePoisonedBottle(positive);
    if (found >= bottleCount) {
        throw new IllegalStateException("decoded id outside bottle range: " + found);
    }
    return found;
}
```

La boucle ci-dessus est le raccourci mathématique: tu n'as pas besoin de parcourir chaque bouteille si tu sais déjà laquelle est empoisonnée. En version "labo réel", tu construirais le mélange de chaque bandelette à partir de toutes les bouteilles qui matchent, et seul le vrai poison basculerait les bandelettes de la même façon.

### Construction explicite du mélange (plus claire pour enseigner)

```java
static int identifyPoisonedByMixing(int truePoisoned, int bottleCount, int stripCount) {
    boolean[] positive = new boolean[stripCount];
    for (int strip = 0; strip < stripCount; strip++) {
        boolean gotPoison = false;
        for (int bottle = 0; bottle < bottleCount; bottle++) {
            if (!stripSipsBottle(strip, bottle)) {
                continue;
            }
            // drop from this bottle goes on the strip
            if (bottle == truePoisoned) {
                gotPoison = true;
            }
        }
        positive[strip] = gotPoison;
    }
    return decodePoisonedBottle(positive);
}
```

### Auto-vérification des 1000 cas

```java
static void verifyAll() {
    int bottles = 1000;
    int strips = 10;
    for (int p = 0; p < bottles; p++) {
        int a = identifyPoisoned(p, bottles, strips);
        int b = identifyPoisonedByMixing(p, bottles, strips);
        if (a != p || b != p) {
            throw new AssertionError("failed for bottle " + p);
        }
    }
    System.out.println("ok: all " + bottles + " bottles identified");
}
```

### Nombres détaillés

Bouteille **326** empoisonnée, 10 bandelettes, ids à partir de 0:

```
326 in binary (bits 0 = LSB on the right when written normally):
  326 = 256 + 64 + 4 + 2
      = 2^8 + 2^6 + 2^2 + 2^1
  bits set: 1, 2, 6, 8

Strips that go positive: 1, 2, 6, 8
decode: (1<<1) | (1<<2) | (1<<6) | (1<<8) = 2 + 4 + 64 + 256 = 326
```

Petit cas à 3 bandelettes, bouteille 5:

```
positive = [true, false, true]  // strips 0 and 2
id = 1 | 4 = 5
```

### Optionnel: lister les bouteilles d'une bandelette (jour de prépa)

```java
static java.util.List<Integer> bottlesForStrip(int stripIndex, int bottleCount) {
    java.util.ArrayList<Integer> list = new java.util.ArrayList<>();
    for (int b = 0; b < bottleCount; b++) {
        if (stripSipsBottle(stripIndex, b)) {
            list.add(b);
        }
    }
    return list;
}
```

La bandelette 0 boit chaque bouteille impaire. La bandelette 9 boit les bouteilles dont le bit `2^9 = 512` est à 1 (512..1023 dans l'espace 10 bits; seules celles sous 1000 comptent).

---

## 5. Tableau de complexité

| Approche | Tours de test | Bandelettes | Notes |
| --- | --- | --- | --- |
| Une bouteille par bandelette | 1 | 10 | seulement 10 bouteilles couvertes |
| Groupes en recherche binaire | ~10 | 1+ | il faut un résultat avant la coupe suivante; ~10 mois |
| Encodage binaire par bits | **1** | 10 | couvre jusqu'à 1024 bouteilles |
| Mélanges au hasard sans plan | 1 | 10 | collisions ou trous en général |

En code, construire tous les mélanges en long est `O(bouteilles * bandelettes)`. Le décodage est `O(bandelettes)`. Le coût intéressant en entretien est **tours d'attente = 1**, pas le big-O CPU.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers poussent sur:

* **Bouteille 0 empoisonnée (base 0):** toutes les bandelettes négatives. C'est un codeword valide. Si les étiquettes commencent à 1, dis-le et ne prétends pas "tout négatif = pas de poison" sauf si le problème autorise zéro poison.
* **Bouteille 999:** les bits de 999 tiennent sur 10 bits (`999 < 1024`). OK.
* **Bouteille 1000 en 1-based:** encore OK; 1000 reste sous 1024.
* **Pas assez de bandelettes:** 9 bandelettes couvrent seulement 512 bouteilles. Énonce le check `2^k >= n`.
* **Numérotation MSB vs LSB des bandelettes:** choisis bandelette `i` = bit `i` et reste cohérent en encode et decode.
* **Retester après résultats:** interdit par la limite de temps. Ne décris pas un algo multi-tours sauf suivi demandé.
* **Deux bouteilles empoisonnées:** le OR de deux motifs peut ressembler à une troisième bouteille. Le classique suppose exactement une.
* **Capacité de la bandelette / nombre de gouttes:** ignore sauf contrainte ajoutée.

Erreurs fréquentes:

1. **Décrire une recherche binaire** et ignorer le verrou d'un mois par test.
2. **Utiliser les bandelettes comme "groupes de 100"** sans signature unique par bouteille.
3. **Off-by-one sur les étiquettes** (0 vs 1) et le decode se décale.
4. **Mélanger index de bit et index de bandelette** (encode bit 0 sur bandelette 0, decode bit 0 sur bandelette 9).
5. **Dire qu'il faut 1000 bandelettes** ou une par bouteille.
6. **Oublier que la bouteille 0 ne boit nulle part** et paniquer quand tout est propre.

Idée minimale de smoke:

```java
verifyAll();
System.out.println(identifyPoisoned(0, 1000, 10));   // 0
System.out.println(identifyPoisoned(5, 1000, 10));   // 5
System.out.println(identifyPoisoned(326, 1000, 10)); // 326
System.out.println(identifyPoisoned(999, 1000, 10)); // 999
System.out.println(bottlesForStrip(0, 8)); // odds: 1,3,5,7
```

---

## 7. Résumé pour un ami

Mille bouteilles, une empoisonnée, dix bandelettes, un mois.

1. Tu n'as qu'**un** tour de test. La recherche binaire est trop lente en temps calendaire.
2. Dix bandelettes donnent `2^10 = 1024` motifs de résultat. Assez pour nommer n'importe laquelle des 1000 bouteilles.
3. Numérote les bouteilles `0..999`. Écris chaque nombre en binaire.
4. La bandelette `i` boit chaque bouteille dont le bit `i` vaut `1`.
5. Après un mois, les bandelettes positives forment un nombre binaire. Ce nombre **est** la bouteille empoisonnée.
6. En code, encode avec `(bottle >> i) & 1`, decode avec `id |= (1 << i)` pour chaque bandelette positive.

Si tu peux expliquer pourquoi le vecteur de bandelettes égale l'id de bouteille sans coder, tu maîtrises le 6.10. Le chapitre 6 se ferme sur du pur design d'information: mesurer une fois, lire un motif de bits, et s'en aller.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [100 Lockers](/blog/fr/ctci-6-9-100-lockers)
* Suivant: [Deck of Cards](/blog/fr/ctci-7-1-deck-of-cards)