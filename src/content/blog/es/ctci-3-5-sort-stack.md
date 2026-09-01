---
title: "Ordenar Pila: Ordenamiento con una Pila Auxiliar (CTCI 3.5)"
description: "Escribe un programa para ordenar una pila en orden ascendente (elementos menores en la cima) utilizando como maximo una pila auxiliar en tiempo O(N^2) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-5-sort-stack.webp
previewImage: /assets/images/ctci-3-5-sort-stack.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un programa para ordenar una pila de tal manera que los elementos mas pequenos esten en la parte superior. Puedes utilizar una pila temporal adicional, pero no puedes copiar los elementos en ninguna otra estructura de datos.
> * **La Solución Óptima:** Trata la pila temporal `r` como un buffer ordenado (de mayor a menor). Extrae `tmp` de la pila `s`. Mientras `!r.isEmpty() && r.peek() > tmp`, transfiere de `r` a `s` y luego inserta `tmp` en `r`. Al terminar, traslada de `r` a `s` en tiempo $O(N^2)$ y espacio auxiliar $O(N)$.
> * **Realidad en Producción:** Microcontroladores con memoria restringida y ordenamiento de registros en hardware.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 3.5), se nos plantea:

*"Escribe un programa para ordenar una pila de modo que los elementos menores esten arriba. Puedes usar como maximo una pila auxiliar temporal, pero no estructuras adicionales."*

## 2. Mecánica Algorítmica (Ordenamiento por Inserción en Pila)

Utilizamos una pila auxiliar `r` mantenida en orden con los mayores en la cima:
1. Extraer el elemento superior de `s` en la variable `tmp = s.pop()`.
2. Mientras `r` no este vacia y `r.peek() > tmp`:
   * Desapilar de `r` y apilar de vuelta en `s` (`s.push(r.pop())`).
3. Apilar `tmp` en `r`.
4. Repetir hasta vaciar `s`.
5. Trasladar todos los elementos de `r` a `s`. Al tener los mayores arriba en `r`, al invertirse en `s` quedan los menores en la cima.

## Implementación de Producción

```java
import java.util.Stack;

public class SortStack {
    /**
     * Ordena la pila s de modo que los elementos menores esten en la cima.
     * Complejidad Temporal: O(N^2)
     * Complejidad Espacial: O(N)
     */
    public static void sort(Stack<Integer> s) {
        Stack<Integer> r = new Stack<>();

        while (!s.isEmpty()) {
            int tmp = s.pop();
            while (!r.isEmpty() && r.peek() > tmp) {
                s.push(r.pop());
            }
            r.push(tmp);
        }

        while (!r.isEmpty()) {
            s.push(r.pop());
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N^2)` | Por cada uno de los $N$ elementos, se pueden transferir hasta $N$ nodos entre pilas. |
| Espacio Auxiliar | `O(N)` | Una sola pila auxiliar que almacena hasta $N$ elementos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Entornos Restringidos

1. **Microcontroladores Embebidos:** Donde no existe asignador de memoria dinamica, el ordenamiento in-situ sobre pilas garantiza consumos deterministicos.
2. **Calculadoras RPN:** Evaluacion de arboles de ejecucion aritmetica en hardware.

## Casos Límite y Robustez en Producción

1. **Pila ya ordenada:** Se ejecuta en $O(N)$ sin transferencias inversas.
2. **Elementos duplicados (`5, 5, 5`):** Manejados correctamente gracias a la condicion estricta `r.peek() > tmp`.
3. **Pila vacía o de un elemento:** Finaliza en $O(1)$.
