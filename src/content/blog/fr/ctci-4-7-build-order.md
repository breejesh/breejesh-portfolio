---
title: "Build Order: dépendances de projets et tri topologique (Java)"
description: "Problème style CTCI 4.7 pour débutants: projets et paires de dépendances, trouve un ordre de compilation valide ou échoue s'il y a un cycle. File d'indegree de Kahn et DFS en Java clair."
date: "2026-04-28"
tags: [Algorithmes]
coverImage: /assets/images/ctci-4-7-build-order.webp
previewImage: /assets/images/ctci-4-7-build-order.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.7 pour débutants: projets et paires de dépendances, trouve un ordre de compilation valide ou échoue s'il y a un cycle. File d'indegree de Kahn et DFS en Java clair.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu livres un petit monorepo. Le paquet `d` a besoin de `a` et `b` d'abord. Le paquet `c` a besoin de `d`. Le paquet `b` a besoin de `f`. Si tu compiles dans le mauvais ordre, le build meurt. Si deux paquets se demandent l'un l'autre, aucun ordre ne marche et tu dois t'arrêter en erreur. C'est **build order**: une liste de projets plus des arêtes de dépendance, et une séquence sûre qui respecte chaque arête.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de graphes de dépendances en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 4, arbres et graphes.

---

## 1. Analogie du quotidien

Imagine un menu à plusieurs plats où certains doivent finir avant que d'autres commencent:

* Les **projets** sont des plats: soupe, pain, plat, dessert.
* Une **dépendance** `(A, B)` signifie "B a besoin que A soit prêt d'abord." Tu ne dresses pas B tant que A n'est pas fini.
* Un **ordre de build** valide est toute séquence qui respecte chaque règle "besoin d'abord". Il peut y en avoir plusieurs.
* Un **cycle** est "la soupe a besoin du pain et le pain a besoin de la soupe." Aucune cuisine ne termine ça. Signale une erreur.

Dessine chaque plat comme un nœud. Dessine une flèche de A vers B quand B dépend de A (`A → B` signifie construire A avant B). Le graphe est orienté. Ce qu'il te faut, c'est un **ordre topologique** de ce graphe: chaque arête va d'un projet plus tôt dans la liste vers un projet plus tard.

Si le graphe a un cycle, aucun ordre topologique n'existe. C'est le point fort de l'entretien.

---

## 2. Problème en mots simples

**Entrée:**

* `projects`: liste de noms de projets (strings, ou tout id comparable).
* `dependencies`: liste de paires `(before, after)` où `after` dépend de `before`. Construis `before` d'abord.

**Sortie:**

* Une liste ordonnée de tous les projets qui respecte chaque dépendance, ou
* Un signal d'erreur s'il n'existe pas un tel ordre (cycle, ou gestion des projets manquants que tu définis).

**Exemple classique:**

