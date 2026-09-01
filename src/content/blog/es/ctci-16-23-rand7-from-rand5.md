---
title: "Rand7 a partir de Rand5: Muestreo por Rechazo y Distribución Uniforme (CTCI 16.23)"
description: "Genera un numero aleatorio uniforme en [0, 6] a partir de un generador en [0, 4] utilizando una matriz 2D en base 5 y muestreo por rechazo en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
previewImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un generador `rand5()` que produce un entero de $0$ a $4$ con probabilidad uniforme, implementa `rand7()` que genere un entero de $0$ a $6$ con probabilidad uniforme.
> * **La Solución Óptima:** **Cuadrícula 2D Base-5 y Muestreo por Rechazo**:
>   1. **Expansión**: Dos llamadas a `rand5()` generan $5 \times 5 = 25$ resultados equiprobables:
>      $$\text{num} = 5 \times \text{rand5}() + \text{rand5}() \in [0, 24]$$
>   2. **Truncamiento Simétrico**: El mayor multiplo de 7 inferior a 25 es $21 = 3 \times 7$.
>   3. **Rechazo**: Si $\text{num} < 21$, retornar $\text{num} \pmod 7$ ($\Pr = 3/21 = 1/7$).
>   4. Si $\text{num} \ge 21$, descartar y reintentar.
>   5. Se ejecuta en **tiempo esperado $O(1)$** ($\approx 1,19$ intentos) y **espacio $O(1)$**.
> * **Realidad en Producción:** Generadores de entropia criptografica y simulaciones de Monte Carlo.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.23), se nos plantea:

*"Genera un entero uniforme no sesgado entre 0 y 6 empleando unicamente llamadas al metodo rand5()."*

## 2. Matriz de Resultados

El producto cartesiano garantiza $25$ celdas con probabilidad idéntica de $1/25$.

## Implementación de Producción

```java
import java.util.Random;

public class Rand7FromRand5 {

    private static final Random RNG = new Random();

    public static int rand5() {
        return RNG.nextInt(5);
    }

    public static int rand7() {
        while (true) {
            int num = 5 * rand5() + rand5();
            if (num < 21) {
                return num % 7;
            }
        }
    }
}
```

## Análisis de Complejidad

| Métrica | Valor | Detalle Técnico |
|---|---|---|
| Probabilidad de Aceptación | $p = 21 / 25 = 84{,}0\%$ | Alta tasa de exito en el primer intento. |
| Intentos Esperados | $E = 25 / 21 \approx 1{,}19$ | Terminacion casi instantanea. |
| Complejidad Temporal | `O(1) Esperado` | Distribucion geometrica. |
| Sesgo Estadístico | `0,00%` | Probabilidad exacta de $1/7$ por valor. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Despolarización de Entropía

1. **Algoritmo de von Neumann:** Tratamiento de generadores de ruido fisico en chips criptograficos para eliminar sesgos estadisticos mediante muestreo por rechazo.
2. **Método de Monte Carlo:** Transformacion de variables uniformes en distribuciones continuas complejas.

## Casos Límite y Robustez en Producción

1. **La Trampa de `(rand5() + rand5()) % 7`:** Sumar dos variables produce una distribucion triangular no uniforme ($P(4) > P(0)$). La multiplicacion $5 \times \text{rand5}()$ preserva la uniformidad.
