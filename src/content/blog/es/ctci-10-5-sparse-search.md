---
title: "Búsqueda Dispersa: Búsqueda Binaria en Arreglos con Cadenas Vacías (CTCI 10.5)"
description: "Encuentra la ubicacion de una cadena en un arreglo ordenado intercalado con cadenas vacias usando busqueda binaria con punteros expansivos en tiempo O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un arreglo ordenado de cadenas de texto intercalado con cadenas vacias (`""`), escribe un metodo para encontrar la posicion de una cadena dada.
> * **La Solución Óptima:** Búsqueda Binaria con Expansión de Punteros: (1) Calcula `mid = (first + last) / 2`; (2) Si `strings[mid]` esta vacia `""`, expande dos punteros (`left = mid - 1` y `right = mid + 1`) hacia afuera hasta encontrar la cadena no vacia mas cercana; (3) Si todo el rango esta vacio, termina la busqueda; (4) Compara la cadena no vacia y procede con la busqueda binaria; (5) Se ejecuta en **tiempo promedio $O(\log N)$** y peor caso $O(N)$.
> * **Realidad en Producción:** Busqueda en tablas con registros eliminados (tombstones) en RocksDB y columnas dispersas en formatos Parquet.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.5), se nos plantea:

*"Encuentra el indice de una cadena en un arreglo ordenado que contiene multiples cadenas vacias intermedias."*

**Ejemplo:**
`find("ball", {"at", "", "", "", "ball", "", "", "car", "", "", "dad", "", ""})` $\to 4$

## 2. Ajuste del Punto Medio

Cuando `strings[mid]` es `""`, no es posible saber hacia que lado bifurcar.

Expandiendo dos punteros hacia los extremos se localiza la cadena valida mas cercana para definir el nuevo punto medio.

## Implementación de Producción

```java
public class SparseSearch {
    /**
     * Busca la cadena str en el arreglo disperso.
     * Complejidad Temporal: O(log N) promedio, O(N) peor caso.
     * Complejidad Espacial: O(log N)
     */
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) {
            return -1;
        }
        return searchHelper(strings, str, 0, strings.length - 1);
    }

    private static int searchHelper(String[] strings, String str, int first, int last) {
        if (first > last) return -1;

        int mid = (last + first) / 2;

        if (strings[mid].isEmpty()) {
            int left = mid - 1;
            int right = mid + 1;

            while (true) {
                if (left < first && right > last) {
                    return -1;
                } else if (right <= last && !strings[right].isEmpty()) {
                    mid = right;
                    break;
                } else if (left >= first && !strings[left].isEmpty()) {
                    mid = left;
                    break;
                }
                left--;
                right++;
            }
        }

        if (str.equals(strings[mid])) {
            return mid;
        } else if (strings[mid].compareTo(str) < 0) {
            return searchHelper(strings, str, mid + 1, last);
        } else {
            return searchHelper(strings, str, first, mid - 1);
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Caso | Complejidad Temporal | Espacio Auxiliar | Detalle Técnico |
|---|---|---|---|
| Caso Promedio (Cadenas Distribuidas) | `O(log N)` | `O(log N)` | La busqueda de la cadena no vacia toma $O(1)$ pasos amortizados. |
| Peor Caso (Casi Todo Vacío) | `O(N)` | `O(log N)` | Los punteros recorren el arreglo entero. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Tombstones en Motores LSM

1. **Registros Lápida (Tombstones en Cassandra):** Los registros eliminados permanecen como huecos vacios hasta la compactacion; los algoritmos de busqueda dispersa navegan por los indices sin requerir reconstrucciones continuas.
2. **Columnas Nulas en Parquet:** Indexacion eficiente de campos altamente dispersos.

## Casos Límite y Robustez en Producción

1. **Cadena Buscada Vacía:** Retorna `-1` de inmediato.
2. **Arreglo Exclusivamente de Cadenas Vacías:** Detecta limites y retorna `-1`.
