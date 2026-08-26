---
title: "First Common Ancestor: LCA sans liens parent (Java)"
description: "Problème style CTCI 4.8 pour débutants: trouver l'ancêtre commun le plus profond de deux nœuds dans un arbre binaire (pas forcément un BST). Préférer un parcours récursif qui renvoie un statut; monter via parent est l'alternative."
date: "2026-05-09"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.8 pour débutants: trouver l'ancêtre commun le plus profond de deux nœuds dans un arbre binaire (pas forcément un BST). Préférer un parcours récursif qui renvoie un statut; monter via parent est l'alternative.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Deux personnes dans un arbre généalogique. Tu montes depuis chacune vers la racine la plus ancienne. La première personne touchée par les deux montées est un ancêtre commun. Le **premier** ancêtre commun est le plus profond: aussi près que possible des deux personnes, pas la racine sauf si la racine est le seul point partagé.

Ce billet est un enseignement original pour débutants en **Java**. Même famille que le LCA classique d'entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Problème **4.8**: arbre binaire, pas forcément un BST. On préfère une solution **sans liens parent**.

---

## 1. Analogie de l'arbre

Imagine l'organigramme d'une entreprise dessiné en arbre binaire. Chaque case a au plus deux reports en dessous. Alice et Bob sont quelque part dans le schéma. Leur manager commun le plus loin du CEO (le plus près d'Alice et Bob) est le first common ancestor.

Distinctions importantes:

* **Ancêtre de X** inclut souvent X dans les énoncés d'entretien. Si Bob reporte sous Alice, Alice peut être la réponse.
* **Premier / plus bas** veut dire le plus profond dans l'arbre, pas "premier" dans un parcours gauche-droite.
* Ce n'est **pas** un BST. Tu ne peux pas utiliser l'ordre des valeurs pour choisir gauche ou droite. Tu n'as que la structure: enfant gauche, enfant droit, et peut-être un pointeur parent si l'intervieweur le donne.

Si les nœuds avaient `parent`, le problème ressemble à deux routes qui montent vers une autoroute partagée, proche de l'intersection de listes. Sans parents, tu pars de la racine et tu cherches vers le bas en récursion.

---

## 2. Problème en mots simples

**But:** étant donné la racine d'un arbre binaire et deux nœuds `p` et `q` qui peuvent ou non être dans cet arbre, renvoyer leur nœud first common ancestor, ou `null` si tu ne peux pas en nommer un.

**Contraintes qui comptent:**

* Arbre binaire, pas forcément BST.
* Éviter de stocker une liste de tous les ancêtres (le goût classique "ne stocke pas de nœuds supplémentaires dans une structure").
* Préférer **sans parent** sur `TreeNode`.
* Clarifie si `p` ou `q` peut être la réponse quand l'un est sous l'autre (en général oui).
* Clarifie ce qui se passe si un nœud manque dans l'arbre (en général `null`).

**Forme du nœud (sans parent):**

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

**Petit exemple**

```
        3
       / \
      5   1
     / \ / \
    6  2 0  8
      / \
     7   4
```

* FCA de `6` et `4` est `5`.
* FCA de `5` et `4` est `5` (le nœud se couvre lui-même).
* FCA de `6` et `8` est `3`.

---

## 3. Réfléchir d'abord

### Alternative: liens parent, monter comme une intersection de listes

Si chaque nœud a `parent`:

1. Mesure la profondeur de `p` et de `q` en montant vers la racine.
2. Remonte le nœud le plus profond jusqu'à ce que les deux soient à la même profondeur.
3. Monte les deux d'un pas à la fois jusqu'à ce que les pointeurs se rejoignent. Ce nœud est le first common ancestor.

Temps O(D) pour D la profondeur du plus profond. Espace extra O(1) hors arbre. Même idée que l'intersection CTCI 2.7: deux chemins qui partagent un suffixe vers la racine.

Utile quand l'API stocke déjà les parents. Pas le chemin principal si l'intervieweur dit "les nœuds ne connaissent que leurs enfants."

### Naïf sans parents: contrôles de côté avec `covers`

Depuis la racine, demande "le sous-arbre gauche couvre-t-il `p`?" et "le gauche couvre-t-il `q`?"

* Réponses différentes: `p` et `q` se séparent sous ce nœud, donc ce nœud est le FCA.
* Même côté: ne récursive que de ce côté.

Correct, mais chaque `covers` parcourt un sous-arbre et tu l'appelles souvent. Tu restes en O(N) sur un arbre équilibré, avec de moins bonnes constantes car les mêmes nœuds sont rescannés.

### Préféré: une récursion, renvoyer un statut

Tu veux parcourir l'arbre une seule fois. Un helper récursif renvoie un petit **objet de statut**:

* Un candidat `node` (peut être `p`, `q`, un vrai ancêtre, ou `null`)
* Un drapeau `isAncestor` qui dit "ce `node` est déjà le vrai first common ancestor"

Règles qui remontent:

1. Sous-arbre vide → `(null, false)`.
2. Gauche et droite renvoient un nœud non null → la racine courante est l'ancêtre commun (`isAncestor = true`).
3. La racine courante est `p` ou `q`, et l'autre cible a été trouvée dans un sous-arbre → la racine courante est un vrai ancêtre.
4. La racine courante est `p` ou `q`, et l'autre n'est **pas** en dessous → renvoie cette racine avec `isAncestor = false` (seulement "une cible trouvée").
5. Un seul côté a trouvé quelque chose → remonte ce résultat (sauf si l'étape 3 s'applique).
6. Si un enfant a déjà mis `isAncestor = true`, coupe et remonte ce résultat.

Pourquoi le drapeau? Sans lui, "j'ai trouvé `p` mais pas `q`" ressemble à "`p` est sous `q`" si tu ne renvoies qu'un pointeur. Le drapeau sépare **vrai LCA** et **trouvaille partielle**. En haut, si `isAncestor` est false, renvoie `null` (nœud manquant ou paire incomplète).

C'est la solution à coder et expliquer en premier.

---

## 4. Solution Java (sans parent)

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

/** Statut d'un seul parcours récursif. */
class Result {
    TreeNode node;
    boolean isAncestor;

    Result(TreeNode node, boolean isAncestor) {
        this.node = node;
        this.isAncestor = isAncestor;
    }
}

class FirstCommonAncestor {

    /**
     * First common ancestor de p et q sous root, ou null s'il n'y a pas
     * de paire valide entièrement présente (par exemple un nœud manquant).
     */
    TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        Result r = helper(root, p, q);
        return r.isAncestor ? r.node : null;
    }

    private Result helper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null) {
            return new Result(null, false);
        }

        // Même nœud demandé deux fois (p == q == root)
        if (root == p && root == q) {
            return new Result(root, true);
        }

        Result left = helper(root.left, p, q);
        if (left.isAncestor) {
            return left; // déjà verrouillé en bas
        }

        Result right = helper(root.right, p, q);
        if (right.isAncestor) {
            return right;
        }

        if (left.node != null && right.node != null) {
            // p et q trouvés dans des sous-arbres différents
            return new Result(root, true);
        }

        if (root == p || root == q) {
            // Une cible ici; vrai ancêtre seulement si l'autre était en dessous
            boolean foundOther = left.node != null || right.node != null;
            return new Result(root, foundOther);
        }

        // Remonte le côté qui a trouvé un nœud (ou null)
        TreeNode bubble = left.node != null ? left.node : right.node;
        return new Result(bubble, false);
    }
}
```

Parcours sur l'exemple avec `p = 6`, `q = 4` (tous deux sous `5`):

| Étape | Focus | Ce qui remonte | Notes |
| --- | --- | --- | --- |
| 1 | Feuille `6` | node=`6`, false | root correspond à `p` |
| 2 | Sous-arbre de `2` trouve `4` | node=`4`, false | droite de `2` |
| 3 | Nœud `2` | remonte `4` | pas p/q |
| 4 | Nœud `5`: gauche a `6`, droite a `4` | node=`5`, **true** | les deux côtés non null |
| 5 | Racine `3` | gauche déjà `isAncestor` | coupe et renvoie `5` |

Si `q` était hors de l'arbre, tu pourrais remonter `p` avec `isAncestor = false` jusqu'en haut, et la méthode publique renvoie `null`. C'est le drapeau qui paie sa place.

---

## 5. Alternative: monter via parent

Quand `TreeNode` a `parent`:

```java
class TreeNodeWithParent {
    int val;
    TreeNodeWithParent left;
    TreeNodeWithParent right;
    TreeNodeWithParent parent;
}

