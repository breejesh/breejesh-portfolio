---
title: "Coins: número de formas de dar cambio (Java)"
description: "Problema estilo CTCI 8.11 para principiantes: cuenta combinaciones que suman n centavos con monedas de 25, 10, 5 y 1. DP bottom-up de cambio de monedas, el orden no importa, Java claro."
date: "2026-01-14"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-11-coins.webp
previewImage: /assets/images/ctci-8-11-coins.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.11 para principiantes: cuenta combinaciones que suman n centavos con monedas de 25, 10, 5 y 1. DP bottom-up de cambio de monedas, el orden no importa, Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes monedas infinitas de unos pocos valores fijos. Alguien pregunta: ¿cuántos montones distintos suman exactamente `n` centavos? No el menor número de monedas. El **conteo de combinaciones**. Ese es el problema clásico **Coins**: monedas de 25, 10, 5 y 1, y un importe objetivo.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de combinaciones de cambio en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y programación dinámica, problema 8.11.

---

## 1. Analogía cotidiana

Piensa en una máquina expendedora que solo acepta 25, 10, 5 y 1. Debes pagar exactamente 30 centavos. No importa qué moneda cae primero. Tres monedas de 10 son una forma. Una de 25 y una de 5 son otra. Seis de 5 son otra. El orden en la ranura no crea una forma nueva.

Si el orden importara, tres monedas de 10 explotarían en muchas permutaciones de las mismas tres monedas. En entrevistas casi siempre quieren **combinaciones**: el mismo multiconjunto de monedas es una sola forma.

Una tabla pequeña de "cuántas formas hay de hacer cada importe" es más fácil que inventar cada montón a mano. Esa tabla es programación dinámica.

---

## 2. Enunciado en palabras simples

**Entrada:** un entero no negativo `n` (centavos a formar). Opcionalmente una lista de denominaciones; el conjunto clásico es `{25, 10, 5, 1}`.

**Salida:** el número de **combinaciones distintas** de esas monedas que suman exactamente `n`. Las monedas del mismo valor son idénticas. Puedes usar tantas de cada tipo como quieras (suministro ilimitado).

**Ejemplos** con monedas `{25, 10, 5, 1}`:

| n | Formas (idea) | Conteo |
| --- | --- | --- |
| 0 | montón vacío | 1 |
| 1 | un céntimo | 1 |
| 5 | cinco céntimos; un nickel | 2 |
| 10 | ver recorrido abajo | 4 |
| 30 | muchas mezclas de 25/10/5/1 | 18 |

Formas para `n = 10` (cada línea es una combinación):

```
10×1
1×5 + 5×1
2×5
1×10
```

Eso es 4. **No** cuentas `5 luego 5` como distinto de `5 luego 5` al revés; los nickels son idénticos.

**Aclara antes de codificar:**

* ¿Combinaciones o permutaciones? Combinaciones (el orden no importa).
* ¿Suministro ilimitado de cada denominación? Sí, salvo que digan lo contrario.
* ¿Qué es `ways(0)`? Suele ser **1** (una combinación vacía). Dilo en voz alta.
* ¿`n` negativo? Devuelve 0, o asume `n >= 0`.
* ¿Tipo de retorno? `int` vale para tamaños de entrevista; menciona `long` si `n` puede crecer.
* ¿Monedas fijas o array genérico? Codifica el array genérico; demuéstralo con `{25, 10, 5, 1}`.

---

## 3. Piensa primero

### Recursión a fuerza bruta

Elige un tipo de moneda a la vez para que el orden no se cuele. Para el índice de moneda `i` y el resto `rem`:

* Si `rem == 0`, cuenta 1.
* Si `rem < 0` o se acabaron los tipos, cuenta 0.
* Si no, prueba 0, 1, 2, ... copias de `coins[i]`, y recurre al siguiente tipo con lo que quede.

Eso explora cada combinación una vez. Sin memoización es lento: muchos subproblemas solapados como "formas con monedas desde el índice 2 y rem = 40".

