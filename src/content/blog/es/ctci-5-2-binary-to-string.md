---
title: "Binario a Cadena: Convertir Números Reales a Binario de Precisión Fija (CTCI 5.2)"
description: "Dado un numero real entre 0 y 1 como double, imprime su representacion binaria con un maximo de 32 caracteres o retorna ERROR en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-2-binary-to-string.webp
previewImage: /assets/images/ctci-5-2-binary-to-string.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un numero real entre 0 y 1 (por ejemplo, 0.72) pasado como double, imprime su representacion binaria. Si el numero no puede representarse con precision en a lo sumo 32 caracteres, imprime "ERROR".
> * **La Solución Óptima:** Multiplicacion Sucesiva por 2: Multiplicar una fraccion por 2 desplaza los digitos binarios fraccionarios una posicion a la izquierda. Si $r = num \times 2 \ge 1$, el siguiente bit es `1` (y restamos 1 de $r$); de lo contrario es `0`. Si supera los 32 caracteres, retorna `"ERROR"` en tiempo $O(1)$ y espacio $O(1)$.
> * **Realidad en Producción:** Codificadores/decodificadores IEEE 754 y representaciones de punto fijo en motores financieros.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.2), se nos plantea:

*"Dado un numero real entre 0 y 1 (ej. 0.72) pasado como double, imprime su representacion binaria. Si no puede representarse con exactitud con un maximo de 32 caracteres, imprime 'ERROR'."*

**Base Matemática:**
Cualquier numero $x \in (0, 1)$ se expresa en binario como:
$$x = \sum_{i=1}^{\infty} b_i \cdot 2^{-i} = b_1 \cdot 2^{-1} + b_2 \cdot 2^{-2} + b_3 \cdot 2^{-3} + \dots$$
Multiplicar por 2 produce $2x = b_1 + b_2 \cdot 2^{-1} + \dots$, donde la parte entera es el bit $b_1$.

## 2. Mecánica Algorítmica

1. Validar que $0 < num < 1$.
2. Inicializar `StringBuilder binary = new StringBuilder(".")`.
3. Mientras `num > 0`:
   * Si `binary.length() >= 32`, retornar `"ERROR"`.
   * Calcular `r = num * 2`.
   * Si $r \ge 1$: agregar `'1'` y actualizar `num = r - 1`.
   * Si no: agregar `'0'` y actualizar `num = r`.
4. Retornar `binary.toString()`.

## Implementación de Producción

```java
public class BinaryToString {
    /**
     * Convierte un numero real en (0, 1) a cadena binaria.
     * Complejidad Temporal: O(1) [maximo 32 iteraciones]
     * Complejidad Espacial: O(1)
     */
    public static String printBinary(double num) {
        if (num >= 1 || num <= 0) {
            return "ERROR";
        }

        StringBuilder binary = new StringBuilder();
        binary.append(".");

        while (num > 0) {
            if (binary.length() >= 32) {
                return "ERROR";
            }

            double r = num * 2;
            if (r >= 1) {
                binary.append(1);
                num = r - 1;
            } else {
                binary.append(0);
                num = r;
            }
        }

        return binary.toString();
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | El bucle ejecuta como maximo 32 iteraciones antes de abortar o terminar. |
| Espacio Auxiliar | `O(1)` | Buffer de cadena acotado por 32 caracteres. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Precisión en Punto Flotante

1. **Fracciones Periódicas en Binario:** Numeros decimales comunes como $0.1_{10}$ son periodicos en binario ($0.000110011..._2$). Por esta razon, los sistemas financieros evitan el punto flotante binario usando representaciones de enteros escalados o `BigDecimal`.
2. **GPU Shaders:** Normalizacion de colores de 8 bits $[0, 255]$ a floats $[0.0, 1.0]$.

## Casos Límite y Robustez en Producción

1. **Potencias exactas de dos ($0.5 \to .1$, $0.75 \to .11$):** Terminan limpiamente en pocas operaciones.
2. **Fracciones no representables en 32 bits ($0.1, 0.72$):** Retornan `"ERROR"` de forma segura.
