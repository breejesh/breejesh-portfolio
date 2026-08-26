---
title: "Triple Step: compter les façons de monter n marches avec des sauts de 1, 2 ou 3 (Java)"
description: "Problème style CTCI 8.1 pour débutants: un enfant monte n marches en pas de 1, 2 ou 3. Compter les façons avec récursion, mémoïsation et DP bottom-up en Java."
date: "2026-01-04"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-1-triple-step.webp
previewImage: /assets/images/ctci-8-1-triple-step.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.1 pour débutants: un enfant monte n marches en pas de 1, 2 ou 3. Compter les façons avec récursion, mémoïsation et DP bottom-up en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un enfant monte un escalier de **n** marches. À chaque mouvement, il peut prendre **1**, **2** ou **3** marches. L'ordre compte: 1 puis 2 n'est pas la même chose que 2 puis 1. Combien de façons distinctes d'arriver en haut?

C'est l'échauffement classique de la **récursion et de la programmation dynamique**. Tu écris d'abord la récurrence, tu vois l'arbre d'appels exploser, puis tu caches les réponses (memo) ou tu remplis un tableau du bas vers le haut (bottom-up). Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien sur l'escalier, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 8 commence ici.

---

## 1. Analogie du quotidien

Imagine un enfant sur une échelle de jeu avec `n` barreaux jusqu'à la plateforme.

* Depuis n'importe quelle hauteur, il peut sauter un, deux ou trois barreaux (s'il en reste assez).
* Chaque séquence de sauts est une "route" différente, même si les mêmes tailles reviennent dans un autre ordre.
* Sur une petite échelle, tu listes toutes les séquences à la main.
* Sur une grande, lister meurt. Tu remarques: le nombre de façons de finir depuis la hauteur `i` ne dépend que des façons depuis `i-1`, `i-2` et `i-3`.

Cette dernière phrase est tout l'algorithme. Une fois la récurrence digérée, la mémoïsation et le DP bottom-up ne sont que deux manières de la calculer sans refaire le travail.

---

## 2. Énoncé simple

**Entrée:** un entier non négatif `n` (nombre de marches).

**Sortie:** le nombre de façons de monter `n` marches avec des pas de taille 1, 2 ou 3 seulement. L'ordre compte.

**Forme de la signature:**

```java
long countWays(int n);
```

Utilise `long` (ou `BigInteger` pour un `n` énorme) car la réponse grossit vite. En entretien on utilise souvent `int` pour un petit `n`; dis le risque d'overflow à voix haute.

**Petites valeurs à connaître par cœur:**

| n | Façons | Séquences (esquisse) |
| --- | --- | --- |
| 0 | 1 | une façon vide: déjà en haut |
| 1 | 1 | `(1)` |
| 2 | 2 | `(1,1)`, `(2)` |
| 3 | 4 | `(1,1,1)`, `(1,2)`, `(2,1)`, `(3)` |
| 4 | 7 | quatre avec dernier saut 1, deux avec dernier 2, une avec dernier 3 |

Pour `n = 4`, un dernier saut de taille 1 signifie que les trois premières marches avaient 4 façons; dernier 2, les deux premières en avaient 2; dernier 3, la première en avait 1. Total `4 + 2 + 1 = 7`.

**Clarifie en entretien:**

* `n = 0` est-il autorisé? Cas de base pédagogique courant: **1** façon (ne rien faire). Certains disent 0; choisis une option et reste cohérent avec la récurrence.
* L'ordre compte-t-il? **Oui.** Combinaisons vs permutations: ici ce sont les séquences.
* Seulement les pas `{1,2,3}`? Oui pour ce problème. Généralise plus tard si on te le demande.
* Type de retour et overflow? Dis-le.
* `n` négatif? Invalide; renvoie 0 ou lève une erreur.

---

## 3. Réfléchis d'abord

### Récurrence

Soit `ways(n)` le nombre de façons de monter `n` marches.

Pour finir `n` marches, le **dernier saut** était 1, 2 ou 3 (quand `n` est assez grand):

```
ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)   for n > 3
```

Cas de base (avec le modèle "montée vide compte pour 1"):

```
ways(0) = 1
ways(1) = 1
ways(2) = 2
```

Tu peux aussi poser:

```
ways(0) = 1
ways(negative) = 0
```

et utiliser une seule formule récursive pour tout `n > 0`:

```
ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)
```

les négatifs contribuant zéro. Mêmes nombres.

### Pourquoi la récursion naïve est lente

```
ways(5)
  ways(4)
    ways(3) ...
    ways(2) ...
    ways(1) ...
  ways(3) ...
  ways(2) ...
```

`ways(3)` est calculé plein de fois. L'arbre d'appels est exponentiel. Correct pour `n ≤ 10` au tableau; meurt pour un `n` plus grand.

### Mémoïsation (DP top-down)

Même structure récursive, mais tu stockes `ways(i)` la première fois que tu le calcules. Les appels suivants renvoient la valeur stockée. Chaque `i` de `0` à `n` est rempli une fois, donc le temps devient linéaire.

### DP bottom-up

Alloue un tableau `dp[0..n]`. Pose les cas de base, puis pour `i = 3..n` (ou `i = 1..n` avec des négatifs soignés):

```
dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]
```

Pas de pile de récursion. Facile à réduire à trois variables glissantes si tu n'as besoin que de `ways(n)`.

### Lien avec Fibonacci

Monter avec seulement `1` ou `2` est Fibonacci. Triple step est la même idée avec une récurrence à trois termes (style tribonacci). Le nom est optionnel; la récurrence compte.

---

## 4. Solution Java

### Récursion naïve (montre, puis améliore)

