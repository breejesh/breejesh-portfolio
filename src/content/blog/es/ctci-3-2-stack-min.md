---
title: "Stack Min: push, pop y min() en O(1) (Java)"
description: "Problema estilo CTCI 3.2 para principiantes: diseña una pila que devuelve el mínimo actual en tiempo constante. Lleva el mínimo con una segunda pila (o min-hasta-ahora en cada nodo), en Java claro."
date: "2025-11-29"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-2-stack-min.webp
previewImage: /assets/images/ctci-3-2-stack-min.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 3.2 para principiantes: diseña una pila que devuelve el mínimo actual en tiempo constante. Lleva el mínimo con una segunda pila (o min-hasta-ahora en cada nodo), en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Guardas fichas de puntuación en un vaso. Solo añades una ficha arriba o quitas la de arriba. A veces un amigo pregunta: "¿Cuál es la puntuación más baja en el vaso ahora?" Si vacías todo para mirar, es lento. Si mantienes un segundo vaso más pequeño que solo guarda nuevos mínimos, respondes de un vistazo. Ese segundo vaso es la idea de **Stack Min**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clásicas de pilas en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 3, pilas y colas.

---

## 1. Analogía cotidiana

Una pila normal es un montón de platos: el último en entrar es el primero en salir. Siempre ves el plato de arriba. **No** sabes automáticamente cuál es el plato más barato enterrado debajo.

Stack Min añade una regla: en cualquier momento debes conocer el **valor más pequeño que sigue en la pila**, sin recorrerla.

* **push(x):** pon x arriba.
* **pop():** quita la cima.
* **min():** devuelve el mínimo actual entre todos los valores apilados. Debe seguir siendo rápido aunque la pila sea profunda.

El truco no es una búsqueda ingeniosa. Es **recordar el historial de nuevos mínimos** al hacer push, y **olvidar un mínimo** solo cuando haces pop del valor que lo creó.

---

## 2. Problema en palabras simples

**Construye** una pila de enteros con tres operaciones, cada una en tiempo **O(1)**:

| Operación | Significado |
| --- | --- |
| `push(value)` | apilar |
| `pop()` | quitar y devolver la cima |
| `min()` | devolver el valor más pequeño que hay ahora en la pila (sin quitarlo) |

Ayudas opcionales: `peek()`, `isEmpty()`. Mismos objetivos de complejidad.

**Ejemplos:**

| Acción | Pila (fondo → cima) | min() |
| --- | --- | --- |
| push 5 | 5 | 5 |
| push 3 | 5, 3 | 3 |
| push 7 | 5, 3, 7 | 3 |
| push 3 | 5, 3, 7, 3 | 3 |
| pop | 5, 3, 7 | 3 |
| pop | 5, 3 | 3 |
| pop | 5 | 5 |

**Aclara antes de codificar:**

* ¿Solo enteros en este post? (Sí. El mismo patrón vale para cualquier tipo comparable.)
* ¿Qué pasa si `min()` o `pop()` se llama con la pila vacía? (Lanzar, p. ej. `EmptyStackException`.)
* ¿Se permiten duplicados? (Sí. Es una trampa habitual del rastreador de mínimos.)
* ¿`min()` deja la pila igual? (Sí. Solo `pop` quita elementos.)

---

## 3. Pensar primero

### Por qué una sola pila no basta

Si solo guardas valores, `min()` necesita un recorrido completo: O(N). Podrías recalcular el mínimo en cada pop recorriendo otra vez. Sigue sin ser O(1). Cachear un campo `currentMin` falla en el pop: cuando quitas el mínimo actual, ya no sabes cuál era el mínimo *anterior* si no lo guardaste.

### Enfoque A: segunda pila de mínimos (solución principal)

Mantén dos pilas:

1. **`values`:** los datos reales, LIFO normal.
2. **`mins`:** solo el historial de mínimos.

Reglas:

* En **push(x):**
  1. Siempre apila `x` en `values`.
  2. Si `mins` está vacía **o** `x <= mins.peek()`, también apila `x` en `mins`.
* En **pop():**
  1. Haz pop de `values`.
  2. Si ese valor **es igual** a `mins.peek()`, haz pop de `mins` también.
* En **min():** devuelve `mins.peek()` (tras comprobar vacío).

Usa `<=` (no `<`) al decidir si registras un nuevo mínimo. Así cada copia de un mínimo duplicado tiene su propia entrada en `mins`, y cada pop de un duplicado quita una entrada de forma correcta.

### Enfoque B: el nodo guarda min-hasta-ahora

Cada nodo de la pila guarda `(value, minWhenThisWasPushed)`. Al hacer push de `x`, el min del nuevo nodo es `min(x, previousTop.min)` (o solo `x` si la pila estaba vacía). Entonces `min()` es `top.min` en O(1). El espacio sigue siendo O(N): un int extra por nodo en lugar de una segunda pila que a menudo es más corta.

Ambos valen en entrevista. La segunda pila es fácil de dibujar. El campo en el nodo es compacto si ya controlas el tipo de nodo.

### Qué no hacer

* Ordenar la pila (rompe el orden LIFO).
* Recorrer en cada llamada a `min()` (no cumple O(1)).
* Guardar solo el primer mínimo y no actualizarlo (falla tras pushes mayores y tras hacer pop del mínimo).

---

## 4. Solución en Java

Diseño principal: dos pilas. Usa `java.util.Stack` por claridad en entrevistas; en producción a menudo preferirías `ArrayDeque`.

