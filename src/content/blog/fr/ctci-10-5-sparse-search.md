---
title: "Recherche Dispersée: Recherche Binaire avec Chaînes Vides Intercalées (CTCI 10.5)"
description: "Localisez une chaîne dans un tableau trié entrecoupé de chaînes vides via recherche binaire à pointeurs expansifs en temps moyen O(log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un tableau trié de chaînes de caractères parsemé de chaînes vides (`""`). Écrivez une méthode pour trouver l'emplacement d'une chaîne donnée.
> * **La Solution Optimale:** Recherche Binaire à Pointeurs Élargis : (1) Calculer `mid = (first + last) / 2` ; (2) Si `strings[mid]` est vide `""`, faire rayonner deux pointeurs (`left = mid - 1` et `right = mid + 1`) vers l'extérieur jusqu'à rencontrer la première chaîne non vide ; (3) Si tout le sous-segment est vide, interrompre la recherche ; (4) Comparer la chaîne valide trouvée et poursuivre la dichotomie ; (5) S'exécute en **temps moyen $O(\log N)$** et pire cas $O(N)$.
> * **Réalité en Production:** Recherche d'enregistrements avec marqueurs d'effacement (tombstones) dans RocksDB et colonnes creuses en formats Parquet / Arrow.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.5), l'énoncé est :

*"Trouvez la position d'une chaine dans un tableau trie comprenant de multiples chaines vides intercalaires."*

**Exemple :**
`find("ball", {"at", "", "", "", "ball", "", "", "car", "", "", "dad", "", ""})` $\to 4$

## 2. Ajustement du Point Médian

Lorsqu'un indice médian tombe sur une chaîne vide, l'algorithme ne peut déduire quelle branche explorer.

En balayant simultanément à gauche et à droite, on sélectionne la chaîne non vide la plus proche pour réaligner le point médian.

## Implémentation de Production

```java
public class SparseSearch {
    /**
     * Recherche la chaine str dans le tableau disperse.
     * Complexite Temporelle: O(log N) moyen, O(N) pire cas.
     * Complexite Spatiale: O(log N)
     */
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) {
            return -1;
        }
        return searchHelper(strings, str, 0, strings.length - 1);
    }

    private static int searchHelper(String[] strings, String str, int first, int last) {
        if (first > last) return -1;

        int mid = (last + first) / 2;

        if (strings[mid].isEmpty()) {
            int left = mid - 1;
            int right = mid + 1;

            while (true) {
                if (left < first && right > last) {
                    return -1;
                } else if (right <= last && !strings[right].isEmpty()) {
                    mid = right;
                    break;
                } else if (left >= first && !strings[left].isEmpty()) {
                    mid = left;
                    break;
                }
                left--;
                right++;
            }
        }

        if (str.equals(strings[mid])) {
            return mid;
        } else if (strings[mid].compareTo(str) < 0) {
            return searchHelper(strings, str, mid + 1, last);
        } else {
            return searchHelper(strings, str, first, mid - 1);
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Cas | Complexité Temporelle | Espace Auxiliaire | Détail Technique |
|---|---|---|---|
| Cas Moyen (Chaînes Réparties) | `O(log N)` | `O(log N)` | Le recentrage sur une chaîne non vide prend $O(1)$ étapes amorties. |
| Pire Cas (Majoritairement Vide) | `O(N)` | `O(log N)` | Les pointeurs parcourent la totalité de la plage. |

## Ingénierie des Systèmes en Production

### Architecture Système : Tombstones dans les Moteurs NoSQL

1. **Suppression par Marqueur (Cassandra / RocksDB) :** Les suppressions insèrent des clés vides sans réécriture immédiate ; la recherche dispersée traverse ces zones sans pénalité de réindexation.
2. **Colonnes Creuses (Parquet) :** Saut direct par-dessus les plages de valeurs nulles.

## Cas Limites et Robustesse

1. **Chaîne Cible Vide :** Retourne immédiatement `-1`.
2. **Tableau Entièrement Vide :** Arrêt précoce avec retour de `-1`.
