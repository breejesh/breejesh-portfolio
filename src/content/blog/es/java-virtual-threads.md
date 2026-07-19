---
title: "Hilos Virtuales en Java 21: ¿Son los Thread Pools Finalmente Obsoletos?"
description: "Un análisis profundo de Project Loom en Java. Descubre cómo los hilos virtuales permiten millones de tareas concurrentes en una sola JVM y eliminan el agotamiento tradicional de los pools de hilos."
date: 2026-02-15
tags: [Java, Diseño de sistemas]
coverImage: /assets/images/java-virtual-threads.webp
previewImage: /assets/images/java-virtual-threads.webp
---

Durante casi dos décadas, el patrón estándar para manejar la alta concurrencia en Java ha sido el pool de hilos (thread pool). Cada vez que un servidor necesitaba procesar peticiones simultáneas, los desarrolladores configuraban ejecutores para gestionar un número fijo de hilos del sistema operativo.

Pero con la introducción de los **Hilos Virtuales** (Project Loom) en Java 21, el panorama de la concurrencia en Java ha sido completamente reescrito.

### El Problema con los Hilos de Plataforma

Tradicionalmente, cada `java.lang.Thread` se mapeaba 1:1 a un hilo del sistema operativo (OS). Estos se conocen como **Hilos de Plataforma**.

Los hilos de plataforma son pesados:
1. **Alta Sobrecarga de Memoria**: Cada hilo del OS consume alrededor de 1-2 MB de memoria para su pila (stack). Crear 10,000 hilos requiere instantáneamente de 10 a 20 GB de RAM.
2. **Costo de Cambio de Contexto**: El kernel del SO maneja la planificación de estos hilos. Cuando un hilo se bloquea (por ejemplo, esperando una respuesta de la base de datos o una llamada HTTP), el kernel debe realizar un costoso cambio de contexto a otro hilo.
3. **Agotamiento de Hilos**: Debido a su peso, tenemos que limitarlos utilizando pools de hilos (por ejemplo, el máximo predeterminado de 200 en Tomcat). Si tu aplicación experimenta un aumento en las llamadas I/O bloqueantes, el pool se agota, provocando tiempos de espera agotados y fallas en cascada.

Para solucionar esto, los frameworks introdujeron la **Programación Asíncrona/Reactiva** (como Spring WebFlux o RxJava). Esto permitió manejar muchas conexiones concurrentes en unos pocos hilos, pero tuvo un costo elevado: complejidad en el código, el "callback hell" y trazas de pila (stack traces) rotas.

### Entran los Hilos Virtuales

Los hilos virtuales son hilos ligeros gestionados por la Máquina Virtual de Java (JVM), no por el sistema operativo.

Múltiples hilos virtuales se multiplexan sobre un pequeño grupo de hilos portadores (carrier threads) del sistema operativo subyacente. Cuando un hilo virtual realiza una llamada I/O bloqueante (como consultar una base de datos), la JVM lo suspende automáticamente, moviendo su estado al heap. El hilo del sistema operativo subyacente se libera instantáneamente para ejecutar otro hilo virtual.

Cuando la operación I/O se completa, la JVM reanuda el hilo virtual donde lo dejó.

#### La Magia de `Thread.ofVirtual()`

Crear un hilo virtual es tan simple como:

```java
Thread.ofVirtual().start(() -> {
    System.out.println("Running on a virtual thread!");
});
```

Debido a que los hilos virtuales consumen solo unos pocos bytes de memoria, no es necesario agruparlos en pools. De hecho, **usar un pool para hilos virtuales se considera un antipatrón**. Puedes crear fácilmente un millón de ellos simultáneamente:

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

Este código se completa en aproximadamente 1 segundo en una computadora portátil estándar, algo completamente imposible con los hilos de plataforma.

### Cuándo Usar Hilos Virtuales

Los hilos virtuales brillan en aplicaciones **limitadas por I/O** (I/O-bound). Si tu microservicio pasa la mayor parte de su tiempo esperando bases de datos, APIs REST externas o sistemas de archivos, los hilos virtuales aumentarán enormemente tu rendimiento y eficiencia de recursos.

Obtienes los beneficios de rendimiento de la programación reactiva mientras escribes código sincrónico, legible y simple. Las trazas de pila permanecen intactas y los depuradores tradicionales funcionan a la perfección.

### Cuándo NO Usar Hilos Virtuales

