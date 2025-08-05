---
title: "CTCI 1.5 One Away: une édition, un passage en Java"
description: "Vérifier si deux chaînes diffèrent d'au plus une insertion, suppression ou substitution. Règle des longueurs, un seul parcours à deux index, et du Java clair à expliquer à voix haute."
date: "2025-08-05"
tags: [Algorithmes]
coverImage: /assets/images/ctci-1-5-one-away.webp
previewImage: /assets/images/ctci-1-5-one-away.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Vérifier si deux chaînes diffèrent d'au plus une insertion, suppression ou substitution. Règle des longueurs, un seul parcours à deux index, et du Java clair à expliquer à voix haute.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu saisis un mot de passe, tu te trompes d'un seul caractère, et le système ouvre quand même. Ce n'est pas de la magie. Quelqu'un a décidé qu'**une petite édition** est assez proche, et que deux ne le sont pas.

Voilà tout le problème: étant donné deux chaînes, décider si tu peux transformer la première en la seconde avec **au plus une** de ces opérations:

1. **Replace** d'un caractère (`pale` → `bale`)
2. **Insert** d'un caractère (`ple` → `pale`)
3. **Remove** d'un caractère (`pale` → `ple`)

Zéro édition (les chaînes sont égales) compte aussi comme true. Deux éditions ou plus, false.

C'est le problème style CTCI **1.5, One Away**, chapitre 1 (Arrays and Strings). On le résout en **un seul passage** sur la chaîne la plus courte, en Java simple.

Accueil de la série: [CTCI en Java](/blog/en/ctci-series-guide). Précédent: [1.4 Palindrome Permutation](/blog/en/ctci-1-4-palindrome-permutation). Suivant: [1.6 String Compression](/blog/en/ctci-1-6-string-compression).

---

## Image du quotidien

Pense à deux listes de courses presque identiques sur papier.

* Tu as rayé un article: remove.
* Tu as ajouté un article en trop: insert.
* Tu as corrigé une faute d'orthographe: replace.

Si les listes coïncident déjà, tu as eu besoin de zéro édition. Si tu as touché deux endroits, tu n'es pas "à une édition près." Pas besoin de structure exotique. Tu parcours les deux avec un doigt sur chacune, et tu autorises **un** écart expliqué par une seule édition.

---

## Le problème en mots simples

