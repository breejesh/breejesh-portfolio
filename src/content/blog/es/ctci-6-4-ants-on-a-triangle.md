---
title: "Hormigas en un triángulo: probabilidad de que no choquen (Java)"
description: "Problema estilo CTCI 6.4 para principiantes: tres hormigas en los vértices eligen dirección al azar. Cuenta los 8 casos, marca cuándo solo se persiguen y llega a probabilidad 1/4. Incluye enumeración en Java."
date: "2025-10-22"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
previewImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.4 para principiantes: tres hormigas en los vértices eligen dirección al azar. Cuenta los 8 casos, marca cuándo solo se persiguen y llega a probabilidad 1/4. Incluye enumeración en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tres hormigas están en las tres esquinas de un triángulo. Al mismo tiempo cada una elige izquierda o derecha por un lado y empieza a caminar a la misma velocidad. ¿Chocarán? La pregunta de entrevista no es física. Es un conteo pequeño: cuántas combinaciones de dirección evitan el choque, de todas las elecciones igual de probables.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que los clásicos de matemáticas y lógica en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, matemáticas y lógica, problema 6.4.

---

## 1. Analogía cotidiana

Imagina a tres personas en las tres esquinas de un camino triangular del parque. Cada una lanza una moneda: recorrer el bucle en sentido horario, o en sentido antihorario. Misma velocidad para todos.

Si las tres monedas salen iguales, se mantienen separadas. Cada una persigue a quien va delante y es perseguida por quien va detrás. Nadie se encuentra de frente en un lado. Solo rotan para siempre.

Si aunque sea una persona va al revés, dos personas caminan una hacia la otra en algún lado. Se encuentran de frente. Eso es un choque en este puzzle.

Así que el puzzle es: tres monedas, cara o cruz. ¿Con qué frecuencia coinciden las tres?

---

## 2. Enunciado en palabras simples

**Montaje:**

* Triángulo equilátero (la forma exacta casi no importa: tres vértices, tres aristas).
* Una hormiga en cada vértice.
* Cada hormiga elige de forma independiente una dirección: sentido horario (CW) o antihorario (CCW), cada una con probabilidad `1/2`.
* Todas caminan a la misma velocidad constante por las aristas.

**Regla de choque (dila en voz alta en la entrevista):**

* Dos hormigas **chocan** si van una hacia la otra en la misma arista (encuentro de frente).
* Si las tres eligen la misma dirección, nunca se encuentran de frente. Se mantienen a igual distancia y giran para siempre.
* Ignoramos "pasarse en un vértice" como caso aparte en el modelo habitual: solo las corridas con la misma dirección global están libres de choque.

**Pregunta:** ¿cuál es la probabilidad de que las hormigas no choquen nunca?

**Aclara antes de resolver:**

* ¿Direcciones independientes y justas? (Sí: cada hormiga, cada dirección, probabilidad `1/2`.)
* ¿Importa la misma velocidad? (Sí para la historia de frente. Velocidades distintas cambian puntos de encuentro, pero la respuesta clásica sigue basándose en el acuerdo de dirección.)
* ¿Choque solo de frente, o cualquier encuentro incluido alcanzar por detrás? (Enunciado clásico: de frente. Con misma velocidad, las que van igual no se alcanzan.)
* ¿Generalizar a `n` hormigas en un n-gono? Buen follow-up. Misma idea: solo dos orientaciones globales funcionan.

---

## 3. Piensa primero

### Espacio muestral

Cada hormiga tiene 2 opciones. Tres hormigas:

```
total outcomes = 2^3 = 8
```

Las ocho son igual de probables si las monedas son justas. Lístalas como terna `(A, B, C)` donde `0` es CW y `1` es CCW (cualquier etiquetado de vértices vale).

```
(0,0,0)  todas CW
(0,0,1)
(0,1,0)
(0,1,1)
(1,0,0)
(1,0,1)
(1,1,0)
(1,1,1)  todas CCW
```

### ¿Cuáles evitan el choque?

Solo las dos filas uniformes:

* Todas CW: `(0,0,0)`
* Todas CCW: `(1,1,1)`

En cada fila mixta, al menos un par de vecinos eligió direcciones opuestas, así que caminan uno hacia el otro en la arista entre ellos y chocan.

Por tanto:

```
favorable = 2
probability = 2 / 8 = 1/4
```

### Otra forma de decirlo

Fija la hormiga A (dirección libre, probabilidad 1). B debe coincidir con A (`1/2`). C debe coincidir con A (`1/2`). Producto:

