---
title: "Remove Dups: supprimer les doublons d'une liste chaînée non triée (Java)"
description: "Problème style CTCI 2.1 pour débutants: retirer les valeurs en double d'une liste simplement chaînée. Parcours HashSet en O(N), puis pointeur runner sans buffer en O(N^2)."
date: "2026-04-08"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-1-remove-dups.webp
previewImage: /assets/images/ctci-2-1-remove-dups.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 2.1 pour débutants: retirer les valeurs en double d'une liste simplement chaînée. Parcours HashSet en O(N), puis pointeur runner sans buffer en O(N^2).
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Ton carnet de contacts a "Ana" trois fois, "Sam" deux fois, et quelques noms propres. Tu veux chaque personne une seule fois. L'ordre alphabétique ne t'intéresse pas. Tu parcours la liste, tu te souviens de qui tu as déjà gardé, et tu jettes le reste. C'est remove dups sur une liste chaînée.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les échauffements classiques de listes chaînées en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 2 commence ici.

---

## 1. Analogie du quotidien

Imagine des post-it enfilés sur un fil. Chaque billet porte un nombre. Ils ne peuvent pointer que vers le suivant (liste simplement chaînée).

* Tu pars du premier billet.
* Si ce nombre est nouveau, tu le gardes et tu t'en souviens.
* Si ce nombre est déjà apparu plus tôt, tu coupes le billet du fil et tu refermes le trou.

Tu ne tries pas. Tu ne comptes pas les occurrences. Tu ne gardes que la **première** apparition de chaque valeur et tu jettes les copies plus tardives.

---

## 2. Énoncé en mots simples

**Entrée:** la tête d'une liste simplement chaînée d'entiers, non triée (ou `null`).

**Sortie:** la même structure sans valeurs **en double**. L'ordre des premières apparitions reste. On mute en place en général et on renvoie void (ou la même tête).

**Forme de nœud que nous utilisons:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Exemples:**

| Avant (head → …) | Après | Pourquoi |
| --- | --- | --- |
| `1 → 2 → 3 → 2 → 1` | `1 → 2 → 3` | second `2` et second `1` retirés |
| `5 → 5 → 5` | `5` | on garde seulement le premier |
| `7` | `7` | un seul nœud, rien à retirer |
| `null` | `null` | liste vide |
| `1 → 2 → 3` | `1 → 2 → 3` | déjà unique |

**Clarifie avant de coder** (dis-le à voix haute en entretien):

