---
title: "Loop Detection: trouver le début d'un cycle dans une liste chaînée (Java)"
description: "Problème style CTCI 2.8 pour débutants: étant donnée une liste chaînée circulaire, renvoyer le nœud où commence la boucle. Tortue et lièvre de Floyd, puis le reset vers head, en Java clair."
date: "2026-02-12"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-8-loop-detection.webp
previewImage: /assets/images/ctci-2-8-loop-detection.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 2.8 pour débutants: étant donnée une liste chaînée circulaire, renvoyer le nœud où commence la boucle. Tortue et lièvre de Floyd, puis le reset vers head, en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu cours sur un sentier qui commence tout droit puis rejoint une piste circulaire du parc. Tu ne remarques la jonction que lorsque le même arbre repasse. Un ami part avec toi et court deux fois plus vite. Vous vous croisez quelque part sur ce cercle. Le truc élégant: une fois rencontrés, si ton ami revient au départ du sentier et que vous marchez tous les deux au même rythme, vous vous retrouvez exactement à l'entrée de la boucle. C'est la **détection de boucle** sur une liste chaînée.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien sur les cycles, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 2 se termine ici.

---

## 1. Analogie du quotidien

Imagine une piste de course avec une voie d'accès:

* La voie d'accès est le préfixe sans boucle de la liste (de `head` jusqu'au premier nœud qui est aussi sur le cycle).
* L'ovale est le cycle. Un nœud pointe vers un nœud antérieur au lieu de finir sur `null`.
* Une **tortue** avance d'un pas. Un **lièvre** avance de deux pas.

S'il n'y a pas d'ovale, le lièvre atteint la fin du chemin (`null`) et c'est fini: pas de boucle.

S'il y a un ovale, le lièvre rattrape la tortue sur la piste. Ils se rencontrent sur un nœud *à l'intérieur* du cycle, pas forcément le début. La phase deux trouve le début: un coureur repart au départ, l'autre reste au point de rencontre, les deux avancent d'un pas à la fois. Leur prochaine collision est le **début de la boucle**.

---

## 2. Problème en mots simples

**Entrée:** la tête d'une liste simplement chaînée. La liste peut être linéaire, ou contenir un cycle (le `next` d'un nœud pointe vers un nœud plus tôt).

**Sortie:** le nœud au **début de la boucle**, ou `null` s'il n'y a pas de boucle.

"Début de la boucle" désigne le premier nœud qu'on peut atteindre à nouveau en suivant `next` indéfiniment. C'est le nœud unique qui, sur le dessin du cycle, a deux arêtes entrantes: une depuis le préfixe sans boucle (ou depuis lui-même si tout le cycle part du head), et une depuis le nœud précédent du cycle.

