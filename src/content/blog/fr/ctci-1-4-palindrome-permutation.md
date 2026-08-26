---
title: "CTCI 1.4 Permutation palindrome en Java: compter les impairs, pas les réarrangements"
description: "Vérifier si un réarrangement d'une chaîne peut être un palindrome. Comptes de fréquence, au plus un caractère impair, règles optionnelles d'espaces et de casse, et Java clair."
date: "2025-12-10"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-4-palindrome-permutation.webp
previewImage: /assets/images/ctci-1-4-palindrome-permutation.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Vérifier si un réarrangement d'une chaîne peut être un palindrome. Comptes de fréquence, au plus un caractère impair, règles optionnelles d'espaces et de casse, et Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un **palindrome** se lit pareil de gauche à droite et de droite à gauche: `kayak`, `level`, `a man a plan a canal panama` si vous ignorez les espaces. Une **permutation** est tout mélange du même multiensemble de caractères. Ce problème pose une question plus calme: *un mélange de cette chaîne peut-il être un palindrome?* Vous n'avez pas besoin de construire ce mélange. Vous devez seulement savoir s'il est possible.

C'est le problème **1.4** du style *Cracking the Coding Interview* (tableaux et chaînes). L'article est un enseignement original, pas un collage d'une solution de livre.

---

## Image du quotidien

Imaginez des tuiles de lettres sur une table. Vous voulez les aligner en un mot qui se ressemble depuis les deux bouts.

Les paires prennent des sièges assortis: un `a` à gauche a besoin d'un autre `a` à droite, et ainsi de suite. Si une lettre apparaît un nombre impair de fois, une tuile reste. Ce reste peut s'asseoir au **milieu** de la ligne. Si deux lettres différentes laissent chacune un reste, il faudrait deux milieux. Une seule ligne n'a qu'un siège central.

La règle est donc franche:

* Tous les comptes de caractères sont pairs, **ou**
* Exactement un caractère a un compte impair (et le reste est pair).

C'est tout l'algorithme, une fois que vous vous accordez sur ce qu'il faut compter (lettres seulement? casse? espaces?).

---

## Problème en mots simples

**Entrée:** une chaîne `s`.

**Sortie:** `true` s'il existe un réarrangement des caractères de `s` qui forme un palindrome; sinon `false`.

**Clarifications à demander en entretien**

| Question | Choix pédagogique typique |
| --- | --- |
| Espaces? | Souvent ignorés (phrases comme `Tact Coa` → `tacocat`) |
| Casse? | Souvent insensible à la casse (`T` et `t` sont la même lettre) |
| Chaîne vide? | En général `true` (vide est un palindrome) |
| Lettres ASCII seulement? | Confirmez; une map générale marche pour tout jeu de caractères |

Exemple classique: `"Tact Coa"` peut se réarranger en `"taco cat"` (en ignorant espaces et casse), donc la réponse est `true`.

On ne vous demande **pas** de renvoyer la chaîne palindrome. Seulement oui ou non.

---

## Comment réfléchir avant de coder

### Force brute (ne livrez pas ça)

Générez chaque permutation et testez `isPalindrome`. C'est du temps factoriel. Les interviewers veulent que vous le citiez une fois, puis que vous le laissiez tomber.

### Meilleure idée: la règle du siège du milieu

1. Comptez les occurrences de chaque caractère.
2. Comptez combien de caractères ont une fréquence **impaire**.
3. Acceptez si ce compte impair vaut `0` ou `1`.

Pourquoi cela suffit:

* Palindrome de longueur paire: chaque paire colle; zéro impair.
* Palindrome de longueur impaire: un caractère au centre; exactement un impair.

Vous ne construisez jamais la chaîne. Vous regardez seulement les comptes.

### Variante optionnelle avec vecteur de bits (alphabet petit)

Si seules les lettres anglaises minuscules comptent, vous pouvez basculer des bits dans un `int` (26 bits tiennent). Un caractère de compte pair finit avec le bit 0; impair avec le bit 1. À la fin, l'ensemble de bits doit avoir au plus un bit à 1 (`x & (x - 1) == 0`). Pratique en entretien quand l'alphabet est fixe. La version map ci-dessous est plus claire et générale.

---

## Solution Java: compter les impairs

Cette version met les lettres en minuscules, ignore le non-lettre, et utilise un `HashMap`. Ajustez le filtre si l'interviewer veut chaque caractère, y compris les espaces.

```java
import java.util.HashMap;
import java.util.Map;

public class PalindromePermutation {

    /**
     * Returns true if some permutation of the letters in s is a palindrome.
     * Spaces and punctuation are ignored. Case is ignored.
     */
    public static boolean isPalindromePermutation(String s) {
        if (s == null) {
            return false;
        }

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (!Character.isLetter(c)) {
                continue;
            }
            c = Character.toLowerCase(c);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        int oddCount = 0;
        for (int freq : counts.values()) {
            if (freq % 2 != 0) {
                oddCount++;
                if (oddCount > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindromePermutation("Tact Coa")); // true  (taco cat)
        System.out.println(isPalindromePermutation("hello"));    // false
        System.out.println(isPalindromePermutation("aab"));      // true  (aba)
        System.out.println(isPalindromePermutation(""));         // true
        System.out.println(isPalindromePermutation("Aa"));       // true  (aa / Aa)
    }
}
```

