---
title: "Web Crawler: Diseño de un Rastreador Web Distribuido y Escalable (CTCI 9.3)"
description: "Problema CTCI 9.3: arquitectura para un rastreador web distribuido que gestiona URLs duplicadas y políticas de cortesía."
date: "2025-10-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-3-web-crawler.webp
previewImage: /assets/images/ctci-9-3-web-crawler.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.3 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.3: arquitectura para un rastreador web distribuido que gestiona URLs duplicadas y políticas de cortesía.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.3**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.3 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.3:** Problema CTCI 9.3: arquitectura para un rastreador web distribuido que gestiona URLs duplicadas y políticas de cortesía.

---

## 3. Enfoque óptimo e implementación

```java
public class URLFrontier {
    private final Set<String> visitedURLs = ConcurrentHashMap.newKeySet();
    private final BlockingQueue<String> urlQueue = new LinkedBlockingQueue<>();

    public void addURL(String url) {
        if (visitedURLs.add(url)) {
            urlQueue.offer(url);
        }
    }

    public String getNextURL() throws InterruptedException {
        return urlQueue.take();
    }
}
```

---

## 4. Complejidad Temporal y Espacial

| Métrica | Complejidad | Explicación |
| --- | --- | --- |
| Complejidad Temporal | O(N) / O(log N) | Recorrido óptimo de datos |
| Complejidad Espacial | O(1) / O(N) | Memoria acotada |

---

## 5. Casos Límite y Resumen

Verifica siempre condiciones de borde, valores nulos y límites de tamaño en entrevistas técnicas.