---
title: "Cruches d'eau: mesurer exactement 4 litres avec 3 et 5 (Java)"
description: "Problème style CTCI 6.5 pour débutants: deux cruches de capacités 3 et 5 litres, mesurer exactement 4. Étapes manuelles de versement, identité de Bézout et BFS optionnel en Java sur les états."
date: "2025-08-19"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-5-jugs-of-water.webp
previewImage: /assets/images/ctci-6-5-jugs-of-water.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.5 pour débutants: deux cruches de capacités 3 et 5 litres, mesurer exactement 4. Étapes manuelles de versement, identité de Bézout et BFS optionnel en Java sur les états.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as une cruche de 3 litres et une de 5 litres. Pas d'autres graduations. Un lac (ou un robinet) illimité pour remplir, et tu peux vider l'une ou l'autre. Peux-tu finir avec exactement **4 litres** dans l'une d'elles?

C'est le puzzle classique des cruches d'eau. C'est aussi de la théorie des nombres dans une cuisine: les quantités mesurables sont des multiples de `gcd(3, 5)`, qui vaut 1, donc 4 est possible. En entretien, on veut les étapes, le pourquoi, et parfois un programme de recherche qui les trouve.

Ce post est un enseignement original pour débutants en **Java**. Même famille que les puzzles de cruches classiques et les énigmes façon Die Hard, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, puzzles de maths et de logique.

---

## 1. Analogie du quotidien

Pense à deux verres doseurs sans traits de demi-litre. L'un tient trois verres d'eau, l'autre cinq. Tu peux:

* Remplir un verre à fond depuis le robinet.
* Vider un verre complètement.
* Verser de l'un dans l'autre jusqu'à ce que la source soit vide ou la destination pleine.

Tu ne remplis jamais "à l'œil" à moitié. Chaque quantité que tu crées vient de remplissages complets, de vidages complets et de transferts qui s'arrêtent à la capacité. Le puzzle: est-ce que 4 litres apparaissent comme contenu d'une cruche après une courte suite de ces gestes.

---

## 2. Énoncé en mots simples

**Donné:**

* Capacité de la cruche A: 3 litres.
* Capacité de la cruche B: 5 litres.
* Source d'eau illimitée et espace pour vider (tu peux vider l'une ou l'autre complètement).

**Opérations autorisées:**

1. Remplir A complètement depuis la source.
2. Remplir B complètement depuis la source.
3. Vider A complètement.
4. Vider B complètement.
5. Verser A dans B jusqu'à ce que A soit vide ou B pleine.
6. Verser B dans A jusqu'à ce que B soit vide ou A pleine.

**But:** atteindre un état où A ou B (ou les deux) contient exactement 4 litres. Dans l'énoncé habituel, les 4 se retrouvent dans la cruche de 5 litres.

**Clarifie avant de coder ou d'écrire les étapes:**

* Les 4 doivent-ils être dans une seule cruche? (Oui pour cette version classique.)
* Un troisième récipient? (Non.)
* Les cruches partent-elles vides? (Oui.)
* Uniquement des litres entiers? (Oui: quantités entières.)
* Cas général ensuite: capacités `m`, `n`, cible `d`. Mêmes idées.

---

## 3. Réfléchis d'abord

### Ce que tu peux vraiment mesurer

Chaque opération:

* Ajoute une capacité pleine (`+3` ou `+5` depuis la source, quand tu remplis),
* Soustrait une capacité pleine (quand tu vides),
* Ou déplace de l'eau entre les cruches sans changer le **total** d'eau actuellement tenue.

Si tu ne regardes que les quantités dans une cruche, ce sont des combinaisons linéaires entières de 3 et 5:

```
a*3 + b*5   pour des entiers a, b (positifs ou négatifs)
```

Négatif signifie "vider autant de fois" dans la comptabilité classique. **Identité de Bézout:** l'ensemble de toutes ces combinaisons est exactement les multiples de `gcd(3, 5) = 1`. Tu peux donc mesurer 1, 2, 3, 4 ou 5 litres dans une des cruches (dans la limite de capacité). Tu ne peux pas mesurer 4 avec des cruches de 6 et 9, car `gcd(6, 9) = 3` et 3 ne divise pas 4.

Règle du puzzle général: **la cible `d` est solvable ssi `d` est un multiple de `gcd(m, n)` et `0 < d <= max(m, n)`** (pour "exactement `d` dans une cruche").

### Des états, pas de magie

Un état est une paire `(a, b)`: litres dans la cruche de 3 et litres dans celle de 5.

* Départ: `(0, 0)`.
* But: tout état avec `a == 4` ou `b == 4`. Ici seule B peut contenir 4, donc `b == 4`.