### Parcours: `"Tact Coa"`

Lettres après ignore et minuscules: `t a c t c o a`

| Lettre | Compte |
| --- | --- |
| a | 2 |
| c | 2 |
| o | 1 |
| t | 2 |

Fréquences impaires: seulement `o`. Un siège du milieu convient. Retourne `true`.

### Parcours: `"hello"`

`h:1 e:1 l:2 o:1` → trois impairs. Impossible. Retourne `false`.

### Alphabet fixe avec masque de bits

Même idée, sans `HashMap`, pour `a`-`z` après normalisation:

```java
public static boolean isPalindromePermutationBits(String s) {
    if (s == null) {
        return false;
    }
    int bitVector = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (!Character.isLetter(c)) {
            continue;
        }
        int idx = Character.toLowerCase(c) - 'a';
        if (idx < 0 || idx >= 26) {
            continue; // non a-z after lowercasing
        }
        bitVector ^= (1 << idx); // flip: even -> odd, odd -> even
    }
    // zero or one bit set
    return bitVector == 0 || (bitVector & (bitVector - 1)) == 0;
}
```

`x & (x - 1)` efface le bit à 1 le plus bas. Si le résultat est zéro, `x` avait zéro ou un bit à 1.

---

## Temps et espace

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Compte avec map | O(n) | O(k) chars distincts | Réponse par défaut claire |
| Compte avec `int[26]` | O(n) | O(1) | Alphabet lettres latines fixe |
| Vecteur de bits | O(n) | O(1) | Même alphabet fixe; astucieux mais facile à rater |
| Toutes les permutations | O(n · n!) | O(n) récursion | Mentionnez, puis jetez |

Un passage pour compter plus un court passage sur les clés (ou un compteur impair en cours) suffit. Vous pouvez suivre `oddCount` en mettant à jour la map si vous préférez une seule boucle structurelle.

---

## Cas limites que les interviewers piquent

* **Null:** définissez le comportement (`false` ou exception). Dites-le à voix haute.
* **Vide / seulement espaces:** après filtrage, zéro impair → `true`.
* **Un seul caractère:** un impair → `true`.
* **Tous les comptes pairs:** `true` (palindrome de longueur paire).
* **Deux impairs:** `false`.
* **Unicode / accents:** `Character.isLetter` et `toLowerCase` sont subtils avec les locales. En entretien, assumez ASCII sauf demande d'Unicode complet.
* **Il faut inclure les espaces dans le palindrome:** alors **ne** sautez **pas** les espaces; un espace est un autre caractère qui doit jouer un rôle pair ou un seul impair.
* **Sensible à la casse:** enlevez `toLowerCase` si l'énoncé le dit.

Reformulez toujours les règles avant de coder. La moitié des bugs sur ce problème viennent d'hypothèses décalées, pas de la maths.

---

## Erreurs courantes

1. **Construire un palindrome** au lieu de vérifier la possibilité. Perte de temps.
2. **Oublier** que zéro impair est valide (longueur paire).
3. **Compter les espaces** quand l'exemple les ignore clairement (ou l'inverse).
4. **Décalage de casse:** compter `T` et `t` à part quand le problème les traite comme une seule lettre.
5. **Astuces de bits sans alphabet fixe.** Une map est plus sûre tant que l'alphabet n'est pas borné.

---

## Idées voisines

* Vérifier si une **chaîne elle-même** est un palindrome, ce sont deux pointeurs. C'est un autre problème (CTCI a aussi un palindrome de liste chaînée plus loin).
* **Anagramme / permutation d'une autre chaîne** (style problème 1.2) compare deux maps de fréquence complètes. Ici, seule la parité d'une map compte.
* **Le plus long palindrome constructible** à partir d'un multiensemble est un cousin: utilisez tous les comptes pairs, plus au plus un reste impair pour le milieu.

---

## Explique à un ami

On te donne des tuiles de lettres. Peux-tu les aligner pour que le mot se mire?

Les sièges assortis demandent des paires. Une seule lettre a le droit d'avoir une tuile restante pour le centre. Compte chaque lettre. Si plus d'une lettre a un compte impair, dis non. Sinon dis oui.

En Java: parcours la chaîne, compte les lettres (souvent en minuscules, espaces ignorés), puis vérifie qu'au plus une fréquence est impaire. C'est du O(n) et tu ne génères jamais de permutations.

Suite de la série: [One Away](/blog/en/ctci-1-5-one-away). Carte de la série: [CTCI in Java](/blog/en/ctci-series-guide).