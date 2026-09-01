---
title: "Frecuencia de Palabras: Índices Invertidos y Preprocesamiento con Hash (CTCI 16.2)"
description: "Disena algoritmos optimizados para calcular frecuencias de palabras en libros para consultas unicas y repetitivas usando HashMaps e indices invertidos."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un metodo para encontrar la frecuencia de aparicion de cualquier palabra en un libro. ¿Que cambiarias si fueras a ejecutar este algoritmo multiples veces?
> * **Las Soluciones Óptimas:**
>   1. **Consulta Única**: Recorrer el libro una sola vez en **tiempo $O(N)$** y **espacio $O(1)$**, normalizando mayusculas y puntuacion.
>   2. **Consultas Repetitivas**: Preprocesar el texto completo en una tabla `HashMap<String, Integer>`.
>      * Preprocesamiento: **$O(N)$ tiempo**, **$O(U)$ espacio** ($U = \text{vocabulario unico}$).
>      * Tiempo de Consulta: **$O(1)$ amortizado**.
> * **Realidad en Producción:** Motores de busqueda de texto completo (Apache Lucene, Elasticsearch).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.2), se nos plantea:

*"Determina la frecuencia de una palabra en un texto, optimizando para consultas unicas versus cargas de trabajo con millones de busquedas repetitivas."*

## 2. Consulta Única vs Diccionario Precalculado

* **Modo Consulta Única:** Escaneo secuencial para evitar consumo de memoria adicional.
* **Modo Multi-Consulta:** Construccion de un indice hash en memoria para responder en tiempo constante $O(1)$.

## Implementación de Producción

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class WordFrequencyAnalyzer {
    private final Map<String, Integer> frequencyMap;

    public WordFrequencyAnalyzer(String[] book) {
        this.frequencyMap = buildDictionary(book);
    }

    private Map<String, Integer> buildDictionary(String[] book) {
        if (book == null) return Collections.emptyMap();
        Map<String, Integer> map = new HashMap<>();

        for (String word : book) {
            if (word == null) continue;
            String normalized = normalize(word);
            if (!normalized.isEmpty()) {
                map.put(normalized, map.getOrDefault(normalized, 0) + 1);
            }
        }
        return map;
    }

    public int getFrequency(String word) {
        if (word == null) return 0;
        return frequencyMap.getOrDefault(normalize(word), 0);
    }

    private static String normalize(String word) {
        return word.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
```

## Análisis de Complejidad

| Escenario | Tiempo Preprocesamiento | Espacio Auxiliar | Tiempo por Consulta |
|---|---|---|---|
| **Consulta Única** | $0$ | $O(1)$ | $O(N)$ |
| **$Q$ Consultas Repetidas** | $O(N)$ | $O(U)$ | **$O(1)$** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Índices Invertidos en Elasticsearch

1. **Diccionario de Términos y Posting Lists:** Los motores de busqueda almacenan listas de apariciones comprimidas (`Term -> [DocID, TF]`) para evaluar relevancia (TF-IDF / BM25).
2. **Normalización y Stemming:** Eliminacion de palabras vacias (*stop words*) y reduccion a la raiz lexica (*stemming*).

## Casos Límite y Robustez en Producción

1. **Signos de Puntuación:** Normalizacion con expresiones regulares para evitar contabilizar erróneamente `"palabra,"` y `"palabra."` como terminos distintos.
