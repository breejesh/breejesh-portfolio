---
title: "Circular Array: rotation O(1) avec un index head (Java)"
description: "Problème style CTCI 7.9 pour débutants: un CircularArray générique qui tourne en O(1) en déplaçant un pointeur head, mappe les indices logiques avec modulo, et supporte for-each via Iterable."
date: "2026-02-03"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-9-circular-array.webp
previewImage: /assets/images/ctci-7-9-circular-array.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.9 pour débutants: un CircularArray générique qui tourne en O(1) en déplaçant un pointeur head, mappe les indices logiques avec modulo, et supporte for-each via Iterable.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu veux un tableau que tu peux **faire tourner** sans payer une copie complète. Tourne à gauche ou à droite, puis parcours les éléments depuis le nouveau front avec une boucle `for (T x : array)` normale. Décaler chaque case à chaque rotate, c'est le chemin lent. La réponse d'entretien laisse les éléments en place, déplace un index **head**, puis mappe chaque index logique à travers ce head avec un modulo.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de conception de buffer circulaire en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 7 (conception orientée objet) continue ici avec une petite structure précise.

---

## 1. Analogie du quotidien

Pense à un **plateau tournant** sur la table. Les assiettes restent fixes sur le plateau. Quand quelqu'un le fait tourner, personne ne soulève et ne réordonne chaque assiette. Le plateau tourne; ce qui te fait face change.

Ton tableau est le plateau. Les assiettes sont les éléments. Un entier, `head`, retient quel emplacement physique est le **début logique** actuel. `get(0)` signifie toujours "ce qui fait face à l'invité maintenant", pas "index physique 0".

Quand tu rotates de `k`, tu ne mets à jour que `head`. L'itération part de ce head et fait le tour du cercle jusqu'à avoir visité chaque case une fois.

---

## 2. Problème en mots simples

**Objectif:** implémenter un **CircularArray** qui se comporte comme un tableau de capacité fixe avec rotation efficace et itération for-each standard.

**Exigences:**

* Stocker un nombre fixe d'éléments (capacité au constructeur).
* `get(i)` / `set(i, value)` avec indices **logiques** `0 .. size-1` après la rotation courante.
* `rotate(shiftRight)`: changer le début logique sans copier tout le tableau.
* Préférer un type **générique** `T` (paramètre de type Java).
* Supporter `for (T item : circularArray)` via `Iterable<T>`.

**Clarifie avant de coder:**

* Capacité fixe ou extensible? Fixe suffit pour ce problème.
* Que signifie `rotate(1)`? L'index logique 0 devient ce qui était l'index logique 1 (head avance).
* `rotate` négatif? Utile; normalise avec modulo pour gauche et droite.
* Taille nulle? Refuse une capacité non positive dans le constructeur.
* `remove()` de l'itérateur? Non supporté, c'est acceptable si on ne le demande pas.

**Mini schéma (`size = 4`, valeurs A B C D):**

| head | Ordre logique get(0)..get(3) | Tableau physique |
| --- | --- | --- |
| 0 | A B C D | `[A, B, C, D]` |
| 1 | B C D A | `[A, B, C, D]` (inchangé) |
| 2 | C D A B | toujours inchangé |
| 3 | D A B C | toujours inchangé |

Les cases physiques ne bougent pas. Seul le mappage bouge.

---

## 3. Réfléchis d'abord

### Mauvaise idée: décaler chaque élément

```
rotate(1): copier items[1] dans un buffer, ou boucle:
  for i in 0..n-2: items[i] = items[i+1]
  items[n-1] = first
```

C'est **O(n)** par rotate. Correct pour un usage unique, douloureux si tu rotates souvent ou si `n` est grand. On attend que tu le formules et que tu le jettes comme design principal.

### Bonne idée: head + carte d'indices

Garde:

* `items`: le tableau brut de longueur `n`
* `head`: index physique du début logique courant

**Convertir index logique en physique:**

```
physical = (head + logical) mod n
```

Le `%` de Java est un reste, pas un modulo mathématique: avec des négatifs, il peut rester négatif. Normalise avant d'indexer:

```
offset = logical % n
if offset < 0: offset += n
physical = (head + offset) % n
```

**Tourner de `k`:** mets `head` sur l'index physique de ce qui était le logique `k`. C'est exactement `head = convert(k)` si `convert` plie déjà le head courant. Une affectation. **O(1)**.

### Itération

Un for-each a besoin de `Iterable<T>`:

1. La classe déclare `implements Iterable<T>`.
2. `iterator()` renvoie un `Iterator<T>`.
3. L'itérateur suit un offset `current` depuis le head **tourné** (`0, 1, 2, ...`), pas seulement un pointeur physique brut.
4. `hasNext`: il reste des offsets.
5. `next`: incrémente l'offset, renvoie `items[convert(current)]`.

La première séquence d'un for-each est `hasNext()` puis `next()`. Démarre `current` à `-1` pour que le premier `next()` tombe sur l'offset `0` (front logique).

### Génériques et tableaux en Java

Tu ne peux pas écrire `new T[size]`. Motif courant:

```java
items = (T[]) new Object[size];
```

Supprime le warning unchecked une fois au constructeur, ou stocke une `List<T>`. Tableau + cast est la réponse style CTCI habituelle; mentionne le warning pour montrer que c'est voulu.

---

## 4. Solution Java

```java
import java.util.Iterator;
import java.util.NoSuchElementException;

/**
 * Fixed-capacity circular array.
 * rotate moves a head index; elements stay put.
 * Logical get/set and for-each all go through convert().
 */
public class CircularArray<T> implements Iterable<T> {
    private final T[] items;
    private int head = 0;

    @SuppressWarnings("unchecked")
    public CircularArray(int size) {
        if (size <= 0) {
            throw new IllegalArgumentException("size must be positive");
        }
        items = (T[]) new Object[size];
    }

    /** Map a logical index (and also raw shift amounts) into a physical slot. */
    private int convert(int index) {
        int n = items.length;
        int offset = index % n;
        if (offset < 0) {
            offset += n;
        }
        return (head + offset) % n;
    }

    /** New logical front is the old logical index shiftRight. O(1). */
    public void rotate(int shiftRight) {
        head = convert(shiftRight);
    }

    public T get(int i) {
        if (i < 0 || i >= items.length) {
            throw new IndexOutOfBoundsException("index " + i);
        }
        return items[convert(i)];
    }

    public void set(int i, T item) {
        if (i < 0 || i >= items.length) {
            throw new IndexOutOfBoundsException("index " + i);
        }
        items[convert(i)] = item;
    }

    public int size() {
        return items.length;
    }

    @Override
    public Iterator<T> iterator() {
        return new CircularArrayIterator();
    }

    /**
     * Walks logical offsets 0 .. n-1 from the current head.
     * Non-static inner class so convert() and items stay accessible.
     */
    private class CircularArrayIterator implements Iterator<T> {
        private int current = -1; // before first element

        @Override
        public boolean hasNext() {
            return current < items.length - 1;
        }

        @Override
        public T next() {
            if (!hasNext()) {
                throw new NoSuchElementException();
            }
            current++;
            return items[convert(current)];
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException("remove not supported");
        }
    }
}
```

Parcours: remplir, tourner, lire, itérer.

```java
CircularArray<String> ring = new CircularArray<>(4);
ring.set(0, "A");
ring.set(1, "B");
ring.set(2, "C");
ring.set(3, "D");
// logical: A B C D, head = 0

ring.rotate(1);
// head = 1; get(0)=B, get(1)=C, get(2)=D, get(3)=A

ring.rotate(2);
// from head=1, convert(2) -> head becomes 3
// logical: D A B C

for (String s : ring) {
    System.out.print(s + " "); // D A B C
}
```

| Étape | Appel | head | Vue logique |
| --- | --- | --- | --- |
| départ | sets A B C D | 0 | A B C D |
| 1 | `rotate(1)` | 1 | B C D A |
| 2 | `rotate(2)` | 3 | D A B C |
| 3 | for-each | 3 | D, puis A, B, C |

Réutilise `convert` partout: `get`, `set`, `rotate` et l'itérateur. Un seul endroit possède les cas limites du modulo.

