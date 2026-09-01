---
title: "Refugio de Animales: Cola de Adopción FIFO Multi-Categoría (CTCI 3.6)"
description: "Implementa una cola de adopcion FIFO para un refugio de animales manteniendo colas separadas para Perros y Gatos con marcas de tiempo en tiempo O(1) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un refugio de animales alberga unicamente perros y gatos y opera estrictamente bajo el principio FIFO. Los adoptantes pueden elegir el animal mas antiguo en general (`dequeueAny`), o seleccionar especificamente el perro (`dequeueDog`) o gato (`dequeueCat`) mas antiguo.
> * **La Solución Óptima:** Manten dos colas separadas `LinkedList<Dog>` y `LinkedList<Cat>`. Asigna una marca de orden incremental (`order`) a cada animal al ingresar (`enqueue`). `dequeueAny` compara las cabezas de ambas colas y extrae el que tenga menor `order` en tiempo $O(1)$.
> * **Realidad en Producción:** Programadores de tareas multi-carril (Celery/BullMQ) y secuencias LSN en registros WAL de bases de datos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 3.6), se nos plantea:

*"Un refugio de animales contiene solo perros y gatos y opera en estricto orden FIFO. Las personas pueden adoptar el animal mas antiguo general, o especificar si prefieren perro o gato. Implementa las operaciones enqueue, dequeueAny, dequeueDog y dequeueCat."*

## 2. Diseno de Doble Cola con Marcas de Orden Monótonas

Para lograr $O(1)$ en todas las operaciones:
1. Mantenemos colas separadas `LinkedList<Dog> dogs` y `LinkedList<Cat> cats`.
2. Una clase abstracta `Animal` encapsula el nombre y un entero `order` (marca de tiempo).
3. **`enqueue(animal)`:** Asigna `order++` e inserta al final de la cola respectiva en $O(1)$.
4. **`dequeueDog()` / `dequeueCat()`:** Extrae directamente de la cabeza de la cola correspondiente en $O(1)$.
5. **`dequeueAny()`:** Compara el `order` en la cabeza de ambas colas y extrae el mas antiguo en $O(1)$.

## Implementación de Producción

```java
import java.util.LinkedList;

public class AnimalShelter {
    public static abstract class Animal {
        private int order;
        protected String name;

        public Animal(String n) { name = n; }
        public void setOrder(int ord) { order = ord; }
        public int getOrder() { return order; }
        public String getName() { return name; }

        public boolean isOlderThan(Animal a) {
            return this.order < a.getOrder();
        }
    }

    public static class Dog extends Animal {
        public Dog(String n) { super(n); }
    }

    public static class Cat extends Animal {
        public Cat(String n) { super(n); }
    }

    private final LinkedList<Dog> dogs = new LinkedList<>();
    private final LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0;

    public void enqueue(Animal a) {
        a.setOrder(order++);
        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty()) {
            return dequeueCat();
        } else if (cats.isEmpty()) {
            return dequeueDog();
        }

        Dog dog = dogs.peek();
        Cat cat = cats.peek();

        if (dog.isOlderThan(cat)) {
            return dequeueDog();
        } else {
            return dequeueCat();
        }
    }

    public Dog dequeueDog() {
        return dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.poll();
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| enqueue | `O(1)` | Asignacion de orden e insercion al final de la lista enlazada. |
| dequeueAny | `O(1)` | Comparacion de marcas de tiempo en las cabezas de ambas colas. |
| dequeueDog / dequeueCat | `O(1)` | Extraccion directa de la lista correspondiente. |
| Espacio Auxiliar | `O(N)` | Memoria proporcional a los animales albergados. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Despacho Multi-Cola

1. **Gestores de Tareas (Celery, BullMQ):** Procesan colas con diferentes tipos de prioridades garantizando orden global mediante generadores de secuencias.
2. **Write-Ahead Logging (WAL) en Bases de Datos:** Los registros de transacciones concurrentes se etiquetan con numeros de secuencia LSN para preservar el orden temporal.

## Casos Límite y Robustez en Producción

1. **Solo quedan perros o solo gatos:** `dequeueAny()` delega limpiamente a la cola disponible.
2. **Refugio vacío:** Retorna `null` sin excepciones.
