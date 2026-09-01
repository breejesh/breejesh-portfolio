---
title: "Nombres de Bebés: Agrupación de Sinónimos mediante Componentes Conexos (CTCI 17.7)"
description: "Consolida frecuencias de nombres y variantes sinonimas utilizando busqueda en profundidad (DFS) en componentes conexos de grafos en tiempo O(V + E)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-7-baby-names.webp
previewImage: /assets/images/ctci-17-7-baby-names.webp
---

> **TL;DR**
> * **El Problema del Libro:** Se te dan dos listas: una con nombres y sus frecuencias de registro, y otra con pares de nombres equivalentes (ej. `(John, Jon)`, `(Jon, Johnny)`). Imprime una lista consolidada con los nombres canonicos y sus frecuencias totales sumadas.
> * **La Solución Óptima:** **Componentes Conexos en Grafos (DFS / Union-Find)**:
>   1. **Construcción del Grafo**: Modelar cada nombre como un vertice $V$ y anadir aristas no dirigidas para cada par de sinonimos $(u, v) \in E$.
>   2. **Recorrido por Componentes**: Para cada nodo no visitado, ejecutar un recorrido en profundidad (DFS) acumulando las frecuencias de todos sus alias conexos.
>   3. **Consolidación**: Asociar la suma acumulada al nombre representativo del componente.
>   4. Se ejecuta en **tiempo $O(V + E)$** y **espacio $O(V + E)$**.
> * **Realidad en Producción:** Resolucion de identidades en grafos de conocimiento y deduplicacion en sistemas CRM/MDM.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.7), se nos plantea:

*"Agrupa las variantes ortograficas de nombres propios mediante pares de equivalencia transitiva y suma sus frecuencias asociadas."*

## 2. Agrupación por Componentes Conexos

Al modelar los sinonimos como aristas de un grafo no dirigido, el problema se reduce a encontrar los componentes conexos y sumar las frecuencias de sus nodos.

## Implementación de Producción

```java
import java.util.*;

public class BabyNames {

    public static class GraphNode {
        public final String name;
        public int frequency = 0;
        public final List<GraphNode> neighbors = new ArrayList<>();
        public boolean visited = false;

        public GraphNode(String name, int frequency) {
            this.name = name;
            this.frequency = frequency;
        }
    }

    public static Map<String, Integer> trulyPopularNames(
            Map<String, Integer> names,
            String[][] synonyms) {

        Map<String, GraphNode> graph = new HashMap<>();

        for (Map.Entry<String, Integer> entry : names.entrySet()) {
            graph.put(entry.getKey(), new GraphNode(entry.getKey(), entry.getValue()));
        }

        for (String[] pair : synonyms) {
            String name1 = pair[0];
            String name2 = pair[1];

            GraphNode node1 = graph.computeIfAbsent(name1, k -> new GraphNode(k, 0));
            GraphNode node2 = graph.computeIfAbsent(name2, k -> new GraphNode(k, 0));

            node1.neighbors.add(node2);
            node2.neighbors.add(node1);
        }

        Map<String, Integer> rootFrequencies = new HashMap<>();

        for (GraphNode node : graph.values()) {
            if (!node.visited) {
                int totalFrequency = getComponentFrequency(node);
                rootFrequencies.put(node.name, totalFrequency);
            }
        }

        return rootFrequencies;
    }

    private static int getComponentFrequency(GraphNode node) {
        if (node.visited) return 0;
        node.visited = true;

        int sum = node.frequency;
        for (GraphNode neighbor : node.neighbors) {
            sum += getComponentFrequency(neighbor);
        }
        return sum;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(V + E)` | Recorrido lineal sobre vertices y aristas del grafo. |
| Espacio Auxiliar | `O(V + E)` | Lista de adyacencia y pila de llamadas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Resolución de Entidades

1. **Gestión de Datos Maestros (MDM):** Plataformas como Salesforce consolidan cuentas de clientes duplicadas uniendo registros mediante grafos de componentes conexos.
2. **Motores de Búsqueda (Elasticsearch):** Expansion de consultas sobre grafos sinonimos (*synsets*).

## Casos Límite y Robustez en Producción

1. **Ciclos de Sinónimos:** El flag `visited = true` evita bucles infinitos en grafos ciclicos (`A=B, B=C, C=A`).
