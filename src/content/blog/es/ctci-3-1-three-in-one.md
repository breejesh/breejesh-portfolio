---
title: "Three in One: tres pilas en un solo array (Java)"
description: "Problema estilo CTCI 3.1 para principiantes: implementa tres pilas con un solo array. Trozo fijo e igual, array sizes[], y un FixedMultiStack claro en Java."
date: "2026-03-12"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 3.1 para principiantes: implementa tres pilas con un solo array. Trozo fijo e igual, array sizes[], y un FixedMultiStack claro en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes una estantería larga y tres compañeros de piso. Cada uno recibe un tramo fijo para su propia pila de libros. Nunca metes los libros de A en el tramo de B. Cuando un tramo está lleno, esa persona se queda sin sitio aunque los otros aún tengan hueco. Eso es **tres pilas en un array** con división fija.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de multi-pila en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí empieza el capítulo 3 (pilas y colas).

---

## 1. Analogía cotidiana

Imagina una franja de aparcamiento con **tres zonas iguales** pintadas en el asfalto:

* La zona 0 guarda coches de la pila 0.
* La zona 1 guarda coches de la pila 1.
* La zona 2 guarda coches de la pila 2.

Cada zona se llena desde su borde izquierdo hacia la derecha. Un contador de **tamaño** por zona dice cuántos coches hay ya. No necesitas un puntero de cima aparte si guardas tamaños: la cima de la pila `k` está en la última ranura ocupada de esa zona.

Si la zona 0 está llena, rechazas el siguiente coche de la pila 0. Los huecos de la zona 2 no ayudan. Ese es el trade-off de la división fija: matemática simple, espacio desperdiciado cuando la carga es desigual.

Hay una versión más dura en la que las paredes de zona pueden deslizarse (división flexible). La mencionamos en breve. El valor por defecto en entrevista para principiantes son partes fijas e iguales.

---

## 2. Problema en palabras simples

**Entrada / objetivo:** Diseñar una estructura que implemente **tres pilas** usando **un solo** array subyacente.

**Operaciones** (cada una recibe un número de pila `0`, `1` o `2`):

* `push(stackNum, value)`: apilar en esa pila
* `pop(stackNum)`: quitar y devolver la cima
* `peek(stackNum)`: devolver la cima sin quitarla
* `isEmpty(stackNum)` / `isFull(stackNum)`: comprobaciones de capacidad

**Enfoque principal de este post:** división fija. Parte el array en tres bloques contiguos e iguales de capacidad `stackCapacity`. Controla cuán lleno está cada bloque con `sizes[3]`.

**Aclara antes de codificar:**

* Los índices de pila son `0`, `1`, `2` (base cero).
* La longitud total del array es `3 * stackCapacity`.
* ¿Qué pasa al hacer push si está llena? Lanzar (o devolver error). Misma idea en pop si está vacía.
* ¿Las pilas son independientes? Sí. Un push en la pila 0 no debe corromper la pila 1.

**Esquema con `stackCapacity = 4` (array de longitud 12):**

| Índices | Pila | Significado |
| --- | --- | --- |
| `0..3` | 0 | primer tramo |
| `4..7` | 1 | segundo tramo |
| `8..11` | 2 | tercer tramo |

Si la pila 1 tiene tamaño 2, sus valores están en los índices `4` y `5`, y la cima está en el índice `5`.

---

## 3. Pensar primero (fijo vs flexible)

### División fija (enseña esto primero)

1. Reserva `values = new int[stackCapacity * 3]`.
2. Mantén `sizes = new int[3]`, todo a cero al inicio.
3. El **offset** de la pila `stackNum` es `stackNum * stackCapacity`.
4. El **índice de la cima** tras un push correcto (o para peek/pop) es `offset + sizes[stackNum] - 1`.
5. Push: si está llena, falla. Si no, incrementa tamaño y escribe en el nuevo índice de cima.
6. Pop: si está vacía, falla. Si no, lee la cima, limpia esa ranura (opcional) y decrementa tamaño.
7. Peek: si está vacía, falla. Si no, devuelve `values[indexOfTop]`.

