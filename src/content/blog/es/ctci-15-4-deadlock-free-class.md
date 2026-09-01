---
title: "Clase Libre de Interbloqueos: Grafo de Dependencias y Detección de Ciclos (CTCI 15.4)"
description: "Disena un gestor de cerrojos concurrente libre de interbloqueos utilizando grafos aciclicos dirigidos (DAG) y algoritmos de deteccion de ciclos en Java."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-15-4-deadlock-free-class.webp
previewImage: /assets/images/ctci-15-4-deadlock-free-class.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena una clase que proporcione un cerrojo (lock) solo si no existe la posibilidad de producir un interbloqueo (deadlock).
> * **La Solución Óptima:** **Grafo Acíclico Dirigido (DAG) con Detección de Ciclos Previa a la Adquisición**:
>   1. **Modelado en Grafo**: Modelar los cerrojos como nodos en un grafo de dependencias $G = (V, E)$. Una arista $A \to B$ indica que un hilo que posee el cerrojo $A$ solicito el cerrojo $B$.
>   2. **Validación Preventiva**: Cuando un hilo con cerrojos $\{L_1, \dots, L_k\}$ solicita $L_{\text{nuevo}}$, se verifica si anadir aristas $L_i \to L_{\text{nuevo}}$ genera un ciclo dirigido.
>   3. **Detección mediante DFS**: Ejecutar busqueda en profundidad (DFS) desde $L_{\text{nuevo}}$ hacia los cerrojos retenidos.
>   4. **Concesión o Rechazo**: Si se detecta un ciclo, rechazar la solicitud; en caso contrario, registrar la arista y otorgar el cerrojo.
>   5. Se ejecuta en **tiempo $O(V + E)$**.
> * **Realidad en Producción:** Analizadores ThreadSanitizer y gestores de bloqueos en bases de datos relacionales.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 15.4), se nos plantea:

*"Implementa una clase de gestion de concurrencia que valide mediante grafos la concesion de cerrojos para evitar bloqueos mutuos circulares."*

## 2. Detección de Ciclos en el Grafo de Cerrojos

Si un hilo retiene $A$ y pide $B$, y otro hilo retiene $B$ y pide $A$, se forma el ciclo $A \to B \to A$. El algoritmo previene la transicion cancelando la peticion.

## Implementación de Producción

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

public class LockManager {
    private static final LockManager INSTANCE = new LockManager();
    private final Map<Integer, LockNode> locks = new ConcurrentHashMap<>();
    private final ThreadLocal<List<LockNode>> threadLocks = ThreadLocal.withInitial(ArrayList::new);

    public static LockManager getInstance() { return INSTANCE; }

    public static class LockNode {
        private final int id;
        private final ReentrantLock lock = new ReentrantLock();
        private final List<LockNode> children = new ArrayList<>();

        public LockNode(int id) { this.id = id; }
        public int getId() { return id; }
        public ReentrantLock getLock() { return lock; }
        public List<LockNode> getChildren() { return children; }

        public synchronized void addEdge(LockNode target) {
            if (!children.contains(target)) children.add(target);
        }
    }

    public synchronized boolean acquireLock(int lockId) {
        LockNode target = locks.computeIfAbsent(lockId, LockNode::new);
        List<LockNode> currentHeldLocks = threadLocks.get();

        if (!currentHeldLocks.isEmpty()) {
            for (LockNode held : currentHeldLocks) {
                if (hasCycle(target, held)) {
                    System.err.println("DEADLOCK EVITADO: Cerrojo " + lockId);
                    return false;
                }
            }
            for (LockNode held : currentHeldLocks) held.addEdge(target);
        }

        target.getLock().lock();
        currentHeldLocks.add(target);
        return true;
    }

    public synchronized void releaseLock(int lockId) {
        LockNode node = locks.get(lockId);
        if (node != null) {
            node.getLock().unlock();
            threadLocks.get().remove(node);
        }
    }

    private boolean hasCycle(LockNode from, LockNode to) {
        Set<Integer> visited = new HashSet<>();
        return dfs(from, to, visited);
    }

    private boolean dfs(LockNode current, LockNode target, Set<Integer> visited) {
        if (current == target) return true;
        if (!visited.add(current.getId())) return false;
        for (LockNode next : current.getChildren()) {
            if (dfs(next, target, visited)) return true;
        }
        return false;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Validación | `O(V + E)` | Recorrido DFS sobre el grafo de dependencias de cerrojos. |
| Espacio en Memoria | `O(V + E)` | Lista de adyacencia global. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: ThreadSanitizer

1. **Herramientas de Análisis Dinámico:** ThreadSanitizer (TSan) intercepta las llamadas a `pthread_mutex_lock` para construir un grafo global e informar de posibles deadlocks antes de desplegar a produccion.
2. **Grafos de Espera en Bases de Datos:** Deteccion automatica de ciclos para abortar transacciones conflictivas.

## Casos Límite y Robustez en Producción

1. **Reentrancia:** Soporte para llamadas recursivas sin anadir autociclos.
