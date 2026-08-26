---
title: "100 casiers: lesquels restent ouverts après 100 bascules ? (Java)"
description: "Problème style CTCI 6.9 pour débutants: 100 casiers fermés, 100 personnes basculent chaque i-ème porte. Les ouverts sont les carrés parfaits (1, 4, 9, ..., 100) car seuls les carrés ont un nombre impair de facteurs. Simulation Java optionnelle."
date: "2026-06-17"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-9-100-lockers.webp
previewImage: /assets/images/ctci-6-9-100-lockers.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.9 pour débutants: 100 casiers fermés, 100 personnes basculent chaque i-ème porte. Les ouverts sont les carrés parfaits (1, 4, 9, ..., 100) car seuls les carrés ont un nombre impair de facteurs. Simulation Java optionnelle.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Il y a **100 casiers** dans un couloir, tous **fermés**. **100 personnes** passent. La personne `i` bascule chaque casier multiple de `i`: la personne 1 touche tout, la 2 touche 2, 4, 6, ..., la 100 ne touche que le 100. Quand tout le monde a fini, **quels casiers sont ouverts ?**

Tu peux simuler tout le couloir avec des boucles. Ça marche, et en entretien on peut te demander le code. La vraie réponse est plus nette: **seuls les casiers carrés parfaits restent ouverts** (`1, 4, 9, 16, 25, 36, 49, 64, 81, 100`). Chaque casier commence fermé et bascule une fois par diviseur. Seuls les carrés ont un nombre **impair** de diviseurs, donc seuls eux finissent ouverts.

Ce billet est un enseignement original pour débutants, avec **Java** optionnel pour simuler les bascules. Même famille de puzzles d'entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, maths et logique, problème 6.9.

---

## 1. Analogie du quotidien

Imagine un couloir d'école avec 100 casiers en métal. Chaque porte commence fermée.

