---
title: "Permutations avec doublons: chaînes uniques via carte de fréquences (Java)"
description: "Problème style CTCI 8.8 pour débutants: lister chaque permutation unique d'une chaîne qui peut contenir des caractères en double. Carte de fréquences, backtracking sur les comptes restants, sans l'explosion n! des swaps naïfs."
date: "2026-01-05"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.8 pour débutants: lister chaque permutation unique d'une chaîne qui peut contenir des caractères en double. Carte de fréquences, backtracking sur les comptes restants, sans l'explosion n! des swaps naïfs.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu sais déjà lister tous les ordres de caractères distincts: choisir la lettre suivante, récursiver, la remettre. C'est le problème **8.7**. Dès que la chaîne a des répétitions (`"aab"`, `"mississippi"`), l'arbre naïf imprime la même chaîne plusieurs fois. Le problème **8.8** demande seulement les permutations **uniques**, sans produire une énorme liste puis filtrer.

Ce post est un enseignement original pour débutants en **Java**. Même famille que les entretiens sur les permutations de multiensembles, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et DP, problème **8.8**.

---

## 1. Analogie du quotidien

Tu as des tuiles Scrabble face visible: deux `A` et un `B`. Combien de **mots différents** peux-tu former en réarrangeant toutes les tuiles?

Si les deux `A` avaient des couleurs différentes, tu pourrais les échanger et prétendre que les mots sont différents. Ils ne le sont pas. Le lecteur ne voit que des lettres. Donc:

* Lettres toutes distinctes: le décompte est `n!`.
* Avec doublons: le décompte est `n! / (f1! · f2! · …)` où `fi` est le nombre d'apparitions de la lettre `i`.

Pour `"aab"`, c'est `3! / 2! = 3` chaînes: `aab`, `aba`, `baa`. Pas six.

L'algorithme ne doit faire pousser que ces trois branches. Pas six pour en jeter trois.

---

## 2. Énoncé en mots simples

**Entrée:** une chaîne `s` de longueur `n`. Les caractères peuvent se répéter. Casse et alphabet selon l'interviewer; traite la chaîne comme un multiensemble de chars.

**Sortie:** toutes les chaînes **distinctes** qui utilisent chaque caractère de `s` exactement une fois (permutations de longueur complète du multiensemble). L'ordre de la liste n'importe pas sauf s'ils demandent une sortie triée.

**Exemples:**

| Entrée | Permutations uniques |
| --- | --- |
| `""` | une chaîne vide (ou liste vide: choisis une convention et tiens-toi-y) |
| `"a"` | `["a"]` |
| `"ab"` | `["ab", "ba"]` |
| `"aab"` | `["aab", "aba", "baa"]` |
| `"aaa"` | `["aaa"]` |

**Clarifie avant de coder:**

* Entrée vide: `[""]` ou `[]`? Ici: un résultat vide, même style de cas de base que 8.7.
* Sensible à la casse? Oui sauf indication contraire (`A` ≠ `a`).
* Sortie triée? Pas requis. Tu peux trier à la fin s'ils le veulent.
* Muter l'entrée de l'appelant? Non. Travaille avec une map et un builder.

On ne te demande **pas** les permutations d'un sous-ensemble (plus proche du power set). Longueur complète seulement.

---

## 3. Réfléchis d'abord

### Pourquoi "tout générer puis mettre dans un Set" est faible

Tu peux lancer la récursion par swaps de 8.7 et pousser chaque chaîne dans un `HashSet`. Correct pour un petit `n`. Le coût reste proportionnel à **tous** les ordres du multiensemble dans l'arbre de recherche, ce qui avec beaucoup de doublons dépasse largement le décompte unique. Ils veulent que tu **ne crées pas de doublons**, pas que tu les caches dans un set.

### Idée de la carte de fréquences

Compte combien de fois chaque caractère reste disponible:

```
"aab" → { a: 2, b: 1 }
```

À chaque étape de la chaîne partielle:

1. Pour chaque caractère `c` dont le compte est `> 0`, choisis `c` ensuite.
2. Décrémente `count[c]`, ajoute `c`, récursive.
3. Après l'appel, restaure: retire `c`, incrémente `count[c]`.

Comme les deux tuiles `a` partagent une clé dans la map, il n'y a qu'**une** branche qui commence par `a`, pas deux. C'est toute l'astuce.

### Forme de la récursion

