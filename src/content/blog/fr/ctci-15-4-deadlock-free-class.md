---
title: "Classe Anti-Interblocage: Graphe de Dépendances et Détection de Cycles (CTCI 15.4)"
description: "Concevez un gestionnaire de verrous sans interblocage à l'aide d'un graphe orienté acyclique (DAG) et de parcours DFS en Java."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-4-deadlock-free-class.webp
previewImage: /assets/images/ctci-15-4-deadlock-free-class.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez une classe délivrant un verrou uniquement lorsqu'aucun interblocage (deadlock) n'est susceptible d'en découler.
> * **La Solution Optimale:** **Graphe Orienté Acyclique (DAG) avec Détection Préventive de Cycles** :
>   1. **Représentation en Graphe** : Modéliser les verrous comme des nœuds d'un graphe orienté $G = (V, E)$. Un arc $A \to B$ indique qu'un thread détenant le verrou $A$ a ensuite sollicité le verrou $B$.
>   2. **Contrôle Préalable** : Lorsqu'un thread détenant $\{L_1, \dots, L_k\}$ demande $L_{\text{cible}}$, tester si l'ajout des arcs $L_i \to L_{\text{cible}}$ forme un cycle.
>   3. **Détection par DFS** : Lancer un parcours en profondeur depuis $L_{\text{cible}}$ vers les verrous déjà détenus.
>   4. **Attribution ou Rejet** : Si un cycle est détecté, rejeter la requête ; sinon, insérer l'arc et accorder le verrou.
>   5. S'exécute en **temps $O(V + E)$**.
> * **Réalité en Production:** Outils de détection ThreadSanitizer et moteurs transactionnels relationnels.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.4), l'énoncé est :

*"Construisez une classe de verrouillage concurrent assurant qu'aucun interblocage circulaire ne puisse se produire lors de l'acquisition de ressources."*

## 2. Analyse par Graphe de Dépendances

Un cycle orienté $A \to B \to A$ caractérise une attente circulaire fatale. La classe invalide toute tentative de verrouillage susceptible d'introduire un tel cycle.

## Implémentation de Production

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

public class LockManager {
    private static final LockManager INSTANCE = new LockManager();
    private final Map<Integer, LockNode> locks = new ConcurrentHashMap<>();
    private final ThreadLocal<List<LockNode>> threadLocks = ThreadLocal.withInitial(ArrayList::new);

    public static LockManager getInstance() { return INSTANCE; }

    public static class LockNode {
        private final int id;
        private final ReentrantLock lock = new ReentrantLock();
        private final List<LockNode> children = new ArrayList<>();

        public LockNode(int id) { this.id = id; }
        public int getId() { return id; }
        public ReentrantLock getLock() { return lock; }
        public List<LockNode> getChildren() { return children; }

        public synchronized void addEdge(LockNode target) {
            if (!children.contains(target)) children.add(target);
        }
    }

    public synchronized boolean acquireLock(int lockId) {
        LockNode target = locks.computeIfAbsent(lockId, LockNode::new);
        List<LockNode> currentHeldLocks = threadLocks.get();

        if (!currentHeldLocks.isEmpty()) {
            for (LockNode held : currentHeldLocks) {
                if (hasCycle(target, held)) {
                    System.err.println("INTERBLOCAGE ÉVITÉ: Verrou " + lockId);
                    return false;
                }
            }
            for (LockNode held : currentHeldLocks) held.addEdge(target);
        }

        target.getLock().lock();
        currentHeldLocks.add(target);
        return true;
    }

    public synchronized void releaseLock(int lockId) {
        LockNode node = locks.get(lockId);
        if (node != null) {
            node.getLock().unlock();
            threadLocks.get().remove(node);
        }
    }

    private boolean hasCycle(LockNode from, LockNode to) {
        Set<Integer> visited = new HashSet<>();
        return dfs(from, to, visited);
    }

    private boolean dfs(LockNode current, LockNode target, Set<Integer> visited) {
        if (current == target) return true;
        if (!visited.add(current.getId())) return false;
        for (LockNode next : current.getChildren()) {
            if (dfs(next, target, visited)) return true;
        }
        return false;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps de Détection | `O(V + E)` | Parcours DFS standard sur le graphe de verrous. |
| Empreinte Mémoire | `O(V + E)` | Liste d'adjacence globale. |

## Ingénierie des Systèmes en Production

### Architecture Système : ThreadSanitizer

1. **Instrumentation Dynamique :** ThreadSanitizer enregistre chaque acquisition de mutex pour bâtir un graphe global à l'exécution et signaler tout risque en amont.
2. **Graphes d'Attente SGBD :** Les bases de données résolvent les deadlocks en annulant la transaction la plus récente.

## Cas Limites et Robustesse

1. **Verrous Réentrants :** Gestion transparente sans génération d'auto-boucles $A \to A$.
