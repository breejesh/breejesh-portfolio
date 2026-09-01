---
title: "Caché: Arquitectura de Caché de Consultas Distribuida e Invalidación Multinivel (CTCI 9.5)"
description: "Disena una capa de cache distribuida de alto rendimiento para consultas de motores de busqueda con desalojo LRU en O(1) e invalidacion asincrona."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina un servidor web para un motor de busqueda simplificado con 100 maquinas que responden a consultas de usuarios llamando a un cluster costoso `processSearch(string query)`. Las consultas se enrutan aleatoriamente entre los 100 frontends. Disena un mecanismo de cache para las consultas recientes y explica como actualizarla cuando los datos cambian.
> * **La Solución Óptima:** Arquitectura Híbrida de Dos Niveles: (1) **Caché Local L1**: Cada frontend mantiene un LRU en RAM para las consultas mas virales (sin saltos de red); (2) **Cluster Distribuido L2**: Capa de Redis / Memcached particionada mediante hashing consistente; (3) **Estructura LRU**: Lista doblemente enlazada + mapa hash para operaciones en tiempo $O(1)$; (4) **Invalidación**: Expiracion por TTL y mensajes Pub/Sub ante actualizaciones del indice.
> * **Realidad en Producción:** Capas de cache en Google / Bing y CDN en Akamai.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.5), se nos plantea:

*"Disena una arquitectura de cache para un cluster de 100 servidores que procesan busquedas costosas y explica la estrategia de invalidacion."*

## 2. Opciones de Diseño: Local vs Distribuida vs Híbrida

1. **Caché Local Aislada:** Cero latencia de red, pero baja tasa de aciertos debido al enrutamiento aleatorio (la misma busqueda se duplica en 100 servidores).
2. **Caché Distribuida Dedicada:** Alta tasa de aciertos y uso optimo de memoria; cada consulta apunta a un nodo unico mediante `hash(query)`.
3. **Caché Híbrida L1/L2:** Lo mejor de ambos mundos: L1 en cada maquina para el top 1% de consultas ultra-populares y L2 distribuido para el resto.

## Implementación de Producción

```java
import java.util.HashMap;
import java.util.Map;

public class LRUQueryCache {
    public static class Node {
        public String query;
        public String[] results;
        public Node prev;
        public Node next;

        public Node(String q, String[] res) {
            this.query = q;
            this.results = res;
        }
    }

    private final int capacity;
    private final Map<String, Node> map = new HashMap<>();
    private final Node head = new Node(null, null);
    private final Node tail = new Node(null, null);

    public LRUQueryCache(int cap) {
        this.capacity = cap;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized String[] get(String query) {
        Node node = map.get(query);
        if (node == null) return null;

        detach(node);
        attach(node);
        return node.results;
    }

    public synchronized void put(String query, String[] results) {
        if (map.containsKey(query)) {
            Node node = map.get(query);
            node.results = results;
            detach(node);
            attach(node);
            return;
        }

        if (map.size() >= capacity) {
            Node lru = tail.prev;
            detach(lru);
            map.remove(lru.query);
        }

        Node newNode = new Node(query, results);
        attach(newNode);
        map.put(query, newNode);
    }

    private void attach(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void detach(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}
```

## Análisis de Complejidad y Arquitectura

| Operación | Complejidad | Detalle Técnico |
|---|---|---|
| Lectura de Caché (`get`) | `O(1)` | Busqueda en HashMap mas recolocacion de punteros en la lista. |
| Escritura de Caché (`put`) | `O(1)` | Insercion en HashMap y adicion en cabeza de lista. |
| Capacidad de Memoria | `O(C)` | Acotada a la capacidad $C$ configurada. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Estrategias de Invalidación

1. **Expiración por TTL (Time to Live):** Caducidad automatica tras un periodo determinado (ej. 300 segundos).
2. **Invalidación por Eventos Pub/Sub:** Publicacion de eventos de mutacion en Kafka para purgar claves en el cluster cuando se actualiza el indice.

## Casos Límite y Robustez en Producción

1. **Efecto Estampida (Cache Stampede):** Uso de bloqueos de un solo vuelo (single-flight mutex) para recalcular la consulta costosa una sola vez mientras los demas hilos esperan.
2. **Penetración de Caché:** Cachear resultados nulos para consultas sin resultados con un TTL corto.
