---
title: "Parens: toutes les chaînes de parenthèses valides via compteurs gauche/droite (Java)"
description: "Problème style CTCI 8.9 pour débutants: générer chaque chaîne valide de n paires de parenthèses. Backtracking avec compteurs d'ouvrantes et fermantes restantes, élaguer tôt les préfixes illégaux, compter les Catalan."
date: "2026-02-09"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-9-parens.webp
previewImage: /assets/images/ctci-8-9-parens.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.9 pour débutants: générer chaque chaîne valide de n paires de parenthèses. Backtracking avec compteurs d'ouvrantes et fermantes restantes, élaguer tôt les préfixes illégaux, compter les Catalan.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Il te faut chaque chaîne faite de **n** parenthèses ouvrantes et **n** fermantes qui soit **valide**: jamais plus de fermantes que d'ouvrantes dans un préfixe, et comptes égaux à la fin. Pour `n = 3` ce sont cinq chaînes, pas les 20 façons de placer trois `(` et trois `)`. La plupart des placements au hasard cassent en cours de route.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les classiques questions d'entretien "générer les parenthèses", pas une copie du livre. Fait partie de la [série CTCI Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et DP, problème **8.9**.

---

## 1. Analogie du quotidien

Imagine un vestiaire avec **n** tickets et **n** manteaux.

* Remettre un ticket, c'est `(`.
* Rendre un manteau, c'est `)`.
* Tu ne peux jamais rendre un manteau si personne n'attend (ce serait un `)` sans `(` non apparié).
* À la fin, tous les tickets sont utilisés et tous les manteaux rendus.

Les séquences valides sont exactement les façons dont la file peut fonctionner sans compte "gens en attente" négatif. Les invalides essaient de rendre un manteau d'abord, ou finissent avec des tickets encore dehors.

Tu ne listes pas chaque mélange de n ouvrantes et n fermantes pour filtrer ensuite. Tu n'allonges que des préfixes qui peuvent encore finir valides. C'est l'idée du backtracking: deux compteurs, deux choix, élaguer tôt.

---

## 2. Énoncé en clair

**Entrée:** un entier non négatif `n`, le nombre de paires.

**Sortie:** toutes les chaînes de longueur `2n` qui utilisent exactement `n` caractères `(` et `n` caractères `)` et sont correctement appariées.

**Exemples:**

| n | Chaînes valides |
| --- | --- |
| 0 | `[""]` (une chaîne vide; choisis une convention) |
| 1 | `["()"]` |
| 2 | `["(())", "()()"]` |
| 3 | `["((()))", "(()())", "(())()", "()(())", "()()()"]` |

**Clarifie avant de coder:**

* `n = 0`: liste vide ou une chaîne vide? Ici: un résultat vide (cas de base de la récursion).
* Ordre des résultats? Non requis. N'importe quel ordre convient sauf s'ils demandent le lexicographique.
* Seulement `(` et `)`? Oui pour le problème classique. D'autres types de crochets sont une autre question.
* Renvoie `List<String>` en Java. Ne te contente pas d'imprimer; collecte pour des tests faciles.

