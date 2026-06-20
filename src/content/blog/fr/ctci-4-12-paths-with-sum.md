---
title: "Paths with Sum: compter les chemins descendants qui atteignent une cible (Java)"
description: "Problème style CTCI 4.12 pour débutants: compter chaque chemin d'un arbre binaire qui somme à une cible. Uniquement parent vers enfant. Force brute depuis chaque nœud, puis somme courante plus HashMap des préfixes."
date: "2026-06-20"
tags: [Algorithmes]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.12 pour débutants: compter chaque chemin d'un arbre binaire qui somme à une cible. Uniquement parent vers enfant. Force brute depuis chaque nœud, puis somme courante plus HashMap des préfixes.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu descends un sentier de montagne. À chaque fourche, un nombre marque une montée ou une descente. Tu veux tous les tronçons dont le bilan net vaut une cible, disons 8. Un tronçon peut commencer au milieu du chemin, s'arrêter au milieu, et ne jamais remonter. C'est **paths with sum** sur un arbre binaire: seulement parent vers enfant, n'importe quel début, n'importe quelle fin.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de somme sur chemins d'arbres en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 4, arbres et graphes, se termine ici.

---

## 1. Analogie du quotidien

Imagine un arbre familial de dépôts et de retraits. Chaque personne a un parent au-dessus et jusqu'à deux enfants en dessous. L'argent sur une personne est sa transaction.

Un **chemin** ici n'est pas n'importe quel lien social. C'est une descente en ligne droite dans l'arbre: grand-parent vers parent vers enfant. Pas de saut latéral. Pas de remontée.

Tu choisis n'importe quelle personne comme début et n'importe quel descendant comme fin (y compris le début seul). Tu additionnes les valeurs de cette chaîne vers le bas. Si la somme égale la cible, tu comptes.

Exemple avec cible `8`:

```
        10
       /  \
      5   -3
     / \    \
    3   2   11
   / \   \
  3  -2   1
```

Trois chemins valent 8:

* `5 → 3`
* `5 → 2 → 1`
* `-3 → 11`

`10 → 5` vaut 15, ce n'est pas un hit. Un seul nœud de valeur 8 compterait aussi.

---

## 2. Énoncé en mots simples

**Entrée:** racine d'un arbre binaire. Chaque nœud porte un `int` (positif, négatif ou zéro). Un entier `targetSum`.

**Sortie:** le nombre de chemins descendants dont les valeurs somment à `targetSum`.

**Règles:**

* Le chemin va seulement **parent → enfant** (vers le bas).
* Il peut commencer à n'importe quel nœud, pas seulement la racine.
* Il peut finir à n'importe quel nœud, pas seulement une feuille.
* Un seul nœud est un chemin valide de longueur 1.
* Des négatifs sont possibles: pas de coupe précoce du type "somme déjà trop grande".

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

**Exemples:**

| Idée d'arbre | Cible | Compte | Pourquoi |
| --- | --- | --- | --- |
| arbre ci-dessus | 8 | 3 | `5→3`, `5→2→1`, `-3→11` |
| un seul nœud `8` | 8 | 1 | le nœud seul |
| un seul nœud `1` | 8 | 0 | rien n'atteint 8 |
| racine `null` | n'importe | 0 | arbre vide |
| seulement `1 → 2 → 3` | 3 | selon la forme | tronçons qui somment à 3 |

**À clarifier avant de coder:**