* Simplement ou doublement chaînée? (Ici: simple.)
* A-t-on le droit à de la mémoire en plus? (Solution principale oui; suite non.)
* Ordre stable keep-first, ou réordonnancement libre?
* Négatifs et zéro? (Comme n'importe quel `int`.)
* Nouvelle liste ou édition des nœuds existants?

Pour cet article: mutation en place, on garde la première occurrence, entiers, simplement chaînée.

---

## 3. Réfléchir d'abord (brut, hash, puis sans buffer)

### Instinct brut

Pour chaque nœud, parcours le **reste** de la liste et supprime tout nœud plus loin avec la même valeur. C'est déjà proche du follow-up. Boucles imbriquées: O(N²) en temps, O(1) en espace extra.

### Idée principale: se souvenir de ce qu'on a gardé

Utilise un `HashSet<Integer>` des valeurs déjà conservées. Un pointeur parcourt la liste. Un second (ou une référence "previous") reste un pas derrière pour pouvoir délier un nœud.

* Première fois qu'on voit une valeur: on l'ajoute au set, on avance previous.
* Valeur déjà dans le set: on saute le nœud courant avec `previous.next = current.next`.

Un seul passage. Les recherches dans le hash sont O(1) en moyenne. Temps total O(N), espace extra O(N) au pire (toutes les valeurs distinctes).

### Suite: pas de buffer

L'intervieweur interdit le set. Pour chaque nœud `current`, lance un second pointeur `runner` depuis `current` sur le reste de la liste. Quand `runner.next` porte la même data que `current`, délie `runner.next`. Sinon avance `runner`.

Boucle externe fois boucle interne: O(N²) en temps, O(1) en espace extra. Correct, juste plus lent. Bonne réponse quand la mémoire est serrée ou le set est interdit.

---

## 4. Solutions Java

### (a) HashSet, un passage

```java
import java.util.HashSet;
import java.util.Set;

/**
 * Removes duplicate values from an unsorted singly linked list.
 * Keeps the first occurrence of each value. Mutates the list in place.
 */
void removeDups(Node head) {
    if (head == null) {
        return;
    }

    Set<Integer> seen = new HashSet<>();
    Node previous = null;
    Node current = head;

    while (current != null) {
        if (seen.contains(current.data)) {
            // Drop current: bridge previous over it.
            previous.next = current.next;
        } else {
            seen.add(current.data);
            previous = current;
        }
        current = current.next;
    }
}
```

Parcours de `1 → 2 → 3 → 2 → 1`:

| current.data | seen avant | action | forme de la liste après l'étape |
| --- | --- | --- | --- |
| 1 | {} | add 1, keep | `1 → 2 → 3 → 2 → 1` |
| 2 | {1} | add 2, keep | identique |
| 3 | {1,2} | add 3, keep | identique |
| 2 | {1,2,3} | déjà vu, unlink | `1 → 2 → 3 → 1` |
| 1 | {1,2,3} | déjà vu, unlink | `1 → 2 → 3` |

### (b) Pointeur runner, sans buffer extra

```java
/**
 * Same goal as removeDups, but no HashSet and no extra O(N) memory.
 * For each node, scan the rest of the list and remove matching values.
 */
void removeDupsNoBuffer(Node head) {
    Node current = head;

    while (current != null) {
        Node runner = current;
        while (runner.next != null) {
            if (runner.next.data == current.data) {
                // Skip the duplicate node.
                runner.next = runner.next.next;
            } else {
                runner = runner.next;
            }
        }
        current = current.next;
    }
}
```

Pourquoi `runner` démarre à `current` et non à `head`: tu n'as besoin de nettoyer que les copies **plus tardives** de `current.data`. Les nœuds précédents ont déjà été nettoyés par rapport à leurs propres valeurs. Partir de `current` raccourcit le balayage interne et évite de retoucher le préfixe.

---

## 5. Table de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Parcours HashSet | O(N) moyen | O(N) | N = nœuds; l'espace tient les valeurs distinctes |
| Runner (sans buffer) | O(N²) | O(1) | Balayages imbriqués de la liste |
| Copier en tableau, uniques, reconstruire | O(N) | O(N) | Marche, mais ce n'est souvent pas ce qu'ils veulent pour "compétence liste chaînée" |

Préfère **HashSet** en production et dans la plupart des entretiens sauf interdiction de mémoire extra. Utilise **runner** quand ils disent "espace constant" ou "sans buffer".

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs poussent sur:

* **Liste vide (tête `null`)** → return tout de suite. Ne touche à rien.
* **Un seul nœud** → laisse-le.
* **Toutes les valeurs égales** → seule la tête reste.
* **Doublons en fin de liste** → previous doit encore pouvoir délier le(s) dernier(s) nœud(s).
* **Aucun doublon** → le set grandit jusqu'à N; structure inchangée.
* **Négatifs et zéro** → hash et `==` se comportent comme pour les entiers positifs.
* **Très longue liste** → HashSet reste linéaire; le runner devient vraiment lent. Dis ce compromis à voix haute.

Erreurs fréquentes:

1. **Oublier `previous` en déliant.** Si tu n'avances que `current` sans réécrire `previous.next`, le doublon reste dans la liste.
2. **Avancer `previous` même quand tu supprimes.** Après un delete, `previous` pointe encore sur le dernier nœud gardé. Ne déplace `previous` que quand tu gardes `current`.
3. **Perdre la tête.** Ici le premier nœud est toujours conservé (il ne peut pas être un doublon "plus tardif" de lui-même). Une variante avec d'autres règles demanderait une tête factice ou un retour de tête.
4. **Démarrer le runner à `head` à chaque fois sans soin.** Possible, mais tu refais du travail et tu compliques les bords. Depuis `current`, c'est plus propre.
5. **Utiliser `==` plus tard pour des payloads objets.** Ici `data` est un `int`, donc `==` est correct. Pour `Integer` ou types custom, pense à equals et hashCode.

Entrée minimale sûre avec null:

```java
void removeDupsSafe(Node head) {
    // null head is a no-op inside removeDups
    removeDups(head);
}
```

---

## 7. Récap à raconter à un ami

Remove dups demande: chaque valeur une seule fois dans une liste simplement chaînée; la première gagne.

1. Chemin HashSet: un passage, souviens-toi des valeurs gardées, délie les répétitions. O(N) temps, O(N) espace.
2. Sans buffer: pour chaque nœud, balaie le reste avec un runner et coupe les nœuds égaux. O(N²) temps, O(1) espace.
3. Réécris toujours `next` quand tu supprimes. N'avance pas le pointeur "gardé" au-delà d'un nœud supprimé.
4. Listes vides et à un nœud sont des victoires faciles. Listes toutes égales se réduisent à un nœud.

Si tu peux dire ça en trente secondes et écrire les deux versions sans bloquer, tu maîtrises le problème 2.1.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Rotation de chaînes](/blog/fr/ctci-1-9-string-rotation)
* Suivant: [Return Kth to Last](/blog/fr/ctci-2-2-return-kth-to-last)