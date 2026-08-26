---
title: "Binary to String: afficher une fraction en bits ou ERROR (Java)"
description: "Probleme style CTCI 5.2 pour debutants: prendre un double dans (0, 1), afficher sa chaine de fraction binaire, ou ERROR s'il faut plus de 32 bits apres le point. Methode multiplier-par-2 en Java simple."
date: "2026-04-16"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-2-binary-to-string.webp
previewImage: /assets/images/ctci-5-2-binary-to-string.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Probleme style CTCI 5.2 pour debutants: prendre un double dans (0, 1), afficher sa chaine de fraction binaire, ou ERROR s'il faut plus de 32 bits apres le point. Methode multiplier-par-2 en Java simple.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as un verre doseur marque seulement en moities, quarts, huitièmes, et ainsi de suite. Quelqu'un verse un peu d'eau: plus que vide, moins que plein. Tu veux ecrire a quel point c'est plein avec seulement des 0 et des 1 apres un point binaire: `0.101` veut dire moitie plus un huitième. Certaines quantites tiennent dans une courte chaine binaire. D'autres demandent des marques de plus en plus petites sans fin. Si tu n'as plus de place apres 32 marques, tu t'arretes et tu dis ERROR. C'est **binary to string** pour un nombre reel entre 0 et 1.

Cet article est un enseignement original pour debutants en **Java**. Meme famille de problemes que les questions d'entretien classiques sur les bits et les doubles fractionnaires, pas une copie de livre. Fait partie de la [serie CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 5, manipulation de bits, probleme 5.2.

---

## 1. Analogie du quotidien

Pense aux fractions binaires comme aux fractions decimales, mais en base 2.

En decimal, `0.75` signifie:

```
7 * (1/10) + 5 * (1/100)
```

En binaire, `0.11` signifie:

```
1 * (1/2) + 1 * (1/4) = 0.75
```

Donc chaque place apres le point binaire pese la moitie de la precedente: 1/2, 1/4, 1/8, 1/16, ...

Comment trouver ces bits sans deviner? Un truc d'ecole en decimal est de multiplier par 10 et d'arracher le chiffre suivant. Ici tu **multiplies par 2** et tu arraches le bit suivant:

1. Pars de `num` dans (0, 1).
2. `num = num * 2`.
3. Si le resultat vaut au moins 1, le bit suivant est `1`, et tu soustrais 1 pour ne garder que la partie fractionnaire.
4. Si le resultat reste inferieur a 1, le bit suivant est `0`.
5. Repete jusqu'a ce que la fraction soit exactement 0 (termine) ou que tu aies deja ecrit 32 bits avec un reste (ERROR).

Pourquoi ca marche: multiplier par 2 decale le point binaire d'une place vers la gauche. Le bit entier qui sort est exactement le prochain chiffre binaire apres le point.

---

## 2. Enonce en mots simples

**Entree:** un `double num` avec `0 < num < 1` (strictement entre 0 et 1).

**Sortie:** un `String` de la forme `"0."` suivi de chiffres binaires, par exemple `"0.101"`. Si la valeur ne peut pas etre representee **exactement** avec au plus **32** bits apres le point binaire, renvoyer `"ERROR"`.

**Exemples:**

| Entree (decimal) | Chaine binaire | Pourquoi |
| --- | --- | --- |
| `0.5` | `"0.1"` | une moitie |
| `0.25` | `"0.01"` | un quart |
| `0.75` | `"0.11"` | moitie + quart |
| `0.625` | `"0.101"` | moitie + huitième |
| `0.1` | `"ERROR"` | 0.1 est periodique en binaire; il n'atteint pas 0 exact en 32 bits |
| `0.0` ou `1.0` | hors plage | le probleme suppose strictement entre 0 et 1 |

**Clarifie avant de coder:**

