---
title: "Stack Min: push, pop et min() en O(1) (Java)"
description: "Problème style CTCI 3.2 pour débutants: concevoir une pile qui renvoie le minimum courant en temps constant. Suivre les mins avec une seconde pile (ou min-jusqu'ici sur chaque nœud), en Java clair."
date: "2025-11-29"
tags: [Algorithmes]
coverImage: /assets/images/ctci-3-2-stack-min.webp
previewImage: /assets/images/ctci-3-2-stack-min.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 3.2 pour débutants: concevoir une pile qui renvoie le minimum courant en temps constant. Suivre les mins avec une seconde pile (ou min-jusqu'ici sur chaque nœud), en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu gardes des jetons de score dans un gobelet. Tu n'ajoutes qu'un jeton au sommet ou tu retires le sommet. Parfois un ami demande: "Quel est le score le plus bas dans le gobelet maintenant?" Si tu vides tout pour regarder, c'est lent. Si tu tiens un second gobelet plus petit qui ne garde que les nouveaux plus bas, tu réponds d'un coup d'œil. Ce second gobelet, c'est l'idée de **Stack Min**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions d'entretien sur les piles, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 3, piles et files.

---

## 1. Analogie du quotidien

Une pile normale, c'est une pile d'assiettes: dernier entré, premier sorti. Tu vois toujours l'assiette du dessus. Tu ne connais **pas** automatiquement l'assiette la moins chère enfouie en dessous.

Stack Min ajoute une règle: à tout moment tu dois connaître la **plus petite valeur encore dans la pile**, sans la parcourir.

* **push(x):** pose x au sommet.
* **pop():** retire le sommet.
* **min():** renvoie le minimum courant parmi toutes les valeurs empilées. Doit rester rapide même si la pile est profonde.

L'astuce n'est pas une recherche maligne. C'est **mémoriser l'historique des nouveaux minima** au push, et **oublier un minimum** seulement quand tu pops la valeur qui l'a créé.

---

## 2. Problème en mots simples

**Construis** une pile d'entiers avec trois opérations, chacune en temps **O(1)**:

| Opération | Signification |
| --- | --- |
| `push(value)` | empiler |
| `pop()` | retirer et renvoyer le sommet |
| `min()` | renvoyer la plus petite valeur actuellement dans la pile (sans la retirer) |

Aides optionnelles: `peek()`, `isEmpty()`. Mêmes objectifs de complexité.

**Exemples:**

| Action | Pile (fond → sommet) | min() |
| --- | --- | --- |
| push 5 | 5 | 5 |
| push 3 | 5, 3 | 3 |
| push 7 | 5, 3, 7 | 3 |
| push 3 | 5, 3, 7, 3 | 3 |
| pop | 5, 3, 7 | 3 |
| pop | 5, 3 | 3 |
| pop | 5 | 5 |

**À clarifier avant de coder:**

* Entiers seulement pour ce billet? (Oui. Le même schéma marche pour tout type comparable.)
* Que faire si `min()` ou `pop()` sur une pile vide? (Lever, p. ex. `EmptyStackException`.)
* Doublons autorisés? (Oui. C'est un piège classique du suivi de min.)
* `min()` laisse la pile inchangée? (Oui. Seul `pop` retire.)

---

## 3. Réfléchir d'abord

### Pourquoi une seule pile ne suffit pas

Si tu ne stockes que les valeurs, `min()` exige un parcours complet: O(N). Tu pourrais recalculer le min à chaque pop en reparcourant. Ce n'est toujours pas O(1). Mettre en cache un champ `currentMin` casse au pop: quand tu retires le minimum courant, tu ne sais plus quel était le minimum *précédent* si tu ne l'as pas stocké.

### Approche A: seconde pile de mins (solution principale)

Garde deux piles:

1. **`values`:** les vraies données, LIFO normal.
2. **`mins`:** seulement l'historique des minima.

Règles:

* Sur **push(x):**
  1. Toujours empiler `x` sur `values`.
  2. Si `mins` est vide **ou** `x <= mins.peek()`, empiler aussi `x` sur `mins`.
* Sur **pop():**
  1. Pop depuis `values`.
  2. Si cette valeur **égale** `mins.peek()`, pop aussi `mins`.
* Sur **min():** renvoyer `mins.peek()` (après contrôles de vide).

Utilise `<=` (pas `<`) pour décider d'enregistrer un nouveau min. Ainsi chaque copie d'un minimum dupliqué a sa propre entrée sur `mins`, et chaque pop d'un doublon retire une entrée correctement.

### Approche B: le nœud stocke min-jusqu'ici

Chaque nœud de pile contient `(value, minWhenThisWasPushed)`. Au push de `x`, le champ min du nouveau nœud est `min(x, previousTop.min)` (ou juste `x` si la pile était vide). Alors `min()` est `top.min` en O(1). L'espace reste O(N): un int de plus par nœud au lieu d'une seconde pile souvent plus courte.

Les deux se défendent en entretien. La seconde pile se dessine facilement. Le champ sur le nœud est compact si tu possèdes déjà le type de nœud.

### Ce qu'il ne faut pas faire

* Trier la pile (détruit l'ordre LIFO).
* Parcourir à chaque appel de `min()` (rate l'exigence O(1)).
* Ne stocker que le premier min et ne jamais le mettre à jour (faux après des push plus grands et après le pop du min).

---

## 4. Solution Java

Conception principale: deux piles. Utilise `java.util.Stack` pour la clarté en entretien; en production tu préférerais souvent `ArrayDeque`.

```java
import java.util.EmptyStackException;
import java.util.Stack;

/**
 * Stack that supports push, pop, peek, and min in O(1) time.
 * mins holds a history of new (or equal) minima.
 */
class StackWithMin {
    private final Stack<Integer> values = new Stack<>();
    private final Stack<Integer> mins = new Stack<>();

    public void push(int value) {
        values.push(value);
        if (mins.isEmpty() || value <= mins.peek()) {
            mins.push(value);
        }
    }

    public int pop() {
        if (values.isEmpty()) {
            throw new EmptyStackException();
        }
        int value = values.pop();
        if (value == mins.peek()) {
            mins.pop();
        }
        return value;
    }

    public int min() {
        if (mins.isEmpty()) {
            throw new EmptyStackException();
        }
        return mins.peek();
    }

    public int peek() {
        if (values.isEmpty()) {
            throw new EmptyStackException();
        }
        return values.peek();
    }

    public boolean isEmpty() {
        return values.isEmpty();
    }
}
```

Parcours pour push 5, 3, 7, 3 puis deux pops:

| Étape | values (fond → sommet) | mins | min() |
| --- | --- | --- | --- |
| push 5 | 5 | 5 | 5 |
| push 3 | 5, 3 | 5, 3 | 3 |
| push 7 | 5, 3, 7 | 5, 3 | 3 |
| push 3 | 5, 3, 7, 3 | 5, 3, 3 | 3 |
| pop (3) | 5, 3, 7 | 5, 3 | 3 |
| pop (7) | 5, 3 | 5, 3 | 3 |

Remarque: 7 n'est jamais entré dans `mins`. Le second 3 oui, donc le premier pop de 3 laisse min = 3.

### Esquisse alternative: min sur chaque nœud

```java
class NodeWithMin {
    final int value;
    final int min; // smallest value in the stack when this node is at the top

    NodeWithMin(int value, int min) {
        this.value = value;
        this.min = min;
    }
}

class StackWithMinNodes {
    private final Stack<NodeWithMin> stack = new Stack<>();

    public void push(int value) {
        int newMin = stack.isEmpty() ? value : Math.min(value, stack.peek().min);
        stack.push(new NodeWithMin(value, newMin));
    }

    public int pop() {
        return stack.pop().value;
    }

    public int min() {
        return stack.peek().min;
    }
}
```

Mêmes opérations O(1). L'espace extra est toujours un int par élément, pas une pile de mins plus courte.

---

## 5. Tableau de complexité

| Approche | push | pop | min | Espace extra | Notes |
| --- | --- | --- | --- | --- | --- |
| Parcourir toute la pile pour min | O(1) | O(1) | O(N) | O(1) | rate le brief |
| Recalculer min seulement au pop | O(1) | O(N) | O(1) | O(1) | pas tout en O(1) |
| Seconde pile de mins | O(1) | O(1) | O(1) | O(N) pire cas, souvent moins | réponse principale ici |
| Champ min sur chaque nœud | O(1) | O(1) | O(1) | O(N) toujours | propre si tu contrôles le nœud |

N est le nombre d'éléments dans la pile. Les deux bonnes réponses utilisent une mémoire extra linéaire au pire cas. C'est attendu: tu achètes un min en temps constant.

---

## 6. Cas limites et erreurs courantes

Les interviewers testent ça:

* **Pile vide puis min() ou pop()** → lever. Ne renvoie pas un nombre magique comme `Integer.MAX_VALUE` sauf si l'énoncé le dit.
* **Un seul élément** → un push, min égale cette valeur, un pop laisse vide, ne pas appeler min sans garde.
* **Doublons du minimum** → utiliser `<=` en poussant sur `mins`. Avec un `<` strict, deux copies du même min cassent après le premier pop de cette valeur.
* **Séquence strictement croissante** (1, 2, 3, 4) → `mins` ne contient que 1. Correct.
* **Séquence strictement décroissante** (4, 3, 2, 1) → chaque push met à jour le min. `mins` grandit avec `values`.
* **Pop du min global, un sommet plus grand reste** → le min précédent doit réapparaître depuis l'historique (ou le champ min du nœud précédent).

Erreurs fréquentes:

1. **Utiliser `<` au lieu de `<=` pour la pile de mins.** Les mins en double cassent.
2. **Toujours popper `mins` à chaque `pop`.** Faux quand la valeur retirée n'était pas le min courant.
3. **Oublier les contrôles de vide** avant `peek` sur l'une ou l'autre pile.
4. **Renvoyer min en parcourant `values`** et l'appeler O(1) quand même.
5. **Muter la pile dans `min()`.** `min` est une requête, pas une opération destructive.

---

## 7. Résumé pour l'expliquer à un ami

Stack Min demande une pile où push, pop et "quelle est la plus petite valeur maintenant?" sont tous en temps constant.

1. Une pile simple ne répond pas min sans parcours.
2. Garde une seconde pile de minima (ou stocke min-jusqu'ici sur chaque nœud).
3. Au push, n'enregistre un nouveau min que si la valeur est inférieure ou égale à l'ancien min.
4. Au pop, retire une entrée de min seulement si la valeur retirée était ce min.
5. Attention aux piles vides et aux minima en double. C'est là que sont les bugs habituels.

Si tu peux dessiner les deux piles pour push 5, 3, 7, 3 et expliquer pourquoi le second 3 compte, tu maîtrises le problème 3.2.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Three in One](/blog/fr/ctci-3-1-three-in-one)
* Suivant: [Stack of Plates](/blog/fr/ctci-3-3-stack-of-plates)