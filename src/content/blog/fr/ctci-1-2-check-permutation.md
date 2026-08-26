---
title: "CTCI 1.2 Check Permutation : mêmes lettres, autre ordre (Java)"
description: "Décider si deux chaînes sont des permutations l'une de l'autre. Analogie Scrabble, tri vs tableau de comptage vs HashMap en Java, complexité et cas limites pour débutants."
date: "2026-01-24"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-2-check-permutation.webp
previewImage: /assets/images/ctci-1-2-check-permutation.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Décider si deux chaînes sont des permutations l'une de l'autre. Analogie Scrabble, tri vs tableau de comptage vs HashMap en Java, complexité et cas limites pour débutants.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Deux mots peuvent se ressembler peu et pourtant être faits exactement des mêmes lettres. Les interviewers aiment cette idée parce qu'elle t'oblige à parler de **fréquence**, pas seulement d'égalité.

C'est le **problème 1.2** de la [série CTCI en Java](/blog/fr/ctci-series-guide) : étant donné deux chaînes, décider si l'une est une **permutation** de l'autre. On reste débutant-friendly : analogie, problème en mots simples, comment réfléchir, puis trois versions Java propres.

---

## Analogie du quotidien : deux tas de tuiles Scrabble

Toi et un ami versez chacun un tas de lettres.

- Ton tas : `T`, `A`, `R`
- Son tas : `R`, `A`, `T`

Si tu tries chaque tas par ordre alphabétique, les deux deviennent `A`, `R`, `T`. Même multiensemble de lettres. C'est une permutation.

S'il a `R`, `A`, `T`, `S`, les tas ne sont pas les mêmes. Une tuile en trop : ce n'est pas une permutation.

**Permutation** ici signifie : les mêmes caractères avec les mêmes comptes, éventuellement dans un autre ordre. Pas "mots liés". Pas "anagramme uniquement en français". Juste des sacs de caractères qui collent.

---

## Le problème en mots simples

**Entrée :** deux chaînes, `a` et `b`.

**Sortie :** `true` si `a` est un réarrangement de `b`, sinon `false`.

**Exemples**

| `a` | `b` | Résultat | Pourquoi |
| --- | --- | --- | --- |
| `"abc"` | `"bca"` | true | les trois mêmes lettres |
| `"abc"` | `"ab"` | false | longueurs différentes |
| `"aabc"` | `"abac"` | true | deux `a`, un `b`, un `c` |
| `"Dog"` | `"god"` | false si la casse compte | `D` n'est pas `d` |
| `"ab c"` | `"abc"` | false si l'espace compte | l'espace est un caractère |

### Questions à poser en entretien

1. **Sensible à la casse ?** En général oui, sauf indication contraire. `"God"` et `"dog"` sont différents.
2. **Espaces et ponctuation comptent-ils ?** En général oui. Traite chaque `char` de la même façon.
3. **Charset ?** ASCII seulement, ou Unicode complet ? Ce choix sélectionne **tableau de comptes** vs **HashMap**.
4. **Null ou vides ?** Vide et vide peut être true (zéro caractères). Null est une décision produit ; en entretien, annonce ta règle.

Pour ce billet, on suppose :

* Sensible à la casse.
* L'espace compte.
* On préfère une solution ASCII claire, puis la version générale avec `HashMap`.

---

## Comment réfléchir avant de coder

### Force brute trop lente

Générer chaque permutation de `a` et voir si `b` apparaît. Pour une longueur `n`, c'est de l'ordre de `n!` chaînes. OK pour longueur 4. Mort pour longueur 20. N'y va pas.

### Idée 1 : trier les deux chaînes

Si deux chaînes sont des permutations, trier leurs caractères produit la même séquence.

1. Si les longueurs diffèrent, retourne false tout de suite.
2. Convertis chaque chaîne en `char[]`.
3. Trie les deux tableaux.
4. Compare l'égalité des tableaux (ou reconstruis des strings et utilise `equals`).

Facile à expliquer et dur à casser. Le coût est le tri : temps **O(n log n)**.

### Idée 2 : compter les caractères (l'upgrade d'entretien)

Trier réordonne. Compter compare **combien** de chaque lettre tu as.

