---
title: "CTCI 1.6 Compression de chaînes en Java: comptages et StringBuilder"
description: "Compresse les plages de lettres (aabcccccaaa vers a2b1c5a3) avec StringBuilder, puis renvoie l'original si la compression n'aide pas. Parcours Java avec cas limites."
date: "2025-11-13"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-6-string-compression.webp
previewImage: /assets/images/ctci-1-6-string-compression.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Compresse les plages de lettres (aabcccccaaa vers a2b1c5a3) avec StringBuilder, puis renvoie l'original si la compression n'aide pas. Parcours Java avec cas limites.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Imagine ta liste de bagages avec cinq chaussettes noires identiques. Tu n'écris pas "chaussette, chaussette, chaussette, chaussette, chaussette". Tu écris "chaussette x 5". C'est toute l'idée du problème: remplacer une suite du même caractère par ce caractère plus le nombre de fois qu'il se répète d'affilée.

C'est le problème **1.6** du style classique *Cracking the Coding Interview* (Arrays and Strings). Ce qui suit est un parcours pédagogique original en Java, pas un collage de texte de livre. Carte de la série: [guide CTCI](/blog/fr/ctci-series-guide).

---

## Le problème en mots simples

Implémente une compression basique de chaîne en utilisant les comptages de caractères **consécutifs** répétés.

| Élément | Signification |
| --- | --- |
| Entrée | Une chaîne composée uniquement de lettres majuscules et minuscules (`a`-`z`, `A`-`Z`) |
| Règle | Parcours de gauche à droite. Chaque plage maximale du même caractère devient ce caractère suivi de son compte |
| Exemple | `aabcccccaaa` devient `a2b1c5a3` |
| Condition | Si la forme compressée **n'est pas plus courte** que l'originale, renvoie la chaîne d'origine |

Les comptes s'écrivent en décimal. Une plage de douze `x` devient `x12` (caractère plus chiffres), pas douze `1` séparés.

"Consécutif" compte. `aba` fait trois plages de longueur 1: `a1b1a1`. C'est plus long que `aba`, donc tu renvoies `aba`.

---

## Comment réfléchir avant de coder

**Instinct brut:** parcourir la chaîne et construire une nouvelle chaîne en concaténant `"a" + "2" + "b" + ...` avec `+` sur `String`.

La forme est bonne, le coût non. En Java, chaque concaténation qui allonge le résultat recopie tout le préfixe. Avec beaucoup de plages courtes, tu paies un temps à peu près quadratique.

**Meilleure forme:**

1. Parcours la chaîne une fois avec un index `i`.
2. Tant que le caractère suivant est le même que l'actuel, augmente un compteur.
3. Ajoute le caractère et le compte à un **`StringBuilder`**.
4. Après le passage, compare les longueurs. Si le builder n'est pas plus court, renvoie l'original.

`StringBuilder` garde un buffer mutable. Les `append` sont amortis O(1) par caractère écrit, donc la construction est linéaire en taille de sortie (et le scan est linéaire en entrée).

Tu peux aussi pré-vérifier "est-ce que ça raccourcit vraiment ?" en comptant les plages et en estimant la longueur compressée. Ça évite d'allouer un builder quand la compression perd. En entretien, un seul passage vers un builder plus la comparaison finale est clair et souvent suffisant.

---

## Solution Java avec StringBuilder

```java
public final class StringCompression {

    private StringCompression() {}

    /**
     * Compress consecutive runs: aabcccccaaa -> a2b1c5a3.
     * Returns the original string when compression is not strictly shorter.
     */
    public static String compress(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }

        StringBuilder compressed = new StringBuilder();
        int n = s.length();
        int i = 0;

        while (i < n) {
            char c = s.charAt(i);
            int count = 0;
            // grow the run of c starting at i
            while (i < n && s.charAt(i) == c) {
                count++;
                i++;
            }
            compressed.append(c);
            compressed.append(count);
        }

        // only keep compression when it truly shrinks the string
        if (compressed.length() >= n) {
            return s;
        }
        return compressed.toString();
    }
}
```

Parcours de `aabcccccaaa`:

1. Plage de `a` longueur 2 → ajoute `a`, `2`
2. Plage de `b` longueur 1 → ajoute `b`, `1`
3. Plage de `c` longueur 5 → ajoute `c`, `5`
4. Plage de `a` longueur 3 → ajoute `a`, `3`
5. Résultat `a2b1c5a3` de longueur 8. Original de longueur 10. Renvoie le compressé.

