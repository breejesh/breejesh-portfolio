---
title: "Power Set: tous les sous-ensembles par récursion et masques de bits (Java)"
description: "Problème style CTCI 8.4 pour débutants: renvoyer chaque sous-ensemble d'un ensemble, y compris le vide et le complet. Construction récursive, énumération optionnelle par masques de bits, et code Java."
date: "2025-12-13"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.4 pour débutants: renvoyer chaque sous-ensemble d'un ensemble, y compris le vide et le complet. Construction récursive, énumération optionnelle par masques de bits, et code Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as un sac d'autocollants distincts: `{A, B, C}`. Combien de sacs différents peux-tu former si chaque autocollant est dedans ou dehors? Le sac vide compte. Le sac plein compte. Les paires comptent. Cette liste de sacs est le **power set** (ensemble des parties): tous les sous-ensembles de l'ensemble d'origine.

Ce billet est un enseignement original pour débutants en **Java**. Même famille d'échauffements de récursion en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et programmation dynamique, problème 8.4.

---

## 1. Analogie du quotidien

Imagine un sandwich shop avec trois garnitures: salade, tomate, fromage. Chaque garniture est un oui ou un non. Commandes au comptoir:

* aucune garniture
* seulement salade
* seulement tomate
* seulement fromage
* salade + tomate
* salade + fromage
* tomate + fromage
* les trois

Cela fait `2 × 2 × 2 = 8` commandes. Même compte que le power set d'un ensemble à 3 éléments: **2^n** sous-ensembles pour **n** éléments.

Tu peux faire grandir le menu de façon récursive. Avec zéro garniture, tu n'as que la commande vide. Ajoute le fromage: chaque ancienne commande reste, et tu obtiens aussi une copie de chacune avec fromage. Ajoute la tomate de la même façon. Ajoute la salade de la même façon. C'est la construction récursive. Les masques de bits font le même travail avec une boucle de `0` à `2^n - 1`, où chaque bit dit "inclus cette garniture".

---

## 2. Énoncé en clair

**Entrée:** un ensemble d'éléments distincts. En code, on prend souvent une `List` ou un tableau de valeurs uniques (par ex. caractères ou entiers).

**Sortie:** une collection de tous les sous-ensembles. L'ordre des sous-ensembles importe rarement. L'ordre dans un sous-ensemble peut suivre l'entrée pour des démos stables.

**Doit inclure:**

* le sous-ensemble vide `{}`
* l'ensemble complet
* chaque sous-ensemble propre intermédiaire

**Exemple:**

```
Input:  {1, 2, 3}

Power set (8 subsets):
  {}
  {1}
  {2}
  {3}
  {1, 2}
  {1, 3}
  {2, 3}
  {1, 2, 3}
```

**À clarifier en entretien:**

* Éléments uniques? (Oui pour le power set classique. Les doublons sont un autre problème.)
* Type de retour: `List<List<T>>` est courant en Java.
* Muter les listes de l'appelant? Préfère des copies défensives de chaque sous-ensemble à l'enregistrement.
* n petit? La taille de sortie est **2^n**. Pour n = 20 tu as déjà environ un million de sous-ensembles. Dis-le à voix haute.

---

## 3. Réfléchis d'abord

### Compte d'abord

| n | Nombre de sous-ensembles |
| --- | --- |
| 0 | 1 (`{}` seulement) |
| 1 | 2 |
| 2 | 4 |
| 3 | 8 |
| n | 2^n |

Tu ne peux pas faire mieux que O(2^n · poly(n)) si tu dois lister chaque sous-ensemble. L'espace de la réponse est du même ordre.

### Idée récursive (construire depuis n-1)

Soit `P(S)` le power set de `S`.

1. Si `S` est vide, `P(S) = { {} }`.
2. Sinon choisis un élément `e` et laisse `rest = S sans e`.
3. Calcule `P(rest)`.
4. Pour chaque sous-ensemble `sub` dans `P(rest)`, garde `sub` tel quel, et fabrique aussi `sub ∪ {e}`.

Chaque sous-ensemble contient `e` ou non. Ces deux familles couvrent le power set sans chevauchement.

```
P({1,2}) with e=2, rest={1}:
  P(rest) = { {}, {1} }
  without 2:  {}, {1}
  with 2:     {2}, {1,2}
  result:     {}, {1}, {2}, {1,2}
```

### Récursion par index (include / exclude)

Même maths, autre forme de code: parcours les indices `0 .. n-1` avec un chemin courant.

