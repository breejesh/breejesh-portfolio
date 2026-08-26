---
title: "CTCI 2.2 Return Kth to Last: deux pointeurs sur une liste chaînée"
description: "Trouver le k-ième nœud depuis la fin d'une liste chaînée simple. Parcourir l'écart classique de k avec deux pointeurs, puis un petit wrapper récursif, en Java clair."
date: "2026-02-20"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-2-return-kth-to-last.webp
previewImage: /assets/images/ctci-2-2-return-kth-to-last.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Trouver le k-ième nœud depuis la fin d'une liste chaînée simple. Parcourir l'écart classique de k avec deux pointeurs, puis un petit wrapper récursif, en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Toi et un ami marchez sur un sentier en file indienne. Ton ami part **k pas** devant. Quand il atteint la fin du chemin, tu es sur la k-ième pierre en comptant depuis la fin. Tu n'as pas eu besoin de la longueur totale. Seulement de l'écart.

C'est **Return Kth to Last**: trouver le nœud situé à k places de la fin d'une liste chaînée simple. On définit **k = 1 comme le dernier élément**.

C'est le problème style CTCI **2.2**, chapitre 2 (Linked Lists). Solution principale: deux pointeurs itératifs. Optionnel: récursif avec un petit wrapper d'index. Enseignement original en Java, pas un copier-coller de livre.

Série: [CTCI en Java](/blog/fr/ctci-series-guide). Précédent: [2.1 Remove Dups](/blog/fr/ctci-2-1-remove-dups). Suivant: [2.3 Delete Middle Node](/blog/fr/ctci-2-3-delete-middle-node).

---

## Image du quotidien

Un train de wagons, de la tête à la queue. Tu ne marches que vers l'avant. Pas de marche arrière, pas de numéro peint sur chaque wagon.

Quelqu'un demande: "Donne-moi le 2e wagon depuis le fourgon de queue." Si tu connaissais la longueur n, tu ferais n - 2 pas depuis la tête. Tu ne connais pas encore n. Compter une fois pour obtenir n, puis remarcher, ça marche. Ce sont aussi deux passages complets.

Mieux: envoie un éclaireur **k** wagons devant. Puis avance éclaireur et toi ensemble, un wagon à la fois. Quand l'éclaireur tombe au bout, ton wagon est le k-ième depuis la fin.

---

## Le problème en mots simples

**Entrée:** la tête d'une liste chaînée simple, et un entier positif `k`.

**Sortie:** le nœud qui est le **k-ième depuis la fin**. Avec notre convention, `k = 1` renvoie le dernier nœud, `k = 2` l'avant-dernier, et ainsi de suite.

**Exemples** (liste dessinée tête → queue):

| Liste | k | Résultat | Pourquoi |
| --- | --- | --- | --- |
| `1 → 2 → 3 → 4 → 5` | 1 | nœud `5` | dernier élément |
| `1 → 2 → 3 → 4 → 5` | 2 | nœud `4` | deuxième depuis la fin |
| `1 → 2 → 3 → 4 → 5` | 5 | nœud `1` | k égal à la longueur |
| `1 → 2 → 3` | 4 | null (ou erreur) | k plus grand que la longueur |
| `7` | 1 | nœud `7` | un seul nœud, le dernier est lui-même |

**Clarifie à voix haute avant de coder:**

* Est-ce que `k = 1` est le dernier nœud? (Oui ici. Certaines équipes partent de 0. Demande.)
* Que faire si `k` dépasse la longueur? null, exception, ou sentinelle? Choisis un contrat. Nous renvoyons `null`.
* Renvoyer le **nœud**, ou seulement sa valeur? En entretien on veut souvent le nœud pour enchaîner.
* Tête null? Liste vide → null.

---

## Comment réfléchir avant de coder

### Force brute: longueur, puis marche

1. Parcours la liste une fois, compte `n`.
2. Si `k > n`, échoue.
3. Repars de la tête et fais `n - k` pas.

Correct. Deux passages. Acceptable si l'intervieweur est content d'un O(n) en deux trajets. Beaucoup demandent ensuite: peut-on le faire en **un** passage?

### Un passage: deux pointeurs avec un écart de k

1. Les pointeurs `p1` et `p2` démarrent sur `head`.
2. Avance `p1` d'exactement `k` pas. Si tu tombes trop tôt, `k` est trop grand.
3. Avance `p1` et `p2` ensemble jusqu'à ce que `p1` soit null.
4. `p2` est alors sur le k-ième depuis la fin.

Pourquoi ça marche: quand `p1` a parcouru le reste du suffixe, `p2` est resté exactement `k` nœuds derrière la "fin". La fin est juste après le dernier nœud, donc `p2` est sur le k-ième depuis la fin.

Trace `1 → 2 → 3 → 4 → 5`, `k = 2`:

| Étape | p1 | p2 |
| --- | --- | --- |
| départ | 1 | 1 |
| avance p1 une fois | 2 | 1 |
| avance p1 deux fois | 3 | 1 |
| bougent tous les deux | 4 | 2 |
| bougent tous les deux | 5 | 3 |
| bougent tous les deux | null | 4 |

`p2` est `4`. Terminé.

### Idée récursive (optionnelle)

Récursion jusqu'à la fin. Au retour, compte combien de nœuds tu as passés. Quand le compteur atteint `k`, ce nœud est la réponse. Il te faut un **compteur partagé** (ou un petit wrapper), car un simple `int` de retour ne porte pas à la fois "le compte" et "le nœud réponse" proprement en Java sans type auxiliaire.

La récursion est élégante si tu expliques la pile. Préfère la version itérative à deux pointeurs comme réponse principale: O(1) d'espace extra, pas de risque de pile sur les longues listes.