### Recursión con memo

Cachea en `(coinIndex, remaining)`. Misma lógica, mucho más rápido. Sigue siendo un estado de dos dimensiones.

### DP bottom-up (respuesta por defecto en entrevista)

Construye un array `ways[0 .. n]` donde `ways[a]` significa "número de combinaciones que suman `a`".

```
ways[0] = 1
for each coin c in coins:
    for a from c to n:
        ways[a] += ways[a - c]
```

Por qué importa el orden de los bucles:

| Bucle externo | Bucle interno | Qué cuentas |
| --- | --- | --- |
| monedas, luego importes | como arriba | **combinaciones** (cada multiconjunto una vez) |
| importes, luego monedas | intercambia los bucles | **permutaciones** (el orden importa) |

Quieres la primera tabla. Cada moneda se "introduce" del todo antes de pasar a la siguiente, así que secuencias que solo difieren en el orden colapsan en un solo camino por el array.

Intuición de un paso: cuando la moneda `c` está disponible, cada forma antigua de hacer `a - c` se convierte en una forma de hacer `a` añadiendo una `c` más. Puedes añadir varias `c` en actualizaciones sucesivas del mismo array porque el bucle interno sube.

### Recorrido pequeño: n = 10, coins = [1, 5, 10]

Inicio: `ways = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]`

Tras la moneda 1 (solo céntimos): cada importe tiene 1 forma.

Tras la moneda 5:

* importe 5: `ways[5] += ways[0]` → 2
* importe 6: `ways[6] += ways[1]` → 2
* ...
* importe 10: se acumulan las formas con nickels

Tras la moneda 10: `ways[10] += ways[0]` añade la combinación de un dime puro. Final `ways[10] = 4`.

### Por qué no el DP de "mínimas monedas"

El problema famoso de "pocas monedas" guarda una longitud mínima. Este guarda un **conteo**. Misma forma de bucles anidados, distinta recurrencia:

* min: `dp[a] = min(dp[a], dp[a - c] + 1)`
* ways: `ways[a] += ways[a - c]`

No los mezcles en la cabeza durante la entrevista.

### Boceto en la pizarra

1. Escribe denominaciones `25, 10, 5, 1`.
2. Dibuja `ways[0]=1`, el resto a cero.
3. Procesa una moneda cada vez (mentalmente) para un `n` pequeño como 10.
4. Rodea el orden de bucles (moneda fuera) para no caer en permutaciones.
5. Codifica el método genérico y llámalo con el array clásico.

---

## 4. Solución en Java

```java
/**
 * Number of combinations that sum to n using unlimited coins from denominations.
 * Order does not matter. ways(0) == 1.
 */
int makeChange(int n, int[] coins) {
    if (n < 0) {
        return 0;
    }
    int[] ways = new int[n + 1];
    ways[0] = 1;

    for (int coin : coins) {
        if (coin <= 0) {
            continue; // skip bad denominations if any slip in
        }
        for (int amount = coin; amount <= n; amount++) {
            ways[amount] += ways[amount - coin];
        }
    }
    return ways[n];
}

/** Classic CTCI denominations: quarters, dimes, nickels, pennies. */
int makeChange(int n) {
    return makeChange(n, new int[] {25, 10, 5, 1});
}
```

### Variante recursiva + memo (misma respuesta)

Útil si piden top-down primero:

```java
int makeChangeMemo(int n, int[] coins) {
    if (n < 0) {
        return 0;
    }
    Integer[][] memo = new Integer[coins.length][n + 1];
    return waysFrom(0, n, coins, memo);
}

private int waysFrom(int index, int remaining, int[] coins, Integer[][] memo) {
    if (remaining == 0) {
        return 1;
    }
    if (index == coins.length) {
        return 0;
    }
    if (memo[index][remaining] != null) {
        return memo[index][remaining];
    }

    int ways = 0;
    int coin = coins[index];
    for (int count = 0; count * coin <= remaining; count++) {
        ways += waysFrom(index + 1, remaining - count * coin, coins, memo);
    }
    memo[index][remaining] = ways;
    return ways;
}
```

