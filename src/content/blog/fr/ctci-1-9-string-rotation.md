---
title: "Rotation de Chaîne: Vérifier si une Chaîne est une Rotation d'une Autre (CTCI 1.9)"
description: "Déterminez si s2 est une rotation de s1 en utilisant un seul appel à isSubstring via la concaténation double en temps O(N) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-9-string-rotation.webp
previewImage: /assets/images/ctci-1-9-string-rotation.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Supposons que vous disposiez d'une méthode `isSubstring` qui vérifie si un mot est une sous-chaîne d'un autre. Étant donné deux chaînes, `s1` et `s2`, écrivez le code permettant de vérifier si `s2` est une rotation de `s1` en n'effectuant qu'un seul appel à `isSubstring` (par exemple, `'waterbottle'` est une rotation de `'erbottlewat'`).
> * **L'Avancée Fondamentale:** Si $s_2$ est une rotation de $s_1$, alors $s_1$ peut être décomposé en deux parties $x$ et $y$ telles que $s_1 = xy$ et $s_2 = yx$. En concaténant $s_1$ avec lui-même ($s_1s_1 = xyxy$), la chaîne $yx$ ($s_2$) est garantie d'être une sous-chaîne contiguë de $s_1s_1$.
> * **Réalité en Production:** Tampons circulaires (ring buffers) dans le noyau du système d'exploitation, anneaux à jeton réseau et alignement de génomes circulaires en bio-informatique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 1.9), la question posée est :

*"Supposons que vous disposiez d'une méthode isSubstring qui vérifie si un mot est une sous-chaîne d'un autre. Étant donné deux chaînes, s1 et s2, écrivez le code permettant de vérifier si s2 est une rotation de s1 en n'effectuant qu'un seul appel à isSubstring (par exemple, 'waterbottle' est une rotation de 'erbottlewat')."*

**Démonstration Mathématique :**
Si $s_2$ est une rotation cyclique de $s_1$, il existe un point de césure qui divise $s_1$ en deux segments :
* $s_1 = x + y$ (ex. : $x = \text{"wat"}$, $y = \text{"erbottle"}$)
* $s_2 = y + x$ (ex. : $y = \text{"erbottle"}$, $x = \text{"wat"}$)

En effectuant la concaténation $s_1s_1$ :
$$s_1s_1 = s_1 + s_1 = (x + y) + (x + y) = x + (y + x) + y = x + s_2 + y$$

Puisque $s_2 = yx$, $s_2$ apparaît naturellement comme une sous-chaîne de $s_1s_1$. Par conséquent, un unique appel à `isSubstring(s1s1, s2)` valide la rotation.

## 2. Approche Naïve et Inefficacités

Une approche naïve générerait les $N$ rotations cycliques possibles de $s_1$ en décalant les caractères un à un pour les comparer à $s_2$ :
* **Complexité Temporelle :** $O(N^2)$ due aux $N$ rotations nécessitant chacune une comparaison en $O(N)$.
* **Complexité Spatiale :** $O(N)$ pour allouer chaque chaîne pivotée.

Cette approche gaspille des cycles CPU et enfreint la contrainte de n'effectuer qu'un seul appel à `isSubstring`.

## 3. Mécanique Algorithmique Optimale

1. Vérifier si les deux chaînes sont de même longueur non nulle. Si les longueurs diffèrent ou sont nulles, retourner `false` immédiatement en $O(1)$.
2. Concaténer $s_1$ avec lui-même : `String s1s1 = s1 + s1`.
3. Invoquer `isSubstring(s1s1, s2)` et renvoyer le résultat booléen.

## Implémentation de Production

```java
public class StringRotation {
    /**
     * Verifie si s2 est une rotation de s1 en utilisant un seul appel de sous-chaine.
     * Complexite Temporelle: O(N) en supposant que isSubstring s'execute en O(N + M).
     * Complexite Spatiale: O(N) pour allouer la chaine concatenee s1s1.
     */
    public static boolean isRotation(String s1, String s2) {
        int len = s1 != null ? s1.length() : 0;

        // Verifier que les chaines sont de longueurs egales et non nulles
        if (len == s2.length() && len > 0) {
            String s1s1 = s1 + s1;
            return isSubstring(s1s1, s2);
        }

        return false;
    }

    public static boolean isSubstring(String big, String sub) {
        return big.contains(sub);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Concaténer $s_1s_1$ prend $O(N)$. La recherche de sous-chaîne (KMP / Boyer-Moore) prend $O(2N + N) = O(N)$. |
| Espace Auxiliaire | `O(N)` | Alloue de la mémoire pour la chaîne doublée $s_1s_1$ de longueur $2N$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Tampons Circulaires et Séquences Périodiques

1. **Tampons Circulaires sans Verrou (LMAX Disruptor / Linux Kfifo) :** Les tampons circulaires gèrent les index de lecture et d'écriture par arithmétique modulaire. L'approche de duplication mémoire (`mmap`) est couramment utilisée pour permettre des lectures séquentielles sans branchement conditionnel.
2. **Plasmides et ADN Circulaire en Bio-informatique :** L'ADN bactérien possède une structure circulaire. Les outils d'alignement doublent la séquence de référence pour identifier rapidement les gènes pivots.
3. **Réseaux en Anneau à Jeton :** Détection d'anomalies de rotation dans les protocoles réseau circulaires.

## Cas Limites et Robustesse

1. **Longueurs différentes (`"water"`, `"waterbottle"`) :** Retourne `false` en $O(1)$.
2. **Chaînes vides (`""`, `""`) :** Géré par la condition `len > 0`, retournant `false`.
3. **Chaînes identiques (`"apple"`, `"apple"`) :** Rotation de 0 position, retourne `true`.
4. **Chaînes d'un seul caractère (`"a"`, `"a"`) :** Retourne `true`.
5. **Valeurs nulles :** Contrôles défensifs initiaux.
