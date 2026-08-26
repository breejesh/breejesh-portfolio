---
title: "Stack of Boxes: la pila estrictamente decreciente más alta (Java)"
description: "Problema estilo CTCI 8.13 para principiantes: apila cajas solo si ancho, profundidad y altura son todos estrictamente menores. Ordena una dimensión y usa DP con memo para la altura total máxima."
date: "2026-02-26"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.13 para principiantes: apila cajas solo si ancho, profundidad y altura son todos estrictamente menores. Ordena una dimensión y usa DP con memo para la altura total máxima.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes un montón de cajas de envío en el suelo. Cada caja es un rectángulo sólido: ancho, profundidad, altura. Quieres la torre más alta posible, pero la regla es dura. Una caja solo puede ir encima de otra si es **estrictamente menor en cada dimensión**: ancho, profundidad y altura. Sin inclinar, sin rotar a mitad de pila, sin "casi vale". Eso es **Stack of Boxes**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de recursión y DP en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y programación dinámica, problema 8.13.

---

## 1. Analogía cotidiana

Piensa en apilar **cajas tipo matrioska**, pero los tres ejes deben encoger, no solo uno.

* La caja de arriba debe ser más estrecha, menos profunda y más baja que la de abajo.
* No hace falta usar todas. Omite las que bloquean una torre más alta.
* La altura de la torre es la **suma de las alturas** de las cajas que dejas, no el número de cajas.

Si la caja A es `4 x 5 x 6` y la B es `3 x 4 x 5`, B puede ir sobre A (los tres lados menores). Si B es `3 x 6 x 5`, falla la profundidad, así que B no puede ir sobre A.

El puzzle es combinatorio: para cada caja decides si entra en la pila y dónde. La fuerza bruta de subconjuntos explota. Ordenar más recursión con memo (o DP bottom-up) lo deja en algo que puedes escribir en una pizarra.

---

## 2. Enunciado en palabras simples

**Entrada:** una lista de `n` cajas. Cada caja tiene enteros positivos `width`, `height`, `depth`.

**Salida:** la altura total máxima de una pila donde cada caja superior es **estrictamente menor** en ancho, profundidad y altura que la de abajo.

**Reglas:**

* Desigualdad estricta en **las tres** dimensiones en cada par adyacente de la pila.
* Puedes dejar cajas fuera de la pila.
* El orden de la lista de entrada no define el orden de la pila; tú eliges.
* En esta versión las cajas no se rotan (cada una conserva width, height, depth dados). Dilo en la entrevista si el enunciado permite rotaciones.
* La altura de la pila es la suma de los campos `height` de las cajas elegidas.

**Forma de la caja:**

```java
class Box {
    int width;
    int height;
    int depth;

    Box(int width, int height, int depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    /** True si esta caja puede ir estrictamente encima de 'below'. */
    boolean canBeAbove(Box below) {
        return this.width < below.width
            && this.height < below.height
            && this.depth < below.depth;
    }
}
```

**Ejemplos:**

| Cajas (w, h, d) | Altura máx | Por qué |
| --- | --- | --- |
| `(4,6,7), (1,2,3), (4,5,6), (10,12,32)` | `20` | fondo `10x12x32` luego `4x6x7` luego `1x2x3` → `12+6+2`. Vía `4x5x6` da `12+5+2=19` |
| una caja `(2,3,4)` | `3` | solo esa caja |
| lista vacía | `0` | nada que apilar |
| todos del mismo tamaño | altura de la más alta sola | ninguna puede ir sobre otra |
| cadena anidada de 3 | suma de las tres alturas | un orden total válido |

Aclara el ejemplo clásico con el entrevistador. Un conjunto habitual de enseñanza es:

```
(4, 6, 7), (1, 2, 3), (4, 5, 6), (10, 12, 32)
```

Una pila alta válida usa la caja grande, luego una media que cabe, luego la pequeña. Camina los números para acordar la respuesta antes de codificar.

**Aclara antes de codificar:**

* ¿Rotaciones permitidas? (Normalmente no, salvo que se diga.)
* ¿Estricto o no estricto? (Estricto: `<` en las tres.)
* ¿Tamaños duplicados? (Dimensiones iguales no apilan; como mucho una de un par empatado si no difieren en otro eje.)
* ¿Solo la altura o también la secuencia? (Solo altura aquí.)
* ¿Dimensiones negativas o cero? (Rechazar o asumir positivas.)

---

## 3. Pensar primero

### Por qué falla el subconjunto puro

Para cada caja o la omites o la colocas en algún sitio. Probar todos los subconjuntos y órdenes es exponencial. Hace falta estructura.

