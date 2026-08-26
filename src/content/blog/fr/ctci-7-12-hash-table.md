---
title: "Hash Table: chaînage avec seaux LinkedList (Java)"
description: "Problème style CTCI 7.12 pour débutants: un HashMap simple avec un tableau de listes chaînées. put, get et remove avec collisions par chaining en Java."
date: "2026-02-28"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-12-hash-table.webp
previewImage: /assets/images/ctci-7-12-hash-table.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.12 pour débutants: un HashMap simple avec un tableau de listes chaînées. put, get et remove avec collisions par chaining en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Une map qui répond à **get(key)** en temps à peu près constant est une **table de hachage**. Tu haches la clé vers un index de seau, puis tu ne regardes que ce seau. Quand deux clés tombent dans le même emplacement, il faut un plan de collision. Le plan d'enseignement classique est le **chaining**: chaque seau est une liste chaînée de cellules clé-valeur.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien de conception orientée objet, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 7 se termine ici avec une petite structure claire que tu peux coder au tableau.

---

## 1. Analogie du quotidien

Pense à un mur de **boîtes aux lettres**, numérotées de `0` à `capacity - 1`.

* Chaque lettre a une adresse. Tu appliques une règle simple et tu obtiens un numéro de boîte.
* Tu déposes la lettre dans cette boîte.
* Parfois deux lettres hachent vers le même numéro. Cette boîte tient une **pile de lettres** (une chaîne), pas une seule.
* Pour trouver le courrier d'Alice, tu haches son adresse, tu ouvres cette boîte, et tu parcours la petite pile jusqu'à voir son nom.
* Pour retirer une lettre, tu ouvres la même boîte et tu sors cette lettre de la pile.

Le mur est le tableau. Chaque pile est une liste chaînée. La règle est ta fonction de hachage. Tu ne cherches jamais tout le mur; tu ne parcours qu'une chaîne courte.

Tu ne construis pas `java.util.HashMap` avec tree bins et heuristiques de resize. Tu modélises l'idée avec des classes claires.

---

## 2. Problème en mots simples

**Objectif:** concevoir et implémenter un **HashTable / HashMap** simple qui utilise le **chaining** (seaux en listes chaînées) pour les collisions.

**Opérations centrales:**

* `put(key, value)`: insérer ou mettre à jour
* `get(key)`: renvoyer la valeur, ou null / vide si absente
* `remove(key)`: supprimer le mapping s'il existe

**À clarifier en entretien:**

* Types de clé et de valeur? Les génériques `K` et `V` sont propres. Clés `null`? Souvent interdites ou cas à part; choisis et dis-le.
* Que fait `put` si la clé existe déjà? Met à jour la valeur (sémantique de map), ne crée pas une deuxième cellule.
* Type de retour de `get` / `remove`? Valeur ou boolean, tant que tu le précises.
* Capacité fixe ou resize quand la charge monte? Fixe suffit pour un premier croquis. Mentionne le load factor en suite.
* Thread safety? Mono-thread sauf demande contraire.

**Forme de la hiérarchie:**

```
HashMap<K, V>
  └── buckets: LinkedList<Cell<K, V>>[]   (or List of lists)
        └── Cell: key, value
```

Certains nomment le nœud `Entry`. Même idée: un objet par mapping, accroché dans une chaîne sous un index.

---

## 3. Réfléchir d'abord

### Pourquoi pas un simple tableau de valeurs

Les clés ne sont pas de petits entiers consécutifs. Tu ne peux pas indexer par `key` directement pour des strings ou des objets arbitraires. Le hachage envoie toute clé dans `0 .. capacity - 1`.

### La collision est normale

Un bon hash répartit les clés, mais deux clés différentes peuvent encore produire le même index. C'est une **collision**, pas un bug.

Deux correctifs standards:

| Stratégie | Idée | Note d'entretien |
| --- | --- | --- |
| **Chaining** | Chaque seau tient une liste de cellules | Simple à coder et expliquer |
| **Open addressing** | Sonder d'autres cases du tableau | Moins de pointeurs; delete plus dur |

Ce problème demande le **chaining**. Reste sur les listes sauf si l'intervieweur te oriente ailleurs.

### Hash vers l'index de seau

```
index = hashCode(key) % capacity
```

En Java, `hashCode()` peut être négatif. Un reste négatif de `%` casse l'index du tableau. Corrige:

```
index = (hashCode(key) & 0x7fffffff) % capacity
```

ou

```
index = Math.floorMod(hashCode(key), capacity)
```

Les deux conviennent. Dis pourquoi tu normalises.

### put / get / remove parcourent la même chaîne

1. Calcule `index` à partir de la clé.
2. Parcours la liste en `buckets[index]`.
3. Compare les clés avec `equals` (pas `==` pour les objets).
4. **put:** si la clé existe, écrase la valeur; sinon ajoute une cellule.
5. **get:** si la clé existe, renvoie la valeur; sinon null.
6. **remove:** si la clé existe, détache cette cellule; sinon no-op.

