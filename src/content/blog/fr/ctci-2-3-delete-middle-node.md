---
title: "Delete Middle Node: supprimer un noeud sans acces a la tete (Java)"
description: "Probleme style CTCI 2.3: supprimer un noeud du milieu d'une liste chainee simple quand on n'a qu'un pointeur vers ce noeud. Copie la valeur suivante, saute le suivant, et explique pourquoi le dernier noeud echoue."
date: "2026-05-14"
tags: [Algorithmes]
coverImage: /assets/images/ctci-2-3-delete-middle-node.webp
previewImage: /assets/images/ctci-2-3-delete-middle-node.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Probleme style CTCI 2.3: supprimer un noeud du milieu d'une liste chainee simple quand on n'a qu'un pointeur vers ce noeud. Copie la valeur suivante, saute le suivant, et explique pourquoi le dernier noeud echoue.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu es dans une conga. Quelqu'un te tape sur l'épaule et dit: sors de la file. Tu ne peux pas atteindre la personne derrière toi, donc tu ne peux pas lui demander de te sauter. Le seul coup qui marche est bizarre: tu deviens la personne devant toi. Tu copies son costume et son badge, tu la fais sortir de la file, puis tu refermes le trou. Le reste de la chaine a l'air intact. C'est delete middle node sur une liste chainee simple.

Ce billet est un enseignement original pour debutants en **Java**. Meme famille de problemes que les classiques de listes en entretien, pas une copie de livre. Fait partie de la [serie CTCI en Java](/blog/fr/ctci-series-guide).

---

## 1. Analogie du quotidien

Une liste chainee simple est une conga a sens unique. Chaque personne ne connait que la suivante. On ne te donne **pas** la tete de la file. On te donne seulement un pointeur vers quelqu'un au milieu, et la tache est de le retirer.

Le unlink normal a besoin du noeud precedent:

```
prev.next = node.next
```

Ici tu n'as pas `prev`. Donc tu triches:

1. Tu voles l'identite de la personne suivante (copie `next.data` dans le noeud courant).
2. Tu sautes la personne suivante (`current.next = next.next`).

Le "slot" du milieu existe encore comme objet, mais il porte maintenant la valeur suivante et pointe ou pointait le suivant. De l'exterieur, cette valeur a disparu de la sequence.

---

## 2. Enonce en mots simples

**Entree:** une reference `Node` vers un noeud qui n'est **ni** le premier **ni** le dernier d'une liste chainee simple. Tu ne recois **pas** la tete.

**Sortie:** muter la liste pour que la valeur qui etait en `node` n'apparaisse plus dans la sequence. La liste doit ressembler a une suppression de ce noeud du milieu.

**Forme du noeud:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Exemple:**

| Avant | Supprimer celui-ci | Apres | Pourquoi |
| --- | --- | --- | --- |
| `a → b → c → d → e` | noeud avec `c` | `a → b → d → e` | `c` devient `d`, puis on saute l'ancien `d` |
| `1 → 2 → 3 → 4` | noeud avec `2` | `1 → 3 → 4` | on copie `3` dans le slot de `2`, on saute l'ancien `3` |
| `1 → 2 → 3 → 4` | noeud avec `3` | `1 → 2 → 4` | la meme idee un cran plus loin |

**Clarifie avant de coder** (dis-le a voix haute):

