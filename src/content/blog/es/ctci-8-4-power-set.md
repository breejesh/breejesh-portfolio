---
title: "Conjunto Potencia: Generación de Todos los Subconjuntos de un Conjunto (CTCI 8.4)"
description: "Genera todos los 2^N subconjuntos de un conjunto mediante recursion combinatoria y mascaras de bits en tiempo O(N * 2^N) y espacio O(N * 2^N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para retornar todos los subconjuntos de un conjunto.
> * **La Solución Óptima:** Duplicacion Combinatoria / Mascaras Binarias: (1) **Enfoque Recursivo**: Clona los subconjuntos del conjunto reducido y anade el nuevo elemento; (2) **Enfoque de Mascaras Binarias**: Itera $k$ desde $0$ hasta $2^N - 1$, donde el bit $i$ de $k$ determina la inclusion del elemento $i$. Ambos operan en tiempo optimo $O(N \cdot 2^N)$ y espacio $O(N \cdot 2^N)$.
> * **Realidad en Producción:** Seleccion de caracteristicas en aprendizaje automatico y optimizadores de consultas SQL.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.4), se nos plantea:

*"Escribe un metodo para generar todos los subconjuntos de un conjunto dado."*

## 2. Enfoques Algorítmicos

1. **Recursión Combinatoria:** Obtiene $P(n-1)$, duplica cada subconjunto agregandole el elemento $n$, y los fusiona.
2. **Máscaras de Bits:** Cada entero $k \in [0, 2^n - 1]$ representa una combinacion unica de bits. Si el bit $i$ esta activo en $k$, se incluye el elemento $i$.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSet {
    /**
     * Enfoque mediante Mascaras de Bits.
     * Complejidad Temporal: O(N * 2^N)
     * Complejidad Espacial: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsBitmask(List<Integer> set) {
        List<List<Integer>> allSubsets = new ArrayList<>();
        int max = 1 << set.size(); // 2^N

        for (int k = 0; k < max; k++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < set.size(); i++) {
                if (((k >> i) & 1) == 1) {
                    subset.add(set.get(i));
                }
            }
            allSubsets.add(subset);
        }

        return allSubsets;
    }

    /**
     * Enfoque Recursivo.
     * Complejidad Temporal: O(N * 2^N)
     * Complejidad Espacial: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsRecursive(List<Integer> set, int index) {
        List<List<Integer>> allSubsets;
        if (set.size() == index) {
            allSubsets = new ArrayList<>();
            allSubsets.add(new ArrayList<>());
        } else {
            allSubsets = getSubsetsRecursive(set, index + 1);
            int item = set.get(index);
            List<List<Integer>> moreSubsets = new ArrayList<>();
            for (List<Integer> subset : allSubsets) {
                List<Integer> newSubset = new ArrayList<>(subset);
                newSubset.add(item);
                moreSubsets.add(newSubset);
            }
            allSubsets.addAll(moreSubsets);
        }
        return allSubsets;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N * 2^N)` | Genera $2^N$ subconjuntos, requiriendo en promedio $N / 2$ copias cada uno. |
| Espacio Auxiliar | `O(N * 2^N)` | Memoria para almacenar la totalidad del conjunto potencia. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Selección Combinatoria

1. **Optimizadores de Consultas SQL (System R):** Evaluan los planes de ejecucion de joins sobre el conjunto potencia de tablas involucradas.
2. **Selección de Características (Machine Learning):** Busqueda exhaustiva en subespacios vectoriales.

## Casos Límite y Robustez en Producción

1. **Conjunto Vacío:** Retorna `[[]]` (un subconjunto que es el conjunto vacio).
2. **$N \ge 30$:** Limites de seguridad para evitar desbordamiento de memoria.
