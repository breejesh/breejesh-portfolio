---
title: "Debugger: Qué comprueba de verdad ((n & (n-1)) == 0) (Java)"
description: "Problema estilo CTCI 5.5 para principiantes: demostrar que n & (n-1) es cero solo cuando n tiene como mucho un bit en 1. Potencia de dos, la trampa del cero, recorridos en binario y código Java."
date: "2026-01-25"
tags: [Algoritmos y Estructuras, Herramientas de Desarrollo]
coverImage: /assets/images/ctci-5-5-debugger.webp
previewImage: /assets/images/ctci-5-5-debugger.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.5 para principiantes: demostrar que n & (n-1) es cero solo cuando n tiene como mucho un bit en 1. Potencia de dos, la trampa del cero, recorridos en binario y código Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Alguien pega esta línea en una revisión de código y pregunta para qué sirve:

```java
((n & (n - 1)) == 0)
```

Parece un acertijo. Sin bucle. Sin división. Una resta, un AND, una comparación. La respuesta corta: **es verdadero cuando `n` tiene como mucho un bit en 1**. En enteros positivos, eso es exactamente "¿es `n` una potencia de dos?" (`1, 2, 4, 8, 16, ...`). El cero también hace verdadera la expresión, así que en producción casi siempre añades `n > 0`.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clásicas de bits en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 5, manipulación de bits, problema 5.5.

---

## 1. Analogía cotidiana

Imagina un pasillo de interruptores. Cada interruptor es un bit: encendido = 1, apagado = 0. Una **potencia de dos** es un pasillo con **exactamente una** luz encendida. Una lámpara, en cualquier posición. Eso es `1` (solo la de más a la derecha), `2` (solo la siguiente), `4`, `8`, y así. Dos luces encendidas significa que el número es suma de dos potencias distintas, no una potencia pura.

El truco: **apagar la luz más a la derecha que esté encendida**, sin recorrer todo el pasillo.

Eso hace `n & (n - 1)`. Restar uno invierte cada bit desde el 1 más bajo hasta los ceros a la derecha. El AND con el `n` original mata ese 1 más bajo y deja intactos los bits más altos.

* Si solo había una luz, al apagarla el pasillo queda a oscuras: resultado `0`.
* Si había dos o más, al matar la de más a la derecha siguen las demás: resultado distinto de `0`.

Así que `((n & (n - 1)) == 0)` pregunta: "¿queda el pasillo a oscuras después de apagar la lámpara más baja encendida?" Es decir, "¿había cero o un bit puesto?"

---

## 2. Enunciado en palabras simples

**Entrada:** un entero `n` (en entrevistas suele ser un `int` no negativo, o al menos lo dejas dicho).

**Tarea:** explicar qué comprueba esta expresión y cuándo usarla:

```java
(n & (n - 1)) == 0
```

**Qué significa en palabras llanas:**

* Verdadero cuando `n` tiene **cero o un** bit en 1 en su patrón (para valores no negativos, como esperas).
* Para **`n > 0`**, equivale a: **`n` es potencia de dos**.
* Para **`n == 0`**, la expresión también es verdadera (`0 & (-1) == 0` en complemento a dos), pero **0 no es potencia de dos**.

**Ejemplos (lado positivo):**

| `n` | Binario (bits bajos) | `n - 1` | `n & (n - 1)` | Expresión | ¿Potencia de 2? |
| --- | --- | --- | --- | --- | --- |
| 1 | `0001` | `0000` | `0000` | true | sí |
| 2 | `0010` | `0001` | `0000` | true | sí |
| 3 | `0011` | `0010` | `0010` | false | no |
| 4 | `0100` | `0011` | `0000` | true | sí |
| 5 | `0101` | `0100` | `0100` | false | no |
| 6 | `0110` | `0101` | `0100` | false | no |
| 8 | `1000` | `0111` | `0000` | true | sí |
| 0 | `0000` | todos 1 | `0000` | true | **no** (trampa) |

**Aclara antes de codificar:**

* ¿Tratamos el 0 como caso especial? (Sí: exige `n > 0` para "potencia de dos".)
* ¿Negativos? En Java, `int` es con signo. Las potencias de dos se definen en magnitudes positivas. Mejor rechazar `n <= 0`.
* ¿32 o 64 bits? El truco es el mismo en `int` y `long`.
* ¿Solo explicación o un método auxiliar? Salen ambas. Este problema suele ser "¿qué comprueba esto?", no "implementa desde cero".

