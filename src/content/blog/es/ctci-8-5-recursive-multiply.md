---
title: "Recursive Multiply: producto por doblar y dividir a la mitad (Java)"
description: "Problema estilo CTCI 8.5 para principiantes: multiplica dos enteros positivos sin * ni /. Recurre sobre la mitad del factor menor, dobla el semi-producto y suma una vez si es impar. Java claro."
date: "2025-12-29"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-5-recursive-multiply.webp
previewImage: /assets/images/ctci-8-5-recursive-multiply.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.5 para principiantes: multiplica dos enteros positivos sin * ni /. Recurre sobre la mitad del factor menor, dobla el semi-producto y suma una vez si es impar. Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

La multiplicación es suma repetida, pero sumar `a` consigo mismo `b` veces es lento cuando ambos números son grandes. Puedes hacerlo mejor con **mitad y doble**: partes el factor menor por la mitad, resuelves el problema más pequeño y luego doblas la respuesta (y sumas el factor mayor una vez si el menor era impar). Sin `*`, sin `/`. Solo `+`, `-` y desplazamientos de bits si quieres.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de recursión en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y programación dinámica, problema 8.5.

---

## 1. Analogía cotidiana

Imagina un parking de `filas` por `columnas`. Necesitas el total de plazas sin multiplicar los dos lados.

* Contar plaza a plaza funciona. También tarda una eternidad si el parking es enorme.
* Mejor: cuenta la mitad de las filas y **dobla** ese conteo (suma el semi-conteo consigo mismo). Acabas de hacer el doble del trabajo de un parking a mitad de tamaño.
* Si el número de filas es impar, mitad más mitad se queda corto en una fila. Añade una fila completa de plazas al final.

La misma idea con números. `7 * 8` son "siete ochos". Calcula `3 * 8`, dóblalo para seis ochos y suma un ocho más porque 7 es impar: `3*8 + 3*8 + 8`.

Partir a la mitad reduce el trabajo. Doblar reconstruye el producto. Los restos impares piden una suma extra del factor mayor.

---

## 2. Enunciado en claro

**Entrada:** dos enteros positivos `a` y `b` (a veces el entrevistador admite 0; trátalo como caso base gratis).

**Salida:** el producto `a * b`.

**Restricciones del ejercicio:**

* **No** uses el operador `*` (ni `/` para dividir entre dos si lo prohíben).
* **Sí** puedes usar `+`, `-` y desplazamientos (`<<`, `>>`).
* Minimiza cuántas de esas operaciones necesitas (trabajo logarítmico gana al lineal).

**Ejemplos:**

| a | b | Producto | Idea |
| --- | --- | --- | --- |
| 7 | 8 | 56 | mitad de 7 es 3; `3*8=24`; doble 48; +8 → 56 |
| 8 | 7 | 56 | intercambia para que el menor sea 7; mismo camino |
| 5 | 5 | 25 | mitad de 5 es 2; `2*5=10`; doble 20; +5 → 25 |
| 1 | 99 | 99 | caso base: el menor es 1 |
| 0 | 40 | 0 | caso base: el menor es 0 |
| 16 | 3 | 48 | menor 3 impar; mitad 1; doble 3 y suma 3 |

**Aclara antes de codificar:**

* ¿Solo positivos, o también ceros y negativos? Aquí nos quedamos con no negativos. Los negativos son contabilidad de signos encima del mismo núcleo.
* ¿Overflow? El producto en `int` puede desbordar. Menciona `long` si los valores pueden pasar de 2³¹-1.
* ¿`<< 1` vale como doble? Sí. `a + a` también y a veces se lee mejor en la pizarra.
* ¿`>> 1` vale como mitad? Sí. Si prohíben `/`, di en voz alta que usas desplazamiento.

---

## 3. Piensa primero

### Ingenuo: sumar smaller veces

```
product = 0
repetir smaller veces:
    product += bigger
```

Correcto. Tiempo O(smaller). Bien para números chicos. Flojo si smaller es un millón.

### Idea: producto de la mitad, luego doblar

Si `smaller` es par:

```
smaller * bigger = 2 * ((smaller / 2) * bigger)
```

Si `smaller` es impar:

```
smaller * bigger = 2 * ((smaller / 2) * bigger) + bigger
```

Porque `2 * floor(smaller/2) + 1 = smaller` cuando es impar.

Solo necesitas **una** llamada recursiva sobre `smaller >> 1`, no dos mitades independientes.

### Por qué no recurrir en ambas mitades si es impar

Un primer boceto a veces hace:

```
side1 = minProduct(smaller >> 1, bigger)
side2 = minProduct(smaller - (smaller >> 1), bigger)  // si impar
return side1 + side2
```

Cuando `smaller` es impar, la segunda mitad no es igual a la primera. Disparas dos árboles recursivos. El trabajo se duplica. Memoizar lo arregla, pero la fórmula limpia ya evita el segundo árbol: dobla el semi-producto y suma `bigger` una vez.

### Siempre recurre sobre el factor menor

`3 * 1000000` con el bucle ingenuo sumaría un millón de veces si eliges el lado malo. Intercambia para que `smaller` sea min(a, b). La profundidad queda O(log min(a, b)).

### Traza: 7 × 8

```
minProduct(7, 8)
  half = 3
  halfProd = minProduct(3, 8)
    half = 1
    halfProd = minProduct(1, 8) = 8
    3 impar → 8 + 8 + 8 = 24
  7 impar → 24 + 24 + 8 = 56
```

Tres pasos recursivos. El bucle ingenuo habría sumado 8 siete veces.

### Traza: 16 × 3 (tras swap: smaller = 3)

