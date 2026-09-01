---
title: "Opérations Arithmétiques: Soustraction, Multiplication et Division par l'Addition Seule (CTCI 16.9)"
description: "Implémentez la soustraction, multiplication et division d'entiers en utilisant exclusivement l'opérateur d'addition et le doublement exponentiel en O(log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-9-operations.webp
previewImage: /assets/images/ctci-16-9-operations.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez des méthodes pour implémenter les opérations de multiplication, soustraction et division pour des entiers. Le seul opérateur autorisé est l'addition (`+`).
> * **La Solution Optimale:** **Négation et Quotient par Doublement Exponentiel** :
>   1. **Négation (`negate(x)`)** : Au lieu d'itérer par $\pm 1$ en $O(N)$, doubler le pas de décrémentation ($\Delta = -1, -2, -4, \dots$) en **$O(\log |x|)$**.
>   2. **Soustraction (`subtract(a, b)`)** : $a - b = a + \text{negate}(b)$.
>   3. **Multiplication (`multiply(a, b)`)** : Additions répétées de $a$ adaptées à la magnitude de $|b|$.
>   4. **Division (`divide(a, b)`)** : Recherche dichotomique aditive du diviseur pour construire le quotient.
>   5. S'exécute avec une négation en **$O(\log |x|)$** et une division en **$O(\log^2 (a / b))$**.
> * **Réalité en Production:** Unités arithmétiques et logiques (ALU) et processeurs embarqués sans unité de division matérielle.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.9), l'énoncé est :

*"Reconstruisez l'arithmetique entiere (difference, produit, quotient) en exploitant uniquement l'operateur d'addition (+)."*

## 2. Négation par Doublement Exponentiel

Pour inverser le signe d'un entier sans opérateur de soustraction, le pas de décrémentation est doublé à chaque étape ($\Delta \leftarrow \Delta + \Delta$) pour converger en temps logarithmique.

## Implémentation de Production

```java
public class Operations {

    public static int negate(int a) {
        if (a == 0) return 0;
        int negated = 0;
        int direction = (a < 0) ? 1 : -1;
        int delta = direction;

        while (a != 0) {
            boolean willExceed = (direction > 0) ? (a + delta > 0) : (a + delta < 0);
            if (willExceed) {
                delta = direction;
            }
            negated += delta;
            a += delta;
            delta += delta;
        }
        return negated;
    }

    public static int subtract(int a, int b) {
        return a + negate(b);
    }

    public static int multiply(int a, int b) {
        if (a == 0 || b == 0) return 0;
        if (abs(a) < abs(b)) return multiply(b, a);

        int absB = abs(b);
        int product = 0;
        for (int i = 0; i < absB; i++) {
            product += a;
        }
        return (b < 0) ? negate(product) : product;
    }

    public static int divide(int a, int b) {
        if (b == 0) throw new ArithmeticException("Division par zéro");
        if (a == 0) return 0;

        int absA = abs(a);
        int absB = abs(b);
        int quotient = 0;
        int total = 0;

        while (total + absB <= absA) {
            int currentProduct = absB;
            int currentQuotient = 1;
            while (total + currentProduct + currentProduct <= absA) {
                currentProduct += currentProduct;
                currentQuotient += currentQuotient;
            }
            total += currentProduct;
            quotient += currentQuotient;
        }

        boolean sameSign = (a > 0 && b > 0) || (a < 0 && b < 0);
        return sameSign ? quotient : negate(quotient);
    }

    private static int abs(int a) {
        return (a < 0) ? negate(a) : a;
    }
}
```

## Analyse de Complexité

| Opération | Complexité Temporelle | Espace Mémoire |
|---|---|---|
| **`negate(a)`** | $O(\log |a|)$ | $O(1)$ |
| **`subtract(a, b)`** | $O(\log |b|)$ | $O(1)$ |
| **`multiply(a, b)`** | $O(\min(|a|, |b|))$ | $O(1)$ |
| **`divide(a, b)`** | $O(\log^2 (a / b))$ | $O(1)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Micro-Architecture ALU

1. **Circuits Additionneurs :** Les micro-contrôleurs à faible coût synthétisent les divisions au niveau microcode en combinant additionneurs complets (Full Adders) et registres à décalage.
2. **Complément à Deux :** Dans les processeurs modernes, la négation matérielle s'opère en 1 cycle via `~x + 1`.

## Cas Limites et Robustesse

1. **Division par Zéro :** Déclenche une `ArithmeticException` explicite.
