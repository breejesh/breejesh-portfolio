---
title: "Debugger: Ce que ((n & (n-1)) == 0) vérifie vraiment (Java)"
description: "Problème style CTCI 5.5 pour débutants: prouver que n & (n-1) vaut zéro seulement quand n a au plus un bit à 1. Puissance de deux, le piège du zéro, parcours en binaire et code Java."
date: "2026-01-25"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-5-debugger.webp
previewImage: /assets/images/ctci-5-5-debugger.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.5 pour débutants: prouver que n & (n-1) vaut zéro seulement quand n a au plus un bit à 1. Puissance de deux, le piège du zéro, parcours en binaire et code Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Quelqu'un colle cette ligne dans une revue de code et demande à quoi elle sert:

```java
((n & (n - 1)) == 0)
```

On dirait une énigme. Pas de boucle. Pas de division. Une soustraction, un AND, une comparaison. Réponse courte: **c'est vrai quand `n` a au plus un bit à 1**. Pour les entiers positifs, c'est exactement "est-ce que `n` est une puissance de deux?" (`1, 2, 4, 8, 16, ...`). Zéro rend aussi l'expression vraie, donc en prod on ajoute presque toujours `n > 0`.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les questions classiques de bits en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 5, manipulation de bits, problème 5.5.

---

## 1. Analogie du quotidien

Imagine un couloir d'interrupteurs. Chaque interrupteur est un bit: allumé = 1, éteint = 0. Une **puissance de deux** est un couloir avec **exactement une** lumière allumée. Une lampe, n'importe où. C'est `1` (seule la plus à droite), `2` (seule la suivante), `4`, `8`, et ainsi de suite. Deux lumières allumées veulent dire que le nombre est la somme de deux puissances distinctes, pas une puissance pure.

Le coup malin: **éteindre la lumière allumée la plus à droite**, sans parcourir tout le couloir.

C'est ce que fait `n & (n - 1)`. Soustraire un inverse chaque bit depuis le 1 le plus bas jusqu'aux zéros de droite. L'AND avec le `n` d'origine tue ce 1 le plus bas et laisse les bits plus hauts intacts.

* S'il n'y avait qu'une lumière, après l'avoir éteinte le couloir est noir: résultat `0`.
* S'il y en avait deux ou plus, tuer la plus à droite laisse les autres: résultat non `0`.

Donc `((n & (n - 1)) == 0)` demande: "le couloir est-il noir après avoir soufflé la lampe allumée la plus basse?" Autrement dit: "y avait-il zéro ou un bit positionné?"

---

## 2. Énoncé en mots simples

