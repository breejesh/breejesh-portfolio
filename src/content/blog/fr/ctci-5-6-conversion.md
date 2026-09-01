---
title: "Conversion: Inversions de Bits Requises pour Convertir l'Entier A en B (CTCI 5.6)"
description: "Déterminez le nombre de bits à inverser pour transformer l'entier A en B grâce au XOR et à l'algorithme de Brian Kernighan en temps O(k) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-6-conversion.webp
previewImage: /assets/images/ctci-5-6-conversion.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une fonction pour déterminer le nombre de bits qu'il faudrait inverser pour convertir l'entier A en l'entier B.
> * **La Solution Optimale:** Calculez $C = A \oplus B$ (XOR). Chaque bit à 1 dans $C$ représente une position où $A$ et $B$ diffèrent. Comptez ces bits à 1 à l'aide de l'**Algorithme de Brian Kernighan** (`c = c & (c - 1)`), qui n'itère qu'exactement $k$ fois (où $k$ est la distance de Hamming, $k \le 32$) en temps $O(k)$ et espace $O(1)$.
> * **Réalité en Production:** Calcul de distance de Hamming dans les mémoires ECC et détection de quasi-doublons (SimHash).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.6), la question posée est :

*"Écrivez une fonction pour déterminer le nombre de bits que vous auriez besoin d'inverser pour convertir l'entier A en entier B."*

**Exemple :**
* Entrée : `29` (`11101_2`), `15` (`01111_2`)
* Sortie : `2` (les bits aux positions 1 et 4 doivent être inversés).

## 2. XOR et Algorithme de Brian Kernighan

1. L'opération XOR $A \oplus B$ isole les positions où les bits sont divergents en leur attribuant la valeur 1.
2. Au lieu d'effectuer 32 décalages, l'instruction `c = c & (c - 1)` efface directement le bit 1 le plus bas à chaque tour de boucle, réduisant le nombre d'itérations au nombre exact de bits divergents $k$.

## Implémentation de Production

```java
public class BitConversion {
    /**
     * Determine le nombre de bits a inverser pour convertir a en b.
     * Complexite Temporelle: O(k) ou k est le nombre de bits differents (k <= 32).
     * Complexite Spatiale: O(1)
     */
    public static int bitSwapRequired(int a, int b) {
        int count = 0;
        for (int c = a ^ b; c != 0; c = c & (c - 1)) {
            count++;
        }
        return count;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(k)` | Exactement $k$ itérations où $k$ est la distance de Hamming ($k \le 32$). |
| Espace Auxiliaire | `O(1)` | Variable entière dans un registre. |

## Ingénierie des Systèmes en Production

### Architecture Système : Distance de Hamming et Tolérance aux Pannes

1. **Mémoires ECC (Error-Correcting Code) :** Détecte et corrige les inversions spontanées de bits en mesurant la distance de Hamming des mots de code.
2. **Détection de Doublons (SimHash) :** Analyse de similarité entre documents textuels via comparaison de vecteurs d'empreinte binaire.

## Cas Limites et Robustesse

1. **Entiers identiques ($A == B$) :** $A \oplus B = 0$, renvoie `0` immédiatement.
2. **Entiers complémentaires ($A == \sim B$) :** Renvoie `32`.
