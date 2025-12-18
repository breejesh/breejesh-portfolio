---
title: "CTCI 2.7 Intersection: trouver le nœud partagé de deux listes (Java)"
description: "Étant données deux listes chaînées simples, renvoyer le premier nœud partagé par référence (pas par valeur). Même queue signifie fusion; aligner les longueurs, puis marcher ensemble."
date: "2025-12-18"
tags: [Algorithmes]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Étant données deux listes chaînées simples, renvoyer le premier nœud partagé par référence (pas par valeur). Même queue signifie fusion; aligner les longueurs, puis marcher ensemble.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Deux routes de campagne. Chacune part d'un village différent. Quelque part après les collines, elles rejoignent une seule autoroute et ne se séparent plus. Les voitures de l'une ou l'autre route qui atteignent la jonction partagent chaque kilomètre ensuite. Les listes chaînées peuvent faire pareil: deux chaînes de nœuds, séparées au départ, puis un suffixe partagé fait des **mêmes objets nœud**.

Ce billet est le problème **2.7 Intersection** de la [série CTCI en Java](/blog/fr/ctci-series-guide). Enseignement original, pas un copier-coller du livre. Tu renvoies le premier nœud partagé, ou `null` si les routes ne se croisent jamais.

---

## Analogie du quotidien

Imagine des post-it sur deux ficelles. Chaque post-it est un **objet nœud** en mémoire. Il a une valeur et un pointeur vers le suivant.

L'intersection ici **n'est pas** "le même nombre apparaît dans les deux listes". Deux post-it peuvent tous deux afficher `7` et rester du papier différent. Intersection signifie que les deux ficelles atteignent un jour **exactement le même post-it** (le même objet dans le tas). À partir de là, les deux listes partagent le reste de la chaîne, car les pointeurs `next` sont aussi les mêmes objets.

En bref: deux routes, une fusion. Trouve le premier bornage partagé.

---

## Le problème en mots simples

**Entrée:** têtes de deux listes chaînées simples, `list1` et `list2` (chacune peut être `null`).

**Sortie:** le **premier nœud partagé par référence**, ou `null` s'il n'y a pas de nœud partagé.

**Règles qui comptent**

* Compare les nœuds avec `==` (même objet), pas avec `data == data`.
* S'ils s'intersectent, ils partagent un suffixe complet: une fois les pointeurs joints, ils ne se séparent plus en queues différentes.
* Les listes peuvent avoir des longueurs différentes avant la fusion.
* Tu ne mutes pas les listes sauf si tu les restaures (cette solution ne mute pas).

**Exemple (par référence)**

```
list1:  a1 → a2 → c1 → c2 → c3
list2:  b1 → b2 → b3 → c1 → c2 → c3
```

`c1` est le même objet dans les deux parcours. Réponse: nœud `c1`. Des valeurs égales plus tôt ne comptent pas.

**Forme du nœud**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

---

## Comment réfléchir avant de coder

### Ensemble de hachage de nœuds (simple, utilise de la mémoire)

1. Parcours `list1`. Mets chaque **référence de nœud** dans un `HashSet<Node>` (identité, pas valeur).
2. Parcours `list2`. Pour chaque nœud, si l'ensemble contient déjà ce même objet, renvoie-le.
3. Si tu finis `list2` sans hit, renvoie `null`.

Temps O(A + B), espace extra O(A) où A et B sont les longueurs. Facile à expliquer. Les interviewers demandent souvent de l'espace constant ensuite.

### Préféré: même queue + alignement des longueurs (espace O(1))

Faits clés:

1. Si deux listes chaînées simples s'intersectent, elles se terminent sur le **même dernier nœud**. Des queues différentes signifient des fins différentes: pas de suffixe partagé.
2. S'ils partagent un suffixe de longueur S, et que les longueurs totales sont L1 et L2, les préfixes privés mesurent L1 - S et L2 - S. La liste plus longue a un préfixe privé en plus de `|L1 - L2|`.

Algorithme:

1. Parcours chaque liste une fois. Compte la longueur et mémorise le nœud **queue**.
2. Si les deux queues ne sont pas le même objet, renvoie `null`.
3. Soit `diff = |len1 - len2|`. Avance le pointeur de la liste **plus longue** de `diff` pas pour que les deux pointeurs aient le même nombre de nœuds devant eux.
4. Avance les deux d'un pas à la fois. La première fois que `p1 == p2`, c'est l'intersection.
5. Si tu touches null ensemble, le contrôle de queue a raté; avec un contrôle correct tu te rencontres au début du suffixe partagé ou tu as déjà prouvé l'absence de croisement.

Pourquoi ça marche: après alignement, les deux parcours ont la même longueur restante. Chaque pas reste sur des nœuds privés (objets distincts) ou tombe sur le suffixe partagé à la même distance restante. Les premières références égales sont le nœud de fusion.

---

## Solution Java

```java
/**
 * Finds the first node that appears in both lists by reference (same object).
 * Returns null if the lists do not intersect.
 */
Node findIntersection(Node list1, Node list2) {
    if (list1 == null || list2 == null) {
        return null;
    }

    TailAndSize a = getTailAndSize(list1);
    TailAndSize b = getTailAndSize(list2);

    // Different last nodes => no shared suffix.
    if (a.tail != b.tail) {
        return null;
    }

    Node shorter = a.size <= b.size ? list1 : list2;
    Node longer = a.size <= b.size ? list2 : list1;
    int diff = Math.abs(a.size - b.size);

    // Skip the extra private prefix on the longer list.
    longer = getKthNode(longer, diff);

    while (shorter != longer) {
        shorter = shorter.next;
        longer = longer.next;
    }
    return longer; // same as shorter; the merge node (or null if both empty, not our case)
}

static class TailAndSize {
    Node tail;
    int size;

    TailAndSize(Node tail, int size) {
        this.tail = tail;
        this.size = size;
    }
}

TailAndSize getTailAndSize(Node head) {
    if (head == null) {
        return new TailAndSize(null, 0);
    }
    int size = 1;
    Node current = head;
    while (current.next != null) {
        size++;
        current = current.next;
    }
    return new TailAndSize(current, size);
}

/** Returns the node k steps from head (0 = head). Assumes the list is long enough. */
Node getKthNode(Node head, int k) {
    Node current = head;
    for (int i = 0; i < k; i++) {
        current = current.next;
    }
    return current;
}
```

