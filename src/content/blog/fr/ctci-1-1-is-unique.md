---
title: "Is Unique: verifier qu'une chaine a tous ses caracteres distincts (Java)"
description: "Probleme style CTCI 1.1 pour debutants: decide si chaque caractere d'une chaine n'apparait qu'une fois. Analogie, force brute, tableau booleen, HashSet, tri et complexite."
date: "2025-09-11"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-1-is-unique.webp
previewImage: /assets/images/ctci-1-1-is-unique.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Probleme style CTCI 1.1 pour debutants: decide si chaque caractere d'une chaine n'apparait qu'une fois. Analogie, force brute, tableau booleen, HashSet, tri et complexite.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu contrôles la liste des invités à une petite soirée. Chaque personne ne peut entrer qu'une fois. Si quelqu'un a déjà signé, tu l'arrêtes. C'est toute l'idée de "is unique": parcourir les caractères et repérer la première répétition.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les échauffements classiques tableaux/chaînes en entretien, pas une copie d'un livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## 1. Analogie du quotidien

Imagine un rouleau d'autocollants. Chaque sticker porte une lettre. Tu les poses un par un sur la table.

* Si tu tires une lettre jamais vue, tu la poses et tu continues.
* Si tu tires une lettre déjà sur la table, le rouleau **n'est pas unique**.

Une chaîne n'est que ce rouleau. Ton travail: répondre oui (tout différent) ou non (au moins une lettre en double).

---

## 2. Énoncé en mots simples

**Entrée:** une chaîne `s` (par exemple `"abc"`, `"hello"` ou `""`).

**Sortie:** `true` si chaque caractère apparaît au plus une fois, sinon `false`.

**Exemples:**

| Entrée | Résultat | Pourquoi |
| --- | --- | --- |
| `"abc"` | `true` | a, b, c une seule fois chacun |
| `"hello"` | `false` | `l` apparaît deux fois |
| `"Aa"` | `true` si la casse compte (par défaut) | en Java `A` et `a` sont différents |
| `""` | `true` | vide = pas de doublon |
| `"a"` | `true` | un seul caractère |

**Clarifie avant de coder** (dis-le à voix haute en entretien):

* L'alphabet est ASCII (0 à 127), ASCII étendu (0 à 255) ou Unicode complet?
* La casse compte-t-elle? (`"AbA"` a deux `A` si on ignore la casse.)
* La chaîne peut-elle être vide ou null?
* Faut-il l'index du premier doublon, ou seulement oui/non?

Dans cet article on suppose: `String` Java non null, sensible à la casse, et on optimise souvent pour ASCII d'abord, parce que les entretiens aiment ce chemin.

---

## 3. Réfléchis d'abord (force brute, puis mieux)

### Force brute

Pour chaque indice `i`, parcours tous les caractères plus loin et demande si `s.charAt(j)` égale `s.charAt(i)`.

* Temps: de l'ordre de O(n²) comparaisons pour une longueur n.
* Espace: O(1) de mémoire en plus.
* Correct pour de toutes petites chaînes. Douloureux quand n grossit.

```java
boolean isUniqueBrute(String s) {
    int n = s.length();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (s.charAt(i) == s.charAt(j)) {
                return false;
            }
        }
    }
    return true;
}
```

### Meilleure idée: se souvenir de ce qu'on a déjà vu

Tu n'as pas besoin de rescanner toute la chaîne pour chaque caractère. Garde un **ensemble de caractères déjà vus**. Dès qu'un caractère y est déjà, réponds false. Un seul passage.

C'est le même geste mental que la table d'autocollants.

### Encore plus serré pour ASCII: drapeaux de taille fixe

S'il n'y a que 128 (ou 256) codes possibles, tu n'as pas besoin d'un ensemble qui grandit. Utilise un tableau booléen de cette taille. Indexe par le code du caractère. Même temps O(n), espace O(1) par rapport à l'alphabet (pas par rapport à n).

Raccourci utile: si la longueur dépasse la taille de l'alphabet, un doublon est **obligatoire** (principe des tiroirs). Renvoie false tout de suite.

---

## 4. Solutions Java

### (a) Tableau booléen (ASCII)

Réponse classique d'entretien quand on accepte "suppose ASCII".

```java
boolean isUniqueAscii(String s) {
    // Plus de caracteres que de codes? Doublon force.
    if (s.length() > 128) {
        return false;
    }

    boolean[] seen = new boolean[128];
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c >= 128) {
            // Hors de l'alphabet suppose; gerer ou refuser.
            throw new IllegalArgumentException("Non-ASCII char");
        }
        if (seen[c]) {
            return false; // ce code a deja ete utilise
        }
        seen[c] = true;
    }
    return true;
}
```

