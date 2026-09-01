---
title: "Rang dans un Flux: Arbres Statistiques d'Ordre pour Classement Dynamique (CTCI 10.10)"
description: "Maintenez et interrogez le rang des nombres dans un flux continu d'entiers via un arbre binaire de recherche augmenté (Order Statistic Tree) en O(log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez la lecture d'un flux continu d'entiers. Périodiquement, vous souhaitez connaître le rang d'un nombre $x$ (le nombre de valeurs inférieures ou égales à $x$). Implémentez `track(int x)` et `getRankOfNumber(int x)`.
> * **La Solution Optimale:** **Arbre Binaire de Recherche Augmenté (Order Statistic Tree)** : (1) Chaque nœud maintient sa valeur `data`, des pointeurs d'enfants et un compteur `left_size` du nombre d'éléments dans son sous-arbre gauche ; (2) `track(x)` : lors d'une descente à gauche, incrémente `left_size++` ; (3) `getRankOfNumber(x)` : si $x == \text{data}$, renvoie `left_size` ; si $x < \text{data}$, descend à gauche ; si $x > \text{data}$, renvoie `left_size + 1 + right.getRank(x)` ; (4) S'exécute en **temps $O(\log N)$** sur arbre équilibré et **espace $O(N)$**.
> * **Réalité en Production:** Calcul de percentiles en temps réel (P95/P99 dans Datadog/Prometheus) et classement MMR dans les jeux vidéo.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.10), l'énoncé est :

*"Implementez les methodes track(x) et getRankOfNumber(x) pour gerer dynamiquement le rang d'entiers dans un flux continu."*

## 2. Invariant de l'Arbre Augmenté

En enrichissant chaque nœud de son poids gauche `left_size` :
* Pour $x > \text{data}$, le rang est la somme du nœud courant, de son sous-arbre gauche et des valeurs éligibles du sous-arbre droit :
$$\text{Rang}(x) = \text{left\_size} + 1 + \text{right.getRank}(x)$$

## Implémentation de Production

```java
public class RankFromStream {
    public static class RankNode {
        public int left_size = 0;
        public RankNode left, right;
        public int data = 0;

        public RankNode(int d) {
            this.data = d;
        }

        public void insert(int d) {
            if (d <= data) {
                left_size++;
                if (left != null) {
                    left.insert(d);
                } else {
                    left = new RankNode(d);
                }
            } else {
                if (right != null) {
                    right.insert(d);
                } else {
                    right = new RankNode(d);
                }
            }
        }

        public int getRank(int d) {
            if (d == data) {
                return left_size;
            } else if (d < data) {
                if (left == null) return -1;
                return left.getRank(d);
            } else {
                int right_rank = (right == null) ? -1 : right.getRank(d);
                if (right_rank == -1) return -1;
                return left_size + 1 + right_rank;
            }
        }
    }

    private RankNode root = null;

    public void track(int number) {
        if (root == null) {
            root = new RankNode(number);
        } else {
            root.insert(number);
        }
    }

    public int getRankOfNumber(int number) {
        if (root == null) return -1;
        return root.getRank(number);
    }
}
```

## Analyse de Complexité et Mémoire

| Opération | Arbre Équilibré | Arbre Dégénéré | Détail Technique |
|---|---|---|---|
| Ingestion Flux (`track`) | `O(log N)` | `O(N)` | Insertion standard avec incrément de `left_size`. |
| Requête de Rang | `O(log N)` | `O(N)` | Cumul des poids de sous-arbres. |
| Espace Mémoire | `O(N)` | `O(N)` | 1 nœud par entier ingéré. |

## Ingénierie des Systèmes en Production

### Architecture Système : Percentiles Haute Fréquence

1. **Moteurs APM (Prometheus / Datadog) :** Utilisation d'arbres dynamiques ou de structures T-Digest pour calculer les centiles P95/P99 en temps sous-milliseconde.
2. **Systèmes de Classement en Ligne :** Actualisation temps réel des rangs de joueurs.

## Cas Limites et Robustesse

1. **Gestion des Doublons :** Insérés à gauche, incrémentant `left_size` fidèlement.
2. **Nombre Non Répertorié :** Propagation de la valeur sentinelle `-1`.