### Observación: ordenar una dimensión

Ordena las cajas por **altura descendente** (mayor altura primero). Entonces una pila válida tiende a recorrer la lista de cajas grandes a pequeñas. Ordenar solo no garantiza validez: ancho y profundidad aún pueden fallar. Pero da un recorrido natural: si eliges un fondo, los candidatos encima suelen aparecer más tarde, o sigues escaneando el resto y llamas a `canBeAbove`.

Muchas soluciones ordenan por altura descendente y, para el índice de fondo `i`, solo prueban cajas con índice `j > i`. Eso es correcto **si** la altura está ordenada descendente y `canBeAbove` exige altura estrictamente menor: cualquier caja que pueda ir encima del fondo tiene menor altura, así que aparece después de `i`. Ancho y profundidad se siguen comprobando en `canBeAbove`.

### Recursión con memo (historia de entrevista)

Define:

```
maxHeightAbove(bottomIndex) =
  bottom.height
  + max sobre j que pueden ir sobre bottom de maxHeightAbove(j)
  (o solo bottom.height si ningún j vale)
```

También prueba cada caja como posible fondo de una pila completa y toma el máximo global. Memoiza en `bottomIndex` para resolver cada caja-como-fondo una sola vez.

Es la misma forma que "cadena más larga de pares" o una LIS en 3D.

### DP bottom-up (estilo LIS)

1. Ordena las cajas (por ejemplo por altura ascendente o descendente, con convención clara).
2. Sea `dp[i]` la altura máxima de pila con la caja `i` como **fondo** (o como tope; elige una convención).
3. Para cada `i`, mira todos los `j` que pueden ir legalmente encima (o debajo, según tu convención) y toma `dp[i] = box[i].height + max(dp[j])`.
4. La respuesta es `max(dp[i])`.

Tiempo O(n²) en ambos casos. Espacio O(n) para el memo o el array `dp`.

### Elección de este post

Enviamos primero la versión **ordenar + recursión con memo** (historia clara: "pila más alta con esta caja abajo"), luego un gemelo bottom-up corto.

---

## 4. Solución en Java

