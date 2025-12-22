---
title: "Sum Lists: additionner des nombres stockés en listes chaînées (Java)"
description: "Problème style CTCI 2.5: deux nombres vivent en listes chaînées, un chiffre par nœud, le chiffre des unités en tête. Parcourir les deux avec une retenue et construire la liste somme. Note courte sur le follow-up en ordre direct."
date: "2025-12-22"
tags: [Algorithmes]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 2.5: deux nombres vivent en listes chaînées, un chiffre par nœud, le chiffre des unités en tête. Parcourir les deux avec une retenue et construire la liste somme. Note courte sur le follow-up en ordre direct.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu additionnes deux grands nombres sur papier comme à l'école: tu les alignes à **droite**, tu commences par les unités, tu écris un chiffre, tu portes une retenue vers la gauche. Les chiffres vivent en colonnes. La retenue est un peu de mémoire entre colonnes.

Maintenant mets chaque chiffre dans un nœud d'une liste chaînée simple, et place le **chiffre des unités en tête**. Parcourir la liste, c'est exactement parcourir les colonnes de droite à gauche sur le papier. C'est **Sum Lists**.

Ce billet est un cours original pour débutants en **Java**. Même famille de problèmes que l'addition classique par listes en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## Analogie du quotidien

Deux tickets, chaque nombre écrit chiffre par chiffre sur des post-its:

* `7 → 1 → 6` signifie **617** (7 unités, 1 dizaine, 6 centaines).
* `5 → 9 → 2` signifie **295**.

Additionne comme sur papier:

| Colonne | Chiffres | Somme + retenue in | Écrit | Retenue out |
| --- | --- | --- | --- | --- |
| unités | 7 + 5 | 12 | 2 | 1 |
| dizaines | 1 + 9 | 11 | 1 | 1 |
| centaines | 6 + 2 | 9 | 9 | 0 |

Résultat sur papier: **912**. En liste inverse: `2 → 1 → 9`.

La liste stocke déjà les chiffres dans l'ordre de l'addition. Tu n'inverses pas d'abord. Tu parcours et tu portes la retenue.

---

## Le problème en mots simples

**Entrée:** têtes de deux listes chaînées simples. Chaque nœud contient un chiffre `0-9`. Les chiffres sont en **ordre inverse**: la tête est la place des unités.

**Sortie:** tête d'une nouvelle liste représentant la somme, aussi en ordre inverse (unités en tête).

**Forme de nœud utilisée:**

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

| Liste A | Liste B | Nombres | Liste somme | Pourquoi |
| --- | --- | --- | --- | --- |
| `7 → 1 → 6` | `5 → 9 → 2` | 617 + 295 | `2 → 1 → 9` | 912 |
| `9 → 9` | `1` | 99 + 1 | `0 → 0 → 1` | 100; la retenue finale devient un nœud |
| `1 → 2` | `3 → 4 → 5` | 21 + 543 | `4 → 6 → 5` | longueurs différentes; 564 |
| `0` | `0` | 0 + 0 | `0` | toujours un chiffre |
| `null` | `5 → 1` | vide = 0 | `5 → 1` | un côté vide |

**Clarifie avant de coder** (dis-le à voix haute):

* L'ordre inverse (unités en tête) est le problème principal. L'ordre direct est un follow-up.
* Chiffres seuls, ou ints complets? Chiffres `0-9` par nœud.
* Une liste peut-elle être vide ou null?
* Nouveaux nœuds, ou mutation d'une entrée? Préfère des **nouveaux nœuds** pour ne pas détruire les entrées.
* Zéros de tête dans le nombre conceptuel? Souvent entrée propre; gère quand même une retenue restante.

---

## Comment réfléchir avant de coder

### Ce qu'il ne faut pas faire d'abord

Ne convertis pas chaque liste en `int` ou `long`, n'additionne pas, ne reconstruis pas. Ça casse pour des nombres plus longs que 64 bits, et c'est une bonne partie de l'intérêt des listes de chiffres. Les interviewers le voient.

### Ordre inverse: coller à l'addition papier

Garde trois choses:

1. Pointeur dans la liste A.
2. Pointeur dans la liste B.
3. Un entier `carry` (0 ou 1 en base 10; en général 0 ou 1 si les chiffres sont 0-9).

Chaque étape:

```
sum = carry
if A not null: sum += A.data; A = A.next
if B not null: sum += B.data; B = B.next
digit = sum % 10
carry = sum / 10
append a new node with digit
```

Boucle tant qu'**une des listes a encore des nœuds ou que la retenue est non nulle**. Cette dernière clause explique comment `99 + 1` gagne un troisième chiffre.

Utilise une **tête dummy** pour que le premier vrai chiffre soit toujours `dummy.next`. Pas de cas spécial pour le premier append.

### Version récursive (même idée)

Base: les deux null et carry 0 → retourne null. Sinon calcule la somme des têtes courantes (ou 0 si null) plus carry, crée un nœud pour `sum % 10`, et mets `next` sur l'appel récursif des queues avec la nouvelle retenue. Même complexité, profondeur de pile O(longueur max).

L'itératif avec tête dummy est souvent plus propre en Java. Les deux vont si la retenue est correcte.

### Idée du follow-up: ordre direct (unités en queue)

Les têtes sont maintenant les chiffres de plus fort poids. L'addition papier veut d'abord le moins significatif, donc l'ordre te résiste.

Plan court (pas besoin du code production complet ici):

1. Trouve les longueurs des deux listes.
2. **Complète** la plus courte avec des zéros de tête (nouveaux nœuds, ou padding conceptuel en récursion) pour égaliser les longueurs.
3. Recurse jusqu'à la fin, additionne au retour, en renvoyant la liste partielle et la retenue (objet wrapper ou petite classe résultat).
4. S'il reste une retenue finale, préfixe un nouveau chiffre en tête.