```java
import java.util.EmptyStackException;
import java.util.Stack;

/**
 * Stack that supports push, pop, peek, and min in O(1) time.
 * mins holds a history of new (or equal) minima.
 */
class StackWithMin {
    private final Stack<Integer> values = new Stack<>();
    private final Stack<Integer> mins = new Stack<>();

    public void push(int value) {
        values.push(value);
        if (mins.isEmpty() || value <= mins.peek()) {
            mins.push(value);
        }
    }

    public int pop() {
        if (values.isEmpty()) {
            throw new EmptyStackException();
        }
        int value = values.pop();
        if (value == mins.peek()) {
            mins.pop();
        }
        return value;
    }

    public int min() {
        if (mins.isEmpty()) {
            throw new EmptyStackException();
        }
        return mins.peek();
    }

    public int peek() {
        if (values.isEmpty()) {
            throw new EmptyStackException();
        }
        return values.peek();
    }

    public boolean isEmpty() {
        return values.isEmpty();
    }
}
```

Recorrido con push 5, 3, 7, 3 y dos pops:

| Paso | values (fondo → cima) | mins | min() |
| --- | --- | --- | --- |
| push 5 | 5 | 5 | 5 |
| push 3 | 5, 3 | 5, 3 | 3 |
| push 7 | 5, 3, 7 | 5, 3 | 3 |
| push 3 | 5, 3, 7, 3 | 5, 3, 3 | 3 |
| pop (3) | 5, 3, 7 | 5, 3 | 3 |
| pop (7) | 5, 3 | 5, 3 | 3 |

Fíjate: 7 nunca entró en `mins`. El segundo 3 sí, así que el primer pop de 3 deja min = 3.

### Esbozo alternativo: min en cada nodo

```java
class NodeWithMin {
    final int value;
    final int min; // smallest value in the stack when this node is at the top

    NodeWithMin(int value, int min) {
        this.value = value;
        this.min = min;
    }
}

class StackWithMinNodes {
    private final Stack<NodeWithMin> stack = new Stack<>();

    public void push(int value) {
        int newMin = stack.isEmpty() ? value : Math.min(value, stack.peek().min);
        stack.push(new NodeWithMin(value, newMin));
    }

    public int pop() {
        return stack.pop().value;
    }

    public int min() {
        return stack.peek().min;
    }
}
```

Mismas operaciones O(1). El espacio extra es siempre un int por elemento, no una pila de mínimos más corta.

---

## 5. Tabla de complejidad

| Enfoque | push | pop | min | Espacio extra | Notas |
| --- | --- | --- | --- | --- | --- |
| Recorrer toda la pila para min | O(1) | O(1) | O(N) | O(1) | no cumple el enunciado |
| Recalcular min solo en pop | O(1) | O(N) | O(1) | O(1) | sigue sin ser todo O(1) |
| Segunda pila de mínimos | O(1) | O(1) | O(1) | O(N) peor, a menudo menos | respuesta principal aquí |
| Campo min en cada nodo | O(1) | O(1) | O(1) | O(N) siempre | limpio si controlas el nodo |

N es el número de elementos en la pila. Las dos buenas respuestas usan memoria extra lineal en el peor caso. Es lo esperado: pagas espacio por un min en tiempo constante.

---

## 6. Casos límite y errores habituales

Los entrevistadores tocan estos:

* **Pila vacía y luego min() o pop()** → lanzar. No devuelvas un número mágico como `Integer.MAX_VALUE` salvo que el problema lo diga.
* **Un solo elemento** → un push, min es ese valor, un pop deja vacío, no llames a min sin comprobar.
* **Duplicados del mínimo** → usa `<=` al apilar en `mins`. Si solo apilas con `<` estricto, dos copias del mismo min se rompen tras el primer pop de ese valor.
* **Secuencia estrictamente creciente** (1, 2, 3, 4) → `mins` solo guarda 1. Bien.
* **Secuencia estrictamente decreciente** (4, 3, 2, 1) → cada push actualiza el min. `mins` crece con `values`.
* **Pop del mínimo global y queda una cima mayor** → el mínimo anterior debe reaparecer del historial (o del campo min del nodo anterior).

Errores comunes:

1. **Usar `<` en lugar de `<=` para la pila de mínimos.** Los mínimos duplicados fallan.
2. **Hacer siempre pop de `mins` en cada `pop`.** Incorrecto cuando el valor sacado no era el min actual.
3. **Olvidar comprobaciones de vacío** antes de `peek` en cualquiera de las dos pilas.
4. **Devolver min recorriendo `values`** y llamarlo O(1) de todas formas.
5. **Mutar la pila dentro de `min()`.** `min` es una consulta, no una operación destructiva.

---

## 7. Resumen para contárselo a un amigo

Stack Min pide una pila donde push, pop y "¿cuál es el valor más pequeño ahora?" son todos tiempo constante.

1. Una pila simple no responde min sin un recorrido.
2. Mantén una segunda pila de mínimos (o guarda min-hasta-ahora en cada nodo).
3. En push, registra un nuevo min solo si el valor es menor o igual que el min anterior.
4. En pop, quita una entrada de min solo si el valor que salió era ese min.
5. Cuidado con pilas vacías y mínimos duplicados. Ahí suelen estar los bugs.

Si puedes dibujar las dos pilas para push 5, 3, 7, 3 y explicar por qué importa el segundo 3, dominas el problema 3.2.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Three in One](/blog/es/ctci-3-1-three-in-one)
* Siguiente: [Stack of Plates](/blog/es/ctci-3-3-stack-of-plates)