| Élément | Valeur |
| --- | --- |
| projects | `a, b, c, d, e, f` |
| dependencies | `(a, d), (f, b), (b, d), (f, a), (d, c)` |
| un ordre valide | `f, e, a, b, d, c` (ou d'autres permutations légales) |

Lis les paires avec soin. `(a, d)` signifie que **d dépend de a**, donc a vient avant d. Arête `a → d`.

**Clarifie avant de coder:**

* Noms uniques? (Oui. Traite-les comme des ids de nœud.)
* Un projet peut-il apparaître dans dependencies sans être dans `projects`? (En général non. Valide ou ajoute-le. Choisis un contrat.)
* Auto-dépendance `(x, x)`? (Cycle de longueur 1. Échec.)
* Plusieurs ordres valides: n'importe lequel convient sauf s'ils demandent tous les ordres (autre problème).
* Type de retour en échec: `null`, liste vide ou throw. Dis-le à voix haute.

---

## 3. Réfléchis d'abord

### Modèle de graphe

Construis un graphe orienté:

* Un nœud par projet.
* Pour chaque dépendance `(before, after)`, ajoute l'arête `before → after`.
* Suit le **indegree**: combien de projets doivent finir avant que celui-ci puisse démarrer.

Les projets d'indegree 0 n'ont plus de bloqueurs. Ils peuvent entrer dans le build ensuite.

### Approche A: Kahn (indegree + file)

C'est le défaut propre en entretien.

1. Construis la liste d'adjacence: map de chaque projet vers la liste des projets qui en dépendent.
2. Calcule l'indegree de chaque projet.
3. Mets dans une file (ou tout FIFO / liste dont tu sors) tout projet d'indegree 0.
4. Tant que la file n'est pas vide:
   * Sors `p`, ajoute `p` à l'ordre résultat.
   * Pour chaque voisin `n` de `p`, décrémente `indegree[n]`. S'il atteint 0, enfile `n`.
5. Si `result.size() == projects.length`, renvoie l'ordre. Sinon un cycle (ou un nœud jamais drainé) a bloqué des nœuds: erreur.

Pourquoi ça marche: tu n'émets un projet que lorsque tous ses prédécesseurs ont déjà été émis. S'il y a un cycle, ces nœuds n'atteignent jamais l'indegree 0 et la file se vide trop tôt.

### Approche B: DFS avec couleurs

1. États: `0` non visité, `1` en visite (sur la pile de récursion courante), `2` terminé.
2. DFS depuis chaque nœud non visité. Quand tu quittes un nœud pour de bon (post-ordre), pousse-le sur une pile (ou préfixe une liste).
3. Si tu suis une arête vers un nœud en `1`, tu as trouvé une arête retour: cycle → erreur.
4. À la fin, inverse la liste en post-ordre (ou dépile) pour l'ordre de build.

Même coût asymptotique. Kahn est souvent plus simple à raconter avec l'histoire de la "file des prêts". DFS est naturel si tu vis déjà en récursion sur les arbres.

### Ce qu'il ne faut pas faire

* Essayer toutes les permutations au hasard: N! n'est pas une réponse d'entretien.
* BFS sans indegrees: tu perds le signal "tous les parents sont faits".
* Trier seulement les noms par ordre alphabétique: ignore les arêtes.

---

## 4. Solution Java (Kahn)

```java
import java.util.*;

public class BuildOrder {

    /**
     * @param projects list of project names
     * @param dependencies each pair [before, after]: after depends on before
     * @return a valid build order, or null if a cycle (or incomplete graph) blocks one
     */
    public static String[] findBuildOrder(String[] projects, String[][] dependencies) {
        Map<String, List<String>> graph = new HashMap<>();
        Map<String, Integer> indegree = new HashMap<>();

        for (String p : projects) {
            graph.put(p, new ArrayList<>());
            indegree.put(p, 0);
        }

        for (String[] dep : dependencies) {
            String before = dep[0];
            String after = dep[1];
            if (!graph.containsKey(before) || !graph.containsKey(after)) {
                // dependency names a project we do not know: treat as error
                return null;
            }
            graph.get(before).add(after);
            indegree.put(after, indegree.get(after) + 1);
        }

        Queue<String> ready = new ArrayDeque<>();
        for (String p : projects) {
            if (indegree.get(p) == 0) {
                ready.add(p);
            }
        }

        List<String> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            String p = ready.poll();
            order.add(p);
            for (String next : graph.get(p)) {
                int d = indegree.get(next) - 1;
                indegree.put(next, d);
                if (d == 0) {
                    ready.add(next);
                }
            }
        }

        if (order.size() != projects.length) {
            return null; // cycle: some projects never became ready
        }
        return order.toArray(new String[0]);
    }
}
```

Parcours de l'exemple:

| Étape | File ready (exemple) | Build jusqu'ici | Notes |
| --- | --- | --- | --- |
| départ | `f, e` (indegree 0) | - | `a` attend `f`; `b` attend `f`; les autres aussi |
| prend `f` | `e, a, b` | `f` | finir `f` débloque `a` et `b` |
| prend `e` | `a, b` | `f, e` | `e` n'a pas de dépendants dans cet exemple |
| prend `a` | `b` | `f, e, a` | `d` a encore besoin de `b` aussi |
| prend `b` | `d` | `f, e, a, b` | les deux parents de `d` sont faits → indegree 0 |
| prend `d` | `c` | `f, e, a, b, d` | débloque `c` |
| prend `c` | vide | `f, e, a, b, d, c` | la taille colle → succès |

L'ordre dans la file entre nœuds d'indegree 0 n'est pas unique. Prendre `e` plus tard marche aussi: `f, a, b, d, c, e` est valide.

### Esquisse DFS optionnelle

```java
// 0 = unvisited, 1 = visiting, 2 = done
// return false from dfs if cycle detected
boolean dfs(String node, Map<String, List<String>> graph,
            Map<String, Integer> state, Deque<String> stack) {
    state.put(node, 1);
    for (String next : graph.get(node)) {
        int s = state.get(next);
        if (s == 1) {
            return false; // back edge
        }
        if (s == 0 && !dfs(next, graph, state, stack)) {
            return false;
        }
    }
    state.put(node, 2);
    stack.push(node); // post-order: dependents already pushed under us
    return true;
}
```

Appelle `dfs` pour chaque projet non visité. Si tout réussit, dépile dans le tableau résultat. Même règle de cycle: arête gris vers gris échoue.

---

## 5. Table de complexité

| Partie | Temps | Espace |
| --- | --- | --- |
| Construire graphe + indegrees | O(V + E) | O(V + E) |
| Processus Kahn | O(V + E) | O(V) pour file et ordre |
| Processus DFS | O(V + E) | O(V) récursion + pile au pire cas |
| Total | O(V + E) | O(V + E) |

`V` est le nombre de projets, `E` le nombre de paires de dépendance. Les deux approches sont linéaires en la taille du graphe. C'est optimal: il faut lire chaque arête au moins une fois.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent surtout:

* **Liste de projets vide** → ordre vide est correct.
* **Projets sans dépendances** → tous entrent tout de suite dans l'ensemble ready; toute permutation est valide.
* **Un seul projet, sans arêtes** → `[ce projet]`.
* **Auto-arête `(x, x)`** → l'indegree de x ne se vide jamais, ou le DFS voit une arête retour. Erreur.
* **Cycle simple** `a → b → a` → erreur quand la file se vide avec des nœuds restants.
* **Dépendance qui nomme un projet manquant** → décide: erreur vs création. Le code ci-dessus renvoie une erreur.
* **Paires de dépendance en double** → double comptage d'indegree si tu ajoutes deux fois. Déduplique les arêtes ou accepte seulement si l'entrée garantit des paires uniques.

Erreurs fréquentes:

1. **Inverser l'arête.** `(a, d)` signifie que d dépend de a. L'arête est `a → d`, pas `d → a`. Si tu la retournes, l'ordre est faux même sans cycle.
2. **Oublier les projets d'indegree 0 sans arêtes.** Les isolés vont aussi dans l'ordre.
3. **S'arrêter quand la file est vide sans comparer les tailles.** C'est exactement comme on rate un cycle.
4. **Muter la liste originale de dépendances comme seule structure.** Construis une map d'adjacence; ne détruis pas l'entrée.
5. **Supposer un ordre unique.** Beaucoup de DAG ont beaucoup d'ordres topologiques. Renvoie n'importe lequel de valide sauf demande contraire.
6. **Penser en non orienté.** Ce graphe est orienté. Une arête ne force qu'une direction.

Usage minimal:

```java
String[] projects = {"a", "b", "c", "d", "e", "f"};
String[][] deps = {
    {"a", "d"}, {"f", "b"}, {"b", "d"}, {"f", "a"}, {"d", "c"}
};
String[] order = BuildOrder.findBuildOrder(projects, deps);
// non-null example: [f, e, a, b, d, c]
```

---

## 7. Explique à un ami

Build Order, c'est le tri topologique sur un graphe de dépendances de projets:

1. Un nœud par projet. Arête `before → after` quand after a besoin de before.
2. **Kahn:** démarre à indegree 0, émets un projet, débloque les voisins, répète. Si tu ne peux pas tout émettre, il y a un cycle.
3. **DFS:** récursion, échoue sur les arêtes retour (revisite en gris), émets en post-ordre inversé.
4. Temps O(V + E). Espace O(V + E) pour le graphe.
5. Plusieurs réponses peuvent être correctes. Seuls les cycles (ou une entrée invalide) forcent une erreur.

Si tu dessines les flèches dans le bon sens, remplis une file des prêts et expliques pourquoi les nœuds restants sont un cycle, tu maîtrises le 4.7. La même compétence revient dans les gestionnaires de paquets, les pipelines CI et les planificateurs de prérequis de cours.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Successor](/blog/fr/ctci-4-6-successor)
* Suivant: [First Common Ancestor](/blog/fr/ctci-4-8-first-common-ancestor)