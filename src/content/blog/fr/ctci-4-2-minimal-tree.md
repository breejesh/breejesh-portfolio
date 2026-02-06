---
title: "Minimal Tree: BST équilibré depuis un tableau trié (Java)"
description: "Problème style CTCI 4.2 pour débutants: à partir d'un tableau trié d'entiers uniques, construire un arbre de recherche binaire de hauteur minimale. Prendre le milieu comme racine, récursion sur chaque moitié."
date: "2026-02-06"
tags: [Algorithmes]
coverImage: /assets/images/ctci-4-2-minimal-tree.webp
previewImage: /assets/images/ctci-4-2-minimal-tree.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.2 pour débutants: à partir d'un tableau trié d'entiers uniques, construire un arbre de recherche binaire de hauteur minimale. Prendre le milieu comme racine, récursion sur chaque moitié.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Une ligne triée de nombres uniques est déjà à moitié un arbre de recherche binaire. La seule question: *quelle* valeur devient la racine pour garder l'arbre bas. Si tu insères de gauche à droite dans un BST vide, tu obtiens un bâton de hauteur N. Prends le milieu du tableau comme racine, refais le même coup sur chaque moitié, et la hauteur tombe vers log2(N).

Ce billet est un enseignement original pour débutants en **Java**. Même famille de construction de BST en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 4 continue ici après l'ouverture sur les graphes.

---

## 1. Analogie de l'étagère équilibrée

Imagine une étagère triée de livres numérotés de 1 à 7:

`[1, 2, 3, 4, 5, 6, 7]`

Tu veux un **arbre de recherche binaire**: l'enfant gauche porte toujours des valeurs plus petites, le droit des plus grandes. Tu veux aussi l'arbre le **plus bas possible** (hauteur minimale), pour que les recherches ne longent pas une longue colonne.

Si tu mets 1 en racine et que tu continues d'insérer 2, 3, 4, ... tu obtiens:

```
1
 \
  2
   \
    3
     ...
```

Hauteur 7. Douloureux.

Si tu mets **4** (le milieu) en racine, la moitié gauche `[1, 2, 3]` devient le sous-arbre gauche, la droite `[5, 6, 7]` le droit. Répète sur chaque moitié: milieu gauche 2, milieu droit 6. Tu obtiens un arbre touffu de hauteur 3:

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

Ce motif est tout l'algorithme: **milieu comme racine, récursion à gauche, récursion à droite**.

---

## 2. Problème en mots simples

**Entrée:** un tableau trié d'entiers uniques en ordre croissant. Exemple: `int[] arr = {1, 2, 3, 4, 5, 6, 7}`.

**Sortie:** la racine d'un arbre de recherche binaire qui contient chaque valeur, avec la **hauteur minimale possible**.

**Forme de nœud que nous utilisons:**

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

**Règles et précisions:**

* Valeurs uniques (pas de doublons à placer à gauche ou à droite).
* Tableau déjà trié croissant. Pas besoin de trier.
* Hauteur minimale: aussi équilibré qu'un BST sur N clés uniques peut l'être; hauteur floor(log2(N)) + 1 en forme pleine, ou proche quand N n'est pas une puissance de deux moins un.
* Tu peux renvoyer `null` pour un intervalle vide (tableau vide ou sous-plage vide).

**À clarifier en entretien**

* Le tableau est-il garanti trié et unique? (Oui pour cette version classique.)
* Faut-il des pointeurs parent? (Non pour ce problème.)
* Copier des tranches du tableau ou passer des bornes d'indices? (Les indices sont plus propres et O(1) d'extra par appel.)

---

## 3. Réfléchir avant de coder

### Naïf: insérer un par un depuis la gauche

Démarre vide, appelle `insert(arr[i])` pour i de 0 à N-1.

* BST correct: oui.
* Hauteur: O(N) car l'ordre trié part toujours à droite.
* Temps: O(N log N) si les inserts rééquilibrent, ou O(N^2) pour un insert naïf sur entrée triée.

Mentionne-le, puis écarte-le pour l'objectif de hauteur.

### Meilleure idée: choisir la racine avec soin

Dans un BST, la racine doit se placer entre sous-arbres gauche et droit. Pour un tableau **trié**, tout indice `mid` peut être la racine du sous-tableau `arr[start..end]`:

* Sous-arbre gauche = BST de `arr[start..mid-1]`
* Sous-arbre droit = BST de `arr[mid+1..end]`

Pour minimiser la hauteur, gauche et droite doivent avoir à peu près la même taille. L'indice du milieu le fait:

```
mid = (start + end) / 2
```

