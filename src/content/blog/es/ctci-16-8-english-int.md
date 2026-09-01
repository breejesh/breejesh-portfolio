---
title: "Entero en Palabras: Traducción de Números por Bloques de Tres Dígitos (CTCI 16.8)"
description: "Convierte cualquier entero de 32 bits en su representacion textual en palabras mediante descomposicion modular de 3 digitos y tokenizacion en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-8-english-int.webp
previewImage: /assets/images/ctci-16-8-english-int.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un numero entero, escribe un algoritmo que imprima su representacion en palabras en ingles (por ejemplo, "One Thousand Two Hundred Thirty Four").
> * **La Solución Óptima:** **Descomposición Modular en Bloques de 3 Dígitos**:
>   1. **Jerarquía de Magnitudes**: Agrupar el numero en tripletas de 3 digitos: Unidades ($10^0$), Miles ($10^3$), Millones ($10^6$) y Miles de Millones ($10^9$).
>   2. **Traducción de Bloque ($0..999$)**:
>      * Centenas: `digits[n / 100] + " Hundred"`.
>      * Decenas y Unidades: Si el resto $< 20$, consultar directamente la tabla; si es $\ge 20$, combinar decenas con unidades.
>   3. **Ensamblado**: Concatenar los bloques no vacios con sus sufijos correspondientes.
>   4. Se ejecuta en **tiempo $O(1)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Impresion de cheques bancarios y normalizacion en motores Text-to-Speech (TTS).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.8), se nos plantea:

*"Convierte un entero positivo, negativo o cero en su frase gramatical equivalente en palabras."*

## 2. Descomposición por Bloques

Dividir sucesivamente el numero entre 1.000 permite procesar cada triplete de forma modular y anadir el sufijo de magnitud correspondiente.

## Implementación de Producción

```java
import java.util.LinkedList;

public class EnglishIntConverter {

    private static final String[] SMALLS = {
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private static final String[] BIGS = {
        "", "Thousand", "Million", "Billion"
    };

    public static String convertToWords(int num) {
        if (num == 0) return "Zero";
        if (num == Integer.MIN_VALUE) {
            return "Negative Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Eight";
        }
        if (num < 0) return "Negative " + convertToWords(-num);

        LinkedList<String> parts = new LinkedList<>();
        int chunkCount = 0;

        while (num > 0) {
            int chunk = num % 1000;
            if (chunk != 0) {
                String chunkStr = convertChunk(chunk);
                if (!BIGS[chunkCount].isEmpty()) {
                    chunkStr += " " + BIGS[chunkCount];
                }
                parts.addFirst(chunkStr);
            }
            num /= 1000;
            chunkCount++;
        }

        return String.join(" ", parts).trim();
    }

    private static String convertChunk(int number) {
        StringBuilder sb = new StringBuilder();

        if (number >= 100) {
            sb.append(SMALLS[number / 100]).append(" Hundred");
            number %= 100;
            if (number > 0) sb.append(" ");
        }

        if (number >= 20) {
            sb.append(TENS[number / 10]);
            number %= 10;
            if (number > 0) sb.append(" ");
        }

        if (number > 0 && number < 20) {
            sb.append(SMALLS[number]);
        }

        return sb.toString();
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Maximo 4 bloques de 3 digitos para enteros de 32 bits. |
| Espacio Auxiliar | `O(1)` | Reserva acotada para la cadena de texto. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Normalización en Síntesis de Voz

1. **Pipelines Text-to-Speech (TTS):** Los asistentes de voz expanden numeros, fechas y divisas a su representacion fonetica textual antes de generar el audio sintetizado.
2. **Localización:** Manejo de reglas de genero y excepciones linguisticas segun la region.

## Casos Límite y Robustez en Producción

1. **`Integer.MIN_VALUE`:** Caso base explicito para evitar desbordamiento al negar $-2^{31}$.
2. **Ceros Intermedios:** Entradas como `1.000.005` procesan correctamente los bloques vacios sin generar espacios redundantes.