Los hilos virtuales no son una bala de plata. Debes evitarlos para:
*   **Tareas limitadas por CPU** (CPU-bound): Codificación de video, cálculos matemáticos pesados o bucles cerrados. Dado que los hilos virtuales todavía se ejecutan en hilos portadores del SO, no harán que tu CPU procese números más rápido.
*   **Hilos Anclados (Pinned Threads)**: Las operaciones que llaman a código nativo (JNI) o utilizan bloques `synchronized` blocks pueden "anclar" el hilo virtual a su hilo portador del SO, impidiendo que la JVM lo intercambie. Migra los bloques `synchronized` a `ReentrantLock` al adoptar hilos virtuales.

### Pruebas de Rendimiento y Análisis

Para ver el impacto práctico de los Hilos Virtuales en comparación con los Hilos de Plataforma tradicionales, realicé una prueba de rendimiento comparando el rendimiento del pool de hilos predeterminado de Tomcat (usando una aplicación Spring Boot 3.x) bajo una carga de trabajo limitada por I/O.

La prueba de carga simuló **3,000 peticiones en total** a diferentes niveles de concurrencia (50, 150, 300, 500, 1000) con un retraso de I/O simulado de **100ms** por petición. El código completo y la configuración se pueden encontrar en el [Repositorio de GitHub](https://github.com/breejesh/java-virtual-threads-benchmarking).

#### Comparación de Rendimiento (Mayor es Mejor)

| Concurrencia | Hilos de Plataforma (req/s) | Hilos Virtuales (req/s) | Mejora de Escala |
| :---: | :---: | :---: | :---: |
| **50** | 467.26 | 455.28 | 0.97x |
| **150** | 1316.24 | 1288.79 | 0.98x |
| **300** | 1768.79 | 2297.41 | **1.30x** |
| **500** | 1780.12 | 3451.08 | **1.94x** |
| **1000** | 1754.76 | 5070.74 | **2.89x** |

#### Comparación de Latencia (Menor es Mejor)

| Concurrencia | Latencia de Plataforma (Media / P95) | Latencia Virtual (Media / P95) | Reducción de Latencia |
| :---: | :---: | :---: | :---: |
| **50** | 107.0ms / 108ms | 109.8ms / 110ms | -2.6% (Límite de sobrecarga) |
| **150** | 114.0ms / 111ms | 116.4ms / 113ms | -2.1% (Límite de sobrecarga) |
| **300** | 169.6ms / 212ms | 130.6ms / 116ms | **23.0%** |
| **500** | 280.9ms / 362ms | 144.9ms / 136ms | **48.4%** |
| **1000** | 569.9ms / 711ms | 197.2ms / 260ms | **65.4%** |

#### Visualización de los Resultados

![Resultados de las Pruebas de Rendimiento de Tomcat Platform Threads vs Virtual Threads](https://raw.githubusercontent.com/breejesh/java-virtual-threads-benchmarking/main/benchmark_results.png)

#### Observaciones Clave
1. **Baja Concurrencia (<= 200)**: Con una concurrencia inferior a 200 (por debajo del límite del pool de hilos máximo de Tomcat), los Hilos de Plataforma y los Hilos Virtuales funcionan de forma idéntica. Esto demuestra que los Hilos Virtuales no aceleran la ejecución del código de la CPU por sí mismos; permiten la escala.
2. **Cuello de Botella de Cola (> 200)**: Una vez que la concurrencia supera el límite de hilos máximo de Tomcat (200), el pool de hilos de plataforma se agota. Las solicitudes entrantes esperan en la cola TCP, lo que hace que la latencia media se dispare (por ejemplo, a **569.9ms** con una concurrencia de 1000).
3. **Escalado de Rendimiento**: El rendimiento de los hilos de plataforma tiene un límite de aproximadamente **1780 req/s** (200 hilos * 10 req/s por hilo). Los hilos virtuales manejan la concurrencia con facilidad, escalando el rendimiento hasta **5070.74 req/s** (una **mejora de 2.89x**) mientras mantienen la latencia media por debajo de los **200ms**.

### Conclusión

Los hilos virtuales de Java 21 son la actualización más significativa del lenguaje desde las expresiones Lambda en Java 8. Al hacer que los hilos sean esencialmente \"gratuitos\", Project Loom elimina la necesidad de paradigmas reactivos complejos y pools de hilos sobredimensionados, devolviendo la simplicidad a las aplicaciones Java de alto rendimiento.
