---
title: "Boolean Evaluation: contar formas de parentizar una expresión (Java)"
description: "Problema estilo CTCI 8.14 para principiantes: cuenta cuántas parentizaciones completas de una expresión 0/1 con &, | y ^ dan true o false. Recursión con memo sobre subcadenas en Java."
date: "2025-11-27"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.14 para principiantes: cuenta cuántas parentizaciones completas de una expresión 0/1 con &, | y ^ dan true o false. Recursión con memo sobre subcadenas en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Una expresión booleana es una cadena de bits y operadores: `1^0|0|1`. Sin paréntesis es ambigua. Con parentización completa cada operador binario tiene un subexpresión izquierda y derecha claras. **Boolean Evaluation** pregunta: dada la cadena y un valor de verdad objetivo, ¿cuántas parentizaciones completas distintas hacen que todo evalúe a ese objetivo?

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de recursión y DP en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 8 cierra aquí con cortes memoizados de una expresión.

---

## 1. Analogía cotidiana

Piensa en una fila de interruptores (`0` apagado, `1` encendido) con compuertas entre ellos: **AND** (`&`), **OR** (`|`), **XOR** (`^`).

Debes decidir el orden de combinar pares. Cada orden es una parentización completa:

```
1 ^ 0 | 1
  podría ser (1 ^ 0) | 1
  o         1 ^ (0 | 1)
```

Esos dos árboles pueden no coincidir. El primero es `(1) | 1` → true. El segundo es `1 ^ (1)` → false.

Tu trabajo no es elegir un orden. Es **contar** cuántos órdenes producen un resultado dado (true o false).

Las expresiones cortas se sienten como árboles pequeños. Las largas explotan en números tipo Catalan de árboles binarios, así que necesitarás memoización.

---

## 2. Enunciado en palabras simples

**Entrada:** una cadena `expr` de longitud impar. En índices pares hay `'0'` o `'1'`. En índices impares hay `'&'`, `'|'` o `'^'`. Un booleano `result` (el objetivo).

**Salida:** el número de formas de parentizar por completo `expr` para que evalúe a `result`.

**Reglas:**

* Cada parentización es un árbol binario completo sobre los operadores (cada operador tiene exactamente un subexpresión izquierda y uno derecha).
* Los operadores se evalúan solo cuando ambos lados están resueltos (sin trucos de precedencia; los paréntesis deciden todo).
* Cuentas árboles de parentización distintos, no cadenas finales distintas.

**Ejemplos:**

| Expresión | Objetivo | Formas | Notas |
| --- | --- | --- | --- |
| `"1"` | true | 1 | un solo bit |
| `"1"` | false | 0 | |
| `"1^0\|1"` | true | 1 | recorrido abajo |
| `"1^0\|0\|1"` | false | 2 | ejemplo clásico |
| `"0&0&0&1^1\|0"` | true | 10 | ejemplo clásico |

Aclara:

* ¿Cadena vacía? Devuelve 0 (o define inválido).
* ¿Longitud o caracteres inválidos? Fuera de alcance; asume bien formada.
* ¿El mismo operador en distinto árbol cuenta aparte? Sí. Árboles, no cadenas aplanadas.
* ¿Overflow? Usa `int` salvo que digan lo contrario. Con cadenas largas el conteo crece rápido.

---

## 3. Piensa antes de codificar

### Bruto: prueba cada corte

En una parentización completa de varios operadores, **algún operador es la raíz** (el último que se aplica). Ese operador está en un índice impar `i`. La subcadena izquierda es `expr[0..i)`, la derecha `expr[i+1..]`.

De forma recursiva:

1. Si la longitud es 1: devuelve 1 si ese bit coincide con el objetivo, si no 0.
2. Para cada índice de operador `i = 1, 3, 5, ...`:
   * Cuenta formas en que la izquierda es true y false.
   * Cuenta formas en que la derecha es true y false.
   * Combina con el operador para saber cuántas formas de ese corte dan el objetivo.
3. Suma sobre todas las posiciones de operador raíz.

Eso es correcto y coincide con la definición de parentización completa.

### Tablas de verdad al combinar

Para un operador raíz fijo, sea:

* `lt`, `lf` = formas de que la izquierda sea true / false
* `rt`, `rf` = formas de que la derecha sea true / false

Total de formas de este corte (cualquier resultado): `(lt + lf) * (rt + rf)`.

Formas en que el corte es **true**:

| Op | true cuando |
| --- | --- |
| `&` | izquierda true y derecha true → `lt * rt` |
| `\|` | no ambas false → `lt*rt + lt*rf + lf*rt` |
| `^` | lados distintos → `lt*rf + lf*rt` |

