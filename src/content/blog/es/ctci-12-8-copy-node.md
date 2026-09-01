---
title: "Copiar Nodo: Clonación Profunda de Grafos Dirigidos con Ciclos (CTCI 12.8)"
description: "Realiza una copia profunda de un grafo dirigido o estructura con referencias ciclicas en C++ mediante tablas hash de mapeo de punteros en tiempo O(V + E)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo que reciba un puntero a una estructura `Node` y retorne una copia completa de la estructura de datos. La estructura `Node` contiene dos punteros a otras estructuras `Node`.
> * **La Solución Óptima:** **Copia Profunda con Detección de Ciclos mediante Tabla Hash**: (1) La estructura puede contener ciclos y grafos dirigidos complejos; (2) Se mantiene un mapa `std::unordered_map<const Node*, Node*> nodeMap` que asocia direcciones originales con sus clones; (3) Si el nodo es `null`, retorna `null`; si ya existe en `nodeMap`, retorna el clon existente (evitando bucles infinitos de recursion); (4) En caso contrario, crea `Node* clone = new Node()`, lo registra en el mapa *antes* de descender, y clona recursivamente `ptr1` y `ptr2`; (5) Se ejecuta en **tiempo $O(V + E)$** y **espacio $O(V)$**.
> * **Realidad en Producción:** Clonacion de grafos computacionales en frameworks de Machine Learning (PyTorch / TensorFlow) y serializacion de grafos de objetos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.8), se nos plantea:

*"Escribe una funcion en C++ para clonar de forma profunda una estructura de nodos interconectados con dos punteros que puede contener ciclos."*

```cpp
struct Node {
    Node* ptr1;
    Node* ptr2;
};
```

## 2. Prevención de Bucles Infinitos mediante Memoización

Almacenar el clon en una tabla hash **antes** de procesar los punteros hijos garantiza que cualquier arista de retorno encuentre inmediatamente el nodo duplicado ya existente:
$$\text{nodeMap}[\text{original}] = \text{clon}$$

## Implementación de Producción

```cpp
#include <iostream>
#include <unordered_map>

struct Node {
    Node* ptr1;
    Node* ptr2;
    int data;

    Node(int val = 0) : ptr1(nullptr), ptr2(nullptr), data(val) {}
};

class NodeCloner {
private:
    static Node* copyRecursive(const Node* root, std::unordered_map<const Node*, Node*>& nodeMap) {
        if (!root) return nullptr;

        auto it = nodeMap.find(root);
        if (it != nodeMap.end()) {
            return it->second;
        }

        Node* clone = new Node(root->data);
        nodeMap[root] = clone;

        clone->ptr1 = copyRecursive(root->ptr1, nodeMap);
        clone->ptr2 = copyRecursive(root->ptr2, nodeMap);

        return clone;
    }

public:
    static Node* copy(const Node* root) {
        std::unordered_map<const Node*, Node*> nodeMap;
        return copyRecursive(root, nodeMap);
    }
};
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(V + E)` | Cada vertice y arista se procesa exactamente una vez. |
| Espacio Auxiliar | `O(V)` | Mapa hash con $V$ pares de punteros mas pila de recursion. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Grafos de Compilador (LLVM)

1. **Clonación de Bloques Básicos en LLVM:** Las transformaciones de optimizacion duplican subgrafos de instrucciones utilizando tablas de equivalencia de punteros (`ValueToValueMapTy`).
2. **Estructuras en Diamante:** Nodos compartidos por multiples ramas se clonan una sola vez preservando la topologia.

## Casos Límite y Robustez en Producción

1. **Nodos Auto-Referenciales (`node->ptr1 = node`):** Resuelto de forma segura sin desbordamiento de pila.
2. **Punteros Nulos:** Retorno seguro de `nullptr`.