1. Si les longueurs diffèrent, false.
2. Parcours `a` et incrémente le compte de chaque caractère.
3. Parcours `b` et décrémente.
4. Si un compte devient négatif, ou s'il reste un non-zéro, ce ne sont pas des permutations.

Si l'alphabet est petit et fixe (ASCII classique avec 128 ou 256 cases), un `int[]` suffit. Si les caractères peuvent être n'importe quelle unité Unicode, utilise un `HashMap<Character, Integer>`.

Compter est en général **O(n)** en temps et **O(1)** d'espace extra pour un alphabet fixe (la taille du tableau ne grandit pas avec `n`).

### Laquelle dire en premier ?

En vrai entretien : commence par le tri, puis dis "on peut faire mieux avec des comptes de fréquence si l'alphabet est limité." Tu montres que tu livres le simple et que tu sais encore optimiser.

---

## Solution Java 1 : trier les deux

```java
import java.util.Arrays;

public class CheckPermutation {

    /** True si a est une permutation de b (casse sensible, chaque char compte). */
    public static boolean permutationBySort(String a, String b) {
        if (a == null || b == null) {
            return a == b; // les deux null -> true ; un seul null -> false
        }
        if (a.length() != b.length()) {
            return false;
        }

        char[] ca = a.toCharArray();
        char[] cb = b.toCharArray();
        Arrays.sort(ca);
        Arrays.sort(cb);
        return Arrays.equals(ca, cb);
    }
}
```

Notes pour débutants :

* `toCharArray()` copie les caractères pour que le tri ne tente pas de muter le `String` immuable.
* Le test de longueur est une sortie anticipée gratuite. Des longueurs différentes ne peuvent jamais être une permutation.
* `Arrays.equals` compare chaque index après le tri.

---

## Solution Java 2 : tableau de comptage (ami de l'ASCII)

On suppose des caractères dans 0..127 (ASCII standard). Si le problème dit "ASCII étendu", utilise la taille 256.

```java
public class CheckPermutation {

    private static final int ASCII = 128;

    public static boolean permutationByCountArray(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (a.length() != b.length()) {
            return false;
        }

        int[] counts = new int[ASCII];

        for (int i = 0; i < a.length(); i++) {
            char c = a.charAt(i);
            // Garde optionnelle si tu dois rejeter le non-ASCII :
            // if (c >= ASCII) throw new IllegalArgumentException("non-ASCII");
            counts[c]++;
        }

        for (int i = 0; i < b.length(); i++) {
            char c = b.charAt(i);
            counts[c]--;
            if (counts[c] < 0) {
                // b a plus de ce char que a
                return false;
            }
        }

        // Longueurs égales et jamais négatif : tout est à zéro.
        return true;
    }
}
```

Pourquoi le `return` anticipé sur `counts[c] < 0` fonctionne :

* La longueur totale est égale.
* Chaque fois que `b` utilise un caractère, on retire une unité du stock construit par `a`.
* Si le stock devient négatif, `b` avait besoin de plus de ce caractère que `a` n'en avait.
* Si cela n'arrive jamais et que les longueurs collent, les sacs sont égaux. Pas besoin d'une troisième boucle pour chercher des positifs restants.

Si tu préfères le style en trois passes du livre : incrémente avec `a`, décrémente avec `b`, puis parcours le tableau pour tout non-zéro. Même big-O ; un peu plus de code.

---

## Solution Java 3 : HashMap (jeu de caractères général)

Quand tu ne peux pas supposer l'ASCII, compte avec une map.

```java
import java.util.HashMap;
import java.util.Map;

public class CheckPermutation {

    public static boolean permutationByHashMap(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (a.length() != b.length()) {
            return false;
        }

        Map<Character, Integer> counts = new HashMap<>();

        for (int i = 0; i < a.length(); i++) {
            char c = a.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        for (int i = 0; i < b.length(); i++) {
            char c = b.charAt(i);
            Integer left = counts.get(c);
            if (left == null || left == 0) {
                return false;
            }
            if (left == 1) {
                counts.remove(c); // optionnel : map plus propre
            } else {
                counts.put(c, left - 1);
            }
        }

        return counts.isEmpty();
    }
}
```

Compromis :

* Fonctionne pour toute valeur `char` stockée par Java (unités de code UTF-16).
* Plus de surcharge d'objets et de coût de hachage qu'un `int[]` serré.
* Pour les problèmes d'entretien en chaînes ASCII, le tableau est souvent la réponse la plus nette après avoir mentionné le tri.

