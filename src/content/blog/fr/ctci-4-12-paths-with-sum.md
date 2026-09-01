---
title: "Chemins avec Somme: Compter les Chemins Descendants avec une Somme Cible (CTCI 4.12)"
description: "Concevez un algorithme pour dénombrer les chemins descendants d'un arbre binaire égalant une somme cible avec sommes de préfixes en O(N) temps."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---

> **TL;DR**
> * **Le Problème du Livre:** On vous donne un arbre binaire dont chaque nœud contient une valeur entière. Concevez un algorithme pour compter le nombre de chemins dont la somme vaut une valeur donnée (les chemins doivent aller exclusivement vers le bas).
> * **La Solution Optimale:** Utilisez les **Sommes de Préfixes avec Table de Hachage** : Maintenez une somme cumulée `runningSum` le long du chemin courant depuis la racine. Le nombre de sous-chemins se terminant au nœud courant et totalisant `targetSum` correspond au nombre d'ancêtres ayant pour préfixe `runningSum - targetSum`, stocké dans une `HashMap` avec retour sur trace (backtracking) en temps $O(N)$ et espace $O(H)$.
> * **Réalité en Production:** Agrégation de fenêtres glissantes dans les flux de paquets réseau et analyse de rentabilité dans les flux transactionnels.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.12), la question posée est :

*"On vous donne un arbre binaire dans lequel chaque nœud contient un entier. Concevez un algorithme pour compter le nombre de chemins totalisant une valeur cible. Le chemin n'a pas besoin de commencer à la racine ni de finir à une feuille, mais doit être orienté vers le bas."*

## 2. Mécanique des Sommes de Préfixes et Backtracking

Pour un sous-chemin contigu allant d'un ancêtre $A$ au nœud $B$ :
$$\text{PathSum}(A \to B) = \text{RunningSum}(B) - \text{RunningSum}(\text{parent}(A))$$

Nous recherchons donc dans l'historique des ancêtres :
$$\text{RunningSum}(\text{parent}(A)) = \text{RunningSum}(B) - \text{targetSum}$$

**Algorithme :**
1. Parcourir l'arbre en incrémentant `runningSum`.
2. Rechercher `runningSum - targetSum` dans `HashMap<Integer, Integer> pathCount`.
3. Ajouter les occurrences au total des chemins trouvés.
4. Enregistrer la `runningSum` courante dans la table.
5. Parcourir récursivement les sous-arbres gauche et droit.
6. **Backtracking :** Décrémenter l'occurrence de `runningSum` avant de remonter au parent.

## Implémentation de Production

```java
import java.util.HashMap;

public class PathsWithSum {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Compte les chemins descendants totalisant targetSum.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(log N) sur arbre equilibre, O(N) pire cas.
     */
    public static int countPathsWithSum(TreeNode root, int targetSum) {
        return countPathsWithSum(root, targetSum, 0, new HashMap<Integer, Integer>());
    }

    private static int countPathsWithSum(TreeNode node, int targetSum, int runningSum,
                                         HashMap<Integer, Integer> pathCount) {
        if (node == null) return 0;

        runningSum += node.val;
        int sum = runningSum - targetSum;
        int totalPaths = pathCount.getOrDefault(sum, 0);

        if (runningSum == targetSum) {
            totalPaths++;
        }

        incrementHashTable(pathCount, runningSum, 1);

        totalPaths += countPathsWithSum(node.left, targetSum, runningSum, pathCount);
        totalPaths += countPathsWithSum(node.right, targetSum, runningSum, pathCount);

        incrementHashTable(pathCount, runningSum, -1); // Backtracking

        return totalPaths;
    }

    private static void incrementHashTable(HashMap<Integer, Integer> hashTable, int key, int delta) {
        int newCount = hashTable.getOrDefault(key, 0) + delta;
        if (newCount == 0) {
            hashTable.remove(key);
        } else {
            hashTable.put(key, newCount);
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Chaque nœud est visité une seule fois avec des opérations $O(1)$ sur la table de hachage. |
| Espace Auxiliaire | `O(log N) à O(N)` | La table contient au plus les $H$ ancêtres du chemin courant. |

## Ingénierie des Systèmes en Production

### Architecture Système : Détection de Fenêtres Cumulatives

1. **Surveillance Réseau :** Détection de séquences de paquets dont la charge utile franchit un seuil critique.
2. **Pipelines Financiers :** Calcul d'intervalles contigus de transactions réalisant un volume cible.

## Cas Limites et Robustesse

1. **Valeurs négatives et zéros :** Pris en charge grâce au comptage des fréquences de préfixes.
2. **Arbre vide :** Renvoie 0.