```
minProduct(3, 16)
  halfProd = minProduct(1, 16) = 16
  3 impar → 16 + 16 + 16 = 48
```

---

## 4. Solución en Java

Versión preferida en entrevista: una llamada recursiva, doblar sumando el semi-producto consigo mismo, sumar `bigger` si es impar.

```java
/**
 * Multiply two non-negative ints without using * or /.
 * Recurses on half the smaller factor: O(log min(a, b)) adds.
 */
public static int minProduct(int a, int b) {
    int bigger = a < b ? b : a;
    int smaller = a < b ? a : b;
    return minProductHelper(smaller, bigger);
}

private static int minProductHelper(int smaller, int bigger) {
    if (smaller == 0) {
        return 0;
    }
    if (smaller == 1) {
        return bigger;
    }

    int half = smaller >> 1; // floor divide by 2
    int halfProd = minProductHelper(half, bigger);

    if ((smaller & 1) == 0) {
        // even: 2 * half * bigger
        return halfProd + halfProd;
    } else {
        // odd: 2 * floor(smaller/2) * bigger + bigger
        return halfProd + halfProd + bigger;
    }
}
```

### Opcional: doblar con un desplazamiento

```java
// same meaning as halfProd + halfProd when halfProd >= 0
return halfProd << 1;
// odd case:
return (halfProd << 1) + bigger;
```

Los shifts lucen listos. `halfProd + halfProd` se explica mejor bajo presión. Cualquiera vale si lo cuentas en voz alta.

### Versión débil que la gente escribe primero (conócela y mejórala)

```java
// Linear: O(smaller) additions. Say it, then replace it.
private static int minProductNaive(int smaller, int bigger) {
    int sum = 0;
    for (int i = 0; i < smaller; i++) {
        sum += bigger;
    }
    return sum;
}
```

A los entrevistadores les gusta oír primero O(s) y luego la versión log.

### Tabla de recorrido: 7 × 8

| Llamada | half | halfProd | paridad | retorno |
| --- | --- | --- | --- | --- |
| helper(7, 8) | 3 | helper(3, 8) → 24 | impar | 24+24+8 = 56 |
| helper(3, 8) | 1 | helper(1, 8) → 8 | impar | 8+8+8 = 24 |
| helper(1, 8) | - | - | base | 8 |

### Pruebas mínimas

```java
public static void main(String[] args) {
    System.out.println(minProduct(7, 8));   // 56
    System.out.println(minProduct(8, 7));   // 56
    System.out.println(minProduct(5, 5));   // 25
    System.out.println(minProduct(1, 99));  // 99
    System.out.println(minProduct(0, 40));  // 0
    System.out.println(minProduct(16, 3));  // 48
    System.out.println(minProduct(2, 2));   // 4
}
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Sumar `bigger`, `smaller` veces | O(s) | O(1) | línea base correcta |
| Dos mitades recursivas si impar | ~O(s) peor sin memo | O(log s) pila | duplica trabajo |
| Dos mitades + array memo | O(s) posibles rellenos | O(s) memo + pila | mejor, no la mejor historia |
| Una llamada a la mitad, doblar, +bigger si impar | O(log s) | O(log s) pila | preferido |

Aquí `s = min(a, b)`. El camino preferido parte `s` a la mitad en cada llamada, así que la profundidad y el número de sumas son logarítmicos en `s`.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Cero** → `0 * x = 0`. Caso base. No entres en un bucle infinito de sumas.
* **Uno** → devuelve el otro factor al momento.
* **Ambos iguales** → funciona; el swap no hace nada si `a == b`.
* **Menor potencia de dos** → camino de solo dobles tras las mitades pares.
* **Producto grande** → overflow de `int` es real. Di que usarías `long` en producción.
* **Negativos** → el enunciado suele decir positivos. Si preguntan: quita signos, multiplica absolutos, reaplica el signo. Sigue sin `*`.

Errores comunes:

1. **No poner primero el factor menor.** El producto sale bien, pero la profundidad sigue al número grande.
2. **Dos llamadas recursivas en impar sin memo.** Funciona, lento, feo de analizar. Prefiere doblar + sumar.
3. **Usar `smaller % 2` cuando el tema son bits.** Vale, pero `(smaller & 1) == 0` encaja mejor con "bits permitidos".
4. **Dividir con `/ 2` si prohibieron `/`.** Usa `>> 1` y dilo.
5. **Devolver `halfProd << 1` con halfProd negativo.** No aplica a entradas no negativas; prefiere `+` si más adelante hay signos.
6. **Mutar globales o construir una rejilla de celdas.** La rejilla es imagen mental, no la estructura que asignas.

---

## 7. Recap para contárselo a un amigo

Recursive Multiply pide: producto de dos enteros no negativos sin `*` ni `/`, con las menos sumas posibles.

1. Multiplicar es sumar repetidas veces. Sumar `s` veces es la base honesta.
2. Recurre siempre sobre el factor **menor** para que el trabajo siga a `min(a, b)`.
3. Calcula `halfProd = product(floor(s/2), bigger)` una sola vez.
4. Si `s` es par, la respuesta es `halfProd + halfProd`. Si impar, suma `bigger` una vez más.
5. Casos base: `0 → 0`, `1 → bigger`. Tiempo O(log s), pila O(log s).

Si puedes bajar `7 × 8` hasta 56 en la pizarra y explicar por qué una llamada recursiva gana a dos semi-productos, dominas el problema 8.5.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Power Set](/blog/es/ctci-8-4-power-set)
* Siguiente: [Towers of Hanoi](/blog/es/ctci-8-6-towers-of-hanoi)