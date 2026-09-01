---
title: "Trier une Pile: Tri avec au Plus une Pile Auxiliaire (CTCI 3.5)"
description: "Triez une pile dans l'ordre croissant (plus petits éléments au sommet) en utilisant au maximum une pile auxiliaire temporaire en temps O(N^2) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-3-5-sort-stack.webp
previewImage: /assets/images/ctci-3-5-sort-stack.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez un programme pour trier une pile de manière à ce que les plus petits éléments se trouvent au sommet. Vous pouvez utiliser une pile temporaire supplémentaire, mais vous ne pouvez copier les éléments dans aucune autre structure.
> * **La Solution Optimale:** Considérez la pile temporaire `r` comme un tampon ordonné (les plus grands au sommet). Dépilez `tmp` de `s`. Tant que `!r.isEmpty() && r.peek() > tmp`, retransférez de `r` vers `s`, puis empilez `tmp` sur `r`. Une fois `s` vide, recopiez `r` vers `s` en temps $O(N^2)$ et espace $O(N)$.
> * **Réalité en Production:** Systèmes embarqués à mémoire contrainte et calculatrices à notation polonaise inverse (NPI).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 3.5), la question posée est :

*"Écrivez un programme pour trier une pile afin que les plus petits éléments soient au sommet. Vous pouvez utiliser une pile temporaire supplémentaire, mais aucune autre structure de données."*

## 2. Mécanique Algorithmique (Tri par Insertion sur Pile)

Nous utilisons une pile auxiliaire `r` maintenue ordonnée avec les plus grands éléments au sommet :
1. Dépiler l'élément supérieur de `s` dans `tmp = s.pop()`.
2. Tant que `r` n'est pas vide et que `r.peek() > tmp` :
   * Dépiler de `r` et réempiler sur `s` (`s.push(r.pop())`).
3. Empiler `tmp` sur `r`.
4. Répéter jusqu'à ce que `s` soit vide.
5. Transférer tous les éléments de `r` vers `s`. Les plus grands étant au sommet de `r`, ils se retrouvent inversés au fond de `s`, plaçant les plus petits au sommet.

## Implémentation de Production

```java
import java.util.Stack;

public class SortStack {
    /**
     * Trie la pile s pour placer les plus petits elements au sommet.
     * Complexite Temporelle: O(N^2)
     * Complexite Spatiale: O(N)
     */
    public static void sort(Stack<Integer> s) {
        Stack<Integer> r = new Stack<>();

        while (!s.isEmpty()) {
            int tmp = s.pop();
            while (!r.isEmpty() && r.peek() > tmp) {
                s.push(r.pop());
            }
            r.push(tmp);
        }

        while (!r.isEmpty()) {
            s.push(r.pop());
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N^2)` | Pour chacun des $N$ éléments, jusqu'à $N$ transferts peuvent survenir. |
| Espace Auxiliaire | `O(N)` | Une seule pile auxiliaire stockant au plus $N$ éléments. |

## Ingénierie des Systèmes en Production

### Architecture Système : Systèmes Embarqués Déterministes

1. **Microcontrôleurs Embarqués :** En l'absence d'allocateur dynamique sur le tas, le tri sur pile garantit une empreinte mémoire bornée.
2. **Calculatrices NPI :** Réorganisation matérielle des registres de pile d'exécution.

## Cas Limites et Robustesse

1. **Pile déjà triée :** S'exécute en $O(N)$ sans transfert inverse.
2. **Éléments dupliqués (`5, 5, 5`) :** Maintenus grâce au test strict `r.peek() > tmp`.
3. **Pile vide ou à nœud unique :** Se termine en $O(1)$.
