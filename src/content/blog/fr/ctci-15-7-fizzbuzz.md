---
title: "FizzBuzz Multi-Threads: Synchronisation de 4 Threads et Moniteurs (CTCI 15.7)"
description: "Implémentez FizzBuzz multi-threads avec 4 threads coordonnés en Java à l'aide de moniteurs synchronisés, et des mécanismes wait/notifyAll."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez une version multi-threads de FizzBuzz avec 4 threads : Thread A écrit "FizzBuzz" (divisible par 3 et 5), Thread B écrit "Fizz" (divisible par 3 uniquement), Thread C écrit "Buzz" (divisible par 5 uniquement), et Thread D écrit l'entier brut. La séquence $1..N$ doit être émise dans l'ordre croissant strict.
> * **La Solution Optimale:** **Boucle d'États avec Moniteur Synchronisé et `wait()`/`notifyAll()`** :
>   1. Partager un compteur `current = 1` protégé par un objet de verrouillage.
>   2. Chaque thread boucle tant que `current <= n`, en évaluant son prédicat de divisibilité.
>   3. Si le prédicat est FAUX, le thread appelle `lock.wait()` et libère le verrou.
>   4. Si le prédicat est VRAI, le thread imprime sa valeur, incrémente `current++` et lance `lock.notifyAll()`.
>   5. S'exécute en **temps $O(N)$**.
> * **Réalité en Production:** Ordonnancement round-robin de pools de threads dans les moteurs de traitement de flux.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.7), l'énoncé est :

*"Coordonnez 4 threads concurrents evaluant des predicats arithmetiques pour emettre la suite FizzBuzz de 1 a n dans un ordre deterministe."*

## 2. Machine à États Multi-Threads

Chaque incrémentation atomique de `current` déclenche une notification globale pour réveiller les threads en attente.

## Implémentation de Production

```java
import java.util.function.IntConsumer;
import java.util.function.Predicate;

public class FizzBuzzMultithreaded {
    private final int n;
    private int current = 1;
    private final Object lock = new Object();

    public FizzBuzzMultithreaded(int n) {
        this.n = n;
    }

    private void printLoop(Predicate<Integer> predicate, ConsumerTask printer) throws InterruptedException {
        synchronized (lock) {
            while (current <= n) {
                if (predicate.test(current)) {
                    printer.accept(current);
                    current++;
                    lock.notifyAll(); // Réveille tous les threads pour réévaluer
                } else {
                    lock.wait(); // Cède le verrou et s'endort
                }
            }
        }
    }

    public void fizz(Runnable printFizz) throws InterruptedException {
        printLoop(i -> i % 3 == 0 && i % 5 != 0, i -> printFizz.run());
    }

    public void buzz(Runnable printBuzz) throws InterruptedException {
        printLoop(i -> i % 5 == 0 && i % 3 != 0, i -> printBuzz.run());
    }

    public void fizzbuzz(Runnable printFizzBuzz) throws InterruptedException {
        printLoop(i -> i % 15 == 0, i -> printFizzBuzz.run());
    }

    public void number(IntConsumer printNumber) throws InterruptedException {
        printLoop(i -> i % 3 != 0 && i % 5 != 0, printNumber::accept);
    }

    @FunctionalInterface
    private interface ConsumerTask {
        void accept(int val);
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Exactement $N$ transitions d'état réussies. |
| Espace Mémoire | `O(1)` | Compteur partagé unique et file d'attente moniteur. |

## Ingénierie des Systèmes en Production

### Architecture Système : Variables de Condition Dédiées

1. **`Lock` et `Condition` Explicites :** L'usage de `ReentrantLock` avec 4 instances `Condition` distinctes évite le phénomène de réveil de masse (thundering herd).
2. **Modèle d'Acteurs :** En programmation distribuée (Erlang / Akka), les flux sont orchestrés sans verrous via des boîtes aux lettres de messages.

## Cas Limites et Robustesse

1. **Sortie Propre de Boucle :** Quand `current > n`, le dernier `notifyAll()` réveille tous les threads pour leur permettre de quitter la boucle proprement sans bloquer.