Depuis n'importe quel état, au plus six mouvements. Le graphe est minuscule: 4 valeurs possibles pour A (0..3) fois 6 pour B (0..5) = 24 états. Un parcours en largeur trouve une séquence la plus courte si tu veux du code. Au tableau, un chemin manuel court suffit.

### Un chemin manuel propre (6 opérations)

Suis `(cruche-3, cruche-5)`:

```
(0, 0)  départ
(0, 5)  remplir la 5
(3, 2)  verser la 5 dans la 3 jusqu'à ce qu'elle soit pleine; 2 restent dans la 5
(0, 2)  vider la 3
(2, 0)  verser les 2 restants dans la 3
(2, 5)  remplir la 5 à nouveau
(3, 4)  verser la 5 dans la 3 jusqu'à ce qu'elle soit pleine (il lui manque 1); 4 restent dans la 5
```

Terminé. La cruche de 5 litres contient exactement 4 litres.

### Un autre chemin (commencer par la 3)

```
(0, 0)
(3, 0)  remplir 3
(0, 3)  verser dans 5
(3, 3)  remplir 3
(1, 5)  verser dans 5 jusqu'à plein; 1 reste dans la 3
(1, 0)  vider 5
(0, 1)  verser le 1 dans 5
(3, 1)  remplir 3
(0, 4)  verser dans 5; la 5 tient 1+3 = 4
```

