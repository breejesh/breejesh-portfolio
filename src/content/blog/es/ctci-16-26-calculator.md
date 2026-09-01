---
title: "Calculadora: Evaluación de Expresiones Aritméticas con Precedencia de Operadores (CTCI 16.26)"
description: "Como evaluar expresiones matematicas con operadores +, -, *, / en tiempo lineal O(N) mediante una pila y reglas de precedencia de operadores."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-26-calculator.webp
previewImage: /assets/images/ctci-16-26-calculator.webp
---

> **TL;DR**
> * **El Problema del Libro:** Evaluar una expresion aritmetica compuesta por enteros no negativos y operadores `+`, `-`, `*`, `/` (sin parentesis) respetando el orden matematico de operaciones.
> * **La Solución Óptima:** **Precedencia de Operadores mediante Pila (Stack)**:
>   1. Al encontrar `*` o `/`, operar de inmediato desapilando el ultimo numero de la pila e insertando `ultimo * actual` o `ultimo / actual`.
>   2. Al encontrar `+` o `-`, apilar `+actual` o `-actual` en la pila.
>   3. Al finalizar, sumar todos los valores acumulados en la pila.
>   4. Se ejecuta en **tiempo $O(N)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Motores de evaluacion de consultas SQL (DuckDB, ClickHouse) y parsers de hojas de calculo (Excel / Google Sheets).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.26), se nos pide evaluar una expresion aritmetica (ej. `"2*3+5/6*3+15"`) respetando la precedencia de operadores en tiempo $O(N)$.

## 2. Evaluación con Pila en una Pasada

En lugar de construir un analizador sintactico recursivo pesado, procesamos la cadena de izquierda a derecha con una pila numerica.

## Implementación de Producción

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class BasicCalculator {

    public static double compute(String expression) {
        if (expression == null || expression.isEmpty()) return 0.0;

        Deque<Double> stack = new ArrayDeque<>();
        double currentNum = 0.0;
        char lastOp = '+';

        for (int i = 0; i < expression.length(); i++) {
            char c = expression.charAt(i);

            if (Character.isDigit(c)) {
                currentNum = currentNum * 10 + (c - '0');
            }

            // Si es operador o el ultimo caracter de la cadena
            if ((!Character.isDigit(c) && c != ' ') || i == expression.length() - 1) {
                switch (lastOp) {
                    case '+': stack.push(currentNum); break;
                    case '-': stack.push(-currentNum); break;
                    case '*': stack.push(stack.pop() * currentNum); break;
                    case '/': 
                        if (currentNum == 0.0) throw new ArithmeticException("Division por cero");
                        stack.push(stack.pop() / currentNum); 
                        break;
                }
                lastOp = c;
                currentNum = 0.0;
            }
        }

        double total = 0.0;
        while (!stack.isEmpty()) {
            total += stack.pop();
        }
        return total;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Un solo recorrido lineal sobre la cadena de longitud N. |
| Espacio Auxiliar | `O(N)` | Pila con como maximo N operandos. |
| Sobrecarga | `O(1)` | Sin arboles AST ni memoria dinamica pesada. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores SQL y Compiladores

1. **Motores de Bases de Datos SQL:** Evaluan expresiones vectorizadas compilando formulas a notacion polaca inversa (RPN) o bytecode de pila ejecutado mediante JIT.
2. **Algoritmo Shunting-Yard de Dijkstra:** Empleado en motores de hojas de calculo para resolver grafos de dependencias entre celdas.

## Casos Límite y Robustez en Producción

1. **División por Cero:** Lanzamiento de `ArithmeticException` explicita.
2. **Espacios en Blanco:** Ignorados de forma segura durante la iteracion.
