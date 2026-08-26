---
title: "100 casilleros: ¿cuáles quedan abiertos tras 100 conmutaciones? (Java)"
description: "Problema estilo CTCI 6.9 para principiantes: 100 casilleros cerrados, 100 personas conmutan cada i-ésima puerta. Los abiertos son cuadrados perfectos (1, 4, 9, ..., 100) porque solo los cuadrados tienen un número impar de factores. Simulación opcional en Java."
date: "2026-06-17"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-9-100-lockers.webp
previewImage: /assets/images/ctci-6-9-100-lockers.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.9 para principiantes: 100 casilleros cerrados, 100 personas conmutan cada i-ésima puerta. Los abiertos son cuadrados perfectos (1, 4, 9, ..., 100) porque solo los cuadrados tienen un número impar de factores. Simulación opcional en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Hay **100 casilleros** en un pasillo, todos **cerrados**. Pasan **100 personas**. La persona `i` conmuta cada casillero múltiplo de `i`: la persona 1 toca todos, la 2 toca 2, 4, 6, ..., la 100 solo el 100. Cuando terminan, **¿cuáles quedan abiertos?**

Puedes simular el pasillo con bucles. Funciona, y en entrevista a veces piden el código. La respuesta limpia es otra: **solo los casilleros que son cuadrados perfectos quedan abiertos** (`1, 4, 9, 16, 25, 36, 49, 64, 81, 100`). Cada casillero empieza cerrado y se conmuta una vez por cada divisor. Solo los cuadrados tienen un número **impar** de divisores, así que solo ellos terminan abiertos.

Este post es enseñanza original para principiantes, con **Java** opcional para simular las conmutaciones. Misma familia de puzzles de entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, matemáticas y lógica, problema 6.9.

---

## 1. Analogía cotidiana

Imagina un pasillo escolar con 100 casilleros de metal. Cada puerta empieza cerrada.

Una fila de estudiantes pasa. El estudiante 1 abre o cierra cada puerta (así que todas se abren). El 2 toca cada segunda puerta (cierra la mitad). El 3 toca cada tercera, y así hasta el 100, que solo toca el casillero 100.

No hace falta mirar a cada estudiante. Cambia la pregunta: **¿cuántas veces se toca el casillero `k`?** Una vez por cada número que divide a `k`. El 12 lo tocan 1, 2, 3, 4, 6 y 12: seis veces. Seis es par, termina cerrado (empieza cerrado, un número par de conmutaciones lo deja cerrado). El 16 lo tocan 1, 2, 4, 8 y 16: cinco veces. Impar, termina abierto.

Los conteos impares solo aparecen cuando un factor se "empareja consigo mismo": los cuadrados perfectos.

---

## 2. Problema en palabras simples

**Montaje:**

* 100 casilleros, numerados del 1 al 100.
* Todos empiezan **cerrados**.
* 100 personas, numeradas del 1 al 100.
* La persona `i` conmuta los casilleros `i, 2i, 3i, ...` (cada múltiplo de `i` que no supere 100).
* Conmutar: cerrado pasa a abierto, abierto a cerrado.

**Objetivo:** tras la persona 100, listar (o contar) los casilleros abiertos.

**Supuestos a decir en entrevista:**

* Casilleros y personas son 1-based, 1..100.
* Exactamente un pase por persona, en orden (el orden no cambia el estado final; cada casillero se conmuta una vez por divisor).
* Sin otras operaciones entre pases.

**Forma de la firma si codificas un simulador:**

```java
// returns true if locker is open after the full process (1-based indices in comments)
boolean[] openLockers(int n);
```

O solo imprimir los índices abiertos:

```java
// simulate n lockers / n people; return list of open locker numbers (1-based)
List<Integer> openAfterProcess(int n);
```

**Vista numérica pequeña (n = 10):**

| Casillero | Divisores (quién conmuta) | Conteo | Final (empieza cerrado) |
| --- | --- | --- | --- |
| 1 | 1 | 1 impar | abierto |
| 2 | 1, 2 | 2 par | cerrado |
| 3 | 1, 3 | 2 par | cerrado |
| 4 | 1, 2, 4 | 3 impar | abierto |
| 5 | 1, 5 | 2 par | cerrado |
| 6 | 1, 2, 3, 6 | 4 par | cerrado |
| 7 | 1, 7 | 2 par | cerrado |
| 8 | 1, 2, 4, 8 | 4 par | cerrado |
| 9 | 1, 3, 9 | 3 impar | abierto |
| 10 | 1, 2, 5, 10 | 4 par | cerrado |