Formas en que el corte es **false** = total del corte menos formas true (o escribe la tabla dual).

Suma el conteo elegido a la respuesta de esta expresión y objetivo.

### Por qué memoización

La misma subcadena (por ejemplo `"0|1"`) se pide muchas veces, una por true y una por false, desde distintos padres. Clave el memo por `(subcadena, resultadoDeseado)` o por índices inicio/fin más resultado.

Sin memo, el trabajo sigue el número de árboles binarios, que crece como los números de Catalan: exponencial en el número de operadores.

Con memo sobre O(n²) subcadenas y 2 resultados, cada estado mira O(n) cortes, del orden de O(n³) si controlas el costo de substrings. Usar índices en lugar de strings nuevas mantiene las constantes sanas.

### Forma con índices (preferida en código)

Trabaja sobre el array original con `count(start, end, result)` como la subcadena `expr[start..end)` (`end` exclusivo, `end - start` impar).

Los operadores viven en offsets impares desde `start`. Bucle `k = start + 1; k < end; k += 2`.

---

## 4. Solución en Java

### Recursión con memo sobre subcadenas (claves string)

Primera versión clara. Fácil de explicar en pizarra.

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {

    public static int countEval(String expr, boolean result) {
        if (expr == null || expr.isEmpty()) {
            return 0;
        }
        return ways(expr, result, new HashMap<String, Integer>());
    }

    private static int ways(String expr, boolean result, Map<String, Integer> memo) {
        if (expr.length() == 0) {
            return 0;
        }
        if (expr.length() == 1) {
            boolean bit = expr.charAt(0) == '1';
            return bit == result ? 1 : 0;
        }

        String key = result + "#" + expr;
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        int total = 0;
        // operators sit at odd indices: 1, 3, 5, ...
        for (int i = 1; i < expr.length(); i += 2) {
            char op = expr.charAt(i);
            String left = expr.substring(0, i);
            String right = expr.substring(i + 1);

            int leftTrue = ways(left, true, memo);
            int leftFalse = ways(left, false, memo);
            int rightTrue = ways(right, true, memo);
            int rightFalse = ways(right, false, memo);

            int waysTrue = 0;
            if (op == '&') {
                waysTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                waysTrue = leftTrue * rightTrue
                    + leftTrue * rightFalse
                    + leftFalse * rightTrue;
            } else if (op == '^') {
                waysTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            }

            int totalForSplit = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int waysForTarget = result ? waysTrue : (totalForSplit - waysTrue);
            total += waysForTarget;
        }

        memo.put(key, total);
        return total;
    }
}
```

### Misma idea con índices (menos strings)

```java
public static int countEvalIndexed(String expr, boolean result) {
    if (expr == null || expr.isEmpty()) {
        return 0;
    }
    // memo[start][end][0=false,1=true] ; -1 means unknown
    int n = expr.length();
    int[][][] memo = new int[n][n + 1][2];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= n; j++) {
            memo[i][j][0] = -1;
            memo[i][j][1] = -1;
        }
    }
    return waysIdx(expr, 0, n, result, memo);
}

