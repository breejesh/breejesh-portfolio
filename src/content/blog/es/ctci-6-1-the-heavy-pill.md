---
title: "The Heavy Pill: encuentra el frasco pesado con una sola pesada (Java)"
description: "Problema estilo CTCI 6.1 para principiantes: 20 frascos de pastillas, uno tiene pastillas de 1.1 g en lugar de 1.0 g. Identifícalo con una sola pesada tomando 1, 2, ..., 20 pastillas y leyendo el exceso de peso."
date: "2026-04-05"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-1-the-heavy-pill.webp
previewImage: /assets/images/ctci-6-1-the-heavy-pill.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.1 para principiantes: 20 frascos de pastillas, uno tiene pastillas de 1.1 g en lugar de 1.0 g. Identifícalo con una sola pesada tomando 1, 2, ..., 20 pastillas y leyendo el exceso de peso.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes **20 frascos** de pastillas. Diecinueve tienen pastillas normales de **1.0 gramo** cada una. Un frasco tiene pastillas pesadas de **1.1 gramos** cada una. Los frascos se ven iguales. Tienes una báscula que da el peso exacto y solo puedes usarla **una vez**. ¿Cuál es el frasco pesado?

Esto es primero un puzzle de razonamiento y después código. El truco clásico es poner un número distinto de pastillas de cada frasco en la báscula para que la masa de más codifique el índice del frasco. Este post es enseñanza original para principiantes, con **Java** opcional para simular la pesada. Misma familia que los puzzles matemáticos de entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí empieza el capítulo 6, matemáticas y lógica.

---

## 1. Analogía cotidiana

Imagina veinte tarros de café sellados. Diecinueve tienen granos normales. Uno trae granos un poco más densos. Solo te dejan una pasada por la báscula de la cocina.

Si pesas un grano del tarro 1, uno del 2, y así, una lectura más alta solo dice "algo falla". No dice cuál tarro.

Dale a cada tarro una **huella única** en el montón. Pon **1** grano del tarro 1, **2** del 2, ..., **20** del 20. Si todos los granos fueran normales, el total sería fijo. Cualquier peso de más viene solo del tarro denso, y el tamaño de ese exceso es proporcional a cuántos granos sacaste de él. El exceso es el número del tarro.

---

## 2. Problema en palabras simples

**Planteamiento:**

* 20 frascos, etiquetados del 1 al 20 (o del 0 al 19; elige uno y no lo cambies).
* 19 frascos: cada pastilla pesa **1.0 g**.
* 1 frasco: cada pastilla pesa **1.1 g**.
* No sabes cuál es el pesado.
* Báscula numérica (no solo una balanza que diga izquierda/derecha/igual).
* **Una sola pesada.**

**Objetivo:** nombrar el frasco pesado tras esa única medición.

**Supuestos a decir en entrevista:**

* Hay pastillas suficientes en cada frasco (al menos 20 en el frasco 20).
* Las pastillas de un frasco son uniformes.
* Exactamente un frasco pesado (ni cero ni dos).
* La precisión de la báscula ve pasos de 0.1 g (o mejor).

**Forma de la firma si codificas un simulador:**

```java
// bottles[i] is true if bottle i (1-based in comments, 0-based in arrays) is heavy
// returns the 1-based bottle index inferred from one weighing
int findHeavyBottle(boolean[] isHeavy);
```

O, más honesto para el puzzle:

```java
// given the true heavy bottle (1..20), simulate the weighing strategy and recover it
int identifyHeavy(int trueHeavyBottle);
```

**Vista numérica pequeña:**

Tomas `1 + 2 + ... + 20 = 210` pastillas en total. Si todas fueran de 1.0 g, la báscula marca **210.0 g**.

Si el frasco `k` es pesado, esas `k` pastillas aportan cada una **0.1 g** de más, así que:

```
measured = 210.0 + 0.1 * k
k = (measured - 210.0) / 0.1
```

Ejemplo: mides **210.7 g** → exceso **0.7 g** → frasco **7**.

---

## 3. Piensa primero

### Por qué falla una pastilla de cada frasco

Una pastilla de cada frasco: 20 pastillas. Esperado 20.0 g si todo es normal. Si hay un frasco pesado entre ellos, obtienes 20.1 g. Sabes que existe un frasco pesado, pero cualquiera sumaría el mismo +0.1 g. Cero información sobre *cuál*.

