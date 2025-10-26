---
title: "Stack of Plates: SetOfStacks avec capacité et popAt (Java)"
description: "Problème style CTCI 3.3 pour débutants: quand une pile d'assiettes est trop haute, on en ouvre une autre. Construire SetOfStacks pour que push et pop restent comme une seule pile, puis une courte note sur popAt(index)."
date: "2025-10-26"
tags: [Algorithmes]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 3.3 pour débutants: quand une pile d'assiettes est trop haute, on en ouvre une autre. Construire SetOfStacks pour que push et pop restent comme une seule pile, puis une courte note sur popAt(index).
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu essuies des assiettes après le dîner. Une pile sur le plan de travail va bien jusqu'à ce qu'elle tangue. À une certaine hauteur tu ouvres une deuxième pile à côté, puis une troisième. De l'extérieur tu prends toujours l'assiette du dessus de la pile la plus récente et tu poses l'assiette propre sur cette même pile récente. En interne, ce sont plusieurs piles courtes, pas un gratte-ciel. C'est **SetOfStacks**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien sur la capacité des piles, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 3, piles et files.

---

## 1. Analogie du quotidien

Imagine des assiettes de table et une règle: **aucune pile plus haute que capacity**.

* Chaque tas physique est une pile interne avec une taille max (disons 5 assiettes).
* Quand le tas courant est plein, tu ouvres un nouveau tas à droite.
* **push** pose toujours une assiette sur le tas le plus à droite qui a encore de la place (ou crée un nouveau tas si le plus à droite est plein).
* **pop** prend toujours une assiette du tas non vide le plus à droite.
* Si un tas devient vide après un pop, tu l'enlèves pour que le "plus à droite" reste honnête.

Les appelants ne gèrent pas les numéros de tas. Ils appellent seulement `push` et `pop` comme s'il y avait une pile logique. Tu caches la comptabilité multi-piles.

Le follow-up est plus méchant: **popAt(index)** retire l'assiette du dessus d'un tas précis (par index de sous-pile), pas seulement du plus récent. Ça peut laisser un trou au milieu de ta rangée de tas. Tu choisis de faire rouler les assiettes vers la gauche pour combler, ou de laisser des sous-piles creuses. Les interviewers veulent que tu nommes le compromis.

---

## 2. Problème en mots simples

**Construire** une structure `SetOfStacks` avec un `capacity` fixe par pile interne.

**Opérations:**

* `push(value)`: empile sur la pile logique (sous-pile la plus récente, ou une nouvelle si besoin).
* `pop()`: dépile de la pile logique (sommet de la sous-pile non vide la plus récente). Se comporter comme une seule pile en ordre LIFO.
* Follow-up optionnel: `popAt(index)`: pop seulement sur la sous-pile `index`.

**Invariants:**

* Aucune pile interne ne contient plus de `capacity` éléments.
* Les piles vides en fin de liste ne doivent pas rester après un `pop`.
* Un `pop` sur une structure totalement vide doit échouer proprement (exception ou signal défini).

**Exemples** (capacity = 3):

| Action | Piles internes (gauche = plus ancienne) | Notes |
| --- | --- | --- |
| push 1,2,3 | `[1,2,3]` | première pile pleine |
| push 4 | `[1,2,3] [4]` | nouvelle pile créée |
| push 5,6 | `[1,2,3] [4,5,6]` | deuxième pleine |
| pop | `[1,2,3] [4,5]` | renvoie 6 |
| pop, pop | `[1,2,3]` | deuxième pile retirée quand vide |
| popAt(0) après d'autres pushes | dépend | pop seulement du sommet de la pile 0 |

**Clarifier avant de coder:**

* Capacity fixée à la construction? (Oui pour ce billet.)
* Et si capacity vaut 0 ou est négative? (Refuser dans le constructeur.)
* pop sur vide: lever, ou renvoyer null? (On lève `EmptyStackException`.)
* popAt: rollover (décalage) ou laisser des trous au milieu? (Discuter les deux; implémenter la version simple sans re-remplir et mentionner le rollover.)

---

## 3. Réfléchir d'abord

### Un seul ArrayDeque ne suffit pas

Un seul `Stack` ou `ArrayDeque` donne déjà push/pop. Le point de ce problème est la **contrainte de capacité par pile physique**, comme des assiettes qui basculeraient, ou des pages de taille fixe dans une histoire mémoire.

### Liste de piles

Garde un `ArrayList<Stack<Integer>>` (ou `ArrayList<ArrayDeque<Integer>>`) nommé `stacks`.