```
prefix = ""
counts = {a:2, b:1}

  pick a → prefix "a", counts {a:1, b:1}
    pick a → "aa", {a:0, b:1}
      pick b → "aab"  (terminé)
    pick b → "ab", {a:1, b:0}
      pick a → "aba"  (terminé)
  pick b → prefix "b", counts {a:2, b:0}
    pick a → "ba", {a:1, b:0}
      pick a → "baa"  (terminé)
```

Trois feuilles. Aucune feuille en double.

### Comparer à 8.7

| | 8.7 sans dups | 8.8 avec dups |
| --- | --- | --- |
| Source des choix | indices / lettres non utilisés | caractères avec compte restant > 0 |
| Facteur de branchement | positions non utilisées distinctes | clés de caractère encore disponibles |
| Taille du résultat | `n!` | `n! / ∏ fi!` |
| Structure en plus | tableau used, ou swap | `Map` ou tableau de comptes |

Si chaque caractère est unique, l'approche fréquences marche encore et produit `n!` résultats. C'est une généralisation stricte de 8.7.

### Structure pour les comptes

* **Tableau de taille 26** si le problème est seulement des minuscules anglaises. Rapide et simple.
* **`HashMap<Character, Integer>`** pour Unicode / casse mixte. Un peu plus de code, plus clair quand l'alphabet est inconnu.

Utilise une map dans la solution principale pour ne pas supposer silencieusement `a-z`.

### Choix du builder

`StringBuilder` pour le préfixe courant. Append avant de récursiver, `setLength` ou `deleteCharAt` au retour. Évite la concat de `String` sur le chemin chaud si tu te soucies des objets intermédiaires; pour un tableau avec petit `n`, les deux vont.

---

## 4. Solution Java

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {

    public List<String> permutations(String s) {
        List<String> result = new ArrayList<>();
        if (s == null) {
            return result;
        }

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        backtrack(counts, new StringBuilder(), s.length(), result);
        return result;
    }

    private void backtrack(
            Map<Character, Integer> counts,
            StringBuilder path,
            int targetLen,
            List<String> result) {

        if (path.length() == targetLen) {
            result.add(path.toString());
            return;
        }

        // Itère une copie des clés pour ne pas dépendre des bizarreries de mutation de map.
        for (Character c : new ArrayList<>(counts.keySet())) {
            int remaining = counts.get(c);
            if (remaining <= 0) {
                continue;
            }

            counts.put(c, remaining - 1);
            path.append(c);

            backtrack(counts, path, targetLen, result);

            path.deleteCharAt(path.length() - 1);
            counts.put(c, remaining);
        }
    }
}
```

### Parcours: `"aab"`

1. Construis les comptes `{a=2, b=1}`. `targetLen = 3`.
2. Premier choix haut `a`: path `"a"`, comptes `{a=1, b=1}`.
3. Ensuite `a`: path `"aa"`, comptes `{a=0, b=1}`. Il ne reste que `b` → `"aab"`. Enregistre. Annule.
4. Toujours sous path `"a"`, choix suivant `b`: path `"ab"`, puis seul `a` reste → `"aba"`. Enregistre. Annule.
5. Retour au path vide, choix `b`: path `"b"`, puis deux `a` forcés dans l'ordre → seulement `"baa"`. Enregistre.
6. Terminé. Trois chaînes.

### Pourquoi itérer les clés à chaque niveau

Tu ne places un caractère que si son compte est positif. Les clés à zéro restant sont ignorées. Certains retirent les clés à zéro de la map et les réinsèrent au undo; ça marche, mais c'est plus facile de se tromper sous pression. Laisser la clé et tester `remaining <= 0` est terne et sûr.

### Optionnel: tableau d'alphabet fixe

Si l'interviewer te limite aux minuscules `a-z`:

```java
int[] counts = new int[26];
for (int i = 0; i < s.length(); i++) {
    counts[s.charAt(i) - 'a']++;
}

// dans backtrack:
for (int i = 0; i < 26; i++) {
    if (counts[i] == 0) {
        continue;
    }
    counts[i]--;
    path.append((char) ('a' + i));
    backtrack(counts, path, targetLen, result);
    path.deleteCharAt(path.length() - 1);
    counts[i]++;
}
```

Même flux de contrôle. Constantes plus rapides, contrat d'entrée plus étroit.

### Tests de fumée

```java
PermutationsWithDups p = new PermutationsWithDups();

assert p.permutations("").equals(List.of(""));
assert p.permutations("a").equals(List.of("a"));

