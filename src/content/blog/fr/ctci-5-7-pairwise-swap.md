---
title: "Pairwise Swap: échanger bits impairs et pairs avec des masques (Java)"
description: "Problème style CTCI 5.7 pour débutants: échange chaque paire de bits impair et pair dans un int. Masques 0xaaaaaaaa et 0x55555555, un décalage de chaque côté, OR des moitiés."
date: "2025-11-10"
tags: [Algorithmes]
coverImage: /assets/images/ctci-5-7-pairwise-swap.webp
previewImage: /assets/images/ctci-5-7-pairwise-swap.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.7 pour débutants: échange chaque paire de bits impair et pair dans un int. Masques 0xaaaaaaaa et 0x55555555, un décalage de chaque côté, OR des moitiés.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu alignes 32 personnes sur les places numérotées de 0 à 31. La place 0 et la place 1 échangent. La 2 et la 3 échangent. La 4 et la 5, et ainsi de suite. Tout le monde bouge en même temps. Personne ne saute sa paire. C'est le **pairwise swap** sur les bits d'un entier: chaque bit pair change de place avec le bit impair voisin.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les questions classiques de bits en entretien, pas une copie du livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 5, manipulation de bits, problème 5.7.

---

## 1. Analogie du quotidien

Imagine une rangée d'interrupteurs. Ils vont par paires: (0, 1), (2, 3), (4, 5), ... Pour chaque paire tu échanges quel interrupteur physique "porte" l'état on/off de son voisin. Si le 0 était allumé et le 1 éteint, après le 0 est éteint et le 1 allumé. Les autres paires font la même chose en parallèle.

Tu ne **renverses pas** toute la rangée. Tu ne **décales pas** tout le mot d'un cran. Tu n'échanges qu'à l'intérieur de chaque paire adjacente.

Sur le papier, ça ressemble à une boucle de 16 paires. En bits, tu le fais en quelques instructions avec des masques.

---

## 2. Énoncé en mots simples

**Entrée:** un `int` 32 bits `x` (largeur fixe).

**Sortie:** un `int` où le bit `0` et le bit `1` ont échangé, le `2` et le `3`, le `4` et le `5`, jusqu'au `30` et au `31`.

**Noms (LSB = bit 0):**

* **Bits pairs:** positions `0, 2, 4, ..., 30`
* **Bits impairs:** positions `1, 3, 5, ..., 31`

Pairwise swap: pour chaque `i` dans `0, 2, 4, ...`, échange les bits en `i` et `i + 1`.

