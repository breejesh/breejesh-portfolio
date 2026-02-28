---
title: "Hash Table: encadenamiento con cubos LinkedList (Java)"
description: "Problema estilo CTCI 7.12 para principiantes: un HashMap simple con un array de listas enlazadas. put, get y remove con colisiones por chaining en Java."
date: "2026-02-28"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-12-hash-table.webp
previewImage: /assets/images/ctci-7-12-hash-table.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.12 para principiantes: un HashMap simple con un array de listas enlazadas. put, get y remove con colisiones por chaining en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un mapa que responde **get(key)** en tiempo casi constante es una **tabla hash**. Hasheas la clave a un índice de cubo y solo miras ese cubo. Cuando dos claves caen en el mismo hueco, necesitas un plan de colisión. El plan clásico de enseñanza es **chaining**: cada cubo es una lista enlazada de celdas clave-valor.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de diseño orientado a objetos en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 7 cierra aquí con una estructura pequeña y clara que puedes dibujar en la pizarra.

---

## 1. Analogía cotidiana

Piensa en una pared de **buzones**, numerados de `0` a `capacity - 1`.

* Cada carta tiene una dirección. Aplicas una regla simple y obtienes un número de buzón.
* Dejas la carta en ese buzón.
* A veces dos cartas hashean al mismo número. Ese buzón guarda un **montón de cartas** (una cadena), no solo una.
* Para encontrar el correo de Alice, hasheas su dirección, abres ese buzón y recorres el montón hasta ver su nombre.
* Para quitar una carta, abres el mismo buzón y sacas esa carta del montón.

La pared es el array. Cada montón es una lista enlazada. La regla es tu función hash. Nunca buscas en toda la pared; solo recorres una cadena corta.

No estás construyendo `java.util.HashMap` con tree bins y heurísticas de resize. Modelas la idea con clases claras.

---

## 2. Problema en palabras simples

**Objetivo:** diseñar e implementar un **HashTable / HashMap** simple que use **chaining** (cubos de lista enlazada) para las colisiones.

**Operaciones centrales:**

* `put(key, value)`: insertar o actualizar
* `get(key)`: devolver el valor, o null / vacío si falta
* `remove(key)`: borrar el mapeo si existe

**Aclara en la entrevista:**

* Tipos de clave y valor? Genéricos `K` y `V` quedan limpios. Claves `null`? Suele prohibirse o tratarse aparte; elige una y dilo.
* Qué hace `put` si la clave ya existe? Actualiza el valor (semántica de mapa), no crea una segunda celda.
* Tipo de retorno de `get` / `remove`? Valor o boolean vale si lo dices.
* Capacidad fija o resize cuando la carga es alta? Fija basta para el primer boceto. Menciona el load factor como seguimiento.
* Thread safety? Un solo hilo salvo que pregunten.

**Forma de la jerarquía:**

```
HashMap<K, V>
  └── buckets: LinkedList<Cell<K, V>>[]   (or List of lists)
        └── Cell: key, value
```

Algunos llaman al nodo `Entry`. Misma idea: un objeto por mapeo, colgando en una cadena bajo un índice.

---

## 3. Pensar primero

### Por qué no un array plano de valores

Las claves no son enteros pequeños consecutivos. No puedes indexar por `key` directo con strings u objetos arbitrarios. El hashing lleva cualquier clave a `0 .. capacity - 1`.

### La colisión es normal

Un buen hash reparte las claves, pero dos claves distintas pueden producir el mismo índice. Eso es una **colisión**, no un bug.

Dos arreglos estándar:

| Estrategia | Idea | Nota de entrevista |
| --- | --- | --- |
| **Chaining** | Cada cubo guarda una lista de celdas | Fácil de codificar y explicar |
| **Open addressing** | Probar otros huecos del array | Menos punteros; el delete es más duro |

Este problema pide **chaining**. Quédate en listas salvo que te desvíen.

### Hash a índice de cubo

```
index = hashCode(key) % capacity
```

En Java, `hashCode()` puede ser negativo. Un resto negativo de `%` rompe el índice del array. Arréglalo:

```
index = (hashCode(key) & 0x7fffffff) % capacity
```

o

```
index = Math.floorMod(hashCode(key), capacity)
```

Cualquiera vale. Di por qué normalizas.

### put / get / remove recorren la misma cadena

1. Calcula `index` desde la clave.
2. Recorre la lista en `buckets[index]`.
3. Compara claves con `equals` (no `==` en objetos).
4. **put:** si la clave existe, sobrescribe el valor; si no, añade una celda.
5. **get:** si la clave existe, devuelve el valor; si no, null.
6. **remove:** si la clave existe, desenlaza esa celda; si no, no-op.