```
P(no collision) = 1 * (1/2) * (1/2) = 1/4
```

Misma respuesta sin listar ocho filas. Listar es mejor en entrevista para un relato de principiante, porque el entrevistador ve que contaste.

### Por qué las direcciones mixtas siempre chocan (misma velocidad)

Etiqueta vértices `A`, `B`, `C` en orden CW. La arista `AB` solo tiene a A y B al inicio.

* Si A camina CW hacia B y B camina CCW hacia A: de frente en `AB`.
* Si A camina CCW (hacia C) y B camina CW: en algún otro sitio sigue apareciendo un de frente, porque no las tres coinciden.

No hace falta desglosar cada patrón mixto en la entrevista si enuncias el teorema limpio:

> Sin choque si y solo si cada hormiga elige la misma orientación.

Prueba "si": misma dirección, misma velocidad, separación constante, sin de frente.
Prueba "solo si": si alguna difiere, esa hormiga y un vecino forman un par opuesto en una arista compartida (o el ciclo fuerza al menos un par de vecinos opuestos en un triángulo).

En un triángulo es especialmente claro: dos direcciones implica al menos una arista con tráfico opuesto.

### Follow-up: n hormigas en un n-gono regular

Mismo modelo: cada una elige CW o CCW con probabilidad `1/2`, misma velocidad, choque = de frente en una arista.

Solo dos configuraciones seguras: todas CW, todas CCW.

```
P = 2 / 2^n = 2^(1-n)
```

Para `n = 3`: `2^(1-3) = 2^(-2) = 1/4`. Misma respuesta.

Para `n = 4`: `1/8`. Para `n` grande la probabilidad cae hacia cero. Casi siempre alguien disiente.

---

## 4. Solución en Java

No hace falta código pesado para la forma cerrada. Aun así, enumerar resultados es una forma limpia de mostrar el conteo, y generaliza a `n`.

### Forma cerrada

```java
/** Probability all n ants agree on direction (fair coins, independent). */
static double noCollisionProbability(int n) {
    if (n < 1) {
        throw new IllegalArgumentException("n must be at least 1");
    }
    // 2 favorable out of 2^n
    return 2.0 / Math.pow(2, n);
}

// triangle
// noCollisionProbability(3) == 0.25
```

### Enumerar todas las máscaras 2^n

El bit `i` es la dirección de la hormiga `i` (`0` CW, `1` CCW). Una máscara es segura solo si todos los bits son 0 o todos son 1.

```java
/**
 * Count direction assignments with no head-on collision.
 * Bit i of the mask is ant i's direction.
 */
static int countSafeConfigs(int n) {
    if (n < 1 || n > 30) {
        throw new IllegalArgumentException("n out of supported range");
    }
    int total = 1 << n; // 2^n
    int safe = 0;
    int allOnes = total - 1; // n bits set
    for (int mask = 0; mask < total; mask++) {
        if (mask == 0 || mask == allOnes) {
            safe++;
        }
    }
    return safe; // always 2 for n >= 1
}

static double probabilityByEnumeration(int n) {
    int total = 1 << n;
    return (double) countSafeConfigs(n) / total;
}
```

### Tabla explícita del triángulo (bien en la pizarra)

```java
static void printTriangleCases() {
    // ants A, B, C; 0 = CW, 1 = CCW
    String[] labels = {"CW", "CCW"};
    int safe = 0;
    for (int a = 0; a <= 1; a++) {
        for (int b = 0; b <= 1; b++) {
            for (int c = 0; c <= 1; c++) {
                boolean ok = (a == b) && (b == c);
                if (ok) {
                    safe++;
                }
                System.out.printf(
                    "(%s, %s, %s) -> %s%n",
                    labels[a], labels[b], labels[c],
                    ok ? "safe (all same)" : "collide");
            }
        }
    }
    System.out.println("safe / total = " + safe + " / 8 = " + (safe / 8.0));
}
```

Salida aproximada:

```
(CW, CW, CW) -> safe (all same)
(CW, CW, CCW) -> collide
(CW, CCW, CW) -> collide
(CW, CCW, CCW) -> collide
(CCW, CW, CW) -> collide
(CCW, CW, CCW) -> collide
(CCW, CCW, CW) -> collide
(CCW, CCW, CCW) -> safe (all same)
safe / total = 2 / 8 = 0.25
```

### Comprobaciones estilo unit test