**Entrée:** deux chaînes, `a` et `b` (ASCII suffit pour les exemples d'entretien).

**Sortie:** `true` si `a` peut devenir `b` avec 0 ou 1 édition de type insert, remove ou replace. Sinon `false`.

**Exemples:**

| a | b | Résultat | Pourquoi |
| --- | --- | --- | --- |
| `pale` | `ple` | true | retirer `a` |
| `pales` | `pale` | true | retirer `s` (ou insérer dans la plus courte) |
| `pale` | `bale` | true | remplacer `p` par `b` |
| `pale` | `bake` | false | deux replaces |
| `pale` | `pale` | true | zéro édition |
| `a` | `` | true | un remove |
| `abc` | `abxcd` | false | l'écart de longueur vaut 2 |

Questions de clarification utiles à poser à voix haute:

* Chaînes vides autorisées? Oui, traite-les normalement.
* Sensible à la casse? Oui, sauf si l'intervieweur dit le contraire. `'A'` et `'a'` diffèrent.
* Zéro édition = true? Oui. "One away" signifie en pratique **au plus une**.

---

## Comment réfléchir avant de coder

### Étape 1: la longueur élimine la plupart des cas

Si les longueurs diffèrent de plus de 1, il faut au moins deux inserts (ou removes). Retourne false tout de suite.

```
|len(a) - len(b)| > 1  →  false
```

C'est gratuit, et les intervieweurs aiment l'entendre en premier.

### Étape 2: même longueur implique seulement replace

Si les longueurs sont égales, insert et remove ne peuvent pas aider avec une seule édition (ils changent la longueur). Parcours les deux chaînes ensemble. Compte les écarts. Au second écart, false. À la fin, zéro ou un écart suffit.

### Étape 3: différence de longueur 1 implique insert ou remove

Sans perte de généralité, appelle `s` la plus courte et `t` la plus longue. Un insert dans `s` est la même chose qu'un remove dans `t`.

Avance avec deux index `i` (dans `s`) et `j` (dans `t`):

* Si `s[i] == t[j]`, avance les deux.
* S'ils diffèrent, ce doit être ta **seule** édition. N'avance que `j` (tu "sautes" le caractère en trop de la longue). Si tu as déjà utilisé l'édition, false.

Quand la boucle se termine, soit elles ont coincidé avec zéro édition, soit tu as sauté exactement un caractère en trop. Dans les deux cas tu renvoies true (la queue restante de la longue fait au plus un caractère, et la longueur le garantit déjà).

### Étape 4: une méthode, un passage

Tu n'as pas besoin de trois fonctions séparées en entretien. Un seul parcours couvre replace et insert/remove si tu branches seulement quand les caractères divergent.

---

## Java: solution en un passage

```java
public final class OneAway {

    /**
     * Returns true if first and second are at most one edit apart
     * (insert, remove, or replace a single character).
     */
    public static boolean oneEditAway(String first, String second) {
        if (first == null || second == null) {
            return first == second;
        }

        int len1 = first.length();
        int len2 = second.length();
        if (Math.abs(len1 - len2) > 1) {
            return false;
        }

        // s = shorter (or equal), t = longer (or equal)
        String s = len1 <= len2 ? first : second;
        String t = len1 <= len2 ? second : first;

        int i = 0; // index in s
        int j = 0; // index in t
        boolean foundEdit = false;

        while (i < s.length() && j < t.length()) {
            if (s.charAt(i) == t.charAt(j)) {
                i++;
                j++;
                continue;
            }

            // Characters differ: this must be our only edit
            if (foundEdit) {
                return false;
            }
            foundEdit = true;

            if (s.length() == t.length()) {
                // Same length: treat as replace, move both
                i++;
                j++;
            } else {
                // Different length: skip the extra char in the longer string
                j++;
            }
        }

        // If longer has one leftover char and we never edited, that leftover is the insert.
        // Length check already limits leftovers to at most one.
        return true;
    }
}
```

### Trace: `pale` vs `ple` (remove / insert)

* `s = "ple"`, `t = "pale"`
* `p == p` → avancer les deux
* `l != a` → première édition, sauter `a` dans `t` (`j++` seulement)
* `l == l`, `e == e` → terminé, true

### Trace: `pale` vs `bale` (replace)

* longueurs égales
* `p != b` → première édition, avancer les deux
* le reste correspond → true

### Trace: `pale` vs `bake` (deux replaces)

* `p != b` → première édition
* `a == a`
* `l != k` → deuxième édition → false

---

## Temps et espace

| | |
| --- | --- |
| **Temps** | O(n) où n est la longueur de la chaîne la plus courte (un passage, travail constant par caractère) |
| **Espace** | O(1) en plus (quelques index et un flag; aucune nouvelle chaîne construite) |

Pas besoin d'une map de comptes de caractères. L'ordre compte ici (`abc` vs `cba` n'est pas à une édition), donc une table de fréquences mentirait.

---

## Cas limites que les intervieweurs touchent

1. **Chaînes égales:** `oneEditAway("same", "same")` → true.
2. **Vide et un caractère:** `("", "x")` → true; `("", "xy")` → false.
3. **Édition au début:** `("abc", "xabc")` → true (insert en tête).
4. **Édition à la fin:** `("abc", "abcd")` → true.
5. **Édition au milieu:** `("abc", "axc")` → true.
6. **Politique null:** décide et dis-le. Le code ci-dessus traite deux null comme égaux et un null mélangé comme false. Certaines équipes interdisent purement les null.
7. **Unicode / surrogates:** en entretien, souvent des caractères BMP. `charAt` convient. Les graphemes du monde réel sont un autre problème produit.

Petit apply de vérif:

```java
public static void main(String[] args) {
    assert oneEditAway("pale", "ple");
    assert oneEditAway("pales", "pale");
    assert oneEditAway("pale", "bale");
    assert !oneEditAway("pale", "bake");
    assert oneEditAway("pale", "pale");
    assert oneEditAway("", "a");
    assert !oneEditAway("abc", "abxcd");
    System.out.println("ok");
}
```

---

## Erreurs fréquentes

* **Oublier le raccourci de longueur.** Sans lui tu peux encore être correct, mais tu perds du travail et une sortie anticipée facile.
* **Bouger le mauvais index sur insert.** Après un écart avec longueurs différentes, seule la chaîne plus longue avance.
* **Autoriser deux replaces.** Le flag `foundEdit` est tout le point. Ne le réinitialise pas; un second écart = échec.
* **Traiter la distance d'anagramme comme distance d'édition.** One Away **n'est pas** "le même multiensemble de caractères." L'ordre est fixe sauf pour l'édition unique.
* **Monter un DP de Levenshtein complet.** La distance d'édition classique est O(n·m). Pour *au plus une* édition, c'est excessif. On attend le parcours linéaire.

---

## Explique-le à un ami

Deux chaînes sont à une édition si tu peux corriger la différence avec un seul replace, insert ou delete (ou si elles coïncident déjà).

D'abord les longueurs. Écart plus grand que un? Terminé, false.

Ensuite parcours les deux. Quand les caractères collent, continue. Au premier désaccord, dépense ton unique édition autorisée: si les longueurs sont égales, traite-le comme un replace et avance les deux doigts; si elles diffèrent, saute le caractère en trop du côté long. Un second désaccord, false.

C'est un passage, mémoire extra constante, et ça se raconte bien au tableau.

---

## Repère d'entraînement

Cache le code. Écris `oneEditAway` uniquement avec la règle des longueurs et les deux règles d'index. Puis déroule le tableau d'exemples à voix haute. Quand c'est automatique, ouvre [1.6 String Compression](/blog/en/ctci-1-6-string-compression).