---
title: "Nombre Suivant: Trouver les Nombres Précédent et Suivant avec Même Poids de Hamming (CTCI 5.4)"
description: "Étant donné un entier positif, calculez les nombres supérieur et inférieur les plus proches ayant le même nombre exact de bits à 1 en temps O(b)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-4-next-number.webp
previewImage: /assets/images/ctci-5-4-next-number.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un entier positif, affichez le plus petit nombre supérieur et le plus grand nombre inférieur ayant le même nombre de bits 1 dans leur représentation binaire.
> * **La Solution Optimale:** (1) **Get Next :** Localisez le premier zéro non terminal à la position $p$. Inversez le bit $p$ de `0` à `1`, effacez les bits à sa droite et insérez $c_1 - 1$ uns sur les bits de poids faible ; (2) **Get Prev :** Localisez le premier un non terminal à la position $p$, inversez-le à `0` et placez $c_1 + 1$ uns immédiatement à droite de $p$ en temps $O(b)$ et espace $O(1)$.
> * **Réalité en Production:** Astuce de Gosper pour l'énumération de combinaisons et moteurs d'échecs (bitboards).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.4), la question posée est :

*"Étant donné un entier positif, affichez le plus petit nombre supérieur et le plus grand nombre inférieur ayant le même nombre de 1s dans leur représentation binaire."*

## 2. Mécanique Algorithmique

### Calcul du Nombre Supérieur (`getNext`)
1. Compter les zéros de fin ($c_0$) et les uns consécutifs ($c_1$).
2. Position du premier zéro non terminal : $p = c_0 + c_1$.
3. Mettre à 1 le bit $p$ : `n |= (1 << p)`.
4. Effacer les bits à droite de $p$ : `n &= ~((1 << p) - 1)`.
5. Insérer $c_1 - 1$ uns à droite : `n |= (1 << (c_1 - 1)) - 1`.

### Calcul du Nombre Inférieur (`getPrev`)
1. Compter les uns de fin ($c_1$) et les zéros consécutifs ($c_0$).
2. Position $p = c_0 + c_1$.
3. Effacer à partir de $p$ : `n &= ((~0) << (p + 1))`.
4. Insérer $c_1 + 1$ uns immédiatement à droite de $p$ : `int mask = (1 << (c_1 + 1)) - 1; n |= mask << (c_0 - 1)`.

## Implémentation de Production

```java
public class NextNumber {
    /**
     * Calcule le nombre superieur le plus proche ayant le meme nombre de bits a 1.
     * Complexite Temporelle: O(b) ou b <= 32
     * Complexite Spatiale: O(1)
     */
    public static int getNext(int n) {
        int c = n;
        int c0 = 0;
        int c1 = 0;

        while (((c & 1) == 0) && (c != 0)) {
            c0++;
            c >>= 1;
        }

        while ((c & 1) == 1) {
            c1++;
            c >>= 1;
        }

        if (c0 + c1 == 31 || c0 + c1 == 0) {
            return -1;
        }

        int p = c0 + c1;

        n |= (1 << p);
        n &= ~((1 << p) - 1);
        n |= (1 << (c1 - 1)) - 1;

        return n;
    }

    /**
     * Calcule le nombre inferieur le plus proche ayant le meme nombre de bits a 1.
     * Complexite Temporelle: O(b) ou b <= 32
     * Complexite Spatiale: O(1)
     */
    public static int getPrev(int n) {
        int temp = n;
        int c0 = 0;
        int c1 = 0;

        while ((temp & 1) == 1) {
            c1++;
            temp >>= 1;
        }

        if (temp == 0) return -1;

        while (((temp & 1) == 0) && (temp != 0)) {
            c0++;
            temp >>= 1;
        }

        int p = c0 + c1;
        n &= ((~0) << (p + 1));

        int mask = (1 << (c1 + 1)) - 1;
        n |= mask << (c0 - 1);

        return n;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(b)` | Inspecte au plus 32 bits par décalages binaires. |
| Espace Auxiliaire | `O(1)` | Variables locales en registres CPU. |

## Ingénierie des Systèmes en Production

### Architecture Système : Astuce de Gosper et Bitboards

1. **Moteurs d'Échecs :** Génération de coups légaux par manipulation directe de masques binaires (bitboards).
2. **Astuce de Gosper (Gosper's Hack) :** Énumération sans allocation de combinaisons de poids fixe.

## Cas Limites et Robustesse

1. **Aucun nombre valide dans l'intervalle 32 bits :** Renvoie `-1`.
2. **Puissance de deux ($n = 4 \to 0100$) :** `getNext` donne $8$, `getPrev` donne $2$.
