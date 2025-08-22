---
title: "BST Sequences: tous les tableaux qui construisent le même arbre (Java)"
description: "Problème style CTCI 4.9 pour débutants: étant donné un BST construit par insertions de gauche à droite, lister chaque tableau qui a pu le produire. Racine d'abord, puis entrelacer (weave) les séquences des sous-arbres gauche et droit avec un helper récursif."
date: "2025-08-22"
tags: [Algorithmes]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.9 pour débutants: étant donné un BST construit par insertions de gauche à droite, lister chaque tableau qui a pu le produire. Racine d'abord, puis entrelacer (weave) les séquences des sous-arbres gauche et droit avec un helper récursif.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu insères des nombres dans un arbre binaire de recherche vide, un par un, en descendant toujours depuis la racine jusqu'au premier emplacement enfant vide. La forme finale de l'arbre dépend de l'**ordre**. Des tableaux différents peuvent grandir jusqu'au **même** arbre. Le problème 4.9 inverse la question habituelle: étant donné le BST terminé, imprime chaque tableau qui a pu le construire.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de "reconstruire les ordres d'insertion" en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Arbres et graphes, problème **4.9**.

---

## 1. Analogie du jeu de cartes

Imagine un croupier qui dépose des cartes dans deux piles latérales sous une carte du dessus:

* La **carte du dessus** est toujours distribuée en premier. Cette carte devient la racine du BST. Rien d'autre ne peut être la racine si l'arbre a déjà cette valeur de racine.
* Les cartes plus petites que la racine ne vont que dans la **pile gauche** (sous-arbre gauche). Les plus grandes ne vont que dans la **pile droite**.
* Dans chaque pile, les cartes gardent un ordre parent-avant-enfant. Tu ne peux pas insérer un petit-enfant avant son parent si le parent est le seul chemin vers cet emplacement.
* Entre gauche et droite, le croupier peut **entrelacer** librement. Après la racine, tu peux poser une carte gauche, puis une droite, puis encore une gauche, tant que chaque pile garde son ordre interne.

Donc la réponse complète est: racine d'abord, puis chaque **weave** légal d'une séquence gauche avec une séquence droite.

Petit arbre:

```
    2
   / \
  1   3
```

Seulement deux tableaux d'insertion:

* `{2, 1, 3}`
* `{2, 3, 1}`

`{1, 2, 3}` est faux: la racine serait `1`, pas `2`. `{2, 1, 3}` et `{2, 3, 1}` produisent exactement cette forme.

---

## 2. Énoncé en mots simples

**Entrée:** racine d'un arbre binaire de recherche avec des valeurs entières **distinctes**. L'arbre a été construit en insérant les éléments d'un tableau de gauche à droite dans un BST vide.

**Sortie:** tous les tableaux (listes de valeurs) qui, insérés dans l'ordre, produisent **exactement cet arbre**.

**Règles:**

* Valeurs distinctes (pas de clés égales).
* Insertion BST standard: gauche si plus petit, droite si plus grand, attacher au premier enfant null.
* Tu renvoies des séquences de valeurs, pas des références de nœuds.
* Arbre vide: une séquence vide est un choix d'enseignement propre (une façon de construire rien).

**Forme du nœud:**

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

**Clarifie avant de coder:**

* Valeurs distinctes seulement? (Oui pour ce problème.)
* Muter l'arbre? (Inutile. Lecture de structure seulement.)
* Imprimer ou renvoyer une collection? (Renvoyer une `List` de listes est plus facile à tester.)
* Et si l'arbre est null? (Une liste vide convient.)

---

## 3. Réfléchis d'abord

### Qu'est-ce qui doit être vrai pour chaque tableau valide?

1. **La racine est en premier.** Si une autre valeur venait en premier, cette valeur serait la racine.
2. **L'ordre relatif dans le sous-arbre gauche est fixé par ce sous-arbre.** Toutes les séquences gauches doivent être des ordres d'insertion valides pour ce sous-arbre.
3. **Idem pour le sous-arbre droit.**
4. **Gauche et droite peuvent s'entrelacer** de toute façon qui conserve ces deux ordres relatifs. Ce mélange est un **weave** (un mélange qui préserve l'ordre dans chaque paquet).

