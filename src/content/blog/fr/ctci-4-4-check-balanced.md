---
title: "Check Balanced: différence de hauteur au plus un (Java)"
description: "Problème style CTCI 4.4 pour débutants: décider si un arbre binaire est équilibré. Calcule la hauteur en une seule passe et renvoie un signal d'échec dès qu'un nœud a des sous-arbres dont les hauteurs diffèrent de plus d'un."
date: "2026-01-08"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-4-check-balanced.webp
previewImage: /assets/images/ctci-4-4-check-balanced.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.4 pour débutants: décider si un arbre binaire est équilibré. Calcule la hauteur en une seule passe et renvoie un signal d'échec dès qu'un nœud a des sous-arbres dont les hauteurs diffèrent de plus d'un.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un arbre est **équilibré en hauteur** quand chaque nœud a des sous-arbres gauche et droit dont les hauteurs diffèrent d'au plus un. Pas seulement la racine. Chaque nœud en descendant doit passer le même test. Une branche gauche profonde et une droite courte sous un nœud du milieu déséquilibrent déjà l'arbre, même si depuis le haut "ça a l'air bien".

Ce billet est un enseignement original pour débutants en **Java**. Même famille de récursion sur les arbres en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 4, problème 4.4.

---

## 1. Équilibre comme un niveau à bulle

Pose un niveau à bulle sur chaque joint d'un mobile suspendu au plafond. Chaque joint a un bras gauche et un bras droit. Les bras peuvent différer un peu (un "cran"), mais pas de deux crans ou plus. Si un joint est incliné, tout le mobile échoue, pas seulement le crochet du haut.

Dans un arbre binaire:

* La hauteur d'une feuille est 0 (ou 1, selon ta convention; choisis-en une et tiens-toi y).
* La hauteur d'un nœud est `1 + max(height(left), height(right))`.
* À ce nœud, `|height(left) - height(right)|` doit être au plus 1.
* La hauteur d'un enfant null est -1 si les feuilles ont hauteur 0. Traite null comme -1 et feuille comme 0 de façon cohérente.

La convention d'entretien utilisée ci-dessous: **null a pour hauteur -1**, une feuille a hauteur `0`, un nœud avec deux feuilles a hauteur `1`.

---

## 2. Problème en mots simples

**But:** renvoyer `true` si l'arbre binaire est équilibré, sinon `false`.

**Définition:** pour chaque nœud, les hauteurs de ses deux sous-arbres diffèrent d'au plus 1. Les deux sous-arbres doivent eux-mêmes être équilibrés.

**Entrée:** racine d'un arbre binaire (`TreeNode` avec `left` et `right`).

**Sortie:** boolean.

**Clarifie avant de coder:**

* Arbre vide (racine `null`): équilibré (`true`).
* Hauteur de null: `-1` (courant) ou `0` (ok si tu es cohérent).
* Arbres parfaits / complets / pleins: mots proches, ce n'est pas "équilibré" ici. Reste sur la définition de différence de hauteurs.

**Exemples**

| Croquis d'arbre | Équilibré? | Pourquoi |
| --- | --- | --- |
| Un seul nœud | oui | les deux côtés null |
| Racine avec seulement un enfant gauche | oui | hauteurs 0 et -1, diff 1 |
| Chaîne gauche de trois nœuds, pas de branche droite sous la racine | non | sous la racine, hauteur g 1, d -1, diff 2 |
| Petit arbre plein de hauteur 2 | oui | chaque nœud diffère de 0 ou 1 |

---

## 3. Réfléchis d'abord

### Naïf: helper de hauteur appelé deux fois par nœud

```
isBalanced(n):
  if n is null: return true
  hl = height(n.left)
  hr = height(n.right)
  if |hl - hr| > 1: return false
  return isBalanced(n.left) and isBalanced(n.right)
```

Correct. Lent. `height` parcourt chaque sous-arbre, et tu l'appelles à chaque nœud, donc les mêmes nœuds sont revisités. Pire cas autour de O(N log N) sur un arbre équilibré, O(N^2) sur un arbre dégénéré.

### Préféré: une passe, hauteur ou signal d'échec

En calculant la hauteur de bas en haut, tu vérifies aussi la règle d'équilibre. Si un sous-arbre est déjà déséquilibré, ne renvoie pas une vraie hauteur. Renvoie une **sentinelle d'échec** (souvent `-1` dans les croquis courts; ci-dessous on utilisé `Integer.MIN_VALUE` pour ne pas entrer en collision avec la hauteur null `-1`).

Patron propre en entretien:

* Le helper renvoie la hauteur d'un sous-arbre équilibré.
* Si le sous-arbre est déséquilibré, il renvoie la sentinelle d'échec.
* Le parent voit la sentinelle d'un enfant et la remonte sans plus de travail.
* Méthode publique: `checkHeight(root) != UNBALANCED`.

C'est **un DFS**, O(N) en temps, O(H) en pile. Sortie anticipée au premier nœud mauvais en remontant.

