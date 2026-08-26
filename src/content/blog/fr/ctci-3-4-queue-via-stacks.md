---
title: "Queue via Stacks: file FIFO avec deux piles LIFO (Java)"
description: "Problème style CTCI 3.4 pour débutants: implémenter MyQueue avec stackNewest et stackOldest. Push sur l'une, shift seulement quand dequeue ou peek a besoin des données. Amorti O(1) en Java clair."
date: "2025-10-24"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 3.4 pour débutants: implémenter MyQueue avec stackNewest et stackOldest. Push sur l'une, shift seulement quand dequeue ou peek a besoin des données. Amorti O(1) en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu tiens un mini café avec deux plateaux. Les nouvelles tasses atterrissent sur le **plateau d'entrée**. Tu poses toujours une tasse au sommet de ce tas. Quand un client commande, tu sers depuis le **plateau de sortie**, qui ne te laisse aussi prendre que par le haut. Quand le plateau de sortie est vide, tu bascules chaque tasse de l'entrée vers la sortie, une par une. La première tasse entrée se retrouve au sommet du plateau de sortie, prête. C'est une **file construite avec deux piles**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille que les questions d'entretien "queue with stacks", pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 3, problème 3.4.

---

## 1. Analogie du quotidien

Deux plateaux; chacun se comporte comme une pile (dernier entré, premier sorti *sur ce plateau*):

* **Plateau d'entrée (`stackNewest`)** reçoit les nouvelles arrivées. Enfiler, c'est toujours pousser ici. La tasse la plus récente est au sommet.
* **Plateau de sortie (`stackOldest`)** tient les tasses prêtes à servir en ordre FIFO. Défiler et peek opèrent toujours ici, une fois qu'un shift l'a rempli.
* **Shift:** seulement quand le plateau de sortie est vide et qu'il faut servir. Tu dépile tout l'entrée vers la sortie. L'ordre s'inverse de sorte que la première tasse entrée soit la première servie.

Tu ne shifts pas si la sortie a encore des tasses. Ce déplacement paresseux garde le coût moyen bas.

---

## 2. Problème en mots simples

**Objectif:** implémenter une file avec enqueue (add), dequeue (remove) et peek, en n'utilisant que deux piles comme stockage. N'enveloppe pas une vraie `Queue` de bibliothèque.

**Contrat de file:** premier entré, premier sorti. Si tu ajoutes `1`, puis `2`, puis `3`, le premier remove renvoie `1`.

**Contrat de pile autorisé:** push, pop, peek, isEmpty (ou size). Le `Stack` Java ou un `Deque` utilisé uniquement comme pile convient.

**Opérations sur `MyQueue`:**

| Méthode | Sens |
| --- | --- |
| `add(x)` / `enqueue(x)` | mettre `x` en queue de file |
| `remove()` / `dequeue()` | retirer le front et le renvoyer |
| `peek()` | regarder le front sans le retirer |
| `isEmpty()` / `size()` | vide ou compte (optionnel, utile) |

**Exemples:**

| Séquence | Résultat |
| --- | --- |
| add(1), add(2), add(3), remove() | renvoie `1`; reste `2, 3` |
| puis peek() | renvoie `2` |
| puis remove(), remove() | renvoie `2`, puis `3` |
| remove() sur vide | indéfini / exception (choisis une politique et dis-la) |

**Clarifie avant de coder:**

* Que faire si dequeue sur vide? Lever, ou un sentinelle? En entretien les deux passent si tu le dis.
* Entiers seulement, ou générique? Commence avec `int`; les génériques sont un petit enrobage ensuite.
* Les deux piles doivent-elles toujours être "parfaites", ou le shift paresseux est-il OK? Le paresseux est la bonne réponse standard.

---

## 3. Réfléchir d'abord (une pile ne suffit pas, deux oui)

### Pourquoi une seule pile ne suffit pas

Une pile est LIFO. Une file est FIFO. Si tu ne fais que push à l'enqueue et pop au dequeue, tu sors d'abord le plus récent. Mauvais ordre.

Tu pourrais reconstruire toute la pile à chaque dequeue (tout passer dans un temporaire, prendre le fond, remettre le reste). Ça marche, mais chaque dequeue est O(N). Bonne première idée; on te demande ensuite un meilleur coût amorti.

### Deux piles: newest et oldest

Garde:

* `stackNewest`: reçoit chaque nouvel élément à l'enqueue
* `stackOldest`: tient les éléments de façon que son sommet soit le front de la file

**Enqueue:** toujours `stackNewest.push(x)`. O(1).

**Dequeue / peek:** il te faut le plus ancien. Il est au sommet de `stackOldest` *si* tu as déjà shifté. Si `stackOldest` est vide, verse tout `stackNewest` dans `stackOldest`:

```
while stackNewest is not empty:
    stackOldest.push(stackNewest.pop())
```

Puis peek ou pop sur `stackOldest`.

**Pourquoi l'ordre est correct:** enfiler `1, 2, 3` laisse newest avec sommet=`3`, puis `2`, et `1` en bas. Après le shift, oldest a sommet=`1`, puis `2`, puis `3`. FIFO parfait.

**Règle paresseuse:** ne shift que si `stackOldest` est vide. S'il reste `1` sur oldest et que tu enfiles `4`, laisse `4` sur newest. Le prochain remove prend encore `1` sur oldest. Quand oldest se vide, un remove ultérieur déplacera `4` (et le reste).

### Intuition du coût amorti

Chaque élément est poussé sur newest une fois, retiré de newest au plus une fois, poussé sur oldest au plus une fois, et retiré d'oldest au plus une fois. Chaque élément paie un travail constant sur toute sa vie dans la file. C'est **O(1) amorti** par opération, même si un seul shift peut coûter O(N) quand N éléments bougent d'un coup.