El tiempo medio es O(1 + longitud de cadena). El peor caso es O(n) si todo cae en un cubo (mal hash o claves adversarias).

### Capacidad y carga

`load factor ≈ n / capacity`. Cuando pasa de algo como 0.75, los mapas de producción hacen **resize** (nuevo array, rehash de todas las claves). En el boceto de entrevista, capacidad fija está bien si nombras resize como siguiente paso.

### Boceto en la pizarra

1. Dibuja un array de 4 cubos vacíos.
2. `put("apple", 1)` hashea al índice 1: la cadena es `apple→1`.
3. `put("apricot", 2)` también al 1: cadena `apple→1` luego `apricot→2`.
4. `get("apricot")` recorre el índice 1, salta apple, devuelve 2.
5. `remove("apple")` desenlaza la primera celda; apricot se queda.

---

## 4. Solución en Java

Versión de enseñanza con genéricos, capacidad fija y celdas simplemente enlazadas. `LinkedList` del JDK también sirve; un `next` explícito en `Cell` deja la cadena clara en pizarra.

```java
/**
 * Simple hash map with chaining.
 * Each bucket is a singly linked list of Cell nodes.
 */
public class ChainedHashMap<K, V> {
    private static class Cell<K, V> {
        final K key;
        V value;
        Cell<K, V> next;

        Cell(K key, V value, Cell<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private final Cell<K, V>[] buckets;
    private int size;

    @SuppressWarnings("unchecked")
    public ChainedHashMap(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("capacity must be positive");
        }
        // Generic array: allocate as Object[], cast once.
        buckets = (Cell<K, V>[]) new Cell[capacity];
        size = 0;
    }

    public ChainedHashMap() {
        this(16);
    }

    private int indexFor(K key) {
        int h = key.hashCode();
        // clear sign bit so % never yields a negative index
        return (h & 0x7fffffff) % buckets.length;
    }

    private Cell<K, V> findCell(K key) {
        int i = indexFor(key);
        for (Cell<K, V> c = buckets[i]; c != null; c = c.next) {
            if (c.key.equals(key)) {
                return c;
            }
        }
        return null;
    }

    /** Insert or update. Null keys rejected for simplicity. */
    public void put(K key, V value) {
        if (key == null) {
            throw new IllegalArgumentException("null key not supported");
        }
        Cell<K, V> existing = findCell(key);
        if (existing != null) {
            existing.value = value;
            return;
        }
        int i = indexFor(key);
        // insert at head: O(1), order inside the bucket does not matter for map ops
        buckets[i] = new Cell<>(key, value, buckets[i]);
        size++;
    }

    public V get(K key) {
        if (key == null) {
            return null;
        }
        Cell<K, V> c = findCell(key);
        return c == null ? null : c.value;
    }

    /**
     * True when the key is present. Needed if null values are allowed,
     * because get(key) == null is then ambiguous.
     */
    public boolean containsKey(K key) {
        if (key == null) {
            return false;
        }
        return findCell(key) != null;
    }

    /** Remove mapping if present. Returns true when a cell was removed. */
    public boolean remove(K key) {
        if (key == null) {
            return false;
        }
        int i = indexFor(key);
        Cell<K, V> prev = null;
        Cell<K, V> cur = buckets[i];
        while (cur != null) {
            if (cur.key.equals(key)) {
                if (prev == null) {
                    buckets[i] = cur.next;
                } else {
                    prev.next = cur.next;
                }
                size--;
                return true;
            }
            prev = cur;
            cur = cur.next;
        }
        return false;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}
```

Este boceto permite valores **null**. Si quieres código de entrevista más simple, prohíbe valores null y trata `get == null` como ausencia.

Demo paso a paso:

```java
public class HashTableDemo {
    public static void main(String[] args) {
        ChainedHashMap<String, Integer> map = new ChainedHashMap<>(4);

        map.put("apple", 1);
        map.put("banana", 2);
        map.put("apricot", 3); // may collide with apple depending on hash

        System.out.println(map.get("apple"));    // 1
        System.out.println(map.get("banana"));   // 2
        System.out.println(map.get("missing"));  // null

        map.put("apple", 10); // update
        System.out.println(map.get("apple"));    // 10
        System.out.println(map.size());          // 3

        System.out.println(map.remove("banana")); // true
        System.out.println(map.get("banana"));    // null
        System.out.println(map.size());           // 2
    }
}
```

