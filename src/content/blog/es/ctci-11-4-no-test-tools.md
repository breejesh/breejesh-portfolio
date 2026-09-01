---
title: "Sin Herramientas de Prueba: Generador de Carga Concurrente Personalizado (CTCI 11.4)"
description: "Disena e implementa desde cero un arnes de pruebas de carga multihilo en Java para medir rendimiento (RPS), percentiles de latencia y tasas de error."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-11-4-no-test-tools.webp
previewImage: /assets/images/ctci-11-4-no-test-tools.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Como realizarias una prueba de carga a una pagina web sin utilizar ninguna herramienta de pruebas comercial (como JMeter o Locust)?
> * **La Solución Óptima:** **Arnés de Carga Concurrente Personalizado**: (1) Crear un grupo de hilos o bucle asincrono que envie peticiones HTTP concurrentes durante un intervalo fijo; (2) **Captura de Métricas**: Medir la latencia individual por peticion ($T_{\text{fin}} - T_{\text{inicio}}$), codigos de estado HTTP (2xx vs 5xx) y tiempos de conexion agotados; (3) **Agregación Estadística**: Calcular el rendimiento (RPS), percentiles P50/P95/P99 y porcentaje de fallos; (4) **Telemetría de Servidor**: Monitorear consumo de CPU, memoria y saturacion de descriptores de socket.
> * **Realidad en Producción:** Bancos de pruebas de rendimiento internos en Cloudflare / Netflix y simuladores de trafico DDoS.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 11.4), se nos plantea:

*"Explica como disenarias y ejecutarias una prueba de carga a un servidor web sin usar herramientas externas de testing."*

## 2. Componentes del Banco de Pruebas

1. **Generador de Carga:** Hilos concurrentes que disparan peticiones GET/POST mediante `HttpURLConnection` o sockets directos.
2. **Colector de Métricas en Memoria:** Registro de tiempos de respuesta individuales y codigos de error.
3. **Generador de Reportes:** Ordenamiento de tiempos para calcular percentiles (P50, P95, P99) y peticiones por segundo (RPS).

## Implementación de Producción

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

        System.out.printf("Duración Total: %d ms | Peticiones: %d%n", totalDurationMs, totalRequests);
        System.out.printf("Rendimiento: %.2f req/seg%n", rps);
        System.out.printf("Éxito: %d | Errores: %d%n", successCount.get(), errorCount.get());
        System.out.printf("Latencia: P50=%d ms, P95=%d ms, P99=%d ms%n", p50, p95, p99);
    }
}
```

## Análisis de Complejidad y Rendimiento

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Generación Concurrente | `O(N / C)` | $N$ peticiones repartidas entre $C$ hilos concurrentes. |
| Cálculo de Percentiles | `O(N log N)` | Ordenamiento en memoria de los tiempos de latencia registrados. |
| Memoria Auxiliar | `O(N)` | Lista sincronizada de tiempos de respuesta en milisegundos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Agotamiento de Puertos

1. **Agotamiento de Puertos Efímeros:** Un volumen muy alto de peticiones desde una sola maquina puede agotar los 65.535 puertos TCP locales. En produccion se ajusta `net.ipv4.tcp_tw_reuse = 1`.
2. **Reutilización de Conexiones:** Probar tanto conexiones en frio como pools con `Connection: keep-alive`.

## Casos Límite y Robustez en Producción

1. **Manejo de Timeouts:** Timeouts explicitos de 5 segundos para evitar que hilos queden bloqueados indefinidamente.
2. **Control de Memoria:** Para millones de peticiones, utilizar estructuras de tipo T-Digest o histogramas HdrHistogram.
