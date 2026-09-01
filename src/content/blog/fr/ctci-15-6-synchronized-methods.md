---
title: "Méthodes Synchronisées: Moniteurs d'Objets et Concurrence en Java (CTCI 15.6)"
description: "Décortiquez le comportement des méthodes synchronisées en Java, le verrou de moniteur intrinsèque (Mark Word), les méthodes normales et les verrous de classe."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-6-synchronized-methods.webp
previewImage: /assets/images/ctci-15-6-synchronized-methods.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une classe disposant d'une méthode `synchronized` A et d'une méthode normale B, appelées par deux threads sur la même instance. Peuvent-ils exécuter A simultanément ? Peuvent-ils exécuter A et B en même temps ?
> * **Règles de Concurrence de la JVM :**
>   1. **Deux Threads sur A (Même Instance)** : **NON**. La méthode acquiert le verrou du moniteur intrinsèque de `this`. Le second thread est placé à l'état `BLOCKED` jusqu'à libération du moniteur.
>   2. **Un Thread sur A et un Thread sur B (Même Instance)** : **OUI**. La méthode B n'étant pas synchronisée, elle ne sollicite aucun verrou de moniteur et s'exécute immédiatement.
>   3. **Si B est Également Synchronisée** : **NON**. Les deux méthodes rivalisent pour le même moniteur `this`.
>   4. **Instances Distinctes (`obj1` et `obj2`)** : **OUI**. Chaque objet sur le tas possède son propre en-tête (Mark Word) et son moniteur autonome.
>   5. **Méthodes Statiques Synchronisées** : Verrouillent l'objet `Class` (`MaClasse.class`).
> * **Réalité en Production:** Risques de lectures incohérentes dans les services singleton Spring.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.6), l'énoncé est :

*"Evaluez les regles d'exclusion mutuelle et les interferences d'execution entre methodes synchronisees et non-synchronisees d'un objet Java."*

## 2. Structure Interne du Moniteur JVM

Lors de l'entrée dans une méthode synchronisée, la JVM émet l'instruction `monitorenter`. La méthode normale s'exécute sans solliciter cette barrière de synchronisation.

## Implémentation de Production

```java
public class SynchronizedDemo {
    private int compteur = 0;

    public synchronized void methodeA(String nomThread) {
        System.out.println(nomThread + " ENTRE dans methodeA (détient le moniteur)");
        try {
            Thread.sleep(1000);
            compteur += 10;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println(nomThread + " SORT de methodeA (moniteur libéré)");
    }

    public void methodeB(String nomThread) {
        System.out.println(nomThread + " EXECUTE methodeB en parallèle! (compteur=" + compteur + ")");
    }

    public static void main(String[] args) {
        SynchronizedDemo instance = new SynchronizedDemo();

        new Thread(() -> instance.methodeA("Thread-1")).start();

        new Thread(() -> {
            try { Thread.sleep(200); } catch (InterruptedException ignored) {}
            instance.methodeB("Thread-2"); // S'exécute immédiatement!
        }).start();

        new Thread(() -> {
            try { Thread.sleep(300); } catch (InterruptedException ignored) {}
            instance.methodeA("Thread-3"); // BLOQUÉ jusqu'à la fin de Thread-1!
        }).start();
    }
}
```

## Tableau Synthétique des Comportements

| Scénario | Méthodes | Instances | Exécution Parallèle ? | Cause Racine |
|---|---|---|---|---|
| **Scénario 1** | `methodeA()` vs `methodeA()` | Même | **NON** | Conflit sur le moniteur de `this`. |
| **Scénario 2** | `methodeA()` vs `methodeB()` | Même | **OUI** | `methodeB()` n'acquiert aucun verrou. |
| **Scénario 3** | Deux méthodes `synchronized` | Même | **NON** | Même verrou `this`. |
| **Scénario 4** | `methodeA()` vs `methodeA()` | Distinctes | **OUI** | Moniteurs indépendants en mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Risques de Concurrence

1. **Lectures Non-Synchronisées :** Si `methodeB()` lit des attributs modifiés par `methodeA()` sans `volatile`, le modèle mémoire de Java peut renvoyer des valeurs obsolètes.
2. **Verrous Lecture/Écriture :** Préférer `ReentrantReadWriteLock` pour autoriser plusieurs lecteurs concurrents.

## Cas Limites et Robustesse

1. **Interblocage Croisé :** Éviter les appels circulaires entre méthodes synchronisées de deux objets distincts.