**Exemples (8 bits pour y voir clair; l'idée monte à 32):**

| Bits d'entrée (MSB→LSB) | Après pairwise swap | Pourquoi |
| --- | --- | --- |
| `0101 0110` | `1010 1001` | chaque paire `(b1 b0)` devient `(b0 b1)` |
| `0000 0001` (1) | `0000 0010` (2) | le bit 0 est allé au bit 1 |
| `0000 0010` (2) | `0000 0001` (1) | le bit 1 est allé au bit 0 |
| `1111 1111` | `1111 1111` | tout à un: le swap ne change rien |
| `0000 0000` | `0000 0000` | zéro reste zéro |

Une paire: entrée `... ab` (a = bit impair, b = bit pair) devient `... ba`.

**À clarifier avant de coder:**

* Le bit 0 est le moins significatif? (Oui dans ce billet et pour un `int` Java habituel.)
* `int` signé en Java? Oui. Préfère le **décalage droit non signé** `>>>` quand tu descends la moitié impaire, pour que le bit de signe ne remplisse pas de uns.
* Veulent-ils des ops bits O(1), pas une boucle de 16? Quand ils disent "le moins d'instructions possible", ils veulent la forme masque.

---

## 3. Réfléchis d'abord

### Boucle naïve

Pour `i = 0; i < 32; i += 2`:

1. Lis le bit `i` et le bit `i + 1`.
2. Écris le bit `i` en position `i + 1` et le bit `i + 1` en `i`.

Ça marche. Environ 16 itérations, chacune avec décalages et masques. Clair, mais pas la réponse "peu d'instructions".

### Meilleure idée: déplacer des moitiés entières d'un coup

Si tu pouvais:

1. Extraire **seulement** les bits impairs, les décaler d'**une place à droite** (ils tombent sur les slots pairs).
2. Extraire **seulement** les bits pairs, les décaler d'**une place à gauche** (ils tombent sur les slots impairs).
3. Faire un **OR** des deux résultats.

Alors chaque paire s'échange en parallèle. Pas de boucle.

Il te faut deux masques:

* **Masque impair** `0xaaaaaaaa` = binaire `1010 1010 ... 1010`. Des uns seulement sur les positions impaires.
* **Masque pair** `0x55555555` = binaire `0101 0101 ... 0101`. Des uns seulement sur les positions paires.

Souviens-toi: `0xA` est `1010`, `0x5` est `0101`. Huit chiffres hex couvrent 32 bits.

```
x          =  ... a b a b a b a b   (a = impair, b = pair)
x & 0xAA.. =  ... a 0 a 0 a 0 a 0
>>> 1      =  ... 0 a 0 a 0 a 0 a   (impairs vers slots pairs)

x & 0x55.. =  ... 0 b 0 b 0 b 0 b
<< 1       =  ... b 0 b 0 b 0 b 0   (pairs vers slots impairs)

OR         =  ... b a b a b a b a   (paires échangées)
```

C'est tout l'algo.

### Pourquoi pas `>>` pour la moitié impaire?

En Java, `>>` étend le signe. Si le bit 31 vaut 1, `x >> 1` remplit le haut de uns. Tu veux seulement que les bits impairs sélectionnés descendent d'un cran. Utilise `>>>` (décalage logique) après le masque.

---

## 4. Solution Java

```java
/**
 * Swap odd and even bits of a 32-bit int.
 * Bit 0 <-> 1, bit 2 <-> 3, ..., bit 30 <-> 31.
 */
int swapOddEvenBits(int x) {
    int oddsMovedRight = (x & 0xaaaaaaaa) >>> 1;
    int evensMovedLeft = (x & 0x55555555) << 1;
    return oddsMovedRight | evensMovedLeft;
}
```

En une ligne (mêmes ops):

```java
int swapOddEvenBits(int x) {
    return ((x & 0xaaaaaaaa) >>> 1) | ((x & 0x55555555) << 1);
}
```

Les littéraux hex vont bien. Si tu préfères des noms:

```java
private static final int ODD_BITS  = 0xaaaaaaaa; // 1010...
private static final int EVEN_BITS = 0x55555555; // 0101...

int swapOddEvenBits(int x) {
    return ((x & ODD_BITS) >>> 1) | ((x & EVEN_BITS) << 1);
}
```

### Optionnel: parcours avec une petite valeur

Prends `x = 0b_0000_0000_0000_0000_0000_0000_0010_0110`, soit `38` en décimal.

8 bits bas de 38, MSB→LSB comme `00100110` (bit 0 à droite vaut 0):

| Étape | 8 bits bas | Note |
| --- | --- | --- |
| `x` | `00100110` | bit0=0, bit1=1, bit2=1, bit3=0, bit4=0, bit5=1, bit6=0, bit7=0 |
| `x & 0xAA` | `00100010` | positions impaires seulement |
| `>>> 1` | `00010001` | impairs dans les slots pairs |
| `x & 0x55` | `00000100` | positions paires seulement (bit2) |
| `<< 1` | `00001000` | pairs dans les slots impairs |
| OR | `00011001` | valeur 25 |

Vérif manuelle des paires:

* bits (1,0): `10` → `01`
* bits (3,2): `01` → `10`
* bits (5,4): `10` → `01`
* bits (7,6): `00` → `00`

Résultat 8 bits bas: `00011001`. Ça colle.

---

## 5. Complexité et "peu d'instructions"

| Approche | Temps | Espace extra | Sensation d'instructions |
| --- | --- | --- | --- |
| Boucle sur 16 paires | O(1) (32 bits fixes), plus d'ops | O(1) | beaucoup de shifts/masques |
| Deux masques + shift + OR | O(1) | O(1) | environ 5 ops bits |

En entretien, c'est la **forme masque** qui compte, pas le big-O. Trente-deux est constant de toute façon. "Le moins d'instructions possible" veut dire: ne parcours pas bit par bit si un masque au niveau mot suffit.

Sur un `long` 64 bits tu utiliserais `0xaaaaaaaaaaaaaaaaL` et `0x5555555555555555L` de la même façon.

---

## 6. Cas limites et erreurs fréquentes

* **Tout zéro / tout un** → identité. Le swap ne change pas la valeur.
* **Nombres négatifs** → juste un motif de bits. `>>>` sur la moitié impaire garde un résultat correct; n'utilise pas `>>` arithmétique si tu comptes sur des zéros propres dans les cases vidées.
* **Seulement `<< 1` sur tout le nombre** → c'est multiplier par 2 / décaler tout, pas pairwise swap.
* **Échanger octets ou nibbles voisins** → autre problème. Pairwise swap, ce sont des paires de **bits** seulement.
* **Mauvais masques** → `0xaaaaaaaa` pour les impairs, `0x55555555` pour les pairs quand LSB = bit 0.
* **Oublier le OR** → tu ne gardes qu'une moitié des bits.
* **Boucle qui mute en lisant** → facile d'écraser un bit encore utile; préfère construire un nouveau résultat.

Test minimal:

```java
System.out.println(swapOddEvenBits(0));          // 0
System.out.println(swapOddEvenBits(1));          // 2
System.out.println(swapOddEvenBits(2));          // 1
System.out.println(swapOddEvenBits(38));         // 25
System.out.println(swapOddEvenBits(0xffffffff)); // -1 (tous les bits restent à 1)
System.out.println(swapOddEvenBits(0xaaaaaaaa)); // 0x55555555
System.out.println(swapOddEvenBits(0x55555555)); // 0xaaaaaaaa
```

Si `swap(swap(x)) == x` pour des ints aléatoires, ta fonction est une involution, ce que pairwise swap doit être. Vérif bon marché en unit test.

---

## 7. Résumé à raconter à un ami

Pairwise Swap demande: échange le bit 0 avec le 1, le 2 avec le 3, et ainsi de suite, avec presque aucune instruction.

1. Masque les impairs avec `0xaaaaaaaa`, décale à droite de 1 (`>>>`).
2. Masque les pairs avec `0x55555555`, décale à gauche de 1.
3. OR des deux moitiés.
4. Chaque paire bouge en parallèle. Pas de boucle sur les paires.
5. Utilise le `>>>` logique pour qu'un bit haut à 1 ne remplisse pas mal de uns.

Si tu dessines un exemple 8 bits, nommes les deux masques de mémoire, et expliques pourquoi `>>>` bat `>>` ici, tu maîtrises le 5.7. Ensuite dans le chapitre: tracer une ligne horizontale dans un buffer d'écran empaqueté en bits.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Conversion](/blog/fr/ctci-5-6-conversion)
* Suivant: [Draw Line](/blog/fr/ctci-5-8-draw-line)