Une file d'élèves passe. L'élève 1 ouvre ou ferme chaque porte (donc toutes s'ouvrent). L'élève 2 touche une porte sur deux (en ferme la moitié). L'élève 3 touche une sur trois, et ainsi de suite jusqu'à l'élève 100, qui ne touche que le casier 100.

Pas besoin de suivre chaque élève. Change de question: **combien de fois le casier `k` est-il touché ?** Une fois pour chaque nombre qui divise `k`. Le 12 est touché par 1, 2, 3, 4, 6 et 12: six fois. Six est pair, il finit fermé (départ fermé, un nombre pair de bascules le laisse fermé). Le 16 est touché par 1, 2, 4, 8 et 16: cinq fois. Impair, il finit ouvert.

Les comptages impairs n'apparaissent que lorsqu'un facteur se "paire avec lui-même": les carrés parfaits.

---

## 2. Énoncé en mots simples

**Mise en place:**

* 100 casiers, numérotés de 1 à 100.
* Tous commencent **fermés**.
* 100 personnes, numérotées de 1 à 100.
* La personne `i` bascule les casiers `i, 2i, 3i, ...` (chaque multiple de `i` au plus égal à 100).
* Basculer: fermé devient ouvert, ouvert devient fermé.

**Objectif:** après la personne 100, lister (ou compter) les casiers ouverts.

**Hypothèses à énoncer en entretien:**

* Casiers et personnes sont 1-based, 1..100.
* Exactement un passage par personne, dans l'ordre (l'ordre ne change pas l'état final; chaque casier bascule une fois par diviseur).
* Aucune autre opération entre les passages.

**Forme de signature si tu codes un simulateur:**

```java
// returns true if locker is open after the full process (1-based indices in comments)
boolean[] openLockers(int n);
```

Ou juste renvoyer les indices ouverts:

```java
// simulate n lockers / n people; return list of open locker numbers (1-based)
List<Integer> openAfterProcess(int n);
```

**Petit aperçu numérique (n = 10):**

| Casier | Diviseurs (qui bascule) | Compte | Final (départ fermé) |
| --- | --- | --- | --- |
| 1 | 1 | 1 impair | ouvert |
| 2 | 1, 2 | 2 pair | fermé |
| 3 | 1, 3 | 2 pair | fermé |
| 4 | 1, 2, 4 | 3 impair | ouvert |
| 5 | 1, 5 | 2 pair | fermé |
| 6 | 1, 2, 3, 6 | 4 pair | fermé |
| 7 | 1, 7 | 2 pair | fermé |
| 8 | 1, 2, 4, 8 | 4 pair | fermé |
| 9 | 1, 3, 9 | 3 impair | ouvert |
| 10 | 1, 2, 5, 10 | 4 pair | fermé |

Ouverts pour n = 10: **1, 4, 9**. Pour n = 100: **1, 4, 9, ..., 100** (dix portes).

---

## 3. Réfléchis d'abord

### Force brute d'abord

Deux boucles imbriquées:

```
lockers[1..n] = closed
for person p = 1..n:
    for locker k = p, 2p, 3p, ... <= n:
        toggle lockers[k]
```

C'est O(n²) dans une forme naïve; en réalité environ O(n log n) bascules au total car la personne `p` touche `n/p` portes. Suffisant pour n = 100. On veut quand même le **pourquoi**.

### Qui bascule le casier k ?

La personne `p` touche le casier `k` seulement si `p` divise `k`. Donc le casier `k` bascule **une fois par diviseur positif** de `k`.

Départ fermé:

* Nombre pair de bascules → fermé
* Nombre impair de bascules → ouvert

Les ouverts sont exactement ceux qui ont un **nombre impair de diviseurs**.

### Quand le nombre de diviseurs est-il impair ?

Les diviseurs vont souvent par paires: si `d` divise `k`, `k/d` aussi, et `d ≠ k/d` sauf si `d² = k`.

Exemple pour 12:

```
1 × 12
2 × 6
3 × 4
```

Six diviseurs distincts, trois paires.

Exemple pour 16:

```
1 × 16
2 × 8
4 × 4   // sqrt pairs with itself
```

Diviseurs: 1, 2, 4, 8, 16. Cinq valeurs. Le facteur du milieu ne compte qu'une fois.

**Seuls les carrés parfaits** ont un diviseur qui est la racine carrée "appariée à elle-même", donc seuls eux ont un compte impair.

Donc les casiers ouverts sont:

```
1², 2², 3², ..., floor(sqrt(n))²
```

Pour n = 100: `1, 4, 9, 16, 25, 36, 49, 64, 81, 100`. Compte: **10**.

### Forme fermée pour le compte

Le nombre de casiers ouverts pour un n général est `floor(sqrt(n))`. Plus besoin de simuler une fois le théorème en poche.

### Pourquoi c'est "maths et logique", pas de la trivia de code

N'importe qui écrit la double boucle. Le gain en entretien, c'est de relier **parité des bascules** à **parité des diviseurs** à **carrés parfaits**. Dis cette chaîne à voix haute avant de toucher le clavier.

### Variantes qu'on ramène souvent

* **Départ ouvert au lieu de fermé:** inverse l'état final (ou redéfinis "ouvert"). Toujours préciser l'état initial.
* **n n'est pas 100:** même règle; ouverts = carrés jusqu'à n.
* **Seulement le compte, pas la liste:** la réponse est `floor(sqrt(n))`.
* **"Quelles personnes laissent un casier ouvert ?"** Toujours les indices carrés; les personnes ne "possèdent" pas l'état final, les bascules oui.

---

## 4. Solution Java (simulation)

Le raisonnement suffit. Le code prouve l'affirmation pour n = 100 et n général.

### Simulation complète

```java
import java.util.ArrayList;
import java.util.List;

/** Simulate n lockers / n people. Returns 1-based open locker numbers. */
static List<Integer> openAfterProcess(int n) {
    boolean[] open = new boolean[n + 1]; // index 0 unused; false = closed
    for (int person = 1; person <= n; person++) {
        for (int locker = person; locker <= n; locker += person) {
            open[locker] = !open[locker];
        }
    }
    List<Integer> result = new ArrayList<>();
    for (int k = 1; k <= n; k++) {
        if (open[k]) {
            result.add(k);
        }
    }
    return result;
}
```

### Réponse purement mathématique (à dire en premier)

```java
/** Open lockers are perfect squares: 1, 4, 9, ..., floor(sqrt(n))^2. */
static List<Integer> openBySquares(int n) {
    List<Integer> result = new ArrayList<>();
    for (int i = 1; i * i <= n; i++) {
        result.add(i * i);
    }
    return result;
}
```

### Auto-vérification contre la simulation

```java
static void verify(int n) {
    List<Integer> sim = openAfterProcess(n);
    List<Integer> math = openBySquares(n);
    if (!sim.equals(math)) {
        throw new AssertionError("mismatch for n=" + n + " sim=" + sim + " math=" + math);
    }
    System.out.println("ok n=" + n + " open=" + math + " count=" + math.size());
}

// verify(10);  // [1, 4, 9]
// verify(100); // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

### Compte sans liste

```java
static int countOpen(int n) {
    return (int) Math.floor(Math.sqrt(n));
    // or integer loop: int c = 0; for (int i = 1; i * i <= n; i++) c++; return c;
}
```

Pour n = 100, `floor(sqrt(100)) = 10`.

### Nombres travaillés pour le casier 36

Diviseurs de 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Ce sont **9** (impair).

```
start closed
after 1: open
after 2: closed
after 3: open
after 4: closed
after 6: open
after 9: closed
after 12: open
after 18: closed
after 36: open
```

Finit ouvert. 36 = 6².

Casier 50: diviseurs 1, 2, 5, 10, 25, 50. Six fois, pair, finit fermé.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Simulation double boucle | O(n log n) bascules | O(n) pour le tableau booléen | clair, bien en round de code |
| Lister les carrés `i*i <= n` | O(sqrt(n)) | O(sqrt(n)) pour la liste | optimal une fois l'idée connue |
| Compte seul `floor(sqrt(n))` | O(1) avec `Math.sqrt`, ou O(sqrt(n)) en entiers | O(1) | mieux s'ils demandent seulement "combien" |
| Factoriser chaque k et compter les diviseurs | O(n sqrt(n)) naïf | O(1) hors sortie | correct mais plus lent; enseigne la vue diviseurs |

Pour n = 100 tout est instantané. Pour un n énorme, préfère la liste de carrés ou le compte floor-sqrt.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers piquent ici:

* **n = 1:** seul le casier 1, la personne 1 l'ouvre. Ouverts: `[1]`.
* **n = 0 ou négatif:** vide; rejette dans le code.
* **Tableaux off-by-one:** en Java ils sont 0-based; laisse l'index 0 inutilisé ou mappe avec soin.
* **Départ ouvert:** inverse la réponse. Confirme que l'énoncé dit fermés au départ.
* **La personne i ne bascule-t-elle que le casier i ?** Non: aussi les multiples. Certains oublient et ne touchent que `i`.
* **sqrt flottant pour le compte:** `Math.sqrt` suffit jusqu'aux carrés entiers exacts en double vers 2^53; pour un `long` énorme préfère une recherche binaire entière du floor sqrt, ou un cast prudent.
* **"Tous les casiers touchés par la personne 1 restent ouverts à la fin"** faux; plus tard beaucoup se ferment.

Erreurs courantes:

1. **Simuler seulement la personne 1 et la 100** et deviner des motifs sans diviseurs.
2. **Dire que les premiers restent ouverts** (non: un premier a exactement deux diviseurs, compte pair, fermé).
3. **Inclure des non-carrés qui "semblent spéciaux"** (puissances de deux, etc.).
4. **Compter 0 comme casier carré** alors que les casiers vont de 1 à n.
5. **O(n²) avec `for k=1..n if k % p == 0`** alors que `for locker = p; locker <= n; locker += p` est plus propre et plus rapide.

Idée minimale de fumée:

```java
verify(1);
verify(10);
verify(100);
System.out.println(countOpen(100)); // 10
System.out.println(openBySquares(100));
// [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

---

## 7. Récap à expliquer à un ami

Cent casiers, tous fermés. Cent personnes. La personne i bascule chaque i-ème porte.

1. Le casier k bascule une fois pour chaque diviseur de k.
2. Départ fermé: bascules impaires → ouvert, paires → fermé.
3. Les diviseurs se mettent par paires, sauf quand k est un carré parfait (la racine ne compte qu'une fois).
4. Donc les ouverts sont **1, 4, 9, ..., 100**. Il y en a **10** (`floor(sqrt(100))`).
5. Le code peut simuler avec un tableau booléen, ou émettre `i*i` tant que `i*i <= n`.

Si tu peux dire "nombre impair de facteurs, seulement les carrés" sans dessiner toute la table, le problème 6.9 est à toi. Le chapitre 6 récompense ce style: un invariant bat un tas de détails de simulation.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [The Egg Drop Problem](/blog/fr/ctci-6-8-the-egg-drop-problem)
* Suivant: [Poison](/blog/fr/ctci-6-10-poison)