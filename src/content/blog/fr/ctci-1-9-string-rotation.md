---
title: "CTCI 1.9 Rotation de chaînes: un seul appel à isSubstring"
description: "Vérifier si s2 est une rotation de s1 avec un seul appel à isSubstring: concaténer s1 avec elle-même et demander si s2 s'y trouve. Parcours Java pour débutants."
date: "2026-05-13"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-9-string-rotation.webp
previewImage: /assets/images/ctci-1-9-string-rotation.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Vérifier si s2 est une rotation de s1 avec un seul appel à isSubstring: concaténer s1 avec elle-même et demander si s2 s'y trouve. Parcours Java pour débutants.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un collier circulaire de perles-lettres. Tu l'ouvres entre deux perles, tu tournes la boucle pour qu'une autre perle soit devant, puis tu le refermes. Les perles sont les mêmes, dans le même ordre cyclique. Seul le point de départ a bougé. C'est une **rotation de chaîne**.

Ce billet est le problème **1.9** de la [série CTCI en Java](/blog/fr/ctci-series-guide): étant données deux chaînes, décider si l'une est une rotation de l'autre, en n'appelant `isSubstring` qu'**une** fois.

---

## Le problème en mots simples

Tu reçois deux chaînes, `s1` et `s2`.

- Une **rotation** de `s1` signifie: choisir un index `i`, prendre le suffixe `s1[i..]`, puis coller le préfixe `s1[0..i)` derrière. Exemple: `waterbottle` tournée après `wat` devient `erbottlewat`.
- On te donne un helper `isSubstring(big, small)` qui renvoie true lorsque `small` apparaît quelque part dans `big`.
- Écris `isRotation(s1, s2)` qui ne renvoie true que lorsque `s2` est une rotation de `s1`.
- **Contrainte que l'entretien surveille:** appeler `isSubstring` au plus **une** fois.

Les caractères sont sensibles à la casse. `"Abc"` n'est pas une rotation de `"bca"`.

---

## Comment réfléchir avant de coder

### Force brute (ne la présente pas comme la réponse finale)

Pour chaque coupe `i` de `0` à `n-1`, construis `s1.substring(i) + s1.substring(0, i)` et compare à `s2`. Cela fait O(n) candidats, chaque comparaison O(n), donc O(n²) et beaucoup de chaînes temporaires. Et cela n'utilise pas la règle d'un seul appel.

### L'idée qui débloque la limite d'un appel

Si `s2` est une rotation de `s1`, alors `s1` se découpe en `x + y` et `s2` est `y + x` pour certaines chaînes `x` et `y` (éventuellement vides).

Concatène `s1` avec elle-même:

```
s1 + s1 = x + y + x + y
```

Le morceau du milieu est `y + x`, exactement `s2`. Donc **toute rotation de `s1` est une sous-chaîne de `s1 + s1`**.

Dans l'autre sens, il faut un garde-fou: les longueurs doivent être égales. Sinon une chaîne plus courte pourrait apparaître dans le texte doublé sans être une rotation de même longueur.

Le test complet est:

1. Même longueur (et en général non null).
2. `isSubstring(s1 + s1, s2)` une seule fois.

Chaîne vide: deux vides ont la même longueur, `"" + ""` est `""`, et `isSubstring("", "")` devrait être true. Une vide et une non vide échouent sur la longueur.

---

## Solution Java

```java
/**
 * Renvoie true si s2 est une rotation de s1, avec au plus un appel à isSubstring.
 * Exemple: "waterbottle" et "erbottlewat" -> true.
 */
public static boolean isRotation(String s1, String s2) {
    if (s1 == null || s2 == null) {
        return false;
    }
    // Les rotations préservent la longueur. Longueurs différentes: impossible.
    if (s1.length() != s2.length()) {
        return false;
    }
    // Optionnel: deux chaînes vides sont des rotations égales.
    // s1 + s1 reste vide; isSubstring doit renvoyer true pour vide dans vide.
    String doubled = s1 + s1;
    return isSubstring(doubled, s2);
}

/**
 * True si small apparaît dans big. En entretien c'est "donné".
 * En Java réel tu peux l'implémenter avec indexOf.
 */
public static boolean isSubstring(String big, String small) {
    if (big == null || small == null) {
        return false;
    }
    return big.indexOf(small) != -1;
}
```

