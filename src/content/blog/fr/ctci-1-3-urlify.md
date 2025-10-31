---
title: "CTCI 1.3 URLify: remplacer les espaces par %20 depuis la fin"
description: "Encodage URL in-place sur un char array avec longueur réelle. Compte les espaces, parcours à rebours, écrit %20 sans écraser les caractères encore utiles."
date: "2025-10-31"
tags: [Algorithmes]
coverImage: /assets/images/ctci-1-3-urlify.webp
previewImage: /assets/images/ctci-1-3-urlify.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Encodage URL in-place sur un char array avec longueur réelle. Compte les espaces, parcours à rebours, écrit %20 sans écraser les caractères encore utiles.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Les URLs ne peuvent pas porter d'espaces bruts. Un espace devient le jeton de trois caractères `%20`. Les versions entretien de ce problème ne te demandent pas d'appeler un helper de bibliothèque. On te donne un `char[]` qui a déjà de la place en trop à la fin, plus la **longueur réelle** de la chaîne (combien de caractères comptent avant le rembourrage). Ton travail: réécrire le tableau sur place.

C'est le problème **1.3** du chapitre Arrays and Strings du set classique style CTCI. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## Analogie du quotidien

Imagine une rangée de sièges de théâtre. Les treize premiers sièges tiennent les vraies personnes. Des sièges vides supplémentaires sont à la fin de la rangée.

Chaque personne debout (un espace) a besoin de trois sièges au lieu d'un: les lettres `%`, `2` et `0`. Si tu commences à tasser depuis le **devant**, chaque personne derrière toi doit se décaler à droite, encore et encore. C'est lent et facile à rater.

Si tu commences par le **fond**, tu prends d'abord les sièges vides et tu places les gens (ou `%20`) dans des emplacements libres. Personne que tu dois encore déplacer n'est écrasé. C'est tout le truc.

---

## Le problème en mots simples

**Entrée**

* `chars`: un tableau de caractères. La vraie chaîne vit dans les indices `0 .. trueLength - 1`. Le reste du tableau est un buffer de marge.
* `trueLength`: combien de caractères de contenu réel existent (pas la longueur totale du tableau).

**Sortie**

* Le même tableau, édité pour que chaque espace de la chaîne réelle soit remplacé par `%`, `2`, `0`.
* Le type de retour est souvent `void` (mutation sur place) ou la chaîne finale pour tester facilement.

**Hypothèses à dire à voix haute**

1. Le tableau a assez de capacité pour l'expansion. Chaque espace ajoute deux caractères en plus.
2. Seuls les espaces dans la région de longueur réelle comptent. Les caractères de rembourrage du buffer ne sont pas des "espaces de contenu."
3. En Java, utilise `char[]` pour écrire sur place. Construire un nouveau `String` avec `StringBuilder` résout un autre problème (tu peux le mentionner comme chemin facile, puis faire la version in-place).

**Exemple classique**

```
Input:  chars = ['M','r',' ','J','o','h','n',' ','S','m','i','t','h',' ',' ',' ',' ']
        trueLength = 13
Output: ['M','r','%','2','0','J','o','h','n','%','2','0','S','m','i','t','h']
```

La chaîne `"Mr John Smith"` a une longueur 13 et deux espaces. La longueur finale est `13 + 2 * 2 = 17`.

---

## Comment penser avant de coder

### Idée brute force (et pourquoi ça fait mal)

Parcours de gauche à droite. Quand tu vois un espace, décale chaque caractère suivant de deux positions vers la droite, puis écris `%20`. Chaque décalage est `O(n)` par espace, donc beaucoup d'espaces donnent à peu près `O(n²)`. L'intervieweur demandera mieux.

### Meilleure idée: éditer depuis la fin

1. Compte combien d'espaces se trouvent dans la région de longueur réelle.
2. Calcule l'indice d'écriture final: tu as besoin de `trueLength + 2 * spaceCount` cases (indices de `0` à ce nombre moins un).
3. Parcours la chaîne réelle de droite à gauche.
4. Pour un caractère non-espace, copie-le dans le prochain emplacement libre depuis la fin.
5. Pour un espace, écris `'0'`, puis `'2'`, puis `'%'` (toujours en reculant, pour que les trois caractères soient dans le bon ordre en lecture gauche-droite).

Pourquoi le sens inverse marche: chaque écriture tombe dans une case qui était buffer ou qui tenait déjà un caractère que tu as fini de traiter. Tu n'écrases jamais une entrée encore non lue.

---

## Solution Java

```java
public final class Urlify {
    private Urlify() {}

    /**
     * Replaces spaces with %20 in place.
     * chars must have room for the expansion: trueLength + 2 * spaceCount.
     */
    public static void urlify(char[] chars, int trueLength) {
        if (chars == null || trueLength < 0 || trueLength > chars.length) {
            throw new IllegalArgumentException("bad length");
        }

        int spaces = 0;
        for (int i = 0; i < trueLength; i++) {
            if (chars[i] == ' ') {
                spaces++;
            }
        }

        // Index of the last slot we will write into.
        int write = trueLength + spaces * 2 - 1;

        if (write >= chars.length) {
            throw new IllegalArgumentException("array too small for %20 expansion");
        }

        for (int read = trueLength - 1; read >= 0; read--) {
            char c = chars[read];
            if (c == ' ') {
                chars[write] = '0';
                chars[write - 1] = '2';
                chars[write - 2] = '%';
                write -= 3;
            } else {
                chars[write] = c;
                write--;
            }
        }
    }

    /** Convenience for tests: build a padded char array from a string and true length. */
    public static String urlifyString(String s, int trueLength) {
        int spaces = 0;
        for (int i = 0; i < trueLength; i++) {
            if (s.charAt(i) == ' ') {
                spaces++;
            }
        }
        int finalLen = trueLength + spaces * 2;
        char[] chars = new char[finalLen];
        for (int i = 0; i < trueLength; i++) {
            chars[i] = s.charAt(i);
        }
        urlify(chars, trueLength);
        return new String(chars);
    }
}
```

