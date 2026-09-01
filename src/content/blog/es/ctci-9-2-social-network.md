---
title: "Red Social: Búsqueda Bidireccional de Caminos en Grafos Masivos (CTCI 9.2)"
description: "Disena las estructuras de datos distribuidas y algoritmos para encontrar el camino mas corto de conexion entre usuarios mediante BFS bidireccional en O(k^(d/2))."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Como disenarias las estructuras de datos y algoritmos para una red social muy grande (Facebook, LinkedIn)? Describe como encontrarias la conexion mas corta entre dos personas (ej., Yo $\to$ Bob $\to$ Susan $\to$ Tu).
> * **La Solución Óptima:** **Particionamiento Distribuido + BFS Bidireccional**: (1) Un BFS unidireccional con $k \approx 100$ amigos y distancia $d \approx 6$ explora $O(k^d) = 100^6 = 10^{12}$ nodos; (2) El BFS Bidireccional busca desde Origen y Destino simultaneamente hasta colisionar en el medio, evaluando solo **$O(2 \cdot k^{d/2}) = 2 \cdot 100^3 = 2 \times 10^6$ nodos** (500.000 veces mas rapido); (3) Las consultas remotas se agrupan por `ServerID` para minimizar RPCs entre servidores.
> * **Realidad en Producción:** Motor de grafos de LinkedIn (grados de separacion) y Facebook TAO.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.2), se nos plantea:

*"Disena las estructuras y algoritmos para encontrar el camino de conexion mas corto entre dos usuarios en una red social a escala global."*

## 2. Ventaja Matemática del BFS Bidireccional

Sea $k \approx 100$ la media de amigos y $d \approx 6$ la distancia en la red:
* **BFS Unidireccional:** $k^d = 100^6 = 1.000.000.000.000$ nodos.
* **BFS Bidireccional:** $2 \times k^{d/2} = 2 \times 100^3 = 2.000.000$ nodos.

La reduccion del espacio de busqueda es de **$500.000\times$**.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

public class SocialNetworkBFS {
    public static class Person {
        private final int personID;
        private final List<Integer> friends = new ArrayList<>();

        public Person(int id) { this.personID = id; }
        public int getID() { return personID; }
        public List<Integer> getFriends() { return friends; }
        public void addFriend(int friendID) { friends.add(friendID); }
    }

    public static class PathNode {
        public final Person person;
        public final PathNode previousNode;

        public PathNode(Person p, PathNode prev) {
            this.person = p;
            this.previousNode = prev;
        }

        public List<Person> collapse(boolean startsWithRoot) {
            List<Person> path = new ArrayList<>();
            PathNode node = this;
            while (node != null) {
                if (startsWithRoot) path.add(0, node.person);
                else path.add(node.person);
                node = node.previousNode;
            }
            return path;
        }
    }

    public static class BFSData {
        public Queue<PathNode> toVisit = new LinkedList<>();
        public Map<Integer, PathNode> visited = new HashMap<>();

        public BFSData(Person root) {
            PathNode sourcePath = new PathNode(root, null);
            toVisit.add(sourcePath);
            visited.put(root.getID(), sourcePath);
        }

        public boolean isFinished() { return toVisit.isEmpty(); }
    }

    public static List<Person> findPathBiBFS(Map<Integer, Person> people, int source, int destination) {
        if (!people.containsKey(source) || !people.containsKey(destination)) return null;

        BFSData sourceData = new BFSData(people.get(source));
        BFSData destData = new BFSData(people.get(destination));

        while (!sourceData.isFinished() && !destData.isFinished()) {
            Person collision = searchLevel(people, sourceData, destData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }

            collision = searchLevel(people, destData, sourceData);
            if (collision != null) {
                return mergePaths(sourceData, destData, collision.getID());
            }
        }
        return null;
    }

    private static Person searchLevel(Map<Integer, Person> people, BFSData primary, BFSData secondary) {
        int count = primary.toVisit.size();
        for (int i = 0; i < count; i++) {
            PathNode pathNode = primary.toVisit.poll();
            int personID = pathNode.person.getID();

            if (secondary.visited.containsKey(personID)) {
                return pathNode.person;
            }

            Person person = pathNode.person;
            for (int friendID : person.getFriends()) {
                if (!primary.visited.containsKey(friendID)) {
                    Person friend = people.get(friendID);
                    PathNode next = new PathNode(friend, pathNode);
                    primary.visited.put(friendID, next);
                    primary.toVisit.add(next);
                }
            }
        }
        return null;
    }

    private static List<Person> mergePaths(BFSData sourceData, BFSData destData, int collisionID) {
        PathNode one = sourceData.visited.get(collisionID);
        PathNode two = destData.visited.get(collisionID);

        List<Person> pathOne = one.collapse(true);
        List<Person> pathTwo = two.collapse(false);

        pathTwo.remove(0);
        pathOne.addAll(pathTwo);
        return pathOne;
    }
}
```

## Análisis de Complejidad y Arquitectura

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Búsqueda | `O(k^(d/2))` | Colisiona a mitad de camino, reduciendo $10^{12}$ nodos a $2 \times 10^6$. |
| Memoria Auxiliar | `O(k^(d/2))` | Tablas de nodos visitados y colas de expansion. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Almacenamiento de Grafos (Facebook TAO)

1. **Particionamiento por `ServerID`:** Las listas de adyacencia de amigos se distribuyen por servidores. Las peticiones se agrupan por servidor para ejecutar consultas en lotes.
2. **Caché de Amigos Comunes:** Evaluacion instantanea con intersecciones de conjuntos en memoria (`SINTER` en Redis).

## Casos Límite y Robustez en Producción

1. **Sin camino de conexión:** Termina cuando se agotan las colas sin colision.
2. **Origen igual a Destino:** Retorna el nodo origen directamente.