* Le noeud est-il garanti non dernier? (Enonce classique: oui, ou "n'importe quel noeud sauf le dernier".)
* Est-il garanti non tete? (Souvent oui; supprimer la tete demande un autre contrat.)
* Peut-on ecraser `data`? (Oui. C'est tout le truc.)
* Simple ou double chainage? (Ici: simple.)
* Liste a un seul noeud? (Hors perimetre; pas de suivant a copier.)

Pour cet article: noeud du milieu avec `next` non null, entiers, mutation en place, retour succes ou void.

---

## 3. Reflechir d'abord

### Ce que tu ne peux pas faire

* Partir de la tete pour trouver `prev`. Tu n'as pas la tete.
* Faire `node = node.next`. Cela ne rebind qu'une variable locale. Le `next` du precedent pointe encore vers l'ancien objet.
* Liberer le noeud sans rebrancher. La chaine l'inclut toujours.

### Le seul truc pratique

Si `node.next` existe:

```
node.data = node.next.data
node.next = node.next.next
```

Tu supprimes **physiquement** le noeud suivant apres avoir copie son payload dans le courant. En effet, la valeur qui vivait en `node` a disparu. Les valeurs plus loin se decalent d'un cran logique vers la gauche.

### Pourquoi le dernier noeud echoue

Si `node.next == null`, il n'y a ni identite a voler ni noeud a sauter. Tu ne peux pas retirer la derniere valeur sans le pointeur precedent (ou un design sentinel). En entretien, dis-le clairement: cet algorithme ne supprime pas un vrai dernier noeud.

Certains interviewers acceptent "marquer dummy / lever / renvoyer false". Choisis un contrat clair et tiens-le.

---

## 4. Solution Java

```java
/**
 * Deletes a middle node from a singly linked list given only that node.
 * Copies the next node's data into this node, then skips the next node.
 * Does not work for the last node (no next to copy from).
 *
 * @return true if deleted, false if node is null or is the last node
 */
boolean deleteMiddleNode(Node node) {
    if (node == null || node.next == null) {
        // Cannot delete last node (or a null reference) this way.
        return false;
    }

    Node next = node.next;
    node.data = next.data;
    node.next = next.next;
    return true;
}
```

Deroulement pour `a → b → c → d → e`, supprimer le noeud avec `c`:

| Etape | `node.data` | `node.next` pointe vers | Liste vue depuis la tete |
| --- | --- | --- | --- |
| Debut | `c` | `d` | `a → b → c → d → e` |
| Copier data | `d` | `d` (meme objet) | `a → b → d → d → e` (deux noeuds avec `d` un instant) |
| Sauter next | `d` | `e` | `a → b → d → e` |

L'ancien noeud `d` est delie et eligible au GC. Qui tenait encore un pointeur vers l'objet qui etait `c` voit maintenant `d` dans cet objet. C'est le tradeoff habituel: l'identite de l'objet n'est pas celle de la valeur dans la sequence.

Petit driver pour tester mentalement:

```java
Node build(int... vals) {
    Node dummy = new Node(0);
    Node t = dummy;
    for (int v : vals) {
        t.next = new Node(v);
        t = t.next;
    }
    return dummy.next;
}

// head: 1 → 2 → 3 → 4 → 5
// delete the node with value 3 (must look it up only for the demo)
Node head = build(1, 2, 3, 4, 5);
Node target = head.next.next; // the 3
deleteMiddleNode(target);
// list is now 1 → 2 → 4 → 5
```

Dans l'appel reel du probleme, l'interviewer te donne `target` directement. Tu ne cherches jamais depuis la tete.

---

## 5. Tableau de complexite

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Copier next + sauter | O(1) | O(1) | Seulement des pointeurs en temps constant |
| Marcher depuis la tete jusqu'a prev | O(N) | O(1) | Besoin de la tete; interdit par l'enonce |
| Copier toute la liste sans cette valeur | O(N) | O(N) | Trop lourd, et il faut encore la tete |

C'est l'un des rares problemes de listes vraiment en O(1) quand les contraintes tiennent.

---

## 6. Cas limites et erreurs frequentes

Les interviewers poussent ici:

* **Dernier noeud** → renvoyer false, lever, ou documenter "non supporte". Pas de NPE sur `node.next.data`.
* **Noeud null** → proteger d'abord.
* **Liste a deux noeuds, supprimer le premier des deux** → ca marche: le premier devient le second, puis on saute le second. La liste devient un seul noeud. Si "premier de deux" compte comme milieu depend du wording; l'algo tourne quand meme.
* **Tete avec longueur > 2** → l'algo "marche" techniquement (tu ecrases la data de la tete et tu sautes l'ancien second). Beaucoup d'enonces disent quand meme "pas le premier ni le dernier". Suis la contrainte donnee.
* **Valeurs en double** → ok. Tu retires une occurrence a cette position, pas "tous les egaux".
* **References externes vers l'ancien noeud de la valeur** → elles pointent maintenant vers l'objet qui porte la valeur suivante. Dis-le si la liste est partagee.

Erreurs frequentes:

1. **Seulement `node = node.next`.** Rebind local ne delie rien.
2. **Oublier de copier data.** Si tu sautes seulement next, tu gardes la valeur du milieu et tu perds la suivante. C'est l'inverse de supprimer le milieu.
3. **Croire pouvoir liberer le dernier noeud.** Impossible avec ce seul pointeur sur une liste simple.
4. **Renvoyer void et ignorer l'echec.** Prefere un boolean ou une exception claire pour le cas dernier noeud.
5. **Penser que l'objet noeud disparait.** L'objet en `node` reste; son payload change. La "suppression" est logique pour la sequence, pas toujours physique pour cet objet Java.

---

## 7. Recap a raconter a un ami

Delete middle node demande: retire une valeur d'une liste chainee simple quand tu ne tiens que ce noeud, pas la tete.

1. Tu ne peux pas rebrancher le pointeur precedent. Tu ne l'as pas.
2. Copie la data du noeud suivant dans le courant.
3. Fais pointer le courant au-dela du suivant.
4. Le dernier noeud n'a pas de next, donc le truc echoue. Dis-le d'emblee.

Si tu ecris le corps en trois lignes et expliques la limite du dernier noeud en trente secondes, tu maitrises le 2.3.

---

## Serie

* Guide: [Guide de la serie CTCI](/blog/fr/ctci-series-guide)
* Precedent: [Return Kth to Last](/blog/fr/ctci-2-2-return-kth-to-last)
* Suivant: [Partition](/blog/fr/ctci-2-4-partition)