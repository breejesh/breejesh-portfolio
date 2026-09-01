---
title: "Transformador de Palabras: BFS Bidireccional en Grafo Implícito de Palabras (CTCI 17.22)"
description: "Encuentra la secuencia de transformacion mas corta entre dos palabras, cambiando un caracter a la vez con cada palabra intermedia en el diccionario, usando BFS bidireccional en O(N * L^2) tiempo."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-22-word-transformer.webp
previewImage: /assets/images/ctci-17-22-word-transformer.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una palabra origen, una destino y un diccionario, halla la secuencia mas corta de transformaciones donde cada paso difiere en exactamente un caracter y toda palabra intermedia pertenece al diccionario.
> * **La Solución Óptima:** **BFS Bidireccional en Grafo Implícito de Palabras**:
>   1. Construir un mapa de patrones comodin: para cada palabra, generar todos los patrones con un `*` sustituyendo una letra.
>   2. Ejecutar **BFS desde origen y destino** simultaneamente. La busqueda termina cuando los dos frentes se intersectan.
>   3. El BFS bidireccional reduce el espacio de estados de $O(b^d)$ a $O(2 \cdot b^{d/2})$.
>   4. Tiempo: **$O(N \cdot L^2)$**, Espacio: **$O(N \cdot L)$**.
> * **Realidad en Producción:** Motores de sugerencias de corrector ortografico y recuperacion de rutas en grafos de conocimiento.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.22), se nos plantea:

*"Dada una palabra origen y una destino, encuentra la secuencia de transformacion mas corta donde palabras consecutivas difieren en exactamente un caracter y todas las palabras intermedias estan en el diccionario."*

## 2. Mapa de Patrones Comodín y BFS

El mapa de patrones comodín (`"hit" → {"*it", "h*t", "hi*"}`) construye implícitamente el grafo de adyacencia sin recorrer el diccionario para cada nuevo estado.

## Implementación de Producción

```java
import java.util.*;

public class WordTransformer {

    public static List<String> transform(String start, String stop, Set<String> dictionary) {
        if (!dictionary.contains(stop)) return null;

        Map<String, List<String>> wildcardMap = buildWildcardMap(dictionary);
        BFSData sourceData = new BFSData(start);
        BFSData destData   = new BFSData(stop);

        while (!sourceData.toVisit.isEmpty() && !destData.toVisit.isEmpty()) {
            String collision = extendBFS(sourceData, destData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
            collision = extendBFS(destData, sourceData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
        }
        return null;
    }

    private static Map<String, List<String>> buildWildcardMap(Set<String> dict) {
        Map<String, List<String>> map = new HashMap<>();
        for (String word : dict) {
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                map.computeIfAbsent(pattern, k -> new ArrayList<>()).add(word);
            }
        }
        return map;
    }

    static class BFSData {
        Queue<String> toVisit = new LinkedList<>();
        Map<String, String> visited = new HashMap<>();
        BFSData(String start) { toVisit.add(start); visited.put(start, null); }
    }

    private static String extendBFS(BFSData primary, BFSData other, Map<String, List<String>> map) {
        int count = primary.toVisit.size();
        while (count-- > 0) {
            String word = primary.toVisit.poll();
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                for (String neighbor : map.getOrDefault(pattern, Collections.emptyList())) {
                    if (!primary.visited.containsKey(neighbor)) {
                        primary.visited.put(neighbor, word);
                        primary.toVisit.add(neighbor);
                    }
                    if (other.visited.containsKey(neighbor)) return neighbor;
                }
            }
        }
        return null;
    }

    private static List<String> mergePaths(BFSData src, BFSData dst, String collision) {
        LinkedList<String> pathSrc = new LinkedList<>();
        String curr = collision;
        while (curr != null) { pathSrc.addFirst(curr); curr = src.visited.get(curr); }
        List<String> pathDst = new ArrayList<>();
        curr = dst.visited.get(collision);
        while (curr != null) { pathDst.add(curr); curr = dst.visited.get(curr); }
        pathSrc.addAll(pathDst);
        return pathSrc;
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad Temporal | Detalle |
|---|---|---|
| Construccion del Mapa Comodin | $O(N \cdot L)$ | N palabras, L patrones por palabra. |
| BFS Bidireccional | $O(N \cdot L^2)$ | Generacion de patrones por vecino visitado. |
| **Total** | **$O(N \cdot L^2)$** | **Optimo para grafo implícito de palabras.** |

## Discusión de Ingeniería de Sistemas en Producción

1. **Correctores Ortograficos:** El vecindario de distancia de Levenshtein-1 es exactamente el grafo de patrones comodín.
2. **Recuperacion de Rutas en Grafos de Conocimiento:** BFS por capas en transformaciones semanticas de distancia-1 entre entidades.

## Casos Límite y Robustez

1. **Destino No en Diccionario:** Retorna `null` inmediatamente.
2. **Origen = Destino:** Retorna lista de un elemento.