### Parcours de l'exemple

Départ: contenu réel `"Mr John Smith"`, deux espaces, `write` commence à l'indice `16`.

| Étape | char lu | Action | write après |
| --- | --- | --- | --- |
| 1 | `h` | copier vers 16 | 15 |
| 2 | `t` | copier vers 15 | 14 |
| 3 | `i` | copier vers 14 | 13 |
| 4 | `m` | copier vers 13 | 12 |
| 5 | `S` | copier vers 12 | 11 |
| 6 | espace | écrire `%20` en 9-11 | 8 |
| 7 | `n` | copier vers 8 | 7 |
| ... | ... | continuer | ... |
| derniers espaces / lettres | ... | finir devant | terminé |

À la fin, le tableau contient `"Mr%20John%20Smith"`.

---

## Complexité

| Mesure | Coût | Pourquoi |
| --- | --- | --- |
| Temps | `O(n)` | Un passage pour compter les espaces, un pour réécrire. `n` est `trueLength`. |
| Espace extra | `O(1)` | Quelques entiers seulement. La sortie réutilise le tableau donné. |

Si l'intervieweur autorise une nouvelle chaîne, `StringBuilder` est aussi en `O(n)` temps et `O(n)` espace extra. La version in-place est le cœur de cet énoncé.

---

## Cas limites que les intervieweurs aiment

* **Zéro espaces:** la longueur finale égale `trueLength`. La boucle inverse copie juste chaque caractère sur lui-même (ou au même indice s'il n'y a pas de croissance). Toujours correct.
* **Que des espaces:** chaque caractère s'étend en `%20`. Il faut une capacité `3 * trueLength`.
* **Espaces en tête ou en queue du contenu réel:** on les encode aussi. `" hi "` avec longueur réelle 4 devient `"%20hi%20"`.
* **Longueur réelle vide (`0`):** rien à faire. Protège les longueurs négatives.
* **Tableau trop petit:** échoue vite. Au tableau, énonce la formule de capacité: taille finale = `trueLength + 2 * spaceCount`.
* **Tabulations ou autre whitespace:** le problème classique ne remplace que le caractère espace `' '`. Demande si un autre whitespace compte. En général non.
* **Unicode / multi-octet:** `char` en Java est une unité de code UTF-16. Pour l'encodage URL de texte ASCII en entretien, reste sur les espaces.

---

## Erreurs fréquentes

1. **Éditer vers l'avant** et décaler encore et encore: quadratique, et dur à réussir sous pression.
2. **Utiliser `chars.length` comme longueur réelle.** Les espaces de rembourrage en fin de buffer ne sont pas du contenu. C'est pourquoi `trueLength` est fourni à part.
3. **Écrire `%`, `2`, `0` dans le mauvais ordre en reculant.** Souviens-toi: la case la plus à droite des trois reçoit `'0'` en premier quand tu écris depuis la fin.
4. **Off-by-one sur `write`.** Commence à `trueLength + 2 * spaces - 1`, pas à `trueLength + 2 * spaces`.
5. **Muter tout en lisant devant la tête d'écriture dans le mauvais sens.** Le sens inverse évite cette collision.

---

## Petit test à lancer

```java
public static void main(String[] args) {
    // 13 chars of content, room for two spaces -> +4
    char[] chars = "Mr John Smith    ".toCharArray(); // length 17
    Urlify.urlify(chars, 13);
    System.out.println(new String(chars)); // Mr%20John%20Smith

    System.out.println(Urlify.urlifyString("Mr John Smith", 13));
    System.out.println(Urlify.urlifyString("nospace", 7)); // nospace
    System.out.println(Urlify.urlifyString("  ", 2));      // %20%20
}
```

---

## Explique à un ami

Tu as un tableau de caractères avec la vraie chaîne devant et des sièges vides à la fin. Les espaces doivent devenir trois caractères, `%20`. Tu comptes les espaces, tu calcules de combien la chaîne grandira, puis tu parcours depuis le dernier vrai caractère vers l'arrière. Tu copies les lettres normales dans des sièges libres depuis le fond. Quand tu tombes sur un espace, tu poses `%20` dans trois sièges. Comme tu remplis depuis la fin, tu n'écrases jamais un caractère que tu dois encore lire. Un passage de comptage, un passage d'écriture, temps linéaire, mémoire extra constante.

Suite du chapitre 1: [Palindrome Permutation](/blog/fr/ctci-1-4-palindrome-permutation). Précédent: [Check Permutation](/blog/fr/ctci-1-2-check-permutation).