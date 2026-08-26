---
title: "Validate BST: plages min/max sur un arbre binaire (Java)"
description: "Problème style CTCI 4.5 pour débutants: vérifier si un arbre binaire est un arbre binaire de recherche. L'approche principale utilise des bornes min/max récursives; le parcours infixe trié est le contrôle optionnel."
date: "2026-03-07"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-5-validate-bst.webp
previewImage: /assets/images/ctci-4-5-validate-bst.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.5 pour débutants: vérifier si un arbre binaire est un arbre binaire de recherche. L'approche principale utilise des bornes min/max récursives; le parcours infixe trié est le contrôle optionnel.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un arbre binaire de recherche n'est pas juste "fils gauche plus petit, fils droit plus grand." Cela ne regarde que les enfants immédiats. Un vrai ABR dit: **toute** valeur du sous-arbre gauche est inférieure au nœud, et **toute** valeur du sous-arbre droit est supérieure. Ratez un petit-enfant lointain et l'arbre n'est pas un ABR, même si chaque paire parent-enfant locale a l'air correcte.

Ce billet est un enseignement original pour débutants en **Java**. Même famille que les questions classiques "valider un ABR" en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 4, arbres et graphes.

---

## 1. Analogie du quotidien

Imaginez un organigramme d'entreprise où chaque manager a une règle de salaire pour toute sa branche:

* Tout le monde sous l'adjoint de gauche doit gagner **moins** que le manager.
* Tout le monde sous l'adjoint de droite doit gagner **plus** que le manager.
* La règle s'empile. Quelqu'un trois niveaux plus bas reste dans la bande de chaque chef au-dessus.

En descendant l'arbre, vous portez une **plage de salaire légale**: "doit être supérieur à `min`, inférieur à `max`." À la racine la plage est ouverte. Chez un fils gauche, la valeur du parent devient le nouveau max. Chez un fils droit, la valeur du parent devient le nouveau min. Si quelqu'un sort de sa bande, l'organigramme n'est pas un ABR valide.

C'est tout l'algorithme principal: récursion avec min et max resserrés.

---

## 2. Énoncé en mots simples

**Entrée:** la racine d'un arbre binaire d'entiers (`TreeNode` avec `left`, `right` et une valeur `int`).

**Sortie:** `true` si l'arbre est un arbre binaire de recherche, sinon `false`.

**Définition d'ABR utilisée ici:**

* Pour chaque nœud `n`, tous les nœuds du sous-arbre de `n.left` ont des valeurs **strictement inférieures** à `n.data`.
* Tous les nœuds du sous-arbre de `n.right` ont des valeurs **strictement supérieures** à `n.data`.
* Les deux sous-arbres sont eux-mêmes des ABR.
* Arbre vide et nœud unique sont des ABR.

**Exemples:**