Parcours de l'exemple ci-dessus:

| Étape | Détail |
| --- | --- |
| longueur list1 | 5, queue = c3 |
| longueur list2 | 6, queue = c3 |
| queues égales? | oui (même objet) |
| diff | 1; avance list2 d'un pas jusqu'à b2 |
| marche appairée | (a1,b2), (a2,b3), (c1,c1) stop |
| résultat | nœud c1 |

Version ensemble de hachage pour contraste:

```java
import java.util.HashSet;
import java.util.Set;

Node findIntersectionWithSet(Node list1, Node list2) {
    Set<Node> seen = new HashSet<>();
    for (Node n = list1; n != null; n = n.next) {
        seen.add(n);
    }
    for (Node n = list2; n != null; n = n.next) {
        if (seen.contains(n)) {
            return n;
        }
    }
    return null;
}
```

`HashSet` utilise l'identité d'objet pour `Node` sauf si tu redéfinis `equals`/`hashCode`. **Ne** les redéfinis **pas** pour utiliser `data` sur ce problème, sinon tu apparieras des valeurs au lieu de références.

---

## Complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Alignement des longueurs + marche jointe | O(A + B) | O(1) | Deux passes de longueur, puis une marche jointe |
| HashSet de nœuds | O(A + B) | O(A) | Simple; à mentionner en premier jet |
| Scan imbriqué (chaque nœud de A contre tout B) | O(A · B) | O(1) | Correct mais lent; pas la réponse principale |

Au pire cas tu dois regarder chaque nœud au moins une fois pour connaître queues et longueurs, donc linéaire en le total de nœuds est le bon ordre.

---

## Cas limites que l'interviewer pique

1. **Pas d'intersection.** Queues différentes. Renvoie `null` juste après la passe longueur/queue. Ne marche pas indéfiniment.
2. **Une ou les deux null.** Aucun nœud à partager. Renvoie `null`.
3. **La même liste deux fois.** `findIntersection(head, head)` doit renvoyer `head` (tout est partagé; le premier partagé est la tête). Longueurs égales; la marche jointe se rencontre au premier pas.
4. **Intersection au dernier nœud seulement.** Suffixe partagé de longueur 1. L'alignement marche encore; tu te rencontres sur ce dernier nœud.
5. **Intersection à la tête de la liste courte.** Tu avances la longue de `diff`, puis la première comparaison peut déjà être égale.
6. **Valeurs égales, objets distincts.** `3 → 4 → 5` et une autre `3 → 4 → 5` construites séparément: les queues sont des objets différents. Réponse `null`. Dis "par référence" à voix haute.
7. **Longueurs très différentes.** Un grand `diff` va bien; avance avec soin et ne sors pas de la liste (l'égalité des queues garantit déjà le suffixe partagé).
8. **Cycles.** Le 2.7 classique suppose des listes acycliques. S'il peut y avoir des cycles, détecte d'abord la boucle ([Détection de boucle](/blog/fr/ctci-2-8-loop-detection)). Énonce l'hypothèse.

---

## Erreurs courantes

* Comparer des **valeurs** au lieu de l'identité de nœud (`n1.data == n2.data` ou un mauvais `equals`).
* Oublier le **contrôle de queue** et seulement aligner les longueurs. Deux listes séparées de même longueur ne se croisent pas; le contrôle de queue échoue vite et clarifie la géométrie.
* Avancer la liste **plus courte** de la différence au lieu de la plus longue.
* Mettre dans l'ensemble des **valeurs entières** au lieu de références de nœuds.
* Muter une liste pour l'accrocher à l'autre comme ruse, puis oublier que les interviewers détestent la mutation silencieuse des entrées.
* Supposer que le nœud de fusion est la première **valeur** égale en marche simultanée sans aligner les longueurs. Bugs de préfixe.

---

## Récap à raconter à un ami

Deux chaînes à sens unique. Atteignent-elles un jour le **même** objet nœud et partagent-elles le reste de la route?

Si leurs derniers nœuds diffèrent, elles ne fusionnent jamais. Si le dernier nœud est le même objet, elles partagent un suffixe. Mesure les deux longueurs, saute l'avance de la chaîne plus longue, puis marche côte à côte jusqu'à ce que les pointeurs soient la même référence. Ce nœud est l'intersection.

Un ensemble de hachage de nœuds marche aussi si la mémoire extra est acceptable. En entretien, mène avec l'histoire d'alignement des longueurs en espace O(1).

---

## Pratique

1. Code `findIntersection` de mémoire: queue + taille, aligner, marcher.
2. Dessine deux listes qui ne partagent que le dernier nœud et trace les pointeurs.
3. Dessine deux listes aux valeurs égales sans objets partagés; confirme que tu renvoies null.
4. Explique pourquoi un `HashSet<Integer>` de valeurs est le mauvais outil.

Précédent: [Palindrome](/blog/fr/ctci-2-6-palindrome). Suivant: [Détection de boucle](/blog/fr/ctci-2-8-loop-detection). Carte de la série: [CTCI en Java](/blog/fr/ctci-series-guide).