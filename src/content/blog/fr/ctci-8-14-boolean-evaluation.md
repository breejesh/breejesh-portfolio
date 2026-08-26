---
title: "Boolean Evaluation: compter les parenthésages d'une expression (Java)"
description: "Problème style CTCI 8.14 pour débutants: compter combien de parenthésages complets d'une expression 0/1 avec &, | et ^ valent true ou false. Récursion mémoïsée sur sous-chaînes en Java."
date: "2025-11-27"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.14 pour débutants: compter combien de parenthésages complets d'une expression 0/1 avec &, | et ^ valent true ou false. Récursion mémoïsée sur sous-chaînes en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Une expression booléenne est une chaîne de bits et d'opérateurs: `1^0|0|1`. Sans parenthèses elle est ambiguë. Avec un parenthésage complet chaque opérateur binaire a une sous-expression gauche et droite claires. **Boolean Evaluation** demande: donnée la chaîne et une valeur de vérité cible, combien de parenthésages complets distincts font que le tout vaut cette cible?

Ce post est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien récursion et DP, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 8 se termine ici sur des découpes mémoïsées d'une expression.

---

## 1. Analogie du quotidien

Imagine une rangée d'interrupteurs (`0` éteint, `1` allumé) avec des portes entre eux: **AND** (`&`), **OR** (`|`), **XOR** (`^`).

Tu dois choisir l'ordre de combiner les paires. Chaque ordre est un parenthésage complet:

```
1 ^ 0 | 1
  peut être (1 ^ 0) | 1
  ou        1 ^ (0 | 1)
```

Ces deux arbres peuvent diverger. Le premier donne `(1) | 1` → true. Le second donne `1 ^ (1)` → false.

Ton travail n'est pas de choisir un ordre. C'est de **compter** combien d'ordres produisent un résultat donné (true ou false).

Les expressions courtes ressemblent à de petits arbres. Les longues explosent en nombres de type Catalan d'arbres binaires, donc tu auras besoin de mémoïsation.

---

## 2. Énoncé en mots simples

**Entrée:** une chaîne `expr` de longueur impaire. Aux indices pairs: `'0'` ou `'1'`. Aux indices impairs: `'&'`, `'|'` ou `'^'`. Un booléen `result` (la cible).

**Sortie:** le nombre de façons de parenthéser entièrement `expr` pour qu'elle évalue à `result`.

**Règles:**

* Chaque parenthésage est un arbre binaire complet sur les opérateurs (chaque opérateur a exactement une sous-expression gauche et une droite).
* Les opérateurs ne s'évaluent qu'après résolution des deux côtés (pas de tours de précédence; les parenthèses décident tout).
* On compte des arbres de parenthésage distincts, pas des chaînes finales distinctes.

**Exemples:**

| Expression | Cible | Façons | Notes |
| --- | --- | --- | --- |
| `"1"` | true | 1 | un seul bit |
| `"1"` | false | 0 | |
| `"1^0\|1"` | true | 1 | parcours ci-dessous |
| `"1^0\|0\|1"` | false | 2 | exemple classique |
| `"0&0&0&1^1\|0"` | true | 10 | exemple classique |

Clarifie:

* Chaîne vide? Retourne 0 (ou déclare invalide).
* Longueur ou caractères invalides? Hors scope; suppose bien formée.
* Même opérateur dans un arbre différent compte-t-il à part? Oui. Arbres, pas chaînes aplaties.
* Overflow? Utilise `int` sauf demande contraire. Sur de longues chaînes le compte grossit vite.

---

## 3. Réfléchir avant de coder

### Brut: essayer chaque découpe

Pour un parenthésage complet à plusieurs opérateurs, **un opérateur est la racine** (le dernier appliqué). Cet opérateur est à un index impair `i`. La sous-chaîne gauche est `expr[0..i)`, la droite `expr[i+1..]`.

En récursif:

1. Si longueur 1: retourne 1 si ce bit égale la cible, sinon 0.
2. Pour chaque index d'opérateur `i = 1, 3, 5, ...`:
   * Compte les façons dont la gauche est true et false.
   * Compte les façons dont la droite est true et false.
   * Combine avec l'opérateur pour savoir combien de façons de cette découpe valent la cible.
3. Somme sur toutes les positions d'opérateur racine.

C'est correct et suit la définition du parenthésage complet.

### Tables de vérité pour combiner

Pour un opérateur racine fixe, soit:

* `lt`, `lf` = façons que la gauche soit true / false
* `rt`, `rf` = façons que la droite soit true / false