¿Por qué tamaños en lugar de tres punteros de cima? Son equivalentes. El tamaño es el número de elementos vivos; el índice de cima es función del offset y del tamaño. Un array pequeño de tres ints es fácil de razonar en entrevista.

### División flexible / dinámica (idea opcional más dura)

Si una pila crece mucho y otra se queda vacía, los tramos fijos desperdician celdas. Un diseño flexible deja que las pilas se expandan al espacio libre: rastreas límites start/end por pila y puede que desplaces elementos cuando un vecino necesita sitio. Correcto, pero más código (límites, desplazamientos, detectar array lleno entre todas las pilas). Menciónalo si el entrevistador pregunta "¿podemos usar mejor el espacio?" Ofrece fijo primero salvo que quieran la versión dura.

Para este artículo, entrega **fijo**.

### Matemática de índices a memorizar

```
offset(stackNum)     = stackNum * stackCapacity
indexOfTop(stackNum) = offset + sizes[stackNum] - 1
isEmpty              = sizes[stackNum] == 0
isFull               = sizes[stackNum] == stackCapacity
```

Dibuja una fila de doce cajas en la pizarra y recorre un push/pop en la pila 1. Si los índices cuadran, la clase casi se escribe sola.

---

## 4. Solución en Java

```java
/**
 * Three stacks packed into one array with fixed equal slices.
 * stackNum is 0, 1, or 2.
 */
class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    FixedMultiStack(int stackCapacity) {
        if (stackCapacity <= 0) {
            throw new IllegalArgumentException("stackCapacity must be positive");
        }
        this.stackCapacity = stackCapacity;
        this.values = new int[stackCapacity * numberOfStacks];
        this.sizes = new int[numberOfStacks]; // all 0
    }

    void push(int stackNum, int value) {
        assertValidStack(stackNum);
        if (isFull(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is full");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    int pop(int stackNum) {
        assertValidStack(stackNum);
        if (isEmpty(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is empty");
        }
        int top = indexOfTop(stackNum);
        int value = values[top];
        values[top] = 0; // optional clear; helps debugging
        sizes[stackNum]--;
        return value;
    }

    int peek(int stackNum) {
        assertValidStack(stackNum);
        if (isEmpty(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is empty");
        }
        return values[indexOfTop(stackNum)];
    }

    boolean isEmpty(int stackNum) {
        assertValidStack(stackNum);
        return sizes[stackNum] == 0;
    }

    boolean isFull(int stackNum) {
        assertValidStack(stackNum);
        return sizes[stackNum] == stackCapacity;
    }

    /** Absolute index of the current top element for this stack. */
    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        return offset + sizes[stackNum] - 1;
    }

    private void assertValidStack(int stackNum) {
        if (stackNum < 0 || stackNum >= numberOfStacks) {
            throw new IllegalArgumentException("stackNum must be 0, 1, or 2");
        }
    }
}
```

Recorrido con `stackCapacity = 3` (array de longitud 9):

| Paso | Llamada | sizes | Escritura / lectura en cima |
| --- | --- | --- | --- |
| inicio | (vacío) | `[0,0,0]` | - |
| 1 | `push(0, 10)` | `[1,0,0]` | escribe `values[0] = 10` |
| 2 | `push(0, 20)` | `[2,0,0]` | escribe `values[1] = 20` |
| 3 | `push(1, 99)` | `[2,1,0]` | escribe `values[3] = 99` |
| 4 | `peek(0)` | sin cambios | lee `20` en el índice `1` |
| 5 | `pop(0)` | `[1,1,0]` | devuelve `20`, limpia índice `1` |
| 6 | `push(0, 30)` | `[2,1,0]` | escribe `values[1] = 30` |

