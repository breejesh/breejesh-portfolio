---
title: "Tabla Hash vs. STL Map: Estructuras Internas y Compromisos de Rendimiento (CTCI 12.3)"
description: "Compara std::unordered_map (Tabla Hash) y std::map (Arbol Rojo-Negro) en C++, detallando encadenamiento por cubetas, ordenacion y criterios para colecciones pequenas."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
previewImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
---

> **TL;DR**
> * **El Problema del Libro:** Compara y contrasta una tabla hash y un map de la STL. ¿Como se implementa una tabla hash? Si el numero de entradas es pequeno, ¿cual utilizarias?
> * **Diferencias Fundamentales:** (1) **Estructura Interna**: `std::unordered_map` es una **Tabla Hash** con encadenamiento o direccionamiento abierto, mientras que `std::map` es un **Árbol Binario de Búsqueda Rojo-Negro** auto-balanceado; (2) **Complejidad Temporal**: `unordered_map` ofrece $O(1)$ promedio ($O(N)$ peor caso bajo colisiones), mientras que `std::map` garantiza $O(\log N)$ en el peor caso; (3) **Ordenación**: `std::map` mantiene las claves estrictamente ordenadas mediante `operator<`, mientras que la tabla hash no ofrece ningun orden.
> * **Elección para Pocos Elementos:** Para $N \le 50$, `std::map` (o un `std::vector` ordenado) suele ser preferible por no requerir calculos de hash ni sobredimensionamiento de cubetas.
> * **Realidad en Producción:** Libros de ordenes en trading (arboles/vectores) vs tablas hash planas (Google Abseil flat_hash_map).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.3), se nos plantea:

*"Compara una tabla hash con un mapa de la STL (std::map), explica su implementacion y fundamenta la eleccion para conjuntos pequenos de datos."*

## 2. Comparación Estructural

| Característica | `std::unordered_map` (Tabla Hash) | `std::map` (Árbol Rojo-Negro) |
|---|---|---|
| **Estructura** | Arreglo de cubetas con listas enlazadas. | Árbol binario auto-balanceado. |
| **Búsqueda (Promedio)** | $O(1)$ | $O(\log N)$ |
| **Búsqueda (Peor Caso)** | $O(N)$ (colisiones masivas). | $O(\log N)$ garantizado. |
| **Orden de Claves** | No ordenado. | Estrictamente ordenado (`<`). |
| **Requisitos** | Función hash y `operator==`. | `operator<`. |

## Implementación de Tabla Hash

```cpp
#include <iostream>
#include <string>
#include <vector>

template <typename K, typename V>
class SimpleHashTable {
private:
    struct HashNode {
        K key;
        V value;
        HashNode* next;
        HashNode(const K& k, const V& v) : key(k), value(v), next(nullptr) {}
    };

    static const int BUCKET_COUNT = 101;
    HashNode* table[BUCKET_COUNT];

    int hashFunction(const K& key) const {
        return std::hash<K>{}(key) % BUCKET_COUNT;
    }

public:
    SimpleHashTable() {
        for (int i = 0; i < BUCKET_COUNT; i++) table[i] = nullptr;
    }

    void insert(const K& key, const V& value) {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];

        while (entry != nullptr) {
            if (entry->key == key) {
                entry->value = value;
                return;
            }
            entry = entry->next;
        }

        HashNode* newNode = new HashNode(key, value);
        newNode->next = table[idx];
        table[idx] = newNode;
    }

    bool get(const K& key, V& outValue) const {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];
        while (entry != nullptr) {
            if (entry->key == key) {
                outValue = entry->value;
                return true;
            }
            entry = entry->next;
        }
        return false;
    }
};
```

## ¿Por qué elegir `std::map` para Pocos Elementos?

Para $N < 50$:
1. **Sin coste de cálculo de hash:** Las funciones hash para cadenas complejas consumen decenas de instrucciones de CPU.
2. **Sin rehasheo ni desperdicio de cubetas:** No se reservan bloques vacios de memoria.
3. **Localidad de Caché:** Un `std::vector<std::pair<K,V>>` ordenado con busqueda binaria (`std::lower_bound`) suele ser incluso mas rapido gracias a la precarga de lineas de cache L1/L2.

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Tablas Planas Modernas (Swiss Tables)

1. **Abseil `flat_hash_map` de Google:** Emplea sondeo cuadratico e instrucciones SIMD para evaluar 16 elementos por ciclo de reloj.
2. **Ataques de Denegación de Servicio por Hash (Hash DoS):** Insercion deliberada de claves con colisiones para forzar complejidad $O(N)$ mitigada con algoritmos como SipHash.

## Casos Límite y Robustez en Producción

1. **Iteración Determinista:** En sistemas distribuidos, `std::map` asegura que todos los nodos recorran los datos en el mismo orden exacto.