**Version bits** (même idée, moins de mémoire pour a-z seulement):

Si la chaîne n'a que des lettres anglaises minuscules (`a` à `z`), 26 drapeaux tiennent dans un `int` (32 bits). Le bit `k` veut dire "la lettre de code `a + k` est déjà apparue".

```java
boolean isUniqueLowercaseBits(String s) {
    if (s.length() > 26) {
        return false;
    }
    int mask = 0;
    for (int i = 0; i < s.length(); i++) {
        int bit = s.charAt(i) - 'a';
        if (bit < 0 || bit > 25) {
            throw new IllegalArgumentException("Expected a-z only");
        }
        int flag = 1 << bit;
        if ((mask & flag) != 0) {
            return false;
        }
        mask |= flag;
    }
    return true;
}
```

Les bits sont optionnels. Maîtrise d'abord le tableau booléen. N'utilise les bits que si l'alphabet est tout petit et qu'on parle d'espace.

### (b) HashSet (marche pour des caractères généraux)

```java
import java.util.HashSet;
import java.util.Set;

boolean isUniqueHashSet(String s) {
    Set<Character> seen = new HashSet<>();
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (!seen.add(c)) {
            // add renvoie false si la valeur etait deja presente
            return false;
        }
    }
    return true;
}
```

Gère l'Unicode sans tableau fixe de 128 cases. L'espace croît avec les caractères distincts (jusqu'à n). Clair, facile à expliquer, bon défaut en production quand l'alphabet n'est pas borné.

### (c) Trier puis regarder les voisins (optionnel)

Si tu peux réordonner une copie des caractères, trie-les. Tout doublon devient adjacent.

```java
import java.util.Arrays;

boolean isUniqueSort(String s) {
    char[] chars = s.toCharArray();
    Arrays.sort(chars);
    for (int i = 1; i < chars.length; i++) {
        if (chars[i] == chars[i - 1]) {
            return false;
        }
    }
    return true;
}
```

* Temps: O(n log n) à cause du tri.
* Espace: O(n) pour la copie `char[]` (`String` en Java est immuable).
* Utile quand les structures de hachage sont interdites mais le tri est autorisé.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Boucles imbriquées | O(n²) | O(1) | Pas de structure en plus |
| Tableau booléen (ASCII) | O(n) | O(1) alphabet | Suppose 128 ou 256 codes |
| Masque de bits (a-z) | O(n) | O(1) | Minuscules anglaises seulement |
| HashSet | O(n) en moyenne | O(k) | k = caractères distincts |
| Trier + balayer | O(n log n) | O(n) | Copier puis trier |

Préfère le **tableau booléen** quand l'alphabet est fixe et petit. Préfère le **HashSet** quand tu ne peux pas supposer ASCII. Préfère le **tri** seulement si le hachage est interdit.

---

## 6. Cas limites

Les interviewers aiment piquer ici:

* **Chaîne vide** → en général `true` (aucune paire égale).
* **Un seul caractère** → `true`.
* **Tous identiques** (`"aaaa"`) → `false`.
* **Longueur > taille de l'alphabet** → `false` immédiat pour un alphabet fixe.
* **Null** → décide: exception ou false. Ne plante pas en silence.
* **Espaces et ponctuation** → comptent comme caractères.
* **Unicode / surrogates** → `char` est UTF-16. Un emoji peut prendre deux unités `char`. Pour des code points stricts, parcours avec `codePoints()`.
* **Casse** → `"God"` vs `"god"`: différents si la casse compte.

Enveloppe minimale anti-null:

```java
boolean isUniqueSafe(String s) {
    if (s == null) {
        throw new IllegalArgumentException("string is null");
    }
    return isUniqueHashSet(s);
}
```

---

## 7. Récap à expliquer à un ami

"Is unique" demande: cette chaîne réutilise-t-elle un caractère?

1. La force brute compare chaque paire. Lente mais correcte.
2. Souviens-toi de ce que tu as vu: un ensemble (ou des drapeaux booléens pour un alphabet fixe).
3. À chaque caractère, s'il est déjà vu, renvoie false; sinon marque-le.
4. Si la chaîne est plus longue que l'alphabet, le doublon est inévitable.
5. Trier est le plan B quand tu peux copier, trier, puis regarder les voisins.

Si tu peux le dire en trente secondes et écrire la version HashSet ou tableau booléen sans te figer, tu maîtrises le problème 1.1.

Suite de la série: [Check Permutation](/blog/fr/ctci-1-2-check-permutation) (deux chaînes sont-elles des réarrangements l'une de l'autre?).