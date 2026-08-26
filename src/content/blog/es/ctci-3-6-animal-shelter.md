---
title: "Animal Shelter: adopción FIFO con perros y gatos (Java)"
description: "Problema estilo CTCI 3.6 para principiantes: un refugio solo tiene perros y gatos en cola estricta FIFO. Implementa enqueue, dequeueAny, dequeueDog y dequeueCat con dos colas y un orden de llegada."
date: "2025-09-28"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 3.6 para principiantes: un refugio solo tiene perros y gatos en cola estricta FIFO. Implementa enqueue, dequeueAny, dequeueDog y dequeueCat con dos colas y un orden de llegada.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un refugio lleva una cola justa. Los animales llegan uno a uno. Quien adopta puede llevarse al animal que más tiempo lleva esperando en total, o pedir solo un perro o solo un gato y recibir el más antiguo de ese tipo. Nadie señala a una mascota concreta por nombre. Es **FIFO** puro, con un filtro por tipo encima.

Este post es enseñanza original para principiantes en **Java**. Misma familia de diseño de colas en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí cierra el capítulo 3.

---

## 1. Analogía del refugio

Imagina dos salas de espera detrás del mostrador:

* Sala D: solo perros, en orden de llegada.
* Sala C: solo gatos, en orden de llegada.

Cada animal recibe un número de ticket al llegar: 0, 1, 2, 3, ... Un ticket menor significa que llegó antes. No es un reloj de pared. Es un contador entero que controla el refugio.

Cuando alguien pide **"cualquier animal"**, el empleado mira el frente de ambas salas y elige el animal con el ticket más pequeño. Si pide **"un perro"**, solo mira la sala D. Lo mismo con los gatos.

Una sola cola mezclada haría fácil el "cualquiera", pero "solo perro" obligaría a saltar gatos hasta el primer perro. Dos colas tipadas dejan cada operación en el frente de una lista.

---

## 2. Problema en palabras simples

**Objetivo:** estructuras y métodos para un refugio que solo guarda perros y gatos con FIFO estricto.

**Operaciones:**

| Método | Significado |
| --- | --- |
| `enqueue(animal)` | llega el animal; va al final de la cola de su tipo |
| `dequeueAny()` | adoptar el animal más antiguo de cualquier tipo |
| `dequeueDog()` | adoptar el perro más antiguo |
| `dequeueCat()` | adoptar el gato más antiguo |

**Reglas:**

* Solo perros y gatos.
* "Más antiguo" significa llegada más temprana, no edad biológica.
* No se elige un animal concreto por identidad, solo por tipo (o cualquiera).
* Puedes usar una linked list o cola integrada.

**Aclara antes de programar:**

* ¿Y si el refugio está vacío? (Devuelve `null` o lanza excepción; elige un contrato y cúmplelo.)
* ¿Y si piden un perro y no queda ninguno? (El mismo contrato.)
* ¿Puede repetirse el mismo nombre? (Sí. La identidad es el objeto más el orden, no el string del nombre.)

---

## 3. Piensa primero

### Una cola mezclada

Guarda todos los animales en un único `LinkedList<Animal>`.

* `dequeueAny` es `removeFirst`: O(1).
* `dequeueDog` recorre desde el frente hasta el primer perro: O(N) en el peor caso.
* Igual para gatos.

Funciona, y a veces basta en entrevista. No es la respuesta limpia si te permiten dos listas.

### Dos colas más orden (preferido)

Mantén:

* `dogs`: cola de perros
* `cats`: cola de gatos
* `order`: entero que sube en cada enqueue (timestamp lógico)

Al hacer enqueue:

1. Marca el animal con el `order` actual y luego `order++`.
2. Empuja a la cola de perros o de gatos según el tipo.

En `dequeueAny`:

1. Si un lado está vacío, saca del otro.
2. Si ambos tienen animales, mira ambos frentes y saca el de menor order (llegó antes).
3. Si ambos vacíos, devuelve `null` (o tu contrato de vacío).

En `dequeueDog` / `dequeueCat`: solo haces poll de esa cola.

¿Por qué herencia? `dequeueAny` devuelve perro o gato, así que ambos comparten una base `Animal`. La comparación de orden vive en esa base para que el empleado no dependa de la clase concreta más allá de "qué sala".

---

## 4. Solución en Java