---

## 5. Table de complexité

| Opération | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| `rotate(k)` | O(1) | O(1) | met seulement `head` à jour |
| `get` / `set` | O(1) | O(1) | un convert + accès tableau |
| for-each complet | O(n) | O(1) itérateur | visite chaque case une fois |
| rotate naïf (décalage) | O(n) | O(1) ou O(n) | à éviter comme design principal |
| Construction | O(n) | O(n) pour `items` | tableau fixe alloué |

Les interviewers veulent l'histoire rotate O(1) et une carte d'indices correcte. Iterable est la seconde moitié de la note.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent ces points:

* **`rotate(0)`:** no-op; head inchangé.
* **`rotate(n)` ou multiple de `n`:** tours complets; ordre logique inchangé. `% n` le gère.
* **rotate négatif:** `rotate(-1)` doit reculer le head d'un pas logique. Cassé si tu utilises `%` brut sans corriger les négatifs.
* **`get` hors plage:** lève si le logique `i < 0` ou `i >= n`. Ne wrappe pas en silence les indices utilisateur sauf API documentée.
* **Éléments null:** autorisés pour les types référence; pas de cas spécial sauf demande.
* **Itérateur après rotate:** un nouveau for-each utilise le head **courant**. Un snapshot ancien est un choix de design; cette version simple lit le `head` vivant via `convert` (ok pour du monothread d'entretien).
* **Création de tableau générique:** cast depuis `Object[]`, ou utilise `ArrayList`.
* **`size = 1`:** chaque rotate retombe sur le même élément; ne doit pas planter.

Erreurs fréquentes:

1. **Décaler le tableau dans `rotate`.** Ça marche, rate la demande d'efficacité.
2. **Oublier le modulo négatif.** `-1 % 4` vaut `-1` en Java, pas `3`.
3. **Itérateur qui marche les indices physiques depuis 0** sans appliquer `head`. Le for-each ignore alors la rotation.
4. **Démarrer `current` à 0 et incrémenter de travers** pour sauter ou doubler le premier ou le dernier. Trace `hasNext` / `next` une fois sur papier.
5. **Utiliser `head + i` sans `% n`.** Dépassement après rotation.
6. **Contrôler les bornes seulement sur l'index physique.** Les bornes logiques sont `0 .. n-1`; convert sert au stockage, pas à valider l'index logique de l'appelant.

Esquisse de test minimal:

```java
void demo() {
    CircularArray<Integer> a = new CircularArray<>(3);
    a.set(0, 10);
    a.set(1, 20);
    a.set(2, 30);
    a.rotate(1);
    assert a.get(0) == 20;
    assert a.get(1) == 30;
    assert a.get(2) == 10;
    a.rotate(-1); // back to original logical order
    assert a.get(0) == 10;

    int sum = 0;
    for (int v : a) {
        sum += v;
    }
    assert sum == 60;
}
```

---

## 7. Récap à raconter à un ami

Circular Array demande: peux-tu tourner à peu de frais et quand même parcourir dans l'ordre logique?

1. Laisse les items fixes dans un tableau. Stocke `head` comme index physique de la position logique 0.
2. Mappe avec `physical = (head + logical) mod n`, et corrige le reste négatif de Java.
3. `rotate(k)` ne réassigne que `head` via cette même carte. **O(1)**, pas O(n).
4. `get` / `set` convertissent toujours d'abord pour que l'appelant ne pense qu'en indices logiques.
5. Implémente `Iterable` avec un itérateur qui produit les offsets `0 .. n-1` depuis le head tourné pour que `for (T x : array)` marche.
6. Utilise les génériques (`CircularArray<T>`). Cast `Object[]` en `T[]` ou utilise une liste.

Si tu peux dessiner quatre cases, déplacer une flèche head et écrire `convert` sans off-by-one, tu maîtrises le 7.9. La rotation, c'est une mise à jour de pointeur; l'itération, c'est marcher depuis ce pointeur autour de l'anneau.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Othello](/blog/fr/ctci-7-8-othello)
* Suivant: [Minesweeper](/blog/fr/ctci-7-10-minesweeper)