Ideas tipo búsqueda binaria (mitad de frascos, luego otra mitad) necesitan **varias** pesadas. El problema te congela en una.

### Codifica el índice del frasco en el exceso

Cada frasco debe dejar una **firma distinta** en el peso total. Conteos distintos lo logran:

| Frasco | Pastillas | Extra si es pesado |
| --- | --- | --- |
| 1 | 1 | 0.1 g |
| 2 | 2 | 0.2 g |
| 3 | 3 | 0.3 g |
| ... | ... | ... |
| 20 | 20 | 2.0 g |

Línea base todo-normal:

```
sum = 1 + 2 + ... + 20 = n(n+1)/2 = 20*21/2 = 210
baseline weight = 210.0 g
```

Solo las pastillas del frasco pesado pesan 0.1 g de más. Si el frasco `k` es pesado:

```
weight = (210 - k) * 1.0 + k * 1.1
       = 210 + 0.1 * k
```

Así:

```
k = round((weight - 210.0) / 0.1)
```

En código usa redondeo porque el punto flotante es sucio. En papel, aritmética exacta basta.

### Por qué esto es "math and logic", no ordenación

No hay un array que ordenar. La idea es **teoría de la información con una medición continua**: un número real tiene resolución de sobra para llevar un ID entero si diseñas la muestra con cuidado. Al entrevistador le importa que inventes la codificación, no que memorices "210".

### Variantes que sueltan

* **Algunos frascos ligeros, algunos pesados, o dirección desconocida:** otros puzzles clásicos (a menudo con balanza y más pesadas). No los mezcles salvo que te lo pidan.
* **Frascos 0..19:** ¿0 pastillas del frasco 0? Inútil. Renumera 1..20, o toma `i+1` del frasco `i`.
* **Solo balanza (izquierda vs derecha):** aquí la báscula suele ser numérica. Aclara. Con solo izquierda/derecha necesitas otra estrategia y a menudo más usos.

---

## 4. Solución en Java (simulación)

El puzzle se resuelve razonando. El código es una forma limpia de mostrar que puedes implementar el plan sin minas de punto flotante.

### Helper de la matemática base

```java
/** Sum 1+2+...+n. For n=20 this is 210. */
static int triangular(int n) {
    return n * (n + 1) / 2;
}

/**
 * Infer heavy bottle (1..n) from measured total grams.
 * baseline is triangular(n) assuming 1.0 g pills.
 */
static int bottleFromWeight(double measuredGrams, int n) {
    double baseline = triangular(n); // 210.0 for n=20
    double excess = measuredGrams - baseline;
    // each heavy pill adds 0.1 g; k pills add 0.1*k
    int k = (int) Math.round(excess / 0.1);
    if (k < 1 || k > n) {
        throw new IllegalArgumentException(
            "weight does not match any bottle: " + measuredGrams);
    }
    return k;
}
```

### Simula un frasco pesado verdadero

```java
/**
 * Simulate the classic strategy for bottles 1..n.
 * trueHeavy is 1-based. Returns the bottle index recovered from one weighing.
 */
static int identifyHeavy(int trueHeavy, int n) {
    if (trueHeavy < 1 || trueHeavy > n) {
        throw new IllegalArgumentException("trueHeavy out of range");
    }

    // one weighing: take i pills from bottle i
    double weight = 0.0;
    for (int bottle = 1; bottle <= n; bottle++) {
        int count = bottle;
        double pillMass = (bottle == trueHeavy) ? 1.1 : 1.0;
        weight += count * pillMass;
    }

    return bottleFromWeight(weight, n);
}
```

### Autocomprobación de los 20 casos

```java
static void verifyAll() {
    int n = 20;
    for (int heavy = 1; heavy <= n; heavy++) {
        int found = identifyHeavy(heavy, n);
        if (found != heavy) {
            throw new AssertionError("failed for bottle " + heavy);
        }
    }
    System.out.println("ok: all " + n + " bottles identified");
}
```

### Evita float en el modelo (opcional, más limpio)

Trabaja en **décimas de gramo**: pastilla normal = 10 unidades, pesada = 11. Todo queda en enteros.

