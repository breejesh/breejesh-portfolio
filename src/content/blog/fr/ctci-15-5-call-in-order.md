---
title: "Appels Ordonnés: Synchronisation et Séquencement de Threads en Java (CTCI 15.5)"
description: "Coordonnez l'ordre d'exécution déterministe entre plusieurs threads concurrents à l'aide de sémaphores à zéro permis et de verrous CountDownLatch."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-5-call-in-order.webp
previewImage: /assets/images/ctci-15-5-call-in-order.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une classe `Foo` dotée des méthodes `first()`, `second()` et `third()`, invoquées par trois threads distincts sur la même instance. Concevez un mécanisme garantissant que `first()` s'exécute avant `second()`, et `second()` avant `third()`.
> * **La Solution Optimale:** **Sémaphores Binaires à Zéro Permis** :
>   1. Instancier deux sémaphores avec zéro permis : `Semaphore sem1 = new Semaphore(0); Semaphore sem2 = new Semaphore(0);`.
>   2. Dans `first()` : Exécuter la tâche et débloquer le deuxième thread via `sem1.release()`.
>   3. Dans `second()` : Bloquer avec `sem1.acquire()`, exécuter la tâche et débloquer le troisième thread via `sem2.release()`.
>   4. Dans `third()` : Bloquer avec `sem2.acquire()` puis exécuter la tâche finale.
>   5. S'exécute en **temps $O(1)$** sans saturation CPU.
> * **Réalité en Production:** Pipelines réactifs Netty et initialisation ordonnée de microservices.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.5), l'énoncé est :

*"Assurez l'ordonnancement deterministe de trois methodes executees de maniere asynchrone sur un meme objet partage."*

## 2. Principe de Synchronisation par Sémaphores

L'initialisation à zéro permis force les threads appelants à s'endormir au niveau du noyau jusqu'à réception du signal `release()` émis par l'étape précédente.

## Implémentation de Production

```java
import java.util.concurrent.Semaphore;

public class Foo {
    private final Semaphore sem1 = new Semaphore(0);
    private final Semaphore sem2 = new Semaphore(0);

    public void first(Runnable printFirst) {
        printFirst.run();
        sem1.release(); // Autorise l'exécution de second()
    }

    public void second(Runnable printSecond) throws InterruptedException {
        sem1.acquire(); // Attend la complétion de first()
        printSecond.run();
        sem2.release(); // Autorise l'exécution de third()
    }

    public void third(Runnable printThird) throws InterruptedException {
        sem2.acquire(); // Attend la complétion de second()
        printThird.run();
    }
}
```

## Comparatif des Outils de Synchronisation

| Mécanisme | Consommation CPU | Réutilisable | Gestion des Interruptions |
|---|---|---|---|
| **`Semaphore(0)`** | **$0\%$ (Thread suspendu)** | Oui | Lève `InterruptedException` proprement. |
| **`CountDownLatch`** | **$0\%$ (Thread suspendu)** | Non (usage unique) | Lève `InterruptedException`. |
| **Boucle `volatile`** | $100\%$ CPU (attente active) | Oui | Nécessite un contrôle manuel d'interruption. |

## Ingénierie des Systèmes en Production

### Architecture Système : Pipelines Séquentiels Asynchrones

1. **Architecture Netty :** Ordonnancement strict des filtres réseau (Décodage $\to$ Validation $\to$ Traitement métier).
2. **Démarrage d'Applications :** Chaînage d'étapes critiques (Migrations BDD $\to$ Préchauffage des caches $\to$ Écoute sur le port HTTP).

## Cas Limites et Robustesse

1. **Exceptions :** Encadrer les traitements dans des blocs `try-finally` pour libérer les sémaphores même en cas d'erreur inattendue.