`append(count)` marche parce que `StringBuilder` a une surcharge `append(int)`. Tu n'as pas besoin de `String.valueOf(count)` sauf pour la lisibilité.

---

## Optionnel: s'arrêter tôt si la compression ne peut pas gagner

Chaque plage devient au moins deux caractères (lettre + au moins un chiffre). Si chaque plage a longueur 1, la longueur compressée est `2 * n`. Early exit courant:

```java
// rough check: if there are too many short runs, skip building
private static int countCompressedLength(String s) {
    int length = 0;
    int i = 0;
    int n = s.length();
    while (i < n) {
        char c = s.charAt(i);
        int count = 0;
        while (i < n && s.charAt(i) == c) {
            count++;
            i++;
        }
        length += 1 + String.valueOf(count).length();
    }
    return length;
}
```

Appelle-le d'abord. Si `countCompressedLength(s) >= s.length()`, renvoie `s` sans second passage dans un builder. Deux passages linéaires battent encore la concaténation quadratique. En entretien, dis le compromis à voix haute: un passage en plus contre ne jamais allouer un gros builder que tu jetteras.

Au tableau, la version monocouche avec builder suffit le plus souvent.

---

## Complexité

| Métrique | Borne | Pourquoi |
| --- | --- | --- |
| Temps | O(n) | Un parcours de l'entrée; chaque index avance au plus une fois |
| Espace extra | O(n) | Le builder tient jusqu'à O(n) caractères au pire |
| Avec contrôle de longueur en amont | O(n) temps, O(1) extra si tu renvoies l'original sans construire | Second passage seulement quand la compression aide |

`n` est la longueur de l'entrée. Les chiffres des comptes sont courts (`log10(count) + 1` par plage), donc le big-O ne bouge pas pour des entrées d'entretien.

---

## Cas limites que les interviewers touchent

| Entrée | Attendu | Pourquoi |
| --- | --- | --- |
| `""` | `""` | Vide reste vide (fixe la politique null avec l'interviewer) |
| `"a"` | `"a"` | `a1` est plus long |
| `"aa"` | `"aa"` | La forme `a2` a la même longueur, on garde l'original |
| `"aaa"` | `"a3"` | Clairement plus court |
| `"aabbcc"` | `"aabbcc"` | Compressé `a2b2c2` longueur 6, pas plus court |
| `"AAAAA"` | `"A5"` | La casse est préservée; `A` et `a` sont différents |
| `"aAaA"` | `"aAaA"` | Casse alternée: quatre plages de 1 |

Sois explicite sur la comparaison: **strictement plus courte**. Même longueur veut dire renvoyer l'original. Ça colle à l'énoncé habituel.

Confirme aussi: les comptes ne concernent que les plages **consécutives**, pas la fréquence totale du caractère dans toute la chaîne. `aba` n'est pas `a2b1`.

---

## Erreurs fréquentes

1. **Utiliser `String` `+` dans une boucle.** Bonne réponse, mauvaise complexité. On te demandera le runtime.
2. **Oublier la dernière plage.** Si tu ne flushes que quand le caractère *suivant* change, il faut encore un flush après la boucle (ou structurer la boucle comme ci-dessus pour que le while interne consomme la plage finale).
3. **Comptes totaux au lieu de longueurs de plage.** Une map de fréquences résout un autre problème.
4. **Renvoyer le compressé quand les longueurs sont égales.** Le problème veut l'original s'il n'y a pas de raccourcissement.
5. **Mélanger `A` et `a`.** Ce sont des plages distinctes.

---

## Explique-le à un ami

Tu parcours la chaîne et tu regroupes les voisins identiques. Chaque groupe devient "lettre + combien". Tu colles les morceaux avec un `StringBuilder` pour ne pas reconstruire toute la chaîne à chaque append. À la fin tu mesures: si la nouvelle écriture n'est pas plus courte, tu la jettes et tu gardes la liste d'origine.

C'est de la compression style run-length pour des lettres, avec un contrôle honnête: la compression doit vraiment aider.

---

## Pratique suivante

Toujours au chapitre 1:

- Échauffement: sur papier, compte à voix haute les plages de `aaabbc`.
- Suite du plan: [Rotate Matrix](/blog/fr/ctci-1-7-rotate-matrix) (1.7).
- Accueil de la série: [guide CTCI en Java](/blog/fr/ctci-series-guide).

Demain, recode `compress` de mémoire sans regarder. Si tu peux dire en une phrase pourquoi `StringBuilder` compte, le problème est à toi.