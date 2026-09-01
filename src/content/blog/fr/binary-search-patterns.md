---
title: "Les motifs de recherche dichotomique qui reviennent sans cesse"
description: "Recherche binaire classique, lower et upper bound, recherche sur l'espace des réponses, et les pièges off-by-one qui coûtent cher en entretien et en production. Des modèles réutilisables."
date: "2026-06-27"
tags: [Algorithmes et Structures]
coverImage: /assets/images/binary-search-patterns.webp
previewImage: /assets/images/binary-search-patterns.webp
---


La recherche binaire n'est pas un seul tour de passe-passe. En entretien et en production, on revoit toujours les mêmes formes: trouver une valeur, trouver une borne, et chercher sur la *réponse* plutôt que dans le tableau. La plupart des bugs ne sont pas "j'ai oublié le log n". Ce sont des erreurs off-by-one sur l'invariant de la boucle.

Ce billet est la carte courte que je garde. Des modèles en Python, le modèle mental de chaque forme, et les pièges qui te volent une demi-heure au tableau.

---

## La seule idée qu'il te faut

Tu maintiens un intervalle `[lo, hi]` (ou semi-ouvert `[lo, hi)`) où la réponse vit encore. Chaque pas jette à peu près la moitié de cet intervalle. Ça ne marche que si:

1. L'espace de recherche est **ordonné** selon une clé (valeurs, ou un prédicat monotone).
2. Tu peux décider, en O(1) ou mieux, quelle moitié contient encore la réponse.
3. La boucle **rétrécit** à chaque itération, et la sortie laisse `lo`/`hi` dans un état connu.

Si le prédicat n'est pas monotone, la recherche binaire est le mauvais outil. Aucune arithmétique maline de `mid` ne répare un problème non monotone.

---

## Motif 1: recherche classique (valeur exacte)

Tableau trié, trouver `target` ou signaler l'absence. L'intervalle semi-ouvert évite une partie des erreurs de bornes:

```python
def binary_search(a: list[int], target: int) -> int:
    """Return index of target, or -1 if missing. a must be sorted ascending."""
    lo, hi = 0, len(a)  # search in [lo, hi)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return -1
```

Notes:

* `mid = lo + (hi - lo) // 2` évite le débordement dans les langages à entiers de largeur fixe. En Python c'est surtout une question de style. C'est encore une bonne habitude si tu passes l'entretien en C++ ou Java.
* En cas d'échec, `lo` est le point d'insertion (premier index où `a[i] >= target` si les comparaisons étaient `<` / `>=`). Utile pour le motif suivant.
* Doublons: renvoie *un* match, pas le plus à gauche ni le plus à droite.

---

## Motif 2: lower bound et upper bound

**Lower bound:** premier index `i` tel que `a[i] >= target` (ou `len(a)` si tous les éléments sont plus petits).

**Upper bound:** premier index `i` tel que `a[i] > target`.

Ensemble, ils donnent la plage complète d'égaux pour les doublons, et permettent le "nombre de X dans la liste triée" en temps logarithmique.

```python
def lower_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def upper_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def equal_range(a: list[int], target: int) -> tuple[int, int]:
    return lower_bound(a, target), upper_bound(a, target)
```

Exemple: `a = [1, 2, 2, 2, 5]`, `target = 2` → lower `1`, upper `4`, count `3`.

C++ a `std::lower_bound` / `std::upper_bound`. En Python, `bisect.bisect_left` et `bisect.bisect_right` sont la même idée. En entretien, écris la boucle une fois pour prouver que tu maîtrises l'invariant.

### Usages en production

* Journaux d'événements triés: premier timestamp `>= t0`, premier timestamp `> t1`.
* Grilles de prix ou barèmes: le plus petit palier qui couvre une quantité.
* Listes d'IDs dédupliquées: appartenance et longueur de plage sans scan.

---

## Motif 3: recherche sur l'espace des réponses

Tu n'indexes pas un tableau. Tu devines un nombre `x` (capacité, jours, charge max minimale, vitesse) et tu poses un **test monotone**: `feasible(x)` est faux pour les petits `x` et vrai pour les grands (ou l'inverse). La recherche binaire trouve le plus petit true (ou le plus grand false).

Squelette pour "minimum `x` tel que `feasible(x)`":

