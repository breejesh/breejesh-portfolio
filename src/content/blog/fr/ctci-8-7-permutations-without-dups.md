---
title: "Permutations without Dups: tous les ordres d'une chaîne unique (Java)"
description: "Problème style CTCI 8.7 pour débutants: lister chaque permutation d'une chaîne aux caractères tous distincts. Backtracking avec un tableau used, Java clair et un parcours court pour abc."
date: "2025-10-18"
tags: [Algorithmes]
coverImage: /assets/images/ctci-8-7-permutations-without-dups.webp
previewImage: /assets/images/ctci-8-7-permutations-without-dups.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.7 pour débutants: lister chaque permutation d'une chaîne aux caractères tous distincts. Backtracking avec un tableau used, Java clair et un parcours court pour abc.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as un mot court. Chaque lettre est distincte. Combien de façons de réordonner ces lettres, et comment lister chaque arrangement sans refaire le même travail? C'est **Permutations without Dups**: générer tous les ordres d'une chaîne aux caractères distincts.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de "génère toutes les permutations" en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Récursion et programmation dynamique, problème **8.7**.

---

## 1. Analogie du quotidien

Imagine trois étiquettes distinctes sur une table: `A`, `B`, `C`. Tu veux chaque file possible de personnes portant ces étiquettes.

* Pour le **premier** siège tu peux prendre n'importe laquelle des trois.
* Pour le **deuxième** tu prends une étiquette encore sur la table.
* Le **dernier** siège reçoit ce qui reste.

Si tu dessines un arbre, le premier niveau a trois branches, chaque second niveau en a deux, et les feuilles sont des files complètes: `ABC`, `ACB`, `BAC`, `BCA`, `CAB`, `CBA`. Six feuilles, soit `3! = 6`.

L'astuce de code est le même parcours d'arbre: **choisir**, **récursiver**, **annuler** le choix pour que la branche suivante voie une table propre. Cette annulation, c'est le backtracking.

---

## 2. Énoncé en mots simples

**Entrée:** une chaîne `s` dont les caractères sont **tous distincts** (pas de lettres en double).

**Sortie:** une liste de chaque permutation distincte de `s`. L'ordre de la liste n'importe pas sauf si l'intervieweur demande une sortie triée.

**Exemples:**