Abiertos para n = 10: **1, 4, 9**. Para n = 100: **1, 4, 9, ..., 100** (diez puertas).

---

## 3. Piensa primero

### Fuerza bruta primero

Dos bucles anidados:

```
lockers[1..n] = closed
for person p = 1..n:
    for locker k = p, 2p, 3p, ... <= n:
        toggle lockers[k]
```

Eso es O(n²) en una forma ingenua; en realidad unas O(n log n) conmutaciones en total porque la persona `p` toca `n/p` puertas. Vale para n = 100. Aun así quieren el **por qué**.

### ¿Quién conmuta el casillero k?

La persona `p` toca el casillero `k` solo si `p` divide a `k`. Así que el casillero `k` se conmuta **una vez por cada divisor positivo** de `k`.

Empieza cerrado:

* Número par de conmutaciones → cerrado
* Número impar de conmutaciones → abierto

Los abiertos son exactamente los que tienen un **conteo impar de divisores**.

### ¿Cuándo es impar el número de divisores?

Los divisores suelen emparejarse: si `d` divide a `k`, también lo hace `k/d`, y `d ≠ k/d` salvo que `d² = k`.

Ejemplo con 12:

```
1 × 12
2 × 6
3 × 4
```

Seis divisores distintos, tres pares.

Ejemplo con 16:

```
1 × 16
2 × 8
4 × 4   // sqrt pairs with itself
```

Divisores: 1, 2, 4, 8, 16. Cinco valores. El factor del medio se cuenta una sola vez.

**Solo los cuadrados perfectos** tienen un divisor que es la raíz cuadrada "emparejada consigo misma", así que solo ellos tienen conteo impar.

Por tanto los casilleros abiertos son:

```
1², 2², 3², ..., floor(sqrt(n))²
```

Para n = 100: `1, 4, 9, 16, 25, 36, 49, 64, 81, 100`. Conteo: **10**.

### Fórmula cerrada para el conteo

El número de casilleros abiertos para un n general es `floor(sqrt(n))`. No hace falta simular una vez tienes el teorema.

### Por qué esto es "matemáticas y lógica", no trivia de código

Cualquiera escribe el doble bucle. La victoria en entrevista es unir **paridad de conmutaciones** con **paridad de divisores** con **cuadrados perfectos**. Di esa cadena en voz alta antes de tocar el teclado.

### Variantes que suelen salir

* **Empiezan abiertos en lugar de cerrados:** invierte el estado final (o redefine "abierto"). Siempre di el estado inicial.
* **n no es 100:** misma regla; abiertos = cuadrados hasta n.
* **Solo el conteo, no la lista:** la respuesta es `floor(sqrt(n))`.
* **"¿Qué personas dejan un casillero abierto?"** Siguen siendo los índices cuadrados; las personas no "poseen" el estado final, las conmutaciones sí.

---

## 4. Solución en Java (simulación)

El razonamiento basta. El código demuestra la afirmación para n = 100 y n general.

### Simulación completa

```java
import java.util.ArrayList;
import java.util.List;

/** Simulate n lockers / n people. Returns 1-based open locker numbers. */
static List<Integer> openAfterProcess(int n) {
    boolean[] open = new boolean[n + 1]; // index 0 unused; false = closed
    for (int person = 1; person <= n; person++) {
        for (int locker = person; locker <= n; locker += person) {
            open[locker] = !open[locker];
        }
    }
    List<Integer> result = new ArrayList<>();
    for (int k = 1; k <= n; k++) {
        if (open[k]) {
            result.add(k);
        }
    }
    return result;
}
```

### Respuesta solo matemática (lo que deberías decir primero)

```java
/** Open lockers are perfect squares: 1, 4, 9, ..., floor(sqrt(n))^2. */
static List<Integer> openBySquares(int n) {
    List<Integer> result = new ArrayList<>();
    for (int i = 1; i * i <= n; i++) {
        result.add(i * i);
    }
    return result;
}
```

### Autocomprobación frente a la simulación

