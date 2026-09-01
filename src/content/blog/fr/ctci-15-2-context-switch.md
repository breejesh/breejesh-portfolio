---
title: "Changement de Contexte: Mesure de Latence de l'Ordonnanceur Noyau (CTCI 15.2)"
description: "Formulez une méthode empirique pour mesurer la latence du changement de contexte OS par échange de jetons bloquants et affinité CPU stricte."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-15-2-context-switch.webp
previewImage: /assets/images/ctci-15-2-context-switch.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Comment mesureriez-vous le temps passé lors d'un changement de contexte (Context Switch) ?
> * **La Solution Optimale:** **Échange de Jetons par Tubes et Affinité Processeur Fixée** :
>   1. **Affinité CPU** : Verrouiller deux processus ($P_1, P_2$) sur le **même cœur processeur physique** via `sched_setaffinity()` pour interdire l'exécution parallèle.
>   2. **Transfert Bloquant** : Relier $P_1$ et $P_2$ par deux tubes Unix. $P_1$ écrit un octet et se bloque en lecture ; $P_2$ se réveille, lit, écrit sa réponse et se bloque à son tour.
>   3. **Bascule Forcée** : Chaque lecture bloquante contraint l'ordonnanceur du noyau à effectuer un changement de contexte complet (2 bascules par cycle complet).
>   4. **Formule** : $T_{\text{bascule}} = \frac{T_{\text{total}} - T_{\text{base}}}{2 \times N}$.
> * **Réalité en Production:** Outils `perf stat -e context-switches`, sondes eBPF (`sched_switch`) et isolation de cœurs (`isolcpus`).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 15.2), l'énoncé est :

*"Proposez un protocole experimental precis permettant de quantifier le temps consacre par l'OS au basculement de contexte."*

## 2. Protocole de Mesure Expérimentale

1. Assigner l'intégralité du banc de test à un unique cœur processeur (CPU Core 0).
2. Forcer l'ordonnanceur à commuter alternativement entre les deux processus à l'aide d'appels `read()` bloquants sur tubes anonymes.

## Implémentation de Production

```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sched.h>
#include <time.h>
#include <sys/wait.h>

#define ITERATIONS 100000

static inline long long lire_nanos(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (long long)ts.tv_sec * 1000000000LL + ts.tv_nsec;
}

int main() {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(0, &cpuset);
    sched_setaffinity(0, sizeof(cpu_set_t), &cpuset);

    int p1_to_p2[2], p2_to_p1[2];
    pipe(p1_to_p2);
    pipe(p2_to_p1);

    char jeton = 'x';
    pid_t pid = fork();

    if (pid == 0) {
        for (int i = 0; i < ITERATIONS; i++) {
            read(p1_to_p2[0], &jeton, 1);
            write(p2_to_p1[1], &jeton, 1);
        }
        _exit(0);
    } else {
        long long debut = lire_nanos();
        for (int i = 0; i < ITERATIONS; i++) {
            write(p1_to_p2[1], &jeton, 1);
            read(p2_to_p1[0], &jeton, 1);
        }
        long long total = lire_nanos() - debut;
        wait(NULL);

        double latence_moyenne = (double)total / (2.0 * ITERATIONS);
        printf("Latence Moyenne par Changement de Contexte: %.2f ns\n", latence_moyenne);
    }
    return 0;
}
```

## Ordres de Grandeur des Latences

| Nature de la Bascule | Latence Typique | Composante Principale du Coût |
|---|---|---|
| **Inter-Threads (Même Processus)** | $\approx 300\text{--}800\text{ ns}$ | Sauvegarde registres, pointeur de pile. |
| **Inter-Processus (Espaces Distincts)** | $\approx 1{,}2\text{--}2{,}5\ \mu\text{s}$ | Invalidation du cache TLB et rechargement des pages. |

## Ingénierie des Systèmes en Production

### Architecture Système : Sondes eBPF et Isolation CPU

1. **Points de Trace eBPF (`sched:sched_switch`) :** Mesure non intrusive des latences réelles sur serveurs de production.
2. **Isolation de Cœurs (`isolcpus`) :** En finance quantitative, assignation exclusive d'un cœur à un thread unique pour éliminer toute commutation.

## Cas Limites et Robustesse

1. **Biais Multi-Cœurs :** Omettre `sched_setaffinity` mesurerait la vitesse de transmission inter-cœurs plutôt que le changement de contexte.