* 0 ou 1 sont autorises? (Enonce classique: entre 0 et 1, sans les bornes.)
* On renvoie le string ou on l'imprime? (Les deux marchent; renvoyer est plus simple a tester.)
* La limite est 32 bits apres le point, ou 32 caracteres au total avec `"0."`? (Dis les deux a voix haute. Cet article utilise **32 bits apres le point**, l'intention habituelle au code.)
* Bruit flottant: un vrai `double` est deja binaire. On veut quand meme la boucle multiplier-par-2 et le chemin ERROR pour les cas non terminants.

Pour cet article: `double` dans (0, 1), renvoyer `"0." + bits` ou `"ERROR"`, max 32 bits apres le point.

---

## 3. Reflechis d'abord

### Ce qu'il ne faut pas faire

* Appeler `Integer.toBinaryString` sur le double entier. C'est pour les entiers, pas la partie fractionnaire.
* Afficher `Double.toHexString` ou la notation scientifique. Mauvais format.
* Supposer que toute fraction decimale a une forme binaire courte. Beaucoup non. `0.1` en decimal est le contre-exemple classique, comme `1/3 = 0.333...` en decimal.

### Boucle centrale: multiplier par 2

```
builder = "0."
while num > 0:
    if builder length (bits apres le point) deja 32:
        return ERROR
    num = num * 2
    if num >= 1:
        append '1'
        num = num - 1
    else:
        append '0'
return builder
```

Arrete-toi quand `num` devient 0: representation exacte.

S'il faudrait un 33e bit, renvoie ERROR.

### Pourquoi certains nombres ne finissent jamais

Toute fraction dont le denominateur (sous forme irreductible) a un facteur premier autre que 2 ne peut pas etre un developpement binaire fini. Decimal `0.1` vaut `1/10`. Dix a un facteur 5, donc le developpement binaire de 0.1 se repete. La boucle produit des bits et ne tombe jamais sur 0 exact. Apres 32 pas, tu abandonnes a juste titre.

### Point flottant (dis-le une fois, puis avance)

Un `double` Java est deja stocke en binaire IEEE-754. Donc "affiche le binaire de ce double" peut aussi vouloir dire "lis les bits de la mantisse." L'entretien 5.2 est en general la version **algorithmique**: developpe le nombre reel par multiplier-par-2, et ERROR s'il ne termine pas en 32 bits. Compare a 0 avec soin; pour enseigner on garde la boucle simple. En production on peut borner avec un epsilon, mais en entretien on veut la regle ERROR propre.

---

## 4. Solution Java

```java
/**
 * Binary representation of a real number strictly between 0 and 1.
 * Returns "0." followed by bits, or "ERROR" if more than 32 bits are needed.
 */
String binaryToString(double num) {
    if (num <= 0 || num >= 1) {
        return "ERROR";
    }

    StringBuilder bits = new StringBuilder("0.");
    int maxBits = 32;

    while (num > 0) {
        if (bits.length() - 2 >= maxBits) {
            // Already used 32 places after the point and still not zero.
            return "ERROR";
        }

        num = num * 2;
        if (num >= 1) {
            bits.append('1');
            num = num - 1;
        } else {
            bits.append('0');
        }
    }

    return bits.toString();
}
```

### Parcours: `0.625`

| Etape | `num` avant | apres `* 2` | bit | `num` apres |
| --- | --- | --- | --- | --- |
| 1 | 0.625 | 1.25 | `1` | 0.25 |
| 2 | 0.25 | 0.5 | `0` | 0.5 |
| 3 | 0.5 | 1.0 | `1` | 0.0 |

Resultat: `"0.101"`. La boucle s'arrete car `num` vaut 0.

### Parcours: `0.1` (donnera ERROR)

| Etape | idee |
| --- | --- |
| 1 | `0.1 * 2 = 0.2` → bit `0` |
| 2 | `0.2 * 2 = 0.4` → bit `0` |
| 3 | `0.4 * 2 = 0.8` → bit `0` |
| 4 | `0.8 * 2 = 1.6` → bit `1`, reste `0.6` |
| ... | les bits continuent; le reste ne tombe pas sur 0 exact en 32 pas |

Apres 32 bits apres le point, renvoie `"ERROR"`.

### Tests minimaux

```java
public static void main(String[] args) {
    System.out.println(binaryToString(0.5));    // 0.1
    System.out.println(binaryToString(0.25));   // 0.01
    System.out.println(binaryToString(0.75));   // 0.11
    System.out.println(binaryToString(0.625));  // 0.101
    System.out.println(binaryToString(0.1));    // ERROR
    System.out.println(binaryToString(0.0));    // ERROR (out of range here)
    System.out.println(binaryToString(1.0));    // ERROR
}
```

Note: sur certaines JVM, un litteral comme `0.1` a deja un arrondi flottant. La boucle ne redescend quand meme pas a 0 exact en 32 bits pour les valeurs typiques qui ne sont pas des rationnels dyadiques (fractions a denominateur puissance de 2). C'est ce qu'on veut pour le chemin ERROR.

---

## 5. Tableau de complexite

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Boucle multiplier par 2 | O(1) | O(1) | Au plus 32 iterations; string de longueur ≤ 34 (`"0."` + 32 bits) |
| Precalculer toutes les fractions dyadiques | O(1) ou pire | plus grand | Trop lourd; on veut la boucle |
| Bit-twiddle de la mantisse IEEE | O(1) | O(1) | Autre probleme: vider les bits stockes, pas "ERROR si pas exact en 32" |

Borne a 32 pas, temps et espace sont constants pour l'entretien.

---

## 6. Cas limites et erreurs courantes

Les intervieweurs touchent ceux-ci:

* **Exactement 0 ou 1** → invalide pour ce probleme, ERROR ou rejet d'emblee.
* **Exactement 0.5, 0.25, 0.125, ...** → binaire fini; doit s'afficher proprement et s'arreter.
* **Reste encore au 32e bit** → ERROR. L'off-by-one sur la longueur est frequent.
* **Comparer a `== 0` pour toujours** → pour les vraies fractions non dyadiques, le plafond de longueur compte. Ne tourne pas a l'infini.
* **Oublier le prefixe `"0."`** → le format compte en entretien.
* **Utiliser un cast int au lieu de `>= 1`** → `(int) num` apres multiplication marche si num est dans [0, 2), mais `>= 1` est plus clair.
* **Pousser des bits dans un char[32] sans compter** → facile de depasser la limite mentale.

Erreurs courantes:

1. **Verifier la longueur apres l'append, pas avant.** Tu peux emettre 33 bits une fois. Verifie avant chaque nouveau bit (ou apres avec `> 32`, de facon coherente).
2. **`num *= 2` puis toujours soustraire 1.** Soustrais seulement quand le bit vaut 1.
3. **Boucle infinie sans longueur max.** Tout le sens de ERROR est le budget de 32 bits.
4. **Confondre budget de caracteres et budget de bits.** Accorde la regle avant de coder.
5. **Croire que ERROR veut seulement dire "mauvaise entree".** ERROR veut aussi dire "impossible a representer exact en 32 bits."

---

## 7. Resume a raconter a un ami

Binary to String demande: ecrire un double entre 0 et 1 comme `"0."` plus des chiffres binaires, ou ERROR s'il ne tient pas en 32 bits apres le point.

1. Chaque bit est la prochaine valeur de place: 1/2, 1/4, 1/8, ...
2. Multiplie la fraction par 2. La partie entiere (0 ou 1) est le bit suivant. Garde le reste fractionnaire.
3. Arrete-toi quand le reste est 0: representation exacte.
4. S'il faut plus de 32 bits, renvoie `"ERROR"`.
5. Beaucoup de decimaux du quotidien (comme 0.1) ne terminent jamais en binaire. Le plafond n'est pas optionnel.

Si tu peux parcourir `0.625 → 0.101` au tableau et expliquer pourquoi `0.1` donne ERROR, tu maitrises le 5.2.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Insertion](/blog/fr/ctci-5-1-insertion)
* Suivant: [Flip Bit to Win](/blog/fr/ctci-5-3-flip-bit-to-win)