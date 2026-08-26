---
title: "Social Network: Redes Sociales y Rutas Más Cortas a Gran Escala (CTCI 9.2)"
description: "Problema CTCI 9.2: diseña un sistema distribuido para calcular el grado de separación entre dos usuarios en una red social masiva."
date: "2026-04-26"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.2 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.2: diseña un sistema distribuido para calcular el grado de separación entre dos usuarios en una red social masiva.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.2**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.2 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.2:** Problema CTCI 9.2: diseña un sistema distribuido para calcular el grado de separación entre dos usuarios en una red social masiva.

---

## 3. Enfoque óptimo e implementación

```java
public class BidirectionalBreadthFirstSearch {
    public List<Long> findShortestPath(Map<Long, List<Long>> graph, long source, long target) {
        Queue<Long> qSource = new LinkedList<>(), qTarget = new LinkedList<>();
        Map<Long, Long> parentsSource = new HashMap<>(), parentsTarget = new HashMap<>();

        qSource.add(source); parentsSource.put(source, null);
        qTarget.add(target); parentsTarget.put(target, null);

        while (!qSource.isEmpty() && !qTarget.isEmpty()) {
            Long intersect = searchLevel(graph, qSource, parentsSource, parentsTarget);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
            intersect = searchLevel(graph, qTarget, parentsTarget, parentsSource);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
        }
        return Collections.emptyList();
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