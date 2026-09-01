---
title: "Coincidencia de Patrones: Descomposición Diofántica de Cadenas (CTCI 16.18)"
description: "Verifica si una cadena de texto coincide con un patron de dos variables ('a' y 'b') resolviendo la ecuacion de longitudes en tiempo O(N^2)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-18-pattern-matching.webp
previewImage: /assets/images/ctci-16-18-pattern-matching.webp
---

> **TL;DR**
> * **El Problema del Libro:** Se te dan dos cadenas, `pattern` (formada unicamente por `'a'` y `'b'`) y `value`. Determina si `value` coincide con `pattern` (ej. `catcatgocatgo` coincide con `aabab` para `a = "cat"` y `b = "go"`).
> * **La Solución Óptima:** **Ecuación Diofántica Lineal de Longitudes**:
>   1. **Normalización**: Si el patron comienza con `'b'`, invertir caracteres para que siempre comience con `'a'`.
>   2. **Conteo**: Contar las apariciones de `'a'` ($c_a$) y `'b'` ($c_b$).
>   3. **Restricción de Longitud**: Para una longitud total $L = |\text{value}|$:
>      $$c_a \cdot L_a + c_b \cdot L_b = L \implies L_b = \frac{L - c_a \cdot L_a}{c_b}$$
>   4. **Iteración $L_a$**: Iterar $L_a \in [0, \lfloor L / c_a \rfloor]$. Si la longitud restante es divisible por $c_b$, extraer subcadenas candidatas $s_a$ y $s_b$ y verificar la reconstruccion.
>   5. Se ejecuta en **tiempo $O(L^2)$** y **espacio $O(L)$**.
> * **Realidad en Producción:** Retroreferencias en motores de expresiones regulares (PCRE).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.18), se nos plantea:

*"Determina si una cadena de texto cumple con un patron de dos variables mediante asignacion de subcadenas distintas."*

## 2. Aritmética de Longitudes

La longitud fija del texto limita drasticamente las posibles longitudes de $a$ y $b$, reduciendo la busqueda de exponencial $O(2^L)$ a cuadratica $O(L^2)$.

## Implementación de Producción

```java
public class PatternMatching {

    public static boolean matches(String pattern, String value) {
        if (pattern == null || value == null) return false;
        if (pattern.isEmpty()) return value.isEmpty();

        char mainChar = pattern.charAt(0);
        char altChar = (mainChar == 'a') ? 'b' : 'a';
        int size = value.length();

        int countOfMain = 0;
        int countOfAlt = 0;
        for (char c : pattern.toCharArray()) {
            if (c == mainChar) countOfMain++;
            else countOfAlt++;
        }

        if (countOfAlt == 0) {
            if (size % countOfMain != 0) return false;
            int len = size / countOfMain;
            String cand = value.substring(0, len);
            return verifyPattern(pattern, value, cand, "", mainChar);
        }

        int firstAlt = pattern.indexOf(altChar);
        int maxMainSize = size / countOfMain;

        for (int mainSize = 0; mainSize <= maxMainSize; mainSize++) {
            int remainingLength = size - (mainSize * countOfMain);
            if (remainingLength % countOfAlt == 0) {
                int altSize = remainingLength / countOfAlt;
                int altIndex = firstAlt * mainSize;

                String mainSub = value.substring(0, mainSize);
                String altSub = value.substring(altIndex, altIndex + altSize);

                if (!mainSub.equals(altSub)) {
                    if (verifyPattern(pattern, value, mainSub, altSub, mainChar)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static boolean verifyPattern(String pattern, String value, String mainSub, String altSub, char mainChar) {
        int stringIndex = 0;
        for (char c : pattern.toCharArray()) {
            String target = (c == mainChar) ? mainSub : altSub;
            if (target.isEmpty()) continue;

            if (stringIndex + target.length() > value.length() ||
                !value.startsWith(target, stringIndex)) {
                return false;
            }
            stringIndex += target.length();
        }
        return stringIndex == value.length();
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(L^2)` | $L / c_a$ iteraciones con verificacion lineal $O(L)$. |
| Espacio Auxiliar | `O(L)` | Memoria para subcadenas candidatas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores Regex

1. **Retroreferencias Regex:** Motores como PCRE utilizan analisis de longitud diofantica para podar ramas de retroceso al evaluar grupos capturados concurrentes.

## Casos Límite y Robustez en Producción

1. **Subcadenas Idénticas:** `!mainSub.equals(altSub)` exige que `'a'` y `'b'` sean diferentes.
