---
title: "Route Between Nodes: chercher un chemin dans un graphe orienté (Java)"
description: "Problème style CTCI 4.1 pour débutants: graphe orienté donné, décider s'il existe une route du nœud S au nœud E. BFS préféré au DFS, avec une simple liste de voisins GraphNode en Java."
date: "2025-09-14"
tags: [Algorithmes]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 4.1 pour débutants: graphe orienté donné, décider s'il existe une route du nœud S au nœud E. BFS préféré au DFS, avec une simple liste de voisins GraphNode en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Les villes vivent de rues à sens unique. Tu quittes la maison et tu rejoins le parc en trois virages, mais le chemin inverse peut ne pas exister si toutes les flèches pointent dans le mauvais sens. Un **graphe orienté** est cette carte: les arêtes ont une direction. La question est simple: en partant du nœud S, peux-tu ne suivre que des flèches légales et atterrir sur le nœud E?

Ce post est un enseignement original pour débutants en **Java**. Même famille que l'atteignabilité de graphe en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 4 (arbres et graphes) s'ouvre ici.

---

## 1. Analogie des rues à sens unique

Imagine un petit centre-ville:

* Les carrefours sont des **nœuds**.
* Les rues à sens unique sont des **arêtes orientées**. Une flèche de A vers B autorise A → B. Elle **n'autorise pas** B → A sauf s'il existe une seconde flèche.
* Tu es au carrefour S. Tu veux savoir si le carrefour E est atteignable sans casser le code de la route.

Tu n'as pas besoin du plus court trajet pour ce problème. Seulement un **oui ou non**: existe-t-il une route légale?

Si tu essaies tous les chemins à la main, tu tournes en boucle dès qu'il y a un cycle (un pâté de maisons qu'on peut contourner). Toute recherche doit **marquer les carrefours visités** et ne pas les ré-étendre.

La recherche en largeur (BFS) explore comme une onde depuis S: d'abord les voisins de S, puis les leurs, et ainsi de suite. La recherche en profondeur (DFS) plonge au bout d'une route puis revient. Les deux répondent à l'atteignabilité. En entretien on préfère souvent BFS pour ce oui/non: pas de risque de pile récursive, et tu découvres E dès le premier contact (plus court chemin en nombre d'arêtes si ça compte plus tard).

---

## 2. Énoncé simple

**Entrée:** un graphe orienté, un nœud départ `S`, un nœud arrivée `E`.

**Sortie:** `true` s'il existe un chemin orienté de `S` vers `E`, sinon `false`.

**Forme de nœud utilisée:**

```java
import java.util.ArrayList;
import java.util.List;

class GraphNode {
    String name;
    List<GraphNode> neighbors = new ArrayList<>();

    GraphNode(String name) {
        this.name = name;
    }

    void addNeighbor(GraphNode n) {
        neighbors.add(n);
    }
}
```

Chaque nœud ne connaît que ses arêtes sortantes (`neighbors`). Le graphe entier, c'est ce que tu câbles entre nœuds. Pas besoin d'une classe `Graph` séparée pour le test si tu as déjà les références `S` et `E`.

**Petits exemples:**

| Arêtes (orientées) | S | E | Réponse | Pourquoi |
| --- | --- | --- | --- | --- |
| A→B, B→C | A | C | true | A → B → C |
| A→B, B→C | C | A | false | pas de flèche de retour vers A |
| A→B, B→A | A | B | true | arête directe |
| A→A (boucle seule), pas d'autres arêtes | A | A | true | départ égal arrivée (ou boucle) |
| A→B, C→D (deux composantes) | A | D | false | D inatteignable depuis A |

**Clarifie avant de coder:**

* Orienté ou non orienté? (Orienté. Ne traite pas les arêtes comme bidirectionnelles sauf indication.)
* Et si `S == E`? (En général `true`: chemin vide. Confirme.)
* Cycles autorisés? (Oui. Il faut marquer les visités.)
* Entrées null? (`false` ou exception. Choisis un contrat.)
* Arêtes pondérées? (Sans intérêt pour la pure atteignabilité.)

---

## 3. Réfléchis d'abord (BFS préféré)

### Instinct DFS

Depuis le nœud courant, récursion sur chaque voisin non visité. Si un appel trouve `E`, renvoie true. Marque les visités pour ne pas boucler.

Ça marche. Limites en entretien:

* Graphes profonds font exploser la pile d'appels (la pile Java par défaut n'est pas énorme).
* Tu peux t'égarer dans une longue impasse avant d'essayer le court chemin qui touche vraiment `E`.

### BFS (préféré ici)

Utilise une file:

1. Si `S == E`, renvoie `true`.
2. Mets `S` dans la file. Marque `S` visité.
3. Tant que la file n'est pas vide:
   * Défile le front `u`.
   * Pour chaque voisin `v` de `u`:
     * Si `v == E`, renvoie `true`.
     * Si `v` n'est pas visité, marque-le et enfile-le.
4. File vide → pas de route → `false`.

Pourquoi c'est le défaut propre:

* File explicite, pas d'inquiétude de profondeur récursive.
* Dès que tu vois `E`, tu sais qu'un plus court chemin en nombre d'arêtes existe. Propriété gratuite pour les follow-ups.
* L'ensemble des visités garantit d'étendre chaque nœud au plus une fois: travail O(V + E).

### Recherche bidirectionnelle (mention optionnelle)

Si le graphe est énorme et que tu peux marcher **depuis S** et **en arrière depuis E** (il faut les arêtes inverses), se croiser au milieu peut réduire le travail. La plupart des solutions d'entretien restent en BFS mono-source. Mentionne le bidirectionnel seulement si on pousse sur l'échelle.