* À l'index `i`, branche **exclude** de l'élément `i`, puis branche **include** (push, recurse, pop).
* Quand `i == n`, copie le chemin courant dans la réponse.

C'est du backtracking classique. Les interviewers l'aiment souvent car l'arbre d'appels se dessine bien.

### Idée de masque de bits

Il y a exactement `2^n` entiers de `0` à `2^n - 1`. Pour le masque `m`, le bit `j` décide si l'élément `j` est dans le sous-ensemble:

```
n = 3, elements [a, b, c]
mask 0 = 000 -> {}
mask 1 = 001 -> {a}
mask 2 = 010 -> {b}
mask 3 = 011 -> {a,b}
mask 4 = 100 -> {c}
...
mask 7 = 111 -> {a,b,c}
```

Pas de pile de récursion. Bon second angle après le récursif.

### Ce qu'il ne faut pas faire

* Boucles imbriquées seulement pour un n fixe (profondeur codée en dur).
* Muter une seule liste partagée dans la réponse sans copier (tous les sous-ensembles stockés finissent identiques).
* Oublier l'ensemble vide (ou l'ensemble complet).
* Utiliser un set-of-sets sans histoire claire de type/hash quand un list-of-lists suffit en entretien.

---

## 4. Solution Java

### 4.1 Construction récursive depuis des power sets plus petits

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Power set by growing from P(rest).
 * Each new element doubles the number of subsets.
 */
public class PowerSetRecursive {