(ou `start + (end - start) / 2` si tu crains l'overflow sur de très grands tableaux).

Cas de base: si `start > end`, renvoie `null`. Ce côté n'a aucun nœud.

C'est la même structure que la recherche dichotomique, mais tu **construis un arbre** au lieu de chercher.

Pourquoi c'est un BST valide: toute valeur à gauche de mid est plus petite que `arr[mid]`, toute valeur à droite est plus grande. La récursion préserve cela sur chaque sous-arbre. Pourquoi la hauteur est minimale: chaque niveau divise environ par deux les éléments restants, donc la profondeur est O(log N).

---

## 4. Solution Java

```java
public class MinimalTree {

    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /** Build a minimal-height BST from a sorted unique array. */
    public static TreeNode createMinimalBST(int[] arr) {
        if (arr == null || arr.length == 0) {
            return null;
        }
        return build(arr, 0, arr.length - 1);
    }

    private static TreeNode build(int[] arr, int start, int end) {
        if (start > end) {
            return null;
        }

        int mid = start + (end - start) / 2;
        TreeNode node = new TreeNode(arr[mid]);
        node.left = build(arr, start, mid - 1);
        node.right = build(arr, mid + 1, end);
        return node;
    }
}
```

Parcours sur `{1, 2, 3, 4, 5, 6, 7}`:

| Plage d'appel | indice mid | valeur racine | plage gauche | plage droite |
| --- | --- | --- | --- | --- |
| 0..6 | 3 | 4 | 0..2 | 4..6 |
| 0..2 | 1 | 2 | 0..0 | 2..2 |
| 0..0 | 0 | 1 | vide | vide |
| 2..2 | 2 | 3 | vide | vide |
| 4..6 | 5 | 6 | 4..4 | 6..6 |
| 4..4 | 4 | 5 | vide | vide |
| 6..6 | 6 | 7 | vide | vide |

Arbre résultant (même dessin que l'étagère):

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

Les tableaux de longueur impaire placent un milieu net à la racine. Longueur paire (par exemple `{1, 2, 3, 4}`) peut utiliser l'un ou l'autre des deux indices centraux selon la division entière. Les deux donnent une hauteur minimale; la forme peut différer un peu, pas la classe de hauteur.

Le parcours in-order de l'arbre fini réimprime le tableau trié d'origine. C'est un contrôle mental rapide après le code.

---

## 5. Tableau de complexité

| Élément | Coût | Pourquoi |
| --- | --- | --- |
| Temps | O(N) | chaque indice du tableau devient exactement un nœud; travail constant par indice |
| Pile extra | O(log N) | profondeur de récursion = hauteur de l'arbre |
| Espace arbre | O(N) | N nœuds stockés |
| Inserts triés naïfs | O(N^2) temps, O(N) hauteur | colonne droite |

Tu n'as pas besoin de tableaux extra pour les moitiés. Les bornes d'indices réutilisent le même `arr`.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent ceux-ci:

* **Tableau vide ou null** → renvoie `null`.
* **Un seul élément** → un nœud, deux enfants null. Hauteur 1.
* **Deux éléments** → une racine, un enfant (gauche ou droit selon mid). Hauteur 2.
* **Longueur paire** → l'un ou l'autre centre convient; garde une formule et explique-la.
* **Tu "vois" déjà l'arbre** → écris quand même la règle récursive du milieu; ne code pas des formes en dur.

Erreurs fréquentes:

1. **Insérer les valeurs triées de gauche à droite dans un BST vide.** BST correct, hauteur terrible.
2. **Copier des sous-tableaux à chaque appel** (`Arrays.copyOfRange`). Ça marche, mais gaspille temps et mémoire. Préfère `start`/`end`.
3. **Décalage d'un sur les bornes.** Gauche = `start..mid-1`, droite = `mid+1..end`. Inclure `mid` à nouveau duplique la racine.
4. **Utiliser `mid = (start + end) / 2` sur d'énormes indices.** Préfère `start + (end - start) / 2` là où l'int peut déborder (même habitude que binary search).
5. **Oublier le cas de base `start > end`.** Récursion infinie ou chaos de null.
6. **Construire un arbre complet style heap sans ordre BST.** La complétude seule ne donne pas l'ordre de recherche; la règle du milieu de plage triée donne équilibre et BST.

Esquisse d'usage minimale:

```java
int[] sorted = {1, 2, 3, 4, 5, 6, 7};
TreeNode root = MinimalTree.createMinimalBST(sorted);
// root.val == 4, left subtree has 1..3, right has 5..7
```

Aide optionnelle pour vérifier la hauteur après construction:

```java
static int height(TreeNode n) {
    if (n == null) return 0;
    return 1 + Math.max(height(n.left), height(n.right));
}
// for 7 nodes, height should be 3
```

---

## 7. Récap pour l'expliquer à un ami

Minimal Tree, c'est "faire le BST le plus bas depuis un tableau trié unique":

1. Le tableau est déjà trié. L'ordre BST est gratuit quand tu coupes autour d'une racine.
2. Prends l'élément du milieu comme racine de la plage courante.
3. La moitié gauche construit l'enfant gauche. La droite, l'enfant droit.
4. Plage vide renvoie `null`. Un élément renvoie une feuille.
5. Temps O(N), hauteur O(log N). N'insère pas les clés triées une par une ou tu fais pousser un bâton.

Si tu peux dessiner `{1,2,3,4,5,6,7}` en l'arbre équilibré ci-dessus et expliquer pourquoi le milieu bat "toujours prendre le premier", tu maîtrises le 4.2. Ensuite: parcourir un arbre par profondeur.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Route Between Nodes](/blog/fr/ctci-4-1-route-between-nodes)
* Suivant: [List of Depths](/blog/fr/ctci-4-3-list-of-depths)