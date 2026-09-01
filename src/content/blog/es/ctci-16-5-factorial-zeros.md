---
title: "Ceros Factoriales: Conteo de Ceros Finales mediante la Fórmula de Legendre (CTCI 16.5)"
description: "Calcula la cantidad exacta de ceros finales en n factorial sin calcular su valor mediante la Formula de Legendre y factorizacion en base 5 en O(log5 n)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-5-factorial-zeros.webp
previewImage: /assets/images/ctci-16-5-factorial-zeros.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un algoritmo que calcule la cantidad de ceros finales en el factorial de $n$ ($n!$).
> * **El Principio Matemático:** **Fórmula de Legendre y Factores Primos**:
>   1. Los ceros finales se generan mediante el producto de factores primos $2 \times 5 = 10$.
>   2. En $n!$, la cantidad de factores 2 supera holgadamente a los factores 5.
>   3. El numero de ceros finales equivale al conteo exacto de factores 5 en la descomposicion prima:
>      $$Z(n) = \sum_{k=1}^{\infty} \left\lfloor \frac{n}{5^k} \right\rfloor = \left\lfloor \frac{n}{5} \right\rfloor + \left\lfloor \frac{n}{25} \right\rfloor + \left\lfloor \frac{n}{125} \right\rfloor + \cdots$$
>   4. Se divide iterativamente $n$ entre 5 para prevenir desbordamientos de enteros.
>   5. Se ejecuta en **tiempo $O(\log_5 n)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Aritmetica de precision arbitraria y criptografia modular.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.5), se nos plantea:

*"Calcula el numero de ceros finales en n! sin computar el gigantesco valor numerico del factorial."*

## 2. Demostración mediante la Fórmula de Legendre

Para $n = 26$:
* Multiplos de $5$: $\{5, 10, 15, 20, 25\} \implies \lfloor 26 / 5 \rfloor = 5$
* Multiplos de $25$: $\{25\} \implies \lfloor 26 / 25 \rfloor = 1$
* Total de ceros: $5 + 1 = 6$.

## Implementación de Producción

```java
public class FactorialZeros {

    public static int countTrailingZeros(int n) {
        if (n < 0) return -1;

        int count = 0;
        while (n >= 5) {
            count += n / 5;
            n /= 5;
        }
        return count;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(log5 n)` | Realiza $\approx 13$ iteraciones para el maximo entero de 32 bits. |
| Espacio Auxiliar | `O(1)` | Memoria constante sin asignaciones dinamicas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Crecimiento Astronómico de $n!$

1. **Inviabilidad de BigInteger:** $1000!$ posee 2.568 digitos. Intentar calcular el valor para contar los ceros provocaria saturacion de memoria y millones de operaciones de multiplicacion innecesarias.
2. **Valuación p-ádica ($\nu_p(n!)$):** Fundamento en criptografia asimetrica para optimizar calculos modulares.

## Casos Límite y Robustez en Producción

1. **Entrada Negativa:** Retorna `-1` indicando valor no valido.
2. **Cero y Uno:** Retorna `0` correctamente ($0! = 1$).