Total de façons pour cette découpe (n'importe quel résultat): `(lt + lf) * (rt + rf)`.

Façons que la découpe soit **true**:

| Op | true quand |
| --- | --- |
| `&` | gauche true et droite true → `lt * rt` |
| `\|` | pas les deux false → `lt*rt + lt*rf + lf*rt` |
| `^` | côtés différents → `lt*rf + lf*rt` |

Façons **false** = total de la découpe moins façons true (ou écris la table duale).

Ajoute le compte choisi à la réponse pour cette expression et cette cible.

### Pourquoi la mémoïsation

La même sous-chaîne (par exemple `"0|1"`) est demandée souvent, une fois pour true et une fois pour false, depuis des parents différents. Clé le memo par `(sous-chaîne, résultatDésiré)` ou par indices début/fin plus résultat.

Sans memo, le travail suit le nombre d'arbres binaires, qui croît comme les nombres de Catalan: exponentiel en le nombre d'opérateurs.

Avec memo sur O(n²) sous-chaînes et 2 résultats, chaque état regarde O(n) découpes, soit environ O(n³) si tu maîtrises le coût des substrings. Les indices plutôt que de nouvelles strings gardent des constantes raisonnables.

### Forme avec indices (préférée en code)

Travaille sur le tableau de caractères d'origine avec `count(start, end, result)` = sous-chaîne `expr[start..end)` (`end` exclusif, `end - start` impair).

Les opérateurs sont aux offsets impairs depuis `start`. Boucle `k = start + 1; k < end; k += 2`.

---

## 4. Solution Java

### Récursion mémoïsée sur sous-chaînes (clés string)

Première version claire. Facile à expliquer au tableau.

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {

    public static int countEval(String expr, boolean result) {
        if (expr == null || expr.isEmpty()) {
            return 0;
        }
        return ways(expr, result, new HashMap<String, Integer>());
    }

    private static int ways(String expr, boolean result, Map<String, Integer> memo) {
        if (expr.length() == 0) {
            return 0;
        }
        if (expr.length() == 1) {
            boolean bit = expr.charAt(0) == '1';
            return bit == result ? 1 : 0;
        }

        String key = result + "#" + expr;
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        int total = 0;
        // operators sit at odd indices: 1, 3, 5, ...
        for (int i = 1; i < expr.length(); i += 2) {
            char op = expr.charAt(i);
            String left = expr.substring(0, i);
            String right = expr.substring(i + 1);

            int leftTrue = ways(left, true, memo);
            int leftFalse = ways(left, false, memo);
            int rightTrue = ways(right, true, memo);
            int rightFalse = ways(right, false, memo);

            int waysTrue = 0;
            if (op == '&') {
                waysTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                waysTrue = leftTrue * rightTrue
                    + leftTrue * rightFalse
                    + leftFalse * rightTrue;
            } else if (op == '^') {
                waysTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            }

            int totalForSplit = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int waysForTarget = result ? waysTrue : (totalForSplit - waysTrue);
            total += waysForTarget;
        }

        memo.put(key, total);
        return total;
    }
}
```

### Même idée avec indices (moins d'allocations)

```java
public static int countEvalIndexed(String expr, boolean result) {
    if (expr == null || expr.isEmpty()) {
        return 0;
    }
    // memo[start][end][0=false,1=true] ; -1 means unknown
    int n = expr.length();
    int[][][] memo = new int[n][n + 1][2];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= n; j++) {
            memo[i][j][0] = -1;
            memo[i][j][1] = -1;
        }
    }
    return waysIdx(expr, 0, n, result, memo);
}