* Valeurs négatives? (Oui. Ça bloque les sorties anticipées naïves.)
* Chemins qui se chevauchent comptés séparément? (Oui.)
* Chemin contigu vers le bas? (Oui. Pas de saut d'un enfant du milieu.)
* On renvoie les chemins ou seulement le compte? (Le compte seulement.)

---

## 3. Réfléchir d'abord

### Brute: chaque nœud est un départ possible

Pour chaque nœud `u`, lance un DFS qui part de `u` et ne descend que. Garde une somme courante. Chaque fois qu'elle égale la cible, incrémente la réponse. Continue même après un hit: un chemin plus long peut retomber juste (il y a des négatifs).

Temps: depuis chacun des N nœuds tu peux parcourir O(N) descendants sur un peigne, donc O(N²) au pire. Sur un arbre équilibré, plutôt ~O(N log N). Espace O(H) pour la pile de recursion.

Correct en première réponse. En entretien on attend souvent le passage linéaire ensuite.

### Optimisé: somme courante + comptes de préfixes

Sur un tableau, "combien de sous-tableaux somment à la cible" utilise une map de sommes préfixe. Un chemin qui ne descend que dans l'arbre ressemble à un sous-tableau le long d'une épine racine-feuille, mais le tronçon peut commencer au milieu.

Définis `runningSum` en un nœud comme la somme depuis la **racine de l'arbre** jusqu'à ce nœud (le chemin actif du DFS).

Si un ancêtre avait le préfixe `S` et le courant est `runningSum`, le tronçon **sous cet ancêtre jusqu'ici** vaut `runningSum - S`.

Tu veux `runningSum - S == targetSum`, donc `S == runningSum - targetSum`.

Garde un `HashMap<Integer, Integer>`: combien de fois chaque somme préfixe est apparue sur le **chemin courant racine → ici**. À chaque nœud:

1. Cherche `runningSum - targetSum` dans la map. Ce compte est le nombre de chemins qui **se terminent ici** et valent la cible.
2. Ajoute 1 à l'entrée de `runningSum`.
3. Recurse gauche et droite.
4. **Backtrack**: retire 1 (supprime si zéro). Les frères ne doivent pas voir ce préfixe.

Initialise la map avec `0 → 1` avant la marche. Ça modèle un préfixe vide au-dessus de la racine, pour qu'un chemin qui part de la racine matche encore quand `runningSum == targetSum`.

Un seul DFS visite chaque nœud une fois. Travail de map amorti O(1) par nœud. Temps O(N). Espace extra O(H) pour la pile et au plus O(H) clés vivantes sur le chemin courant si tu nettoies au retour (O(N) sur un peigne).

---

## 4. Solution Java

### Force brute (premier passage clair)

```java
int countPathsBrute(TreeNode root, int targetSum) {
    if (root == null) {
        return 0;
    }
    return countFrom(root, targetSum)
        + countPathsBrute(root.left, targetSum)
        + countPathsBrute(root.right, targetSum);
}

/** Chemins qui partent de 'node' et ne descendent que. */
int countFrom(TreeNode node, long remaining) {
    if (node == null) {
        return 0;
    }
    int count = 0;
    if (node.val == remaining) {
        count++;
    }
    count += countFrom(node.left, remaining - node.val);
    count += countFrom(node.right, remaining - node.val);
    return count;
}
```

Utiliser `remaining` (ce qu'il reste à atteindre) est la même idée qu'une somme qui croît. Les deux styles conviennent.

### Principal: map de préfixes (cible d'entretien)

```java
import java.util.HashMap;
import java.util.Map;

int countPathsWithSum(TreeNode root, int targetSum) {
    Map<Integer, Integer> prefixCounts = new HashMap<>();
    prefixCounts.put(0, 1); // préfixe vide au-dessus de la racine
    return dfs(root, 0, targetSum, prefixCounts);
}

int dfs(TreeNode node, int runningSum, int targetSum, Map<Integer, Integer> prefixCounts) {
    if (node == null) {
        return 0;
    }

    runningSum += node.val;

    int pathsEndingHere = prefixCounts.getOrDefault(runningSum - targetSum, 0);

    prefixCounts.put(runningSum, prefixCounts.getOrDefault(runningSum, 0) + 1);

    int total = pathsEndingHere
        + dfs(node.left, runningSum, targetSum, prefixCounts)
        + dfs(node.right, runningSum, targetSum, prefixCounts);

    int c = prefixCounts.get(runningSum);
    if (c == 1) {
        prefixCounts.remove(runningSum);
    } else {
        prefixCounts.put(runningSum, c - 1);
    }

    return total;
}
```

Parcours de l'arbre exemple avec cible `8` quand le DFS atteint d'abord le `5` gauche (somme depuis la racine: `10 + 5 = 15`):

| Étape | runningSum | Cherche `runningSum - 8` | Idée de la map | Chemins finissant ici |
| --- | --- | --- | --- | --- |
| en 10 | 10 | 2 → 0 | put 10 | 0 |
| en 5 | 15 | 7 → 0 | put 15 | 0 |
| en 3 gauche | 18 | 10 → 1 (préfixe racine) | chemin `5→3` | 1 |
| en enfant 3 | 21 | 13 → 0 | | 0 |
| en -2 | 16 | 8 → 0 | | 0 |
| retour; en 2 | 17 | 9 → 0 | | 0 |
| en 1 | 18 | 10 → 1 | chemin `5→2→1` | 1 |
| côté droit -3 | 7 | -1 → 0 | | 0 |
| en 11 | 18 | 10 → 1 | chemin `-3→11` | 1 |

Total 3. La map ne reflète que les ancêtres du chemin DFS actif grâce au backtrack.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Brute: DFS depuis chaque nœud | O(N²) pire, ~O(N log N) équilibré | O(H) pile | Facile à expliquer d'abord |
| Somme courante + HashMap | O(N) | O(H) typique, O(N) peigne | Réponse préférée en entretien |
| Stocker listes racine-feuille et scanner | O(N²) copies | O(N) ou pire | Lourd; à éviter |

N est le nombre de nœuds. H est la hauteur. La map gagne car chaque nœud fait un travail constant une fois.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs touchent ces points:

* **Racine null** → 0.
* **Un seul nœud égal à la cible** → 1. Repose sur la graine `0 → 1`.
* **Un seul nœud différent** → 0.
* **Tout négatif, cible positive** → tout parcourir; pas de sortie anticipée.
* **Zéros dans l'arbre** → un zéro allonge le chemin sans changer la somme; plusieurs hits qui se chevauchent sont réels.
* **Cible 0** → on compte des chemins de nœuds réels qui somment à 0; pas un chemin vide fictif. Avec la graine standard, un nœud dont la somme égale un préfixe précédent marque un tronçon non vide.
* **Chaîne dégénérée** → map et pile montent à O(N); toujours correct et linéaire.
* **Même préfixe deux fois sur un chemin** (zéros ou négatifs qui s'annulent) → la map stocke un **compte**, pas un booléen.

Erreurs courantes:

1. **Oublier le backtrack de la map.** Un préfixe du sous-arbre gauche fuit vers la droite.
2. **Oublier `prefixCounts.put(0, 1)`.** Les chemins qui partent de la racine sont sous-comptés.
3. **S'arrêter quand la somme égale la cible.** Un chemin plus long peut retomber juste avec des négatifs ou des zéros. Continue le DFS.
4. **Autoriser des pointeurs parent ou des chemins LCA arbitraires.** Le problème est **descendant seulement**.
5. **Mettre l'identité du nœud dans la map au lieu des sommes préfixe.**
6. **Dépassement d'`int`.** En entretien `int` suffit souvent; mentionne `long` si les valeurs peuvent être énormes.

Test minimal:

```java
TreeNode root = new TreeNode(10);
root.left = new TreeNode(5);
root.right = new TreeNode(-3);
root.left.left = new TreeNode(3);
root.left.right = new TreeNode(2);
root.right.right = new TreeNode(11);
root.left.left.left = new TreeNode(3);
root.left.left.right = new TreeNode(-2);
root.left.right.right = new TreeNode(1);

System.out.println(countPathsWithSum(root, 8)); // 3
System.out.println(countPathsWithSum(null, 8)); // 0
System.out.println(countPathsWithSum(new TreeNode(8), 8)); // 1
```

---

## 7. Résumé à raconter à un ami

Paths with Sum demande: combien de tronçons descendants parent-enfant dans un arbre binaire somment à une cible?

1. Brute: depuis chaque nœud, descends et compte les sommes qui touchent la cible. Correct, jusqu'à O(N²).
2. Mieux: DFS avec somme courante depuis la racine. Map du nombre d'apparitions de chaque préfixe sur le chemin courant.
3. À chaque nœud, les chemins qui finissent ici et touchent la cible valent le compte de `runningSum - target` dans la map.
4. Graine `0 → 1`. Incrémente le préfixe courant avant les enfants. Décrémente (backtrack) après.
5. Négatifs et zéros: ne coupe pas sur "somme trop grande". Tous les chevauchements comptent.

Si tu dessines l'arbre exemple, montres pourquoi trois chemins valent 8, et expliques pourquoi le backtrack du HashMap compte, tu maîtrises le 4.12. Le chapitre 4 se ferme sur une marche d'arbre qui est en fait un tour de sommes préfixe.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Random Node](/blog/fr/ctci-4-11-random-node)
* Suivant: [Insertion](/blog/fr/ctci-5-1-insertion)