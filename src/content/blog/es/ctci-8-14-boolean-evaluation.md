---
title: "Evaluación Booleana: Conteo de Parentizaciones con Programación Dinámica de Intervalos (CTCI 8.14)"
description: "Cuenta las formas de parentizar una expresion booleana con 0, 1, &, |, ^ para evaluar a un resultado deseado mediante DP de intervalos en O(N^3)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una expresion booleana con simbolos `0` (false), `1` (true), `&` (AND), `|` (OR) y `^` (XOR), y un valor objetivo `result`, implementa una funcion para contar el numero de formas de parentizar la expresion para que evalue a `result`.
> * **La Solución Óptima:** Programación Dinámica de Intervalos: (1) Divide la expresion en cada operador en indices impares $i = 1, 3, 5 \dots$; (2) Calcula de forma recursiva y memoizada las formas en que la parte izquierda y derecha evaluan a `true` y `false`; (3) Aplica tablas de verdad para operadores `&`, `|` y `^`; (4) Memoiza con `HashMap<String, Integer>` en **tiempo $O(N^3)$** y **espacio $O(N^2)$**.
> * **Realidad en Producción:** Optimizacion de predicados SQL y sintesis de circuitos logicos digitales (FPGA / ASIC).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.14), se nos plantea:

*"Cuenta el numero de formas de colocar parentesis en una expresion booleana para que su evaluacion sea igual al booleano deseado."*

## 2. Partición por Intervalos y Tablas de Verdad

Para cada operador:
* Total de combinaciones: $\text{total} = (l_t + l_f) \times (r_t + r_f)$.
* `^` (XOR): $\text{totalTrue} = l_t \times r_f + l_f \times r_t$.
* `&` (AND): $\text{totalTrue} = l_t \times r_t$.
* `|` (OR): $\text{totalTrue} = l_t \times r_t + l_f \times r_t + l_t \times r_f$.

## Implementación de Producción

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {
    /**
     * Cuenta las formas de parentizar para obtener el resultado booleano deseado.
     * Complejidad Temporal: O(N^3)
     * Complejidad Espacial: O(N^2)
     */
    public static int countEval(String s, boolean result) {
        return countEvalHelper(s, result, new HashMap<>());
    }

    private static int countEvalHelper(String s, boolean result, Map<String, Integer> memo) {
        if (s.length() == 0) return 0;
        if (s.length() == 1) {
            return stringToBool(s) == result ? 1 : 0;
        }

        String key = result + s;
        if (memo.containsKey(key)) return memo.get(key);

        int ways = 0;

        for (int i = 1; i < s.length(); i += 2) {
            char op = s.charAt(i);
            String left = s.substring(0, i);
            String right = s.substring(i + 1);

            int leftTrue = countEvalHelper(left, true, memo);
            int leftFalse = countEvalHelper(left, false, memo);
            int rightTrue = countEvalHelper(right, true, memo);
            int rightFalse = countEvalHelper(right, false, memo);

            int total = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int totalTrue = 0;

            if (op == '^') {
                totalTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            } else if (op == '&') {
                totalTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                totalTrue = leftTrue * rightTrue + leftFalse * rightTrue + leftTrue * rightFalse;
            }

            int subWays = result ? totalTrue : (total - totalTrue);
            ways += subWays;
        }

        memo.put(key, ways);
        return ways;
    }

    private static boolean stringToBool(String c) {
        return c.equals("1");
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N^3)` | $O(N^2)$ sub-cadenas posibles, evaluando $O(N)$ operadores en cada una. |
| Espacio Auxiliar | `O(N^2)` | Mapa de memoizacion para almacenar sub-expresiones. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Optimización

1. **Reordenamiento de Filtros SQL:** Evaluacion de agrupaciones logicas de clausulas `WHERE` para reducir el volumen de lectura en disco.
2. **Síntesis Lógica Digital:** Reasociacion de compuertas logicas para minimizar retrasos de propagacion en semiconductores.

## Casos Límite y Robustez en Producción

1. **Literal Único (`"1"`, true):** Retorna 1.
2. **Cadena Vacía:** Retorna 0.
