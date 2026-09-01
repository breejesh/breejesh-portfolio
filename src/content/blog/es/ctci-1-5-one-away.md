---
title: "A una Edición: Determinar si dos Cadenas están a Distancia de Edición Uno (CTCI 1.5)"
description: "Implementa un algoritmo para verificar si dos cadenas están a cero o una operación de edición (inserción, eliminación o sustitución) en O(N) tiempo y O(1) espacio."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-5-one-away.webp
previewImage: /assets/images/ctci-1-5-one-away.webp
---

> **TL;DR**
> * **El Problema del Libro:** Existen tres tipos de ediciones que se pueden realizar en cadenas: insertar un carácter, eliminar un carácter o reemplazar un carácter. Dadas dos cadenas, escribe una función para comprobar si están a una edición (o cero ediciones) de distancia.
> * **La Solución Óptima:** Compara las longitudes. Si $|long_1 - long_2| > 1$, retorna falso inmediatamente. Para longitudes iguales, comprueba a lo sumo un reemplazo; para diferencia de longitud 1, comprueba a lo sumo una inserción/eliminación con dos punteros en tiempo $O(N)$ y espacio auxiliar $O(1)$.
> * **Realidad en Producción:** Tolerancia a erratas en motores de búsqueda (distancia Levenshtein), mutaciones puntuales de secuencias de ADN y sugerencias en terminales de línea de comandos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 1.5), se nos plantea:

*"Existen tres tipos de ediciones que se pueden realizar en cadenas: insertar un carácter, eliminar un carácter o reemplazar un carácter. Dadas dos cadenas, escribe una función para comprobar si están a una edición (o cero ediciones) de distancia."*

**Casos de prueba de ejemplo:**
* `pale, ple -> true` (eliminación / inserción de 'a')
* `pales, pale -> true` (inserción / eliminación de 's')
* `pale, bale -> true` (reemplazo de 'p' por 'b')
* `pale, bake -> false` (dos reemplazos: 'p'->'b' y 'l'->'k')

## 2. Enfoque Ingenuo e Ineficiencias

Un enfoque ingenuo calcularía la matriz completa de Distancia de Levenshtein mediante programación dinámica:
* **Complejidad Temporal:** $O(N \times M)$ donde $N$ y $M$ son las longitudes de las cadenas.
* **Complejidad Espacial:** $O(N \times M)$ de espacio auxiliar.

Calcular toda la matriz de programación dinámica es innecesario cuando solo nos interesa validar si la distancia de edición es $\le 1$. Podemos realizar la comparación en una sola pasada lineal.

## 3. Mecánica Algorítmica Óptima

Podemos resolver el problema mediante dos punteros:

### Escaneo Combinado en una Pasada
Fusionamos las comprobaciones en un único bucle con dos punteros `index1` e `index2`:
1. Iteramos mientras ambos punteros estén dentro de los límites.
2. Al encontrar una discrepancia:
   * Si `foundDifference` ya es `true`, retornamos `false`.
   * Marcamos `foundDifference = true`.
   * Si las longitudes son iguales, avanzamos ambos punteros (caso de reemplazo).
   * Si las longitudes difieren, avanzamos únicamente el puntero de la cadena más larga (caso de inserción).
3. Si el bucle finaliza sin violaciones, retornamos `true`.

## Implementación de Producción

```java
public class OneAway {
    /**
     * Comprueba si dos cadenas estan a cero o una edicion de distancia.
     * Complejidad Temporal: O(N) donde N es la longitud de la cadena mas corta.
     * Complejidad Espacial: O(1) espacio auxiliar.
     */
    public static boolean oneEditAway(String first, String second) {
        if (Math.abs(first.length() - second.length()) > 1) {
            return false;
        }

        // Identificar cadena corta y larga
        String s1 = first.length() < second.length() ? first : second;
        String s2 = first.length() < second.length() ? second : first;

        int index1 = 0;
        int index2 = 0;
        boolean foundDifference = false;

        while (index2 < s2.length() && index1 < s1.length()) {
            if (s1.charAt(index1) != s2.charAt(index2)) {
                if (foundDifference) return false;
                foundDifference = true;

                if (s1.length() == s2.length()) {
                    index1++;
                }
            } else {
                index1++;
            }
            index2++;
        }

        return true;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Recorre las cadenas en una sola pasada donde $N = \min(|first|, |second|)$. |
| Espacio Auxiliar | `O(1)` | Utiliza registros de punteros enteros sin asignaciones en el heap. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura en Producción: Búsqueda Difusa y Autocompletado

1. **Autocompletado de Búsqueda y Tolerancia a Erratas (Elasticsearch / Lucene):** Lucene construye autómatas de Levenshtein para comparar consultas contra términos de índice con distancia máxima 1 o 2.
2. **Corrección Ortográfica en CLI / Git:** Al escribir `git stauts`, git busca comandos candidatos a distancia 1 para sugerir `git status`.
3. **Bioinformática y Mutaciones Genómicas:** Detección de polimorfismos de nucleótido único (SNPs) en secuencias genómicas.

## Casos Límite y Robustez en Producción

1. **Cadenas idénticas (`"pale", "pale"`):** Retorna `true` (cero ediciones).
2. **Cadenas vacías (`"", ""`):** Retorna `true`.
3. **Diferencia de longitud $\ge 2$ (`"p", "pale"`):** Finaliza en $O(1)$ sin escanear cadenas.
4. **Entradas nulas:** Comprobación defensiva `if (first == null || second == null) return false;`.