---

## 4. Solution Java

```java
import java.util.EmptyStackException;
import java.util.Stack;

/**
 * Queue implemented with two stacks.
 * stackNewest: inbound (enqueue). stackOldest: outbound (dequeue/peek).
 * Shift only when outbound is empty and we need the front.
 */
class MyQueue {
    private final Stack<Integer> stackNewest = new Stack<>();
    private final Stack<Integer> stackOldest = new Stack<>();

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /** Enqueue: always push onto the newest stack. */
    public void add(int value) {
        stackNewest.push(value);
    }

    /**
     * Move everything from newest to oldest only if oldest is empty.
     * After this, stackOldest.top is the queue front (if any elements exist).
     */
    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /** Front without remove. Shifts if needed. */
    public int peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new EmptyStackException(); // queue empty
        }
        return stackOldest.peek();
    }

    /** Dequeue front. Shifts if needed. */
    public int remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new EmptyStackException(); // queue empty
        }
        return stackOldest.pop();
    }
}
```

Parcours: `add(1)`, `add(2)`, `add(3)`, puis `remove()`.

| Étape | stackNewest (sommet→…) | stackOldest (sommet→…) | Notes |
| --- | --- | --- | --- |
| add(1) | 1 | (vide) | push sur newest |
| add(2) | 2, 1 | (vide) | |
| add(3) | 3, 2, 1 | (vide) | |
| remove → shift | (vide) | 1, 2, 3 | verser newest dans oldest |
| remove → pop | (vide) | 2, 3 | renvoie `1` |

Puis `add(4)`, `remove()`:

| Étape | stackNewest | stackOldest | Notes |
| --- | --- | --- | --- |
| add(4) | 4 | 2, 3 | **ne pas** shift encore |
| remove | 4 | 3 | pop oldest → `2` (pas de shift; oldest non vide) |
| remove | 4 | (vide) | pop → `3` |
| remove → shift | (vide) | 4 | maintenant shift, puis pop → `4` |

---

## 5. Tableau de complexité

| Opération | Temps pire cas | Temps amorti | Espace extra |
| --- | --- | --- | --- |
| `add` | O(1) | O(1) | O(1) par appel |
| `remove` / `peek` (sans shift) | O(1) | O(1) | O(1) |
| `remove` / `peek` (shift de k éléments) | O(k) | O(1) amorti | O(1) hors piles |
| File de N éléments | - | - | O(N) total sur les deux piles |

N est le nombre d'éléments dans la file. Un seul dequeue peut être linéaire s'il déclenche un gros shift, mais chaque élément n'est déplacé qu'au plus une fois lors d'un shift, donc sur une séquence de M opérations le travail total est O(M). C'est l'histoire amortie qu'on attend en entretien.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers tapent là:

* **File vide** → `remove` / `peek` avec les deux piles vides. Lève ou renvoie un sentinelle clair. Ne fais pas de `pop` à l'aveugle sur une pile vide.
* **Un seul élément** → add puis remove marche: le shift en déplace un, le pop le renvoie.
* **Beaucoup d'enqueues puis beaucoup de dequeues** → un gros shift, puis des pops bon marché. L'ordre doit rester FIFO.
* **Ops entrelacées** → enfiler après un dequeue partiel ne doit pas casser le front. Le shift paresseux le gère si tu ne bouges que quand oldest est vide.
* **Peek puis remove** → les deux doivent voir le même front; peek ne doit pas laisser les piles incohérentes (shift OK; pas de pop sur peek).
* **size / isEmpty** → somme des deux piles. Ne regarde pas une seule.

Erreurs courantes:

1. **Shifter à chaque enqueue ou chaque dequeue même si oldest n'est pas vide.** Coût inutile et facile à casser. Conditionne avec `if (stackOldest.isEmpty())`.
2. **Verser newest sur oldest quand oldest n'est pas vide.** Mélange l'ordre. Oldest a encore des éléments plus vieux; empiler du plus neuf par-dessus casse le FIFO.
3. **Une seule pile et copie inverse à chaque dequeue sans parler du coût.** Ça marche mais c'est O(N) à chaque fois, sans amortissement si tu inverses dans les deux sens à chaque appel.
4. **Oublier que peek a besoin du même shift que remove.** Peek a aussi besoin du front au sommet d'oldest.
5. **Renvoyer depuis newest par erreur.** Le sommet de newest est la *dernière* arrivée, pas la première.

Aides minimales si vide (même politique):

```java
public int removeOrThrow() {
    return remove();
}

public boolean tryPeek(int[] out) {
    if (isEmpty()) {
        return false;
    }
    out[0] = peek();
    return true;
}
```

---

## 7. Résumé pour l'expliquer à un ami

Queue via stacks demande: peux-tu obtenir du FIFO avec seulement des tas LIFO?

1. Deux piles: nouvelles arrivées (`stackNewest`) et service (`stackOldest`).
2. Enqueue pousse toujours sur newest. C'est O(1).
3. Quand tu as besoin du front et qu'oldest est vide, verse newest dans oldest. Les sommets s'inversent: la plus ancienne arrivée est au sommet d'oldest.
4. Dequeue et peek n'opèrent que sur oldest (après un éventuel shift).
5. Ne verse jamais sur un oldest non vide. Cette règle protège l'ordre.
6. Chaque élément bouge un nombre constant de fois, donc les opérations sont O(1) amorti même si un shift a l'air cher.

Si tu dessines les deux plateaux, dis quand tu bascules, et expliques le coût amorti sans flou, tu maîtrises le problème 3.4.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Stack of Plates](/blog/fr/ctci-3-3-stack-of-plates)
* Suivant: [Sort Stack](/blog/fr/ctci-3-5-sort-stack)