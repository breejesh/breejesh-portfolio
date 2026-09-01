---
title: "Sans Outils de Test: Générateur de Charge Multi-Thread Sur Mesure (CTCI 11.4)"
description: "Concevez et implémentez un banc de test de charge HTTP multi-thread à partir de zéro pour évaluer le débit (RPS), les percentiles de latence et le taux d'erreurs."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-11-4-no-test-tools.webp
previewImage: /assets/images/ctci-11-4-no-test-tools.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Comment réaliseriez-vous un test de charge sur une page web sans recourir à aucun outil de test tiers (tel que JMeter ou Locust) ?
> * **La Solution Optimale:** **Banc de Test Multi-Thread Personnalisé** : (1) Créer un pool de threads ou une boucle asynchrone émettant des requêtes HTTP concurrentes sur un intervalle temporel donné ; (2) **Collecte des Métriques** : Mesurer la latence unitaire de chaque requête ($T_{\text{fin}} - T_{\text{début}}$), les codes de statut HTTP (2xx vs 5xx) et les erreurs réseau ; (3) **Agrégation Statistique** : Calculer le débit (RPS), les percentiles de latence P50/P95/P99 et le taux d'échec ; (4) **Télémétrie Serveur** : Surveiller le processeur, la RAM et la saturation des descripteurs de sockets.
> * **Réalité en Production:** Outils de banc d'essai internes chez Cloudflare / Netflix et simulateurs de trafic DDoS.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 11.4), l'énoncé est :

*"Expliquez comment vous testeriez la charge d'un serveur web sans aucun outil logiciel dedie."*

## 2. Architecture du Banc de Test

1. **Moteur d'Injection :** Threads concurrents transmettant des requêtes HTTP continues via `HttpURLConnection` ou des sockets TCP directs.
2. **Collecteur de Métriques :** Enregistrement des horodatages et statuts HTTP.
3. **Moteur d'Agrégation :** Tri des latences et extraction des centiles clés (P50, P95, P99).

## Implémentation de Production

```java
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class CustomLoadTester {
    private final String targetUrl;
    private final int concurrency;
    private final int totalRequests;
    private final List<Long> latencies = Collections.synchronizedList(new ArrayList<>());
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);

    public CustomLoadTester(String url, int concurrency, int totalRequests) {
        this.targetUrl = url;
        this.concurrency = concurrency;
        this.totalRequests = totalRequests;
    }

    public void runBenchmark() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(concurrency);
        CountDownLatch latch = new CountDownLatch(totalRequests);
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < totalRequests; i++) {
            executor.submit(() -> {
                long reqStart = System.currentTimeMillis();
                try {
                    URL url = new URL(targetUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);

                    int code = conn.getResponseCode();
                    long reqEnd = System.currentTimeMillis();

                    latencies.add(reqEnd - reqStart);
                    if (code >= 200 && code < 300) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                    conn.disconnect();
                } catch (IOException e) {
                    errorCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        long totalDuration = System.currentTimeMillis() - startTime;
        executor.shutdown();

        printReport(totalDuration);
    }

    private void printReport(long totalDurationMs) {
        Collections.sort(latencies);
        double rps = (successCount.get() + errorCount.get()) / (totalDurationMs / 1000.0);
        long p50 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.50));
        long p95 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.95));
        long p99 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.99));

        System.out.printf("Duree Totale: %d ms | Requetes: %d%n", totalDurationMs, totalRequests);
        System.out.printf("Debit: %.2f req/sec%n", rps);
        System.out.printf("Succes: %d | Erreurs: %d%n", successCount.get(), errorCount.get());
        System.out.printf("Latence: P50=%d ms, P95=%d ms, P99=%d ms%n", p50, p95, p99);
    }
}
```

## Analyse de Complexité et Performance

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Génération Concurrente | `O(N / C)` | $N$ requêtes distribuées sur $C$ threads. |
| Calcul des Percentiles | `O(N log N)` | Tri en mémoire des durées observées. |
| Empreinte Mémoire | `O(N)` | Liste synchronisée des durées de réponse. |

## Ingénierie des Systèmes en Production

### Architecture Système : Saturation Réseau

1. **Épuisement des Ports Éphémères :** Un client unique émettant massivement des requêtes risque d'épuiser les 65 535 ports locaux. Sous Linux, ajuster `net.ipv4.tcp_tw_reuse = 1`.
2. **Gestion des Connexions :** Comparer les performances avec et sans maintien de connexion (`Connection: keep-alive`).

## Cas Limites et Robustesse

1. **Délais d'Attente (Timeouts) :** Configuration de temporisations strictes à 5 000 ms pour éviter le blocage des threads de test.
2. **Volumétrie Élevée :** Pour des millions de requêtes, adopter des histogrammes de type HdrHistogram pour borner la mémoire.