On devine parfois "tous les nœuds gauches avant tous les droits." Ce n'est qu'un seul weave. Après la racine `50`, tu peux insérer `20` puis `60`, ou `60` puis `20`. Les deux tombent du bon côté de `50`.

### Forme récursive

Pour le nœud `n`:

1. Calcule récursivement chaque séquence de `n.left` → `leftSeqs`.
2. Calcule récursivement chaque séquence de `n.right` → `rightSeqs`.
3. Pour chaque paire `(L, R)`, tisse `L` et `R` de toutes les façons, puis **préfixe** `n.val` à chaque weave.
4. Cas de base: un nœud `null` apporte une seule liste vide pour que le weave fonctionne encore quand un enfant manque.

### Ce que signifie "weave"

Tisser deux listes en gardant l'ordre interne de chacune.

Exemple:

* first = `{1, 2}`
* second = `{3, 4}`

Weaves:

| Résultat |
| --- |
| `{1, 2, 3, 4}` |
| `{1, 3, 2, 4}` |
| `{1, 3, 4, 2}` |
| `{3, 1, 2, 4}` |
| `{3, 1, 4, 2}` |
| `{3, 4, 1, 2}` |

Vérification du compte: si les longueurs sont `a` et `b`, le nombre de weaves est `C(a+b, a)` (choisir les emplacements pour la première liste; le reste va à la seconde).

Idée récursive du weave:

* Si l'une des listes est vide, ajoute le reste des deux au préfixe courant et stocke ce résultat.
* Sinon deux branches: prendre la tête de `first` dans le préfixe, ou celle de `second`. Récursion. Annule la mutation pour que les appels frères voient les listes d'origine.

Utiliser `LinkedList` rend peu coûteux le retrait et la restauration de la tête. Clone le préfixe quand tu stockes une séquence finie pour que des mutations plus tard ne réécrivent pas les réponses passées.

### Deux jobs récursifs, garde-les séparés

`allSequences` construit les ensembles de séquences des sous-arbres et préfixe la racine.

`weaveLists` ne fusionne que deux listes.

Ne mélange pas ces responsabilités dans une seule fonction. Fais confiance au weave quand tu l'appelles depuis `allSequences`. Fais confiance à la restauration des listes en implémentant weave.

---