| Paso | Llamada | Efecto |
| --- | --- | --- |
| inicio | capacity 4 | cubos vacíos |
| 1 | `put("apple", 1)` | celda nueva en `indexFor(apple)` |
| 2 | `put("banana", 2)` | celda nueva (mismo u otro cubo) |
| 3 | `put("apricot", 3)` | la cadena crece si hay colisión |
| 4 | `put("apple", 10)` | misma celda, valor sobrescrito, size sigue 3 |
| 5 | `remove("banana")` | desenlaza celda, size 2 |

Si el entrevistador prefiere listas del JDK en lugar de un `next` a mano:

```java
// sketch: buckets as List<Cell>[]
List<Cell<K, V>> bucket = buckets[i];
if (bucket == null) {
    bucket = new LinkedList<>();
    buckets[i] = bucket;
}
for (Cell<K, V> c : bucket) {
    if (c.key.equals(key)) {
        c.value = value;
        return;
    }
}
bucket.add(new Cell<>(key, value, null));
```

Misma asintótica. Un `next` explícito se ve mejor cuando debes mostrar remove con punteros prev/cur.

---

## 5. Tabla de complejidad

| Operación | Tiempo medio | Peor tiempo | Espacio extra | Notas |
| --- | --- | --- | --- | --- |
| `put` (clave nueva) | O(1 + α) | O(n) | O(1) | α ≈ load factor / longitud de cadena |
| `put` (update) | O(1 + α) | O(n) | O(1) | camina hasta key equals |
| `get` | O(1 + α) | O(n) | O(1) | mismo recorrido |
| `remove` | O(1 + α) | O(n) | O(1) | desenlaza con prev |
| Construcción | O(capacity) | O(capacity) | O(capacity) | array vacío de cabezas |
| Almacenar n pares | - | - | O(n + capacity) | celdas + array de cubos |

Los entrevistadores quieren que nombres chaining, uses `hash` y luego `equals`, y separes update de insert. Resize es un buen seguimiento, no obligatorio en el primer pase.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **Clave null:** lanza o usa un hueco dedicado. No llames `key.hashCode()` sobre null.
* **Valor null:** permitido en este boceto. Entonces `get == null` es ambiguo; usa `containsKey` u `Optional`.
* **put duplicado:** debe actualizar, no subir size dos veces.
* **Remove de la cabeza de la cadena:** `buckets[i] = cur.next`, no solo `prev.next = ...`.
* **Remove de clave ausente:** devuelve false / null; no decrementar size.
* **hashCode negativo:** normaliza antes de `%` o tendrás `ArrayIndexOutOfBoundsException`.
* **capacity = 1:** todas las claves colisionan; el mapa sigue correcto, solo una lista larga.
* **Mal contrato `equals` / `hashCode`** en claves propias: claves iguales deben compartir hashCode o se rompe el lookup.
* **Iterator / mutación concurrente:** fuera de alcance salvo que pregunten.

Errores comunes:

1. **Usar `==` para comparar claves.** Strings y tipos boxed necesitan `equals`.
2. **Olvidar el camino de update en `put`.** Dos celdas con la misma clave; `get` devuelve la primera y size miente.
3. **Remove roto en el primer nodo.** El puntero cabeza nunca se actualiza.
4. **`hash % capacity` con hash negativo.** Crash de índice.
5. **Construir open addressing por accidente** (linear probe) después de decir "chaining."
6. **Resize sin rehash.** Copiar cabezas de lista a un array más grande deja índices malos.

Idea mínima de smoke:

```java
ChainedHashMap<String, Integer> m = new ChainedHashMap<>(2);
m.put("a", 1);
m.put("b", 2);
m.put("a", 3);
assert m.get("a") == 3;
assert m.size() == 2;
assert m.remove("b");
assert m.get("b") == null;
assert m.size() == 1;
assert !m.remove("b");
```

---

## 7. Resumen para contárselo a un amigo

Tabla hash con chaining, versión entrevista:

1. Array de cubos. Cada cubo es una **lista enlazada** de celdas clave-valor.
2. `index = normalize(hashCode(key)) % capacity`.
3. **put:** recorre la cadena; actualiza si la clave existe, si no añade celda (insertar al head vale).
4. **get:** recorre la cadena; devuelve valor o null.
5. **remove:** recorre con prev/cur; desenlaza y decrementa size.
6. Media O(1) si las cadenas se mantienen cortas. Peor O(n) si todo colisiona.
7. Seguimientos: resize por load factor, política de null, open addressing, thread safety.

Si puedes dibujar cuatro cubos, colgar dos claves en colisión en una lista, y escribir put/get/remove sin bugs de remove, dominas el problema 7.12. El OOD del capítulo 7 cierra con una estructura que reutilizarás en todas partes.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [File System](/blog/es/ctci-7-11-file-system)
* Siguiente: [Triple Step](/blog/es/ctci-8-1-triple-step)