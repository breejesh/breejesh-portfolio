---
title: "Multiplication Récursive: Doublage de Bits sans Opérateur de Multiplication (CTCI 8.5)"
description: "Multipliez deux entiers positifs sans utiliser les opérateurs * ni / par division et doublage de bits en temps O(log S) et espace O(log S)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-5-recursive-multiply.webp
previewImage: /assets/images/ctci-8-5-recursive-multiply.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une fonction récursive pour multiplier deux entiers positifs sans utiliser les opérateurs `*` ni `/`. Vous pouvez utiliser l'addition, la soustraction et les décalages de bits, en minimisant les opérations.
> * **La Solution Optimale:** Division et Doublage de Bits (Méthode Paysanne Russe) : (1) Identifier le plus petit entier $S$ et le plus grand $B$ ; (2) Diviser $S$ par 2 via décalage `S >> 1` et calculer récursivement le produit de la moitié ; (3) Si $S$ est pair, renvoyer `half + half`, sinon `half + half + B`. La réutilisation du calcul intermédiaire garantit un temps $O(\log S)$ et un espace $O(\log S)$.
> * **Réalité en Production:** Multiplicateurs matériels dans les ALU et algorithmes de Karatsuba pour la cryptographie à grands nombres (RSA).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.5), l'énoncé est :

*"Multipliez deux entiers positifs sans utiliser les operateurs * ni /, en minimisant le nombre d'operations binaires et arithmetiques."*

## 2. Principe Mathématique

Pour $S \le B$ :
1. Si $S = 0 \implies 0$.
2. Si $S = 1 \implies B$.
3. On calcule une seule fois $H = \lfloor S / 2 \rfloor \times B$.
4. Si $S$ est pair : $S \times B = H + H$.
5. Si $S$ est impair : $S \times B = H + H + B$.

À chaque étape, $S$ est divisé par deux, ce qui limite le nombre d'appels à $\lfloor \log_2 S \rfloor$.

## Implémentation de Production

```java
public class RecursiveMultiply {
    /**
     * Multiplie deux entiers positifs sans * ni /.
     * Complexite Temporelle: O(log(min(a, b)))
     * Complexite Spatiale: O(log(min(a, b)))
     */
    public static int minProduct(int a, int b) {
        int bigger = a < b ? b : a;
        int smaller = a < b ? a : b;
        return minProductHelper(smaller, bigger);
    }

    private static int minProductHelper(int smaller, int bigger) {
        if (smaller == 0) return 0;
        if (smaller == 1) return bigger;

        int s = smaller >> 1;
        int halfProd = minProductHelper(s, bigger);

        if (smaller % 2 == 0) {
            return halfProd + halfProd;
        } else {
            return halfProd + halfProd + bigger;
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(log S)` | Où $S = \min(a, b)$. Réduit $S$ de moitié à chaque niveau. |
| Espace Auxiliaire | `O(log S)` | Profondeur de pile bornée par les bits de $S$ ($\le 31$). |

## Ingénierie des Systèmes en Production

### Architecture Système : Circuits Logiques d'ALU

1. **Algorithme de Booth (Multiplicateurs Silicium) :** Exécution rapide des multiplications en microprocesseur par additions et décalages arithmétiques.
2. **Cryptographie Haute Précision :** Décomposition récursive de grands entiers en blocs de 64 bits.

## Cas Limites et Robustesse

1. **Multiplication par 0 :** Retourne 0 immédiatement.
2. **Multiplication par 1 :** Retourne `bigger`.
