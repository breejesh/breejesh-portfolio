---
title: "Distancia entre Palabras: Índice Invertido Posicional y Búsqueda con Dos Punteros (CTCI 17.11)"
description: "Calcula la distancia minima entre dos palabras en un documento mediante escaneo lineal O(N) e indices invertidos posicionales con dos punteros en tiempo O(A + B)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-11-word-distance.webp
previewImage: /assets/images/ctci-17-11-word-distance.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un archivo de texto grande, encuentra la distancia mas corta (en numero de palabras) entre dos palabras. Si la operacion se repetira muchas veces con diferentes pares de palabras, optimiza la estructura.
> * **La Solución Óptima:**
>   1. **Consulta Única (Escaneo Lineal)**:
>      * Recorrer el array actualizando `lastPos1` y `lastPos2`. Actualizar la distancia minima en cada encuentro en tiempo $O(N)$ y espacio $O(1)$.
>   2. **Consultas Repetidas (Índice Invertido Posicional)**:
>      * Precomputar un mapa `Map<String, List<Integer>>` con las posiciones ordenadas de cada palabra.
>      * Para cualquier par $(W_1, W_2)$, converger dos punteros $p_1$ y $p_2$ sobre las listas en tiempo **$O(|L_1| + |L_2|)$**.
> * **Realidad en Producción:** Consultas de proximidad en Elasticsearch (`SPAN_NEAR`) y listas de publicacion posicionales en Apache Lucene.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.11), se nos plantea:

*"Halla la separacion minima entre dos palabras en un texto, admitiendo consultas aisladas o consultas recurrentes de alta frecuencia."*

## 2. Convergencia con Dos Punteros

Al almacenar las posiciones en listas ordenadas, dos punteros avanzan linealmente comparando distancias absolutas en tiempo proporcional a la suma de sus longitudes.

## Implementación de Producción

```java
import java.util.*;

public class WordDistance {

    public static int findClosestSingleQuery(String[] words, String word1, String word2) {
        if (words == null || word1 == null || word2 == null) return -1;

        int lastPos1 = -1, lastPos2 = -1;
        int minDistance = Integer.MAX_VALUE;

        for (int i = 0; i < words.length; i++) {
            if (words[i].equals(word1)) {
                lastPos1 = i;
                if (lastPos2 >= 0) minDistance = Math.min(minDistance, lastPos1 - lastPos2);
            } else if (words[i].equals(word2)) {
                lastPos2 = i;
                if (lastPos1 >= 0) minDistance = Math.min(minDistance, lastPos2 - lastPos1);
            }
        }

        return (minDistance == Integer.MAX_VALUE) ? -1 : minDistance;
    }

    public static class WordDistanceMap {
        private final Map<String, List<Integer>> locations = new HashMap<>();

        public WordDistanceMap(String[] words) {
            for (int i = 0; i < words.length; i++) {
                locations.computeIfAbsent(words[i].toLowerCase(), k -> new ArrayList<>()).add(i);
            }
        }

        public int distance(String word1, String word2) {
            List<Integer> list1 = locations.get(word1.toLowerCase());
            List<Integer> list2 = locations.get(word2.toLowerCase());

            if (list1 == null || list2 == null || list1.isEmpty() || list2.isEmpty()) {
                return -1;
            }

            int p1 = 0, p2 = 0;
            int minDistance = Integer.MAX_VALUE;

            while (p1 < list1.size() && p2 < list2.size()) {
                int pos1 = list1.get(p1);
                int pos2 = list2.get(p2);

                minDistance = Math.min(minDistance, Math.abs(pos1 - pos2));
                if (minDistance == 1) return 1;

                if (pos1 < pos2) {
                    p1++;
                } else {
                    p2++;
                }
            }

            return minDistance;
        }
    }
}
```

## Análisis de Complejidad

| Modalidad | Preprocesamiento | Tiempo de Consulta | Espacio Auxiliar |
|---|---|---|---|
| **Escaneo Único** | $O(0)$ | **$O(N)$** | **$O(1)$** |
| **Índice Invertido Posicional** | $O(N)$ | **$O(|L_1| + |L_2|)$** | **$O(N)$** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Búsqueda (Lucene)

1. **Listas Posicionales (`.pos`):** Los motores de busqueda almacenan los desplazamientos de palabras en archivos indexados para resolver busquedas de frases exactas de forma instantanea.
2. **Bioinformática:** Calculo de distancias entre factores de transcripcion en secuencias de ADN.

## Casos Límite y Robustez en Producción

1. **Palabra Inexistente:** Retorna `-1` de forma segura.
2. **Palabras Adyacentes:** Retorna `1` de inmediato sin recorrer el resto de las listas.
