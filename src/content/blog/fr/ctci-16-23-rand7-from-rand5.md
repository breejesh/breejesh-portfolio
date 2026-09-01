---
title: "Rand7 à Partir de Rand5: Échantillonnage par Rejet et Uniformité (CTCI 16.23)"
description: "Générez un entier aléatoire strictement uniforme dans [0, 6] à partir d'un générateur dans [0, 4] via une grille 2D en base 5 et l'échantillonnage par rejet en O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
previewImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un générateur aléatoire `rand5()` retournant un entier uniforme entre $0$ et $4$, implémentez `rand7()` générant un entier uniforme entre $0$ et $6$.
> * **La Solution Optimale:** **Grille 2D en Base 5 et Échantillonnage par Rejet** :
>   1. **Expansion** : Deux appels à `rand5()` couvrent $5 \times 5 = 25$ issues équiprobables :
>      $$\text{num} = 5 \times \text{rand5}() + \text{rand5}() \in [0, 24]$$
>   2. **Troncature Symétrique** : Le plus grand multiple de 7 inférieur à 25 est $21 = 3 \times 7$.
>   3. **Condition de Rejet** : Si $\text{num} < 21$, renvoyer $\text{num} \pmod 7$ ($\Pr = 3/21 = 1/7$).
>   4. Si $\text{num} \ge 21$, rejeter et recommencer.
>   5. S'exécute en **temps moyen $O(1)$** ($\approx 1,19$ itération) et **espace $O(1)$**.
> * **Réalité en Production:** Génération de nonces cryptographiques TLS et simulations de Monte Carlo.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.23), l'énoncé est :

*"Produisez une variable aleatoire uniforme sur l'intervalle [0, 6] en exploitant exclusivement des tirages de rand5()."*

## 2. Grille Cartésienne d'Événements

Le produit cartésien $5 \times 5$ assure que chaque cellule possède une probabilité rigoureusement identique de $1/25$.

## Implémentation de Production

```java
import java.util.Random;

public class Rand7FromRand5 {

    private static final Random RNG = new Random();

    public static int rand5() {
        return RNG.nextInt(5);
    }

    public static int rand7() {
        while (true) {
            int num = 5 * rand5() + rand5();
            if (num < 21) {
                return num % 7;
            }
        }
    }
}
```

## Analyse de Complexité

| Métrique | Valeur | Détail Technique |
|---|---|---|
| Probabilité d'Acceptation | $p = 21 / 25 = 84{,}0\%$ | Taux d'acceptation immédiat très élevé. |
| Itérations Espérées | $E = 25 / 21 \approx 1{,}19$ | Convergence en temps quasi instantané. |
| Complexité Temporelle | `O(1) Espéré` | Variable aléatoire géométrique. |
| Biais Statistique | `0,00%` | Probabilité exacte de $1/7$ par classe. |

## Ingénierie des Systèmes en Production

### Architecture Système : Dépolarisation d'Entropie Matérielle

1. **Algorithme de von Neumann :** Traitement des générateurs matériels de bruit thermique dans les processeurs de sécurité (TPM / HSM) pour éliminer les biais asymétriques.
2. **Méthode de Monte Carlo :** Échantillonnage dans des espaces probabilistes non triviaux.

## Cas Limites et Robustesse

1. **Erreur Fréquente `(rand5() + rand5()) % 7` :** La somme directe induit une distribution triangulaire asymétrique. La combinaison cartésienne $5 \times \text{rand5}()$ préserve l'équiprobabilité.
