---
title: "Thread vs. Processus: Espaces Mémoire et Modèles d'Exécution (CTCI 15.1)"
description: "Distinguez les processus et les threads : isolation mémoire virtuelle, structures PCB/TCB, communication IPC et coût du changement de contexte."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-1-thread-vs-process.webp
previewImage: /assets/images/ctci-15-1-thread-vs-process.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Quelle est la différence entre un thread et un processus ?
> * **Distinctions Fondamentales :**
>   1. **Processus** : Instance indépendante d'un programme en cours d'exécution, dotée de son propre espace d'adressage virtuel isolé, d'une table de descripteurs de fichiers et d'un bloc de contrôle de processus (PCB). La communication s'effectue via des mécanismes d'IPC (tubes, sockets, mémoire partagée).
>   2. **Thread** : Unité d'exécution planifiable au sein d'un processus parent (TCB). Tous les threads d'un processus partagent le même tas (Heap), le code et les fichiers ouverts, mais disposent d'un **compteur de programme (PC), de registres et d'une pile d'exécution privés**.
>   3. **Périmètre de Défaillance** : Si un thread plante (`SIGSEGV`), l'ensemble du processus parent s'interrompt ; la panne d'un processus n'affecte pas les autres processus du système d'exploitation.
> * **Réalité en Production:** Architecture multi-processus de Google Chrome (isolation des onglets) vs threads de la JVM Java.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.1), l'énoncé est :

*"Exposez les differences fondamentales entre un processus et un thread en matiere d'isolation memoire, d'ordonnancement et de communication inter-taches."*

## 2. Organisation de la Mémoire

* **Processus :** Cloisonnement total garanti par l'unité de gestion mémoire (MMU).
* **Thread :** Partage du tas commun avec pile d'appels dédiée.

## Implémentation de Production

```c
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/wait.h>

int variable_partagee = 100;

void* routine_thread(void* arg) {
    variable_partagee += 50; // Modifie la mémoire partagée du processus
    printf("Thread: variable_partagee = %d\n", variable_partagee);
    return NULL;
}

int main() {
    pthread_t tid;
    pthread_create(&tid, NULL, routine_thread, NULL);
    pthread_join(tid, NULL);
    printf("Principal (après thread): %d (Mémoire Partagée)\n", variable_partagee);

    pid_t pid = fork();
    if (pid == 0) {
        variable_partagee += 500; // Copie privée isolée dans le processus enfant
        printf("Enfant: %d\n", variable_partagee);
        _exit(0);
    } else {
        wait(NULL);
        printf("Parent: %d (Mémoire Isolée)\n", variable_partagee);
    }
    return 0;
}
```

## Tableau Synthétique des Différences

| Caractéristique | Processus | Thread |
|---|---|---|
| **Espace Mémoire** | Isolé via tables de pages dédiées. | Partagé au sein du même processus. |
| **Coût de Création** | Élevé (duplication de structures noyau). | Faible (allocation de pile $\approx 1\text{ Mo}$). |
| **Changement de Contexte** | Coûteux (invalide le cache TLB du processeur). | Rapide (conserve les tables de pages actives). |
| **Communication** | IPC (Tubes, sockets réseau, mémoire partagée). | Lecture/écriture directe dans le tas. |
| **Tolérance aux Pannes** | Élevée (panne isolée). | Faible (un crash thread détruit le processus). |

## Ingénierie des Systèmes en Production

### Architecture Système : Modèles d'Architecture Industriels

1. **Chromium :** Chaque onglet s'exécute dans un processus distinct pour garantir la sécurité et la stabilité globale du navigateur.
2. **Nginx :** Architecture maître-ouvriers (master-workers) à un seul thread par processus exploitant `epoll`.

## Cas Limites et Robustesse

1. **Processus Zombies :** Processus enfants terminés dont le code de retour n'a pas été acquitté par l'appel `wait()`.
