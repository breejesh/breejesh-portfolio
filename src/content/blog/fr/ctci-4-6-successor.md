---
title: "Successor: nœud suivant en parcours in-order d'un BST (Java)"
description: "Problème style CTCI 4.6 pour débutants: trouve le successeur in-order d'un nœud dans un arbre de recherche binaire quand chaque nœud a un lien parent. Plus à gauche du sous-arbre droit, ou remonte les parents tant que tu es fils droit."
date: "2026-02-22"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-6-successor.webp
previewImage: /assets/images/ctci-4-6-successor.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.6 pour débutants: trouve le successeur in-order d'un nœud dans un arbre de recherche binaire quand chaque nœud a un lien parent. Plus à gauche du sous-arbre droit, ou remonte les parents tant que tu es fils droit.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Le parcours in-order d'un BST imprime les clés dans l'ordre. Pour un nœud donné, le **successeur** est la clé suivante que ce parcours visiterait. Tu ne redémarres pas à la racine pour balayer tout l'arbre. Tu tiens déjà le nœud, et chaque nœud a un pointeur `parent`.

Ce billet est un enseignement original pour débutants en **Java**. Même famille que les questions classiques de successeur BST, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## 1. Analogie de la file triée

Imagine le BST comme une file de personnes triées par taille (ou clé). In-order veut dire: sous-arbre gauche, puis moi, puis sous-arbre droit. Le successeur d'une personne est celle juste à sa droite dans cette file.

Deux façons de la trouver sans redessiner toute la file:

* **Tu as une branche à droite.** Le suivant n'est pas ton fils droit. C'est la personne **la plus à gauche** de cette branche droite (la plus petite clé encore plus grande que la tienne).
* **Tu n'as pas de branche droite.** Tu as fini ta gauche et toi-même. Remonte vers la racine tant que tu es encore fils **droit**. Le premier ancêtre pour lequel tu es à **gauche** est le suivant dans la file. Si tu dépasses la racine, tu étais le dernier.

Les liens parent sont l'échelle. Sans eux, tu chercherais depuis la racine à chaque fois.

---

## 2. Problème en mots simples

**But:** étant donné un nœud `n` dans un arbre de recherche binaire, renvoyer le successeur in-order de `n`, ou `null` si `n` est le dernier.

**Hypothèses:**

* Les nœuds ont `left`, `right` et `parent`.
* L'arbre est un BST (clés gauches plus petites, droites plus grandes), ou au moins tu ne veux que le nœud suivant structurel en in-order.
* Tu pars de `n` seul; tu n'as pas la racine à part sauf en remontant jusqu'à elle.

**À clarifier avant de coder:**

* Et si `n` est null? (Renvoyer null.)
* Et si `n` n'a ni parent ni fils droit? (C'est la racine et le dernier; renvoyer null.)
* Clés en double? (Le problème suppose souvent des clés uniques. Dis ta règle si on demande.)

---

## 3. Réfléchir d'abord

### Mauvaise première idée: tout dumper en in-order

Parcours l'arbre dans une liste, trouve `n`, renvoie l'index suivant. Correct mais O(N) en temps et espace. On veut O(H) avec les parents, H = hauteur.

### Cas A: un fils droit existe

Le successeur est le minimum du sous-arbre droit:

1. Va en `n.right`.
2. Tant que `left` n'est pas null, va à gauche.
3. Ce nœud est la réponse.

Pourquoi? In-order fait gauche, nœud, droite. Après `n`, la première visite dans le sous-arbre droit est son nœud le plus à gauche.

### Cas B: pas de fils droit

Remonte les parents:

1. Pose `p = n.parent`, `c = n`.
2. Tant que `p` n'est pas null et `c == p.right` (tu es encore fils droit), fais `c = p`, `p = p.parent`.
3. Renvoie `p` (peut être null si tu étais le dernier du tout).

Pourquoi? Tu as fini un sous-arbre droit. Continue de monter jusqu'à entrer dans un nœud par la gauche. Ce nœud n'a pas encore été "visité" dans le parcours in-order mental.

### Schéma

```
        20
       /  \
     10    30
    /  \     \
   5   15    40
      /
    12
```