* **push(v):**
  1. Si `stacks` est vide, ou si la taille de la dernière pile vaut `capacity`, ajoute une nouvelle pile vide.
  2. Pousse `v` sur la dernière pile.

* **pop():**
  1. S'il n'y a aucune pile, lever vide.
  2. Pop de la dernière pile.
  3. Si cette pile est maintenant vide, retire-la de la liste.
  4. Renvoyer la valeur.

* **Helper `lastStack()`:** renvoie la pile la plus à droite, ou null s'il n'y en a pas.

C'est tout le design de base. Pas d'arbre bizarre. Juste une liste extensible de seaux LIFO à capacité fixe.

### Modèle mental du follow-up popAt

`popAt(index)` a besoin de contrôles de bornes: index dans l'intervalle, pile non vide.

Après un pop sur une pile du milieu, options:

1. **Laisser des trous.** La pile `i` peut être plus courte que capacity alors que la pile `i+1` a encore des éléments. Code plus simple. `push` ne touche toujours que la dernière pile (sauf si tu rééquilibres aussi au push, ce que la plupart des solutions ne font pas).
2. **Rollover / shift.** Quand tu pops de la pile `i`, tu prends l'élément du **fond** de la pile `i+1` et tu le pousses sur le sommet de la pile `i`, en cascade. Garde chaque pile pleine sauf peut-être la dernière. Plus de code, layout "dense" plus propre, O(N) au pire par popAt s'il y a beaucoup de piles.

Dis les deux à voix haute. Implémente la version simple sauf s'ils exigent le rollover.

---

## 4. Solution Java (SetOfStacks)

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.EmptyStackException;
import java.util.List;

/**
 * Several fixed-capacity stacks that behave as one logical stack for push/pop.
 * Capacity is per inner stack. New stacks open when the current one is full.
 */
class SetOfStacks {
    private final int capacity;
    private final List<Deque<Integer>> stacks = new ArrayList<>();

    SetOfStacks(int capacity) {
        if (capacity < 1) {
            throw new IllegalArgumentException("capacity must be at least 1");
        }
        this.capacity = capacity;
    }

    void push(int value) {
        Deque<Integer> last = lastStack();
        if (last == null || last.size() == capacity) {
            last = new ArrayDeque<>();
            stacks.add(last);
        }
        last.push(value);
    }

    int pop() {
        Deque<Integer> last = lastStack();
        if (last == null) {
            throw new EmptyStackException();
        }
        int value = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return value;
    }

