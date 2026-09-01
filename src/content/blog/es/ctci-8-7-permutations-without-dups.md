---
title: "Permutaciones sin Duplicados: Generación de Permutaciones de Caracteres Únicos (CTCI 8.7)"
description: "Calcula las N! permutaciones de una cadena de caracteres unicos mediante insercion recursiva en tiempo optimo O(N! * N) y espacio O(N! * N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-7-permutations-without-dups.webp
previewImage: /assets/images/ctci-8-7-permutations-without-dups.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para calcular todas las permutaciones de una cadena de caracteres unicos.
> * **La Solución Óptima:** Insercion Recursiva: (1) Caso base para `""` es `[""]`; (2) Extrae el primer caracter $c = S[0]$ y calcula recursivamente las $(N-1)!$ permutaciones del resto; (3) Inserta $c$ en cada posicion $0 \dots |palabra|$ de cada sub-permutacion; (4) Total $N!$ cadenas en **$O(N! \cdot N)$ tiempo** y **$O(N! \cdot N)$ memoria**.
> * **Realidad en Producción:** Generadores de matrices de prueba combinatoria y resolutores de anagramas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.7), se nos plantea:

*"Escribe un metodo para calcular todas las permutaciones de una cadena de caracteres unicos."*

## 2. Algoritmo de Inserción Recursiva

Para $S = \text{"abc"}$:
1. Permutaciones de `"c"`: `["c"]`.
2. Insertar `'b'` en `"c"`: `["bc", "cb"]`.
3. Insertar `'a'` en `"bc"` y `"cb"`:
   * En `"bc"`: `"abc"`, `"bac"`, `"bca"`.
   * En `"cb"`: `"acb"`, `"cab"`, `"cba"`.
   * Total = $3! = 6$ permutaciones.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsWithoutDups {
    /**
     * Calcula todas las permutaciones de caracteres unicos.
     * Complejidad Temporal: O(N! * N)
     * Complejidad Espacial: O(N! * N)
     */
    public static List<String> getPerms(String str) {
        if (str == null) return null;
        List<String> permutations = new ArrayList<>();

        if (str.length() == 0) {
            permutations.add("");
            return permutations;
        }

        char first = str.charAt(0);
        String remainder = str.substring(1);
        List<String> words = getPerms(remainder);

        for (String word : words) {
            for (int j = 0; j <= word.length(); j++) {
                String s = insertCharAt(word, first, j);
                permutations.add(s);
            }
        }

        return permutations;
    }

    private static String insertCharAt(String word, char c, int i) {
        String start = word.substring(0, i);
        String end = word.substring(i);
        return start + c + end;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N! * N)` | Genera $N!$ cadenas, requiriendo $O(N)$ para construir cada una. |
| Espacio Auxiliar | `O(N! * N)` | Almacenamiento de todas las cadenas permutadas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Pruebas Combinatorias

1. **Generación de Casos de Prueba (Matrices Ortogonales):** Produce permutaciones de configuraciones para verificar aislamiento de funciones.
2. **Generadores de Diccionarios Criptográficos:** Evaluacion paralela de claves de prueba.

## Casos Límite y Robustez en Producción

1. **Cadena Vacía:** Retorna `[""]`.
2. **Cadena de 1 Carácter:** Retorna `["a"]`.
