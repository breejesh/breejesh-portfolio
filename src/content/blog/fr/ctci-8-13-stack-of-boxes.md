---
title: "Stack of Boxes: la pile strictement décroissante la plus haute (Java)"
description: "Problème style CTCI 8.13 pour débutants: empiler des boîtes seulement si largeur, profondeur et hauteur sont toutes strictement plus petites. Trier une dimension, puis DP avec mémo pour la hauteur totale max."
date: "2026-02-26"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.13 pour débutants: empiler des boîtes seulement si largeur, profondeur et hauteur sont toutes strictement plus petites. Trier une dimension, puis DP avec mémo pour la hauteur totale max.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as un tas de boîtes d'expédition au sol. Chaque boîte est un pavé: largeur, profondeur, hauteur. Tu veux la tour la plus haute possible, mais la règle est stricte. Une boîte ne peut reposer sur une autre que si elle est **strictement plus petite dans chaque dimension**: largeur, profondeur et hauteur. Pas de bascule, pas de rotation en cours de pile, pas de "presque". C'est **Stack of Boxes**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de récursion et de DP en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et programmation dynamique, problème 8.13.

---

## 1. Analogie du quotidien

Pense à empiler des **caisses façon matriochka**, sauf que les trois axes doivent rétrécir, pas un seul.

* La caisse du dessus doit être plus étroite, moins profonde et plus basse que celle du dessous.
* Tu n'es pas obligé d'utiliser toutes les caisses. Écarte celles qui bloquent une tour plus haute.
* La hauteur de la tour est la **somme des hauteurs** des caisses gardées, pas le nombre de caisses.

Si la boîte A est `4 x 5 x 6` et B est `3 x 4 x 5`, B peut aller sur A (les trois côtés plus petits). Si B est `3 x 6 x 5`, la profondeur échoue, donc B ne peut pas aller sur A.

Le puzzle est combinatoire: pour chaque boîte, décider si elle entre dans la pile et où. La force brute sur les sous-ensembles explose. Trier plus récursion mémoïsée (ou DP bottom-up) ramène le problème à quelque chose d'écrivable au tableau.

---

## 2. Énoncé en mots simples

**Entrée:** une liste de `n` boîtes. Chaque boîte a des entiers positifs `width`, `height`, `depth`.

**Sortie:** la hauteur totale maximale d'une pile où chaque boîte supérieure est **strictement plus petite** en largeur, profondeur et hauteur que celle du dessous.

**Règles:**

* Inégalité stricte sur **les trois** dimensions pour chaque paire adjacente de la pile.
* Tu peux laisser des boîtes hors de la pile.
* L'ordre de la liste d'entrée ne fixe pas l'ordre de la pile; tu choisis.
* Dans cette version, pas de rotation (chaque boîte garde ses width, height, depth). Dis-le en entretien si l'énoncé autorise les rotations.
* La hauteur de la pile est la somme des champs `height` des boîtes choisies.

**Forme de la boîte:**

```java
class Box {
    int width;
    int height;
    int depth;

    Box(int width, int height, int depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    /** Vrai si cette boîte peut s'asseoir strictement au-dessus de 'below'. */
    boolean canBeAbove(Box below) {
        return this.width < below.width
            && this.height < below.height
            && this.depth < below.depth;
    }
}
```

**Exemples:**

| Boîtes (w, h, d) | Hauteur max | Pourquoi |
| --- | --- | --- |
| `(4,6,7), (1,2,3), (4,5,6), (10,12,32)` | `20` | fond `10x12x32` puis `4x6x7` puis `1x2x3` → `12+6+2`. Via `4x5x6` donne `12+5+2=19` |
| une boîte `(2,3,4)` | `3` | seul choix |
| liste vide | `0` | rien à empiler |
| toutes mêmes tailles | hauteur de la plus haute seule | aucune ne peut aller sur une autre |
| chaîne imbriquée de 3 | somme des trois hauteurs | un ordre total valide |

Clarifie l'exemple classique avec l'interviewer. Un jeu d'enseignement courant:

```
(4, 6, 7), (1, 2, 3), (4, 5, 6), (10, 12, 32)
```

Une pile haute valide utilise la grande, puis une moyenne qui rentre, puis la petite. Parcours les nombres pour vous mettre d'accord avant de coder.

**Clarifier avant de coder:**

* Rotations autorisées? (En général non, sauf mention.)
* Strict ou non strict? (Strict: `<` sur les trois.)
* Tailles dupliquées? (Dims égales: pas d'empilement; au plus une d'une paire liée si le reste diffère.)
* Seulement la hauteur, ou aussi la séquence? (Hauteur seule ici.)
* Dims négatives ou nulles? (Rejeter ou supposer positives.)

---

## 3. Réfléchir d'abord

### Pourquoi la recherche de sous-ensembles pure échoue