private static int waysIdx(String expr, int start, int end, boolean result, int[][][] memo) {
    int r = result ? 1 : 0;
    if (memo[start][end][r] != -1) {
        return memo[start][end][r];
    }

    if (end - start == 1) {
        boolean bit = expr.charAt(start) == '1';
        int ans = bit == result ? 1 : 0;
        memo[start][end][r] = ans;
        return ans;
    }

    int total = 0;
    for (int k = start + 1; k < end; k += 2) {
        char op = expr.charAt(k);
        int lt = waysIdx(expr, start, k, true, memo);
        int lf = waysIdx(expr, start, k, false, memo);
        int rt = waysIdx(expr, k + 1, end, true, memo);
        int rf = waysIdx(expr, k + 1, end, false, memo);

        int waysTrue = 0;
        if (op == '&') {
            waysTrue = lt * rt;
        } else if (op == '|') {
            waysTrue = lt * rt + lt * rf + lf * rt;
        } else if (op == '^') {
            waysTrue = lt * rf + lf * rt;
        }

        int splitTotal = (lt + lf) * (rt + rf);
        total += result ? waysTrue : (splitTotal - waysTrue);
    }

    memo[start][end][r] = total;
    return total;
}
```

### Parcours: `"1^0|1"` et cible true

Opérateurs aux indices 1 (`^`) et 3 (`|`).

**Racine en `^`:** gauche `"1"`, droite `"0|1"`.

* Gauche: 1 true, 0 false.
* Droite `"0|1"`: un seul arbre, `0|1` → true. Donc right true = 1, right false = 0.
* `^` est true quand les côtés diffèrent: `1 * 0 + 0 * 1 = 0`. Zéro façon true pour cette racine.

**Racine en `|`:** gauche `"1^0"`, droite `"1"`.

* Gauche `"1^0"`: un arbre, true. left true = 1, left false = 0.
* Droite: true = 1.
* `|` true: `1*1 + 1*0 + 0*1 = 1`.

Total façons true = 0 + 1 = **1**.

Façons false = 1 (l'autre racine). Vérifie: `countEval("1^0|1", false)` doit valoir 1.

### Parcours: classique `"1^0|0|1"` → false = 2

Trois opérateurs, donc Catalan C₃ = 5 parenthésages complets. Exactement deux valent false. La récursion mémoïsée énumère ces cinq en choisissant chaque opérateur comme racine et en combinant les comptes enfants; en entretien tu ne listes pas les arbres à la main, mais sur une courte chaîne tu peux pour valider.

Test rapide:

```java
public static void main(String[] args) {
    System.out.println(countEval("1", true));              // 1
    System.out.println(countEval("1", false));             // 0
    System.out.println(countEval("1^0|1", true));          // 1
    System.out.println(countEval("1^0|1", false));         // 1
    System.out.println(countEval("1^0|0|1", false));       // 2
    System.out.println(countEval("0&0&0&1^1|0", true));    // 10
}
```

---

## 5. Table de complexité

Soit n = longueur de la chaîne (environ 2m + 1 pour m opérateurs).

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Récursion sans memo | Exponentiel (Catalan) | O(m) pile | Seulement petites entrées |
| Memo sur sous-chaînes | Ordre O(n³) avec DP par indices | O(n²) états | Réponse d'entretien préférée |
| DP bottom-up par longueur | Même ordre | O(n²) | Même récurrence court→long |

Chacun des O(n²) intervalles a 2 saveurs de résultat. Chaque intervalle teste O(n) racines. Cela multiplie en travail cubique. Memo à clé string: même idée asymptotique avec plus d'allocations.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent à:

* **Un seul bit** `"0"` / `"1"` avec cible qui matche ou non.
* **Un opérateur** `"1&0"`, `"1|0"`, `"1^0"`: un seul arbre; réponse 0 ou 1.
* **Tous bits false avec `|`:** peut encore être false seulement si chaque sous-expression reste false; suis les tables, ne devine pas.
* **Cible false:** facile d'oublier et de n'implémenter que les tables true. Utilise `total - waysTrue` ou écris les deux.
* **Longueur paire ou opérateur final:** entrée invalide; annonce ton hypothèse.
* **Grand n:** le compte déborde `int`. Mentionne `long` si besoin.

Erreurs fréquentes:

1. **Appliquer la précédence des opérateurs** au lieu d'un parenthésage pur. Le problème ignore la précédence habituelle; tout arbre est permis.
2. **Couper à chaque index**, y compris les bits. Seuls les indices impairs (opérateurs) sont des racines.
3. **Clé de memo sans le résultat.** Façons true et false pour la même sous-chaîne diffèrent. Cache les deux ou inclus le résultat dans la clé.
4. **Mauvaises multiplications** pour `|` ou `^`. Écris la table en trois lignes au tableau avant de coder.
5. **Renvoyer tous les arbres** quand on demande une seule cible. Filtre toujours par `result`.
6. **Off-by-one sur les sous-chaînes** (`substring(i)` vs `substring(i+1)`). L'opérateur en `i` n'appartient à aucun côté.

---

## 7. Résumé à raconter à un ami

Boolean Evaluation compte les parenthésages d'une expression `0`/`1` avec `&`, `|`, `^` qui évaluent à une valeur de vérité donnée.

1. Un opérateur est le dernier appliqué (racine de l'arbre de parse).
2. Coupe à gauche et à droite de cet opérateur. Compte récursivement combien de fois chaque côté est true et false.
3. Combine avec la table de vérité de l'opérateur pour les façons true (et false = total moins true).
4. Somme sur chaque opérateur racine possible.
5. Mémoïse par sous-chaîne (ou start/end) plus résultat désiré pour tuer l'explosion Catalan.

Si tu peux parcourir `"1^0|1"`, remplir les comptes true de `&` / `|` / `^`, et expliquer pourquoi la clé du memo inclut le booléen cible, tu maîtrises le problème 8.14. Le chapitre 8 récursion et DP se ferme sur le motif classique "compter les façons de parenthéser".

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Stack of Boxes](/blog/fr/ctci-8-13-stack-of-boxes)
* Suivant: [Stock Data](/blog/fr/ctci-9-1-stock-data)