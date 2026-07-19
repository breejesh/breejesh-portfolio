---
title: "Threads Virtuels dans Java 21 : Les pools de threads sont-ils enfin obsolètes ?"
description: "Une plongée en profondeur dans Project Loom de Java. Découvrez comment les threads virtuels permettent des millions de tâches simultanées sur une seule JVM et éliminent l'épuisement traditionnel des pools de threads."
date: 2026-02-15
tags: [Java, Conception de systèmes]
coverImage: /assets/images/java-virtual-threads.webp
previewImage: /assets/images/java-virtual-threads.webp
---

Pendant près de deux décennies, le modèle standard pour gérer une forte simultanéité en Java a été le pool de threads (thread pool). Chaque fois qu'un serveur devait traiter des requêtes simultanées, les développeurs configuraient des exécuteurs pour gérer un nombre fixe de threads du système d'exploitation.

Mais avec l'introduction des **Threads Virtuels** (Project Loom) dans Java 21, le paysage de la concurrence Java a été complètement réécrit.

### Le Problème avec les Threads de Plateforme

Traditionnellement, chaque `java.lang.Thread` était mappé 1:1 à un thread du système d'exploitation (OS). Ceux-ci sont connus sous le nom de **Threads de Plateforme** (Platform Threads).

Les threads de plateforme sont lourds :
1. **Surcharge de mémoire élevée** : Chaque thread du système d'exploitation consomme environ 1 à 2 Mo de mémoire pour sa pile (stack). La création de 10 000 threads nécessite instantanément 10 à 20 Go de RAM.
2. **Coût du changement de contexte** : Le noyau de l'OS gère la planification de ces threads. Lorsqu'un thread se bloque (par exemple, en attendant une réponse de la base de données ou un appel HTTP), le noyau doit effectuer un changement de contexte coûteux vers un autre thread.
3. **Épuisement des threads** : En raison de leur poids, nous devons les limiter en utilisant des pools de threads (par exemple, le maximum par défaut de Tomcat de 200). Si votre application subit une augmentation des appels I/O bloquants, le pool s'épuise, entraînant des délais d'attente (timeouts) et des défaillances en cascade.

Pour résoudre ce problème, les frameworks ont introduit la **Programmation Asynchrone/Réactive** (comme Spring WebFlux ou RxJava). Cela a permis de gérer de nombreuses connexions simultanées sur quelques threads, mais à un coût élevé : complexité du code, \"callback hell\" et traces de pile (stack traces) illisibles.

### Entrée des Threads Virtuels

Les threads virtuels sont des threads légers gérés par la Machine Virtuelle Java (JVM), et non par le système d'exploitation.

De multiples threads virtuels sont multiplexés sur un petit groupe de threads porteurs (carrier threads) du système d'exploitation sous-jacent. Lorsqu'un thread virtuel effectue un appel I/O bloquant (comme interroger une base de données), la JVM le suspend automatiquement, déplaçant son état vers le tas (heap). Le thread du système d'exploitation sous-jacent est instantanément libéré pour exécuter un thread virtuel différent.

Lorsque l'opération I/O est terminée, la JVM reprend le thread virtuel là où il s'était arrêté.

#### La Magie de `Thread.ofVirtual()`

Créer un thread virtuel est aussi simple que :

```java
Thread.ofVirtual().start(() -> {
    System.out.println("Running on a virtual thread!");
});
```

