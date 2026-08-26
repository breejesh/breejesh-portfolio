---
title: "Random Node: tirage uniforme dans un BST (Java)"
description: "Problème style CTCI 4.11 pour débutants: construis un BST avec insert, find, delete et getRandomNode pour que chaque nœud soit équiprobable. Stocke la taille du sous-arbre sur chaque nœud et parcours un index aléatoire."
date: "2026-03-17"
tags: [Algorithmes et Structures, Outils Développeur et Régulation]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.11 pour débutants: construis un BST avec insert, find, delete et getRandomNode pour que chaque nœud soit équiprobable. Stocke la taille du sous-arbre sur chaque nœud et parcours un index aléatoire.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu organises une tombola où chaque personne d'un arbre familial doit avoir la même chance de gagner. Tu ne peux pas tout copier dans une liste à chaque demande de gagnant. Ça marche, mais c'est lent et lourd. Si chaque personne sait déjà combien de gens sont sous elle, tu lances un dé et tu descends l'arbre jusqu'au siège choisi. C'est **Random Node**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de conception d'arbres en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 4, arbres et graphes.

---

## 1. Analogie du quotidien

Imagine un organigramme qui est aussi un **arbre binaire de recherche** (clés gauches plus petites ou égales, droites plus grandes). Chaque fiche employé affiche:

* son numéro (la clé)
* combien de personnes sont dans tout son sous-arbre, elle comprise (`size`)

Il te faut `getRandomNode()` tel que s'il y a 10 personnes, chacune a probabilité 1/10.

Pense les tailles de sous-arbre comme des places assises:

1. Chez la personne courante, regarde combien de places sont dans l'équipe **gauche**.
2. Tire un numéro de place entre `0` et `size - 1`.
3. Si la place est dans la plage gauche, descends à gauche.
4. Si elle vaut exactement le compte gauche, c'est cette personne.
5. Sinon descends à droite en soustrayant les places gauches et la place courante.

Un seul tirage (ou un par niveau, même idée) choisit parmi les places. Les `size` gardent le comptage honnête après inserts et deletes.

---

## 2. Problème en mots simples

**Construis** une classe d'arbre binaire de recherche from scratch avec:

