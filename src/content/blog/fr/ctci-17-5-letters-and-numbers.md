---
title: "Lettres et Chiffres: Plus Long Sous-Tableau Équilibré par Sommes Préfixes (CTCI 17.5)"
description: "Trouvez le plus long sous-tableau contigu contenant autant de lettres que de chiffres grâce au mappage des deltas cumulés en temps linéaire O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un tableau composé de lettres et de chiffres, trouvez le plus long sous-tableau contigu comportant un nombre égal de lettres et de chiffres.
> * **La Solution Optimale:** **Somme Différentielle Préfixe et Table de Première Apparition** :
>   1. Mapper les lettres vers $+1$ et les chiffres vers $-1$.
>   2. **Invariable d'Équilibre** : Calculer le delta cumulé $D[i]$. Si $D[i] == D[j]$ avec $i < j$, la tranche intermédiaire $[i+1 \dots j]$ possède une somme nette nulle (équilibre parfait).
>   3. Enregistrer le premier indice associé à chaque valeur de delta dans une structure `Map<Integer, Integer>` (avec la sentinelle $(0, -1)$).
>   4. S'exécute en **temps $O(N)$** et **espace $O(N)$**.
> * **Réalité en Production:** Calcul de taux de passage par zéro dans le traitement du signal audio et détection d'origines de réplication en génomique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.5), l'énoncé est :

*"Identifiez la sequence continue maximale presentant une parite stricte entre caracteres alphabetiques et numeriques."*

## 2. Détection par Delta Préfixe

L'égalité de deux valeurs préfixes indique que la portion intermédiaire contient un nombre strictement équivalent d'incréments et de décréments.

## Implémentation de Production

```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class LettersAndNumbers {

    public static char[] findLongestSubarray(char[] array) {
        if (array == null || array.length < 2) {
            return new char[0];
        }

        Map<Integer, Integer> firstSeen = new HashMap<>();
        firstSeen.put(0, -1);

        int runningDelta = 0;
        int maxLen = 0;
        int bestStart = -1;

        for (int i = 0; i < array.length; i++) {
            if (Character.isLetter(array[i])) {
                runningDelta += 1;
            } else if (Character.isDigit(array[i])) {
                runningDelta -= 1;
            }

            if (firstSeen.containsKey(runningDelta)) {
                int prevIndex = firstSeen.get(runningDelta);
                int length = i - prevIndex;
                if (length > maxLen) {
                    maxLen = length;
                    bestStart = prevIndex + 1;
                }
            } else {
                firstSeen.put(runningDelta, i);
            }
        }

        if (maxLen == 0) return new char[0];

        return Arrays.copyOfRange(array, bestStart, bestStart + maxLen);
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Une seule passe séquentielle sur le tableau. |
| Espace Mémoire | `O(N)` | Table de hachage contenant au plus $2N+1$ deltas. |

## Ingénierie des Systèmes en Production

### Architecture Système : Bioinformatique et Marchés Financiers

1. **Courbes GC-Skew :** Repérage des origines de réplication sur des chromosomes bactériens via le cumul des deltas de bases azotées.
2. **Équilibre des Flux d'Ordres :** Quantification en temps réel des pressions acheteuses et vendeuses.

## Cas Limites et Robustesse

1. **Aucun Sous-tableau Équilibré :** Renvoie un tableau vide.
2. **Tableau Entièrement Équilibré :** Traité immédiatement via la sentinelle `(0, -1)`.
