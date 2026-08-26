---
title: "Recursive Multiply: produit par doublement et moitié (Java)"
description: "Problème style CTCI 8.5 pour débutants: multiplier deux entiers positifs sans * ni /. Récursion sur la moitié du plus petit facteur, double le demi-produit, ajoute une fois si impair. Java simple."
date: "2025-12-29"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-5-recursive-multiply.webp
previewImage: /assets/images/ctci-8-5-recursive-multiply.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.5 pour débutants: multiplier deux entiers positifs sans * ni /. Récursion sur la moitié du plus petit facteur, double le demi-produit, ajoute une fois si impair. Java simple.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

La multiplication, c'est de l'addition répétée, mais ajouter `a` à lui-même `b` fois devient lent quand les deux nombres sont grands. On fait mieux avec **moitié et double**: on coupe le plus petit facteur en deux, on résout le sous-problème, puis on double la réponse (et on ajoute le plus grand facteur une fois si le plus petit était impair). Pas de `*`, pas de `/`. Seulement `+`, `-`, et des décalages de bits si tu veux.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de récursion en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et programmation dynamique, problème 8.5.

---

## 1. Analogie du quotidien

Imagine un parking de `lignes` par `colonnes`. Tu veux le nombre total de places sans multiplier les deux côtés.

* Compter place par place marche. Ça prend aussi une éternité si le parking est énorme.
* Mieux: compte la moitié des lignes, puis **double** ce total (ajoute le demi-total à lui-même). Tu viens de faire le double du travail d'un parking deux fois plus petit.
* Si le nombre de lignes est impair, moitié plus moitié laisse une ligne de côté. Ajoute une ligne complète de places à la fin.

Même idée pour les nombres. `7 * 8`, ce sont "sept huits". Calcule `3 * 8`, double pour six huits, puis ajoute un huit de plus car 7 est impair: `3*8 + 3*8 + 8`.

Diviser par deux réduit le travail. Doubler reconstruit le produit. Les restes impairs demandent une addition de plus du plus grand facteur.

---

## 2. Énoncé en clair

**Entrée:** deux entiers positifs `a` et `b` (parfois 0 est accepté; traite-le comme cas de base gratuit).

**Sortie:** le produit `a * b`.

**Contraintes de l'exercice:**