```java
assert Math.abs(noCollisionProbability(3) - 0.25) < 1e-9;
assert Math.abs(probabilityByEnumeration(3) - 0.25) < 1e-9;
assert countSafeConfigs(3) == 2;
assert countSafeConfigs(4) == 2;
assert Math.abs(noCollisionProbability(4) - 0.125) < 1e-9;
assert Math.abs(noCollisionProbability(1) - 1.0) < 1e-9; // one ant: never collides
```

---

## 5. Recorre los casos clásicos

### Todas en sentido horario

Hormigas en A, B, C todas CW. Tras un rato cada una ha recorrido el mismo arco. Las distancias entre hormigas siguen siendo un lado (por el perímetro). Nadie camina de frente a un vecino. **Seguro.**

### Todas en sentido antihorario

Misma historia, orientación opuesta. **Seguro.**

### Dos CW, una CCW

Digamos A y B son CW, C es CCW. Entonces A camina hacia B en AB mientras B camina hacia C... y C camina hacia B o A según el etiquetado. En un triángulo, la dirección minoritaria crea al menos una arista con tráfico opuesto. **Chocan.**

Concreto: A arriba, B abajo-derecha, C abajo-izquierda. CW significa A→B, B→C, C→A. CCW significa A→C, C→B, B→A.

Si A y B eligen CW y C elige CCW:

* A camina hacia B (CW).
* B camina hacia C (CW).
* C camina hacia B (CCW: C→B).

Así B y C van uno hacia el otro en la arista BC. De frente. Listo.

Cualquier otra terna mixta es la misma forma tras renombrar vértices.

### Aritmética de probabilidad

```
P(all CW)  = (1/2)^3 = 1/8
P(all CCW) = 1/8
P(safe)    = 1/8 + 1/8 = 1/4
```

O: `2` máscaras favorables de `8`.

---

## 6. Complejidad, bordes, tips de entrevista

| Enfoque | Tiempo | Espacio | Notas |
| --- | --- | --- | --- |
| Forma cerrada `2 / 2^n` | O(1) | O(1) | Mejor respuesta cuando el modelo está claro |
| Enumerar `2^n` máscaras | O(2^n) | O(1) | Bien para n ≤ 20 en demos; excesivo para n = 3 |
| Bucles anidados para n = 3 | O(1) | O(1) | Mejor pizarra para principiantes |

**Bordes y trampas:**

1. **Olvidar la equiprobabilidad.** Si solo dices "dos casos buenos" sin dividir entre 8, no has terminado.
2. **Llamar choque a cualquier encuentro, incluido el mismo sentido.** Con misma velocidad no se alcanzan. Quédate en de frente salvo que el entrevistador cambie el modelo.
3. **Creer que el orden de movimiento importa.** Elección simultánea a igual velocidad lo deja en combinatoria pura.
4. **Orgullo de punto flotante.** Prefiere fracciones exactas: `2/8 = 1/4`. Usa doubles solo al codificar.
5. **n = 2 "dígono" absurdo.** Quédate en n ≥ 3 para polígonos, o nota que n = 1 es trivialmente 1.
6. **Asumir que rebotan o se invierten.** Problema clásico: eligen una vez y siguen hasta que habría habido un encuentro.

**Cómo contarlo (versión de 30 segundos):**

1. Cada hormiga tiene 2 direcciones, así que 8 resultados igual de probables.
2. Evitan el choque solo si todas van CW o todas van CCW.
3. Eso es 2 de 8, probabilidad `1/4`.
4. n-gono general: `2 / 2^n`.

**Dónde aparece fuera del acertijo:**

* Espacios muestrales e independencia en entrevistas de probabilidad.
* Eventos de "acuerdo": todos los bits iguales, todos los votos iguales, todos los relojes en fase.
* Argumentos de simetría: reducir movimiento continuo a un conteo de elecciones discretas.

---

## 7. Resumen para contárselo a un amigo

Hormigas en un triángulo es un problema de conteo disfrazado de fauna.

1. Tres hormigas, cada una elige CW o CCW con probabilidad `1/2`. Ocho resultados, todos iguales.
2. De frente en una arista cuenta como choque. Misma velocidad, misma dirección: solo se persiguen, nunca de frente.
3. Exactamente dos resultados son seguros: todas CW, todas CCW.
4. Probabilidad: `2/8 = 1/4`.
5. Para n hormigas en un n-gono: `2 / 2^n`.

Si puedes listar las ocho ternas, marcar las dos uniformes y explicar por qué una elección mixta fuerza un de frente, dominas el problema 6.4. Sin cálculo. Solo conteo cuidadoso.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Dominós](/blog/es/ctci-6-3-dominos)
* Siguiente: [Jarras de agua](/blog/es/ctci-6-5-jugs-of-water)