List<String> ab = p.permutations("ab");
assert ab.size() == 2 && ab.contains("ab") && ab.contains("ba");

List<String> aab = p.permutations("aab");
assert aab.size() == 3;
assert aab.contains("aab") && aab.contains("aba") && aab.contains("baa");

assert p.permutations("aaa").equals(List.of("aaa"));
```

---

## 5. Tableau de complexité

Soit `n` la longueur de la chaîne. Soit `k` le nombre de caractères distincts. Soit `U` le nombre de permutations uniques, `U = n! / ∏ fi!`.

| Élément | Coût | Notes |
| --- | --- | --- |
| Construire les comptes | O(n) temps, O(k) espace | Un passage |
| Taille de l'arbre de recherche | ~Θ(U · n) nœuds | Chaque résultat unique est un chemin de longueur n; les nœuds internes partagent des préfixes |
| Travail par nœud | O(k) pour scanner les clés (map) ou O(1) amorti sur 26 pour un tableau | Domine la constante |
| Taille de sortie | O(U · n) | Il faut écrire chaque chaîne |
| Pile extra | O(n) profondeur de récursion | Longueur du path |
| Temps total | style O(U · n · k) | Mieux que O(n! · n) avec beaucoup de doublons |
| Espace total | O(n + k + U · n) | Pile + map + sortie |

Dis-le à voix haute: tu paies encore chaque chaîne unique renvoyée. Tu ne paies **pas** les ordres en double annulés qu'une approche swap+Set visiterait.

Pire cas: tous les caractères distincts, `U = n!`, même ordre que 8.7. Meilleur cas: tous égaux, `U = 1`, et l'arbre est un seul chemin.

---

## 6. Cas limites et erreurs courantes

Les interviewers touchent à ceux-ci:

* **Tous identiques** (`"aaaa"`) → exactement un résultat. La map a une clé; à chaque étape un seul choix.
* **Tous distincts** (`"abcd"`) → `24` résultats. Le code fréquences doit encore marcher.
* **Chaîne vide** → une permutation vide (si c'est ton cas de base).
* **Null** → liste vide; ne fais pas de NPE sur `s.length()`.
* **Un seul caractère** → liste de cette chaîne d'un char.
* **Beaucoup d'une lettre, peu d'une autre** (`"aaab"`) → `4` résultats uniques (`aaab`, `aaba`, `abaa`, `baaa`). Formule: `4! / 3! = 4`.

Erreurs courantes:

1. **Générer toutes les permutations par swap et les mettre dans un Set.** Marche en démo, gaspille des branches. Dis la formule de décompte, puis élague à la source.
2. **Sauter seulement "égal au précédent" après tri, mais oublier de trier ou de sauter correctement.** Le motif sort-and-skip peut aussi marcher pour les permutations si tu marques les indices utilisés avec soin. La carte de fréquences est plus claire pour les multiensembles.
3. **Oublier de restaurer les comptes** au retour. La branche sœur voit un stock faux.
4. **Muter le key set de la map pendant l'itération** sans copie. Copie les clés ou utilise un tableau.
5. **Renvoyer des chaînes de longueur partielle.** Arrête seulement quand `path.length() == n`.
6. **Traiter `"Ab"` avec case-fold sans qu'on le demande.** Reste sur les chars exacts sauf s'ils redéfinissent l'égalité.

---

## 7. Résumé pour un ami

Permutations avec dups, version entretien:

1. Compte combien de chaque caractère il te reste.
2. Construis la réponse un caractère à la fois.
3. À chaque étape, essaie chaque caractère dont le compte restant est positif. N'essaie jamais "quelle copie physique de `a`" séparément.
4. Décrémente, récursive, restaure.
5. Quand la longueur du path atteint `n`, enregistre la chaîne.
6. La taille du résultat est `n! / ∏ fi!`, pas `n!`.
7. Même squelette que 8.7; la map remplace le set d'indices utilisés et les doublons s'effondrent tout seuls.

Si tu peux dessiner l'arbre à trois feuilles pour `"aab"` et expliquer pourquoi deux tuiles `a` identiques partagent une branche, tu maîtrises le problème 8.8. Ensuite, la génération de parenthèses équilibrées utilise un backtrack voisin du type "choisis le prochain symbole légal".

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Permutations sans doublons](/blog/fr/ctci-8-7-permutations-without-dups)
* Suivant: [Parens](/blog/fr/ctci-8-9-parens)