## 4. Solution Java

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BstSequences {

    public List<LinkedList<Integer>> allSequences(TreeNode node) {
        List<LinkedList<Integer>> result = new ArrayList<>();

        if (node == null) {
            result.add(new LinkedList<>());
            return result;
        }

        LinkedList<Integer> prefix = new LinkedList<>();
        prefix.add(node.val);

        List<LinkedList<Integer>> leftSeq = allSequences(node.left);
        List<LinkedList<Integer>> rightSeq = allSequences(node.right);

        for (LinkedList<Integer> left : leftSeq) {
            for (LinkedList<Integer> right : rightSeq) {
                List<LinkedList<Integer>> weaved = new ArrayList<>();
                weaveLists(left, right, weaved, prefix);
                result.addAll(weaved);
            }
        }
        return result;
    }

    /**
     * Weave first and second in all ways that keep relative order inside each list.
     * Mutates first/second/prefix during recursion, then restores them.
     */
    void weaveLists(
            LinkedList<Integer> first,
            LinkedList<Integer> second,
            List<LinkedList<Integer>> results,
            LinkedList<Integer> prefix) {

        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> complete = new LinkedList<>(prefix);
            complete.addAll(first);
            complete.addAll(second);
            results.add(complete);
            return;
        }

        // take head of first
        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        // take head of second
        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

Parcours de l'arbre exemple `2 / 1  3`:

1. L'enfant gauche `1` est une feuille: séquences `{{1}}`.
2. L'enfant droit `3` est une feuille: séquences `{{3}}`.
3. Weave de `{1}` avec `{3}`: `{1,3}` et `{3,1}`.
4. Préfixer la racine `2`: `{2,1,3}` et `{2,3,1}`.

Esquisse plus large: racine `50`, sous-arbre gauche en `20`, droit en `60`. Récursion jusqu'à ce que chaque sous-arbre renvoie son propre ensemble de séquences. Tisse chaque séquence gauche avec chaque séquence droite, puis mets `50` devant chaque weave. C'est la réponse complète pour l'arbre.

Usage minimal:

```java
TreeNode root = new TreeNode(2);
root.left = new TreeNode(1);
root.right = new TreeNode(3);

List<LinkedList<Integer>> seqs = new BstSequences().allSequences(root);
// [[2, 1, 3], [2, 3, 1]]
```

---

## 5. Tableau de complexité

| Élément | Notes de coût |
| --- | --- |
| Nombre de séquences | Peut croître de façon **combinatoire**. Pire cas: une chaîne fine d'un côté plus un grand weave libre avec l'autre. |
| Weave de longueurs a, b | `C(a+b, a)` résultats; chaque résultat coûte O(a+b) à construire (clone/append). |
| `allSequences` | Produit du compte gauche et du compte droit à chaque nœud, multiplié par le coût du weave. |
| Espace extra | La taille de la sortie domine. Profondeur de récursion O(H) pour le parcours d'arbre plus O(a+b) pour le weave. |

En entretien, une formule fermée compte moins que nommer l'explosion: la sortie peut être énorme, donc générer toutes les séquences ne convient qu'aux petits arbres.

Le temps est **sensible à la sortie**. Tu toucheras chaque séquence renvoyée. Ne prétends pas O(N) sauf si N est minuscule et l'arbre une pure chaîne (souvent une seule séquence).

---

## 6. Cas limites et erreurs courantes

Les intervieweurs touchent ceux-ci:

* **Racine null** → une séquence vide (ou liste de résultats vide si tu préfères; dis-le).
* **Un seul nœud** → seulement `{val}`.
* **Gauche seule ou droite seule** → pas de vrai entrelacement; les weaves se réduisent à "le côté non vide après la racine."
* **Petit arbre équilibré** → weave classique à deux voies après la racine (exemple `2/1/3`).
* **Gauche profonde, droite profonde** → beaucoup de weaves; surveille la pile et le clonage.

Erreurs courantes:

1. **Forcer tout le gauche avant tout le droit.** Tu rates la moitié (ou plus) des ordres valides.
2. **Oublier que la racine doit être première.** Toute séquence qui commence par une non-racine est invalide pour cet arbre.
3. **Casser l'ordre relatif dans un sous-arbre.** Si la gauche exige `20` avant `10`, un weave ne peut pas mettre `10` devant `20`.
4. **Ne pas restaurer les listes après la récursion.** Partager le même `LinkedList` sans annulation corrompt les branches sœurs.
5. **Muter le préfixe partagé en stockant les résultats.** Clone avant `results.add`.
6. **Énumérer les permutations de tous les nœuds et tester chaque insertion.** Marche pour un petit N, rate l'esprit du problème, et est bien plus lent qu'un weave structuré.

Auto-contrôle rapide en entretien: prends un tableau renvoyé, insère-le dans un BST frais, confirme que la forme correspond. Vérifie un weave qui entrelace gauche et droite tôt.

---

## 7. Résumé à expliquer à un ami

BST Sequences répond à "quels ordres d'insertion reconstruisent exactement ce BST?":

1. La racine est toujours la première insertion.
2. Liste récursivement chaque ordre valide pour le sous-arbre gauche et pour le droit.
3. **Tisse (weave)** chaque liste gauche avec chaque liste droite en gardant l'ordre dans chaque liste.
4. Préfixe la racine à chaque weave.
5. Implémente weave en prenant répétitivement la tête suivante de gauche ou de droite, avec annulation après chaque branche récursive.

Si tu peux dessiner l'exemple à trois nœuds, écrire les deux réponses, et expliquer pourquoi `{1,2,3}` est illégal pour la racine `2`, tu maîtrises le problème 4.9.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [First Common Ancestor](/blog/fr/ctci-4-8-first-common-ancestor)
* Suivant: [Check Subtree](/blog/fr/ctci-4-10-check-subtree)