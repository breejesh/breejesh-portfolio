---
title: "Palabra Más Larga: Descomposición Recursiva de Cadenas Compuestas (CTCI 17.15)"
description: "Encuentra la palabra mas larga formada por concatenacion de otras palabras en un diccionario utilizando ordenacion por longitud y division de prefijos en O(N · L^2)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-15-longest-word.webp
previewImage: /assets/images/ctci-17-15-longest-word.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una lista de palabras, encuentra la palabra mas larga que pueda formarse concatenando otras palabras de la lista.
> * **La Solución Óptima:** **Ordenación por Longitud Descendente + División Recursiva Memorizada**:
>   1. **Ordenar por Longitud**: Ordenar las palabras de mayor a menor longitud.
>   2. **Mapa de Memorización**: Almacenar las palabras en `Map<String, Boolean>`.
>   3. **División Recursiva**: Para cada palabra, iterar los posibles puntos de corte $i \in [1, \text{longitud}-1]$:
>      * Verificar si el prefijo izquierdo existe en el diccionario Y la llamada recursiva sobre el sufijo derecho retorna `true`.
>   4. La primera palabra en orden descendente que retorne `true` es por definicion la palabra compuesta mas larga.
>   5. Se ejecuta en **tiempo $O(N \log N + N \cdot L^2)$** y **espacio $O(N \cdot L)$**.
> * **Realidad en Producción:** Descomposicion de palabras compuestas en aleman (*Decompounding* en Apache Lucene) y deteccion de URLs maliciosas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.15), se nos plantea:

*"Identifica la palabra de maxima extension que pueda construirse mediante la union de dos o mas palabras de la misma coleccion."*

## 2. Partición Recursiva y Memorización

La ordenacion previa permite retornar de inmediato en cuanto se detecta la primera palabra compuesta valida.

## Implementación de Producción

```java
import java.util.*;

public class LongestWord {

    public static String printLongestWord(String[] list) {
        if (list == null || list.length == 0) return "";

        Arrays.sort(list, (a, b) -> Integer.compare(b.length(), a.length()));

        Map<String, Boolean> map = new HashMap<>();
        for (String w : list) {
            map.put(w, true);
        }

        for (String w : list) {
            if (canBuildWord(w, true, map)) {
                return w;
            }
        }

        return "";
    }

    private static boolean canBuildWord(String str, boolean isOriginalWord, Map<String, Boolean> map) {
        if (map.containsKey(str) && !isOriginalWord) {
            return map.get(str);
        }

        for (int i = 1; i < str.length(); i++) {
            String left = str.substring(0, i);
            String right = str.substring(i);

            if (map.containsKey(left) && map.get(left) && canBuildWord(right, false, map)) {
                map.put(str, true);
                return true;
            }
        }

        map.put(str, false);
        return false;
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad Temporal | Espacio Auxiliar | Salida Anticipada |
|---|---|---|---|
| **Ordenación** | $O(N \log N)$ | $O(1)$ | Longitud descendente |
| **Búsqueda Recursiva** | **$O(N \cdot L^2)$** | **$O(N \cdot L)$** | **Inmediata en la primera coincidencia** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Análisis Léxico en Lucene

1. **Filtros de Descomposición (Lucene Decompounder):** Los analizadores linguisticos dividen sustantivos compuestos complejos en idiomas germanicos en lemas componentes.
2. **Ciberseguridad:** Deteccion de ataques de typosquatting analizando combinaciones de nombres de marcas en URLs.

## Casos Límite y Robustez en Producción

1. **Sin Palabras Compuestas:** Retorna cadena vacia `""`.
2. **Trampa de Auto-coincidencia:** El parametro booleano `isOriginalWord` impide que una palabra se valide a si misma.