**Entrée:** un entier `n` (en entretien on parle souvent d'un `int` non négatif, ou au moins on le dit).

**Tâche:** expliquer ce que vérifie cette expression, et quand l'utiliser:

```java
(n & (n - 1)) == 0
```

**Ce que cela veut dire en clair:**

* Vrai quand `n` a **zéro ou un** bit à 1 dans son motif (pour les valeurs non négatives, comme on s'y attend).
* Pour **`n > 0`**, c'est équivalent à: **`n` est une puissance de deux**.
* Pour **`n == 0`**, l'expression est aussi vraie (`0 & (-1) == 0` en complément à deux), mais **0 n'est pas une puissance de deux**.

**Exemples (côté positif):**

| `n` | Binaire (bits bas) | `n - 1` | `n & (n - 1)` | Expression | Puissance de 2? |
| --- | --- | --- | --- | --- | --- |
| 1 | `0001` | `0000` | `0000` | true | oui |
| 2 | `0010` | `0001` | `0000` | true | oui |
| 3 | `0011` | `0010` | `0010` | false | non |
| 4 | `0100` | `0011` | `0000` | true | oui |
| 5 | `0101` | `0100` | `0100` | false | non |
| 6 | `0110` | `0101` | `0100` | false | non |
| 8 | `1000` | `0111` | `0000` | true | oui |
| 0 | `0000` | tous 1 | `0000` | true | **non** (piège) |

**Clarifie avant de coder:**

* Traite-t-on 0 comme cas spécial? (Oui: exiger `n > 0` pour "puissance de deux".)
* Entrées négatives? En Java, `int` est signé. Les puissances de deux se définissent sur des magnitudes positives. Préférer rejeter `n <= 0`.
* 32 ou 64 bits? Le même truc marche sur `int` et `long`.
* Seulement une explication, ou une méthode helper? Les deux arrivent. Ce problème est souvent "qu'est-ce que ça vérifie?", pas "implémente depuis zéro".

---

## 3. Réfléchir d'abord

### À quoi ressemble une puissance de deux en binaire

Toute puissance de deux positive est un seul `1` suivi de zéros:

```
 1 = 0000 0001
 2 = 0000 0010
 4 = 0000 0100
 8 = 0000 1000
16 = 0001 0000
```

Tout autre entier positif a au moins deux bits à 1, ou un mélange (par exemple `6 = 0110`, `7 = 0111`, `12 = 1100`).

Donc "est puissance de deux" = "exactement un bit à 1" pour `n > 0`.

### Pourquoi soustraire un, puis AND

Prends `n = 12` (`1100` sur les bits bas). Le bit 1 le plus bas est le bit 2 (valeur 4).

```
n     = ... 1100
n - 1 = ... 1011
AND   = ... 1000   // le 1 bas disparaît; le 1 haut reste
```

Prends `n = 8` (`1000`):

```
n     = ... 1000
n - 1 = ... 0111
AND   = ... 0000   // un seul 1 existait; plus aucun
```

Règle à dire à voix haute:

> **`n & (n - 1)` éteint le bit 1 le moins significatif de `n`.**

Si après extinction le résultat est zéro, il ne restait aucun autre 1. Donc soit `n` valait 0, soit `n` avait exactement un 1.

### Pourquoi c'est une question "debugger" appréciée

Les interviewers l'aiment parce que:

1. Soit tu connais le truc du bit le plus bas, soit tu le redécouvres avec quelques exemples sur papier.
2. Le cas zéro sépare ceux qui mémorisent la ligne de ceux qui la comprennent.
3. C'est O(1) et peu branché face à une boucle sur les bits ou un helper de bibliothèque (même si `Integer.bitCount(n) == 1` reste une alternative lisible).

### Autres façons qui marchent aussi

* **Boucle / comptage de bits:** compte les bits à 1; puissance de deux ssi le compte vaut 1. Plus clair pour certains.
* **Division par deux:** tant que pair, diviser par 2; finir à 1. Facile de se tromper sur 0 et les négatifs.
* **`n > 0 && (n & -n) == n`:** un autre classique. `n & -n` isole le bit 1 le plus bas. Si cela égale `n`, seul ce bit était positionné.

Pour ce problème, reste sur l'explication de `n & (n - 1)`.

---

## 4. Solution Java

### Forme pure explication (ce que l'expression vérifie)

```java
// Vrai quand n a au plus un bit à 1 (inclut n == 0).
boolean atMostOneBitSet(int n) {
    return (n & (n - 1)) == 0;
}
```

### Puissance de deux (ce que tu veux presque toujours)

```java
/**
 * Renvoie true si n est une puissance de deux positive (1, 2, 4, 8, ...).
 * Utilise le fait que n & (n - 1) éteint le bit 1 le plus bas.
 */
boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Même idée sur long

```java
boolean isPowerOfTwo(long n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Alternative lisible (bien en production; à mentionner en entretien)

```java
boolean isPowerOfTwoBitCount(int n) {
    return n > 0 && Integer.bitCount(n) == 1;
}
```

On peut encore te demander la forme masque pour prouver que tu comprends les bits sans t'appuyer sur la bibliothèque.

### Optionnel: isoler le bit 1 le plus bas (astuce liée)

```java
// Isole le bit 1 le plus bas de n (si n != 0).
int lowestSetBit(int n) {
    return n & -n;
}

boolean isPowerOfTwoIsolate(int n) {
    return n > 0 && (n & -n) == n;
}
```

Mêmes réponses oui/non pour les puissances de deux que `n & (n - 1)`, autre micro-expression. Connais les deux noms si tu les as déjà vus.

---

## 5. Parcours des cas classiques

### Cas A: puissance de deux (`n = 16`)

```
n        = 0001 0000
n - 1    = 0000 1111
n & (n-1)= 0000 0000   → expression true
n > 0    → isPowerOfTwo true
```

### Cas B: pas une puissance de deux (`n = 10`)

```
n        = 0000 1010
n - 1    = 0000 1001
n & (n-1)= 0000 1000   → pas zéro → false
```

Deux bits à 1 (8 et 2). Effacer le plus bas laisse le 8.

### Cas C: le piège du zéro (`n = 0`)

```
n        = 0000 0000
n - 1    = 1111 1111   // pour int: -1, tous les bits à 1
n & (n-1)= 0000 0000   → expression true, mais pas une puissance de deux
```

Dis toujours: **l'expression brute accepte 0; les helpers puissance de deux doivent le rejeter.**

### Cas D: un (`n = 1`)

```
1 est 2^0. Un bit à 1. Expression true. isPowerOfTwo true.
```

Les gens oublient que 1 est une puissance de deux. Ça l'est.

### Test rapide

```java
public static void main(String[] args) {
    int[] samples = {0, 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, 32};
    for (int n : samples) {
        boolean raw = (n & (n - 1)) == 0;
        boolean pow = n > 0 && (n & (n - 1)) == 0;
        System.out.println(n + " raw=" + raw + " powerOfTwo=" + pow);
    }
    // 0  raw=true  powerOfTwo=false
    // 1  raw=true  powerOfTwo=true
    // 2  raw=true  powerOfTwo=true
    // 3  raw=false powerOfTwo=false
    // ...
}
```

---

## 6. Complexité, bords et conseils d'entretien

| Sujet | Réponse |
| --- | --- |
| Temps | O(1) opérations mot |
| Espace extra | O(1) |
| Identité clé | `n & (n - 1)` éteint le bit 1 le plus bas |
| Puissance de deux | `n > 0 && (n & (n - 1)) == 0` |
| Zéro | expression true; pas une puissance de deux |
| Un | puissance de deux (`2^0`) |
| Négatifs | ne les appelle pas puissances de deux ici; utilise `n > 0` |
| Usage lié | boucle de comptage de Kernighan: `while (n != 0) { n &= n - 1; count++; }` compte les bits en éteignant le plus bas encore et encore |

**Erreurs fréquentes:**

1. **Oublier `n > 0`.** Tu livres un test "puissance de deux" qui renvoie true pour 0.
2. **Dire que l'expression "vérifie la puissance de deux" sans le bémol du zéro.** Précis: au plus un bit positionné; puissance de deux seulement avec positivité.
3. **Croire que `n & (n + 1)` fait la même chose.** Non. Reste sur `n - 1`.
4. **Mélanger "éteint le bit 1 le plus bas" et "inverse tous les bits".** La soustraction touche le 1 le plus bas et les zéros de droite; l'AND retire ensuite ce 1 le plus bas.
5. **Bâcler les négatifs.** En Java, un test positif explicite vaut mieux qu'inventer un sens pour des puissances négatives si on ne te le demande pas.

**Comment le raconter (version 30 secondes):**

1. Les puissances de deux ont exactement un bit à 1.
2. `n & (n - 1)` éteint le bit 1 le plus bas.
3. Si le résultat est 0, il y avait zéro ou un bit positionné.
4. Ajoute `n > 0` pour que zéro ne passe pas comme puissance de deux.

**Où ça apparaît hors énigme:**

* Valider des tailles de buffer qui doivent être une puissance de deux (certains ring buffers, capacités de tables de hachage dans d'anciens designs).
* Contrôles rapides avant des algorithmes qui utilisent des masques de largeur `n`.
* Dans des boucles de comptage et de bit-twiddling (éteindre le bit le plus bas à répétition).

---

## 7. Récap à expliquer à un ami

Debugger (problème 5.5) n'est pas "construire un débogueur". C'est: **que vérifie `((n & (n - 1)) == 0)`?**

1. Soustraire un puis AND éteint le bit 1 le moins significatif de `n`.
2. Si le produit est zéro, `n` n'avait pas de second 1: zéro ou un bit positionné.
3. Les entiers positifs avec exactement un bit à 1 sont les puissances de deux: `1, 2, 4, 8, ...`.
4. Écris `n > 0 && (n & (n - 1)) == 0` quand tu veux puissance de deux.
5. Zéro rend l'expression brute vraie. C'est le piège qui rapporte des points de suivi.

Si tu peux parcourir `8` et `10` en binaire, expliquer pourquoi zéro est spécial, et écrire la ligne avec le test positif, tu maîtrises le 5.5.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Next Number](/blog/fr/ctci-5-4-next-number)
* Suivant: [Conversion](/blog/fr/ctci-5-6-conversion)