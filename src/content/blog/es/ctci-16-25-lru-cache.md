---
title: "LRU Cache: Implementar Caché Menos Utilizada Recientemente (CTCI 16.25)"
description: "Problema CTCI 16.25 en Java: diseñar y construir una caché LRU con operaciones get y put en tiempo O(1) usando HashMap y Lista Doblemente Enlazada."
date: "2026-04-09"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **TL;DR**
> * **El Problema:** Diseñar una estructura de datos de capacidad fija que desaloje el elemento menos utilizado recientemente cuando se llena, admitiendo `get` y `put` en tiempo $O(1)$.
> * **La Clave:** Un HashMap ofrece búsqueda instantánea $O(1)$, mientras que una lista doblemente enlazada con nodos centinela head y tail proporciona reubicación y desalojo en $O(1)$.
> * **Complejidad:** Tiempo $O(1)$ para ambas operaciones, espacio $O(N)$ acotado por la capacidad.

Tienes un escritorio pequeño donde caben solo tres libros abiertos. Si necesitas un cuarto libro, guardas el libro que no has tocado en más tiempo. Eso es una **Caché LRU**.

---

## 1. Por qué ninguna estructura funciona sola

| Estructura | Get por Clave | Insertar / Actualizar | Eliminar Más Antiguo |
| --- | --- | --- | --- |
| **Array** | $O(N)$ | $O(N)$ | $O(N)$ |
| **Lista Simplemente Enlazada** | $O(N)$ | $O(1)$ | $O(N)$ |
| **HashMap solo** | $O(1)$ | $O(1)$ | $O(N)$ |
| **HashMap + Lista Doble** | **$O(1)$** | **$O(1)$** | **$O(1)$** |

---

## 2. Implementación Completa en Java

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCacheCustom {
    private static class Node {
        int key;
        int value;
        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head;
    private final Node tail;

    public LRUCacheCustom(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
        this.capacity = capacity;
        this.map = new HashMap<>();

        this.head = new Node(0, 0);
        this.tail = new Node(0, 0);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }
        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        Node existingNode = map.get(key);

        if (existingNode != null) {
            existingNode.value = value;
            moveToHead(existingNode);
            return;
        }

        if (map.size() >= capacity) {
            Node lru = tail.prev;
            removeNode(lru);
            map.remove(lru.key);
        }

        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
}
```

---

## 3. Complejidad y Casos Borde

| Métrica | Complejidad | Detalle |
| --- | --- | --- |
| **Get Latency** | $O(1)$ | Búsqueda en hash map y cuatro punteros actualizados |
| **Put Latency** | $O(1)$ | Inserción en mapa y enlace en lista |
| **Espacio** | $O(C)$ | Acotado por la capacidad $C$ |