El array bottom-up es más corto de escribir con reloj en contra. Conoce ambos.

### Recorrido: n = 5, coins = [1, 5]

| Paso | Estado de ways[0..5] |
| --- | --- |
| init | `[1, 0, 0, 0, 0, 0]` |
| tras 1 | `[1, 1, 1, 1, 1, 1]` |
| tras 5 | `[1, 1, 1, 1, 1, 2]` |

Respuesta **2**: cinco céntimos, o un nickel.

### Pruebas mínimas

```java
public static void main(String[] args) {
    int[] coins = {25, 10, 5, 1};
    System.out.println(makeChange(0, coins));   // 1
    System.out.println(makeChange(1, coins));   // 1
    System.out.println(makeChange(5, coins));   // 2
    System.out.println(makeChange(10, coins));  // 4
    System.out.println(makeChange(30, coins));  // 18
}
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Recursión sin memo | exponencial | O(d) pila | d = número de denominaciones; demasiado lento |
| Memo en (índice, resto) | O(d · n · ...) según bucles | O(d · n) | bien; más código |
| Bottom-up `ways[]` | O(d · n) | O(n) | respuesta preferida en entrevista |
| Bottom-up con solo 4 monedas fijas | O(n) | O(n) | misma idea, d es constante |

Con las cuatro monedas clásicas, el tiempo es lineal en `n`. Aun así di O(d · n) para sonar general.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores pinchan estos:

* **`n = 0`** → devuelve 1 (una combinación vacía). No 0.
* **`n` negativo** → 0, o rechaza la entrada.
* **Solo céntimos** → exactamente una forma para todo `n` no negativo.
* **No se puede formar `n`** (por ejemplo monedas `{2, 4}` y `n = 3`) → `ways[n]` se queda en 0.
* **Denominaciones duplicadas en el array** → contarías de más; asume valores únicos o deduplica.
* **Moneda mayor que `n`** → el bucle interno no corre; no pasa nada.
* **Desbordamiento de entero** → con `n` grande y muchas monedas, `int` puede envolver. Menciona `long` si crecen las cotas.

Errores comunes:

1. **Intercambiar el orden de los bucles** y contar permutaciones. Tres céntimos se sobrecontarían como órdenes distintos.
2. **Poner `ways[0] = 0`.** Entonces todo importe se queda en cero.
3. **Usar una tabla 2D sin necesidad** y fallar en los índices. 1D basta para combinaciones con monedas ilimitadas.
4. **Resolver mínimas monedas en lugar del conteo.** Otra recurrencia.
5. **Mutar el array `coins` u ordenar sin necesidad.** Ordenar no hace daño, pero el DP de combinaciones no lo exige si procesas un tipo completo cada vez.

---

## 7. Recap para contárselo a un amigo

Coins pregunta: con 25/10/5/1 ilimitados, ¿cuántas combinaciones distintas suman exactamente `n` centavos?

1. El orden no importa. Tres monedas de 10 son una forma, no seis permutaciones.
2. `ways[0] = 1`. Puedes hacer cero centavos de una forma: no usar nada.
3. Por cada moneda, recorre importes desde esa moneda hasta `n` y haz `ways[a] += ways[a - c]`.
4. Bucle externo de monedas da combinaciones. Externo de importes da permutaciones. Di cuál quieres.
5. Tiempo O(d · n), espacio O(n). Para n = 10 la respuesta es 4; para n = 30 es 18 con el conjunto clásico.

Si puedes rellenar `ways` para n = 10 a mano y explicar por qué el orden de bucles mata las permutaciones, dominas el problema 8.11.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Paint Fill](/blog/es/ctci-8-10-paint-fill)
* Siguiente: [Eight Queens](/blog/es/ctci-8-12-eight-queens)