On ne te demande **pas** de valider une seule chaîne (c'est le problème à pile). Tu **génères** chaque valide.

---

## 3. Réfléchis d'abord

### Deux règles qui définissent le valide

Une chaîne de parenthèses est valide si et seulement si:

1. Dans chaque préfixe, `#(` ≥ `#)`.
2. Sur la chaîne complète, `#(` = `#) = n`.

La règle 1 coupe `)(` et `())(`. La règle 2 coupe les ouvrantes en trop.

### Pourquoi la force brute de toutes les séquences est faible

Il y a `C(2n, n)` chaînes avec exactement n ouvrantes et n fermantes. Beaucoup échouent à la règle 1. Pour `n = 3`, `C(6, 3) = 20` candidates et seulement **5** valides. Avec n plus grand, l'écart grossit. En entretien, on veut élaguer pendant la construction, pas générer puis filtrer.

### Compteurs d'ouvrantes et fermantes restantes

Garde:

* `left`: combien de `(` tu peux encore placer (départ à `n`).
* `right`: combien de `)` tu peux encore placer (départ à `n`).

À chaque étape:

1. Si `left > 0`, tu peux placer `(`, puis récursion avec `left - 1`.
2. Si `right > left`, tu peux placer `)` (il te reste plus de fermantes budgétées que d'ouvrantes restantes, donc plus d'ouvrantes déjà sur le chemin que de fermantes). Puis récursion avec `right - 1`.
3. Si `left == 0` et `right == 0`, le chemin est une chaîne valide complète. Enregistre-la.

Pourquoi `right > left` pour une fermante? Après quelques caractères, ouvrantes placées = `n - left`, fermantes placées = `n - right`. Il faut fermantes < ouvrantes avant d'ajouter une fermante, soit `n - right < n - left`, ce qui se simplifie en `right > left`. Même invariant, autres compteurs.

### Même idée avec compteurs utilisés

Certains suivent `openUsed` et `closeUsed` depuis zéro:

* Place `(` si `openUsed < n`.
* Place `)` si `closeUsed < openUsed`.

Même arbre. Choisis une histoire et tiens-y. Ci-dessous on utilise les compteurs **restants**.

### Arbre pour n = 2

```
path="", left=2, right=2
  '(' → "(", 1, 2
    '(' → "((", 0, 2
      ')' → "(()", 0, 1
        ')' → "(())"  done
    ')' → "()", 1, 1
      '(' → "()(", 0, 1
        ')' → "()()"  done
      ')'  forbidden (right == left; close would break balance)
  ')'  forbidden at root (need right > left; here they are equal)
```

Deux feuilles: `(())` et `()()`. Aucun chemin ne finit en chaîne invalide complète.

### Comptage: nombres de Catalan

Le nombre de chaînes valides pour n paires est le **n-ième nombre de Catalan**:

```
C_n = (1 / (n + 1)) * (2n choose n)
```

| n | C_n |
| --- | --- |
| 0 | 1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 5 |
| 4 | 14 |
| 5 | 42 |

Dis-le en entretien. La taille de sortie est Catalan, pas `2^(2n)` ni `C(2n, n)`.

### Choix du builder

`StringBuilder` pour le chemin courant: append, récursion, supprimer le dernier caractère. Chaque réponse complète a la longueur `2n`.

---

## 4. Solution Java

```java
import java.util.ArrayList;
import java.util.List;

/**
 * Generate all valid strings of n pairs of parentheses.
 * Backtracking with remaining open and close counts.
 */
public class Parens {

    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        if (n < 0) {
            return result;
        }
        backtrack(n, n, new StringBuilder(), result);
        return result;
    }

    /**
     * @param left  remaining '(' you may still place
     * @param right remaining ')' you may still place
     */
    private void backtrack(int left, int right, StringBuilder path, List<String> result) {
        if (left == 0 && right == 0) {
            result.add(path.toString());
            return;
        }

        if (left > 0) {
            path.append('(');
            backtrack(left - 1, right, path, result);
            path.deleteCharAt(path.length() - 1);
        }

        // Only close when more opens are already on the path than closes.
        // Equivalent: remaining closes strictly exceed remaining opens.
        if (right > left) {
            path.append(')');
            backtrack(left, right - 1, path, result);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
```

### Parcours: n = 3

Départ `left = 3`, `right = 3`, path vide.

1. Il faut ouvrir d'abord: `"("`, left 2, right 3.
2. Ensuite tu peux ouvrir ou fermer (right > left). Les branches grandissent à chaque mélange légal.
3. Feuilles (dans un ordre depth-first):

```
((()))
(()())
(())()
()(())
()()()
```

Cinq chaînes. Ça matche `C_3 = 5`.

### Optionnel: forme avec compteurs utilisés

Même flux, autres paramètres:

```java
private void backtrack(int n, int openUsed, int closeUsed, StringBuilder path, List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }
    if (openUsed < n) {
        path.append('(');
        backtrack(n, openUsed + 1, closeUsed, path, result);
        path.deleteCharAt(path.length() - 1);
    }
    if (closeUsed < openUsed) {
        path.append(')');
        backtrack(n, openUsed, closeUsed + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

Appelle avec `backtrack(n, 0, 0, new StringBuilder(), result)`. Préfère une seule forme en entretien pour ne pas mélanger l'inégalité.

### Tests de fumée

```java
Parens p = new Parens();

assert p.generateParenthesis(0).equals(List.of(""));
assert p.generateParenthesis(1).equals(List.of("()"));

List<String> two = p.generateParenthesis(2);
assert two.size() == 2;
assert two.contains("(())") && two.contains("()()");

List<String> three = p.generateParenthesis(3);
assert three.size() == 5;
assert three.contains("((()))");
assert three.contains("(()())");
assert three.contains("(())()");
assert three.contains("()(())");
assert three.contains("()()()");

assert p.generateParenthesis(4).size() == 14;
```

---

## 5. Tableau de complexité

Soit `C_n` le n-ième nombre de Catalan (nombre de résultats).

| Élément | Coût | Notes |
| --- | --- | --- |
| Nombre de résultats | `C_n` | ~ `4^n / (n^(3/2) √π)` asymptotiquement |
| Longueur de chaque résultat | `2n` | fixe |
| Travail pour tout construire | style O(C_n · n) | chaque chaîne valide est un chemin de longueur 2n; les nœuds internes partagent des préfixes |
| Profondeur de récursion | O(n) | au plus 2n frames, path ≤ 2n |
| Espace extra | O(n) pile + path | au-delà de la liste de sortie |
| Espace de sortie | O(C_n · n) | il faut stocker chaque chaîne |

Tu ne peux pas lister toutes les réponses plus vite que proportionnel à la taille de sortie. Le gain: tu ne visites jamais un préfixe qui a déjà cassé la balance. Générer toutes les `C(2n, n)` puis filtrer paie aussi les chaînes invalides complètes.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers poussent ici:

* **n = 0** → une chaîne vide (si c'est ton cas de base).
* **n = 1** → seulement `"()"`.
* **n négatif** → liste vide; ne récure pas à l'infini.
* **n grand** → `C_10 = 16796`, `C_15` est déjà gros. Mentionne la croissance Catalan s'ils demandent l'échelle.
* **Ne collecter que la longueur 2n** → si tu oublies le cas de base et les deux compteurs à zéro, tu manques des résultats ou tu bloques.

Erreurs courantes:

1. **Autoriser `)` dès que `right > 0`.** Ça admet des préfixes `)(`. Il faut `right > left` (restants) ou `closeUsed < openUsed` (utilisés).
2. **Oublier d'annuler** l'append (`deleteCharAt`). Les branches sœurs partagent un builder sale.
3. **Générer tous les motifs `C(2n, n)`**, puis valider avec une pile. Correct mais histoire plus lente; mène avec l'élagage à la construction.
4. **Utiliser un Set pour dédupliquer.** Une génération valide ne devrait pas créer de doublons si chaque étape place un type de caractère fixe sous des compteurs clairs.
5. **Off-by-one sur n paires vs n caractères.** La longueur totale est **2n**, pas n.
6. **Imprimer seulement**, sans valeur de retour. Préfère une liste pour complexité et tests clairs.

Problèmes proches qu'on confond:

* **Valider une chaîne:** pile ou compteur, O(n). Pas ce problème.
* **Plus longue sous-chaîne valide:** DP ou pile. Différent.
* **Générer avec plusieurs types de crochets** sous règles d'imbrication: backtracking similaire, plus de symboles.

---

## 7. Récap à raconter à un ami

Génération de parenthèses, version entretien:

1. Tu veux chaque chaîne avec n `(` et n `)` qui ne rend jamais la balance négative et finit à zéro.
2. Construis de gauche à droite. Suis combien d'ouvrantes et de fermantes tu peux encore placer (ou combien tu as déjà utilisées).
3. Place `(` tant qu'il reste des ouvrantes.
4. Place `)` seulement quand une fermante ne dépasserait pas les ouvrantes déjà écrites.
5. Quand les deux compteurs restants sont à zéro, enregistre la chaîne.
6. Le nombre de réponses est le n-ième Catalan: 1, 1, 2, 5, 14, ...
7. Même squelette de backtracking que les permutations: choisir, récuser, annuler. Le filtre de légalité est la règle de balance.

Si tu peux dessiner l'arbre n = 2 avec deux feuilles et expliquer pourquoi un `)` en tête est interdit, tu maîtrises le 8.9. Ensuite, paint fill inonde une région avec une autre marche récursive.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Permutations with Dups](/blog/fr/ctci-8-8-permutations-with-dups)
* Suivant: [Paint Fill](/blog/fr/ctci-8-10-paint-fill)