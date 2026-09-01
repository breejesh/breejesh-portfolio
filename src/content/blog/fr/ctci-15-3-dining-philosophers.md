---
title: "Le Dîner des Philosophes: Prévention des Interblocages et Hiérarchies de Verrous (CTCI 15.3)"
description: "Résolvez le problème d'interblocage classique de Dijkstra en brisant l'attente circulaire par une hiérarchie stricte d'acquisition de verrous en Java."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-3-dining-philosophers.webp
previewImage: /assets/images/ctci-15-3-dining-philosophers.webp
---

> **TL;DR**
> * **Le Problème du Livre:** 5 philosophes partagent 5 baguettes autour d'une table ronde. Chacun requiert 2 baguettes adjacentes pour manger. Concevez un algorithme empêchant tout interblocage (deadlock) et toute famine (starvation).
> * **Le Piège de l'Interblocage :** Si chaque philosophe saisit sa baguette gauche simultanément, une **attente circulaire** fatale paralyse le système.
> * **La Solution (Hiérarchie de Ressources) :** Numéroter les baguettes de $0$ à $4$. Chaque philosophe doit impérativement verrouiller sa baguette de **plus faible indice d'abord** avant de solliciter la seconde.
> * **Réalité en Production:** Ordonnancement des verrous de lignes sous PostgreSQL et verrous d'inodes dans le noyau Linux.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.3), l'énoncé est :

*"Formalisez une solution au probleme du diner des philosophes de Dijkstra garantissant l'absence d'interblocage par hierarchisation des verrous."*

## 2. Les 4 Conditions de Coffman

1. **Exclusion Mutuelle :** Ressources non partageables.
2. **Rétention et Attente :** Détention d'un verrou pendant l'attente d'un second.
3. **Non-Préemption :** Les verrous ne peuvent être révoqués unilatéralement.
4. **Attente Circulaire :** Cycle de dépendance $P_0 \to P_1 \to \dots \to P_0$.

En rompant la symétrie, le philosophe 4 acquiert la baguette 0 (droite) avant la baguette 4 (gauche), rendant la formation d'un cycle impossible.

## Implémentation de Production

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Philosopher extends Thread {
    private final int id;
    private final Lock lower;
    private final Lock higher;

    public Philosopher(int id, Lock left, Lock right) {
        this.id = id;
        if (System.identityHashCode(left) < System.identityHashCode(right)) {
            this.lower = left;
            this.higher = right;
        } else {
            this.lower = right;
            this.higher = left;
        }
    }

    private void eat() throws InterruptedException {
        lower.lock();
        try {
            higher.lock();
            try {
                System.out.println("Philosophe " + id + " mange.");
                Thread.sleep(10);
            } finally {
                higher.unlock();
            }
        } finally {
            lower.unlock();
        }
    }

    @Override
    public void run() {
        try {
            for (int i = 0; i < 100; i++) {
                Thread.sleep(5);
                eat();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Coût de Verrouillage | `O(1)` | Exactement 2 opérations de verrou réentrant par cycle. |
| Risque de Deadlock | `Zéro` | Impossibilité mathématique de cycle dans le graphe d'allocation. |

## Ingénierie des Systèmes en Production

### Architecture Système : Verrous Ordonnés en Base de Données

1. **Tri des Clés Primaires :** PostgreSQL et MySQL InnoDB trient par ordre croissant les identifiants de lignes (`UPDATE ... WHERE id IN (10, 20)`) avant verrouillage pour interdire les deadlocks entre transactions concurrentes.
2. **Verrous VFS Linux :** Lors d'opérations `rename()`, le noyau verrouille les répertoires par ordre croissant d'adresses mémoire.

## Cas Limites et Robustesse

1. **Interruption de Thread :** Encadrement par des blocs `try-finally` imbriqués pour garantir la libération du premier verrou.
