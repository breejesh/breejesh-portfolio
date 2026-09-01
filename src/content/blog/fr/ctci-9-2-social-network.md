---
title: "Réseau Social: Recherche Bidirectionnelle de Chemins à Grande Échelle (CTCI 9.2)"
description: "Concevez les structures de données distribuées et les algorithmes pour trouver le plus court chemin de connexion entre utilisateurs via un BFS bidirectionnel en O(k^(d/2))."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Comment concevriez-vous les structures de données et algorithmes pour un réseau social géant (Facebook, LinkedIn) ? Décrivez comment trouver la chaîne de connexion la plus courte entre deux personnes.
> * **La Solution Optimale:** **Sharding Distribué + BFS Bidirectionnel** : (1) Un parcours BFS classique avec degré moyen $k \approx 100$ et distance $d \approx 6$ visite $O(k^d) = 100^6 = 10^{12}$ nœuds ; (2) Le BFS bidirectionnel progresse depuis la source et la cible simultanément, ne visitant que **$O(2 \cdot k^{d/2}) = 2 \cdot 100^3 = 2 \times 10^6$ nœuds** (accélération de 500 000x !) ; (3) Les requêtes distribuées sont groupées par `ServerID` pour minimiser les appels réseau RPC.
> * **Réalité en Production:** Moteur de degrés de connexion de LinkedIn et base orientée graphe Facebook TAO.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.2), l'énoncé est :

*"Concevez les structures de donnees et algorithmes pour determiner le plus court chemin relationnel entre deux membres d'un reseau social distribue."*

## 2. Fondement Mathématique : L'Avantage Bidirectionnel

Avec $k \approx 100$ amis par personne et $d \approx 6$ degrés de séparation :
* **BFS Unidirectionnel :** $k^d = 100^6 = 10^{12}$ nœuds.
* **BFS Bidirectionnel :** $2 \times k^{d/2} = 2 \times 100^3 = 2 \times 10^6$ nœuds.

L'espace de recherche est réduit d'un facteur **500 000**.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

public class SocialNetworkBFS {
    public static class Person {
        private final int personID;
        private final List<Integer> friends = new ArrayList<>();

        public Person(int id) { this.personID = id; }
        public int getID() { return personID; }
        public List<Integer> getFriends() { return friends; }
        public void addFriend(int friendID) { friends.add(friendID); }
    }

    public static class PathNode {
        public final Person person;
        public final PathNode previousNode;

        public PathNode(Person p, PathNode prev) {
            this.person = p;
            this.previousNode = prev;
        }

        public List<Person> collapse(boolean startsWithRoot) {
            List<Person> path = new ArrayList<>();
            PathNode node = this;
            while (node != null) {
                if (startsWithRoot) path.add(0, node.person);
                else path.add(node.person);
                node = node.previousNode;
            }
            return path;
        }
    }

    public static class BFSData {
        public Queue<PathNode> toVisit = new LinkedList<>();
        public Map<Integer, PathNode> visited = new HashMap<>();

        public BFSData(Person root) {
            PathNode sourcePath = new PathNode(root, null);
            toVisit.add(sourcePath);
            visited.put(root.getID(), sourcePath);
        }

        public boolean isFinished() { return toVisit.isEmpty(); }
    }

    public static List<Person> findPathBiBFS(Map<Integer, Person> people, int source, int destination) {
        if (!people.containsKey(source) || !people.containsKey(destination)) return null;

        BFSData sourceData = new BFSData(people.get(source));
        BFSData destData = new BFSData(people.get(destination));

        while (!sourceData.isFinished() && !destData.isFinished()) {
            Person collision = searchLevel(people, sourceData, destData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }

            collision = searchLevel(people, destData, sourceData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }
        }
        return null;
    }

    private static Person searchLevel(Map<Integer, Person> people, BFSData primary, BFSData secondary) {
        int count = primary.toVisit.size();
        for (int i = 0; i < count; i++) {
            PathNode pathNode = primary.toVisit.poll();
            int personID = pathNode.person.getID();

            if (secondary.visited.containsKey(personID)) {
                return pathNode.person;
            }

            Person person = pathNode.person;
            for (int friendID : person.getFriends()) {
                if (!primary.visited.containsKey(friendID)) {
                    Person friend = people.get(friendID);
                    PathNode next = new PathNode(friend, pathNode);
                    primary.visited.put(friendID, next);
                    primary.toVisit.add(next);
                }
            }
        }
        return null;
    }

    private static List<Person> mergePaths(BFSData sourceData, BFSData destData, int collisionID) {
        PathNode one = sourceData.visited.get(collisionID);
        PathNode two = destData.visited.get(collisionID);

        List<Person> pathOne = one.collapse(true);
        List<Person> pathTwo = two.collapse(false);

        pathTwo.remove(0);
        pathOne.addAll(pathTwo);
        return pathOne;
    }
}
```

## Analyse de Complexité et Architecture

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps de Recherche | `O(k^(d/2))` | Jonction à mi-profondeur réduisant l'exploration de $10^{12}$ à $2 \times 10^6$ nœuds. |
| Mémoire Auxiliaire | `O(k^(d/2))` | Tables des nœuds explorés et files d'attente d'expansion. |

## Ingénierie des Systèmes en Production

### Architecture Système : Magasins de Graphes Distribués (Facebook TAO)

1. **Partitionnement par `ServerID` :** Les listes d'amis sont distribuées sur un cluster. Les requêtes réseau sont regroupées par machine cible pour limiter les appels RPC.
2. **Intersection d'Amis en Cache :** Évaluation instantanée des relations au degré 2 via des intersections d'ensembles en RAM (`SINTER` Redis).

## Cas Limites et Robustesse

1. **Aucun Chemin Existant :** Terminaison propre à l'épuisement des files d'attente.
2. **Source et Cible Identiques :** Renvoie immédiatement le profil source.