| Méthode | Sens |
| --- | --- |
| `insert(value)` | insérer dans le BST |
| `find(value)` | renvoyer le nœud de cette clé, ou null |
| `delete(value)` | retirer un nœud de cette clé (s'il existe) |
| `getRandomNode()` | renvoyer un nœud choisi **uniformément** au hasard parmi tous |

**Règles:**

* Chaque nœud présent dans l'arbre doit être équiprobable.
* Tu possèdes le type de nœud, donc tu peux stocker des champs en plus (c'est le point).
* Arbre vide: `getRandomNode` renvoie `null`.

**Clarifie avant de coder:**

* Doublons autorisés? (Oui ici: `<=` va à gauche.)
* Delete doit-il rééquilibrer? (Non. Delete BST standard suffit. Garde `size` correct.)
* Uniforme sur les nœuds, pas sur les valeurs? (Oui. Deux nœuds à la même valeur = deux places.)

---

## 3. Réfléchis d'abord

### Pourquoi le libellé compte

L'intervieweur n'a pas seulement dit "renvoie un nœud aléatoire d'un arbre binaire". Il a dit que tu implémentes la classe **from scratch**. Indice: change la structure. Ajoute des champs. Mets-les à jour à l'insert et au delete.

### Option A: copier tous les nœuds dans un tableau (lent)

Parcours l'arbre, remplis une liste, prends `list.get(random.nextInt(list.size()))`.

* Correct et uniforme.
* Temps O(N) à chaque appel, espace O(N).
* Correct comme première réponse. On veut en général mieux.

### Option B: tableau permanent de nœuds

Même idée, maintenu à chaque insert/delete. Supprimer au milieu d'un tableau coûte O(N). Peu séduisant.

### Option C: stocker `size` sur chaque nœud (solution principale)

Chaque nœud suit:

```
size = 1 + size(left) + size(right)
```

À l'**insert**, incrémente `size` sur chaque ancêtre du chemin (ou recalcule au retour).

Au **delete**, diminue `size` de la même façon après le changement structurel.

Pour **getRandomNode**:

1. Si root est null, renvoie null.
2. Soit `i = random.nextInt(root.size())` (plage `0 .. N-1`).
3. Parcours avec `getIthNode(i)`:

| Condition | Action |
| --- | --- |
| `i < leftSize` | aller à gauche avec le même `i` |
| `i == leftSize` | renvoyer ce nœud |
| `i > leftSize` | aller à droite avec `i - leftSize - 1` |

Pourquoi `- leftSize - 1` à droite? Tu sautes tout le sous-arbre gauche **et** le nœud courant, donc le droit voit des indices renumérotés depuis 0.

C'est "trouver le i-ème nœud en parcours infixé" sans construire la liste.

### Option D: retirer au hasard à chaque niveau

À chaque nœud, tire un index frais dans `0 .. size-1` et branche. Aussi uniforme. Plus d'appels random. Le parcours à un index est plus propre et suffit en entretien.

### À éviter

* Choisir gauche/droite/moi avec proba fixe 1/3 (arbres déséquilibrés cassent l'uniformité).
* N'utiliser que le size de la racine et ignorer la gauche (parcours injuste).
* Oublier de mettre à jour `size` à l'insert ou au delete (biais ensuite).

---

## 4. Solution Java

```java
import java.util.Random;

class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;
    int size; // nodes in this subtree, including this

    TreeNode(int d) {
        data = d;
        size = 1;
    }

    /** Insert value into this BST subtree. Call on root from Tree. */
    void insertInOrder(int d) {
        if (d <= data) {
            if (left == null) {
                left = new TreeNode(d);
            } else {
                left.insertInOrder(d);
            }
        } else {
            if (right == null) {
                right = new TreeNode(d);
            } else {
                right.insertInOrder(d);
            }
        }
        size++; // this subtree grew by one
    }

    TreeNode find(int d) {
        if (d == data) {
            return this;
        } else if (d < data) {
            return left != null ? left.find(d) : null;
        } else {
            return right != null ? right.find(d) : null;
        }
    }

    /**
     * Return the node at in-order index i (0-based) in this subtree.
     * leftSize seats are on the left, then this node, then the right.
     */
    TreeNode getIthNode(int i) {
        int leftSize = left == null ? 0 : left.size;
        if (i < leftSize) {
            return left.getIthNode(i);
        } else if (i == leftSize) {
            return this;
        } else {
            // skip left subtree and this node
            return right.getIthNode(i - leftSize - 1);
        }
    }

    void refreshSize() {
        int ls = left == null ? 0 : left.size;
        int rs = right == null ? 0 : right.size;
        size = 1 + ls + rs;
    }
}

class Tree {
    private TreeNode root;
    private final Random random = new Random();

    int size() {
        return root == null ? 0 : root.size;
    }

    void insert(int value) {
        if (root == null) {
            root = new TreeNode(value);
        } else {
            root.insertInOrder(value);
        }
    }

    TreeNode find(int value) {
        return root == null ? null : root.find(value);
    }

    TreeNode getRandomNode() {
        if (root == null) {
            return null;
        }
        int i = random.nextInt(size()); // 0 .. N-1
        return root.getIthNode(i);
    }

    /** Delete one occurrence of value. Returns true if something was removed. */
    boolean delete(int value) {
        if (root == null) {
            return false;
        }
        int before = size();
        root = deleteNode(root, value);
        return size() < before;
    }

    private TreeNode deleteNode(TreeNode node, int value) {
        if (node == null) {
            return null;
        }
        if (value < node.data) {
            node.left = deleteNode(node.left, value);
        } else if (value > node.data) {
            node.right = deleteNode(node.right, value);
        } else {
            // found: standard BST delete
            if (node.left == null) {
                return node.right;
            }
            if (node.right == null) {
                return node.left;
            }
            // two children: copy in-order successor, then remove it from the right
            TreeNode succ = minNode(node.right);
            node.data = succ.data;
            node.right = deleteNode(node.right, succ.data);
        }
        node.refreshSize();
        return node;
    }

    private TreeNode minNode(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

**Parcours** (insert 20, 10, 30, 5, 15):

```
        20 (size 5)
       /  \
   10 (3)  30 (1)
   /  \
5(1) 15(1)
```

* Aléatoire `i = 0` → gauche de 20 a size 3, `0 < 3` → vers 10 → gauche de 10 size 1, `0 < 1` → vers 5 → left size 0, `0 == 0` → renvoie **5**.
* Aléatoire `i = 2` → en 20, leftSize 3, `2 < 3` → en 10, leftSize 1, `2 > 1` → droite avec `2 - 1 - 1 = 0` → en 15 → renvoie **15**.
* Aléatoire `i = 3` → en 20, `3 == 3` → renvoie **20**.
* Aléatoire `i = 4` → droite avec `4 - 3 - 1 = 0` → renvoie **30**.

Chacun des cinq nœuds correspond à exactement un index. Uniforme.

Pourquoi ne pas choisir gauche avec proba `leftSize / size`, moi avec `1 / size`, droite avec `rightSize / size`? Tu peux. C'est la version multi-tirages. Un seul index, c'est la même math avec un tirage en haut.

---

## 5. Tableau de complexité

| Opération | Temps (équilibré) | Temps (pire, déséquilibré) | Notes |
| --- | --- | --- | --- |
| `insert` | O(log N) | O(N) | chemin hauteur + size++ |
| `find` | O(log N) | O(N) | recherche BST classique |
| `delete` | O(log N) | O(N) | delete BST + refresh size |
| `getRandomNode` | O(log N) | O(N) | un random int + chemin |
| Copie tableau à chaque fois | O(N) | O(N) | toujours parcours complet |

L'espace est O(N) pour l'arbre. Le champ `size` est O(1) par nœud. Pas de buffer O(N) pour le tirage.

Le temps se décrit bien comme **O(D)** où D est la profondeur. Arbres équilibrés: O(log N). Insertion déjà triée sans rééquilibrage reste correcte, juste plus lente.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs poussent ici:

* **Arbre vide** → `getRandomNode` renvoie `null`. N'appelle pas `nextInt(0)`.
* **Un seul nœud** → seul index 0, toujours ce nœud.
* **Tous les inserts d'un côté** → encore uniforme si les sizes sont justes; chemins plus profonds seulement.
* **Doublons** → chaque nœud est une place. Size compte les nœuds, pas les clés distinctes.
* **Delete racine / feuille / deux enfants** → la forme change; les sizes doivent coller.

Erreurs fréquentes:

1. **Probas 1/3 / 1/3 / 1/3** pour gauche, moi, droite. Arbres déséquilibrés biaisent.
2. **Oublier `size++` sur le chemin d'insert.** Le size de la racine ment.
3. **Ne pas corriger les sizes après delete.** Même biais, pire avec le temps.
4. **Utiliser `i - leftSize` sans le `-1` en allant à droite.** Off-by-one: le nœud courant a aussi consommé un index.
5. **Supposer des valeurs uniques pour compter.** L'uniformité est sur les **nœuds**.
6. **Construire toute la liste "par sécurité"** alors que tu as déjà les sizes. Tu jettes le O(D).

Usage minimal:

```java
Tree tree = new Tree();
tree.insert(20);
tree.insert(10);
tree.insert(30);
TreeNode r = tree.getRandomNode(); // one of 20, 10, 30 with equal chance
tree.delete(10);
TreeNode f = tree.find(30);
```

---

## 7. Résumé à un ami

Random Node est un problème de conception d'arbre, pas seulement un one-liner de hasard:

1. Tu possèdes la classe BST, donc stocke **`size`** sur chaque nœud: nombre de nœuds dans ce sous-arbre.
2. Garde les sizes honnêtes à l'**insert** et au **delete**.
3. `getRandomNode` tire un index `i` de `0` à `N - 1`, puis marche: gauche si `i` est dans le compte gauche, courant si égal, droite avec `i` ajusté sinon.
4. Ce parcours est "trouve le i-ème en infixé" sans tableau.
5. Le temps suit la hauteur. L'espace est un int par nœud.

Si tu dessines un petit arbre avec sizes, maps les indices 0..N-1 aux nœuds et expliques pourquoi à droite on fait `i - leftSize - 1`, tu maîtrises le 4.11.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Check Subtree](/blog/fr/ctci-4-10-check-subtree)
* Suivant: [Paths with Sum](/blog/fr/ctci-4-12-paths-with-sum)