La pila 0 nunca toca los índices `3..8`. La pila 1 nunca toca `0..2` ni `6..8`.

---

## 5. Tabla de complejidad

| Operación | Tiempo | Espacio extra además del array compartido | Notas |
| --- | --- | --- | --- |
| `push` / `pop` / `peek` | O(1) | O(1) | solo aritmética + acceso al array |
| `isEmpty` / `isFull` | O(1) | O(1) | lee una entrada de `sizes` |
| Construcción | O(N) | O(1) además del array | `N = 3 * stackCapacity` al asignar |
| Multi-pila fija en total | - | O(N) en values + O(1) en sizes (3 ints) | celdas desperdiciadas si la carga es desigual |
| Multi-pila flexible (idea) | push puede ser O(N) si desplaza | más contabilidad | mejor uso de espacio, código más duro |

En entrevista suelen querer ops en tiempo constante y la matemática de índices bien hecha. El desplazamiento flexible es un follow-up, no la primera solución.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan estos:

* **`stackCapacity = 1`:** cada pila guarda un valor. El segundo push en la misma pila debe fallar.
* **Pop / peek en vacío:** lanza (o devuelve un centinela si lo acordasteis). Nunca leas `indexOfTop` con size 0; ese índice sería `offset - 1`, incorrecto y puede cruzar a otra pila.
* **Push en llena:** lanza. No sobrescribas en silencio.
* **`stackNum` inválido:** rechaza fuera de `{0,1,2}`.
* **Independencia:** llenar la pila 2 debe dejar la pila 0 vacía y usable.
* **Capacidad cero o negativa:** rechaza en el constructor.
* **Pop y luego push otra vez:** el size baja y sube; se reutiliza el mismo índice. Es el comportamiento correcto de una pila.

Errores frecuentes:

1. **Usar `offset + size` como cima sin restar 1.** Cuando size pasa a 1, la cima está en `offset + 0`, no en `offset + 1`.
2. **Incrementar size después de escribir con el size viejo.** El orden importa: o incrementas primero y escribes en `indexOfTop`, o escribes en `offset + size` y luego incrementas. Elige uno y sé consistente. El código de arriba incrementa primero.
3. **Compartir un solo puntero de cima para las tres pilas.** Eso es una pila, no tres.
4. **Olvidar `isFull` antes del push.** Pisarás el siguiente tramo.
5. **Dejar que la pila 0 crezca más allá de su tramo hacia la pila 1.** La división fija lo prohíbe; aplica capacidad por pila.

Boceto mínimo de smoke test:

```java
void demo() {
    FixedMultiStack stacks = new FixedMultiStack(2);
    stacks.push(0, 1);
    stacks.push(0, 2);
    // stacks.push(0, 3); // would throw: full
    stacks.push(2, 9);
    assert stacks.pop(0) == 2;
    assert stacks.peek(0) == 1;
    assert stacks.pop(2) == 9;
    assert stacks.isEmpty(1);
}
```

---

## 7. Resumen para contárselo a un amigo

Three in One pregunta: ¿puedes meter tres pilas independientes en un solo array?

1. Parte el array en tres tramos iguales de longitud `stackCapacity`.
2. Mantén `sizes[3]`. La cima de la pila `k` vive en `k * stackCapacity + sizes[k] - 1`.
3. Push solo si no está llena: sube size, escribe en la cima. Pop solo si no está vacía: lee cima, limpia, baja size.
4. Todas las ops son O(1). El coste es espacio desperdiciado cuando una pila está caliente y otra quieta.
5. Paredes flexibles que roban celdas libres son un follow-up más duro. Empieza con tramos fijos salvo que pidan otra cosa.

Si puedes dibujar los tres tramos, decir la fórmula del índice de cima y rechazar pushes llenos sin que las pilas se pisen, dominas el problema 3.1.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Loop Detection](/blog/es/ctci-2-8-loop-detection)
* Siguiente: [Stack Min](/blog/es/ctci-3-2-stack-min)