---
title: "Binaire vers Chaîne: Convertir des Nombres Réels en Binaire à Précision Fixe (CTCI 5.2)"
description: "Étant donné un nombre réel entre 0 et 1 passé sous forme de double, affichez sa représentation binaire sur au plus 32 caractères ou renvoyez ERROR en O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-2-binary-to-string.webp
previewImage: /assets/images/ctci-5-2-binary-to-string.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un nombre réel compris entre 0 et 1 (par exemple 0.72) sous forme de double, affichez sa représentation binaire. Si le nombre ne peut pas être représenté exactement avec au plus 32 caractères, affichez "ERROR".
> * **La Solution Optimale:** Multiplication Successive par 2 : Multiplier une fraction par 2 décale les chiffres binaires d'un rang vers la gauche. Si le produit $r = num \times 2 \ge 1$, le bit suivant est `1` (et l'on soustrait 1 de $r$) ; sinon le bit suivant est `0`. Si la chaîne dépasse 32 caractères, renvoyez `"ERROR"` en temps $O(1)$ et espace $O(1)$.
> * **Réalité en Production:** Encodage IEEE 754 et arithmétique en virgule fixe dans les moteurs financiers.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.2), l'énoncé est :

*"Étant donné un nombre réel compris entre 0 et 1 (ex. 0.72) passé en double, affichez sa représentation binaire. Si le nombre ne peut pas être représenté avec au plus 32 caractères, affichez 'ERROR'."*

**Fondement Mathématique :**
Tout nombre $x \in (0, 1)$ s'écrit en binaire :
$$x = \sum_{i=1}^{\infty} b_i \cdot 2^{-i} = b_1 \cdot 2^{-1} + b_2 \cdot 2^{-2} + b_3 \cdot 2^{-3} + \dots$$
Multiplier par 2 donne $2x = b_1 + b_2 \cdot 2^{-1} + \dots$, où la partie entière est le bit $b_1$.

## 2. Mécanique Algorithmique

1. Vérifier que $0 < num < 1$.
2. Initialiser `StringBuilder binary = new StringBuilder(".")`.
3. Tant que `num > 0` :
   * Si `binary.length() >= 32`, renvoyer `"ERROR"`.
   * Calculer `r = num * 2`.
   * Si $r \ge 1$ : ajouter `'1'` et mettre à jour `num = r - 1`.
   * Sinon : ajouter `'0'` et mettre à jour `num = r`.
4. Renvoyer `binary.toString()`.

## Implémentation de Production

```java
public class BinaryToString {
    /**
     * Convertit un nombre reel en (0, 1) en representation binaire.
     * Complexite Temporelle: O(1) [au plus 32 iterations]
     * Complexite Spatiale: O(1)
     */
    public static String printBinary(double num) {
        if (num >= 1 || num <= 0) {
            return "ERROR";
        }

        StringBuilder binary = new StringBuilder();
        binary.append(".");

        while (num > 0) {
            if (binary.length() >= 32) {
                return "ERROR";
            }

            double r = num * 2;
            if (r >= 1) {
                binary.append(1);
                num = r - 1;
            } else {
                binary.append(0);
                num = r;
            }
        }

        return binary.toString();
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | La boucle exécute au maximum 32 itérations. |
| Espace Auxiliaire | `O(1)` | Tampon borné à 32 caractères. |

## Ingénierie des Systèmes en Production

### Architecture Système : Représentation en Virgule Flottante

1. **Fractions Périodiques en Binaire :** Les valeurs décimales comme $0.1_{10}$ sont infinies en base 2 ($0.000110011..._2$). Les calculs bancaires utilisent des entiers mis à l'échelle pour éviter ces erreurs d'arrondi.
2. **Shaders Graphiques (GPU) :** Normalisation des composantes de couleur de $[0, 255]$ vers $[0.0, 1.0]$.

## Cas Limites et Robustesse

1. **Puissances exactes de deux ($0.5 \to .1$, $0.75 \to .11$) :** Termine en quelques cycles.
2. **Nombres non représentables sur 32 bits ($0.1, 0.72$) :** Détectés et renvoient `"ERROR"`.
