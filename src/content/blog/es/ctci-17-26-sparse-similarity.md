---
title: "Similitud Dispersa: Índice Invertido para Similitud de Jaccard por Pares de Documentos (CTCI 17.26)"
description: "Calcula la similitud de Jaccard entre pares de documentos que comparten palabras usando un indice invertido para omitir pares sin interseccion en tiempo O(D * W + P)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-26-sparse-similarity.webp
previewImage: /assets/images/ctci-17-26-sparse-similarity.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes una colección de documentos representados como conjuntos de enteros. Calcula la similitud de Jaccard ($\frac{|A \cap B|}{|A \cup B|}$) para todos los pares de documentos con similitud $> 0$.
> * **La Solución Óptima:** **Índice Invertido con Agregación de Intersecciones por Pares**:
>   1. **Construir Índice Invertido**: Mapear cada palabra a la lista de documentos que la contienen: `palabra -> [doc1, doc2, ...]`.
>   2. **Contar Intersecciones**: Para cada palabra, incrementar el contador para cada par de documentos `(docA, docB)` en su lista.
>   3. **Calcular Jaccard**: Para cada par con intersección $> 0$:
>      $$\text{similitud} = \frac{\text{intersección}}{|\text{docA}| + |\text{docB}| - \text{intersección}}$$
>   4. Tiempo: **$O(D \cdot W + P)$**, Espacio: **$O(D \cdot W)$**.
> * **Realidad en Producción:** Listas de posting en Apache Lucene/Elasticsearch y filtrado colaborativo en sistemas de recomendación.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.26), se nos plantea:

*"La similitud de dos documentos es el tamano de su interseccion dividido por la union. Diseña un algoritmo para calcular la similitud de todos los pares con valor mayor que cero."*

## 2. Estrategia de Índice Invertido

En lugar de comparar los $O(D^2)$ pares posibles, el índice invertido solo evalúa los pares que efectivamente comparten al menos una palabra.

## Implementación de Producción

```java
import java.util.*;

public class SparseSimilarity {

    public static class DocPair {
        public final int doc1, doc2;
        public DocPair(int d1, int d2) {
            this.doc1 = Math.min(d1, d2);
            this.doc2 = Math.max(d1, d2);
        }
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DocPair)) return false;
            DocPair p = (DocPair) o;
            return doc1 == p.doc1 && doc2 == p.doc2;
        }
        @Override
        public int hashCode() {
            return Objects.hash(doc1, doc2);
        }
    }

    public static Map<DocPair, Double> computeSimilarities(Map<Integer, int[]> documents) {
        Map<Integer, List<Integer>> invertedIndex = new HashMap<>();
        for (Map.Entry<Integer, int[]> entry : documents.entrySet()) {
            int docId = entry.getKey();
            for (int word : entry.getValue()) {
                invertedIndex.computeIfAbsent(word, k -> new ArrayList<>()).add(docId);
            }
        }

        Map<DocPair, Integer> intersections = new HashMap<>();
        for (List<Integer> docList : invertedIndex.values()) {
            int size = docList.size();
            for (int i = 0; i < size; i++) {
                for (int j = i + 1; j < size; j++) {
                    DocPair pair = new DocPair(docList.get(i), docList.get(j));
                    intersections.merge(pair, 1, Integer::sum);
                }
            }
        }

        Map<DocPair, Double> result = new HashMap<>();
        for (Map.Entry<DocPair, Integer> entry : intersections.entrySet()) {
            DocPair pair = entry.getKey();
            int intersect = entry.getValue();
            int size1 = documents.get(pair.doc1).length;
            int size2 = documents.get(pair.doc2).length;
            double union = size1 + size2 - intersect;
            result.put(pair, intersect / union);
        }

        return result;
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad Temporal | Espacio Auxiliar |
|---|---|---|
| Construcción de Índice Invertido | $O(\sum |D_i|)$ | $O(\sum |D_i|)$ |
| Conteo de Intersecciones | $O(\sum \binom{|L_w|}{2})$ | $O(\text{pares únicos coincidentes})$ |
| Cálculo de Similitud | $O(\text{pares con intersección } > 0)$ | $O(\text{pares con intersección } > 0)$ |
| **Total** | **$O(\sum |D_i| + P)$** | **$O(\sum |D_i|)$** |

## Discusión de Ingeniería de Sistemas en Producción

1. **Motores de Búsqueda (Lucene/Elasticsearch):** Utilizan listas de posting invertidas para calcular puntuaciones de relevancia sin escanear documentos irrelevantes.
2. **Filtrado Colaborativo Ítem a Ítem:** Los motores de recomendación calculan similitudes entre productos invirtiendo el grafo usuario-producto.

## Casos Límite y Robustez

1. **Colección Vacía:** Retorna un mapa vacío.
2. **Sin Palabras Compartidas:** Retorna un mapa vacío sin asignar entradas innecesarias.
3. **Documentos Idénticos:** Calcula correctamente similitud `1.0`.