| Entrée | Sortie (ordre libre) |
| --- | --- |
| `"abc"` | `"abc"`, `"acb"`, `"bac"`, `"bca"`, `"cab"`, `"cba"` |
| `"ab"` | `"ab"`, `"ba"` |
| `"a"` | `"a"` |
| `""` | une chaîne vide (ou une liste vide; choisis et tiens-t'y) |

**Clarifie avant de coder:**

* Caractères uniques? (Oui pour 8.7. Le 8.8 gère les doublons.)
* Sensible à la casse? (`'A'` et `'a'` sont différents s'ils apparaissent tous les deux.)
* Retourner `List<String>` ou imprimer? (Retourner une liste est plus simple à tester.)
* Chaîne vide? (Une permutation vide est un cas de base propre.)
* Muter l'entrée? (Préfère un char array ou un builder pour laisser la chaîne de l'appelant intacte.)

---

## 3. Réfléchir d'abord

### Compte d'abord

Pour `n` caractères uniques il y a `n!` permutations. Pour `n = 10` tu dépasses déjà trois millions. L'entretien veut le générateur, pas matérialiser un `n` énorme gratuitement.

### Idée brute (nomme-la, ne la code pas)

Générer chaque ordre d'indices avec des boucles imbriquées ou avec `Collections.shuffle` jusqu'à "en avoir assez." Ça ne scale pas, et shuffle ne prouve pas la complétude. Passe dès que tu as nommé la croissance factorielle.

### Idée récursive propre

Construis une réponse partielle `prefix`. À chaque étape:

1. Si la longueur de `prefix` vaut `n`, stocke une copie de `prefix` et reviens.
2. Pour chaque caractère **pas encore utilisé**, ajoute-le, récurs, puis retire-le (backtrack).

Il te faut savoir quels caractères sont libres:

* Un `boolean[] used` de longueur `n` (index dans la chaîne d'origine), ou
* Un ensemble de caractères restants, ou
* Des **swaps** in-place sur un char array (place le choisi à l'index courant, récurs sur le suffixe, swap inverse).

Les trois sont valides. Le tableau `used` s'explique bien à voix haute. Les swaps demandent moins de structure. Ci-dessous on utilise `used` pour la clarté, puis une courte variante swap.

### Pourquoi "without dups" compte

Si la chaîne avait deux lettres identiques, le même arbre produirait des chaînes en double. Le problème 8.8 corrige ça en sautant un caractère quand il égale un frère précédent non utilisé. Ici chaque caractère est unique, donc chaque feuille est une chaîne distincte. Pas de logique de skip en plus.

### Deuxième forme classique (optionnelle)

Autre vue livre: prends les permutations de la chaîne **sans** le premier caractère, puis insère ce caractère à chaque index de chaque sous-permutation. Même compte, autre récursion. Le backtracking avec un préfixe qui grandit s'écrit souvent plus vite sous pression.

---

## 4. Solution Java

### Backtracking avec tableau used

```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsWithoutDups {

    public List<String> permutations(String s) {
        List<String> result = new ArrayList<>();
        if (s == null) {
            return result;
        }
        boolean[] used = new boolean[s.length()];
        backtrack(s, new StringBuilder(), used, result);
        return result;
    }

    private void backtrack(String s, StringBuilder path,
                           boolean[] used, List<String> result) {
        if (path.length() == s.length()) {
            result.add(path.toString());
            return;
        }

        for (int i = 0; i < s.length(); i++) {
            if (used[i]) {
                continue;
            }
            used[i] = true;
            path.append(s.charAt(i));
            backtrack(s, path, used, result);
            path.deleteCharAt(path.length() - 1); // undo
            used[i] = false;                       // undo
        }
    }
}
```

Parcours pour `"abc"`:

1. Path vide. Essaie l'index 0 (`a`): path `"a"`.
2. Depuis `"a"`, essaie `b` → `"ab"`, seul `c` reste → `"abc"` (stocke). Undo `c`, undo `b`.
3. Depuis `"a"`, essaie `c` → `"ac"`, puis `b` → `"acb"` (stocke). Undo jusqu'à vider `a`.
4. Pareil en démarrant par `b`, puis par `c`. Six chaînes stockées.

Usage minimal:

```java
List<String> perms = new PermutationsWithoutDups().permutations("abc");
// size 6; contains "abc", "acb", "bac", "bca", "cab", "cba"
```

### Variante par swaps (même idée)

```java
public List<String> permutationsSwap(String s) {
    List<String> result = new ArrayList<>();
    if (s == null) {
        return result;
    }
    char[] chars = s.toCharArray();
    swapBacktrack(chars, 0, result);
    return result;
}

private void swapBacktrack(char[] chars, int index, List<String> result) {
    if (index == chars.length) {
        result.add(new String(chars));
        return;
    }
    for (int i = index; i < chars.length; i++) {
        swap(chars, index, i);
        swapBacktrack(chars, index + 1, result);
        swap(chars, index, i); // restore
    }
}

private void swap(char[] chars, int i, int j) {
    char tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
}
```

À la profondeur `index`, le préfixe `chars[0..index)` est fixé. Tu essaies chaque caractère restant du suffixe en le swapant en `index`, tu récurses, puis tu swap en arrière. Même arbre factoriel, sans `boolean[]`.

Les deux formes passent en entretien. Choisis-en une, finis-la, puis mentionne l'autre s'il reste du temps.

---

## 5. Tableau de complexité

| Élément | Notes de coût |
| --- | --- |
| Nombre de feuilles | `n!` pour une entrée unique de longueur `n` |
| Travail par feuille | O(n) pour copier la chaîne finie dans le résultat |
| Temps total | O(n · n!) pour construire chaque permutation |
| Profondeur de récursion | O(n) |
| Espace extra (hors sortie) | O(n) pour path + flags used (ou O(1) hors le char array avec swaps) |
| Espace de sortie | O(n · n!) pour tenir chaque chaîne |

Le temps est **sensible à la sortie**. Tu touches chaque permutation que tu renvoies. Ne revendique pas O(n) pour la liste complète. Pour un `n` énorme, on peut demander un itérateur en streaming ou "le compte seulement," un autre produit.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs touchent ceci:

* **Entrée null** → liste vide (ou exception; dis laquelle).
* **Chaîne vide** → une chaîne vide dans la liste est un cas de base naturel.
* **Un seul caractère** → liste de taille 1.
* **Deux caractères** → deux chaînes; bon contrôle manuel.
* **Longueur 0 vs null** → ne les traite pas pareil sans le dire.

Erreurs fréquentes:

1. **Oublier l'undo.** Si tu laisses `used[i] = true` ou un char dans le builder, les branches suivantes perdent des caractères ou grandissent sans fin.
2. **Muter un `StringBuilder` partagé au stockage.** Toujours `path.toString()` (un nouveau `String`) avant `result.add`.
3. **Supposer entrée ou sortie triée.** Ni l'un ni l'autre n'est exigé sauf demande.
4. **Utiliser ce code sur des lettres en double.** Tu émettras des permutations en double. C'est le job du 8.8.
5. **Boucles imbriquées figées pour un n fixe.** Ça casse quand on change la longueur.
6. **Compter `n!` mentalement puis dire O(n²).** Compte d'abord les feuilles, puis le coût par feuille.

Auto-contrôle rapide: pour `"ab"`, attends exactement `["ab", "ba"]` (ordre libre). Pour `"abc"`, taille `6` et aucune chaîne répétée.

---

## 7. Recap à expliquer à un ami

Permutations without dups, version entretien:

1. Les caractères sont uniques, donc chaque chemin complet de l'arbre est une chaîne distincte.
2. Il y en a `n!`.
3. Construis un path. À chaque pas prends un caractère **non utilisé**, récurs, puis **annule**.
4. Quand la longueur du path atteint `n`, stocke une copie.
5. `used[]` + `StringBuilder`, ou swaps in-place sur un char array: le même arbre.
6. Temps O(n · n!), espace dominé par la liste de sortie.

Si tu peux dessiner les six feuilles de `"abc"`, écrire la boucle choisir-récursiver-annuler sans oublier l'undo, et nommer la taille factorielle, tu maîtrises le problème 8.7.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Towers of Hanoi](/blog/fr/ctci-8-6-towers-of-hanoi)
* Suivant: [Permutations with Dups](/blog/fr/ctci-8-8-permutations-with-dups)