    public static List<List<Integer>> powerSet(List<Integer> set) {
        List<List<Integer>> result = new ArrayList<>();
        if (set == null) {
            return result;
        }
        // start with the empty subset
        result.add(new ArrayList<>());

        for (int element : set) {
            // snapshot size: only clone subsets built so far
            int sizeBefore = result.size();
            for (int i = 0; i < sizeBefore; i++) {
                List<Integer> withElement = new ArrayList<>(result.get(i));
                withElement.add(element);
                result.add(withElement);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        List<Integer> set = Arrays.asList(1, 2, 3);
        List<List<Integer>> all = powerSet(set);
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Parcours pour `{1, 2, 3}`:

| Étape | Élément ajouté | Sous-ensembles après l'étape |
| --- | --- | --- |
| départ | - | `{}` |
| 1 | 1 | `{}`, `{1}` |
| 2 | 2 | `{}`, `{1}`, `{2}`, `{1,2}` |
| 3 | 3 | huit sous-ensembles: les quatre précédents plus chacun avec 3 |

### 4.2 Backtracking include / exclude

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class PowerSetBacktrack {

    public static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null) {
            return result;
        }
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(
            int[] nums,
            int index,
            List<Integer> path,
            List<List<Integer>> result) {
        if (index == nums.length) {
            // must copy: path is reused on the way back
            result.add(new ArrayList<>(path));
            return;
        }

        // exclude nums[index]
        backtrack(nums, index + 1, path, result);

        // include nums[index]
        path.add(nums[index]);
        backtrack(nums, index + 1, path, result);
        path.remove(path.size() - 1); // pop
    }

    public static void main(String[] args) {
        List<List<Integer>> all = powerSet(new int[] {1, 2, 3});
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Arbre d'appels pour deux éléments `[a, b]`:

```
                    []
           /                  \
     exclude a              include a
          []                    [a]
       /      \              /       \
 exclude b  include b  exclude b  include b
    []        [b]         [a]       [a,b]
```

Quatre feuilles, quatre sous-ensembles. Le même motif s'étend à n.

### 4.3 Énumération optionnelle par masque de bits

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSetBitMask {

    public static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null) {
            return result;
        }
        int n = nums.length;
        // 1 << n is 2^n. For n >= 31 use care with int overflow.
        int total = 1 << n;

        for (int mask = 0; mask < total; mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int j = 0; j < n; j++) {
                if ((mask & (1 << j)) != 0) {
                    subset.add(nums[j]);
                }
            }
            result.add(subset);
        }
        return result;
    }

    public static void main(String[] args) {
        List<List<Integer>> all = powerSet(new int[] {1, 2, 3});
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Démo des masques pour `[1, 2, 3]`:

| mask | binary | subset |
| --- | --- | --- |
| 0 | 000 | `{}` |
| 1 | 001 | `{1}` |
| 2 | 010 | `{2}` |
| 3 | 011 | `{1, 2}` |
| 4 | 100 | `{3}` |
| 5 | 101 | `{1, 3}` |
| 6 | 110 | `{2, 3}` |
| 7 | 111 | `{1, 2, 3}` |

Quelle version mener en entretien? Commence par **include/exclude** ou **croître depuis P(rest)**. Mentionne les masques de bits comme alternative itérative propre. Les trois produisent les mêmes 2^n sous-ensembles.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra (hors sortie) | Notes |
| --- | --- | --- | --- |
| Croître depuis P(rest) | O(n · 2^n) | O(1) au-delà de la croissance du résultat | chacun des 2^n sous-ensembles copie jusqu'à n éléments au fil du temps |
| Backtracking | O(n · 2^n) | O(n) récursion + path | 2^n feuilles; copier le path coûte O(n) |
| Masque de bits | O(n · 2^n) | O(1) au-delà du résultat | boucles simples; attention à `1 << n` pour grand n |
| Taille de sortie | - | O(n · 2^n) | ne se réduit pas si tu listes tout |

Les interviewers veulent entendre **2^n sous-ensembles** avant le code. S'ils demandent "peut-on faire mieux?", non pour l'énumération complète; seulement génération paresseuse ou arrêt anticipé sous contraintes supplémentaires.

---

## 6. Cas limites et erreurs courantes

Les interviewers testent ceci:

* **Entrée vide:** renvoyer une liste avec un sous-ensemble vide, pas une liste vide de sous-ensembles.
* **Entrée null:** résultat vide ou traiter comme ensemble vide. Choisis et dis-le.
* **Un seul élément:** seulement `{}` et `{x}`.
* **n grand:** 2^20 ~1e6; 2^30 ne tient pas à la légère. Parle mémoire et overflow de `1 << n` pour les masques quand n ≥ 31 (`1L << n` ou plafonner n).
* **Doublons en entrée:** le power set classique suppose des uniques. Les doublons demandent tri + skip (subset II), autre problème.
* **Path mutable partagé:** oublier `new ArrayList<>(path)` rend tous les sous-ensembles stockés identiques.
* **Muter `size` en itérant la liste qui grandit** sans snapshot: boucle infinie ou doublement faux. Snapshot `sizeBefore` d'abord.
* **Exigences d'ordre:** s'ils veulent des sous-ensembles triés ou lexico, trie chaque sous-ensemble ou génère dans un ordre d'index fixe et trie la liste externe à la fin.

Erreurs courantes:

1. **Sous-ensemble vide manquant.** Mauvais cas de base.
2. **Pas de copie à l'enregistrement.** Toutes les réponses aliasent une liste.
3. **Boucles imbriquées en dur** pour n = 3 seulement.
4. **`1 << n` pour n = 31** déborde l'int (bit de signe). Parle des limites.
5. **Traiter le power set comme des permutations.** L'ordre dans un sous-ensemble ne crée pas de nouveaux sous-ensembles; `{1,2}` et `{2,1}` sont le même ensemble.

Idée smoke minimale:

```java
List<List<Integer>> p0 = PowerSetRecursive.powerSet(List.of());
assert p0.size() == 1 && p0.get(0).isEmpty();

List<List<Integer>> p1 = PowerSetRecursive.powerSet(List.of(7));
assert p1.size() == 2;

List<List<Integer>> p3 = PowerSetBitMask.powerSet(new int[] {1, 2, 3});
assert p3.size() == 8;
```

---

## 7. Récap à raconter à un ami

Power set en langage d'entretien:

1. Un ensemble de n éléments distincts a **2^n** sous-ensembles: chaque élément est dedans ou dehors.
2. Inclus toujours `{}` et l'ensemble complet.
3. **Croissance récursive:** commence avec `{ {} }`. Pour chaque nouvel élément, clone chaque sous-ensemble courant et ajoute l'élément au clone.
4. **Backtrack:** à chaque index, branche exclude puis include; copie le path aux feuilles.
5. **Masque de bits:** pour le masque `0 .. 2^n - 1`, inclus l'élément `j` quand le bit `j` est à 1.
6. Temps et espace de sortie sont **Θ(n · 2^n)** dans la formulation habituelle qui liste tout.
7. Copie les sous-ensembles à l'enregistrement. N'alias pas une liste de path partagée.

Si tu dessines l'arbre include/exclude pour `{1,2}`, doubles les sous-ensembles en ajoutant un troisième élément, et écris soit la récursion soit une boucle de masques sans bugs de listes partagées, tu maîtrises le problème 8.4.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Magic Index](/blog/fr/ctci-8-3-magic-index)
* Suivant: [Recursive Multiply](/blog/fr/ctci-8-5-recursive-multiply)