* N'utilise **pas** l'opérateur `*` (ni `/` pour diviser par deux si c'est interdit).
* Tu **peux** utiliser `+`, `-` et les décalages (`<<`, `>>`).
* Minimise le nombre de ces opérations (le travail logarithmique bat le linéaire).

**Exemples:**

| a | b | Produit | Idée |
| --- | --- | --- | --- |
| 7 | 8 | 56 | moitié de 7 = 3; `3*8=24`; double 48; +8 → 56 |
| 8 | 7 | 56 | échange pour que le plus petit soit 7; même chemin |
| 5 | 5 | 25 | moitié de 5 = 2; `2*5=10`; double 20; +5 → 25 |
| 1 | 99 | 99 | cas de base: le plus petit vaut 1 |
| 0 | 40 | 0 | cas de base: le plus petit vaut 0 |
| 16 | 3 | 48 | plus petit 3 impair; moitié 1; double 3 et ajoute 3 |

**Clarifie avant de coder:**

* Positifs seulement, ou zéros et négatifs aussi? Ici on reste sur non négatifs. Les négatifs sont de la comptabilité de signes sur le même noyau.
* Dépassement? Un produit en `int` peut déborder. Mentionne `long` si les valeurs dépassent 2³¹-1.
* `<< 1` comme double? Oui. `a + a` aussi, souvent plus clair au tableau.
* `>> 1` comme moitié? Oui. Si `/` est interdit, dis-le à voix haute.

---

## 3. Réfléchis d'abord

### Naïf: ajouter smaller fois

```
product = 0
répéter smaller fois:
    product += bigger
```

Correct. Temps O(smaller). OK pour de petits nombres. Faible si smaller vaut un million.

### Idée: produit de la moitié, puis double

Si `smaller` est pair:

```
smaller * bigger = 2 * ((smaller / 2) * bigger)
```

Si `smaller` est impair:

```
smaller * bigger = 2 * ((smaller / 2) * bigger) + bigger
```

Parce que `2 * floor(smaller/2) + 1 = smaller` quand c'est impair.

Tu n'as besoin que d'**un** appel récursif sur `smaller >> 1`, pas de deux moitiés indépendantes.

### Pourquoi ne pas récursiver sur les deux moitiés si impair

Un premier jet fait parfois:

```
side1 = minProduct(smaller >> 1, bigger)
side2 = minProduct(smaller - (smaller >> 1), bigger)  // si impair
return side1 + side2
```

Quand `smaller` est impair, la deuxième moitié n'égale pas la première. Tu lances deux arbres récursifs. Le travail se duplique. La mémoïsation corrige, mais la formule propre évite déjà le second arbre: double le demi-produit et ajoute `bigger` une fois.

### Toujours récursiver sur le plus petit facteur

`3 * 1000000` avec la boucle naïve ajouterait un million de fois si tu prends le mauvais côté. Échange pour que `smaller` soit min(a, b). La profondeur devient O(log min(a, b)).

### Trace: 7 × 8

```
minProduct(7, 8)
  half = 3
  halfProd = minProduct(3, 8)
    half = 1
    halfProd = minProduct(1, 8) = 8
    3 impair → 8 + 8 + 8 = 24
  7 impair → 24 + 24 + 8 = 56
```

Trois étapes récursives. La boucle naïve aurait ajouté 8 sept fois.

### Trace: 16 × 3 (après swap: smaller = 3)

```
minProduct(3, 16)
  halfProd = minProduct(1, 16) = 16
  3 impair → 16 + 16 + 16 = 48
```

---

## 4. Solution Java

Version préférée en entretien: un appel récursif, double en additionnant le demi-produit à lui-même, ajoute `bigger` si impair.

```java
/**
 * Multiply two non-negative ints without using * or /.
 * Recurses on half the smaller factor: O(log min(a, b)) adds.
 */
public static int minProduct(int a, int b) {
    int bigger = a < b ? b : a;
    int smaller = a < b ? a : b;
    return minProductHelper(smaller, bigger);
}

private static int minProductHelper(int smaller, int bigger) {
    if (smaller == 0) {
        return 0;
    }
    if (smaller == 1) {
        return bigger;
    }

    int half = smaller >> 1; // floor divide by 2
    int halfProd = minProductHelper(half, bigger);

    if ((smaller & 1) == 0) {
        // even: 2 * half * bigger
        return halfProd + halfProd;
    } else {
        // odd: 2 * floor(smaller/2) * bigger + bigger
        return halfProd + halfProd + bigger;
    }
}
```

### Optionnel: doubler avec un décalage

```java
// same meaning as halfProd + halfProd when halfProd >= 0
return halfProd << 1;
// odd case:
return (halfProd << 1) + bigger;
```

Les décalages ont l'air malins. `halfProd + halfProd` se raconte mieux sous stress. Les deux passent si tu expliques.

### Version faible qu'on écrit d'abord (connais-la, puis améliore)

```java
// Linear: O(smaller) additions. Say it, then replace it.
private static int minProductNaive(int smaller, int bigger) {
    int sum = 0;
    for (int i = 0; i < smaller; i++) {
        sum += bigger;
    }
    return sum;
}
```

Les intervieweurs aiment entendre d'abord O(s), puis la version log.

### Tableau de parcours: 7 × 8

| Appel | half | halfProd | parité | retour |
| --- | --- | --- | --- | --- |
| helper(7, 8) | 3 | helper(3, 8) → 24 | impair | 24+24+8 = 56 |
| helper(3, 8) | 1 | helper(1, 8) → 8 | impair | 8+8+8 = 24 |
| helper(1, 8) | - | - | base | 8 |

### Tests minimaux

```java
public static void main(String[] args) {
    System.out.println(minProduct(7, 8));   // 56
    System.out.println(minProduct(8, 7));   // 56
    System.out.println(minProduct(5, 5));   // 25
    System.out.println(minProduct(1, 99));  // 99
    System.out.println(minProduct(0, 40));  // 0
    System.out.println(minProduct(16, 3));  // 48
    System.out.println(minProduct(2, 2));   // 4
}
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Ajouter `bigger`, `smaller` fois | O(s) | O(1) | base correcte |
| Deux moitiés récursives si impair | ~O(s) pire sans mémo | O(log s) pile | double le travail |
| Deux moitiés + tableau mémo | O(s) remplissages possibles | O(s) mémo + pile | mieux, pas le meilleur récit |
| Un appel sur la moitié, double, +bigger si impair | O(log s) | O(log s) pile | préféré |

Ici `s = min(a, b)`. Le chemin préféré divise `s` par deux à chaque appel, donc la profondeur et le nombre d'additions sont logarithmiques en `s`.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs touchent à ça:

* **Zéro** → `0 * x = 0`. Cas de base. N'entre pas dans une boucle d'additions infinie.
* **Un** → renvoie l'autre facteur tout de suite.
* **Les deux égaux** → ça marche; le swap ne fait rien si `a == b`.
* **Plus petit en puissance de deux** → chemin de purs doubles après les moitiés paires.
* **Gros produit** → le dépassement `int` est réel. Dis que tu utiliserais `long` en production.
* **Négatifs** → l'énoncé dit souvent positifs. Si on demande: enlève les signes, multiplie les absolus, réapplique le signe. Toujours sans `*`.

Erreurs fréquentes:

1. **Oublier de mettre le plus petit facteur en premier.** Le produit est juste, mais la profondeur suit le grand nombre.
2. **Deux appels récursifs sur impair sans mémo.** Ça marche, c'est lent, dur à analyser. Préfère double + add.
3. **Utiliser `smaller % 2` alors que le thème est les bits.** OK, mais `(smaller & 1) == 0` colle mieux à "bits autorisés".
4. **Diviser avec `/ 2` si `/` est interdit.** Utilise `>> 1` et dis-le.
5. **Renvoyer `halfProd << 1` avec halfProd négatif.** Pas un souci pour des entrées non négatives; préfère `+` si les signes arrivent plus tard.
6. **Muter des globaux ou allouer une grille de cellules.** La grille est une image mentale, pas la structure que tu crées.

---

## 7. Recap à raconter à un ami

Recursive Multiply demande: le produit de deux entiers non négatifs sans `*` ni `/`, avec le moins d'additions possible.

1. Multiplier, c'est additionner plusieurs fois. Ajouter `s` fois est la base honnête.
2. Récursive toujours sur le **plus petit** facteur pour que le travail suive `min(a, b)`.
3. Calcule `halfProd = product(floor(s/2), bigger)` une seule fois.
4. Si `s` est pair, la réponse est `halfProd + halfProd`. Si impair, ajoute `bigger` une fois de plus.
5. Cas de base: `0 → 0`, `1 → bigger`. Temps O(log s), pile O(log s).

Si tu peux descendre `7 × 8` jusqu'à 56 au tableau et expliquer pourquoi un seul appel récursif bat deux demi-produits, tu maîtrises le problème 8.5.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Power Set](/blog/fr/ctci-8-4-power-set)
* Suivant: [Towers of Hanoi](/blog/fr/ctci-8-6-towers-of-hanoi)