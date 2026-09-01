---
title: "Entier en Toutes Lettres: Conversion Numérique par Blocs de Trois Chiffres (CTCI 16.8)"
description: "Convertissez tout entier 32 bits en sa représentation littérale en anglais grâce au découpage modulaire par blocs de 3 chiffres en temps constant O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-8-english-int.webp
previewImage: /assets/images/ctci-16-8-english-int.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un entier quelconque, écrivez une méthode retournant sa transcription intégrale en toutes lettres en anglais (par exemple, "One Thousand Two Hundred Thirty Four").
> * **La Solution Optimale:** **Décomposition Modulaire par Triplets de Chiffres** :
>   1. **Hiérarchie de Grandeurs** : Structurer le nombre en tranches de 3 chiffres : Unités ($10^0$), Milliers ($10^3$), Millions ($10^6$) et Milliards ($10^9$).
>   2. **Traduction d'un Bloc ($0..999$)** :
>      * Centaines : `digits[n / 100] + " Hundred"`.
>      * Dizaines et Unités : Consultation directe si reste $< 20$, sinon composition des dizaines et unités.
>   3. **Assemblage** : Concaténation ordonnée des segments non nuls.
>   4. S'exécute en **temps $O(1)$** et **espace $O(1)$**.
> * **Réalité en Production:** Édition de chèques bancaires et normalisation pour moteurs de synthèse vocale (TTS).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.8), l'énoncé est :

*"Convertissez un nombre entier (positif, negatif ou nul) en sa representation textuelle exacte en anglais."*

## 2. Décomposition par Blocs de Trois Chiffres

La division successive par 1 000 isole chaque palier de grandeur pour le formater de manière modulaire.

## Implémentation de Production

```java
import java.util.LinkedList;

public class EnglishIntConverter {

    private static final String[] SMALLS = {
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private static final String[] BIGS = {
        "", "Thousand", "Million", "Billion"
    };

    public static String convertToWords(int num) {
        if (num == 0) return "Zero";
        if (num == Integer.MIN_VALUE) {
            return "Negative Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Eight";
        }
        if (num < 0) return "Negative " + convertToWords(-num);

        LinkedList<String> parts = new LinkedList<>();
        int chunkCount = 0;

        while (num > 0) {
            int chunk = num % 1000;
            if (chunk != 0) {
                String chunkStr = convertChunk(chunk);
                if (!BIGS[chunkCount].isEmpty()) {
                    chunkStr += " " + BIGS[chunkCount];
                }
                parts.addFirst(chunkStr);
            }
            num /= 1000;
            chunkCount++;
        }

        return String.join(" ", parts).trim();
    }

    private static String convertChunk(int number) {
        StringBuilder sb = new StringBuilder();

        if (number >= 100) {
            sb.append(SMALLS[number / 100]).append(" Hundred");
            number %= 100;
            if (number > 0) sb.append(" ");
        }

        if (number >= 20) {
            sb.append(TENS[number / 10]);
            number %= 10;
            if (number > 0) sb.append(" ");
        }

        if (number > 0 && number < 20) {
            sb.append(SMALLS[number]);
        }

        return sb.toString();
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Traitement d'au plus 4 blocs pour des entiers 32 bits. |
| Espace Mémoire | `O(1)` | Empreinte constante. |

## Ingénierie des Systèmes en Production

### Architecture Système : Synthèse Vocale (TTS)

1. **Normalisation de Texte :** Les assistants vocaux convertissent les symboles monétaires et nombres en représentations phonétiques avant synthèse sonore.
2. **Gestion Linguistique :** Règles grammaticales adaptées selon les langues cibles.

## Cas Limites et Robustesse

1. **`Integer.MIN_VALUE` :** Cas particulier traité explicitement pour éviter un dépassement lors de la négation de $-2^{31}$.
2. **Zéros Intermédiaires :** Des nombres comme `1 000 005` sont traduits proprement sans espaces résiduels.
