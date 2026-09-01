---
title: "Operaciones Aritméticas: Resta, Multiplicación y División solo con Sumas (CTCI 16.9)"
description: "Implementa la resta, multiplicacion y division de enteros utilizando unicamente el operador suma, con negacion por duplicacion exponencial en O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-9-operations.webp
previewImage: /assets/images/ctci-16-9-operations.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe metodos para implementar las operaciones de multiplicacion, resta y division para enteros. El unico operador que puedes utilizar es el de suma (`+`).
> * **La Solución Óptima:** **Negación y Cociente por Duplicación Exponencial**:
>   1. **Negación (`negate(x)`)**: En lugar de sumar $\pm 1$ en $O(N)$ pasos, duplicar exponencialmente el delta ($\Delta = -1, -2, -4, -8, \dots$) en tiempo **$O(\log |x|)$**.
>   2. **Resta (`subtract(a, b)`)**: $a - b = a + \text{negate}(b)$.
>   3. **Multiplicación (`multiply(a, b)`)**: Sumar repetidamente $a$ tantas veces como indique $|b|$.
>   4. **División (`divide(a, b)`)**: Ajustar múltiplos exponenciales de $b$ sobre $a$ mediante busqueda binaria aditiva.
>   5. Se ejecuta con negacion en **$O(\log |x|)$** y division en **$O(\log^2 (a / b))$**.
> * **Realidad en Producción:** Unidades aritmetico-logicas (ALU) y microcontroladores sin hardware de division.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.9), se nos plantea:

*"Construye las operaciones fundamentales de resta, producto y division entera empleando unica y exclusivamente el operador de suma (+)."*

## 2. Negación por Duplicación Exponencial

Para negar $x$, incrementamos el paso duplicandolo ($\Delta \leftarrow \Delta + \Delta$) para alcanzar el objetivo en pasos logaritmicos.

## Implementación de Producción

```java
public class Operations {

    public static int negate(int a) {
        if (a == 0) return 0;
        int negated = 0;
        int direction = (a < 0) ? 1 : -1;
        int delta = direction;

        while (a != 0) {
            boolean willExceed = (direction > 0) ? (a + delta > 0) : (a + delta < 0);
            if (willExceed) {
                delta = direction;
            }
            negated += delta;
            a += delta;
            delta += delta;
        }
        return negated;
    }

    public static int subtract(int a, int b) {
        return a + negate(b);
    }

    public static int multiply(int a, int b) {
        if (a == 0 || b == 0) return 0;
        if (abs(a) < abs(b)) return multiply(b, a);

        int absB = abs(b);
        int product = 0;
        for (int i = 0; i < absB; i++) {
            product += a;
        }
        return (b < 0) ? negate(product) : product;
    }

    public static int divide(int a, int b) {
        if (b == 0) throw new ArithmeticException("Division por cero");
        if (a == 0) return 0;

        int absA = abs(a);
        int absB = abs(b);
        int quotient = 0;
        int total = 0;

        while (total + absB <= absA) {
            int currentProduct = absB;
            int currentQuotient = 1;
            while (total + currentProduct + currentProduct <= absA) {
                currentProduct += currentProduct;
                currentQuotient += currentQuotient;
            }
            total += currentProduct;
            quotient += currentQuotient;
        }

        boolean sameSign = (a > 0 && b > 0) || (a < 0 && b < 0);
        return sameSign ? quotient : negate(quotient);
    }

    private static int abs(int a) {
        return (a < 0) ? negate(a) : a;
    }
}
```

## Análisis de Complejidad

| Operación | Complejidad Temporal | Espacio Auxiliar |
|---|---|---|
| **`negate(a)`** | $O(\log |a|)$ | $O(1)$ |
| **`subtract(a, b)`** | $O(\log |b|)$ | $O(1)$ |
| **`multiply(a, b)`** | $O(\min(|a|, |b|))$ | $O(1)$ |
| **`divide(a, b)`** | $O(\log^2 (a / b))$ | $O(1)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Microcódigo en ALUs

1. **Arquitecturas sin Divisor Hardware:** Microprocesadores de bajo consumo sintetizan divisiones mediante sumadores y desplazadores de bits a nivel de microcodigo.
2. **Complemento a Dos:** Las CPUs ejecutan la negacion en un solo ciclo de reloj mediante `~x + 1`.

## Casos Límite y Robustez en Producción

1. **División por Cero:** Lanza `ArithmeticException` explicitamente.
