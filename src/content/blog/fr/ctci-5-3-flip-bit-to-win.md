---
title: "Flip Bit to Win: plus longue série de 1 après un flip (Java)"
description: "Problème style CTCI 5.3 pour débutants: inverser un bit 0 dans un entier pour maximiser les 1 consécutifs. Suivre les runs de uns séparés par des zéros, fusionner à travers un seul zéro, Java clair."
date: "2026-01-16"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
previewImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.3 pour débutants: inverser un bit 0 dans un entier pour maximiser les 1 consécutifs. Suivre les runs de uns séparés par des zéros, fusionner à travers un seul zéro, Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu regardes une rangée d'interrupteurs. La plupart sont ALLUMÉS. Quelques-uns sont ÉTEINTS. Tu peux basculer **exactement un** ÉTEINT vers ALLUMÉ. Tu veux le plus long tronçon de lumières ALLUMÉES d'affilée. C'est **Flip Bit to Win**: un passage gratuit de zéro à un, puis la mesure de la plus longue run de uns.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de runs de bits en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 5, manipulation de bits, problème 5.3.

---

## 1. Analogie du quotidien

Imagine une bande de stationnement peinte en places alignées. Une place pleine est un `1`. Une vide est un `0`. Tu as **un** remplissage gratuit: tu choisis une place vide et tu la peins pleine.

Si deux blocs pleins encadrent une seule place vide, la remplir les joint en un long bloc. S'il y a deux vides d'affilée, n'en remplir qu'une ne joint pas les blocs extérieurs. Tu allonges quand même une run locale, mais le trou de deux vides reste cassé.

Le travail n'est pas "compter tous les uns". C'est "trouver le meilleur endroit où dépenser ton seul remplissage".

---

## 2. Énoncé en mots simples