Pour chaque boîte, tu l'ignores ou tu la places quelque part. Tester tous les sous-ensembles et ordres est exponentiel. Il faut de la structure.

### Observation: trier une dimension

Trie les boîtes par **hauteur décroissante** (plus grande hauteur d'abord). Une pile valide tend alors à parcourir la liste du grand vers le petit. Le tri seul ne garantit pas la validité: largeur et profondeur peuvent encore échouer. Mais il donne un balayage naturel: une fois le fond choisi, les candidats au-dessus apparaissent souvent plus tard, ou tu balayes le reste et appelles `canBeAbove`.

Beaucoup de solutions trient par hauteur décroissante et, pour l'index de fond `i`, n'essaient que les boîtes d'index `j > i`. C'est correct **si** la hauteur est triée décroissante et que `canBeAbove` exige une hauteur strictement plus petite: toute boîte qui peut aller sur le fond a une plus petite hauteur, donc apparaît après `i`. Largeur et profondeur restent vérifiées dans `canBeAbove`.

### Récursion avec mémo (récit d'entretien)

Définis:

```
maxHeightAbove(bottomIndex) =
  bottom.height
  + max sur j qui peuvent aller sur bottom de maxHeightAbove(j)
  (ou seulement bottom.height si aucun j ne marche)
```

Essaie aussi chaque boîte comme fond possible d'une pile complète, prends le max global. Mémoïse sur `bottomIndex` pour ne résoudre chaque boîte-comme-fond qu'une fois.

Même forme qu'une "plus longue chaîne de paires" ou une LIS en 3D.

### DP bottom-up (style LIS)

1. Trie les boîtes (par exemple par hauteur).
2. Soit `dp[i]` la hauteur max de pile avec la boîte `i` en **fond** (ou en sommet; une convention suffit).
3. Pour chaque `i`, parcours les `j` qui peuvent légalement aller au-dessus (ou en dessous) et prends `dp[i] = box[i].height + max(dp[j])`.
4. La réponse est `max(dp[i])`.

Temps O(n²) dans les deux cas. Espace O(n) pour le mémo ou le tableau `dp`.

### Choix de ce billet

On livre d'abord **tri + récursion mémoïsée** (histoire claire: "plus haute pile avec cette boîte en bas"), puis un jumeau bottom-up court.

---

## 4. Solution Java

### Principale: tri + récursion mémoïsée

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class Box {
    int width;
    int height;
    int depth;

    Box(int width, int height, int depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    boolean canBeAbove(Box below) {
        return this.width < below.width
            && this.height < below.height
            && this.depth < below.depth;
    }
}

int stackOfBoxes(List<Box> input) {
    if (input == null || input.isEmpty()) {
        return 0;
    }

    Box[] boxes = input.toArray(new Box[0]);
    // plus haute d'abord: les candidats au-dessus tendent à suivre
    Arrays.sort(boxes, Comparator.comparingInt((Box b) -> b.height).reversed());

    int[] memo = new int[boxes.length]; // 0 = non calculé; hauteurs positives
    int best = 0;
    for (int i = 0; i < boxes.length; i++) {
        best = Math.max(best, maxHeightWithBottom(boxes, i, memo));
    }
    return best;
}

/** Hauteur max de pile quand boxes[bottomIndex] est la boîte du fond. */
int maxHeightWithBottom(Box[] boxes, int bottomIndex, int[] memo) {
    if (memo[bottomIndex] > 0) {
        return memo[bottomIndex];
    }

    Box bottom = boxes[bottomIndex];
    int bestAbove = 0;
    for (int i = bottomIndex + 1; i < boxes.length; i++) {
        if (boxes[i].canBeAbove(bottom)) {
            bestAbove = Math.max(bestAbove, maxHeightWithBottom(boxes, i, memo));
        }
    }

    memo[bottomIndex] = bottom.height + bestAbove;
    return memo[bottomIndex];
}
```

Idée de parcours pour quatre boîtes triées par hauteur décroissante:

```
A (10, 12, 32)
B (4, 6, 7)
C (4, 5, 6)
D (1, 2, 3)
```

* Avec A en bas: essaie B, C, D sur A. B rentre. La pile avec B comme fond de la partie haute peut continuer jusqu'à D. C peut ou non rentrer sur A (compare les trois dims). Garde la meilleure chaîne.
* Avec B en bas: peut-être D sur B.
* Les piles d'une seule boîte sont la base quand rien ne rentre au-dessus.

Le mémo signifie qu'une fois calculée "meilleure pile avec B en bas", tu la réutilises quand A et d'autres la demandent.

### Jumeau bottom-up (même complexité)

```java
int stackOfBoxesBottomUp(List<Box> input) {
    if (input == null || input.isEmpty()) {
        return 0;
    }

    Box[] boxes = input.toArray(new Box[0]);
    Arrays.sort(boxes, Comparator.comparingInt((Box b) -> b.height).reversed());

    int n = boxes.length;
    int[] dp = new int[n]; // hauteur max avec boxes[i] en fond
    int best = 0;

    for (int i = n - 1; i >= 0; i--) {
        int bestAbove = 0;
        for (int j = i + 1; j < n; j++) {
            if (boxes[j].canBeAbove(boxes[i])) {
                bestAbove = Math.max(bestAbove, dp[j]);
            }
        }
        dp[i] = boxes[i].height + bestAbove;
        best = Math.max(best, dp[i]);
    }
    return best;
}
```

Même récurrence, remplie depuis la fin du tableau trié pour que les résultats "au-dessus" existent déjà.

### Optionnel: retrouver la pile réelle

Si l'interviewer veut la séquence, stocke `parent[i]` ou reconstruis en rejouant les choix de `dp[i]`. La hauteur seule suffit pour le problème de base.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Sous-ensembles + permutations | exponentiel | profondeur de pile | Pédagogique seulement |
| Tri + récursion mémo | O(n²) | O(n) mémo + O(n) pile | Réponse claire d'entretien |
| Tri + DP bottom-up | O(n²) | O(n) | Même idée, sans récursion |
| Tri sur une dim sans tout vérifier | faux | - | Il faut les trois dims |

Le tri est O(n log n). Les doubles parcours dominent en O(n²). Pour un n d'entretien (dizaines à quelques centaines de boîtes), c'est correct.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent ceux-ci:

* **Entrée vide** → 0.
* **Une seule boîte** → sa hauteur.
* **Aucune ne peut aller sur une autre** → max des hauteurs individuelles (pas la somme).
* **Chaîne parfaitement imbriquée** → somme de toutes les hauteurs.
* **Dims égales sur un axe** → pas d'empilement (`<` échoue). Bug facile avec `<=`.
* **Même hauteur, largeur/profondeur différentes** → le tri par hauteur les met côte à côte; `canBeAbove` rejette encore si la hauteur n'est pas strictement plus petite.
* **Beaucoup de boîtes, une seule longue chaîne** → le mémo reste O(n²) mais évite de refaire les sous-piles.
* **Rotations** → si autorisées, génère jusqu'à 3 orientations par boîte, puis le même DP. Ici **non**, sauf demande.

Erreurs fréquentes:

1. **Vérifier une ou deux dimensions seulement.** La règle en demande trois.
2. **Utiliser `<=` au lieu de `<`.** Faces égales interdites sous la règle stricte.
3. **Oublier d'essayer chaque boîte comme fond possible.** La réponse globale est le max sur les fonds, pas seulement `maxHeightWithBottom(0)`.
4. **Mémo mal initialisé.** `0` comme "non calculé" est sûr si les hauteurs sont positives. Avec hauteur nulle, utilise un booléen séparé ou des `Integer` nuls.
5. **Trier et croire que l'ordre suffit.** Il faut encore `canBeAbove` pour largeur et profondeur.
6. **Maximiser le nombre de boîtes au lieu de la somme des hauteurs.** Deux boîtes hautes peuvent battre cinq toutes petites.

Test minimal:

```java
List<Box> boxes = new ArrayList<>();
boxes.add(new Box(4, 6, 7));
boxes.add(new Box(1, 2, 3));
boxes.add(new Box(4, 5, 6));
boxes.add(new Box(10, 12, 32));

System.out.println(stackOfBoxes(boxes)); // somme des hauteurs de la meilleure pile valide
System.out.println(stackOfBoxes(List.of())); // 0
System.out.println(stackOfBoxes(List.of(new Box(2, 3, 4)))); // 3
```

Calcule le nombre attendu à la main au tableau avec l'interviewer pour faire confiance au print.

---

## 7. Récap pour un ami

Stack of Boxes demande: quelle est la tour la plus haute si chaque boîte du dessus doit être strictement plus petite en largeur, profondeur et hauteur?

1. Modélise un `Box` avec `canBeAbove(below)`.
2. Trie par hauteur décroissante pour que les candidats de plus petite hauteur viennent après.
3. Définis "hauteur max avec la boîte i en bas" comme `height[i]` plus la meilleure pile valide au-dessus de i.
4. Mémoïse cette fonction (ou remplis `dp` bottom-up). La réponse est le max sur tous les fonds.
5. Temps O(n²). Surveille les inégalités strictes et la boucle externe "essayer chaque fond".

Si tu sais trier, écrire `canBeAbove`, et expliquer pourquoi le mémo transforme la recherche exponentielle en O(n²), tu maîtrises le 8.13. Ensuite: évaluation booléenne, un autre DP sur chaînes.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Eight Queens](/blog/fr/ctci-8-12-eight-queens)
* Suivant: [Boolean Evaluation](/blog/fr/ctci-8-14-boolean-evaluation)