### Principal: ordenar + recursión con memo

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class Box {
    int width;
    int height;
    int depth;

    Box(int width, int height, int depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    boolean canBeAbove(Box below) {
        return this.width < below.width
            && this.height < below.height
            && this.depth < below.depth;
    }
}

int stackOfBoxes(List<Box> input) {
    if (input == null || input.isEmpty()) {
        return 0;
    }

    Box[] boxes = input.toArray(new Box[0]);
    // más alta primero: los candidatos encima suelen ir después
    Arrays.sort(boxes, Comparator.comparingInt((Box b) -> b.height).reversed());

    int[] memo = new int[boxes.length]; // 0 = sin calcular; alturas positivas
    int best = 0;
    for (int i = 0; i < boxes.length; i++) {
        best = Math.max(best, maxHeightWithBottom(boxes, i, memo));
    }
    return best;
}

/** Altura máxima de pila cuando boxes[bottomIndex] es la caja del fondo. */
int maxHeightWithBottom(Box[] boxes, int bottomIndex, int[] memo) {
    if (memo[bottomIndex] > 0) {
        return memo[bottomIndex];
    }

    Box bottom = boxes[bottomIndex];
    int bestAbove = 0;
    for (int i = bottomIndex + 1; i < boxes.length; i++) {
        if (boxes[i].canBeAbove(bottom)) {
            bestAbove = Math.max(bestAbove, maxHeightWithBottom(boxes, i, memo));
        }
    }

    memo[bottomIndex] = bottom.height + bestAbove;
    return memo[bottomIndex];
}
```

Idea del recorrido con cuatro cajas ordenadas por altura descendente:

```
A (10, 12, 32)
B (4, 6, 7)
C (4, 5, 6)
D (1, 2, 3)
```

* Con A abajo: prueba B, C, D sobre A. B cabe. La pila con B como fondo de la parte superior puede seguir hasta D. C puede o no caber sobre A (compara las tres dims). Quédate con la mejor cadena.
* Con B abajo: quizá D sobre B.
* Pilas de una sola caja son la base cuando nada cabe encima.

El memo hace que, una vez calculado "mejor pila con B abajo", se reutilice cuando A y otros lo pidan.

### Gemelo bottom-up (misma complejidad)

```java
int stackOfBoxesBottomUp(List<Box> input) {
    if (input == null || input.isEmpty()) {
        return 0;
    }

    Box[] boxes = input.toArray(new Box[0]);
    Arrays.sort(boxes, Comparator.comparingInt((Box b) -> b.height).reversed());

    int n = boxes.length;
    int[] dp = new int[n]; // altura máx con boxes[i] como fondo
    int best = 0;

    for (int i = n - 1; i >= 0; i--) {
        int bestAbove = 0;
        for (int j = i + 1; j < n; j++) {
            if (boxes[j].canBeAbove(boxes[i])) {
                bestAbove = Math.max(bestAbove, dp[j]);
            }
        }
        dp[i] = boxes[i].height + bestAbove;
        best = Math.max(best, dp[i]);
    }
    return best;
}
```

Misma recurrencia, rellenada desde el final del array ordenado para que los resultados "encima" ya existan.

### Opcional: recuperar la pila real

Si el entrevistador quiere la secuencia, guarda `parent[i]` o reconstruye rejugando las elecciones de `dp[i]`. Solo la altura basta para el problema base.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Subconjuntos + permutar | exponencial | profundidad de pila | Solo didáctico; no lo envíes |
| Ordenar + recursión con memo | O(n²) | O(n) memo + O(n) pila | Respuesta clara de entrevista |
| Ordenar + DP bottom-up | O(n²) | O(n) | Misma idea, sin recursión |
| Ordenar por una dim sin chequear todo | incorrecto | - | Hay que mirar las tres dims |

Ordenar es O(n log n). Los barridos anidados dominan en O(n²). Para n de entrevista (decenas o cientos de cajas), va bien.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan estos:

* **Entrada vacía** → 0.
* **Una sola caja** → su altura.
* **Ninguna puede ir sobre otra** → máximo de alturas individuales (no la suma).
* **Cadena anidada perfecta** → suma de todas las alturas.
* **Dimensiones iguales en un eje** → no apilan (`<` falla). Bug fácil si alguien usa `<=`.
* **Misma altura, distinto ancho/profundidad** → el sort por altura las deja juntas; `canBeAbove` sigue rechazando si la altura no es estrictamente menor.
* **Muchas cajas, una sola cadena alta** → el memo sigue en O(n²) pero evita recomputar sub-pilas.
* **Rotaciones** → si se permiten, genera hasta 3 orientaciones por caja y corre el mismo DP. Aquí **no**, salvo que lo pidan.

Errores frecuentes:

1. **Comprobar solo una o dos dimensiones.** La regla son las tres.
2. **Usar `<=` en lugar de `<`.** Caras iguales no apilan bajo la regla estricta.
3. **Olvidar probar cada caja como posible fondo.** La respuesta global es el max sobre fondos, no solo `maxHeightWithBottom(0)`.
4. **Memo mal inicializado.** `0` como "sin calcular" vale si las alturas son positivas. Si hubiera altura cero, usa un boolean aparte o `Integer` nulos.
5. **Ordenar y creer que el orden basta.** Aún necesitas `canBeAbove` para ancho y profundidad.
6. **Maximizar el número de cajas en vez de la suma de alturas.** Dos cajas altas pueden ganar a cinco minúsculas.

Prueba mínima:

```java
List<Box> boxes = new ArrayList<>();
boxes.add(new Box(4, 6, 7));
boxes.add(new Box(1, 2, 3));
boxes.add(new Box(4, 5, 6));
boxes.add(new Box(10, 12, 32));

System.out.println(stackOfBoxes(boxes)); // suma de alturas de la pila válida más alta
System.out.println(stackOfBoxes(List.of())); // 0
System.out.println(stackOfBoxes(List.of(new Box(2, 3, 4)))); // 3
```

Calcula a mano el número esperado en la pizarra con el entrevistador para confiar en el print.

---

## 7. Resumen para un amigo

Stack of Boxes pregunta: ¿cuál es la torre más alta si cada caja de arriba debe ser estrictamente menor en ancho, profundidad y altura?

1. Modela un `Box` con `canBeAbove(below)`.
2. Ordena por altura descendente para que los candidatos más bajos en altura vayan después.
3. Define "altura máxima con la caja i abajo" como `height[i]` más la mejor pila válida encima de i.
4. Memoiza esa función (o rellena `dp` bottom-up). La respuesta es el max sobre todos los fondos.
5. Tiempo O(n²). Cuidado con desigualdades estrictas y el bucle exterior "probar cada fondo".

Si sabes ordenar, escribir `canBeAbove` y explicar por qué el memo convierte la búsqueda exponencial en O(n²), dominas el 8.13. Siguiente: evaluación booleana, otro DP sobre cadenas.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Eight Queens](/blog/es/ctci-8-12-eight-queens)
* Siguiente: [Boolean Evaluation](/blog/es/ctci-8-14-boolean-evaluation)