---
title: "Nœud Aléatoire: Sélection Équiprobable de Nœuds dans un Arbre Binaire (CTCI 4.11)"
description: "Concevez une classe d'arbre binaire avec getRandomNode() garantissant une probabilité uniforme 1/N en temps O(log N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous implémentez une classe d'arbre binaire qui, en plus de `insert`, `find` et `delete`, dispose d'une méthode `getRandomNode()` renvoyant un nœud aléatoire de l'arbre de manière équiprobable.
> * **La Solution Optimale:** Stockez la taille du sous-arbre (`size`) dans chaque nœud. Dans `getRandomNode()`, générez un indice $d \in [0, \text{size}-1]$. Si $d < \text{left.size}$, descendez à gauche. Si $d == \text{left.size}$, retournez le nœud courant. Sinon, descendez à droite en réajustant l'indice, en temps $O(\log N)$ et espace $O(1)$.
> * **Réalité en Production:** Échantillonnage d'indices B-Tree dans les optimiseurs SQL (`ANALYZE`) et arbres Treap équilibrés.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.11), l'énoncé est :

*"Vous implémentez une classe d'arbre binaire à partir de zéro qui comprend les méthodes insert, find, delete et getRandomNode(). Tous les nœuds doivent avoir la même probabilité d'être choisis."*

## 2. Probabilité Uniforme et Dimensionnement des Sous-Arbres

Pour garantir une probabilité exacte de $1/N$ par nœud :
* Probabilité du nœud courant = $\frac{1}{N}$.
* Probabilité du sous-arbre gauche = $\frac{left.size}{N}$.
* Probabilité du sous-arbre droit = $\frac{right.size}{N}$.

## Implémentation de Production

```java
import java.util.Random;

public class RandomNodeTree {
    public static class TreeNode {
        private int data;
        public TreeNode left;
        public TreeNode right;
        private int size = 0;

        public TreeNode(int d) {
            data = d;
            size = 1;
        }

        public int data() { return data; }
        public int size() { return size; }

        public TreeNode getRandomNode() {
            int leftSize = left == null ? 0 : left.size();
            Random random = new Random();
            int index = random.nextInt(size);

            if (index < leftSize) {
                return left.getRandomNode();
            } else if (index == leftSize) {
                return this;
            } else {
                return right.getRandomNode();
            }
        }

        public void insertInOrder(int d) {
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
            size++;
        }

        public TreeNode find(int d) {
            if (d == data) {
                return this;
            } else if (d <= data) {
                return left != null ? left.find(d) : null;
            } else {
                return right != null ? right.find(d) : null;
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| getRandomNode | `O(log N)` | Borné par la profondeur de l'arbre équilibré. |
| insert / find / delete | `O(log N)` | Parcours racine-feuille avec mise à jour du compteur `size`. |
| Espace Auxiliaire | `O(1)` | Exécution itérative ou récursive terminale. |

## Ingénierie des Systèmes en Production

### Architecture Système : Échantillonnage et Treaps

1. **Optimiseur de Requêtes SQL (PostgreSQL `ANALYZE`) :** Échantillonnage de pages B-Tree pour déduire les histogrammes de sélectivité sans balayer la table entière.
2. **Treaps (Arbres Aléatoires) :** Équilibrage probabiliste sans rotations complexes à plusieurs cas.

## Cas Limites et Robustesse

1. **Arbre vide :** Renvoie `null`.
2. **Arbre à un seul nœud :** `random.nextInt(1)` renvoie toujours 0, renvoyant l'unique élément.
