---
title: "Rectángulo de Palabras: DFS con Poda de Trie para la Mayor Cuadrícula Válida de Palabras (CTCI 17.25)"
description: "Encuentra el mayor rectangulo de palabras donde cada fila y columna es una palabra valida usando DFS con poda de Trie para la validacion de prefijos de columna durante la construccion iterativa."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-25-word-rectangle.webp
previewImage: /assets/images/ctci-17-25-word-rectangle.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una lista de millones de palabras, diseña un algoritmo para crear el mayor rectangulo posible de letras donde cada fila sea una palabra de izquierda a derecha y cada columna sea una palabra de arriba a abajo.
> * **La Solución Óptima:** **DFS con Poda de Trie para Busqueda de Rectangulo de Palabras**:
>   1. **Agrupar palabras por longitud** y construir un Trie por grupo.
>   2. **Enumerar dimensiones** (ancho x alto) de mayor a menor area.
>   3. **DFS por Filas**: Colocar iterativamente una palabra como siguiente fila. Tras cada colocacion, **podar columnas** con el Trie para palabras de longitud `alto`. Si algun prefijo de columna es invalido, retroceder inmediatamente.
> * **Realidad en Producción:** Generadores de crucigramas y parseo de reticulados NLP.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.25), se nos plantea:

*"Dada una lista de millones de palabras, crea el mayor rectangulo posible de letras tal que cada fila y columna forme una palabra."*

## 2. Estrategia de Poda de Columnas con Trie

Al verificar si el prefijo de cada columna existe en el Trie de palabras de altura `h`, se eliminan ramas invalidas del arbol DFS antes de explorarlas completamente.

## Implementación de Producción

```java
import java.util.*;

public class WordRectangle {

    public static String[] findLargestRectangle(String[] words) {
        Map<Integer, List<String>> byLen = new HashMap<>();
        int maxLen = 0;
        for (String w : words) {
            byLen.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
            maxLen = Math.max(maxLen, w.length());
        }

        for (int area = maxLen * maxLen; area > 0; area--) {
            for (int width = maxLen; width >= 1; width--) {
                if (area % width != 0) continue;
                int height = area / width;
                if (height > maxLen) continue;
                List<String> widthWords  = byLen.getOrDefault(width, Collections.emptyList());
                List<String> heightWords = byLen.getOrDefault(height, Collections.emptyList());
                if (widthWords.isEmpty() || heightWords.isEmpty()) continue;

                Trie colTrie = new Trie();
                for (String w : heightWords) colTrie.insert(w);

                String[] result = dfs(new String[height], widthWords, colTrie, width, height, 0);
                if (result != null) return result;
            }
        }
        return null;
    }

    static String[] dfs(String[] rect, List<String> words, Trie colTrie, int width, int height, int row) {
        if (row == height) return rect;
        for (String word : words) {
            rect[row] = word;
            if (columnsValid(rect, colTrie, width, row + 1, height)) {
                String[] res = dfs(rect, words, colTrie, width, height, row + 1);
                if (res != null) return res;
            }
        }
        rect[row] = null;
        return null;
    }

    static boolean columnsValid(String[] rect, Trie colTrie, int width, int rowsFilled, int height) {
        for (int c = 0; c < width; c++) {
            StringBuilder col = new StringBuilder();
            for (int r = 0; r < rowsFilled; r++) col.append(rect[r].charAt(c));
            if (rowsFilled == height) { if (!colTrie.contains(col.toString())) return false; }
            else { if (!colTrie.startsWith(col.toString())) return false; }
        }
        return true;
    }

    static class Trie {
        Map<Character, Trie> children = new HashMap<>();
        boolean isEnd;
        void insert(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Trie());
            node.isEnd = true;
        }
        boolean startsWith(String prefix) {
            Trie node = this;
            for (char c : prefix.toCharArray()) { node = node.children.get(c); if (node == null) return false; }
            return true;
        }
        boolean contains(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) { node = node.children.get(c); if (node == null) return false; }
            return node.isEnd;
        }
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad | Detalle |
|---|---|---|
| Agrupacion de Palabras | $O(W)$ | W = total de palabras. |
| Construccion de Trie | $O(W \cdot L)$ | L = longitud maxima. |
| DFS con Poda de Trie | Exponencial en el peor caso, altamente podado | Prefijos invalidos cortan el arbol temprano. |

## Discusión de Ingeniería de Sistemas en Producción

1. **Generacion de Crucigramas:** Los motores comerciales de puzzles usan retroceso con poda de Trie para generar rellenos validos desde corpus de diccionarios.
2. **Parseo de Reticulados NLP:** La propagacion de restricciones en reticulados de palabras aplica poda de prefijos identica a este algoritmo.

## Casos Límite y Robustez

1. **Sin Rectangulo Valido:** Retorna `null`.
2. **Palabras de Un Caracter:** Los rectangulos de ancho/alto 1 se encuentran de forma trivial.