Plus long, même idée: tu construis des restes de 3 modulo 5 (ou l'inverse).

---

## 4. Solutions en Java

### (a) Documenter la recette manuelle (ce que l'entretien veut souvent en premier)

```java
// Manual sequence for (3, 5) -> 4 in the five-liter jug.
// States written as (small, large).
//
// (0,0) fill large  -> (0,5)
// pour large->small -> (3,2)
// empty small       -> (0,2)
// pour large->small -> (2,0)
// fill large        -> (2,5)
// pour large->small -> (3,4)  // large has 4
```

Dis-le à voix haute, puis écris le test de Bézout pour montrer que tu ne devines pas.

### (b) Aide de solvabilité (général m, n, d)

```java
static int gcd(int x, int y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y != 0) {
        int t = x % y;
        x = y;
        y = t;
    }
    return x;
}

/** True if you can obtain exactly d liters in one jug of capacities m and n. */
static boolean canMeasure(int m, int n, int d) {
    if (d == 0) {
        return true; // both empty
    }
    if (m + n < d) {
        return false;
    }
    // Exactly d in one jug: d must fit in at least one jug
    if (d > m && d > n) {
        return false;
    }
    return d % gcd(m, n) == 0;
}
```

Pour `m = 3`, `n = 5`, `d = 4`: `gcd` vaut 1, 4 tient dans la 5, donc true.

### (c) Optionnel: BFS sur les états (liste d'étapes la plus courte)

Utile quand les capacités sont plus grandes ou qu'on demande un programme. L'espace d'états fait `(m+1)*(n+1)`.

```java
import java.util.*;

public class WaterJugs {
    record State(int a, int b) {}

    static List<String> measure(int m, int n, int d) {
        if (!canMeasure(m, n, d) && d != 0) {
            return List.of(); // impossible
        }
        if (d == 0) {
            return List.of("start (0,0)");
        }

        Queue<State> q = new ArrayDeque<>();
        Map<State, String> how = new HashMap<>(); // state -> last move label
        Map<State, State> prev = new HashMap<>();

        State start = new State(0, 0);
        q.add(start);
        how.put(start, "start");
        prev.put(start, null);

        while (!q.isEmpty()) {
            State cur = q.poll();
            if (cur.a == d || cur.b == d || cur.a + cur.b == d) {
                // classic "in one jug": prefer a==d or b==d
                if (cur.a == d || cur.b == d) {
                    return reconstruct(cur, prev, how);
                }
            }

            for (Object[] step : neighbors(cur, m, n)) {
                State nxt = (State) step[0];
                String label = (String) step[1];
                if (how.containsKey(nxt)) {
                    continue;
                }
                how.put(nxt, label);
                prev.put(nxt, cur);
                q.add(nxt);
            }
        }
        return List.of(); // unreachable (should not happen if canMeasure)
    }

    static List<Object[]> neighbors(State s, int m, int n) {
        int a = s.a, b = s.b;
        List<Object[]> out = new ArrayList<>();
        out.add(new Object[]{new State(m, b), "fill A"});
        out.add(new Object[]{new State(a, n), "fill B"});
        out.add(new Object[]{new State(0, b), "empty A"});
        out.add(new Object[]{new State(a, 0), "empty B"});

        // pour A -> B
        int pourAB = Math.min(a, n - b);
        out.add(new Object[]{new State(a - pourAB, b + pourAB), "pour A->B"});

        // pour B -> A
        int pourBA = Math.min(b, m - a);
        out.add(new Object[]{new State(a + pourBA, b - pourBA), "pour B->A"});
        return out;
    }

    static List<String> reconstruct(State end, Map<State, State> prev, Map<State, String> how) {
        LinkedList<String> path = new LinkedList<>();
        State cur = end;
        while (cur != null) {
            path.addFirst(how.get(cur) + " -> (" + cur.a + "," + cur.b + ")");
            cur = prev.get(cur);
        }
        return path;
    }

    static boolean canMeasure(int m, int n, int d) {
        if (d == 0) return true;
        if (d > m && d > n) return false;
        if (m + n < d) return false;
        return d % gcd(m, n) == 0;
    }

    static int gcd(int x, int y) {
        x = Math.abs(x);
        y = Math.abs(y);
        while (y != 0) {
            int t = x % y;
            x = y;
            y = t;
        }
        return x;
    }

    public static void main(String[] args) {
        System.out.println(canMeasure(3, 5, 4)); // true
        for (String step : measure(3, 5, 4)) {
            System.out.println(step);
        }
    }
}
```

Le BFS renvoie un plus court chemin. Les six étapes manuelles ci-dessus sont de longueur minimale pour 4 litres; le chemin plus long "commencer par 3" est valide mais pas minimal.

### Détail du calcul de versement

Quand tu verses A dans B:

```
spaceInB = n - b
moved = min(a, spaceInB)
newA = a - moved
newB = b + moved
```

Même idée dans l'autre sens. C'est toute la simulation. Pas de flottants.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Recette manuelle en 6 étapes | O(1) | O(1) | Suffit pour 3 et 5 fixes |
| Test Bézout / gcd | O(log min(m,n)) | O(1) | Solvabilité seule, pas les étapes |
| BFS sur les états | O(m * n) | O(m * n) | Plus courte séquence d'opérations |
| DFS / récursion | même ordre | pile parfois pire | Préfère BFS pour le plus court chemin |

Pour des tailles d'entretien comme 3 et 5, les constantes dominent. Le test de gcd est l'outil théorique net.

---

## 6. Cas limites

* **Cible 0** → déjà résolu: les deux vides.
* **Cible égale à une capacité** → un seul remplissage. Exemple: cible 3 avec une cruche de 3.
* **Cible plus grande que les deux cruches** → impossible si tu veux `d` dans une seule cruche.
* **`gcd` ne divise pas `d`** → impossible. Exemple: 4 avec des cruches 6 et 9.
* **Une capacité à 0** → seulement des multiples de l'autre (souvent 0 et cette capacité).
* **Mêmes capacités** → tu ne mesures que 0 ou cette capacité (pour une cruche).
* **Préférer 4 dans la grande** → test `b == 4` seulement, ou accepte l'une ou l'autre.
* **N'invente pas de demi-litres** → tout reste entier.
* **Style LeetCode 365** → "peut-on mesurer" n'a besoin que du gcd; "afficher les étapes" demande un BFS ou une construction explicite.

Contrôles minimaux:

```java
assert canMeasure(3, 5, 4);
assert canMeasure(3, 5, 1);
assert !canMeasure(2, 6, 5);
assert canMeasure(3, 5, 0);
```

---

## 7. Explique à un ami

Cruches d'eau demande: avec seulement des remplissages complets, des vidages complets et des versements entre une 3 et une 5, peux-tu obtenir exactement 4 litres?

1. Les mouvements ne produisent que des combinaisons entières de 3 et 5.
2. Ces combinaisons sont des multiples de `gcd(3, 5) = 1`, donc 4 est possible et tient dans la cruche de 5.
3. Une recette courte: remplir 5, verser dans 3, vider 3, verser les 2 restants dans 3, remplir 5, verser dans 3 jusqu'à plein. Dans la 5 il reste **4**.
4. En code, modèle les états `(a, b)` et fais un BFS des six opérations si tu veux le chemin automatiquement.
5. En général: solvable quand `d % gcd(m, n) == 0` et `d` tient dans au moins une cruche.

Si tu peux parcourir le tableau `(0,0) ... (3,4)` au tableau, dire "Bézout" sans bloquer et croquer un BFS de 24 états, tu maîtrises le problème 6.5.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Fourmis sur un triangle](/blog/fr/ctci-6-4-ants-on-a-triangle)
* Suivant: [Île aux yeux bleus](/blog/fr/ctci-6-6-blue-eyed-island)