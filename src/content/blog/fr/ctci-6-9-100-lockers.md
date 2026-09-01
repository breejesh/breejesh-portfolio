---
title: "100 Casiers: Paires de Diviseurs et Casiers Carrés Parfaits (CTCI 6.9)"
description: "Preuve mathématique expliquant pourquoi exactement 10 casiers (les carrés parfaits) restent ouverts après 100 passages en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-9-100-lockers.webp
previewImage: /assets/images/ctci-6-9-100-lockers.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Il y a 100 casiers fermés dans un couloir. Un homme ouvre tous les casiers au 1er passage. Au 2e passage, il inverse l'état d'un casier sur deux. Au 3e, d'un casier sur trois... Au 100e, uniquement le 100e. Après 100 passages, combien de casiers restent ouverts ?
> * **La Solution Optimale:** **Parité des Diviseurs / Carrés Parfaits** : Un casier $k$ est basculé autant de fois qu'il possède de diviseurs. Les diviseurs venant par paires $(a, b)$ telles que $a \times b = k$, leur nombre est toujours **pair**, sauf si $a = b \implies k = a^2$ (carré parfait). Seuls les **carrés parfaits** ont un nombre impair de diviseurs et restent à l'état OUVERT. Il y en a $\lfloor \sqrt{100} \rfloor = \mathbf{10}$ entre 1 et 100 ($1, 4, 9, 16, 25, 36, 49, 64, 81, 100$).
> * **Réalité en Production:** Crible d'Ératosthène et optimisation de la mémoire cache.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.9), l'énoncé est :

*"100 casiers sont fermes. Au passage i, on inverse l'etat des casiers multiples de i. Apres 100 passages, combien de casiers restent ouverts ?"*

## 2. Démonstration par Appariement des Diviseurs

1. **Règle de Basculement :** Le casier $k$ bascule au passage $i$ si et seulement si $i$ divise $k$.
2. **Paires de Diviseurs :** Les facteurs se regroupent par paires $(a, b)$ où $a \cdot b = k$.
   * Exemple ($k = 12$) : $(1, 12), (2, 6), (3, 4) \implies 6$ facteurs (pair $\implies$ FERMÉ).
3. **Cas Particulier des Carrés Parfaits :** Lorsque $a = b$, le facteur n'est compté qu'une fois.
   * Exemple ($k = 16$) : $(1, 16), (2, 8), (4, 4) \implies 5$ facteurs (impair $\implies$ OUVERT).
4. **Dénombrement :** Les carrés parfaits $\le 100$ sont $\{1, 4, 9, 16, 25, 36, 49, 64, 81, 100\} \implies \lfloor \sqrt{100} \rfloor = \mathbf{10}$.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class LockersProblem {
    /**
     * Calcule le nombre de casiers ouverts en O(1).
     */
    public static int countOpenLockers(int n) {
        if (n <= 0) return 0;
        return (int) Math.sqrt(n);
    }

    /**
     * Retourne la liste des numeros de casiers ouverts.
     */
    public static List<Integer> getOpenLockers(int n) {
        List<Integer> openLockers = new ArrayList<>();
        for (int i = 1; i * i <= n; i++) {
            openLockers.add(i * i);
        }
        return openLockers;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Calcul Direct | `O(1)` | Calcul immédiat `Math.sqrt(n)`. |
| Génération de Liste | `O(sqrt(N))` | Boucle jusqu'à $\sqrt{N}$. |
| Espace Auxiliaire | `O(1)` | Zéro allocation pour le comptage. |

## Ingénierie des Systèmes en Production

### Architecture Système : Symétrie des Diviseurs

1. **Crible d'Ératosthène :** Exploite la borne en $\sqrt{N}$ pour limiter la recherche des nombres premiers.
2. **Conflits de Lignes de Cache CPU :** Évaluation des accès par pas (strides) générant des expulsions périodiques.

## Cas Limites et Robustesse

1. **$n = 1$ :** Renvoie 1.
2. **$n \le 0$ :** Renvoie 0.
