---
title: "CTCI 4.10 Check Subtree: T2 se cache-t-il dans T1? (Java)"
description: "T1 est bien plus grand que T2. Décide si T2 est un sous-arbre de T1: cherche la racine de T2 dans T1 puis matchTree, ou sérialise en préordre avec nulls et teste contains. Java, O(n + km) vs O(n + m)."
date: "2026-05-24"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-10-check-subtree.webp
previewImage: /assets/images/ctci-4-10-check-subtree.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** T1 est bien plus grand que T2. Décide si T2 est un sous-arbre de T1: cherche la racine de T2 dans T1 puis matchTree, ou sérialise en préordre avec nulls et teste contains. Java, O(n + km) vs O(n + m).
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as un grand arbre binaire **T1** et un arbre bien plus petit **T2**. La question est simple à dire et facile à rater: **T2 est-il un sous-arbre de T1**? Cela signifie qu'un nœud `n` de T1 possède une branche entière qui ressemble exactement à T2, même structure et mêmes valeurs, jusqu'aux feuilles. Coupe l'arbre en `n` et tu dois obtenir T2, pas "quelque chose qui commence comme T2".

Ce billet est le problème **4.10 Check Subtree** de la [série CTCI en Java](/blog/fr/ctci-series-guide). Enseignement original, pas un copier-coller de livre. Deux approches solides: recherche récursive plus comparaison d'arbres, et chaînes en préordre avec marqueurs null.

---

## Image du quotidien

Pense à l'organigramme d'une entreprise (T1) et à la photo d'une équipe (T2).

* T2 n'est un sous-arbre que si un manager dans T1 a **exactement** cette équipe sous lui: les mêmes personnes aux mêmes places gauche/droite, y compris les chaises vides (enfants null).
* Il ne suffit pas que les mêmes noms apparaissent quelque part dans le grand organigramme. L'ordre et la forme comptent.
* Il ne suffit pas qu'un chemin de la racine à une feuille matche T2. Sous-arbre veut dire la forme complète enracinée sous un nœud.

Donc: trouve une racine candidate dans T1, puis prouve que tout le petit arbre s'aligne. Ou: écris les deux arbres en une chaîne soignée et demande si la petite chaîne est dans la grande.

---

## Problème en mots simples

**Entrée:** racines de deux arbres binaires, `t1` et `t2`. On suppose que T1 est bien plus grand que T2 (le cadre habituel en entretien).

**Sortie:** `true` si T2 est un sous-arbre de T1; sinon `false`.

**Définition:** T2 est un sous-arbre de T1 s'il existe un nœud `n` dans T1 tel que le sous-arbre enraciné en `n` est **identique** à T2 (valeurs et structure).

**Exemples**

```
T1:          1
           /   \
          2     3
         / \   /
        4   5 6

T2:      2
        / \
       4   5
```

Réponse: `true`. L'enfant gauche de la racine de T1 correspond entièrement à T2.

```
T2':     2
        /
       4
```

Réponse: `false` si le nœud `2` de T1 a encore un enfant droit `5`. La structure doit matcher, pas seulement une forme partielle.

**Clarifie en entretien**

* T2 vide: souvent traité comme sous-arbre de n'importe quoi (ou rejeté; choisis un contrat). T1 vide avec T2 non vide vaut `false`.
* Les valeurs peuvent se répéter dans T1, donc plusieurs départs candidats.
* Compare par **valeur et structure**, pas par référence d'objet (les arbres sont en général des objets séparés).
* Arbre binaire, pas forcément un BST.

**Forme du nœud**

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

---

## Comment réfléchir avant de coder

### Approche A: chercher la racine, puis matchTree

1. Parcours T1 (DFS ou BFS). Dès qu'un nœud a `val == t2.val`, appelle `matchTree(node, t2)`.
2. `matchTree(a, b)` n'est vrai que si les deux sont null, ou les deux non null avec la même valeur et des sous-arbres gauche et droit qui matchent.
3. Si un candidat matche entièrement, renvoie true. Si T1 se termine sans match, false.

C'est l'approche que la plupart esquissent en premier. Elle est claire et n'a pas besoin de mémoire de chaînes en plus.

Coût au pire cas: tu peux comparer T2 à beaucoup d'endroits de T1. Si T1 a taille `n`, T2 taille `m`, et beaucoup de nœuds partagent la valeur racine de T2, tu peux dépenser jusqu'à environ O(n · m). Quand les valeurs sont peu répétées, on se rapproche de O(n + m).

### Approche B: préordre avec marqueurs null, puis contains

1. Sérialise T1 et T2 avec un parcours **préordre** qui **enregistre les enfants null** (par exemple `X` pour null, ou un schéma de délimiteurs).
2. Demande si la chaîne de T2 est une **sous-chaîne** de celle de T1.

Pourquoi les marqueurs null comptent: sans eux, des formes différentes peuvent sérialiser pareil. Avec eux, un morceau contigu du préordre du grand arbre égal à la sérialisation complète du petit signifie que les formes enracinées matchent. Il te faut encore des séparateurs pour que des valeurs comme `12` ne fassent pas croire à `1` puis `2`. Un motif courant: envelopper les valeurs `"#3#"` et `"#X#"` pour null, concaténer, puis `contains`.

Temps: O(n + m) pour construire les chaînes (et la recherche de sous-chaîne est linéaire avec une bonne méthode; le `contains` de Java se mentionne). Espace: O(n + m) pour les chaînes.

Habitude d'entretien: mène avec **recherche + matchTree**. Cite la méthode chaînes comme second angle qui échange de l'espace contre une logique de match plus simple.

---

## Solution Java: recherche + matchTree