TreeNodeWithParent commonAncestorWithParents(
        TreeNodeWithParent p, TreeNodeWithParent q) {
    int delta = depth(p) - depth(q);
    TreeNodeWithParent first = delta > 0 ? q : p;   // plus haut
    TreeNodeWithParent second = delta > 0 ? p : q;  // plus profond
    second = goUpBy(second, Math.abs(delta));

    while (first != second && first != null && second != null) {
        first = first.parent;
        second = second.parent;
    }
    return (first == null || second == null) ? null : first;
}

int depth(TreeNodeWithParent node) {
    int d = 0;
    while (node != null) {
        node = node.parent;
        d++;
    }
    return d;
}

TreeNodeWithParent goUpBy(TreeNodeWithParent node, int delta) {
    while (delta > 0 && node != null) {
        node = node.parent;
        delta--;
    }
    return node;
}
```

Mentionne ceci en entretien après la solution récursive à statut: "S'il y a des parents, aligne les profondeurs et monte ensemble; même idée que l'intersection de listes." Puis reviens à la version sans parent comme défaut pour les arbres binaires simples.

---

## 6. Tableau de complexité

| Approche | Temps | Espace extra | Parent requis? |
| --- | --- | --- | --- |
| Montée parent (aligner profondeur) | O(D) | O(1) | oui |
| `covers` répété + branchement | O(N) (moins bonnes constantes) | O(H) pile | non |
| Une récursion + statut `Result` | O(N) | O(H) pile | non |

N = nœuds de l'arbre, D = profondeur du plus profond, H = hauteur (pile de récursion). Sans parents ni index extra, tu ne bats pas le pire cas O(N), car un nœud manquant force à regarder presque partout.

---

## 7. Cas limites et erreurs fréquentes

Les intervieweurs touchent ceux-ci:

* **Un nœud est ancêtre de l'autre** → la réponse est le nœud du haut (`isAncestor` devient true quand la seconde cible est trouvée en dessous).
* **`p == q`** → ce nœud (s'il est présent).
* **Un ou les deux manquants** → `null` via `isAncestor == false` en haut.
* **La racine est le seul ancêtre commun** → les cibles sont sur des côtés différents de la racine (ou l'une est la racine et l'autre en dessous).
* **Arbre vide / root null** → `null`.
* **Pas un BST** → ne compare jamais `val` pour choisir la direction.

Erreurs fréquentes:

1. **Renvoyer la première trouvaille partielle comme LCA** sans drapeau ni scan préalable "les deux existent".
2. **Stocker des chemins complets racine-nœud** dans des listes quand l'énoncé demande d'éviter ce style (ok en échauffement; dis-le et avance).
3. **Utiliser la logique BST** sur un arbre binaire simple.
4. **Oublier que `p` ou `q` peut être la réponse** quand l'un couvre l'autre.
5. **Muter l'arbre** ou les parents alors qu'il fallait seulement une lecture.

Usage minimal:

```java
// construis l'arbre d'exemple enraciné en 3 ... puis:
TreeNode ans = new FirstCommonAncestor().commonAncestor(root, node6, node4);
// ans.val == 5
```

---

## 8. Expliquer à un ami

First Common Ancestor sur un arbre binaire simple:

1. Le nœud le plus profond dont le sous-arbre contient les deux cibles (un nœud compte dans son propre sous-arbre).
2. Avec parent: aligne les profondeurs, monte ensemble jusqu'à ce que les pointeurs coïncident.
3. Sans parent (préféré): un DFS qui renvoie un **statut** (`node` + `isAncestor`).
4. Les deux enfants signalent une trouvaille → le nœud courant est le LCA.
5. Le nœud courant est une cible et l'autre a été trouvée en dessous → le courant est le LCA.
6. Trouvaille partielle sans drapeau true → remonte; en haut tu renvoies `null` si jamais confirmé.

Si tu peux dessiner l'exemple, marquer où gauche et droite rapportent un hit, et expliquer pourquoi le drapeau existe, tu maîtrises le 4.8.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Build Order](/blog/fr/ctci-4-7-build-order)
* Suivant: [BST Sequences](/blog/fr/ctci-4-9-bst-sequences)