Tu peux inverser les deux entrées, appeler la solution ordre inverse, inverser le résultat. Ça marche et s'explique facilement. On peut encore vouloir pad-and-recurse pour additionner sans muter l'ordre.

Le focus de cet article reste l'ordre inverse.

---

## Solution Java (ordre inverse, itérative)

```java
/**
 * Adds two numbers stored as reverse-order digit lists.
 * Example: 7→1→6 + 5→9→2 represents 617 + 295 → 2→1→9 (912).
 */
Node sumLists(Node l1, Node l2) {
    Node dummy = new Node(0);
    Node tail = dummy;
    int carry = 0;

    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry;
        if (l1 != null) {
            sum += l1.data;
            l1 = l1.next;
        }
        if (l2 != null) {
            sum += l2.data;
            l2 = l2.next;
        }

        tail.next = new Node(sum % 10);
        tail = tail.next;
        carry = sum / 10;
    }

    return dummy.next;
}
```

Parcours pour `7 → 1 → 6` et `5 → 9 → 2`:

| Étape | chiffre l1 | chiffre l2 | carry in | sum | écrit | carry out | résultat jusqu'ici |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | 5 | 0 | 12 | 2 | 1 | `2` |
| 2 | 1 | 9 | 1 | 11 | 1 | 1 | `2 → 1` |
| 3 | 6 | 2 | 1 | 9 | 9 | 0 | `2 → 1 → 9` |
| 4 | - | - | 0 | stop | | | fini |

Esquisse récursive (même contrat ordre inverse):

```java
Node sumListsRecursive(Node l1, Node l2, int carry) {
    if (l1 == null && l2 == null && carry == 0) {
        return null;
    }

    int sum = carry;
    if (l1 != null) {
        sum += l1.data;
    }
    if (l2 != null) {
        sum += l2.data;
    }

    Node result = new Node(sum % 10);
    Node next1 = (l1 == null) ? null : l1.next;
    Node next2 = (l2 == null) ? null : l2.next;
    result.next = sumListsRecursive(next1, next2, sum / 10);
    return result;
}

// Public entry: sumListsRecursive(a, b, 0)
```

---

## Ordre direct en un passage court

Si les chiffres vont du plus significatif au moins significatif (`6 → 1 → 7` pour 617):

* Option A: inverse les deux, `sumLists`, inverse la réponse.
* Option B: complète la plus courte, recurse vers les queues, additionne en remontant, emballe retenue + nœud dans une petite classe helper, préfixe la retenue restante.

L'option A réutilise le code ci-dessus. L'option B est le follow-up classique "sans inverser". En nommer une en entretien suffit avant d'écrire proprement l'ordre inverse.

---

## Complexité

| | Coût | Pourquoi |
| --- | --- | --- |
| Temps | O(max(m, n)) | Un passage sur les deux listes; au plus un nœud extra pour la retenue finale |
| Espace extra (itératif) | O(max(m, n)) pour la sortie | La taille de sortie est la longueur de la somme; les pointeurs auxiliaires sont O(1) |
| Espace extra (récursif) | O(max(m, n)) pile + sortie | La profondeur suit la liste la plus longue |

Tu ne peux pas faire mieux que linéaire en longueur d'entrée: chaque chiffre peut influencer la somme.

---

## Cas limites que les interviewers touchent

1. **Longueurs différentes.** `1 → 2` et `3 → 4 → 5`. Continue la boucle tant qu'un pointeur n'est pas null. Le côté manquant contribue 0.
2. **Retenue finale.** `9 → 9` + `1` → `0 → 0 → 1`. La condition de boucle doit inclure `carry != 0`.
3. **Une liste null ou vide.** La somme est une copie de l'autre (plus la chaîne de retenue). Ne plante pas sur null.
4. **Les deux à un seul nœud.** `5` + `7` → `2 → 1` s'il y a retenue.
5. **Zéro.** `0` + `0` → `0`. Renvoyer `null` pour zéro est en général faux sauf si le problème dit que vide signifie zéro.
6. **Que des neuf.** Longues chaînes de retenue; toujours un nouveau nœud par chiffre et au plus un extra.
7. **Muter les entrées par accident.** Construire avec `new Node(...)` laisse intactes les listes des appelants.
8. **Piège de l'ordre direct.** Si l'interviewer inverse l'ordre des chiffres en cours de route, reformule l'ordre à voix haute avant de coder.

Erreurs fréquentes:

* S'arrêter quand **les deux** listes sont finies mais la retenue vaut encore 1.
* Utiliser `sum % 10` pour la retenue et `sum / 10` pour le chiffre (inversé).
* Convertir en `int` et déborder.
* Oublier la tête dummy et spécialiser le premier nœud jusqu'à ce que le code devienne sale.

---

## Récap à raconter à un ami

Sum Lists, c'est l'addition sur papier où chaque chiffre est un nœud de liste chaînée et la **place des unités est en tête**.

1. Parcours les deux listes ensemble avec une retenue.
2. À chaque étape: ajoute les deux chiffres (ou zéro si une liste est finie) plus la retenue, écris `sum % 10`, mets la retenue à `sum / 10`.
3. Continue jusqu'à ce que les deux listes soient finies **et** que la retenue soit zéro.
4. La tête dummy rend l'append indolore.
5. L'ordre direct, c'est la même arithmétique après inversion, ou après padding et récursion depuis le haut.

Si tu peux additionner `7→1→6` et `5→9→2` au tableau sans bloquer sur la dernière retenue, tu maîtrises le problème 2.5.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Partition](/blog/fr/ctci-2-4-partition)
* Suivant: [Palindrome](/blog/fr/ctci-2-6-palindrome)