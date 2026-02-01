---
title: "CTCI 2.4 Partition: couper une liste chaînée autour de x"
description: "Réordonner une liste chaînée simple pour que chaque nœud strictement inférieur à x précède les nœuds supérieurs ou égaux à x. Fusion de deux listes en Java, plus une note courte head/tail."
date: "2026-02-01"
tags: [Algorithmes]
coverImage: /assets/images/ctci-2-4-partition.webp
previewImage: /assets/images/ctci-2-4-partition.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Réordonner une liste chaînée simple pour que chaque nœud strictement inférieur à x précède les nœuds supérieurs ou égaux à x. Fusion de deux listes en Java, plus une note courte head/tail.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Au contrôle de l'aéroport, il y a deux files. Une pour les bagages sous une limite de poids, une pour ceux qui l'atteignent ou la dépassent. Les gens arrivent dans un ordre quelconque. Tu ne les tries pas par poids. Tu veux seulement que chaque bagage léger finisse à gauche et chaque bagage lourd à droite. C'est **partition** pour une liste chaînée: une coupe autour d'une valeur `x`, pas un tri complet.

C'est le problème **2.4** de la [série CTCI en Java](/blog/fr/ctci-series-guide), chapitre 2 (Linked Lists). Explication et code originaux, pas un copier-coller du livre.

---

## Le problème en mots simples

Tu reçois la tête d'une liste chaînée simple d'entiers, et un entier `x`.

**But:** réarranger les nœuds pour que chaque nœud de valeur **strictement inférieure** à `x` vienne avant chaque nœud de valeur **supérieure ou égale** à `x`.

Détails que l'entretien regarde:

- Les nœuds égaux à `x` vivent du côté **droit** (avec le groupe "supérieur ou égal"). Pas besoin d'un seau du milieu sauf si tu en inventes un.
- L'**ordre stable** (garder l'ordre relatif d'origine dans chaque côté) est agréable et souvent gratuit avec deux listes. Le problème n'exige pas toujours la stabilité.
- Préfère **réutiliser les nœuds existants**. N'alloue pas un nœud neuf pour chaque valeur sauf si l'intervieweur le demande.

Exemple classique:

```
Entrée:  3 → 5 → 8 → 5 → 10 → 2 → 1 ,  x = 5
Une sortie valide:  3 → 1 → 2 → 10 → 5 → 5 → 8
```

À gauche de la coupe: `3, 1, 2` (tous `< 5`). À droite: `10, 5, 5, 8` (tous `>= 5`). Une autre liste valide peut mélanger l'ordre dans chaque moitié, tant que la règle de coupe tient.

---

## Comment réfléchir avant de coder

### Mauvais réflexe: trier la liste

Un tri complet respecte la règle de coupe, mais c'est plus de travail que demandé. Partition est plus faible qu'un tri. Vise un temps linéaire et quelques pointeurs en plus.

### Idée principale: deux listes, puis coller

Parcours la liste une fois. Pour chaque nœud, détache-le (`node.next = null` après avoir sauvé le vrai next), puis ajoute-le à l'une des deux chaînes:

1. Liste **before**: valeurs `< x`
2. Liste **after**: valeurs `>= x`

Garde une tête et une queue pour chaque chaîne afin que l'append soit O(1). À la fin:

- Si **before** est vide, renvoie la tête de **after**.
- Sinon fais `beforeTail.next = afterHead` et renvoie la tête de **before**.
- Mets `afterTail.next = null` (ou détache au fil de l'eau) pour ne pas laisser un cycle via d'anciens liens.

C'est tout l'algo. Un passage. Quatre pointeurs (ou deux sentinelles). Facile à raconter au tableau.

### Variante optionnelle: grandir depuis head et tail

Un autre style fait grossir une seule liste résultat par les deux bouts:

- Valeurs `< x` insérées en **tête** (nouvelle head).
- Valeurs `>= x` ajoutées en **queue**.

Ça partitionne aussi en un passage. L'ordre à gauche est souvent **inversé** par rapport à l'original, ce qui convient si la stabilité n'est pas exigée. La fusion de deux listes est plus claire quand tu veux un ordre stable et l'histoire "seau gauche, seau droit."

---

## Solution Java (fusion de deux listes)

```java
/** Nœud de liste chaînée simple utilisé dans les exemples du chapitre 2. */
public class ListNode {
    public int val;
    public ListNode next;

    public ListNode(int val) {
        this.val = val;
    }
}

/**
 * Partition list around x: all nodes with val < x before nodes with val >= x.
 * Stable within each side if you always append to that side's tail.
 * Reuses existing nodes. Returns the new head.
 */
public static ListNode partition(ListNode head, int x) {
    ListNode beforeHead = null;
    ListNode beforeTail = null;
    ListNode afterHead = null;
    ListNode afterTail = null;

    ListNode current = head;
    while (current != null) {
        ListNode next = current.next;
        // Detach so old links cannot form a cycle after the merge.
        current.next = null;

        if (current.val < x) {
            if (beforeHead == null) {
                beforeHead = current;
                beforeTail = current;
            } else {
                beforeTail.next = current;
                beforeTail = current;
            }
        } else {
            if (afterHead == null) {
                afterHead = current;
                afterTail = current;
            } else {
                afterTail.next = current;
                afterTail = current;
            }
        }

        current = next;
    }

    if (beforeHead == null) {
        return afterHead;
    }

    beforeTail.next = afterHead;
    return beforeHead;
}
```

Trace de l'exemple avec `x = 5`:

| Nœud vu | Va vers | Liste before | Liste after |
| --- | --- | --- | --- |
| 3 | before | 3 | (vide) |
| 5 | after | 3 | 5 |
| 8 | after | 3 | 5 → 8 |
| 5 | after | 3 | 5 → 8 → 5 |
| 10 | after | 3 | 5 → 8 → 5 → 10 |
| 2 | before | 3 → 2 | 5 → 8 → 5 → 10 |
| 1 | before | 3 → 2 → 1 | 5 → 8 → 5 → 10 |

Coller: `3 → 2 → 1 → 5 → 8 → 5 → 10`. Partition valide. (L'exemple du livre peut réordonner dans chaque moitié; les deux passent.)

Version avec nœuds dummy de la même idée: sentinelles vides `before` et `after`, toujours append via la queue, puis `beforeTail.next = afterHead.next` et renvoie `beforeHead.next`. Même complexité, un peu moins de tests null.

---

## Complexité

| | Coût | Pourquoi |
| --- | --- | --- |
| Temps | O(n) | Un parcours de n nœuds. Chaque nœud est ajouté une fois. |
| Espace extra | O(1) | Une poignée de pointeurs. Les nœuds sont réutilisés, pas copiés dans de nouveaux objets. |

Il faut regarder chaque nœud pour savoir de quel côté il va, donc le temps linéaire est le bon plancher.

---

## Cas limites que l'intervieweur pique

1. **Liste null ou vide.** Renvoie null. Ne plante pas sur `beforeTail`.
2. **Toutes les valeurs `< x`.** After reste vide. Renvoie la tête de before. Le `next` de la queue est déjà null si tu as détaché.
3. **Toutes les valeurs `>= x`.** Before vide. Renvoie la tête de after.
4. **Un seul nœud.** Un côté ou l'autre selon la valeur. Le résultat est ce nœud avec `next == null`.
5. **`x` apparaît plusieurs fois.** Toutes les copies vont du côté after. Pas de liste du milieu requise.
6. **Doublons mélangés à d'autres valeurs.** La stabilité (si tu append) garde l'ordre relatif dans chaque côté. Dis-le à voix haute s'ils demandent.
7. **Oublier de mettre `next` à null.** Bug classique: après la fusion, l'ancienne chaîne pointe encore quelque part et tu obtiens un cycle ou une mauvaise queue.
8. **Comparer avec `<=` par erreur.** Le problème est en général **strictement** `<` à gauche. Confirme l'inégalité avant de coder.

---

## Erreurs fréquentes

- Trier, puis dire que tu as "partitionné." Correct mais excessif, et ça montre que tu as raté l'exigence plus faible.
- Créer de nouveaux nœuds pour chaque valeur et abandonner l'ancienne liste. On veut souvent de la chirurgie de pointeurs sur les nœuds existants.
- Relier `before` à `after` sans gérer before vide (null pointer) ou after vide (ok si la queue pointe déjà vers null).
- Laisser `afterTail.next` pointer au milieu de l'ancienne liste parce que tu n'as jamais cassé les liens.

---

## Récap à raconter à un ami

Partition, c'est les files de l'aéroport, pas un tri complet. Tout ce qui pèse moins que `x` va à gauche. Tout le reste à droite.

Parcours la liste une fois. Tire chaque nœud et ajoute-le à une chaîne **before** ou **after**. Colle before à after. Renvoie la tête gauche, ou la droite si la gauche n'a jamais reçu de nœud.

Un passage, quelques pointeurs, pas de drame. S'ils acceptent un ordre instable, grandir depuis head et tail marche aussi. Préfère les deux listes pour une histoire propre et des moitiés stables.

---

## Pratique

1. Code `partition` de mémoire avec quatre pointeurs, puis avec des dummies.
2. Trace sur papier `3 → 5 → 8 → 5 → 10 → 2 → 1` avec `x = 5`.
3. Trace des entrées tout-petit et tout-grand.
4. Casse exprès une solution correcte en omettant `current.next = null` et regarde le cycle.

Précédent dans la série: [Delete Middle Node](/blog/fr/ctci-2-3-delete-middle-node). Suivant: [Sum Lists](/blog/fr/ctci-2-5-sum-lists). Carte complète: [CTCI en Java](/blog/fr/ctci-series-guide).