```java
import java.util.LinkedList;

abstract class Animal {
    private int order;
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public int getOrder() {
        return order;
    }

    /** True if this animal arrived before the other. */
    public boolean isOlderThan(Animal other) {
        return this.order < other.getOrder();
    }

    public String getName() {
        return name;
    }
}

class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }
}

class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }
}

class AnimalQueue {
    private LinkedList<Dog> dogs = new LinkedList<>();
    private LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0; // arrival counter, not wall-clock time

    public void enqueue(Animal a) {
        a.setOrder(order);
        order++;

        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        } else {
            throw new IllegalArgumentException("Only dogs and cats");
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty() && cats.isEmpty()) {
            return null;
        }
        if (dogs.isEmpty()) {
            return dequeueCat();
        }
        if (cats.isEmpty()) {
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
        return dogs.isEmpty() ? null : dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.isEmpty() ? null : cats.poll();
    }
}
```

Recorrido:

| Paso | Acción | frente dogs | frente cats | notas |
| --- | --- | --- | --- | --- |
| 1 | enqueue Dog("Rex") order 0 | Rex | - | |
| 2 | enqueue Cat("Mimi") order 1 | Rex | Mimi | |
| 3 | enqueue Dog("Buddy") order 2 | Rex | Mimi | Buddy detrás de Rex |
| 4 | dequeueAny | Buddy | Mimi | sale Rex (order 0 gana a 1) |
| 5 | dequeueCat | Buddy | - | sale Mimi; único gato |
| 6 | dequeueAny | - | - | sale Buddy |

No deberían aparecer orders iguales si solo asignas en `enqueue`. Si usas timestamps reales y hay empate, cualquiera de los dos vale según el enunciado.

Podrías guardar el order como millis de reloj en vez de un contador int. El contador es más simple en entrevista: sin desfase de reloj, sin debate del "mismo milisegundo", y la comparación es un entero menor-que.

---

## 5. Tabla de complejidad

| Operación | Tiempo | Notas de espacio extra |
| --- | --- | --- |
| `enqueue` | O(1) | un sello + addLast en linked list |
| `dequeueDog` / `dequeueCat` | O(1) | poll del frente de esa cola |
| `dequeueAny` | O(1) | dos peeks + un poll |
| Una cola mezclada + barrido por tipo | O(N) al adoptar por tipo | estructura más simple, peor adopción tipada |

El espacio es O(N) para N animales aún en el refugio. El campo order es O(1) por animal.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan esto:

* **Refugio vacío** en cualquier dequeue → `null` (o excepción). No hagas peek sin comprobar.
* **Solo perros** (o solo gatos) en `dequeueAny` → toma del lado no vacío sin comparar.
* **Un perro, muchos gatos** → los dequeue tipados no roban de la cola equivocada; el order sigue decidiendo `dequeueAny`.
* **Subclase de Animal desconocida** → rechaza en enqueue si solo soportas perro y gato.
* **Nombres repetidos** → el perro "Max" y el gato "Max" son objetos distintos con orders distintos.

Errores frecuentes:

1. **Una lista y barrido lineal en cada adopción tipada.** Vale como primer boceto. Di el coste O(N) y pasa a dos colas.
2. **Olvidar el sello de order.** Entonces no puedes comparar los frentes de las dos colas con justicia.
3. **Comparar nombres o hash en vez del orden de llegada.** El orden de llegada es la única clave justa.
4. **Usar `remove` en un índice cualquiera.** Siempre saca del frente de la cola del tipo.
5. **Mutar el order después del enqueue.** El ticket se fija al llegar.
6. **Sacar de la cola incorrecta cuando los orders están cerca.** Si ambos lados tienen animales, siempre peek de los dos; no alterne perro/gato por costumbre.

Uso mínimo:

```java
AnimalQueue shelter = new AnimalQueue();
shelter.enqueue(new Dog("Rex"));
shelter.enqueue(new Cat("Mimi"));
Animal any = shelter.dequeueAny(); // Rex
Dog dog = shelter.dequeueDog();    // null if no dogs left
Cat cat = shelter.dequeueCat();    // Mimi if still present
```

---

## 7. Resumen para contárselo a un amigo

Animal Shelter es diseño de cola con filtro por tipo:

1. Perros en una cola, gatos en otra. Ambas siguen FIFO.
2. Cada llegada recibe un número de order creciente.
3. `dequeueDog` / `dequeueCat` hacen poll solo de esa cola.
4. `dequeueAny` mira ambos frentes y se queda con el order menor (más antiguo). Si un lado está vacío, toma el otro.
5. Perros y gatos comparten la base `Animal` para que `dequeueAny` pueda devolver cualquiera.

Si dibujas dos filas, explicas el ticket y ejecutas `dequeueAny` con un animal al frente de cada sala, dominas el 3.6. El capítulo 3 cierra con una estructura que es casi dos colas y una comparación.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Sort Stack](/blog/es/ctci-3-5-sort-stack)
* Siguiente: [Route Between Nodes](/blog/es/ctci-4-1-route-between-nodes)