---
title: "Médiane Continue: Maintenance de la Médiane en Flux avec Double Tas (CTCI 17.20)"
description: "Maintenez la médiane courante d'un flux de données en O(log N) par insertion et O(1) par requête grâce à un max-tas pour la moitié inférieure et un min-tas pour la supérieure."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-20-continuous-median.webp
previewImage: /assets/images/ctci-17-20-continuous-median.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous recevez un flux de nombres. Après chaque nombre, calculez la médiane de tous ceux vus jusqu'ici.
> * **La Solution Optimale:** **Double Tas (Max-Tas Inférieur + Min-Tas Supérieur)**:
>   1. Maintenir deux tas : `lower` (Max-Tas pour la moitié inférieure) et `upper` (Min-Tas pour la moitié supérieure).
>   2. **Invariant de Taille** : `lower.size() == upper.size()` ou `lower.size() == upper.size() + 1`.
>   3. **Insertion** : Acheminer le nouveau nombre vers le bon tas, puis rééquilibrer si les tailles diffèrent de plus de 1.
>   4. **Requête** : Compte pair → `(lower.top() + upper.top()) / 2.0`. Impair → `lower.top()`.
>   5. **$O(\log N)$ insertion**, **$O(1)$ requête**.
> * **Réalité en Production:** Suivi de la latence P50 dans Prometheus/Grafana et prix médian en temps réel sur les marchés financiers.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.20), l'énoncé est :

*"Les nombres arrivent en flux. Maintenez la mediane courante apres chaque insertion."*

## 2. Invariant de Partition par Double Tas

Conserver deux moitiés complémentaires permet de lire la médiane en $O(1)$ sans trier le flux complet.

## Implémentation de Production

```java
import java.util.*;

public class ContinuousMedian {

    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> upper = new PriorityQueue<>();

    public void addNumber(int num) {
        if (lower.isEmpty() || num <= lower.peek()) {
            lower.add(num);
        } else {
            upper.add(num);
        }
        rebalance();
    }

    private void rebalance() {
        if (lower.size() > upper.size() + 1) {
            upper.add(lower.poll());
        } else if (upper.size() > lower.size()) {
            lower.add(upper.poll());
        }
    }

    public double getMedian() {
        if (lower.isEmpty()) throw new IllegalStateException("Aucun nombre reçu.");
        if (lower.size() == upper.size()) {
            return (lower.peek() + upper.peek()) / 2.0;
        }
        return lower.peek();
    }
}
```

## Analyse de Complexité

| Opération | Complexité | Détail |
|---|---|---|
| `addNumber()` | $O(\log N)$ | Insertion dans le tas et un rééquilibrage au plus. |
| `getMedian()` | $O(1)$ | Lecture des sommets des deux tas. |
| Espace | $O(N)$ | Les deux tas stockent N éléments au total. |

## Ingénierie des Systèmes en Production

1. **Prometheus/Grafana P50 :** Calcul de la médiane de latence pour les tableaux de bord SLO en temps réel.
2. **Analyse de Marchés Financiers :** Calcul du prix médian du carnet d'ordres pour les stratégies algorithmiques.

## Cas Limites et Robustesse

1. **Flux Vide :** Lancer une `IllegalStateException` avant la première requête.
2. **Valeurs Dupliquées :** Les deux tas gèrent les doublons naturellement.
