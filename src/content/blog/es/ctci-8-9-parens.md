---
title: "Paréntesis: Generación de Combinaciones Válidas de Paréntesis (CTCI 8.9)"
description: "Genera todas las combinaciones validas de n pares de parentesis (Numeros de Catalan) mediante backtracking acotado en tiempo O(4^N / sqrt(N))."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-9-parens.webp
previewImage: /assets/images/ctci-8-9-parens.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa un algoritmo para imprimir todas las combinaciones validas (correctamente abiertas y cerradas) de $n$ pares de parentesis.
> * **La Solución Óptima:** Backtracking con Prefijos Acotados: (1) Lleva la cuenta de parentesis restantes por abrir (`leftRem`) y por cerrar (`rightRem`); (2) Agrega `'('` si `leftRem > 0`; (3) Agrega `')'` si y solo si `rightRem > leftRem`; (4) Genera exactamente el $n$-ésimo **Número de Catalán** $C_n = \frac{1}{n+1}\binom{2n}{n}$ combinaciones en tiempo $O(C_n \cdot N)$ y espacio $O(N)$.
> * **Realidad en Producción:** Validadores de sintaxis AST en compiladores (Clang) y analizadores de anidacion JSON / XML.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.9), se nos plantea:

*"Genera todas las combinaciones validas y balanceadas de n pares de parentesis."*

**Ejemplo ($n = 3$):**
`["((()))", "(()())", "(())()", "()(())", "()()()"]`

## 2. Lógica de Backtracking Acotado

Un prefijo es valido si:
1. Quedan parentesis abiertos (`leftRem > 0`) para colocar `'('`.
2. Quedan mas parentesis de cierre que de apertura (`rightRem > leftRem`) para colocar `')'`.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class ValidParens {
    /**
     * Genera combinaciones validas de n pares de parentesis.
     * Complejidad Temporal: O(4^N / sqrt(N))
     * Complejidad Espacial: O(N)
     */
    public static List<String> generateParens(int count) {
        char[] str = new char[count * 2];
        List<String> list = new ArrayList<>();
        addParen(list, count, count, str, 0);
        return list;
    }

    private static void addParen(List<String> list, int leftRem, int rightRem,
                                 char[] str, int index) {
        if (leftRem < 0 || rightRem < leftRem) return;

        if (leftRem == 0 && rightRem == 0) {
            list.add(String.copyValueOf(str));
        } else {
            if (leftRem > 0) {
                str[index] = '(';
                addParen(list, leftRem - 1, rightRem, str, index + 1);
            }
            if (rightRem > leftRem) {
                str[index] = ')';
                addParen(list, leftRem, rightRem - 1, str, index + 1);
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrique | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | $O\left(\frac{4^N}{\sqrt{N}}\right)$ | Genera exactamente $C_N = \frac{1}{N+1}\binom{2N}{N}$ cadenas validas. |
| Espacio Auxiliar | `O(N)` | Pila de llamadas acotada a $2N$ niveles y un unico buffer de caracteres. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Analizadores Sintácticos (Parsers)

1. **Parsers AST en Compiladores (LLVM / Clang):** Verificacion de bloques anidados mediante automatas de pila.
2. **Procesamiento de Flujos JSON / XML (Jackson):** Control de limites de anidacion para prevenir ataques de denegacion de servicio por agotamiento de pila.

## Casos Límite y Robustez en Producción

1. **$n = 0$:** Retorna `[""]`.
2. **$n = 1$:** Retorna `["()"]`.