| Nœud | Successeur | Pourquoi |
| --- | --- | --- |
| 10 | 12 | fils droit 15; le plus à gauche de cette branche est 12 |
| 15 | 20 | pas de droite; 15 est droit de 10, on remonte; 10 est gauche de 20 → 20 |
| 40 | null | pas de droite; remonte comme droit de 30, puis de 20; la racine n'a pas de parent |
| 5 | 10 | pas de droite; 5 est gauche de 10 → parent 10 |

---

## 4. Solution Java

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode parent;

    TreeNode(int val) {
        this.val = val;
    }
}

class Solution {
    /** Successeur in-order de n, ou null si n est dernier / null. */
    TreeNode inOrderSuccessor(TreeNode n) {
        if (n == null) {
            return null;
        }

        // Cas A: sous-arbre droit → plus à gauche de la droite
        if (n.right != null) {
            return leftMostChild(n.right);
        }

        // Cas B: remonter tant qu'on est fils droit
        TreeNode current = n;
        TreeNode p = n.parent;
        while (p != null && p.right == current) {
            current = p;
            p = p.parent;
        }
        return p;
    }

    private TreeNode leftMostChild(TreeNode n) {
        if (n == null) {
            return null;
        }
        while (n.left != null) {
            n = n.left;
        }
        return n;
    }
}
```

Notes sur le helper:

* `leftMostChild` est la même idée que "minimum dans un sous-arbre BST".
* La boucle s'arrête quand `p == null` (pas de successeur) ou quand `current` est `p.left` (ancêtre suivant trouvé).
* Tu n'as pas besoin de la racine en argument séparé si les parents sont complets.

Optionnel: si l'intervieweur interdit les parents, tu cherches depuis la racine avec un candidat (dernier nœud plus grand que `n` en marchant). Autre setup; ce billet reste sur les liens parent.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra |
| --- | --- | --- |
| Successeur avec parents (cette solution) | O(H) | O(1) |
| Liste in-order complète puis index | O(N) | O(N) |
| Depuis la racine sans parents (candidat) | O(H) | O(1) |

H est la hauteur. Arbre équilibré ≈ log N. Dégénéré peut être N. L'espace du parcours avec parents reste constant.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs testent surtout:

* **Entrée null** → renvoyer null.
* **Nœud le plus à droite** → remonter à la racine puis null. Le dernier in-order n'a pas de successeur.
* **Racine avec seulement un sous-arbre gauche** → successeur de la racine sans droite = null (la racine est dernière s'il n'y a pas de droite).
* **Feuille fille gauche** → le successeur est son parent (presque pas de tours de boucle).
* **Longue épine droite** → la remontée touche beaucoup de parents; c'est encore O(H), pas un bug.

Erreurs fréquentes:

1. **Renvoyer le fils droit tel quel** au lieu du plus à gauche du sous-arbre droit. Tu sautes la chaîne gauche sous ce fils.
2. **Ne remonter qu'un seul parent** toujours. Il faut boucler tant que tu restes fils droit.
3. **Oublier que parent est null** à la racine et faire un NPE sur `p.right`.
4. **Confondre successeur et prédécesseur.** Le prédécesseur est symétrique: pas de gauche → remonter tant que fils gauche; ou le plus à droite du sous-arbre gauche.
5. **Supposer un arbre équilibré** en citant le temps. Dis O(H), pire cas O(N).
6. **Muter l'arbre** pour enfiler des parents à la volée. Inutile s'ils existent déjà.

Esquisse d'usage minimale:

```java
// Construis un petit arbre avec parents des deux côtés, puis:
TreeNode fifteen = /* nœud 15 */;
TreeNode next = new Solution().inOrderSuccessor(fifteen); // 20 sur le schéma ci-dessus
```

---

## 7. Récap pour un ami

Successor, c'est "qui vient après en ordre / in-order" pour un nœud du BST:

1. S'il a un fils droit, va une fois à droite puis à gauche tant que possible. Ce nœud est le suivant.
2. Sinon, remonte les parents tant que tu es encore le fils droit. Le premier parent atteint depuis la gauche est le suivant.
3. S'il n'y a plus de parents, pas de suivant.
4. Les pointeurs parent donnent O(hauteur) et O(1) d'espace extra. Pas de dump complet de l'arbre.

Si tu dessines les deux cas au tableau et tu joues 15 → 20 et 40 → null sur un arbre d'exemple, tu maîtrises le 4.6.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Validate BST](/blog/fr/ctci-4-5-validate-bst)
* Suivant: [Build Order](/blog/fr/ctci-4-7-build-order)