**Entrée:** un entier 32 bits `n` (pense en bits; en entretien on parle souvent d'un mot de largeur fixe, souvent 32).

**Sortie:** la longueur de la plus longue séquence de bits `1` que tu peux créer en basculant **au plus un** bit `0` vers `1`. (Si le nombre est déjà tout en uns, la réponse est la largeur complète du mot.)

**Exemples** (binaire avec le bit de poids faible à droite):

| Idée d'entrée | Binaire (bits bas) | Meilleur flip | Longueur |
| --- | --- | --- | --- |
| classique 1775 | `11011101111` | le zéro entre `111` et `1111` | 8 |
| `0b11011` | `11011` | le zéro du milieu | 5 |
| `0b110011` | `110011` | l'un des zéros isolés | 3 (ne joint pas les deux paires) |
| `0` | tout zéros | n'importe quel bit | 1 |
| `-1` (tous uns en complément à deux) | 32 uns | aucun besoin | 32 |
| `0b111` | `111` | un zéro au-dessus de la run | 4 |

**Clarifie avant de coder:**

* Largeur de mot? (`int` 32 bits ici. Utilise `Integer.SIZE`.)
* Doit-on basculer, ou "déjà optimal" suffit? (Si déjà tous uns, renvoie 32.)
* Entiers signés: parcours avec décalage **logique** `>>>` pour que le bit de signe ne reste pas collé.
* Renvoie la longueur, pas l'entier basculé (sauf si on demande les deux).

---

## 3. Réfléchis d'abord

### Idée brute (dis-la, ne la code pas)

Pour chaque position à 0, bascule, cherche la plus longue run de uns, annule. C'est O(b²) pour une largeur b (32 ou 64). Correct pour un petit b, mauvais réflexe.

### Meilleure idée: runs de uns séparées par des zéros

Parcours les bits une fois. Garde:

* `currentLength`: combien de uns d'affilée se terminent sur le bit que tu viens de traiter.
* `previousLength`: combien de uns se trouvaient **juste avant le zéro le plus récent** encore utilisable comme pont.
* `maxLength`: meilleure réponse jusqu'ici.

Si le bit courant est `1`, augmente `currentLength`.

Si le bit courant est `0`:

* La run de uns qui vient de finir peut devenir le côté gauche d'une fusion future.
* Regarde un bit plus loin. Si le **suivant** est aussi `0`, deux zéros d'affilée: tu ne peux pas utiliser ce zéro comme pont vers une run ultérieure qui a encore un autre zéro au milieu. Mets `previousLength = 0`.
* Si le suivant est `1`, mets `previousLength = currentLength`.
* Remets `currentLength = 0`.

Après chaque bit, la meilleure fusion qui utilise le zéro le plus récent comme flip est:

```
previousLength + 1 + currentLength
```

Le `+ 1` est le zéro basculé. Mets à jour `maxLength` avec cette valeur.

Si le nombre est tout uns (`~n == 0` sur toute la largeur), renvoie tout de suite la taille du mot.

### Pourquoi regarder un bit plus loin marche

Tu as seulement besoin de savoir si le zéro que tu viens de toucher est un séparateur **simple** ou le début d'un double trou. `(n & 2) == 0` signifie "le bit suivant est aussi zéro" tant que le zéro courant est encore dans le bit bas. En code, tu testes avant de décaler, avec la valeur courante de `n`.

### Modèle mental alternatif: liste de séquences

Construis une liste de longueurs de runs en alternant zéros et uns, par exemple:

```
11011101111  →  uns:2, zéro:1, uns:3, zéro:1, uns:4
```

Pour chaque run de zéros de longueur 1, candidat = uns gauche + 1 + uns droite. Si la run de zéros est plus longue que 1, le meilleur flip local n'allonge qu'une run voisine de 1. Prends le max global. Même réponse, plus de mémoire. Le balayage prev/curr en O(1) d'espace est le défaut d'entretien.

---

## 4. Solution Java

```java
/**
 * Longest run of 1-bits after flipping at most one 0-bit to 1.
 * Assumes a 32-bit word (Integer.SIZE).
 */
int flipBitToWin(int n) {
    // Already all ones: no flip needed.
    if (~n == 0) {
        return Integer.SIZE;
    }

    int currentLength = 0;
    int previousLength = 0;
    int maxLength = 1; // flipping one zero in a sea of zeros still yields length 1

    while (n != 0) {
        if ((n & 1) == 1) {
            currentLength++;
        } else {
            // Current bit is 0. If the next bit is also 0, no useful left run to keep.
            previousLength = ((n & 2) == 0) ? 0 : currentLength;
            currentLength = 0;
        }
        maxLength = Math.max(previousLength + 1 + currentLength, maxLength);
        n >>>= 1; // logical shift; do not sign-extend
    }

    return maxLength;
}
```

### Parcours: 1775 (`11011101111`)

Bits du bas vers le haut tels que la boucle les voit: `1 1 1 1 0 1 1 1 0 1 1`.

| Bit | Action | prev | curr | max |
| --- | --- | --- | --- | --- |
| 1 | ones++ | 0 | 1 | 2 |
| 1 | ones++ | 0 | 2 | 3 |
| 1 | ones++ | 0 | 3 | 4 |
| 1 | ones++ | 0 | 4 | 5 |
| 0 | suivant est 1 → prev=4, curr=0 | 4 | 0 | 5 |
| 1 | ones++ | 4 | 1 | 6 |
| 1 | ones++ | 4 | 2 | 7 |
| 1 | ones++ | 4 | 3 | 8 |
| 0 | suivant est 1 → prev=3, curr=0 | 3 | 0 | 8 |
| 1 | ones++ | 3 | 1 | 8 |
| 1 | ones++ | 3 | 2 | 8 |

Réponse **8**: bascule le zéro entre le bloc de trois uns et celui de quatre uns.

### Parcours: `0b110011` (ne joint pas les deux paires)

Uns, uns, zéro, zéro, uns, uns. Au premier zéro, le suivant est aussi zéro, donc `previousLength` devient 0. Les uns suivants ne rejoignent jamais la première paire. Meilleure longueur: 3.

### Tests minimaux

```java
public static void main(String[] args) {
    System.out.println(flipBitToWin(1775));      // 8
    System.out.println(flipBitToWin(0b11011));   // 5
    System.out.println(flipBitToWin(0b110011));  // 3
    System.out.println(flipBitToWin(0));         // 1
    System.out.println(flipBitToWin(-1));        // 32
    System.out.println(flipBitToWin(0b111));     // 4
}
```

---

## 5. Table de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Basculer chaque zéro, rescanner | O(b²) | O(1) | b = largeur du mot (32/64); simple mais faible |
| Un passage prev/curr | O(b) | O(1) | réponse préférée en entretien |
| Liste de longueurs de runs | O(b) | O(b) | image claire; plus d'allocation |

Pour un `int` 32 bits, O(b) est constant en pratique. Dis quand même O(b) à voix haute.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers tapent ici:

* **Tous uns (`-1`)** → renvoie `Integer.SIZE` (32). Cas spécial en tête.
* **Tous zéros (`0`)** → renvoie 1 (bascule n'importe quel bit).
* **Un seul un** → renvoie 2 s'il existe un zéro à côté; la formule `previousLength + 1 + currentLength` le couvre.
* **Deux zéros d'affilée** → ne garde pas un `previousLength` périmé. La branche `(n & 2) == 0` le vide.
* **Uns en haut du mot** → quand `n` devient 0 la boucle s'arrête; les zéros hauts n'ajoutent rien au-delà de ce que la formule a déjà marqué en consommant les uns.
* **`>>` arithmétique au lieu de `>>>`** → sur les négatifs le bit de signe se répète sans fin. Utilise le décalage logique pour les scans de bits.

Erreurs fréquentes:

1. **Oublier le raccourci tous-uns.** Sans lui le code marche parfois encore, mais l'intention est plus claire avec `if (~n == 0)`.
2. **Partir de `maxLength = 0`.** Alors l'entrée tout zéros renvoie 0. Tu peux toujours créer un un.
3. **Mettre `previousLength = currentLength` à chaque zéro sans regarder le bit suivant.** Les doubles trous fusionneraient à tort.
4. **Renvoyer le nombre basculé au lieu de la longueur.** Relis la demande.
5. **Construire une chaîne de 32 caractères et scanner avec `charAt`.** Ça marche, ça ralentit la réflexion, facile de se tromper d'un cran. Préfère l'arithmétique sur `n`.

---

## 7. Explique à un ami

Flip Bit to Win demande: bascule au plus un zéro en un, quelle est la plus longue série de uns?

1. Si le mot est déjà tout uns, la réponse est la largeur (32).
2. Parcours les bits avec un décalage logique. Suis la run courante de uns et la run avant le dernier zéro utile.
3. Sur un zéro, si le suivant est aussi zéro, jette la run gauche sauvée. Sinon, sauve la run que tu viens de finir comme côté gauche.
4. Après chaque bit, le candidat est run gauche + 1 (le flip) + run droite jusqu'ici.
5. Un passage, mémoire extra constante, facile à dessiner avec le 1775 qui donne 8.

Si tu marques le meilleur zéro à basculer sur `11011101111` et expliques pourquoi `110011` plafonne à 3, tu maîtrises le 5.3.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Binary to String](/blog/fr/ctci-5-2-binary-to-string)
* Suivant: [Next Number](/blog/fr/ctci-5-4-next-number)