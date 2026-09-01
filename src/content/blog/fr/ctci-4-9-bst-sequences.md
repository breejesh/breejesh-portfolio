---
title: "Séquences de BST: Générer Toutes les Permutations de Tableaux Générant un BST Donné (CTCI 4.9)"
description: "Reconstruisez toutes les séquences d'insertion possibles générant un arbre binaire de recherche donné via l'entrelacement récursif (weaving)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un arbre binaire de recherche a été créé en insérant successivement les éléments d'un tableau de gauche à droite. Étant donné un BST contenant des éléments distincts, affichez tous les tableaux possibles ayant pu générer cet arbre.
> * **La Solution Optimale:** La racine doit impérativement précéder tous ses enfants. Récupérez récursivement les séquences du sous-arbre gauche et celles du sous-arbre droit, puis **entrelacez** (weave) chaque séquence gauche avec chaque séquence droite en conservant leur ordre interne respectif.
> * **Réalité en Production:** Fuzzing d'ordonnancement d'événements distribués et validation de consensus (Raft/Paxos).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.9), l'énoncé est :

*"Un arbre binaire de recherche a été créé en parcourant un tableau de gauche à droite et en insérant chaque élément. Étant donné un arbre binaire de recherche aux éléments distincts, affichez tous les tableaux possibles ayant pu donner cet arbre."*

**Exemple :**
* Arbre : Racine `2`, Fils gauche `1`, Fils droit `3`
* Résultat : `[2, 1, 3]`, `[2, 3, 1]`

## 2. Mécanique Algorithmique d'Entrelacement (Weaving)

1. La racine d'un sous-arbre doit être insérée avant tous ses descendants.
2. Les éléments du sous-arbre gauche et du sous-arbre droit peuvent être entrelacés dans n'importe quel ordre, à condition de préserver l'ordre relatif interne à chaque sous-arbre.
3. La fonction `weaveLists` procède par retour sur trace (backtracking) :
   * Retirer la tête de la première liste, l'ajouter au préfixe et descendre récursivement.
   * Rétablir l'état (backtracking).
   * Retirer la tête de la deuxième liste, l'ajouter au préfixe et descendre.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BSTSequences {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Genere toutes les sequences d'insertion valides.
     */
    public static List<LinkedList<Integer>> allSequences(TreeNode node) {
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

    private static void weaveLists(LinkedList<Integer> first, LinkedList<Integer> second,
                                   List<LinkedList<Integer>> results, LinkedList<Integer> prefix) {
        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> result = (LinkedList<Integer>) prefix.clone();
            result.addAll(first);
            result.addAll(second);
            results.add(result);
            return;
        }

        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | Exponentielle ($O(2^N \text{ à } N!)$) | Liée au nombre combinatoire d'entrelacements valides. |
| Espace Auxiliaire | $O(N \times K)$ | Stockage des $K$ permutations générées de longueur $N$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Fuzzing d'Entrelacements Concurrents

1. **Tests de Chaos en Systèmes Distribués (Jepsen) :** Génération de séquences valides d'événements pour déceler les accès concurrents non synchronisés.
2. **Rejeu de Transactions :** Audit d'équivalence transactionnelle dans les bases de données ACID.

## Cas Limites et Robustesse

1. **Arbre vide :** Renvoie une liste contenant une liste vide `[[]]`.
2. **Arbre linéaire :** Produit exactement 1 séquence valide.
