---
title: "Permutaciones con Duplicados: Permutaciones Únicas de Caracteres Repetidos (CTCI 8.8)"
description: "Calcula todas las permutaciones unicas de una cadena con caracteres duplicados mediante backtracking con tablas de frecuencia en tiempo O(N * N! / (n1!...))."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para calcular todas las permutaciones de una cadena cuyos caracteres no son necesariamente unicos. La lista no debe contener duplicados.
> * **La Solución Óptima:** Backtracking con Tabla de Frecuencias: (1) Construye un mapa de frecuencias `Map<Character, Integer>`; (2) En cada posicion recursiva, ramifica **solo una vez** por cada caracter unico disponible; (3) Decrementa su contador, desciende en la recursion y restaura el valor al regresar (backtrack); (4) Genera $\frac{N!}{n_1! \dots n_k!}$ permutaciones en tiempo optimo sin crear duplicados intermedios.
> * **Realidad en Producción:** Ensamblaje genómico de k-meros y optimizacion de consultas en bases de datos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.8), se nos plantea:

*"Genera todas las permutaciones unicas de una cadena con caracteres repetidos sin generar ramas duplicadas."*

## 2. Poda mediante Tablas de Frecuencia

Generar $N!$ permutaciones y filtrarlas con un `HashSet` desperdicia tiempo exponencial.

### Enfoque Óptimo: Frecuencias
Para `"aab"` $\to \{'a': 2, 'b': 1\}$:
1. Elegir `'a'` como primer caracter $\implies$ genera `["aab", "aba"]`.
2. Elegir `'b'` como primer caracter $\implies$ genera `["baa"]`.
Total $= 3$ permutaciones unicas generadas directamente.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {
    /**
     * Calcula permutaciones unicas para cadenas con caracteres duplicados.
     * Complejidad Temporal: O(N * (N! / (n1! * n2! * ... * nk!)))
     * Complejidad Espacial: O(N)
     */
    public static List<String> printPerms(String s) {
        List<String> result = new ArrayList<>();
        Map<Character, Integer> map = buildFreqTable(s);
        printPermsHelper(map, "", s.length(), result);
        return result;
    }

    private static Map<Character, Integer> buildFreqTable(String s) {
        Map<Character, Integer> map = new HashMap<>();
        for (char c : s.toCharArray()) {
            map.put(c, map.getOrDefault(c, 0) + 1);
        }
        return map;
    }

    private static void printPermsHelper(Map<Character, Integer> map, String prefix,
                                         int remaining, List<String> result) {
        if (remaining == 0) {
            result.add(prefix);
            return;
        }

        for (Character c : map.keySet()) {
            int count = map.get(c);
            if (count > 0) {
                map.put(c, count - 1);
                printPermsHelper(map, prefix + c, remaining - 1, result);
                map.put(c, count);
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | $O\left(\frac{N!}{n_1! \dots n_k!} \cdot N\right)$ | Exactamente el coeficiente multinomial de cadenas unicas. |
| Espacio Auxiliar | `O(N)` | Pila de llamadas acotada por la longitud $N$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Permutaciones de Multiconjuntos

1. **Ensamblaje Genómico (ADN):** Reconstruccion de grafos de de Bruijn a partir de fragmentos de k-meros repetidos.
2. **Reordenamiento de Predicados SQL:** Evaluacion de planes de ejecucion evitando duplicacion de subarboles identicos.

## Casos Límite y Robustez en Producción

1. **Todos los caracteres iguales (`"aaaa"`):** Genera exactamente 1 cadena en tiempo lineal.
2. **Sin duplicados:** Degenera en $N!$ permutaciones.