```java
static void verify(int n) {
    List<Integer> sim = openAfterProcess(n);
    List<Integer> math = openBySquares(n);
    if (!sim.equals(math)) {
        throw new AssertionError("mismatch for n=" + n + " sim=" + sim + " math=" + math);
    }
    System.out.println("ok n=" + n + " open=" + math + " count=" + math.size());
}

// verify(10);  // [1, 4, 9]
// verify(100); // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

### Conteo sin lista

```java
static int countOpen(int n) {
    return (int) Math.floor(Math.sqrt(n));
    // or integer loop: int c = 0; for (int i = 1; i * i <= n; i++) c++; return c;
}
```

Para n = 100, `floor(sqrt(100)) = 10`.

### Números trabajados para el casillero 36

Divisores de 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Son **9** (impar).

```
start closed
after 1: open
after 2: closed
after 3: open
after 4: closed
after 6: open
after 9: closed
after 12: open
after 18: closed
after 36: open
```

Termina abierto. 36 = 6².

Casillero 50: divisores 1, 2, 5, 10, 25, 50. Seis veces, par, termina cerrado.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Simulación con doble bucle | O(n log n) conmutaciones | O(n) para el array booleano | claro, bueno en rondas de código |
| Listar cuadrados `i*i <= n` | O(sqrt(n)) | O(sqrt(n)) para la lista | óptimo cuando ya tienes la idea |
| Solo conteo `floor(sqrt(n))` | O(1) con `Math.sqrt`, o O(sqrt(n)) en enteros | O(1) | mejor si solo preguntan "cuántos" |
| Factorizar cada k y contar divisores | O(n sqrt(n)) ingenuo | O(1) salvo la salida | correcto pero más lento; enseña la vista de divisores |

Para n = 100 todo es instantáneo. Para n enorme, prefiere la lista de cuadrados o el conteo floor-sqrt.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **n = 1:** solo casillero 1, la persona 1 lo abre. Abiertos: `[1]`.
* **n = 0 o negativo:** define vacío; rechaza en código.
* **Arrays con off-by-one:** en Java son 0-based; deja el índice 0 sin usar o mapea con cuidado.
* **Empiezan abiertos:** invierte la respuesta. Confirma que el problema dice cerrados al inicio.
* **¿La persona i solo conmuta el casillero i?** No: también los múltiplos. Algunos se olvidan y solo tocan `i`.
* **sqrt flotante para el conteo:** `Math.sqrt` vale hasta cuadrados enteros exactos en double cerca de 2^53; para `long` enorme prefiere búsqueda binaria entera de floor sqrt, o un cast cuidadoso.
* **"Todos los que tocó la persona 1 quedan abiertos al final"** falso; más tarde cierran muchos.

Errores comunes:

1. **Simular solo la persona 1 y la 100** y adivinar patrones sin divisores.
2. **Decir que los primos quedan abiertos** (no: los primos tienen exactamente dos divisores, conteo par, cerrados).
3. **Incluir no-cuadrados que "se sienten especiales"** (potencias de dos, etc.).
4. **Contar 0 como casillero cuadrado** cuando van de 1 a n.
5. **O(n²) con `for k=1..n if k % p == 0`** cuando `for locker = p; locker <= n; locker += p` es más limpio y rápido.

Idea mínima de humo:

```java
verify(1);
verify(10);
verify(100);
System.out.println(countOpen(100)); // 10
System.out.println(openBySquares(100));
// [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

---

## 7. Resumen para explicárselo a un amigo

Cien casilleros, todos cerrados. Cien personas. La persona i conmuta cada i-ésima puerta.

1. El casillero k se conmuta una vez por cada divisor de k.
2. Empieza cerrado: conmutaciones impares → abierto, pares → cerrado.
3. Los divisores se emparejan, salvo cuando k es un cuadrado perfecto (la raíz se cuenta una sola vez).
4. Así los abiertos son **1, 4, 9, ..., 100**. Hay **10** (`floor(sqrt(100))`).
5. El código puede simular con un array booleano, o emitir `i*i` mientras `i*i <= n`.

Si puedes decir "número impar de factores, solo los cuadrados" sin dibujar la tabla entera, el problema 6.9 es tuyo. El capítulo 6 premia este estilo: un invariante gana a un montón de detalles de simulación.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [The Egg Drop Problem](/blog/es/ctci-6-8-the-egg-drop-problem)
* Siguiente: [Poison](/blog/es/ctci-6-10-poison)