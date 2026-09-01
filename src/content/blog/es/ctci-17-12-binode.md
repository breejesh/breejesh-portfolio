---
title: "BiNode: Conversión In-Place de Árbol BST a Lista Doblemente Enlazada (CTCI 17.12)"
description: "Transforma un arbol binario de busqueda (BST) en una lista doblemente enlazada ordenada in-place mediante reconfiguracion de punteros in-order en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-12-binode.webp
previewImage: /assets/images/ctci-17-12-binode.webp
---

> **TL;DR**
> * **El Problema del Libro:** Una estructura `BiNode` contiene `node1`, `node2` y `data` (hijo izquierdo/derecho en BST, o prev/next en Lista Doblemente Enlazada). Convierte un BST en una lista doblemente enlazada ordenada *in-place*.
> * **La Solución Óptima:** **Reconexión de Punteros en Recorrido In-Order**:
>   1. Realizar un recorrido in-order (`Izquierda -> Raíz -> Derecha`).
>   2. Mantener un puntero `prev` con el ultimo nodo visitado.
>   3. Para cada nodo actual:
>      * Si `prev == null`, fijar `head = curr` (el menor elemento del arbol).
>      * De lo contrario, enlazar `prev.node2 = curr` y `curr.node1 = prev`.
>      * Actualizar `prev = curr`.
>   4. Se ejecuta en **tiempo $O(N)$** y **espacio de pila $O(H)$** con estrictamente **cero asignaciones adicionales en memoria dinámica**.
> * **Realidad en Producción:** Enlace secuencial de hojas en arboles B+ de motores de bases de datos (InnoDB) y reciclaje de listas libres en gestores de memoria.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.12), se nos plantea:

*"Transforma un arbol binario de busqueda en una lista doblemente enlazada ordenada reutilizando los punteros originales sin crear nuevos nodos."*

## 2. Reconexión de Punteros

El recorrido in-order visita los nodos en estricto orden ascendente, permitiendo encadenar los punteros `node1` (anterior) y `node2` (siguiente) a medida que se avanza.

## Implementación de Producción

```java
public class BiNodeConverter {

    public static class BiNode {
        public int data;
        public BiNode node1; // Izquierda en BST / Prev en DLL
        public BiNode node2; // Derecha en BST / Next en DLL

        public BiNode(int data) {
            this.data = data;
        }
    }

    private static BiNode head = null;
    private static BiNode prev = null;

    public static BiNode convert(BiNode root) {
        head = null;
        prev = null;
        inOrderFlatten(root);
        return head;
    }

    private static void inOrderFlatten(BiNode current) {
        if (current == null) return;

        inOrderFlatten(current.node1);

        if (prev == null) {
            head = current;
        } else {
            prev.node2 = current;
            current.node1 = prev;
        }
        prev = current;

        inOrderFlatten(current.node2);
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Un solo recorrido in-order sobre los N nodos. |
| Espacio Auxiliar | `O(H)` | Pila de llamadas proporcional a la altura del arbol ($O(\log N)$ promedio). |
| Asignación de Nodos | `0 bytes` | Modifica directamente los punteros existentes. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Bases de Datos (B+ Trees)

1. **Escaneos por Rango en MySQL InnoDB:** Las bases de datos enlazan las hojas de los arboles B+ como listas doblemente enlazadas para responder consultas `BETWEEN` de forma continua.
2. **Asignadores de Memoria Slab:** Reciclaje de estructuras binarias en listas libres.

## Casos Límite y Robustez en Producción

1. **Árbol Vacío:** Retorna `null` de forma segura.
2. **Nodo Único:** Asigna `head = root` manteniendo ambos punteros en `null`.
