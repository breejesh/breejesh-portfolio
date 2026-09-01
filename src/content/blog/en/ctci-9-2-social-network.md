---
title: "Social Network: Bidirectional BFS Path Search at Planetary Scale (CTCI 9.2)"
description: "Design the distributed data structures and algorithms to find the shortest friendship connection path between two users on a billion-node social graph using bidirectional BFS."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---

> **TL;DR**
> * **The Book Problem:** How would you design the data structures and algorithms for a very large social network (Facebook, LinkedIn)? Describe how you would find the connection / shortest path between two people (e.g., Me $\to$ Bob $\to$ Susan $\to$ Jason $\to$ You).
> * **The Optimal Solution:** **Distributed Sharding + Bidirectional Breadth-First Search (BFS)**: (1) Single-directional BFS exploring $d$ degrees of separation with average branching factor $k \approx 100$ evaluates $O(k^d) = 100^6 = 10^{12}$ nodes; (2) Bidirectional BFS expands two search frontiers simultaneously from Source and Target until they collide, evaluating only **$O(2 \cdot k^{d/2}) = 2 \cdot 100^3 = 2 \times 10^6$ nodes** (a 500,000x speedup!); (3) Distributed graph partitioning: User data is sharded across machines with `ServerID` routing tables; (4) Batching queries per `ServerID` minimizes cross-datacenter RPC overhead.
> * **Production Reality:** LinkedIn "Degrees of Connection" graph engine, Facebook TAO (The Associative Object graph store), and Neo4j distributed traversers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.2), we are asked:

*"How would you design the data structures and algorithms for a very large social network (Facebook, LinkedIn, etc.)? Describe how you would find the connection / shortest path between two people (e.g., Me -> Bob -> Susan -> Jason -> You)."*

## 2. Mathematical Foundation: The Bidirectional Advantage

Let $k$ be the average number of friends per user ($k \approx 100$) and $d$ be the degrees of separation between Source and Target ($d \approx 6$ on Facebook/LinkedIn).

* **Unidirectional BFS Search Space:**
  $$\text{Nodes Visited} = k^d = 100^6 = 1,000,000,000,000\text{ nodes}$$
* **Bidirectional BFS Search Space:**
  $$\text{Nodes Visited} = 2 \times k^{d/2} = 2 \times 100^3 = 2,000,000\text{ nodes}$$

By searching outward from both Source and Target simultaneously and checking for an intersection in their visited frontiers, the total search space is reduced by a factor of **$500,000\times$**.

## Production Implementation

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
                if (startsWithRoot) {
                    path.add(0, node.person); // Prepend
                } else {
                    path.add(node.person); // Append
                }
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

    /**
     * Finds the shortest connection path between two people using Bidirectional BFS.
     * Time Complexity: O(k^(d/2))
     * Space Complexity: O(k^(d/2))
     */
    public static List<Person> findPathBiBFS(Map<Integer, Person> people, int source, int destination) {
        if (!people.containsKey(source) || !people.containsKey(destination)) return null;

        BFSData sourceData = new BFSData(people.get(source));
        BFSData destData = new BFSData(people.get(destination));

        while (!sourceData.isFinished() && !destData.isFinished()) {
            // Search out from source
            Person collision = searchLevel(people, sourceData, destData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }

            // Search out from destination
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
                return pathNode.person; // Frontier collision!
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

        pathTwo.remove(0); // Remove duplicate collision node
        pathOne.addAll(pathTwo);
        return pathOne;
    }
}
```

## Complexity & Architecture Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Bidirectional BFS Time | `O(k^(d/2))` | Collides at midpoint depth $d/2$, reducing visited nodes from $10^{12}$ to $2 \times 10^6$. |
| Auxiliary Memory | `O(k^(d/2))` | Visited hash map and queue state for both search frontiers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Distributed Graph Stores (Facebook TAO)

1. **Graph Partitioning by `ServerID`:** User friendship lists are partitioned across distinct cluster nodes. When expanding BFS frontiers, lookups are batched by `ServerID` to execute concurrent multi-get RPCs.
2. **Short-Circuit Caching:** Mutual friend intersections ($d = 2$) are evaluated instantly via Redis bloom filters and integer set intersections (`SINTER`).

## Edge Cases & Production Hardening

1. **Source Equals Destination:** Immediately returns single-element path.
2. **Disconnected Graph Components:** Gracefully terminates when one BFS queue empties without finding collision.