### Mini tests

```java
public static void main(String[] args) {
    System.out.println(permutationBySort("abc", "bca"));       // true
    System.out.println(permutationBySort("abc", "ab"));        // false
    System.out.println(permutationByCountArray("aabc", "abac")); // true
    System.out.println(permutationByHashMap("Dog", "god"));    // false
    System.out.println(permutationByHashMap("", ""));          // true
}
```

---

## Complexité

Soit `n` la longueur commune quand les longueurs matchent (si elles diffèrent, on s'arrête en O(1)).

| Approche | Temps | Espace extra | Idéal quand |
| --- | --- | --- | --- |
| Trier les deux | O(n log n) | O(n) pour les char arrays (ou O(1) si tu ignores les copies) | Tu veux le code correct le plus simple |
| Tableau de comptage (taille k) | O(n) | O(k) fixe, ex. 128 ou 256 | L'alphabet est petit et connu |
| HashMap | O(n) en moyenne | O(min(n, alphabet)) | Caractères épars ou alphabet large |

Phrase d'entretien : **longueur différente = non immédiat. Même multiensemble de caractères = oui. Le tri prouve le multiensemble. Le comptage le prouve plus vite pour un alphabet fixe.**

---

## Cas limites que les interviewers piquent

1. **Longueurs différentes** (`"ab"`, `"abc"`) → false sans scanner le contenu si tu testes la longueur d'abord.
2. **Chaînes vides** (`""`, `""`) → true. (`""`, `"a"`) → false.
3. **Une vide, une non** → false.
4. **Doublons** (`"aab"`, `"aba"`) → true ; (`"aab"`, `"abb"`) → false. La fréquence compte, pas seulement "utilise a et b".
5. **Casse** (`"Abc"`, `"abc"`) → false sous règles case-sensitive.
6. **Espaces** (`"a b"`, `"ab "`) → true (mêmes caractères, autre ordre) ; (`"a b"`, `"ab"`) → false.
7. **Null** → tombe d'accord sur la politique avant de coder.
8. **Très longues chaînes** → préfère le comptage O(n) au tri si les limites sont énormes et l'alphabet fixe.
9. **Unicode / emoji** → en Java, `char` est une unité UTF-16. Gérer les code points complets est un sujet plus profond ; mentionne-le si l'interviewer se soucie des emoji.

---

## Erreurs fréquentes

* Comparer des strings avec `==` en Java (égalité de référence). Utilise la comparaison de contenu après tri, ou ne construis pas de strings et compare tableaux / comptes.
* Oublier le test de longueur et écrire un long comptage qui "presque" marche.
* Utiliser un set booléen "vu" au lieu de comptes. Les sets détruisent la fréquence. `"aab"` et `"abb"` sembleraient identiques comme `{a, b}`.
* Supposer case-insensitive sans demander.
* Off-by-one sur la taille du tableau : 128 vs 256 vs `Character.MAX_VALUE + 1` (n'alloue pas 65k sauf si tu le veux vraiment).

---

## Explique à un ami

Vérifier une permutation demande : **est-ce que ces deux chaînes sont le même sac de lettres ?**

Imagine des tuiles Scrabble. Si vous avez tous les deux les mêmes tuiles, juste posées dans un autre ordre, vous matchez. Si l'un a une tuile en trop ou en moins, non.

Algo mental rapide :

1. Longueur différente ? Non.
2. Soit tu tries les deux tas et tu compares, soit tu comptes combien de chaque lettre chaque tas a.
3. Comptes égaux = oui.

En Java, le tri est le premier brouillon clair. Un tableau de comptage de taille fixe est l'upgrade O(n) habituel pour l'ASCII. Un `HashMap` est la version générale quand l'alphabet n'est pas petit.

Voilà CTCI 1.2. Ensuite dans le chapitre 1, on trouve souvent **URLify** (espaces vers `%20` sur place). L'idée précédente du chapitre est **Is Unique** (tous les caractères distincts).

---

## Série

* Guide de la série : [Cracking the Coding Interview in Java](/blog/fr/ctci-series-guide)
* Tag : **Algorithmes** seulement pour cette série

Astuce d'entraînement : implémente le tri sans regarder, puis réécris avec des comptes de mémoire le lendemain.