```java
static int identifyHeavyInt(int trueHeavy, int n) {
    // units of 0.1 g: normal=10, heavy=11
    int weightUnits = 0;
    for (int bottle = 1; bottle <= n; bottle++) {
        int count = bottle;
        int pill = (bottle == trueHeavy) ? 11 : 10;
        weightUnits += count * pill;
    }
    int baselineUnits = triangular(n) * 10; // 2100
    int extraUnits = weightUnits - baselineUnits; // equals trueHeavy
    return extraUnits; // 1..n
}
```

Frase amable en entrevista: "Razonaría en décimas de gramo para no dividir floats en la pizarra."

### Números trabajados

Frasco 12 pesado, `n = 20`:

```
baseline = 210.0 g
extra    = 12 * 0.1 = 1.2 g
measured = 211.2 g
k        = 1.2 / 0.1 = 12
```

Unidades enteras:

```
baseline = 2100
measured = 2100 + 12 = 2112
extra    = 12
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Tomar i pastillas del frasco i, una pesada | O(n) para armar la muestra | O(1) | n frascos; a mano es lo mismo |
| Una pastilla por frasco (inútil sola) | O(n) | O(1) | solo detecta "hay un frasco pesado" |
| Búsqueda binaria con varias pesadas | O(log n) pesadas | O(1) | rompe la regla de una pesada |
| Comparar frascos enteros entre sí | varía | O(1) | necesita estrategia de balanza; otro puzzle |

El coste interesante es **número de pesadas: 1**, no el runtime asintótico. En código, armar la muestra es aritmética O(n).

---

## 6. Casos borde y errores comunes

Los entrevistadores tocan estos:

* **El frasco 1 es pesado:** exceso 0.1 g. Fácil de olvidar si solo piensas en diferencias "grandes".
* **El frasco 20 es pesado:** exceso 2.0 g. Medido 212.0 g. Sigue siendo único.
* **Etiquetado off-by-one:** frascos 0..19 vs 1..20. Declara las etiquetas. Mapea `extra/0.1` a tu esquema de índices.
* **Punto flotante:** `211.2 - 210.0` puede ser `1.199999...`. Prefiere `Math.round` o décimas enteras.
* **Pocas pastillas en un frasco:** la estrategia pide 20 del frasco 20. Confirma que el enunciado lo permite (en el clásico sí).
* **Báscula que solo compara dos platos:** otro problema. Pregunta.
* **Posibilidad de todos normales o varios pesados:** el 6.1 clásico asume exactamente un frasco pesado.
* **Mismo conteo de cada frasco:** colapsa todas las firmas a un solo valor de exceso.

Errores comunes:

1. **Pesar frascos enteros una vez** sin un plan que aísle un índice.
2. **Usar grupos binarios** como si tuvieras log₂(20) pesadas.
3. **Olvidar la línea base** e interpretar el peso absoluto sin restar 210.
4. **Dividir el exceso entre 1.1 o 0.01** (unidad incorrecta). El exceso por pastilla pesada es **0.1 g**.
5. **Decir que la complejidad es O(1) pesadas** y luego escribir un algoritmo que hace un bucle de pesadas en código sin notar la contradicción.

Idea mínima de smoke:

```java
verifyAll();
System.out.println(identifyHeavy(7, 20));  // 7
System.out.println(identifyHeavy(20, 20)); // 20
System.out.println(identifyHeavyInt(12, 20)); // 12
```

---

## 7. Resúmeselo a un amigo

Veinte frascos. Uno tiene pastillas más pesadas. Una pesada en báscula numérica.

1. No tomes el mismo número de pastillas de cada frasco. Eso solo dice "alguien es pesado".
2. Toma **1** del frasco 1, **2** del 2, ..., **20** del 20.
3. Si todo fuera normal, la masa total es **210 g**.
4. El frasco pesado `k` suma **0.1 × k** gramos.
5. Calcula `k = (medido - 210) / 0.1`. Esa es la respuesta.
6. En código, prefiere décimas de gramo enteras para que el float no te deje en ridículo.

Si puedes explicar por qué el exceso *es* el número del frasco sin escribir un bucle, dominas el 6.1. El capítulo 6 va de este estilo: inventa una medición o un invariante, y el código queda corto.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Draw Line](/blog/es/ctci-5-8-draw-line)
* Siguiente: [Basketball](/blog/es/ctci-6-2-basketball)