    /**
     * Pop only from sub-stack at index (0 = oldest).
     * Leaves later stacks as-is (no rollover). See section 5.
     */
    int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException("sub-stack index: " + index);
        }
        Deque<Integer> stack = stacks.get(index);
        if (stack.isEmpty()) {
            throw new EmptyStackException();
        }
        int value = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return value;
    }

    boolean isEmpty() {
        return stacks.isEmpty();
    }

    int numberOfStacks() {
        return stacks.size();
    }

    private Deque<Integer> lastStack() {
        if (stacks.isEmpty()) {
            return null;
        }
        return stacks.get(stacks.size() - 1);
    }
}
```

Parcours avec capacity 3:

1. `push(1..3)` → une pile pleine `[1,2,3]` (sommet = 3).
2. `push(4)` → une deuxième pile apparaît: `[1,2,3] [4]`.
3. `pop()` → 4; la deuxième pile est vide et retirée → `[1,2,3]`.
4. `pop()` → 3 → `[1,2]`.
5. Après d'autres pushes avec trois piles, `popAt(0)` ne retire que le sommet de la plus ancienne. Les suivantes restent (pas de shift).

Pourquoi `ArrayDeque` plutôt que `java.util.Stack`? `Stack` est une vieille sous-classe synchronisée de `Vector`. `ArrayDeque` est le choix LIFO moderne habituel en entretien Java. Le comportement est le même pour nous.

---

## 5. Note sur popAt (follow-up)

`popAt(index)` est le twist qui montre si tu as seulement mémorisé "liste de piles" ou réfléchi à la structure.

**Version simple (ci-dessus):** pop sur `stacks.get(index)`, retire la sous-pile si elle est vide. Les piles du milieu peuvent rester sous capacity alors que les plus récentes sont pleines. C'est acceptable si le problème demande seulement un pop légal sur cette sous-pile.

**Version rollover (esquisse, code non obligatoire):**

* Pop sur la pile `index`.
* Tant qu'il y a une pile suivante, prendre son élément du **fond** (il faut une structure qui expose le fond, ou reconstruire) et le pousser sur la pile courante pour restaurer capacity.
* Répéter en chaîne jusqu'à la dernière pile.

Le rollover garde la métaphore des assiettes serrée: quand tu retires une assiette d'un tas plus ancien, les assiettes "tombent à gauche" depuis les tas plus récents pour qu'aucun tas du milieu ne reste à moitié vide. Le coût croît avec le nombre de piles et d'éléments déplacés. Mentionne-le; n'implémente que si on le demande.

Clarifie aussi le sens de l'index: 0 est-il la pile la plus ancienne ou la plus récente? Choisis-en un et tiens-toi-y. Dans le code ci-dessus, **0 est la plus ancienne**.

---

## 6. Tableau de complexité

| Opération | Temps | Espace extra (au-delà des éléments) | Notes |
| --- | --- | --- | --- |
| `push` | O(1) amorti | O(1) | allocation occasionnelle d'une nouvelle pile |
| `pop` | O(1) | O(1) | peut retirer une pile vide en fin de liste |
| `popAt` (sans rollover) | O(1) ou O(S) | O(1) | O(S) si retirer une pile vide au milieu décale la liste |
| `popAt` (avec rollover) | O(N) pire cas | O(1) | peut toucher chaque pile suivante |
| `isEmpty` | O(1) | O(1) | vide ssi aucune sous-pile ne reste |

N est le total d'éléments sur toutes les piles. S est le nombre de sous-piles. L'espace de la structure est O(N) pour stocker les valeurs, comme une grande pile, plus un petit nombre d'en-têtes de pile.

---

## 7. Cas limites et erreurs fréquentes

Les interviewers testent ceux-ci:

* **capacity = 1** → chaque push ouvre une nouvelle pile (ou remplit une pile de taille 1 et le push suivant en ouvre une autre). pop retire toujours la plus récente. Ça marche si tu ne fais pas de cas spécial.
* **capacity invalide** → lever dans le constructeur, ne pas attendre le push.
* **pop sur vide** → lever. Ne renvoie pas 0 ou -1 sauf si le problème autorise un sentinelle.
* **pop jusqu'à vide, puis push à nouveau** → la liste de piles repart de zéro proprement.
* **popAt hors bornes** → exception de bounds.
* **popAt qui vide une pile du milieu** → retire cette entrée (les index suivants bougent) ou laisse une tombe. Retirer est plus propre; documente que les index suivants changent.
* **Une seule pile, pas pleine** → push reste sur cette pile. Ne crée pas une deuxième pile trop tôt.

Erreurs fréquentes:

1. **Oublier de retirer les piles vides en fin après pop.** Alors `lastStack()` pointe un tas vide et le pop suivant échoue ou a besoin de plus de null checks.
2. **Pousser sur la dernière pile déjà pleine.** Toujours vérifier `size() == capacity` avant le push.
3. **Traiter popAt comme pop.** Ce sont des API différentes. L'appelant de popAt a choisi une sous-pile précise.
4. **Prendre capacity comme capacité totale de toutes les piles.** Capacity est par sous-pile.
5. **Implémenter le rollover par accident avec un seul ArrayList de valeurs et de l'arithmétique modulaire.** Ça peut marcher pour un autre design, mais alors les "sous-piles" deviennent virtuelles. Préfère une liste explicite de deques pour que la métaphore des assiettes reste visible au tableau.

---

## 8. Récap à raconter à un ami

Stack of plates demande: plusieurs piles courtes sous une limite de capacité, mais push et pop qui se sentent comme une seule pile.

1. Tiens une liste ordonnée de piles internes. Seule la dernière reçoit les push normaux.
2. Si la dernière est pleine, ajoute une nouvelle pile vide, puis push.
3. Pop de la dernière. Si elle se vide, supprime-la de la liste.
4. L'ordre LIFO de la pile logique est préservé: l'assiette la plus récente sort en premier, même en traversant les frontières de tas.
5. popAt(index) ne pop que ce tas. Soit tu laisses des trous, soit tu fais rouler les assiettes à gauche. Dis lequel tu as choisi.

Si tu peux dessiner trois piles de hauteur 3, pousser une 10e assiette, pop deux fois, et expliquer pourquoi le tas vide le plus à droite disparaît, tu maîtrises le problème 3.3.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Stack Min](/blog/fr/ctci-3-2-stack-min)
* Suivant: [Queue via Stacks](/blog/fr/ctci-3-4-queue-via-stacks)