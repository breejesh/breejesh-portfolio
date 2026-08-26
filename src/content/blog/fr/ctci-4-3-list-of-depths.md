---
title: "List of Depths: une linked list par niveau d'arbre (Java)"
description: "Problème style CTCI 4.3 pour débutants: transforme un arbre binaire en une liste de linked lists, une par profondeur. BFS niveau par niveau d'abord, DFS optionnel avec un index de profondeur, en Java clair."
date: "2025-10-19"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-3-list-of-depths.webp
previewImage: /assets/images/ctci-4-3-list-of-depths.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.3 pour débutants: transforme un arbre binaire en une liste de linked lists, une par profondeur. BFS niveau par niveau d'abord, DFS optionnel avec un index de profondeur, en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un immeuble a des étages. Tout le monde au rez-de-chaussée forme un groupe. Tout le monde à l'étage 1 en forme un autre. Même idée pour un arbre binaire: la **profondeur 0** est la racine seule, la **profondeur 1** ce sont les enfants de la racine, et ainsi de suite. Le travail n'est pas de parcourir l'arbre au hasard. C'est de produire une liste de nœuds pour chaque profondeur, pour pouvoir livrer "tout le monde à ce niveau" sans re-marcher l'arbre.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de parcours par niveaux en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## 1. Analogie du quotidien

Imagine un immeuble de bureaux où les gens sont disposés comme un arbre:

* Étage 0: la CEO (racine).
* Étage 1: les deux rapports directs.
* Étage 2: leurs rapports, etc.

Les RH veulent un **presse-papiers par étage**: une linked list de tous ceux qui se tiennent à cet étage, de gauche à droite si tu balayes l'immeuble par niveaux.

Tu peux:

1. **Aller étage par étage** avec une file de gens sur l'étage courant (BFS). Tu traites tout le monde à l'étage k, tu les écris sur le presse-papiers k, puis tu enfiles leurs enfants pour l'étage k+1.
2. **Visiter les gens un par un** et leur coller un post-it avec leur numéro d'étage (DFS). Quand tu rencontres quelqu'un à l'étage d, tu l'ajoutes au presse-papiers d. S'il n'existe pas encore, tu le crées.

Les deux finissent avec la même forme: une liste de listes, index = profondeur.

---

## 2. Problème en mots simples

**Entrée:** la racine d'un arbre binaire (ou `null` pour un arbre vide).

**Sortie:** une liste de linked lists de nœuds. L'entrée `i` contient tous les nœuds à la profondeur `i`, en général de gauche à droite sur ce niveau si tu utilises le BFS.

Si l'arbre a une hauteur H (nombre d'arêtes sur le plus long chemin racine-feuille), tu obtiens H+1 listes (profondeurs 0 à H). Un arbre vide donne une liste extérieure vide.

**Forme de nœud utilisée:**

```java
class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;

    TreeNode(int data) {
        this.data = data;
    }
}
```

**Exemple:**

```
        4
       / \
      2   6
     / \   \
    1   3   7
```

Attendu (valeurs affichées; les listes tiennent des objets nœud):

| Profondeur | Liste (gauche à droite) |
| --- | --- |
| 0 | 4 |
| 1 | 2 → 6 |
| 2 | 1 → 3 → 7 |

**Clarifie avant de coder:**

* Linked lists de **références de nœuds**, ou copies de valeurs? (Références vers les nœuds de l'arbre, sauf demande contraire.)
* Ordre dans un niveau? (En général gauche à droite. Le BFS le donne gratuitement.)
* Peut-on utiliser `java.util.LinkedList` / `ArrayList`? (Oui dans cette série.)
* Arbre vide et arbre à un seul nœud?

---

## 3. Réfléchir d'abord

### Approche A: BFS niveau par niveau (principale)

C'est l'ajustement naturel. Le parcours par niveaux regroupe déjà par profondeur.

1. Si `root` est `null`, renvoie un résultat vide.
2. Mets la racine dans une file.
3. Tant que la file n'est pas vide:
   * Note `levelSize = queue.size()` (combien de nœuds sont à cette profondeur maintenant).
   * Crée une nouvelle linked list pour cette profondeur.
   * Répète `levelSize` fois: défile un nœud, ajoute-le à la liste du niveau, enfile left et right s'ils existent.
   * Ajoute la liste du niveau au résultat.

Pourquoi `levelSize`? Sans ça, tu ne sais pas où une profondeur s'arrête et où la suivante commence, parce que la file contient aussi les enfants du niveau suivant.

### Approche B: DFS avec profondeur (optionnelle)

Récursion avec `(node, depth)`:

1. Maintiens une `List<LinkedList<TreeNode>>` extérieure.
2. Quand tu visites un nœud à la profondeur `d`, si `result.size() == d`, ajoute une nouvelle linked list vide (tu es le premier visiteur de cette profondeur).
3. Ajoute le nœud à `result.get(d)`.
4. Récursion à gauche avec `d + 1`, puis à droite avec `d + 1`.

L'ordre de visite est préordre (racine, gauche, droite). Dans un niveau, gauche à droite tient si tu vas toujours à gauche avant la droite.

Le DFS est utile si tu penses déjà en récursion, ou si tu veux éviter une file explicite. Le BFS est souvent plus clair en entretien "une liste par niveau".

### Ce qu'il ne faut pas faire

* Construire une seule liste géante de tous les nœuds, puis essayer de découper par profondeur sans stocker la profondeur. Tu as perdu le regroupement.
* Muter les pointeurs `left`/`right` de l'arbre pour former les listes. Le problème veut de **nouvelles** listes de nœuds, pas un arbre détruit (sauf demande).

---

## 4. Solution Java

### BFS (principale)

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

class ListOfDepths {
    public static List<LinkedList<TreeNode>> createLevelLists(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            LinkedList<TreeNode> level = new LinkedList<>();

            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.remove();
                level.add(node);
                if (node.left != null) {
                    queue.add(node.left);
                }
                if (node.right != null) {
                    queue.add(node.right);
                }
            }

            result.add(level);
        }

        return result;
    }
}
```

Parcours sur l'arbre d'exemple:

| Étape | File avant le niveau | levelSize | Liste du niveau | Enfants enfilés |
| --- | --- | --- | --- | --- |
| 1 | [4] | 1 | 4 | 2, 6 |
| 2 | [2, 6] | 2 | 2 → 6 | 1, 3, puis 7 |
| 3 | [1, 3, 7] | 3 | 1 → 3 → 7 | (aucun) |
| 4 | vide | stop | | |

La taille du résultat est 3. Profondeurs 0, 1, 2.

### DFS (optionnel)

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

class ListOfDepthsDfs {
    public static List<LinkedList<TreeNode>> createLevelLists(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        createLevelLists(root, 0, result);
        return result;
    }

    private static void createLevelLists(
            TreeNode node,
            int depth,
            List<LinkedList<TreeNode>> result) {
        if (node == null) {
            return;
        }

        if (result.size() == depth) {
            result.add(new LinkedList<TreeNode>());
        }

        result.get(depth).add(node);
        createLevelLists(node.left, depth + 1, result);
        createLevelLists(node.right, depth + 1, result);
    }
}
```

