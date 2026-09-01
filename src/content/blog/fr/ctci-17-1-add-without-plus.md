---
title: "Addition sans Plus: Arithmétique Binaire et Propagation de Retenue (CTCI 17.1)"
description: "Implémentez l'addition d'entiers sans opérateur arithmétique grâce aux opérations binaires XOR et AND avec décalage de retenue en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-1-add-without-plus.webp
previewImage: /assets/images/ctci-17-1-add-without-plus.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une fonction qui additionne deux nombres sans utiliser le signe `+` ni aucun opérateur arithmétique.
> * **La Solution Optimale:** **Demi-Additionneur Numérique Bit à Bit** :
>   1. **Somme sans Retenue** : `sum = a ^ b` (l'opérateur XOR réalise l'addition binaire : $0+0=0, 1+0=1, 0+1=1, 1+1=0$).
>   2. **Calcul de Retenue** : `carry = (a & b) << 1` (l'opérateur AND isole les collisions de bits, décalées vers la gauche pour s'ajouter au rang supérieur).
>   3. **Réduction Itérative** : Réaffecter $a = \text{sum}$ et $b = \text{carry}$ jusqu'à ce que $\text{carry} == 0$.
>   4. S'exécute en **temps $O(1)$** (au maximum 32 itérations pour un entier 32 bits) et **espace $O(1)$**.
> * **Réalité en Production:** Unités Arithmétiques et Logiques (ALU) matérielles et cryptographie à temps constant.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.1), l'énoncé est :

*"Additionnez deux entiers a et b en utilisant exclusivement des operateurs logiques bit a bit (XOR, AND, NOT, Decalages) sans aucun operateur arithmetique."*

## 2. Demi-Additionneur Électronique

Ce processus émule fidèlement les portes logiques des circuits d'addition au niveau matériel.

## Implémentation de Production

```java
public class AddWithoutPlus {

    public static int add(int a, int b) {
        while (b != 0) {
            int sum = a ^ b;            // Addition sans retenue
            int carry = (a & b) << 1;   // Calcul et décalage des retenues
            a = sum;
            b = carry;
        }
        return a;
    }

    public static int addRecursive(int a, int b) {
        if (b == 0) return a;
        int sum = a ^ b;
        int carry = (a & b) << 1;
        return addRecursive(sum, carry);
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Au maximum 32 passages de boucle. |
| Espace Mémoire | `O(1)` | Deux registres scalaires simples. |
| Nombres Négatifs | Natif | Préservé par le complément à deux. |

## Ingénierie des Systèmes en Production

### Architecture Système : Circuits ALU et Additionneurs Logarithmiques

1. **Additionneurs Carry-Lookahead (CLA) :** Les processeurs modernes calculent l'ensemble des retenues en parallèle avec une profondeur de portes $O(\log N)$ pour éviter les délais des additionneurs linéaires.
2. **Cryptographie Invariante :** Protection contre les attaques temporelles par canaux auxiliaires via des opérations logiques déterministes.

## Cas Limites et Robustesse

1. **Entiers Négatifs :** L'arithmétique en complément à deux s'exécute sans aucune modification de code.