private static int waysIdx(String expr, int start, int end, boolean result, int[][][] memo) {
    int r = result ? 1 : 0;
    if (memo[start][end][r] != -1) {
        return memo[start][end][r];
    }

    if (end - start == 1) {
        boolean bit = expr.charAt(start) == '1';
        int ans = bit == result ? 1 : 0;
        memo[start][end][r] = ans;
        return ans;
    }

    int total = 0;
    for (int k = start + 1; k < end; k += 2) {
        char op = expr.charAt(k);
        int lt = waysIdx(expr, start, k, true, memo);
        int lf = waysIdx(expr, start, k, false, memo);
        int rt = waysIdx(expr, k + 1, end, true, memo);
        int rf = waysIdx(expr, k + 1, end, false, memo);

        int waysTrue = 0;
        if (op == '&') {
            waysTrue = lt * rt;
        } else if (op == '|') {
            waysTrue = lt * rt + lt * rf + lf * rt;
        } else if (op == '^') {
            waysTrue = lt * rf + lf * rt;
        }

        int splitTotal = (lt + lf) * (rt + rf);
        total += result ? waysTrue : (splitTotal - waysTrue);
    }

    memo[start][end][r] = total;
    return total;
}
```

### Recorrido: `"1^0|1"` y objetivo true

Operadores en índices 1 (`^`) y 3 (`|`).

**Raíz en `^`:** izquierda `"1"`, derecha `"0|1"`.

* Izquierda: 1 true, 0 false.
* Derecha `"0|1"`: un solo árbol, `0|1` → true. Así right true = 1, right false = 0.
* `^` es true cuando los lados difieren: `1 * 0 + 0 * 1 = 0`. Cero formas true con esta raíz.

**Raíz en `|`:** izquierda `"1^0"`, derecha `"1"`.

* Izquierda `"1^0"`: un árbol, true. left true = 1, left false = 0.
* Derecha: true = 1.
* `|` true: `1*1 + 1*0 + 0*1 = 1`.

Total formas true = 0 + 1 = **1**.

Formas false = 1 (la otra raíz). Comprueba: `countEval("1^0|1", false)` debe ser 1.

### Recorrido: clásico `"1^0|0|1"` → false = 2

Hay tres operadores, así que Catalan C₃ = 5 parentizaciones completas. Exactamente dos evalúan a false. La recursión con memo enumera esas cinco eligiendo cada operador como raíz y combinando conteos hijos; en la entrevista no listas árboles a mano, pero en una cadena corta sí puedes para ganar confianza.

Prueba rápida:

```java
public static void main(String[] args) {
    System.out.println(countEval("1", true));              // 1
    System.out.println(countEval("1", false));             // 0
    System.out.println(countEval("1^0|1", true));          // 1
    System.out.println(countEval("1^0|1", false));         // 1
    System.out.println(countEval("1^0|0|1", false));       // 2
    System.out.println(countEval("0&0&0&1^1|0", true));    // 10
}
```

---

## 5. Tabla de complejidad

Sea n = longitud de la cadena (aprox. 2m + 1 con m operadores).

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Recursión sin memo | Exponencial (Catalan) | O(m) pila | Solo entradas minúsculas |
| Memo sobre subcadenas | Orden O(n³) con DP por índices | O(n²) estados | Respuesta preferida en entrevista |
| DP bottom-up por longitud | Mismo orden | O(n²) | Misma recurrencia corto→largo |

Cada uno de O(n²) intervalos tiene 2 sabores de resultado. Cada intervalo prueba O(n) raíces. Eso multiplica a trabajo cúbico. Memo con clave string es la misma idea asintótica con más allocación.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Un solo bit** `"0"` / `"1"` con objetivo que coincide o no.
* **Un operador** `"1&0"`, `"1|0"`, `"1^0"`: un solo árbol; respuesta 0 o 1.
* **Todos bits false con `|`:** aún puede ser false solo si cada subexpresión sigue false; camina las tablas, no adivines.
* **Objetivo false:** fácil olvidar e implementar solo tablas de true. Usa `total - waysTrue` o escribe ambas.
* **Longitud par u operador al final:** entrada inválida; di tu supuesto.
* **n grande:** el conteo desborda `int`. Menciona `long` si hace falta.

Errores comunes:

1. **Aplicar precedencia de operadores** en lugar de parentización pura. El problema ignora la precedencia habitual; todo árbol vale.
2. **Cortar en cada índice**, incluidos los bits. Solo índices impares (operadores) son raíces.
3. **Clave de memo sin el resultado.** Formas a true y a false de la misma subcadena difieren. Cachea ambos o incluye el resultado en la clave.
4. **Multiplicar mal las combinaciones** de `|` o `^`. Escribe la tabla de tres líneas en la pizarra antes de codificar.
5. **Devolver todos los árboles** cuando piden un solo objetivo. Filtra siempre por `result`.
6. **Off-by-one en subcadenas** (`substring(i)` vs `substring(i+1)`). El operador en `i` no forma parte de ningún lado.

---

## 7. Resumen para contárselo a un amigo

Boolean Evaluation cuenta parentizaciones de una expresión `0`/`1` con `&`, `|`, `^` que evalúan a un valor de verdad dado.

1. Algún operador es el último aplicado (raíz del árbol de parseo).
2. Corta a izquierda y derecha de ese operador. Cuenta de forma recursiva cuántas veces cada lado es true y false.
3. Combina con la tabla de verdad del operador para formas true (y false como total menos true).
4. Suma sobre cada posible operador raíz.
5. Memoiza por subcadena (o start/end) más resultado deseado para matar la explosión Catalan.

Si puedes recorrer `"1^0|1"`, rellenar los conteos true de `&` / `|` / `^`, y explicar por qué la clave del memo incluye el booleano objetivo, dominas el problema 8.14. El capítulo 8 de recursión y DP cierra con el patrón clásico de "contar formas de parentizar".

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Stack of Boxes](/blog/es/ctci-8-13-stack-of-boxes)
* Siguiente: [Stock Data](/blog/es/ctci-9-1-stock-data)