```java
// Exponential. Good for teaching the recurrence only.
long countWaysNaive(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    return countWaysNaive(n - 1)
        + countWaysNaive(n - 2)
        + countWaysNaive(n - 3);
}
```

### Top-down avec tableau memo

```java
long countWaysMemo(int n) {
    if (n < 0) {
        return 0;
    }
    long[] memo = new long[n + 1];
    java.util.Arrays.fill(memo, -1);
    return ways(n, memo);
}

long ways(int n, long[] memo) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (memo[n] != -1) {
        return memo[n];
    }
    memo[n] = ways(n - 1, memo)
        + ways(n - 2, memo)
        + ways(n - 3, memo);
    return memo[n];
}
```

`memo[i] == -1` signifie "pas encore calculé." Après le premier remplissage, chaque sous-problème est O(1).

### Tableau bottom-up

```java
long countWaysBottomUp(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }

    // dp[i] = ways to climb i stairs
    long[] dp = new long[n + 1];
    dp[0] = 1;
    if (n >= 1) {
        dp[1] = 1;
    }
    if (n >= 2) {
        dp[2] = 2;
    }

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
    }
    return dp[n];
}
```

### Bottom-up avec espace extra O(1)

Tu n'as besoin que des trois dernières valeurs:

```java
long countWaysRolling(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (n == 1) {
        return 1;
    }
    if (n == 2) {
        return 2;
    }

    long a = 1; // ways(0) after shift thinking, or track ways(i-3)
    long b = 1; // ways(1)
    long c = 2; // ways(2)
    // After loop for i, c holds ways(i)
    for (int i = 3; i <= n; i++) {
        long next = a + b + c;
        a = b;
        b = c;
        c = next;
    }
    return c;
}
```

Parcours pour `n = 4`:

| i | a (i-3) | b (i-2) | c (i-1) | next |
| --- | --- | --- | --- | --- |
| départ | 1 | 1 | 2 | |
| 3 | 1 | 2 | 4 | 1+1+2=4 |
| 4 | 2 | 4 | 7 | 1+2+4=7 |

Réponse `7`. Ça colle au tableau.

### Contrôles minimaux

```java
assert countWaysBottomUp(0) == 1;
assert countWaysBottomUp(1) == 1;
assert countWaysBottomUp(2) == 2;
assert countWaysBottomUp(3) == 4;
assert countWaysBottomUp(4) == 7;
assert countWaysBottomUp(5) == 13;
assert countWaysMemo(10) == countWaysBottomUp(10);
assert countWaysRolling(10) == countWaysBottomUp(10);
assert countWaysNaive(5) == 13;
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Récursion naïve | O(3^n) approx. | O(n) pile | Enseignement seulement |
| Memo top-down | O(n) | O(n) memo + pile | Même récurrence, mise en cache |
| Tableau bottom-up | O(n) | O(n) | Clair et confortable en entretien |
| Trois variables glissantes | O(n) | O(1) | Meilleur espace si seul `ways(n)` compte |

Toutes les méthodes linéaires visitent chaque sous-problème un nombre constant de fois. L'arbre exponentiel est ce que tu dois nommer et corriger.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs poussent ici:

* **`n = 0`:** 1 avec le modèle de façon vide; annonce ton choix.
* **`n = 1, 2, 3`:** en dur ou dérivés avec soin pour que la boucle ne lise pas hors du tableau.
* **`n` négatif:** renvoie 0 (ou refuse).
* **Grand `n`:** `int` déborde après de petites valeurs à deux chiffres; préfère `long` et mentionne l'arithmétique modulaire s'ils veulent "façons mod 10^9+7".
* **Off-by-one dans la boucle:** `for (i = 3; i <= n; i++)` exige un `dp` de taille `n + 1`.
* **Traiter l'ordre comme sans importance:** `(1,2)` et `(2,1)` sont deux façons, pas une combinaison.
* **Mauvaise base pour `ways(0)`:** si tu mets `ways(0) = 0`, toute la table glisse; reste cohérent avec l'argument du dernier saut.
* **Memo non initialisé:** utilise un sentinelle (`-1`) ou un flag "vu" pour ne pas confondre "pas encore calculé" avec une vraie valeur zéro quand c'est pertinent.

Erreurs fréquentes:

1. **Écrire Fibonacci à deux pas** alors que le problème en autorise trois.
2. **Oublier `ways(n - 3)`** dans la somme.
3. **Renvoyer sans mettre en cache** dans la version memo (ça annule l'intérêt).
4. **Overflow d'entiers** qui donne des réponses fausses sans bruit vers `n` 40+.
5. **Confondre "nombre de façons" et "nombre minimal de sauts"** (autre problème).

---

## 7. Résumé pour un ami

Triple step en une respiration:

1. Le dernier saut est 1, 2 ou 3, donc `ways(n) = ways(n-1) + ways(n-2) + ways(n-3)`.
2. Base: `ways(0)=1`, `ways(1)=1`, `ways(2)=2` (et les négatifs valent 0).
3. La récursion naïve recalcule les mêmes sous-problèmes sans fin. Cache-les ou construis bottom-up.
4. Le tableau bottom-up est la réponse propre au tableau blanc. Trois variables glissantes sont le poli d'espace.
5. Tu comptes des **séquences**, pas des multi-ensembles sans ordre. Attention à l'overflow.

Si tu peux écrire la récurrence, remplir `dp[0..n]` pour `n = 5` à la main (réponse 13) et expliquer pourquoi le memo transforme l'exponentiel en linéaire, tu maîtrises le problème 8.1. Le chapitre 8 est ouvert: ensuite, un robot sur une grille avec des cases bloquées.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Hash Table](/blog/fr/ctci-7-12-hash-table)
* Suivant: [Robot in a Grid](/blog/fr/ctci-8-2-robot-in-a-grid)