```java
public class CheckSubtree {

    public static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /**
     * Returns true if t2 is a subtree of t1 (same values and structure under some node).
     * Empty t2 is treated as a subtree. Null t1 with non-empty t2 is not.
     */
    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) {
            return true;
        }
        if (t1 == null) {
            return false;
        }
        return subTree(t1, t2);
    }

    /** Walk t1; at each node try a full match against t2. */
    private static boolean subTree(TreeNode r1, TreeNode r2) {
        if (r1 == null) {
            return false;
        }
        if (r1.val == r2.val && matchTree(r1, r2)) {
            return true;
        }
        return subTree(r1.left, r2) || subTree(r1.right, r2);
    }

    /** True only if both trees are identical from these roots. */
    private static boolean matchTree(TreeNode a, TreeNode b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (a.val != b.val) {
            return false;
        }
        return matchTree(a.left, b.left) && matchTree(a.right, b.right);
    }
}
```

Trace du premier exemple: `subTree` parcourt T1, atteint le nœud `2`, `matchTree` vérifie `2/4/5` contre T2 et renvoie true. Terminé.

Si le nœud `2` de T1 avait un autre enfant droit, `matchTree` échoue et la recherche continue dans le reste de T1.

---

## Solution Java: chaînes préordre + contains

```java
public class CheckSubtreeSerialized {

    public static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) {
            return true;
        }
        if (t1 == null) {
            return false;
        }
        String s1 = serialize(t1);
        String s2 = serialize(t2);
        return s1.contains(s2);
    }

    /** Preorder with null markers and value wrappers so tokens cannot glue. */
    private static String serialize(TreeNode node) {
        StringBuilder sb = new StringBuilder();
        write(node, sb);
        return sb.toString();
    }

    private static void write(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("#X#");
            return;
        }
        sb.append('#').append(node.val).append('#');
        write(node.left, sb);
        write(node.right, sb);
    }
}
```

Idée d'exemple (tokens simplifiés): T2 peut ressembler à `#2##4##X##X##5##X##X#`. Ce bloc complet doit apparaître dans la sérialisation de T1 pour un true. Les enveloppes `#` empêchent `12` de ressembler à `1` suivi de `2`.

---

## Complexité

| Approche | Temps (approx.) | Espace extra | Notes |
| --- | --- | --- | --- |
| recherche + matchTree | O(n + k · m) pire ~ O(n · m) | O(h) récursion (hauteur de T1 / T2) | `k` = fois où la valeur racine de T2 apparaît dans T1 |
| chaîne préordre + contains | O(n + m) construction (+ recherche linéaire) | O(n + m) chaînes | match plus simple; tu paies la mémoire |

`n` = nœuds dans T1, `m` = nœuds dans T2. L'énoncé dit que T1 est bien plus grand que T2, donc les deux sont pratiques; dis quel compromis tu choisis.

---

## Cas limites que l'intervieweur pique

1. **T2 null / vide.** Contrat: souvent `true` (le vide est un sous-arbre). Dis-le.
2. **T1 null, T2 non vide.** `false`.
3. **Arbres identiques.** T2 égale T1. Le premier nœud matche entièrement; `true`.
4. **Valeurs de racine répétées.** Plusieurs nœuds de T1 égaux à la racine de T2; un seul match complet (ou aucun). Ne t'arrête pas au premier hit de valeur sans `matchTree`.
5. **Mêmes valeurs, mauvaise forme.** Gauche/droite échangés, ou null manquant. `matchTree` et la sérialisation avec null le voient.
6. **T2 plus grand que T1.** Ne peut être true que s'ils sont égaux en taille et structure; souvent false. Les deux algos restent corrects.
7. **T2 à un seul nœud.** True ssi cette valeur apparaît quelque part dans T1.
8. **Arbres profonds et fins.** La profondeur de récursion est la hauteur. Mentionne la pile; des variantes itératives existent s'ils s'en soucient.

---

## Erreurs courantes

* Vérifier seulement que chaque valeur de T2 apparaît dans T1 (égalité de multiensembles). La forme est ignorée.
* Matcher un **chemin** au lieu d'un **sous-arbre complet** (oublier frères et nulls).
* Sérialiser **sans marqueurs null**, donc des topologies différentes entrent en collision.
* Sérialiser sans **délimiteurs de valeur**, donc des valeurs multi-chiffres se collent (`12` vs `1`,`2`).
* Dans `subTree`, comparer les valeurs et renvoyer true sans appeler `matchTree` sur toute la forme.
* Muter T1 ou T2 pendant le test.
* Confondre "sous-arbre" avec "T2 est une plage BST dans un BST". Ici: arbres binaires généraux et identité structurelle.

---

## Récap à raconter à un ami

Le petit arbre est-il posé quelque part dans le grand comme une branche complète?

Parcours le grand. Chaque fois que tu vois la valeur racine du petit, compare les formes entières: les deux null, ou même valeur et gauche/droite identiques. Si un candidat colle, oui.

Ou écris les deux arbres en texte préordre qui enregistre les enfants vides et enveloppe chaque valeur. Si le petit texte est dans le grand, les formes matchent.

En entretien, mène avec recherche + matchTree. Garde l'astuce des chaînes comme seconde histoire s'ils demandent une autre voie.

---

## Pratique

1. Code `containsTree` et `matchTree` de mémoire sur papier.
2. Dessine un T1 avec deux nœuds égaux à la racine de T2; un seul est un vrai sous-arbre. Trace quel candidat échoue.
3. Sérialise un tout petit arbre avec et sans marqueurs null; montre comment deux formes différentes entrent en collision sans marqueurs.
4. Explique O(n · m) vs O(n + m) et quand chacun apparaît.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [BST Sequences](/blog/fr/ctci-4-9-bst-sequences)
* Suivant: [Random Node](/blog/fr/ctci-4-11-random-node)