---
title: "Triple Step: contar formas de subir n escalones con saltos de 1, 2 o 3 (Java)"
description: "Problema estilo CTCI 8.1 para principiantes: un niño sube n escalones con pasos de 1, 2 o 3. Cuenta las formas con recursión, memoización y DP bottom-up en Java."
date: "2026-01-04"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-1-triple-step.webp
previewImage: /assets/images/ctci-8-1-triple-step.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.1 para principiantes: un niño sube n escalones con pasos de 1, 2 o 3. Cuenta las formas con recursión, memoización y DP bottom-up en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un niño sube una escalera de **n** peldaños. En cada movimiento puede dar **1**, **2** o **3** escalones. El orden importa: 1 y luego 2 no es lo mismo que 2 y luego 1. Cuántas formas distintas hay de llegar arriba?

Este es el calentamiento clásico de **recursión y programación dinámica**. Primero escribes la recurrencia, ves explotar el árbol de llamadas, y luego cacheas respuestas (memo) o llenas un array de abajo arriba (bottom-up). Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de entrevista sobre subir escaleras, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 8 empieza aquí.

---

## 1. Analogía cotidiana

Piensa en un niño en una escalera de juego con `n` peldaños hasta la plataforma.

* Desde cualquier altura puede saltar uno, dos o tres peldaños (si quedan suficientes).
* Cada secuencia de saltos es una "ruta" distinta, aunque usen los mismos tamaños en otro orden.
* En una escalera corta listas todas las secuencias a mano.
* En una alta, listar muere. Notas: el número de formas de terminar desde la altura `i` solo depende de las formas desde `i-1`, `i-2` e `i-3`.

Esa última frase es todo el algoritmo. Cuando confías en la recurrencia, la memoización y el DP bottom-up son solo dos formas de calcularla sin repetir trabajo.

---

## 2. Problema en palabras simples

**Entrada:** un entero no negativo `n` (número de escalones).

**Salida:** el número de formas de subir `n` escalones con pasos de tamaño 1, 2 o 3 solamente. El orden importa.

**Forma de la firma:**

```java
long countWays(int n);
```

Usa `long` (o `BigInteger` para `n` enorme) porque la respuesta crece rápido. En entrevistas a menudo usan `int` para `n` pequeño; di el riesgo de overflow en voz alta.

**Valores pequeños que debes saber de memoria:**

| n | Formas | Secuencias (boceto) |
| --- | --- | --- |
| 0 | 1 | una forma vacía: ya estás arriba |
| 1 | 1 | `(1)` |
| 2 | 2 | `(1,1)`, `(2)` |
| 3 | 4 | `(1,1,1)`, `(1,2)`, `(2,1)`, `(3)` |
| 4 | 7 | cuatro con último salto 1, dos con último 2, una con último 3 |

Para `n = 4`, un último salto de 1 significa que los tres primeros tenían 4 formas; último 2, los dos primeros tenían 2; último 3, el primero tenía 1. Total `4 + 2 + 1 = 7`.

**Aclara en la entrevista:**

* Se permite `n = 0`? Caso base habitual de enseñanza: **1** forma (no hacer nada). Algunos dicen 0; elige una y sé coherente con la recurrencia.
* Importa el orden? **Sí.** Combinaciones vs permutaciones: aquí importan las secuencias.
* Solo pasos `{1,2,3}`? Sí en este problema. Generaliza después si preguntan.
* Tipo de retorno y overflow? Dilos.
* `n` negativo? Inválido; devuelve 0 o lanza.

---

## 3. Piensa primero

### Recurrencia

Sea `ways(n)` el número de formas de subir `n` escalones.

Para terminar `n` escalones, el **último salto** fue 1, 2 o 3 (cuando `n` es lo bastante grande):

```
ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)   for n > 3
```

Casos base (con el modelo "subida vacía cuenta como 1"):

```
ways(0) = 1
ways(1) = 1
ways(2) = 2
```

También puedes poner:

```
ways(0) = 1
ways(negative) = 0
```

y usar una sola fórmula recursiva para todo `n > 0`:

```
ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)
```

con los negativos aportando cero. Mismos números.

### Por qué la recursión ingenua es lenta

```
ways(5)
  ways(4)
    ways(3) ...
    ways(2) ...
    ways(1) ...
  ways(3) ...
  ways(2) ...
```

`ways(3)` se calcula muchas veces. El árbol de llamadas es exponencial. Vale para `n ≤ 10` en la pizarra; muere con `n` mayor.

### Memoización (DP top-down)

Misma estructura recursiva, pero guardas `ways(i)` la primera vez que lo calculas. Llamadas posteriores devuelven el valor guardado. Cada `i` de `0` a `n` se llena una vez, así que el tiempo pasa a ser lineal.

### DP bottom-up

Reserva un array `dp[0..n]`. Pon los casos base y luego, para `i = 3..n` (o `i = 1..n` con negativos cuidadosos):

```
dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]
```

Sin pila de recursión. Fácil de optimizar a tres variables rodantes si solo necesitas `ways(n)`.

### Relación con Fibonacci

Subir con solo `1` o `2` es Fibonacci. Triple step es la misma idea con una recurrencia de tres términos (estilo tribonacci). El nombre es opcional; lo que importa es la recurrencia.

---

## 4. Solución en Java

### Recursión ingenua (muestra, luego mejora)

```java
// Exponential. Good for teaching the recurrence only.
long countWaysNaive(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    return countWaysNaive(n - 1)
        + countWaysNaive(n - 2)
        + countWaysNaive(n - 3);
}
```