Comme les threads virtuels ne consomment que quelques octets de mémoire, vous n'avez pas besoin de les regrouper dans un pool. En fait, **utiliser un pool pour les threads virtuels est considéré comme un anti-pattern**. Vous pouvez facilement en créer un million simultanément :

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 1_000_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
}
```

Ce code s'exécute en environ 1 seconde sur un ordinateur portable standard, ce qui est totalement impossible avec les threads de plateforme.

### Quand Utiliser les Threads Virtuels

Les threads virtuels brillent dans les applications **limitées par les I/O** (I/O-bound). Si votre microservice passe la majeure partie de son temps à attendre des bases de données, des API REST externes ou des systèmes de fichiers, les threads virtuels augmenteront massivement votre débit et l'efficacité de vos ressources.

Vous obtenez les avantages de performance de la programmation réactive tout en écrivant un code synchrone, lisible et simple. Les traces de pile restent intactes et les débogueurs traditionnels fonctionnent parfaitement.

### Quand NE PAS Utiliser les Threads Virtuels

Les threads virtuels ne sont pas une solution miracle. Vous devez les éviter pour :
*   **Les tâches limitées par le CPU** (CPU-bound) : Encodage vidéo, calculs mathématiques lourds ou boucles serrées. Étant donné que les threads virtuels s'exécutent toujours sur des threads porteurs de l'OS, ils ne feront pas calculer votre processeur plus rapidement.
*   **Threads Épinglés (Pinned Threads)** : Les opérations qui appellent du code natif (JNI) ou utilisent des blocs `synchronized` peuvent "épingler" le thread virtuel à son thread porteur de l'OS, empêchant la JVM de le permuter. Migrez les blocs `synchronized` vers `ReentrantLock` lors de l'adoption des threads virtuels.

### Analyse comparative et de performance

Pour voir l'impact pratique des Threads Virtuels par rapport aux Threads de Plateforme traditionnels, j'ai exécuté un benchmark comparant les performances du pool de threads Tomcat par défaut (à l'aide d'une application Spring Boot 3.x) sous une charge de travail limitée par les I/O.

Le test de charge a simulé **3 000 requêtes au total** à différents niveaux de simultanéité (50, 150, 300, 500, 1000) avec un délai d'I/O simulé de **100ms** par requête. Le codebase complet et la configuration sont disponibles sur le [Dépôt GitHub](https://github.com/breejesh/java-virtual-threads-benchmarking).

#### Comparaison du débit (Le plus élevé est le mieux)

| Simultanéité | Threads de Plateforme (req/s) | Threads Virtuels (req/s) | Amélioration de l'échelle |
| :---: | :---: | :---: | :---: |
| **50** | 467.26 | 455.28 | 0.97x |
| **150** | 1316.24 | 1288.79 | 0.98x |
| **300** | 1768.79 | 2297.41 | **1.30x** |
| **500** | 1780.12 | 3451.08 | **1.94x** |
| **1000** | 1754.76 | 5070.74 | **2.89x** |

#### Comparaison de la latence (Le plus bas est le mieux)

| Simultanéité | Latence Plateforme (Moyenne / P95) | Latence Virtuelle (Moyenne / P95) | Réduction de la latence |
| :---: | :---: | :---: | :---: |
| **50** | 107.0ms / 108ms | 109.8ms / 110ms | -2.6% (Limite de surcharge) |
| **150** | 114.0ms / 111ms | 116.4ms / 113ms | -2.1% (Limite de surcharge) |
| **300** | 169.6ms / 212ms | 130.6ms / 116ms | **23.0%** |
| **500** | 280.9ms / 362ms | 144.9ms / 136ms | **48.4%** |
| **1000** | 569.9ms / 711ms | 197.2ms / 260ms | **65.4%** |

#### Visualisation des résultats

![Résultats du benchmark Tomcat Platform Threads vs Virtual Threads](https://raw.githubusercontent.com/breejesh/java-virtual-threads-benchmarking/main/benchmark_results.png)

#### Observations clés
1. **Faible simultanéité (<= 200)** : Avec une simultanéité inférieure à 200 (en dessous de la limite maximale du pool de threads de Tomcat), les threads de plateforme et les threads virtuels s'exécutent de manière identique. Cela montre que les threads virtuels ne rendent pas l'exécution du code CPU plus rapide en soi ; ils permettent simplement de passer à l'échelle.
2. **Goulot d'étranglement de mise en file d'attente (> 200)** : Dès que la simultanéité dépasse la limite maximale de threads de Tomcat (200), le pool de threads de plateforme s'épuise. Les requêtes entrantes attendent dans la file d'attente TCP, ce qui fait grimper la latence moyenne (par exemple, à **569.9ms** pour une simultanéité de 1000).
3. **Mise à l'échelle du débit** : Le débit des threads de plateforme plafonne à environ **1780 req/s** (200 threads * 10 req/s/thread). Les threads virtuels gèrent la simultanéité de manière fluide, augmentant le débit jusqu'à **5070.74 req/s** (une **amélioration de 2.89x**) tout en maintenant la latence moyenne sous les **200ms**.

### Conclusion

Les threads virtuels de Java 21 sont la mise à jour la plus importante du langage depuis les Lambdas dans Java 8. En rendant les threads essentiellement \"gratuits\", Project Loom élimine le besoin de paradigmes réactifs complexes et de pools de threads surdimensionnés, ramenant la simplicité aux applications Java à hautes performances.
