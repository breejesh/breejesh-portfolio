---
title: "Recherche Triée sans Taille: Recherche Exponentielle sur Structures Infinies (CTCI 10.4)"
description: "Recherchez un élément dans une structure ordonnée Listy sans méthode de taille via saut exponentiel et dichotomie bornée en temps O(log p)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
previewImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
---

> **TL;DR**
> * **Le Problème du Livre:** On vous donne une structure de données `Listy` sans méthode `size()`, mais dotée d'une méthode `elementAt(i)` renvoyant l'entier positif en position $i$ en $O(1)$, ou `-1` hors limites. Trouvez l'indice d'une valeur $x$.
> * **La Solution Optimale:** **Recherche Exponentielle + Recherche Dichotomique Bornée** : (1) **Sondage Exponentiel** : Partir de `index = 1` et doubler continuellement `index *= 2` jusqu'à dépasser la valeur cible ou atteindre `-1` ; (2) **Dichotomie Bornée** : Rechercher dans la plage $[index / 2, index]$ ; (3) Considérer la valeur sentinelle `-1` comme un dépassement et restreindre à gauche ; (4) S'exécute en **temps optimal $O(\log p)$** (où $p$ est l'indice cible) et **espace $O(1)$**.
> * **Réalité en Production:** Recherche d'horodatages dans les flux de données continus et fichiers virtuels en mémoire (`mmap`).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.4), l'énoncé est :

*"Recherchez l'indice d'un element x dans une structure ordonnee sans taille connue (Listy) renvoyant -1 en cas de depassement de borne."*

## 2. Principe de la Recherche Exponentielle ($O(\log p)$)

1. **Phase de Découverte de Borne :** Interroger les indices $1, 2, 4, 8, \dots, 2^k$ jusqu'à encadrer la valeur $x$. Cette étape nécessite $\lceil \log_2 p \rceil$ opérations.
2. **Phase Dichotomique :** Exécuter une recherche binaire standard dans l'intervalle $[2^{k-1}, 2^k]$ en $O(\log p)$.

## Implémentation de Production

```java
public class SortedSearchNoSize {
    public static class Listy {
        private final int[] array;

        public Listy(int[] arr) { this.array = arr; }

        public int elementAt(int i) {
            if (i < 0 || i >= array.length) return -1;
            return array[i];
        }
    }

    /**
     * Recherche la valeur dans Listy.
     * Complexite Temporelle: O(log p)
     * Complexite Spatiale: O(1)
     */
    public static int search(Listy list, int value) {
        int index = 1;
        while (list.elementAt(index) != -1 && list.elementAt(index) < value) {
            index *= 2;
        }
        return binarySearch(list, value, index / 2, index);
    }

    private static int binarySearch(Listy list, int value, int low, int high) {
        int mid;

        while (low <= high) {
            mid = low + (high - low) / 2;
            int middle = list.elementAt(mid);

            if (middle > value || middle == -1) {
                high = mid - 1;
            } else if (middle < value) {
                low = mid + 1;
            } else {
                return mid;
            }
        }
        return -1;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(log p)` | $\log_2 p$ étapes d'expansion + $\log_2 p$ étapes de dichotomie. |
| Espace Auxiliaire | `O(1)` | Algorithme itératif en mémoire constante. |

## Ingénierie des Systèmes en Production

### Architecture Système : Flux Continus Non Bornés

1. **Recherche dans les Partitions Kafka :** Les consommateurs ajustent leurs offsets temporels dans les partitions de messages par duplication de fenêtres de sondage.
2. **Mémoire Virtuelle et Fichiers Creux :** Détection de fin de données sans lecture exhaustive par code retour d'erreur.

## Cas Limites et Robustesse

1. **Élément à l'Indice 0 :** L'évaluation `elementAt(1) >= value` encadre $[0, 1]$ sans faille.
2. **Valeur Absente :** Terminaison sécurisée avec retour de `-1`.