### Top-down con array memo

```java
long countWaysMemo(int n) {
    if (n < 0) {
        return 0;
    }
    long[] memo = new long[n + 1];
    java.util.Arrays.fill(memo, -1);
    return ways(n, memo);
}

long ways(int n, long[] memo) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (memo[n] != -1) {
        return memo[n];
    }
    memo[n] = ways(n - 1, memo)
        + ways(n - 2, memo)
        + ways(n - 3, memo);
    return memo[n];
}
```

`memo[i] == -1` significa "aún no calculado." Tras el primer relleno, cada subproblema es O(1).

### Array bottom-up

```java
long countWaysBottomUp(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }

    // dp[i] = ways to climb i stairs
    long[] dp = new long[n + 1];
    dp[0] = 1;
    if (n >= 1) {
        dp[1] = 1;
    }
    if (n >= 2) {
        dp[2] = 2;
    }

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
    }
    return dp[n];
}
```

### Bottom-up con espacio extra O(1)

Solo necesitas los tres últimos valores:

```java
long countWaysRolling(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (n == 1) {
        return 1;
    }
    if (n == 2) {
        return 2;
    }

    long a = 1; // ways(0) after shift thinking, or track ways(i-3)
    long b = 1; // ways(1)
    long c = 2; // ways(2)
    // After loop for i, c holds ways(i)
    for (int i = 3; i <= n; i++) {
        long next = a + b + c;
        a = b;
        b = c;
        c = next;
    }
    return c;
}
```

Recorrido para `n = 4`:

| i | a (i-3) | b (i-2) | c (i-1) | next |
| --- | --- | --- | --- | --- |
| inicio | 1 | 1 | 2 | |
| 3 | 1 | 2 | 4 | 1+1+2=4 |
| 4 | 2 | 4 | 7 | 1+2+4=7 |

Respuesta `7`. Coincide con la tabla.

### Comprobaciones mínimas

```java
assert countWaysBottomUp(0) == 1;
assert countWaysBottomUp(1) == 1;
assert countWaysBottomUp(2) == 2;
assert countWaysBottomUp(3) == 4;
assert countWaysBottomUp(4) == 7;
assert countWaysBottomUp(5) == 13;
assert countWaysMemo(10) == countWaysBottomUp(10);
assert countWaysRolling(10) == countWaysBottomUp(10);
assert countWaysNaive(5) == 13;
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Recursión ingenua | O(3^n) aprox. | O(n) pila | Solo para enseñar |
| Memo top-down | O(n) | O(n) memo + pila | Misma recurrencia, cacheada |
| Array bottom-up | O(n) | O(n) | Claro y amigable en entrevista |
| Tres variables rodantes | O(n) | O(1) | Mejor espacio si solo necesitas `ways(n)` |

Todos los métodos lineales visitan cada subproblema un número constante de veces. El árbol exponencial es lo que debes señalar y arreglar.

---

## 6. Casos límite y errores comunes

Los entrevistadores empujan aquí:

* **`n = 0`:** 1 con el modelo de forma vacía; di tu elección.
* **`n = 1, 2, 3`:** hardcodea o deriva con cuidado para que el bucle no lea fuera del array.
* **`n` negativo:** devuelve 0 (o rechaza).
* **`n` grande:** `int` desborda pasados valores de dos dígitos pequeños; prefiere `long` y menciona aritmética modular si quieren "formas mod 10^9+7".
* **Off-by-one en el bucle:** `for (i = 3; i <= n; i++)` necesita `dp` de tamaño `n + 1`.
* **Tratar el orden como irrelevante:** `(1,2)` y `(2,1)` son dos formas, no una combinación.
* **Base incorrecta para `ways(0)`:** si pones `ways(0) = 0`, toda la tabla se desplaza; sé coherente con el argumento del último salto.
* **Memo sin inicializar:** usa un centinela (`-1`) o un flag "visto" para que `0` no confunda "aún no calculado" con un valor real cuando aplique.

Errores comunes:

1. **Escribir Fibonacci de dos pasos** cuando el problema permite tres.
2. **Olvidar `ways(n - 3)`** en la suma.
3. **Devolver sin cachear** en la versión memo (anula el punto).
4. **Overflow de enteros** que da respuestas silenciosamente malas cerca de `n` 40+.
5. **Confundir "número de formas" con "mínimo de saltos"** (otro problema).

---

## 7. Resumen para un amigo

Triple step en un aliento:

1. El último salto es 1, 2 o 3, así que `ways(n) = ways(n-1) + ways(n-2) + ways(n-3)`.
2. Base: `ways(0)=1`, `ways(1)=1`, `ways(2)=2` (y los negativos son 0).
3. La recursión ingenua recomputa los mismos subproblemas sin fin. Cachéalos o construye bottom-up.
4. El array bottom-up es la respuesta limpia en pizarra. Tres variables rodantes es el pulido de espacio.
5. Cuentas **secuencias**, no multiconjuntos sin orden. Cuidado con el overflow.

Si puedes escribir la recurrencia, llenar `dp[0..n]` para `n = 5` a mano (respuesta 13) y explicar por qué el memo vuelve lineal lo exponencial, dominas el problema 8.1. El capítulo 8 está abierto: sigue un robot que camina por una rejilla con celdas bloqueadas.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Hash Table](/blog/es/ctci-7-12-hash-table)
* Siguiente: [Robot in a Grid](/blog/es/ctci-8-2-robot-in-a-grid)