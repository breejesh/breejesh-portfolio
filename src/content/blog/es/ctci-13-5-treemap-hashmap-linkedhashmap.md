---
title: "TreeMap vs. HashMap vs. LinkedHashMap: Arquitecturas y Selección en Java (CTCI 13.5)"
description: "Compara HashMap, TreeMap y LinkedHashMap en Java, detallando arboles Rojo-Negro en cubetas, orden de insercion/acceso e implementacion de caches LRU."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
previewImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
---

> **TL;DR**
> * **El Problema del Libro:** Explica las diferencias entre `TreeMap`, `HashMap` y `LinkedHashMap`. Proporciona un ejemplo de cuando utilizar cada una.
> * **Los Tres Paradigmas Fundamentales:**
>   1. **`HashMap`**: Tabla hash con cubetas mediante listas enlazadas y nodos de arbol Rojo-Negro ($\ge 8$ colisiones). **Tiempo promedio $O(1)$**, orden no determinado. Ideal para busquedas rapidas de clave-valor.
>   2. **`TreeMap`**: **Árbol Binario de Búsqueda Rojo-Negro** auto-balanceado (`NavigableMap`). **Tiempo garantizado $O(\log N)$**, estrictamente ordenado por clave. Ideal para consultas de rango (`subMap`) y datos ordenados.
>   3. **`LinkedHashMap`**: `HashMap` complementado con una lista doblemente enlazada. **Tiempo $O(1)$**, mantiene **Orden de Inserción** u **Orden de Acceso**. Ideal para implementar caches LRU mediante `removeEldestEntry()`.
> * **Realidad en Producción:** Caches de sesion (`HashMap`), libros de ordenes bursatiles (`TreeMap`) y bufers acotados LRU (`LinkedHashMap`).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 13.5), se nos plantea:

*"Explica las diferencias arquitectonicas entre TreeMap, HashMap y LinkedHashMap en Java, describiendo sus estructuras de datos, complejidades y casos de uso."*

## 2. Matriz Comparativa de Estructuras

| Dimensión | `HashMap` | `TreeMap` | `LinkedHashMap` |
|---|---|---|---|
| **Estructura Interna** | Tabla hash (Cubetas + TreeBins) | Árbol Rojo-Negro (`NavigableMap`) | Tabla hash + Lista doblemente enlazada |
| **Tiempo de Búsqueda** | $O(1)$ promedio ($O(\log N)$ peor) | $O(\log N)$ garantizado | $O(1)$ promedio |
| **Orden de Claves** | Ninguno (Aleatorio) | Ordenado (`Comparable` / `Comparator`) | Orden de inserción o de acceso |
| **Soporte de Clave Null** | Sí (1 clave nula en cubeta 0) | **No** (Lanza `NullPointerException`) | Sí (1 clave nula) |
| **Uso de Memoria** | Moderado | Moderado (punteros de árbol) | Mayor (punteros hash + lista doble) |

## Implementación de Producción

```java
import java.util.*;

public class MapArchitectureShowcase {

    public static void demonstrateHashMap() {
        Map<String, String> sessionStore = new HashMap<>();
        sessionStore.put("sess_1", "Usuario Alice");
        System.out.println("HashMap: " + sessionStore.get("sess_1"));
    }

    public static void demonstrateTreeMap() {
        NavigableMap<Double, Integer> libroOrdenes = new TreeMap<>(Comparator.reverseOrder());
        libroOrdenes.put(150.50, 100);
        libroOrdenes.put(150.25, 500);

        // Consulta de rango en O(log N)
        Map<Double, Integer> rango = libroOrdenes.subMap(150.50, true, 150.00, true);
        System.out.println("TreeMap Rango: " + rango);
    }

    public static class LRUCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacidad;

        public LRUCache(int cap) {
            super(cap, 0.75f, true); // true activa el seguimiento por orden de acceso
            this.capacidad = cap;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacidad; // Expulsa automaticamente la entrada menos usada
        }
    }
}
```

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Arbolización en Java 8 (JEP 180)

1. **Defensa contra Colisiones Hash:** Cuando una cubeta supera 8 elementos, se convierte en un arbol Rojo-Negro, limitando el peor caso a $O(\log N)$ en lugar de $O(N)$.
2. **Reordenación por Acceso:** En `LinkedHashMap` con `accessOrder = true`, cada `get(key)` mueve el nodo al final de la lista enlazada en $O(1)$.

## Casos Límite y Robustez en Producción

1. **Concurrencia:** Ninguno de los tres es seguro para hilos. Usar `ConcurrentHashMap` o `ConcurrentSkipListMap`.
2. **Claves Mutables:** Modificar una clave tras insertarla corrompe el indice hash o la posicion en el arbol. Utilizar siempre claves inmutables (`String`, `record`).