Le temps moyen est O(1 + longueur de chaîne). Le pire cas est O(n) si tout s'empile dans un seau (mauvais hash ou clés adverses).

### Capacité et charge

`load factor ≈ n / capacity`. Au-delà d'environ 0.75, les maps de production font un **resize** (nouveau tableau, rehash de toutes les clés). Pour le croquis d'entretien, une capacité fixe suffit si tu nommes le resize comme étape suivante.

### Croquis au tableau

1. Dessine un tableau de 4 seaux vides.
2. `put("apple", 1)` hache vers l'index 1: la chaîne est `apple→1`.
3. `put("apricot", 2)` aussi vers 1: chaîne `apple→1` puis `apricot→2`.
4. `get("apricot")` parcourt l'index 1, saute apple, renvoie 2.
5. `remove("apple")` détache la première cellule; apricot reste.

---

## 4. Solution Java

Version pédagogique avec génériques, capacité fixe et cellules simplement chaînées. `LinkedList` du JDK marche aussi; un `next` explicite sur `Cell` rend la chaîne évidente au tableau.

```java
/**
 * Simple hash map with chaining.
 * Each bucket is a singly linked list of Cell nodes.
 */
public class ChainedHashMap<K, V> {
    private static class Cell<K, V> {
        final K key;
        V value;
        Cell<K, V> next;

        Cell(K key, V value, Cell<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private final Cell<K, V>[] buckets;
    private int size;

    @SuppressWarnings("unchecked")
    public ChainedHashMap(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("capacity must be positive");
        }
        // Generic array: allocate as Object[], cast once.
        buckets = (Cell<K, V>[]) new Cell[capacity];
        size = 0;
    }

    public ChainedHashMap() {
        this(16);
    }

    private int indexFor(K key) {
        int h = key.hashCode();
        // clear sign bit so % never yields a negative index
        return (h & 0x7fffffff) % buckets.length;
    }

    private Cell<K, V> findCell(K key) {
        int i = indexFor(key);
        for (Cell<K, V> c = buckets[i]; c != null; c = c.next) {
            if (c.key.equals(key)) {
                return c;
            }
        }
        return null;
    }

    /** Insert or update. Null keys rejected for simplicity. */
    public void put(K key, V value) {
        if (key == null) {
            throw new IllegalArgumentException("null key not supported");
        }
        Cell<K, V> existing = findCell(key);
        if (existing != null) {
            existing.value = value;
            return;
        }
        int i = indexFor(key);
        // insert at head: O(1), order inside the bucket does not matter for map ops
        buckets[i] = new Cell<>(key, value, buckets[i]);
        size++;
    }

    public V get(K key) {
        if (key == null) {
            return null;
        }
        Cell<K, V> c = findCell(key);
        return c == null ? null : c.value;
    }

    /**
     * True when the key is present. Needed if null values are allowed,
     * because get(key) == null is then ambiguous.
     */
    public boolean containsKey(K key) {
        if (key == null) {
            return false;
        }
        return findCell(key) != null;
    }

    /** Remove mapping if present. Returns true when a cell was removed. */
    public boolean remove(K key) {
        if (key == null) {
            return false;
        }
        int i = indexFor(key);
        Cell<K, V> prev = null;
        Cell<K, V> cur = buckets[i];
        while (cur != null) {
            if (cur.key.equals(key)) {
                if (prev == null) {
                    buckets[i] = cur.next;
                } else {
                    prev.next = cur.next;
                }
                size--;
                return true;
            }
            prev = cur;
            cur = cur.next;
        }
        return false;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}
```

Ce croquis autorise les valeurs **null**. Pour un code d'entretien plus simple, interdis les valeurs null et traite `get == null` comme absence.

Démo pas à pas:

```java
public class HashTableDemo {
    public static void main(String[] args) {
        ChainedHashMap<String, Integer> map = new ChainedHashMap<>(4);

        map.put("apple", 1);
        map.put("banana", 2);
        map.put("apricot", 3); // may collide with apple depending on hash

        System.out.println(map.get("apple"));    // 1
        System.out.println(map.get("banana"));   // 2
        System.out.println(map.get("missing"));  // null

        map.put("apple", 10); // update
        System.out.println(map.get("apple"));    // 10
        System.out.println(map.size());          // 3

        System.out.println(map.remove("banana")); // true
        System.out.println(map.get("banana"));    // null
        System.out.println(map.size());           // 2
    }
}
```

