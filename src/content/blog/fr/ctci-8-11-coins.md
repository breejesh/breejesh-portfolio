---
title: "Coins: nombre de façons de faire la monnaie (Java)"
description: "Problème style CTCI 8.11 pour débutants: compter les combinaisons qui font n cents avec des pièces de 25, 10, 5 et 1. DP bottom-up du rendu de monnaie, l'ordre ne compte pas, Java clair."
date: "2026-01-14"
tags: [Algorithmes et Structures, Outils Développeur]
coverImage: /assets/images/ctci-8-11-coins.webp
previewImage: /assets/images/ctci-8-11-coins.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.11 pour débutants: compter les combinaisons qui font n cents avec des pièces de 25, 10, 5 et 1. DP bottom-up du rendu de monnaie, l'ordre ne compte pas, Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as des pièces en nombre illimité pour quelques valeurs fixes. On te demande: combien de piles différentes font exactement `n` cents? Pas le plus petit nombre de pièces. Le **nombre de combinaisons**. C'est le problème classique **Coins**: pièces de 25, 10, 5 et 1, et un montant cible.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de combinaisons de monnaie en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et programmation dynamique, problème 8.11.

---

## 1. Analogie du quotidien

Imagine un distributeur qui n'accepte que 25, 10, 5 et 1. Tu dois payer exactement 30 cents. Peu importe quelle pièce tombe en premier. Trois pièces de 10, c'est une façon. Une de 25 et une de 5, c'en est une autre. Six de 5, encore une autre. L'ordre dans la fente ne crée pas une nouvelle façon.

Si l'ordre comptait, trois pièces de 10 exploseraient en de nombreuses permutations des mêmes trois pièces. En entretien on veut presque toujours des **combinaisons**: le même multiensemble de pièces compte pour une seule façon.

Un petit tableau "combien de façons pour chaque montant" est plus simple que d'inventer chaque pile à la main. Ce tableau, c'est de la programmation dynamique.

---

## 2. Énoncé en mots simples

**Entrée:** un entier non négatif `n` (cents à former). Optionnellement une liste de dénominations; l'ensemble classique est `{25, 10, 5, 1}`.

**Sortie:** le nombre de **combinaisons distinctes** de ces pièces qui somment exactement à `n`. Les pièces de même valeur sont identiques. Tu peux en utiliser autant que tu veux de chaque type (stock illimité).

**Exemples** avec les pièces `{25, 10, 5, 1}`:

| n | Façons (idée) | Compte |
| --- | --- | --- |
| 0 | pile vide | 1 |
| 1 | un centime | 1 |
| 5 | cinq centimes; un nickel | 2 |
| 10 | voir le parcours plus bas | 4 |
| 30 | beaucoup de mélanges 25/10/5/1 | 18 |

Façons pour `n = 10` (chaque ligne est une combinaison):

```
10×1
1×5 + 5×1
2×5
1×10
```

C'est 4. Tu ne comptes **pas** `5 puis 5` comme différent de `5 puis 5` à l'envers; les nickels sont identiques.

**Clarifie avant de coder:**

