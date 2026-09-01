---
title: "Master Mind: Évaluation des Coups en Deux Passes et Histogrammes (CTCI 16.15)"
description: "Calculez le nombre de coups parfaits (Hits) et de correspondances partielles (Pseudo-Hits) au Master Mind via des histogrammes de fréquences en O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-15-master-mind.webp
previewImage: /assets/images/ctci-16-15-master-mind.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Au Master Mind, la combinaison secrète compte 4 billes de couleurs : Rouge (`R`), Jaune (`Y`), Vert (`G`) et Bleu (`B`). Un "Hit" correspond à une couleur bien placée. Un "Pseudo-Hit" correspond à une couleur présente mais mal placée. Calculez le score exact pour toute proposition.
> * **La Solution Optimale:** **Histogramme de Fréquences en Deux Passes** :
>   1. **Passe 1 (Hits)** : Parcourir les 4 emplacements. Si `guess[i] == solution[i]`, incrémenter `hits++`. Sinon, incrémenter les compteurs de fréquences résiduelles.
>   2. **Passe 2 (Pseudo-Hits)** : Pour chaque couleur $c$, additionner $\min(\text{frequenceSolution}[c], \text{frequenceProposition}[c])$.
>   3. S'exécute en **temps $O(1)$** et **espace $O(1)$**.
> * **Réalité en Production:** Moteurs de jeux littéraires (Wordle / Motus) et comparaison de séquences génétiques.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.15), l'énoncé est :

*"Evaluez les concordances exactes et partielles d'une proposition au Master Mind sans double comptabilisation."*

## 2. Découplage en Deux Passes

L'évaluation préalable des coïncidences parfaites neutralise les cases résolues pour éviter qu'elles ne faussent le décompte des couleurs mal placées.

## Implémentation de Production

```java
public class MasterMind {

    public static class Result {
        public final int hits;
        public final int pseudoHits;

        public Result(int hits, int pseudoHits) {
            this.hits = hits;
            this.pseudoHits = pseudoHits;
        }
    }

    private static int code(char c) {
        switch (c) {
            case 'R': case 'r': return 0;
            case 'G': case 'g': return 1;
            case 'B': case 'b': return 2;
            case 'Y': case 'y': return 3;
            default: return -1;
        }
    }

    public static Result estimate(String guess, String solution) {
        if (guess == null || solution == null || guess.length() != solution.length()) {
            return new Result(0, 0);
        }

        int hits = 0;
        int[] solFreq = new int[4];
        int[] guessFreq = new int[4];

        for (int i = 0; i < guess.length(); i++) {
            char g = guess.charAt(i);
            char s = solution.charAt(i);

            if (g == s) {
                hits++;
            } else {
                int cg = code(g);
                int cs = code(s);
                if (cg >= 0) guessFreq[cg]++;
                if (cs >= 0) solFreq[cs]++;
            }
        }

        int pseudoHits = 0;
        for (int c = 0; c < 4; c++) {
            pseudoHits += Math.min(guessFreq[c], solFreq[c]);
        }

        return new Result(hits, pseudoHits);
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Parcours fixe de 4 cases. |
| Espace Mémoire | `O(1)` | Tableaux de fréquences à 4 éléments. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs de Wordle / Motus

1. **Validation des Lettres :** Wordle valide d'abord les lettres vertes (bien placées) avant d'attribuer les lettres jaunes (mal positionnées) selon cet algorithme strict d'intersection.
2. **Alignement Bioinformatique :** Calcul de distances sur des chaînes de nucléotides.

## Cas Limites et Robustesse

1. **Couleurs Répétées :** Si la solution est `"RGBY"` et la tentative `"RRRR"`, le score est rigoureusement `1 Hit, 0 Pseudo-Hit`.