**Forme du nœud:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Exemples (les lettres sont l'identité des nœuds, pas seulement les valeurs):**

| Forme de la liste | Début de boucle | Pourquoi |
| --- | --- | --- |
| `A → B → C → D → E → C` (E pointe vers C) | `C` | premier nœud du cycle |
| `A → B → C → null` | aucun (`null`) | liste linéaire |
| `A → A` (auto-boucle) | `A` | cycle d'un seul nœud |
| `A → B → C → A` | `A` | le cycle inclut le head |
| `null` | `null` | liste vide |

**À clarifier avant de coder:**

* Liste simplement chaînée? (Oui.)
* Espace extra O(1)? (Floyd le fait. Un HashSet de nœuds visités est plus simple mais O(N).)
* Renvoyer l'objet nœud, pas seulement sa valeur.
* Auto-boucle autorisée? (Oui.)

---

## 3. Réfléchir d'abord (HashSet, puis Floyd)

### Instinct brutal: mémoriser chaque nœud visité

Parcours depuis le head. Mets chaque référence `Node` dans un `HashSet`. Si `next` est déjà dans l'ensemble, ce nœud est le début de la boucle. Si tu touches `null`, pas de boucle.

Temps O(N), espace O(N). Correct en production. En entretien on veut souvent la version à espace constant.

### Floyd: tortue et lièvre (détecter, puis localiser)

**Phase 1, détecter un point de rencontre.**

* `slow = head`, `fast = head`
* Boucle: `slow = slow.next` (1 pas), `fast = fast.next.next` (2 pas)
* Si `fast` ou `fast.next` est `null`, pas de cycle → renvoyer `null`
* Quand `slow == fast`, ils se sont rencontrés dans le cycle

**Phase 2, trouver le début de la boucle.**

* Laisse `slow` (ou `fast`) sur le nœud de rencontre
* Remets l'autre pointeur sur `head`
* Avance **les deux** d'un pas jusqu'à égalité
* Ce nœud est le début de la boucle

### Pourquoi le reset marche (intuition courte)

Soit:

* `μ` = nombre de nœuds avant le début de la boucle (longueur de l'accès)
* `λ` = longueur du cycle (l'ovale)
* À la rencontre, `slow` a parcouru une distance `μ + a` (`a` pas après l'entrée, avec `0 ≤ a < λ`)

Comme `fast` va deux fois plus vite, la distance supplémentaire qu'il a courue est un nombre entier de tours. Cela impose une identité modulaire propre: la distance restante du point de rencontre autour du cycle jusqu'à l'entrée vaut `μ` modulo `λ`.

Donc si un pointeur repart de head et que les deux marchent `μ` pas à vitesse 1, ils arrivent ensemble à l'entrée. Dans le code, tu n'as pas besoin de connaître `μ` ni `λ`. L'égalité des deux pointeurs suffit.

Tu n'as pas besoin d'une preuve formelle au tableau. Tu as besoin de l'histoire: se croiser sur l'ovale, puis course depuis head et point de rencontre à la même vitesse, collision à la porte.

---

## 4. Solution Java

```java
/**
 * Returns the node at the start of the cycle, or null if the list is acyclic.
 * Floyd cycle detection: meet with tortoise/hare, then reset one pointer to head.
 */
Node findLoopStart(Node head) {
    if (head == null) {
        return null;
    }

    Node slow = head;
    Node fast = head;

    // Phase 1: do they ever meet?
    boolean met = false;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            met = true;
            break;
        }
    }

    if (!met) {
        return null; // no loop
    }

    // Phase 2: one pointer back to head; both step once until equal.
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow; // beginning of the loop
}
```

Parcours pour `A → B → C → D → E → C`:

| Phase | Événement |
| --- | --- |
| Départ | `slow` et `fast` sur `A` |
| Pas | le lièvre prend de l'avance; les deux finissent dans `C-D-E` |
| Rencontre | ils se heurtent sur un nœud de `{C, D, E}` (selon les longueurs) |
| Reset | mets `slow` sur `A`, laisse `fast` sur le nœud de rencontre |
| Même rythme | les deux avancent d'un nœud à la fois |
| Fin | ils se tiennent ensemble sur `C` |

Pour une auto-boucle `A → A`: la phase 1 se rencontre tout de suite sur `A` après le premier couple de mouvements. La phase 2 met `slow = head`, aussi `A`, donc `slow == fast` immédiatement. Renvoie `A`.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| HashSet de nœuds visités | O(N) | O(N) | Simple; le premier nœud revu est le début |
| Floyd (tortue / lièvre) | O(N) | O(1) | Deux phases; réponse d'entretien préférée pour l'espace |
| Marquer les nœuds (champ mutable) | O(N) | O(1) | Il faut un champ modifiable; mauvais si la liste est partagée |

N est le nombre de nœuds distincts jusqu'à la réentrée dans le cycle (ou la longueur totale si linéaire). Floyd n'alloue pas d'ensemble, donc il gagne quand la mémoire est serrée ou que les buffers sont interdits.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers poussent sur:

* **Pas de boucle** → la phase 1 touche `null` via `fast` ou `fast.next`. Renvoie `null`. N'entre pas en phase 2.
* **Un seul nœud, sans auto-boucle** (`A → null`) → `fast.next` est null au premier test. Pas de boucle.
* **Un seul nœud avec auto-boucle** (`A → A`) → le début est `A`. La phase 2 est une égalité immédiate après reset.
* **Le cycle inclut le head** (`A → B → C → A`) → le début est `A`.
* **Liste vide** → renvoie `null` tout de suite.
* **Cycle de deux nœuds** (`A → B → A`) → ça marche encore; pas de cas spécial.
* **Long préfixe, petite boucle** ou l'inverse → même algo. Le temps reste linéaire en N.

Erreurs fréquentes:

1. **Comparer les valeurs `data` au lieu de l'identité des nœuds.** Deux nœuds peuvent porter le même `int` sans être le même objet. Utilise `==` sur les références.
2. **Avancer les deux pointeurs sans vérifier `fast.next`.** Garde toujours `fast != null && fast.next != null` avant `fast.next.next`.
3. **Oublier la phase 2.** La rencontre prouve qu'un cycle existe. Elle ne prouve **pas** que le nœud de rencontre est le début.
4. **Avancer à des vitesses différentes en phase 2.** Les deux doivent faire un pas. Les maths ne tiennent qu'à rythme égal après le reset.
5. **Renvoyer le point de rencontre de la phase 1 comme réponse.** Faux presque toujours, sauf coup de chance sur les longueurs.

Entrée minimale sûre avec null:

```java
Node findLoopStartSafe(Node head) {
    return findLoopStart(head);
}
```

---

## 7. Récap à raconter à un ami

Loop detection demande: si une liste simplement chaînée a un cycle, quel nœud le commence?

1. La tortue fait un pas, le lièvre deux. Si le lièvre tombe en bout de liste, pas de cycle.
2. S'ils se rencontrent, un cycle existe quelque part à partir du head (ou sur le head).
3. Remets un pointeur sur le head. Fais marcher les deux d'un pas à la fois. Là où ils se rejoignent, c'est le début de la boucle.
4. Pourquoi: la longueur du préfixe sans boucle et le décalage autour du cycle s'alignent quand les deux marchent à la même vitesse après le reset. Tu obtiens la porte de l'ovale sans compter μ ni λ à la main.
5. Liste vide et listes linéaires renvoient null. Une auto-boucle d'un nœud renvoie ce nœud.

Si tu peux le dire en trente secondes, croquer les deux phases, et ne pas confondre "point de rencontre" et "début de boucle", tu maîtrises le problème 2.8.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Intersection](/blog/fr/ctci-2-7-intersection)
* Suivant: [Three in One](/blog/fr/ctci-3-1-three-in-one)