---

## Solution Java

### Type Node

```java
/** Singly linked list node. Original teaching model for this series. */
public class Node {
    public int data;
    public Node next;

    public Node(int data) {
        this.data = data;
    }
}
```

### Réponse principale: deux pointeurs itératifs

```java
/**
 * Returns the kth node from the end of the list.
 * k = 1 means the last node. Returns null if the list is too short
 * or inputs are invalid.
 */
public static Node kthToLast(Node head, int k) {
    if (head == null || k < 1) {
        return null;
    }

    Node p1 = head;
    Node p2 = head;

    // Open a gap of k between p1 and p2.
    for (int i = 0; i < k; i++) {
        if (p1 == null) {
            // k is larger than the number of nodes.
            return null;
        }
        p1 = p1.next;
    }

    // When p1 walks off the end, p2 is k nodes from the end.
    while (p1 != null) {
        p1 = p1.next;
        p2 = p2.next;
    }
    return p2;
}
```

Construis une petite liste et appelle-la:

```java
// 1 → 2 → 3 → 4 → 5
Node head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head.next.next.next = new Node(4);
head.next.next.next.next = new Node(5);

Node ans = kthToLast(head, 2); // data == 4
```

### Optionnel: récursif avec wrapper d'index

```java
/** Mutable counter so recursion can share one index on the way back. */
static class Index {
    int value = 0;
}

/**
 * Recursive kth-to-last. Same k convention: k = 1 is the last node.
 * Uses O(n) stack space. Prefer kthToLast for production-sized lists.
 */
public static Node kthToLastRecursive(Node head, int k) {
    if (k < 1) {
        return null;
    }
    return kthToLastRecursive(head, k, new Index());
}

private static Node kthToLastRecursive(Node head, int k, Index idx) {
    if (head == null) {
        return null;
    }
    Node candidate = kthToLastRecursive(head.next, k, idx);
    idx.value += 1;
    if (idx.value == k) {
        return head;
    }
    return candidate;
}
```

Au dépilement, le dernier nœud reçoit le compte 1, celui d'avant 2, etc. Quand le compte égale `k`, renvoie ce nœud. Les nœuds plus proches de la tête renvoient le candidat déjà trouvé (ou null si `k` était trop grand).

---

## Complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Longueur puis marche | O(n) | O(1) | Deux passages |
| Écart deux pointeurs | O(n) | O(1) | Un passage, réponse principale |
| Index récursif | O(n) | O(n) pile | Bien à mentionner, pas le défaut à livrer |

Tu dois regarder chaque nœud dans le pire cas (ou assez de la liste pour placer les deux pointeurs), donc le temps linéaire est le bon ordre de grandeur.

---

## Cas limites que les intervieweurs touchent

1. **Tête null.** Liste vide. Renvoie null.
2. **k inférieur à 1.** Invalide. Renvoie null (ou lève). Annonce le contrat.
3. **k plus grand que la longueur.** Avant d'avoir fait k avances, `p1` est null. Renvoie null.
4. **k égal à la longueur.** Après k avances, `p1` est null. La marche commune ne tourne pas. `p2` reste sur head. Correct: head est le k-ième depuis la fin.
5. **k = 1.** Dernier nœud. Écart d'un: `p1` démarre un pas devant, les deux avancent jusqu'à `p1` null, `p2` tombe sur le dernier nœud réel.
6. **Un seul nœud, k = 1.** OK. Un seul nœud, k = 2: échec.
7. **Ne mute pas la liste.** Problème en lecture seule. Laisse les `next` tranquilles.
8. **Off-by-one sur l'écart.** Le bug classique: avancer `k - 1` ou `k + 1` par accident. Trace k = 1 et k = n sur papier avant de parler.

---

## Erreurs fréquentes

* Compter depuis le **début** comme "k-ième nœud" au lieu du k-ième depuis la **fin**.
* Utiliser un modèle base 0 (`k = 0` est le dernier) sans le dire. La salle se perd.
* Avancer le coureur `k - 1` fois alors que ta définition est k = 1 dernier. Tiens-toi à "avance k fois, puis marchez ensemble jusqu'à ce que le coureur soit null."
* Oublier le test null en ouvrant l'écart, puis NPE si `k` est énorme.
* Renvoyer `p2.data` alors qu'on demandait le **nœud**.

---

## Récap à raconter à un ami

Tu veux le k-ième wagon depuis la fin, et tu ne marches que vers l'avant.

Envoie un éclaireur **k** wagons devant. Marchez au pas. Quand l'éclaireur tombe du train, tu es sur le k-ième wagon depuis la fin. Pas besoin d'une variable de longueur.

Version récursive: va jusqu'à la fin, compte au retour, prends le nœud quand le compte atteint k. Même idée, pile à la place d'un second pointeur.

Livre la version deux pointeurs. Mentionne la récursion s'ils veulent un autre angle.

---

## Pratique

1. Code `kthToLast` de mémoire. Trace k = 1, k = 2 et k = n sur `1 → 2 → 3 → 4 → 5`.
2. Implémente la version longueur-puis-marche et prouve que les deux renvoient le même nœud.
3. Écris le wrapper récursif et explique pourquoi un `Index` partagé (ou un `int[]`) est nécessaire en Java.
4. Casse ton propre code avec k = 0, liste vide, et k plus grand que la longueur.

Précédent: [2.1 Remove Dups](/blog/fr/ctci-2-1-remove-dups). Suivant: [2.3 Delete Middle Node](/blog/fr/ctci-2-3-delete-middle-node). Carte de la série: [CTCI en Java](/blog/fr/ctci-series-guide).