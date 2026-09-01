---
title: "Caché LRU: Diseño de un Almacenamiento en Memoria O(1) de Menor Uso Reciente (CTCI 16.25)"
description: "Como disenar e implementar una cache LRU (Least Recently Used) con operaciones get y put en O(1) mediante listas doblemente enlazadas y tablas hash."
date: "2026-05-06"
tags: [Algoritmos y Estructuras, Backend y Bases de Datos]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disenar una cache LRU de capacidad fija donde `get(key)` y `put(key, value)` operen en tiempo constante $O(1)$.
> * **La Solución Óptima:** Combinar un **HashMap** (para acceso instantaneo $O(1)$ por clave) con una **Lista Doblemente Enlazada** (para mover y eliminar nodos en tiempo constante $O(1)$ sin desplazar memoria).
> * **Realidad en Producción:** Politicas de desalojo en Redis (`allkeys-lru`), reemplazo de paginas de memoria en el kernel de Linux y jerarquias de cache de CPU.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.25), se nos pide implementar una cache LRU de capacidad $C$:
* `V get(K key)`: Retorna el valor si la clave existe y la marca como la mas recientemente usada. Si no existe, retorna null.
* `void put(K key, V value)`: Inserta o actualiza el par clave-valor. Si se supera la capacidad, desaloja el elemento menos recientemente usado antes de insertar.

Ambas operaciones deben ejecutarse estrictamente en tiempo constante $O(1)$.

## 2. Combinación HashMap + Lista Doblemente Enlazada

El HashMap almacena punteros a los nodos de la lista. La lista doblemente enlazada con nodos centinela (`head` y `tail`) permite desacoplar cualquier nodo e insertarlo en la cabecera actualizando cuatro punteros.

## Implementación de Producción

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCache<K, V> {
    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> prev, next;
        Node(K k, V v) { this.key = k; this.value = v; }
    }

    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private final Node<K, V> head = new Node<>(null, null); // Centinela Head
    private final Node<K, V> tail = new Node<>(null, null); // Centinela Tail

    public LRUCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("La capacidad debe ser positiva");
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized V get(K key) {
        Node<K, V> node = map.get(key);
        if (node == null) return null;

        moveToHead(node);
        return node.value;
    }

    public synchronized void put(K key, V value) {
        Node<K, V> node = map.get(key);
        if (node != null) {
            node.value = value;
            moveToHead(node);
        } else {
            if (map.size() >= capacity) {
                Node<K, V> evicted = popTail();
                map.remove(evicted.key);
            }
            Node<K, V> newNode = new Node<>(key, value);
            map.put(key, newNode);
            addHead(newNode);
        }
    }

    private void addHead(Node<K, V> node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node<K, V> node) {
        removeNode(node);
        addHead(node);
    }

    private Node<K, V> popTail() {
        Node<K, V> res = tail.prev;
        removeNode(res);
        return res;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo get(key) | `O(1)` | Busqueda hash directa y 4 actualizaciones de puntero. |
| Tiempo put(key, value) | `O(1)` | Insercion hash y reconexion de nodo. |
| Espacio Auxiliar | `O(C)` | Exactamente C nodos en el HashMap y la Lista Doblemente Enlazada. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Redis y Paginación en Linux

1. **Redis Approximated LRU:** Para evitar la sobrecarga de punteros (24 bytes por clave) en conjuntos de 100M de claves, Redis muestrea 5 claves aleatorias y desaloja la que tiene el timestamp mas antiguo.
2. **Caffeine Cache:** Utiliza buffers de lectura sin cerrojos (*lock-free ring buffers*) para alcanzar millones de lecturas por segundo por nucleo sin bloqueos.
3. **Paginación en el Kernel de Linux:** Listas activas e inactivas gestionan el descarte de paginas de memoria sucias hacia la particion de swap.

## Casos Límite y Robustez en Producción

1. **Capacidad 1:** Sustitucion inmediata del nodo anterior sin punteros huerfanos.
2. **Seguridad Concurrente:** Metodos `synchronized` o bloqueos de lectura/escritura (`ReentrantReadWriteLock`).