```python
def min_feasible(lo: int, hi: int, feasible) -> int:
    """
    Assume feasible is False for values below the answer,
    True for values at and above. Search in [lo, hi].
    Returns the smallest x where feasible(x) is True.
    Precondition: feasible(hi) is True (or widen hi first).
    """
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid):
            hi = mid          # mid works; try smaller
        else:
            lo = mid + 1      # mid fails; need larger
    return lo
```

Formes d'entretien classiques qui s'y ramènent:

| Famille de problème | `x` signifie | `feasible(x)` |
| --- | --- | --- |
| Koko eating bananas | vitesse de mangement | finit tous les tas en `h` heures |
| Split array largest sum | somme max de sous-tableau autorisée | on peut découper en `<= m` parties |
| Capacity to ship packages | capacité du navire | tous les colis partent en `D` jours |
| Min max distance / aggressive cows | distance minimale | placer `k` vaches avec cet écart |
| Temps pour produire `n` objets | temps écoulé | les machines produisent assez d'ici là |

Le dur n'est pas la recherche binaire. C'est:

1. Prouver la **monotonicité** (si la vitesse 5 marche, la 6 aussi).
2. Fixer les **bornes** (`lo` = max d'un tas pour les problèmes type Koko; `hi` = somme des tas ou un plafond sûr).
3. Implémenter `feasible` correctement et en bon temps (souvent O(n) par test → O(n log R) au total).

### Petit exemple: capacité minimale

Poids des colis `[1, 2, 3, 4, 5]`, jours `D = 3`. Trouver la capacité min pour expédier dans l'ordre, sans réordonner.

```python
def can_ship(weights: list[int], days: int, cap: int) -> bool:
    used, load = 1, 0
    for w in weights:
        if w > cap:
            return False
        if load + w > cap:
            used += 1
            load = 0
        load += w
    return used <= days


def ship_within_days(weights: list[int], days: int) -> int:
    lo = max(weights)
    hi = sum(weights)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if can_ship(weights, days, mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

`lo` commence au colis le plus lourd (la capacité ne peut pas être plus petite). `hi` est "tout envoyer en un jour". La boucle s'arrête sur la capacité minimale qui finit encore en `days`.

---

## Motif 4: tableau trié puis pivoté (toujours de la recherche binaire)

Le tableau était trié, puis pivoté: `[4, 5, 6, 7, 0, 1, 2]`. Une moitié est toujours triée. Compare `target` à la moitié triée pour décider quel côté jeter.

```python
def search_rotated(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:  # left half sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:  # right half sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

Les doublons rendent ambigu le test `a[lo] <= a[mid]` quand `a[lo] == a[mid] == a[hi]`. Il peut alors falloir rétrécir une extrémité de façon linéaire au pire cas. Dis-le à voix haute en entretien; ça montre que tu connais la limite.

---

## Pièges off-by-one qui font vraiment mal

Ce sont les bugs que je vois le plus, y compris les miens.

### Fermé vs semi-ouvert

| Style | Init | Boucle | Si `a[mid] < target` | Sinon |
| --- | --- | --- | --- | --- |
| Semi-ouvert `[lo, hi)` | `hi = n` | `while lo < hi` | `lo = mid + 1` | `hi = mid` |
| Fermé `[lo, hi]` | `hi = n - 1` | `while lo <= hi` | `lo = mid + 1` | `hi = mid - 1` |

Mélanger les styles en cours de fonction, c'est la boucle infinie classique: `hi = mid` avec `while lo <= hi` et aucun progrès quand `lo == hi`.

Choisis un style par fonction et tiens-toi-y. Je privilégie le semi-ouvert pour les bounds, le fermé quand l'énoncé pense en indices inclusifs.

### Boucle infinie avec `mid = (lo + hi) // 2`

Quand `hi = lo + 1` et que tu fais `lo = mid` (pas `mid + 1`) sur la branche "aller à droite", `mid` reste égal à `lo` pour toujours. Correctif: utilise le semi-ouvert avec `lo = mid + 1`, ou pour les recherches de "maximiser" utilise `mid = lo + (hi - lo + 1) // 2` (biais vers le haut) quand tu écris `lo = mid`.

```python
# Maximize: last True under a monotone predicate on [lo, hi]
def max_true(lo: int, hi: int, ok) -> int:
    while lo < hi:
        mid = lo + (hi - lo + 1) // 2  # bias upward
        if ok(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo
```

### Tableau vide et élément unique

Teste toujours `[]`, `[x]` avec succès et échec, et deux éléments. Ces tailles cassent d'abord les mises à jour de `mid` trop lâches.

### Débordement d'entiers sur les bornes

Les problèmes d'espace de réponses peuvent pousser `hi` à `10**18`. En C++/Java, `lo + hi` déborde; préfère `lo + (hi - lo) / 2`. En Python tu es tranquille, mais les interviewers remarquent encore la forme sûre.

### Sens du prédicat

Pour "capacité minimale", quand `feasible(mid)` est vrai tu poses `hi = mid` (tu gardes mid). Quand c'est faux, `lo = mid + 1`. Inverse une fois et tu renvoies une capacité qui ne marche pas, ou tu boucles pour toujours. Écris la phrase au-dessus de la boucle avant de coder.

### Recherche binaire en flottants

Rare en entretien, courant pour les problèmes géométriques de "plus petit rayon". Utilise un nombre fixe d'itérations (60-100) ou un epsilon sur `hi - lo`. Ne compare pas des floats avec `==`. Préfère une recherche entière sur des unités mises à l'échelle quand tu le peux.

---

## Checklist de décision

Avant d'écrire `mid = ...`:

1. **Quel est l'espace de recherche?** Des indices dans un tableau, ou des réponses candidates sur une droite numérique?
2. **Qu'est-ce qui est monotone?** Des valeurs triées, ou `feasible(x)` qui bascule une seule fois de false à true?
3. **Que renvoies-tu?** N'importe quel match, le plus à gauche, le plus à droite, le point d'insertion, min true, max true?
4. **Semi-ouvert ou fermé?** Un seul style.
5. **Bornes?** `lo` peut-il commencer à 0 / max(élément)? `hi` est-il exclusif `n`, inclusif `n-1`, ou une capacité max prouvée?
6. **Vide et bords** notés avant le chemin heureux.

Si tu ne peux pas répondre à (2), arrête-toi. Un parcours linéaire ou un autre algo peut être correct; la recherche binaire ne l'est pas.

---

## Notes de production (pas seulement LeetCode)

La recherche binaire apparaît hors des entretiens:

* **Config / feature rollout:** trouver le premier build id qui a régressé une métrique (recherche sur des deploys ordonnés avec un test tolérant au flakiness).
* **Seuils d'autoscaling:** dichotomie sur une concurrence ou une taille de batch jusqu'à ce que le SLO de latence casse.
* **Base de données / storage:** la recherche en feuille d'un B-tree, c'est la même idée; ton app la réimplémente rarement, mais l'invariant est identique.
* **Réglage jeu / sim:** min time step, max load, spawn rate qui reste sous un budget.

En production, l'appel à `feasible` est souvent une expérience ou un load test, donc le nombre d'itérations compte plus que micro-optimiser `mid`. Logue quand même chaque `(lo, hi, mid, result)` pour qu'une métrique non monotone ne renvoie pas n'importe quoi en silence.

---

## Aide-mémoire

| Objectif | Modèle |
| --- | --- |
| N'importe quel égal | classique; return mid sur match |
| Premier `>= x` | lower_bound; `if a[mid] < x: lo = mid+1 else hi = mid` |
| Premier `> x` | upper_bound; `if a[mid] <= x: lo = mid+1 else hi = mid` |
| Compter les égaux | `upper - lower` |
| Min `x` avec ok(x) | si ok: `hi = mid` sinon `lo = mid+1` |
| Max `x` avec ok(x) | biais mid vers le haut; si ok: `lo = mid` sinon `hi = mid-1` |
| Tableau pivoté | identifier la moitié triée; jeter l'autre |

Mémorise les **invariants**, pas douze noms de problèmes. Une fois lower/upper bound et la recherche sur l'espace des réponses en mémoire musculaire, la plupart des tags "binary search" sur LeetCode sont la même boucle avec un `feasible` différent.

---

## Pour finir

La recherche binaire échoue quand l'intervalle ne rétrécit pas, que le prédicat n'est pas monotone, ou que tu mélanges mises à jour fermées et semi-ouvertes. Cloue ces trois points et le reste n'est que du nommage.

Si tu ne pratiques qu'un exercice cette semaine: implémente lower_bound et min-feasible deux fois depuis zéro, sans regarder, et lance-les sur des tableaux vides, à un élément, et tout en doublons. Ça couvre l'essentiel de ce que demandent les entretiens et la production.