Parcours de l'exemple classique:

| Étape | Valeur |
| --- | --- |
| `s1` | `waterbottle` |
| `s2` | `erbottlewat` |
| longueurs | les deux 11, OK |
| `s1 + s1` | `waterbottlewaterbottle` |
| `isSubstring` | trouve `erbottlewat` après `wat` |

Un appel. Terminé.

---

## Complexité

| | Coût | Pourquoi |
| --- | --- | --- |
| Temps | O(n) typique | Construire `s1+s1` en O(n). `indexOf` en O(n) en moyenne / O(n·m) au pire naïf. En entretien: travail linéaire pour une recherche de sous-chaîne correcte. |
| Espace extra | O(n) | La chaîne doublée a une longueur 2n. |

Dans le pire cas tu dois lire les deux chaînes, donc l'ordre linéaire est le bon ordre de grandeur.

---

## Cas limites que l'intervieweur pique

1. **Entrées null.** Renvoie false (ou lève une exception si ton contrat le dit). Annonce le choix à voix haute.
2. **Longueurs différentes.** False rapide. Pas besoin d'appeler `isSubstring` (zéro appel respecte encore "au plus un").
3. **Chaînes identiques.** Rotation de zéro. `s1+s1` contient `s1`. True.
4. **Chaînes vides.** Les deux vides: true. Une seule vide: false via la longueur.
5. **Un seul caractère.** `"a"` et `"a"` true; `"a"` et `"b"` false.
6. **Lettres répétées.** `"aaaa"` et `"aaaa"` true. `"aaba"` et `"abaa"` true (rotation). Utilise le test de la chaîne doublée; n'invente pas de cas spéciaux.
7. **Casse et espaces.** `"Ab"` n'est pas une rotation de `"bA"` sauf si l'énoncé ignore la casse. Par défaut, égalité exacte.
8. **Appeler isSubstring plus d'une fois.** C'est le cœur de la question. Construire toutes les rotations à la main rate l'esprit même si c'est correct.

---

## Erreurs fréquentes

- Oublier le **test de longueur** et ne faire que `isSubstring(s1+s1, s2)`. Une chaîne plus courte présente dans la source doublée peut passer.
- Appeler `isSubstring` dans une boucle sur les points de coupe. Cela brûle le budget.
- Utiliser `contains` sur `s2+s2` au lieu de `s1+s1` sans soigner les rôles. La chaîne doublée doit être l'**originale** (ou l'une ou l'autre si les longueurs matchent et qu'elles sont rotations l'une de l'autre). Garde une histoire simple: double `s1`, cherche `s2`.
- Trier les deux chaînes. Cela vérifie un **anagramme**, pas une rotation. `"abcd"` et `"acbd"` sont des anagrammes, pas des rotations.

---

## Récap à raconter à un ami

Une rotation, c'est le même collier circulaire de caractères, ouvert à un autre fermoir.

Si `s2` est vraiment une rotation de `s1`, alors `s2` est un certain `y + x` tandis que `s1` est `x + y`. Écris `s1` deux fois d'affilée et ce `y + x` se trouve au milieu. Donc vérifie **même longueur**, puis demande une seule fois: `s2` est-elle une sous-chaîne de `s1 + s1`?

C'est tout le truc. Une bonne observation bat un nid de boucles.

---

## Entraînement

1. Code `isRotation` de mémoire, sans regarder.
2. Trace sur papier `isRotation("waterbottle", "erbottlewat")`.
3. Trace un cas faux: `isRotation("waterbottle", "bottlewaterx")` (longueur) et `isRotation("abc", "acb")` (anagramme, pas rotation).
4. Explique pourquoi trier les deux côtés est le mauvais outil.

Cela ferme le chapitre 1 (Arrays and Strings). Suite: listes chaînées avec [Remove Dups](/blog/fr/ctci-2-1-remove-dups). Carte de la série: [CTCI en Java](/blog/fr/ctci-series-guide).