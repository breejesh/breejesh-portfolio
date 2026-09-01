---
title: "Jarras de Agua: Medir 4 Cuartos con Jarras de 5 y 3 Cuartos (CTCI 6.5)"
description: "Resuelve el clasico acertijo de trasvase de agua para medir exactamente 4 cuartos usando jarras de 5 y 3 cuartos mediante transiciones de estado Euclidianas."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-5-jugs-of-water.webp
previewImage: /assets/images/ctci-6-5-jugs-of-water.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes una jarra de 5 cuartos, una de 3 cuartos y un suministro ilimitado de agua (sin marcas de medicion). ¿Como obtendrias exactamente 4 cuartos de agua?
> * **La Solución Óptima:** Secuencia de Trasvase Euclideo: (1) Llenar jarra de 5 qt; (2) Verter de la de 5 a la de 3 hasta llenarla (quedan 2 qt en la de 5); (3) Vaciar la de 3 qt; (4) Pasar los 2 qt a la de 3; (5) Llenar la de 5 qt; (6) Verter de la de 5 a la de 3 hasta llenarla (transfiere 1 qt), dejando exactamente **4 cuartos** en la de 5 qt.
> * **Realidad en Producción:** Identidad de Bézout en algoritmos de asignacion y limitadores de tasa Token Bucket.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.5), se nos plantea:

*"Tienes una jarra de 5 cuartos y otra de 3 cuartos sin marcas de medicion. ¿Como obtienes exactamente 4 cuartos de agua?"*

## 2. Fundamento Matemático: Identidad de Bézout

Segun la identidad de Bézout para ecuaciones diofanticas lineales:
$$a \cdot x + b \cdot y = d$$
Se puede medir un volumen $d$ con jarras $a$ y $b$ si y solo si $d$ es multiplo de $\gcd(a, b)$ y $d \le \max(a, b)$.
* Como $\gcd(5, 3) = 1$, 4 es divisible por 1 y por tanto medible:
$$5(2) + 3(-2) = 10 - 6 = 4$$

## 3. Secuencia de Estados

| Paso | Acción | Jarra de 5 qt | Jarra de 3 qt | Detalle |
|---|---|---|---|---|
| 0 | Inicial | 0 qt | 0 qt | Vacias |
| 1 | Llenar de 5 | 5 qt | 0 qt | Llena |
| 2 | Verter 5 $\to$ 3 | 2 qt | 3 qt | Pasa 3 qt, quedan 2 qt |
| 3 | Vaciar de 3 | 2 qt | 0 qt | Descartar |
| 4 | Pasar 5 $\to$ 3 | 0 qt | 2 qt | Mueve 2 qt |
| 5 | Llenar de 5 | 5 qt | 2 qt | Llena |
| 6 | Verter 5 $\to$ 3 | **4 qt** | 3 qt | Pasa 1 qt, quedan **4 qt** |

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class JugsOfWater {
    public static class State {
        public final int jug5;
        public final int jug3;
        public final String action;

        public State(int j5, int j3, String action) {
            this.jug5 = j5;
            this.jug3 = j3;
            this.action = action;
        }
    }

    public static List<State> measureFourQuarts() {
        List<State> steps = new ArrayList<>();
        steps.add(new State(0, 0, "Estado inicial"));
        steps.add(new State(5, 0, "Llenar jarra de 5 cuartos"));
        steps.add(new State(2, 3, "Verter de 5 a 3"));
        steps.add(new State(2, 0, "Vaciar jarra de 3"));
        steps.add(new State(0, 2, "Pasar 2 cuartos a jarra de 3"));
        steps.add(new State(5, 2, "Llenar jarra de 5"));
        steps.add(new State(4, 3, "Verter hasta llenar de 3 (quedan 4 cuartos)"));
        return steps;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad de Pasos | `O(1)` | Exactamente 6 operaciones. |
| Espacio Auxiliar | `O(1)` | Registro de estados fijo. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Token Buckets

1. **Limitadores de Tasa (Token Bucket):** Modelan transferencias discretas de rafagas de trafico.
2. **Slab Allocators en Memoria:** Division y agrupamiento de bloques de memoria discretos.

## Casos Límite y Robustez en Producción

1. **Condición General:** Para cualquier capacidad $(A, B)$ y objetivo $C$, es soluble si $C \pmod{\gcd(A, B)} == 0$.
