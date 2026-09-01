---
title: "Zéros Factoriels: Calcul des Zéros Terminaux via la Formule de Legendre (CTCI 16.5)"
description: "Calculez le nombre exact de zéros consécutifs à la fin de n! sans calculer la factorielle grâce à la formule de Legendre et aux facteurs 5 en O(log5 n)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-5-factorial-zeros.webp
previewImage: /assets/images/ctci-16-5-factorial-zeros.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez un algorithme calculant le nombre de zéros terminaux dans $n$ factorielle ($n!$).
> * **Le Principe Mathématique :** **Formule de Legendre et Décomposition en Facteurs Premiers** :
>   1. Les zéros terminaux découlent du produit de facteurs premiers $2 \times 5 = 10$.
>   2. Dans $n!$, la multiplicité du facteur premier 2 est strictement supérieure à celle du facteur 5.
>   3. Le nombre de zéros terminaux correspond donc au nombre d'occurrences du facteur 5 dans la décomposition :
>      $$Z(n) = \sum_{k=1}^{\infty} \left\lfloor \frac{n}{5^k} \right\rfloor = \left\lfloor \frac{n}{5} \right\rfloor + \left\lfloor \frac{n}{25} \right\rfloor + \left\lfloor \frac{n}{125} \right\rfloor + \cdots$$
>   4. Diviser itérativement $n$ par 5 évite tout dépassement de capacité (overflow).
>   5. S'exécute en **temps $O(\log_5 n)$** et **espace $O(1)$**.
> * **Réalité en Production:** Arithmétique à précision arbitraire et cryptographie RSA.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.5), l'énoncé est :

*"Evaluez la quantite de zeros terminaux dans n! sans generer la valeur numerique astronomique de la factorielle."*

## 2. Dérivation par la Formule de Legendre

Pour $n = 26$ :
* Multiples de $5$ : $\{5, 10, 15, 20, 25\} \implies \lfloor 26 / 5 \rfloor = 5$
* Multiples de $25$ : $\{25\} \implies \lfloor 26 / 25 \rfloor = 1$
* Total de zéros : $5 + 1 = 6$.

## Implémentation de Production

```java
public class FactorialZeros {

    public static int countTrailingZeros(int n) {
        if (n < 0) return -1;

        int count = 0;
        while (n >= 5) {
            count += n / 5;
            n /= 5;
        }
        return count;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(log5 n)` | $\approx 13$ itérations pour le plus grand entier 32 bits. |
| Espace Mémoire | `O(1)` | Aucune structure auxiliaire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Croissance Exponentielle de $n!$

1. **Inapplicabilité des Types Géants :** $1000!$ comporte 2 568 chiffres. L'instanciation de `BigInteger` pour évaluer les zéros provoquerait des millions d'allocations mémoires superflues.
2. **Valuation p-adique ($\nu_p(n!)$) :** Utilisée en théorie des nombres pour accélérer les opérations modulaires.

## Cas Limites et Robustesse

1. **Entiers Négatifs :** Renvoie `-1`.
2. **0! et 1! :** Renvoie `0` conformément à la définition mathématique.
