---
title: "Plus Petite Différence: Optimisation par Deux Pointeurs sur Tableaux Triés (CTCI 16.6)"
description: "Calculez l'écart absolu minimal non négatif entre deux tableaux d'entiers via un double tri et un parcours convergent à deux pointeurs en O(A log A + B log B)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-6-smallest-difference.webp
previewImage: /assets/images/ctci-16-6-smallest-difference.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit deux tableaux d'entiers, calculez la paire de valeurs (une par tableau) présentant la plus petite différence absolue non négative, et renvoyez cet écart.
> * **La Solution Optimale:** **Double Tri + Parcours Convergent à Deux Pointeurs** :
>   1. Trier les deux tableaux par ordre croissant : `Arrays.sort(a); Arrays.sort(b);`.
>   2. Initialiser deux pointeurs $i = 0$ et $j = 0$.
>   3. À chaque étape, calculer `diff = Math.abs((long)a[i] - (long)b[j])` et mettre à jour le minimum.
>   4. Si la différence vaut 0, renvoyer 0 immédiatement.
>   5. Incrémenter le pointeur désignant la plus petite valeur ($a[i] < b[j] \implies i++$, sinon $j++$).
>   6. Caster les éléments en `long` 64 bits pour neutraliser les dépassements d'entiers signés 32 bits.
>   7. S'exécute en **temps $O(A \log A + B \log B)$** et **espace $O(1)$**.
> * **Réalité en Production:** Alignement temporel de traces distribuées et synchronisation de signaux audio.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.6), l'énoncé est :

*"Identifiez le couple d'elements minimisant l'ecart arithmetique absolu entre deux tableaux de nombres entiers."*

## 2. Convergence par Deux Pointeurs

Le tri préalable permet d'explorer l'espace des solutions de façon monotone en avançant toujours le pointeur de la valeur la plus faible en $O(A + B)$.

## Implémentation de Production

```java
import java.util.Arrays;

public class SmallestDifference {

    public static long findSmallestDifference(int[] a, int[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return -1;
        }

        Arrays.sort(a);
        Arrays.sort(b);

        int i = 0;
        int j = 0;
        long minDifference = Long.MAX_VALUE;

        while (i < a.length && j < b.length) {
            long diff = Math.abs((long) a[i] - (long) b[j]);
            minDifference = Math.min(minDifference, diff);

            if (minDifference == 0) return 0;

            if (a[i] < b[j]) {
                i++;
            } else {
                j++;
            }
        }

        return minDifference;
    }
}
```

## Analyse de Complexité

| Étape | Complexité Temporelle | Espace Mémoire |
|---|---|---|
| Double Tri | $O(A \log A + B \log B)$ | $O(\log A + \log B)$ pile récursive |
| Parcours 2 Pointeurs | $O(A + B)$ | $O(1)$ |
| **Total** | **$O(A \log A + B \log B)$** | **$O(1)$ auxiliaire** |

## Ingénierie des Systèmes en Production

### Architecture Système : Traçabilité Distribuée et Dérive d'Horloge

1. **Agrégation de Logs Télémtriques :** Dans les plateformes d'observabilité (OpenTelemetry / Jaeger), la corrélation d'événements réseau avec horloges non synchronisées utilise des algorithmes de plus petite différence temporelle.
2. **Traitement du Signal :** Alignement de phases audio multi-pistes.

## Cas Limites et Robustesse

1. **Dépassement de Capacité :** L'usage de `(long) a[i] - (long) b[j]` protège des soustractions extrêmes (`Integer.MIN_VALUE`).