Même exemple, ordre d'ajouts en préordre: 4, puis 2, 1, 3, puis 6, 7. Après toutes les visites:

* profondeur 0: [4]
* profondeur 1: [2, 6]
* profondeur 2: [1, 3, 7]

Même regroupement que le BFS.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra (hors sortie) |
| --- | --- | --- |
| BFS par niveaux | O(N) | O(W) file, W = largeur max de l'arbre |
| DFS récursif | O(N) | O(H) pile d'appels, H = hauteur |

N est le nombre de nœuds. Tu touches chaque nœud une fois et tu l'ajoutes une fois: temps linéaire.

L'espace de sortie est O(N) dans les deux cas: chaque nœud apparaît dans exactement une liste intérieure. C'est exigé par le problème, pas un surcoût optionnel.

Pour un arbre complet, la largeur max est environ N/2 au dernier niveau, donc la file BFS peut être Θ(N). Pour un arbre maigre (toujours un enfant), la file reste petite et la pile DFS est Θ(N).

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent surtout:

* **Arbre vide** (`root == null`) → liste extérieure vide, pas une liste contenant une liste vide.
* **Un seul nœud** → une liste avec ce nœud seulement.
* **Arbre déséquilibré** → le côté le plus profond a toujours ses listes plus profondes; les frères absents n'apparaissent simplement pas.
* **Biaisé à gauche ou à droite** → une liste par profondeur existante; taille 1 à chaque profondeur.
* **Valeurs en double** → les listes tiennent des références de nœuds, donc deux nœuds avec `data == 5` sont des entrées distinctes.

Erreurs fréquentes:

1. **Oublier `levelSize` en BFS.** Tu mélanges les profondeurs en une passe, ou tu inventes un marqueur/null.
2. **Enfiler des enfants null** sans contrôle, puis NPE en les traitant comme de vrais nœuds.
3. **Utiliser la profondeur comme index sans agrandir la liste extérieure en DFS.** La première fois que tu vois la profondeur d, il faut créer la liste.
4. **Renvoyer des valeurs au lieu de nœuds** (ou l'inverse) quand la signature demandait autre chose.
5. **Recâbler `left`/`right` en linked list** et casser l'arbre d'origine.
6. **Décalage profondeur vs hauteur.** La racine a la profondeur 0. Nombre de listes = hauteur + 1 si l'arbre n'est pas vide.

Esquisse d'usage minimale:

```java
TreeNode root = new TreeNode(4);
root.left = new TreeNode(2);
root.right = new TreeNode(6);
// ... attache 1, 3, 7

List<LinkedList<TreeNode>> levels = ListOfDepths.createLevelLists(root);
// levels.get(0) est 4
// levels.get(1) est 2 → 6
// levels.get(2) est 1 → 3 → 7
```

---

## 7. Récap: explique à un ami

List of Depths, c'est "regrouper les nœuds de l'arbre par numéro d'étage":

1. **BFS:** traite la file par lots de la taille du niveau. Chaque lot devient une linked list. Les enfants attendent le lot suivant.
2. **DFS:** passe la profondeur dans la récursion. Ajoute chaque nœud à `lists.get(depth)`. Crée la liste la première fois que tu atteins cette profondeur.
3. Arbre vide → aucune liste. Racine seule → une liste d'un nœud.
4. Temps O(N). Espace extra: largeur de la file ou hauteur de la récursion, plus les listes de sortie.

Si tu peux dessiner les étages, écrire la boucle BFS avec `levelSize` sans regarder, et citer un cas limite (racine null), tu maîtrises le 4.3.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Minimal Tree](/blog/fr/ctci-4-2-minimal-tree)
* Suivant: [Check Balanced](/blog/fr/ctci-4-4-check-balanced)