---

## 3. Piensa primero

### Cómo se ve una potencia de dos en binario

Cualquier potencia de dos positiva es un solo `1` seguido de ceros:

```
 1 = 0000 0001
 2 = 0000 0010
 4 = 0000 0100
 8 = 0000 1000
16 = 0001 0000
```

Cualquier otro entero positivo tiene al menos dos bits en 1, o una mezcla (por ejemplo `6 = 0110`, `7 = 0111`, `12 = 1100`).

Así que "es potencia de dos" = "exactamente un bit en 1" para `n > 0`.

### Por qué restar uno y luego AND

Toma `n = 12` (`1100` en bits bajos). El bit en 1 más bajo es el bit 2 (valor 4).

```
n     = ... 1100
n - 1 = ... 1011
AND   = ... 1000   // se va el 1 más bajo; el 1 alto queda
```

Toma `n = 8` (`1000`):

```
n     = ... 1000
n - 1 = ... 0111
AND   = ... 0000   // solo había un 1; ahora ninguno
```

Regla que puedes decir en voz alta:

> **`n & (n - 1)` apaga el bit 1 menos significativo de `n`.**

Si al apagarlo el resultado es cero, no quedaba ningún otro 1. O `n` era 0, o `n` tenía exactamente un 1.

### Por qué es una pregunta "debugger" favorita

A los entrevistadores les gusta porque:

1. O conoces el truco del bit más bajo, o lo redescubres con unos ejemplos en papel.
2. El caso del cero separa a quien memoriza la línea de quien la entiende.
3. Es O(1) y con pocas ramas frente a recorrer bits o llamar a contadores de biblioteca (aunque `Integer.bitCount(n) == 1` vale como alternativa legible).

### Otras formas que también funcionan

* **Bucle / conteo de bits:** cuenta bits en 1; potencia de dos si el conteo es 1. Más claro para algunos.
* **Dividir entre dos:** mientras sea par, divide por 2; termina en 1. Fácil fallar en 0 y negativos.
* **`n > 0 && (n & -n) == n`:** otro clásico. `n & -n` aísla el bit 1 más bajo. Si eso es igual a `n`, solo ese bit estaba puesto.

Para este problema, céntrate en explicar `n & (n - 1)`.

---

## 4. Solución en Java

### Forma solo explicación (qué comprueba la expresión)

```java
// Verdadero cuando n tiene como mucho un bit en 1 (incluye n == 0).
boolean atMostOneBitSet(int n) {
    return (n & (n - 1)) == 0;
}
```

### Potencia de dos (lo que casi siempre quieres)