Pourquoi le bas-haut compte: tu as besoin des deux hauteurs enfants avant de décider le parent. Le post-ordre est naturel. Un pré-ordre "vérifie-moi d'abord, puis recurre" a encore besoin des hauteurs des deux côtés, donc tu reparcours ou tu caches. La passe combinée hauteur+contrôle est la fusion propre.

---

## 4. Solution Java

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

class CheckBalanced {
    // Distinct from null height (-1) so failure never looks like an empty child.
    private static final int UNBALANCED = Integer.MIN_VALUE;

    public boolean isBalanced(TreeNode root) {
        return checkHeight(root) != UNBALANCED;
    }

    /** Height if this subtree is balanced; UNBALANCED if any node fails. */
    private int checkHeight(TreeNode node) {
        if (node == null) {
            return -1;
        }

        int left = checkHeight(node.left);
        if (left == UNBALANCED) {
            return UNBALANCED;
        }

        int right = checkHeight(node.right);
        if (right == UNBALANCED) {
            return UNBALANCED;
        }

        if (Math.abs(left - right) > 1) {
            return UNBALANCED;
        }

        return Math.max(left, right) + 1;
    }
}
```

Pourquoi `Integer.MIN_VALUE` plutôt que réutiliser `-1`? La hauteur de null est déjà `-1`. Si tu utilises aussi `-1` pour "déséquilibre", le parent ne distingue pas "enfant gauche absent" de "sous-arbre gauche a échoue". Une sentinelle d'échec distincte est plus facile a défendre en salle.

Parcours (équilibré):

```
      1
     / \
    2   3
   /
  4
```

* Nœud 4: g -1, d -1, diff 0, hauteur 0.
* Nœud 2: g 0, d -1, diff 1, hauteur 1.
* Nœud 3: g -1, d -1, diff 0, hauteur 0.
* Nœud 1: g 1, d 0, diff 1, hauteur 2.
* `checkHeight` renvoie 2, pas `UNBALANCED` → `true`.

Parcours (déséquilibre):

```
    1
   /
  2
 /
3
```

* Nœud 3: hauteur 0.
* Nœud 2: g 0, d -1, hauteur 1.
* Nœud 1: g 1, d -1, diff 2 → renvoyer `UNBALANCED` → `false`.

---

## 5. Table de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Helper de hauteur à chaque nœud | O(N log N) a O(N^2) | O(H) récursion | Simple, pas idéal |
| Une passe hauteur + signal d'échec | O(N) | O(H) pile | Chaque nœud une fois |
| DFS pile explicite, même logique | O(N) | O(H) | Rare en entretien; la récursion suffit |

H est la hauteur de l'arbre. Arbre dégénéré: H = N, pile O(N). Arbre équilibré: H = log N.

---

## 6. Cas limites et erreurs courantes

Les interviewers testent ça:

* **Racine null** → équilibré.
* **Un seul nœud** → équilibré.
* **Un seul long bras** sous un nœud profond, la racine paraît encore "courte" → toujours false; vérifie chaque nœud, pas seulement la racine.
* **Diff exactement 1** → autorisé. Diff 2 → échec.
* **Deux sous-arbres hauts mais égaux** → ok si chaque côté est équilibré à l'intérieur.

Erreurs courantes:

1. **Ne comparer les hauteurs qu'à la racine.** Un déséquilibre profond sous un enfant reste un déséquilibre.
2. **Appeler `height` séparément a gauche et a droite à chaque nœud.** Bonne réponse, risque quadratique. Passe a la passe combinée.
3. **Utiliser `-1` pour hauteur null et pour échec.** Confus. Utilise une sentinelle d'échec distincte.
4. **Oublier le retour anticipé.** Des qu'un enfant a échoue, remonte; inutile de continuer a mesurer le frère si tu sais déjà que c'est false (optimisation optionnelle; pire cas toujours O(N) si le mauvais nœud est le dernier).
5. **Off-by-one sur la hauteur de null.** Null = -1 et feuille = 0 garde `max + 1` propre. Si null = 0, la feuille devient 1; dis-le à voix haute pour que l'interviewer suive tes nombres.
6. **AVL vs "équilibré".** Ici "équilibré" est la définition de différence de hauteurs, pas un tour complet d'insertion AVL sauf s'ils le demandent.

Usage minimal:

```java
TreeNode root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
boolean ok = new CheckBalanced().isBalanced(root); // true
```

---

## 7. Explique a un ami

Check Balanced est un DFS d'arbre qui fusionne deux jobs en un:

1. Définir la hauteur: null vaut -1, sinon `1 + max(left, right)`.
2. A chaque nœud, après les deux enfants, si l'un a échoue, tu échoues. Si `|left - right| > 1`, tu échoues.
3. Sinon tu renvoies ta hauteur pour que le parent fasse le même contrôle.
4. L'API publique est un boolean: le helper n'a pas renvoyé la sentinelle d'échec.

Si tu dessines une chaîne gauche de trois nœuds, montres la diff de 2 à la racine et la contrasts avec le helper une passe O(N), tu maîtrises le 4.4. Ensuite: valider les plages d'un BST, même colonne récursive, autre règle.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [List of Depths](/blog/fr/ctci-4-3-list-of-depths)
* Suivant: [Validate BST](/blog/fr/ctci-4-5-validate-bst)