---

## 4. Solution Java

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Set;

class GraphNode {
    String name;
    List<GraphNode> neighbors = new ArrayList<>();

    GraphNode(String name) {
        this.name = name;
    }

    void addNeighbor(GraphNode n) {
        neighbors.add(n);
    }
}

class RouteBetweenNodes {

    /** True if a directed path exists from start to end. */
    static boolean routeExists(GraphNode start, GraphNode end) {
        if (start == null || end == null) {
            return false;
        }
        if (start == end) {
            return true;
        }

        Queue<GraphNode> queue = new LinkedList<>();
        Set<GraphNode> visited = new HashSet<>();

        queue.add(start);
        visited.add(start);

        while (!queue.isEmpty()) {
            GraphNode current = queue.poll();
            for (GraphNode neighbor : current.neighbors) {
                if (neighbor == end) {
                    return true;
                }
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }
        return false;
    }

    // Optional: same idea with DFS recursion
    static boolean routeExistsDfs(GraphNode start, GraphNode end) {
        if (start == null || end == null) {
            return false;
        }
        if (start == end) {
            return true;
        }
        Set<GraphNode> visited = new HashSet<>();
        return dfs(start, end, visited);
    }

    private static boolean dfs(GraphNode current, GraphNode end, Set<GraphNode> visited) {
        if (current == end) {
            return true;
        }
        visited.add(current);
        for (GraphNode neighbor : current.neighbors) {
            if (!visited.contains(neighbor)) {
                if (dfs(neighbor, end, visited)) {
                    return true;
                }
            }
        }
        return false;
    }
}
```

Parcours sur `A → B → C`, plus `A → D`, route de A vers C:

| Étape | File (front d'abord) | Visités | Action |
| --- | --- | --- | --- |
| 0 | A | {A} | départ |
| 1 | B, D | {A} | étendre A; enfiler B et D |
| 2 | D, C | {A,B} | étendre B; voir C == end → true |

Si la fin était E sans arête depuis la composante de A, BFS viderait la file et renverrait false.

L'identité d'objet (`neighbor == end`) est correcte quand `S` et `E` sont les mêmes références que le graphe utilise. Si tu reconstruis les nœuds par nom, compare noms ou ids. En entretien on te passe presque toujours les vrais objets.

---

## 5. Table de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| BFS | O(V + E) | O(V) file + visités | chaque nœud et arête une fois (sortantes) |
| DFS récursif | O(V + E) | O(V) visités + pile | mêmes asymptotes; profondeur jusqu'à V |
| Sans visités | peut boucler | - | cassé sur les cycles |

`V` = nœuds atteignables au pire cas (ou tout le graphe si tu marques globalement). `E` = arêtes parcourues. Tu n'as pas besoin de plus de O(V) entrées visitées.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent ça:

* **`S == E`** → `true` (chemin vide) sauf redéfinition du problème.
* **`null` en départ ou arrivée** → `false` (ou throw). Pas de NPE sur `start.neighbors`.
* **Boucle sur soi seule** → si `S` n'est pas `E`, la boucle sur `S` n'atteint pas `E` par magie.
* **Cycles** → ensemble des visités obligatoire. Sans lui, A→B→A bloque.
* **Graphe déconnecté** → `E` inatteignable doit donner `false`, pas une exception.
* **Nœud sans arêtes sortantes** → l'expansion ne fait rien; la recherche continue avec le reste de la file.
* **Arêtes multiples / voisins en double** → les visités gardent le travail linéaire.

Erreurs fréquentes:

1. **Traiter le graphe comme non orienté.** Ajouter des arêtes inverses en silence est faux ici.
2. **Oublier les visités.** Boucle infinie sur tout cycle.
3. **Marquer visité trop tard.** Marque à l'enfilement (BFS) pour ne pas enfiler le même nœud mille fois depuis des parents différents.
4. **Comparer mal par nom ou par données quand les objets diffèrent.** Préfère l'égalité de référence sur `GraphNode` si c'est ce que le graphe stocke.
5. **Démarrer BFS sans mettre `S` dans les visités.** Un cycle qui revient à `S` ré-étend pour toujours.
6. **Renvoyer true seulement au défilement de `E` sans jamais regarder les voisins.** Soit à la découverte, soit au défilement; sois cohérent. Le code ci-dessus renvoie true dès qu'un voisin est `end`.

Usage minimal:

```java
GraphNode a = new GraphNode("A");
GraphNode b = new GraphNode("B");
GraphNode c = new GraphNode("C");
a.addNeighbor(b);
b.addNeighbor(c);

boolean ok = RouteBetweenNodes.routeExists(a, c); // true
boolean no = RouteBetweenNodes.routeExists(c, a); // false
```

---

## 7. Récap pour un ami

Route Between Nodes, c'est l'atteignabilité orientée:

1. Les nœuds gardent une liste de voisins (arêtes sortantes seulement).
2. Question: peux-tu aller de S à E en suivant ces flèches?
3. BFS depuis S avec une file et un set de visités. Si tu vois E, true. Si la file se vide, false.
4. DFS marche aussi; BFS est le défaut plus sûr en entretien (pas de récursion profonde, O(V+E) clair).
5. Toujours marquer les visités. Orienté veut dire A→B n'implique pas B→A. S==E est true.

Si tu dessines trois nœuds, joues BFS à la main et expliques pourquoi les visités comptent sur un cycle, tu maîtrises le 4.1. Le chapitre 4 commence par la question de graphe la plus simple et utile: E est-il atteignable depuis S?

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Animal Shelter](/blog/fr/ctci-3-6-animal-shelter)
* Suivant: [Minimal Tree](/blog/fr/ctci-4-2-minimal-tree)