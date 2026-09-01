---
title: "Agrupar Anagramas: Agrupamiento de Anagramas mediante Claves Canónicas (CTCI 10.2)"
description: "Ordena un arreglo de cadenas de texto para que todos los anagramas queden contiguos usando agrupacion por hash de caracteres en tiempo O(N * K log K)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-2-group-anagrams.webp
previewImage: /assets/images/ctci-10-2-group-anagrams.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para ordenar un arreglo de cadenas de texto de tal forma que todos los anagramas aparezcan juntos.
> * **La Solución Óptima:** Agrupamiento por Clave Canónica Hash: (1) Los anagramas comparten la misma firma al ordenar sus caracteres (ej. `"roma"`, `"amor"`, `"mora"` se ordenan como `"amor"`); (2) Agrupa cada palabra en un `HashMap<String, List<String>>` donde la clave es la cadena ordenada; (3) Vuelca los valores del mapa en el arreglo original; (4) Se ejecuta en **tiempo $O(N \cdot K \log K)$** y **espacio $O(N \cdot K)$**.
> * **Realidad en Producción:** Sugerencias de correccion ortografica en motores de busqueda y agrupacion de codones geneticos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.2), se nos plantea:

*"Reorganiza un arreglo de cadenas para que todos los anagramas se ubiquen en posiciones contiguas."*

## 2. Enfoque por Tabla Hash Canónica

Ordenar con un `Comparator` personalizado requiere $O(N \log N \cdot K \log K)$.

Al emplear una tabla hash indexada por la representacion ordenada de cada palabra, se realiza una sola pasada sobre el arreglo ($N$ ordenamientos de longitud $K$), reduciendo el tiempo a **$O(N \cdot K \log K)$**.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GroupAnagrams {
    /**
     * Agrupa anagramas en posiciones contiguas.
     * Complejidad Temporal: O(N * K log K)
     * Complejidad Espacial: O(N * K)
     */
    public static void sort(String[] array) {
        Map<String, List<String>> mapList = new HashMap<>();

        for (String s : array) {
            String key = sortChars(s);
            mapList.putIfAbsent(key, new ArrayList<>());
            mapList.get(key).add(s);
        }

        int index = 0;
        for (String key : mapList.keySet()) {
            List<String> list = mapList.get(key);
            for (String t : list) {
                array[index] = t;
                index++;
            }
        }
    }

    private static String sortChars(String s) {
        char[] content = s.toCharArray();
        Arrays.sort(content);
        return new String(content);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N * K log K)` | $N$ cadenas de longitud maxima $K$ ordenadas individualmente. |
| Espacio Auxiliar | `O(N * K)` | Mapa hash con listas de palabras agrupadas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Índices Léxicos

1. **Sugerencias de Búsqueda:** Diccionarios invertidos agrupan errores tipograficos por permutaciones de caracteres para sugerir consultas alternativas.
2. **Genómica:** Deteccion de variantes de secuencias de nucleotidos en lecturas cortas.

## Casos Límite y Robustez en Producción

1. **Cadenas Vacías o de 1 Carácter:** Se agrupan correctamente en sus respectivas claves.
2. **Sensibilidad a Mayúsculas:** Tratado de forma uniforme preservando caracteres originales.