| Étape | Appel | Effet |
| --- | --- | --- |
| début | capacity 4 | seaux vides |
| 1 | `put("apple", 1)` | nouvelle cellule en `indexFor(apple)` |
| 2 | `put("banana", 2)` | nouvelle cellule (même seau ou un autre) |
| 3 | `put("apricot", 3)` | la chaîne grandit s'il y a collision |
| 4 | `put("apple", 10)` | même cellule, valeur écrasée, size reste 3 |
| 5 | `remove("banana")` | détache la cellule, size 2 |

Si l'intervieweur préfère les listes JDK plutôt qu'un `next` à la main:

```java
// sketch: buckets as List<Cell>[]
List<Cell<K, V>> bucket = buckets[i];
if (bucket == null) {
    bucket = new LinkedList<>();
    buckets[i] = bucket;
}
for (Cell<K, V> c : bucket) {
    if (c.key.equals(key)) {
        c.value = value;
        return;
    }
}
bucket.add(new Cell<>(key, value, null));
```

Même asymptotique. Un `next` explicite est plus clair quand tu dois montrer remove avec prev/cur.

---

## 5. Tableau de complexité

| Opération | Temps moyen | Pire temps | Espace extra | Notes |
| --- | --- | --- | --- | --- |
| `put` (nouvelle clé) | O(1 + α) | O(n) | O(1) | α ≈ load factor / longueur de chaîne |
| `put` (update) | O(1 + α) | O(n) | O(1) | parcours jusqu'à key equals |
| `get` | O(1 + α) | O(n) | O(1) | même parcours |
| `remove` | O(1 + α) | O(n) | O(1) | détache avec prev |
| Construction | O(capacity) | O(capacity) | O(capacity) | tableau vide de têtes |
| Stockage de n paires | - | - | O(n + capacity) | cellules + tableau de seaux |

Les intervieweurs veulent que tu nommes le chaining, utilises `hash` puis `equals`, et gères update vs insert. Le resize est un bon suivi, pas obligatoire au premier passage.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs tapent ici:

* **Clé null:** lance ou réserve un slot dédié. N'appelle pas `key.hashCode()` sur null.
* **Valeur null:** autorisée dans ce croquis. Alors `get == null` est ambigu; utilise `containsKey` ou `Optional`.
* **put en double:** doit mettre à jour, pas faire grandir size deux fois.
* **Remove de la tête de chaîne:** `buckets[i] = cur.next`, pas seulement `prev.next = ...`.
* **Remove d'une clé absente:** renvoie false / null; ne décrémente pas size.
* **hashCode négatif:** normalise avant `%` sinon `ArrayIndexOutOfBoundsException`.
* **capacity = 1:** toutes les clés collisionnent; la map reste correcte, juste une longue liste.
* **Mauvais contrat `equals` / `hashCode`** sur des clés custom: des clés égales doivent partager hashCode sinon le lookup casse.
* **Iterator / mutation concurrente:** hors scope sauf demande.

Erreurs fréquentes:

1. **Utiliser `==` pour comparer les clés.** Strings et types boxed ont besoin de `equals`.
2. **Oublier le chemin update dans `put`.** Deux cellules avec la même clé; `get` renvoie la première et size ment.
3. **Remove cassé sur le premier nœud.** Le pointeur de tête n'est jamais mis à jour.
4. **`hash % capacity` avec un hash négatif.** Crash d'index.
5. **Construire de l'open addressing par accident** (linear probe) après avoir dit "chaining."
6. **Resize sans rehash.** Copier les têtes de liste vers un plus grand tableau garde de mauvais indices.

Idée de smoke minimale:

```java
ChainedHashMap<String, Integer> m = new ChainedHashMap<>(2);
m.put("a", 1);
m.put("b", 2);
m.put("a", 3);
assert m.get("a") == 3;
assert m.size() == 2;
assert m.remove("b");
assert m.get("b") == null;
assert m.size() == 1;
assert !m.remove("b");
```

---

## 7. Résumé à raconter à un ami

Table de hachage avec chaining, version entretien:

1. Tableau de seaux. Chaque seau est une **liste chaînée** de cellules clé-valeur.
2. `index = normalize(hashCode(key)) % capacity`.
3. **put:** parcours la chaîne; mets à jour si la clé existe, sinon ajoute une cellule (insert en tête OK).
4. **get:** parcours la chaîne; renvoie la valeur ou null.
5. **remove:** parcours avec prev/cur; détache et décrémente size.
6. Moyenne O(1) si les chaînes restent courtes. Pire O(n) si tout collisionne.
7. Suites: resize au load factor, politique null, open addressing, thread safety.

Si tu peux dessiner quatre seaux, accrocher deux clés en collision sur une liste, et écrire put/get/remove sans bug de remove, tu maîtrises le problème 7.12. L'OOD du chapitre 7 se termine sur une structure que tu réutiliseras partout.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [File System](/blog/fr/ctci-7-11-file-system)
* Suivant: [Triple Step](/blog/fr/ctci-8-1-triple-step)