```java
/**
 * Devuelve true si n es una potencia de dos positiva (1, 2, 4, 8, ...).
 * Usa que n & (n - 1) apaga el bit 1 más bajo.
 */
boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Misma idea en long

```java
boolean isPowerOfTwo(long n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Alternativa legible (buena en producción; menciónala en entrevistas)

```java
boolean isPowerOfTwoBitCount(int n) {
    return n > 0 && Integer.bitCount(n) == 1;
}
```

Pueden pedir la forma con máscara para que demuestres bits sin apoyarte en la biblioteca.

### Opcional: aislar el bit 1 más bajo (truco relacionado)

```java
// Aísla el bit 1 más bajo de n (si n != 0).
int lowestSetBit(int n) {
    return n & -n;
}

boolean isPowerOfTwoIsolate(int n) {
    return n > 0 && (n & -n) == n;
}
```

Mismas respuestas de sí/no para potencias de dos que `n & (n - 1)`, otra micro-expresión. Conviene conocer ambos nombres si ya los has visto.

---

## 5. Recorrido de los casos clásicos

### Caso A: potencia de dos (`n = 16`)

```
n        = 0001 0000
n - 1    = 0000 1111
n & (n-1)= 0000 0000   → expresión true
n > 0    → isPowerOfTwo true
```

### Caso B: no es potencia de dos (`n = 10`)

```
n        = 0000 1010
n - 1    = 0000 1001
n & (n-1)= 0000 1000   → no es cero → false
```

Dos bits en 1 (8 y 2). Al borrar el más bajo queda el 8.

### Caso C: la trampa del cero (`n = 0`)

```
n        = 0000 0000
n - 1    = 1111 1111   // en int: -1, todos los bits en 1
n & (n-1)= 0000 0000   → expresión true, pero no es potencia de dos
```

Di siempre: **la expresión cruda acepta 0; los helpers de potencia de dos deben rechazarlo.**

### Caso D: uno (`n = 1`)

```
1 es 2^0. Un bit en 1. Expresión true. isPowerOfTwo true.
```

La gente olvida que 1 es potencia de dos. Lo es.

### Prueba rápida

```java
public static void main(String[] args) {
    int[] samples = {0, 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, 32};
    for (int n : samples) {
        boolean raw = (n & (n - 1)) == 0;
        boolean pow = n > 0 && (n & (n - 1)) == 0;
        System.out.println(n + " raw=" + raw + " powerOfTwo=" + pow);
    }
    // 0  raw=true  powerOfTwo=false
    // 1  raw=true  powerOfTwo=true
    // 2  raw=true  powerOfTwo=true
    // 3  raw=false powerOfTwo=false
    // ...
}
```

---

## 6. Complejidad, bordes y tips de entrevista

| Tema | Respuesta |
| --- | --- |
| Tiempo | O(1) operaciones de palabra |
| Espacio extra | O(1) |
| Identidad clave | `n & (n - 1)` apaga el bit 1 más bajo |
| Potencia de dos | `n > 0 && (n & (n - 1)) == 0` |
| Cero | expresión true; no es potencia de dos |
| Uno | potencia de dos (`2^0`) |
| Negativos | no los llames potencias de dos aquí; usa `n > 0` |
| Uso relacionado | bucle de conteo de Kernighan: `while (n != 0) { n &= n - 1; count++; }` cuenta bits apagando el más bajo una y otra vez |

**Errores comunes:**

1. **Olvidar `n > 0`.** Envías un chequeo de "potencia de dos" que devuelve true para 0.
2. **Decir que la expresión "comprueba potencia de dos" sin el matiz del cero.** Preciso: como mucho un bit puesto; potencia de dos solo con positividad.
3. **Creer que `n & (n + 1)` hace lo mismo.** No. Quédate con `n - 1`.
4. **Confundir "apaga el bit 1 más bajo" con "invierte todos los bits".** En la resta intervienen el 1 más bajo y los ceros a la derecha; el AND quita ese 1 más bajo.
5. **Salir del paso con los negativos.** En Java, un chequeo positivo explícito es mejor que inventar significado para potencias negativas si no te lo piden.

**Cómo contarlo (versión de 30 segundos):**

1. Las potencias de dos tienen exactamente un bit en 1.
2. `n & (n - 1)` apaga el bit 1 más bajo.
3. Si el resultado es 0, había cero o un bit puesto.
4. Añade `n > 0` para que el cero no pase como potencia de dos.

**Dónde aparece fuera del acertijo:**

* Validar tamaños de buffer que deben ser potencia de dos (algunos ring buffers, capacidades de tablas hash en diseños antiguos).
* Comprobaciones rápidas antes de algoritmos que usan máscaras de anchura `n`.
* Dentro de bucles de conteo y bit-twiddling (apagar el bit más bajo una y otra vez).

---

## 7. Resumen para contárselo a un amigo

Debugger (problema 5.5) no es "construir un depurador". Es: **¿qué comprueba `((n & (n - 1)) == 0)`?**

1. Restar uno y hacer AND apaga el bit 1 menos significativo de `n`.
2. Si el producto es cero, `n` no tenía un segundo 1: cero o un bit puesto.
3. Los enteros positivos con exactamente un bit en 1 son las potencias de dos: `1, 2, 4, 8, ...`.
4. Escribe `n > 0 && (n & (n - 1)) == 0` cuando quieres potencia de dos.
5. El cero hace verdadera la expresión cruda. Esa es la trampa que da puntos de seguimiento.

Si puedes recorrer `8` y `10` en binario, explicar por qué el cero es especial y escribir la línea con el chequeo positivo, dominas el 5.5.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Next Number](/blog/es/ctci-5-4-next-number)
* Siguiente: [Conversion](/blog/es/ctci-5-6-conversion)