* Combinaisons ou permutations? Combinaisons (l'ordre ne compte pas).
* Stock illimité de chaque dénomination? Oui, sauf consigne contraire.
* Que vaut `ways(0)`? En général **1** (une combinaison vide). Dis-le à voix haute.
* `n` négatif? Renvoie 0, ou suppose `n >= 0`.
* Type de retour? `int` suffit pour les tailles d'entretien; mentionne `long` si `n` peut grossir.
* Pièces fixes ou tableau générique? Code le tableau générique; démo avec `{25, 10, 5, 1}`.

---

## 3. Réfléchis d'abord

### Récursion brute

Choisis un type de pièce à la fois pour que l'ordre ne se glisse pas. Pour l'indice de pièce `i` et le reste `rem`:

* Si `rem == 0`, compte 1.
* Si `rem < 0` ou plus de types, compte 0.
* Sinon essaie 0, 1, 2, ... copies de `coins[i]`, et récure sur le type suivant avec le reste.

Cela explore chaque combinaison une fois. Sans mémo, c'est lent: beaucoup de sous-problèmes qui se chevauchent comme "façons avec les pièces à partir de l'indice 2 et rem = 40".

### Récursion avec mémo

Cache sur `(coinIndex, remaining)`. Même logique, bien plus rapide. Toujours un état à deux dimensions.

### DP bottom-up (réponse par défaut en entretien)

Construis un tableau `ways[0 .. n]` où `ways[a]` signifie "nombre de combinaisons qui somment à `a`".

```
ways[0] = 1
for each coin c in coins:
    for a from c to n:
        ways[a] += ways[a - c]
```

Pourquoi l'ordre des boucles compte:

| Boucle externe | Boucle interne | Ce que tu comptes |
| --- | --- | --- |
| pièces, puis montants | comme ci-dessus | **combinaisons** (chaque multiensemble une fois) |
| montants, puis pièces | inverse les boucles | **permutations** (l'ordre compte) |

Tu veux la première table. Chaque pièce est pleinement "introduite" avant de passer à la suivante, donc les séquences qui ne diffèrent que par l'ordre s'effondrent en un seul chemin dans le tableau.

Intuition d'une étape: une fois la pièce `c` disponible, chaque ancienne façon de faire `a - c` devient une façon de faire `a` en ajoutant une `c`. Tu peux ajouter plusieurs `c` sur des mises à jour successives du même tableau parce que la boucle interne monte.

### Petit parcours: n = 10, coins = [1, 5, 10]

Départ: `ways = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]`

Après la pièce 1 (seulement des centimes): chaque montant a 1 façon.

Après la pièce 5:

* montant 5: `ways[5] += ways[0]` → 2
* montant 6: `ways[6] += ways[1]` → 2
* ...
* montant 10: les façons avec nickels s'accumulent

Après la pièce 10: `ways[10] += ways[0]` ajoute la combinaison d'un dime pur. Final `ways[10] = 4`.

### Pourquoi pas le DP "min pièces"

Le problème célèbre du "plus petit nombre de pièces" stocke une longueur minimale. Celui-ci stocke un **compte**. Même forme de boucles imbriquées, récurrence différente:

* min: `dp[a] = min(dp[a], dp[a - c] + 1)`
* ways: `ways[a] += ways[a - c]`

Ne les mélange pas pendant l'entretien.

### Esquisse au tableau

1. Écris les dénominations `25, 10, 5, 1`.
2. Dessine `ways[0]=1`, le reste à zéro.
3. Traite une pièce à la fois (mentalement) pour un petit `n` comme 10.
4. Encercle l'ordre des boucles (pièce à l'extérieur) pour ne pas glisser vers les permutations.
5. Code la méthode générique, puis appelle-la avec le tableau classique.

---

## 4. Solution Java

```java
/**
 * Number of combinations that sum to n using unlimited coins from denominations.
 * Order does not matter. ways(0) == 1.
 */
int makeChange(int n, int[] coins) {
    if (n < 0) {
        return 0;
    }
    int[] ways = new int[n + 1];
    ways[0] = 1;

    for (int coin : coins) {
        if (coin <= 0) {
            continue; // skip bad denominations if any slip in
        }
        for (int amount = coin; amount <= n; amount++) {
            ways[amount] += ways[amount - coin];
        }
    }
    return ways[n];
}

/** Classic CTCI denominations: quarters, dimes, nickels, pennies. */
int makeChange(int n) {
    return makeChange(n, new int[] {25, 10, 5, 1});
}
```

### Variante récursive + mémo (même réponse)

Utile si on demande le top-down d'abord:

```java
int makeChangeMemo(int n, int[] coins) {
    if (n < 0) {
        return 0;
    }
    Integer[][] memo = new Integer[coins.length][n + 1];
    return waysFrom(0, n, coins, memo);
}

private int waysFrom(int index, int remaining, int[] coins, Integer[][] memo) {
    if (remaining == 0) {
        return 1;
    }
    if (index == coins.length) {
        return 0;
    }
    if (memo[index][remaining] != null) {
        return memo[index][remaining];
    }

    int ways = 0;
    int coin = coins[index];
    for (int count = 0; count * coin <= remaining; count++) {
        ways += waysFrom(index + 1, remaining - count * coin, coins, memo);
    }
    memo[index][remaining] = ways;
    return ways;
}
```

Le tableau bottom-up est plus court à taper sous la pression du temps. Connais les deux.

### Parcours: n = 5, coins = [1, 5]

| Étape | État de ways[0..5] |
| --- | --- |
| init | `[1, 0, 0, 0, 0, 0]` |
| après 1 | `[1, 1, 1, 1, 1, 1]` |
| après 5 | `[1, 1, 1, 1, 1, 2]` |

Réponse **2**: cinq centimes, ou un nickel.

### Tests minimaux

```java
public static void main(String[] args) {
    int[] coins = {25, 10, 5, 1};
    System.out.println(makeChange(0, coins));   // 1
    System.out.println(makeChange(1, coins));   // 1
    System.out.println(makeChange(5, coins));   // 2
    System.out.println(makeChange(10, coins));  // 4
    System.out.println(makeChange(30, coins));  // 18
}
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Récursion sans mémo | exponentiel | O(d) pile | d = nombre de dénominations; trop lent |
| Mémo sur (index, reste) | O(d · n · ...) selon boucles | O(d · n) | correct; plus de code |
| Bottom-up `ways[]` | O(d · n) | O(n) | réponse préférée en entretien |
| Bottom-up avec 4 pièces fixes | O(n) | O(n) | même idée, d est constant |

Avec les quatre pièces classiques, le temps est linéaire en `n`. Dis quand même O(d · n) pour rester général.

---

## 6. Cas limites et erreurs fréquentes

Les recruteurs tapent sur ceux-ci:

* **`n = 0`** → renvoie 1 (une combinaison vide). Pas 0.
* **`n` négatif** → 0, ou refuse l'entrée.
* **Seulement des centimes** → exactement une façon pour tout `n` non négatif.
* **Impossible de faire `n`** (par exemple pièces `{2, 4}` et `n = 3`) → `ways[n]` reste 0.
* **Dénominations en double dans le tableau** → tu surcompteras; suppose des valeurs uniques, ou déduplique.
* **Pièce plus grande que `n`** → la boucle interne ne tourne pas; sans danger.
* **Dépassement d'entier** → pour un grand `n` et beaucoup de pièces, `int` peut boucler. Mentionne `long` si les bornes grossissent.

Erreurs courantes:

1. **Inverser l'ordre des boucles** et compter des permutations. Trois centimes seraient surcomptés comme des ordres différents.
2. **Mettre `ways[0] = 0`.** Alors chaque montant reste à zéro.
3. **Utiliser une table 2D sans besoin** et se tromper d'indices. 1D suffit pour les combinaisons à pièces illimitées.
4. **Résoudre le min de pièces au lieu du compte.** Autre récurrence.
5. **Muter le tableau `coins` ou trier sans besoin.** Trier ne nuit pas, mais le DP combinaisons n'exige pas de tri si tu traites un type entier à la fois.

---

## 7. Récap à expliquer à un ami

Coins demande: avec 25/10/5/1 en stock illimité, combien de combinaisons distinctes font exactement `n` cents?

1. L'ordre ne compte pas. Trois pièces de 10, c'est une façon, pas six permutations.
2. `ways[0] = 1`. Tu peux faire zéro cent d'une façon: ne rien utiliser.
3. Pour chaque pièce, parcours les montants de cette pièce jusqu'à `n` et fais `ways[a] += ways[a - c]`.
4. Boucle externe sur les pièces: combinaisons. Externe sur les montants: permutations. Dis laquelle tu veux.
5. Temps O(d · n), espace O(n). Pour n = 10 la réponse est 4; pour n = 30 c'est 18 avec l'ensemble classique.

Si tu peux remplir `ways` pour n = 10 à la main et expliquer pourquoi l'ordre des boucles tue les permutations, tu maîtrises le problème 8.11.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Paint Fill](/blog/fr/ctci-8-10-paint-fill)
* Suivant: [Eight Queens](/blog/fr/ctci-8-12-eight-queens)