| Arbre (racine d'abord, informel) | ABR valide ? | Pourquoi |
| --- | --- | --- |
| `20` avec left `10`, right `30` | oui | les plages tiennent |
| `20` avec left `10`, et `10` a right `25` | non | `25` est à gauche de `20` mais `25 > 20` |
| `20` avec left `10`, right `30`, et `30` a left `25` | oui | `25` est entre `20` et `30` |
| vide | oui | aucun nœud ne viole quoi que ce soit |
| seulement `7` | oui | une valeur, aucune comparaison |

**Clarifiez avant de coder:**

* Les valeurs égales sont-elles autorisées ? (Ce billet utilise `<` et `>` **stricts**. Si l'intervieweur accepte les doublons, choisissez un côté, souvent left `<=` ou right `>=`, et tenez-vous-y.)
* Les valeurs peuvent-elles atteindre `Integer.MIN_VALUE` / `MAX_VALUE` ? (Utilisez des bornes `Integer` nulles, ou min/max en `long`, pour ne pas entrer en collision avec de vraies valeurs de nœud.)
* L'arbre est-il fini et acyclique ? (Oui pour ce problème.)

---

## 3. Réfléchir d'abord

### Incorrect: ne vérifier que les enfants

```java
// BAD: rate les violations profondes
boolean naive(TreeNode n) {
    if (n == null) return true;
    if (n.left != null && n.left.data >= n.data) return false;
    if (n.right != null && n.right.data <= n.data) return false;
    return naive(n.left) && naive(n.right);
}
```

Sur le contre-exemple classique (`20` → left `10` → right `25`), chaque paire parent-enfant a l'air triée, mais `25` est dans le sous-arbre gauche de `20`. Le test naïf renvoie true. Les intervieweurs adorent ce piège.

### Moyen: max à gauche vs min à droite à chaque nœud

Vous pouvez calculer le max du sous-arbre gauche et le min du droit, puis comparer au nœud. Cela marche si c'est bien fait pour chaque nœud, mais vous payez souvent O(N) par nœud sans mémo, ce qui devient O(N²). La passe de plages ci-dessous fait un seul parcours et reste en O(N).

### Principal: plage min/max récursive

Passez deux bornes à chaque appel récursif:

1. Le nœud courant doit satisfaire `min < node.data < max` (extrémités ouvertes si la borne est null / "sans limite").
2. Récursion à gauche avec le même `min` et un nouveau max égal à `node.data`.
3. Récursion à droite avec un nouveau min égal à `node.data` et le même `max`.
4. Nœud null: true.

C'est un parcours en profondeur. Chaque nœud est vérifié une fois contre la plage la plus serrée imposée par les ancêtres.

### Optionnel: l'infixe doit être trié

Le parcours infixe d'un ABR visite les valeurs en ordre non décroissant (ici: strictement croissant). Donc:

1. Parcourir en infixe.
2. Garder la valeur précédente.
3. Si la valeur courante n'est pas supérieure à la précédente, échouer.

Même temps O(N). Utile comme seconde réponse ou contre-vérification. La méthode des plages est souvent plus simple à expliquer pour "pourquoi ce nœud est illégal", car vous montrez le min/max exact qui a échoué.

---

## 4. Solution Java

D'abord la solution principale (min/max). Puis une courte version infixe.

```java
class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;

    TreeNode(int data) {
        this.data = data;
    }
}

class ValidateBST {

    /** Entrée publique: l'arbre vide est un ABR valide. */
    boolean isBST(TreeNode root) {
        return check(root, null, null);
    }

    /**
     * @param min borne inférieure exclusive, ou null si aucune
     * @param max borne supérieure exclusive, ou null si aucune
     */
    private boolean check(TreeNode node, Integer min, Integer max) {
        if (node == null) {
            return true;
        }

        if (min != null && node.data <= min) {
            return false;
        }
        if (max != null && node.data >= max) {
            return false;
        }

        // Left: les valeurs doivent rester < node.data
        // Right: les valeurs doivent rester > node.data
        return check(node.left, min, node.data)
                && check(node.right, node.data, max);
    }
}
```

Déroulement sur un mauvais arbre:

```
      20
     /
   10
     \
      25
```

| Appel | node | min | max | Résultat |
| --- | --- | --- | --- | --- |
| 1 | 20 | null | null | ok, aller left et right |
| 2 | 10 | null | 20 | ok (`10 < 20`) |
| 3 | 25 | 10 | 20 | échec: `25 >= 20` |
| right de 20 | null | 20 | null | true (jamais atteint si court-circuit après échec) |

`25` est plus grand que son parent `10`, donc un contrôle enfants seulement est content. La plage porte encore max `20` du grand-parent, et cela le attrape.

Contrôle infixe optionnel:

```java
class ValidateBSTInOrder {
    private Integer prev = null;

    boolean isBST(TreeNode root) {
        prev = null;
        return inOrder(root);
    }

    private boolean inOrder(TreeNode node) {
        if (node == null) {
            return true;
        }
        if (!inOrder(node.left)) {
            return false;
        }
        if (prev != null && node.data <= prev) {
            return false;
        }
        prev = node.data;
        return inOrder(node.right);
    }
}
```

Réinitialisez `prev` au début de chaque appel public si vous réutilisez l'objet. Une version purement récursive peut passer `prev` comme tableau à un élément ou un petit holder pour que la "dernière vue" se mette à jour dans la pile sans champ d'instance.

Utiliser des bornes `long` au lieu de `Integer` null est aussi courant:

```java
boolean isBST(TreeNode root) {
    return checkLong(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean checkLong(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.data <= min || node.data >= max) return false;
    return checkLong(node.left, min, node.data)
            && checkLong(node.right, node.data, max);
}
```

Cela évite les tests `null`. Cela marche pour toute valeur `int` du nœud, car un `int` n'entre pas en conflit avec les sentinelles `long` comme ce serait le cas avec des bornes `int` et un nœud valant `Integer.MIN_VALUE`.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra |
| --- | --- | --- |
| Récursion min/max | O(N) | pile O(H), H = hauteur (O(N) pire cas déséquilibré) |
| Infixe avec prev | O(N) | pile O(H) |
| Seulement les enfants (naïf) | O(N) | O(H), mais **faux** sur les violations profondes |
| Max-gauche / min-droit à chaque nœud (sans mémo) | O(N²) pire | O(H) |

N est le nombre de nœuds. Sur des arbres équilibrés la profondeur de pile tourne autour de log N. En entretien on veut en général un temps O(N) et l'invariant global correct, pas un scan local parent-enfant.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs touchent à ceci:

* **Arbre vide** → true.
* **Nœud unique** → true.
* **Doublons** → sous règles strictes, deux valeurs égales échouent. Confirmez la définition d'ABR de l'entreprise.
* **Arbre déséquilibré** (forme de liste) → toujours O(N) en temps; la profondeur de pile compte rarement en entretien.
* **Valeur égale à la borne** → `node.data <= min` ou `>= max` doit échouer pour des ABR stricts.
* **Extrêmes Integer** → préférez des bornes `Integer` nulles ou des sentinelles `long` pour qu'un vrai `Integer.MIN_VALUE` fonctionne encore.

Erreurs courantes:

1. **Ne comparer qu'aux enfants.** Faux positif classique sur l'arbre `20 / 10 / 25`.
2. **Mal mettre à jour les deux bornes sur left/right.** Left garde l'ancien min et fixe max au parent. Right fixe min au parent et garde l'ancien max. Inversez et les arbres valides échouent.
3. **Utiliser `int min = Integer.MIN_VALUE` avec `node.data <= min`.** Une racine légitime à `Integer.MIN_VALUE` paraît illégale. Utilisez des bornes null ou `long`.
4. **Oublier de réinitialiser `prev` dans l'objet infixe.** Le second appel réutilise une ancienne valeur précédente.
5. **Autoriser l'égalité des deux côtés.** Choisissez une politique de doublons une fois. Ne mélangez pas `<=` left et `<=` right sans réfléchir (casse l'unicité de placement).
6. **Renvoyer true dès qu'un sous-arbre est bon.** Les deux côtés doivent passer: utilisez `&&`, pas un true anticipé à gauche sans vérifier la droite.

Esquisse d'usage minimale:

```java
TreeNode root = new TreeNode(20);
root.left = new TreeNode(10);
root.right = new TreeNode(30);
root.left.right = new TreeNode(25); // invalide sous 20

ValidateBST v = new ValidateBST();
boolean ok = v.isBST(root); // false
```

---

## 7. Résumé à expliquer à un ami

Validate BST pose une question: chaque nœud est-il dans la plage imposée par ses ancêtres ?

1. Définition: tout le sous-arbre gauche `<` nœud, tout le droit `>` nœud, récursivement.
2. Les contrôles enfants seulement ne suffisent pas. Des valeurs profondes peuvent casser un ancêtre sans casser leur parent.
3. Solution principale: récursion avec min et max. L'appel left reçoit `max = node.data`. L'appel right reçoit `min = node.data`.
4. Null est valide. La première violation renvoie false.
5. Optionnel: le parcours infixe doit voir des valeurs strictement croissantes. Même complexité, autre récit.
6. Attention aux doublons et aux extrêmes entiers quand vous choisissez le type de bornes.

Si vous savez dessiner le contre-exemple `20 / 10 / 25`, resserrer les plages sur le chemin gauche, et montrer où max `20` rejette `25`, vous maîtrisez le problème 4.5.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Check Balanced](/blog/fr/ctci-4-4-check-balanced)
* Suivant: [Successor](/blog/fr/ctci-4-6-successor)