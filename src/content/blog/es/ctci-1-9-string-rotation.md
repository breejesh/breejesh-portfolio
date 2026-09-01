---
title: "Rotación de Cadena: Comprobar si una Cadena es Rotación de Otra (CTCI 1.9)"
description: "Determina si s2 es una rotación cíclica de s1 utilizando exactamente una llamada a isSubstring mediante concatenación doble en tiempo O(N) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-9-string-rotation.webp
previewImage: /assets/images/ctci-1-9-string-rotation.webp
---

> **TL;DR**
> * **El Problema del Libro:** Asume que tienes un método `isSubstring` que comprueba si una palabra es subcadena de otra. Dadas dos cadenas, `s1` y `s2`, escribe código para comprobar si `s2` es una rotación de `s1` realizando únicamente una llamada a `isSubstring` (por ejemplo, `'waterbottle'` es una rotación de `'erbottlewat'`).
> * **El Avance Principal:** Si $s_2$ es una rotación de $s_1$, entonces $s_1$ puede dividirse en $x$ e $y$ tal que $s_1 = xy$ y $s_2 = yx$. Al concatenar $s_1$ consigo misma ($s_1s_1 = xyxy$), $yx$ ($s_2$) siempre será una subcadena contigua de $s_1s_1$.
> * **Realidad en Producción:** Búferes circulares en IPC del kernel, sincronización de redes en anillo y alineamiento de ADN circular en genómica.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 1.9), se nos pide:

*"Asume que tienes un método isSubstring que comprueba si una palabra es subcadena de otra. Dadas dos cadenas, s1 y s2, escribe código para comprobar si s2 es una rotación de s1 realizando únicamente una llamada a isSubstring (por ejemplo, 'waterbottle' es una rotación de 'erbottlewat')."*

**Demostración Matemática:**
Si $s_2$ es una rotación de $s_1$, existe un punto de partición que divide $s_1$ en dos fragmentos:
* $s_1 = x + y$ (ejemplo: $x = \text{"wat"}$, $y = \text{"erbottle"}$)
* $s_2 = y + x$ (ejemplo: $y = \text{"erbottle"}$, $x = \text{"wat"}$)

Al concatenar $s_1$ consigo misma:
$$s_1s_1 = s_1 + s_1 = (x + y) + (x + y) = x + (y + x) + y = x + s_2 + y$$

Dado que $s_2 = yx$, $s_2$ es necesariamente una subcadena de $s_1s_1$. Por lo tanto, una sola invocación a `isSubstring(s1s1, s2)` resuelve la comprobación.

## 2. Enfoque Ingenuo e Ineficiencias

Una solución ingenua generaría todas las $N$ rotaciones cíclicas de $s_1$ desplazando caracteres uno a uno y comparando cada una con $s_2$:
* **Complejidad Temporal:** $O(N^2)$ debido a $N$ rotaciones con comparaciones de $O(N)$.
* **Complejidad Espacial:** $O(N)$ para almacenar cada variante de cadena.

Generar rotaciones individuales desperdicia ciclos de CPU e infringe la restricción de invocar `isSubstring` una sola vez.

## 3. Mecánica Algorítmica Óptima

1. Comprobar si ambas cadenas tienen la misma longitud no nula. Si difieren o están vacías, retornar `false` inmediatamente en $O(1)$.
2. Concatenar $s_1$ consigo misma: `String s1s1 = s1 + s1`.
3. Invocar `isSubstring(s1s1, s2)` y retornar el resultado booleano.

## Implementación de Producción

```java
public class StringRotation {
    /**
     * Comprueba si s2 es una rotacion ciclica de s1 usando exactamente una llamada de subcadena.
     * Complejidad Temporal: O(N) asumiendo que isSubstring opera en O(N + M).
     * Complejidad Espacial: O(N) para almacenar la cadena concatenada s1s1.
     */
    public static boolean isRotation(String s1, String s2) {
        int len = s1 != null ? s1.length() : 0;

        // Validar longitudes iguales y mayores a cero
        if (len == s2.length() && len > 0) {
            String s1s1 = s1 + s1;
            return isSubstring(s1s1, s2);
        }

        return false;
    }

    public static boolean isSubstring(String big, String sub) {
        return big.contains(sub);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Crear $s_1s_1$ toma $O(N)$. La búsqueda de subcadena (KMP / Boyer-Moore) toma $O(2N + N) = O(N)$. |
| Espacio Auxiliar | `O(N)` | Asigna memoria para la cadena duplicada $s_1s_1$ de longitud $2N$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Búferes Circulares y Estructuras en Anillo

1. **Búferes Circulares sin Bloqueos (LMAX Disruptor / Linux Kfifo):** Los búferes circulares manejan índices de lectura y escritura mediante aritmética modular. La técnica de concatenación es similar a duplicar mapas de memoria (`mmap`) para permitir lecturas continuas sin ramificaciones condicionales.
2. **Plásmidos y ADN Circular en Bioinformática:** Los genomas bacterianos son secuencias circulares. Las herramientas de alineamiento duplican la secuencia para buscar marcadores genéticos.
3. **Topología de Token Ring:** Detección de fallos y paso de tokens en redes cíclicas.

## Casos Límite y Robustez en Producción

1. **Longitudes distintas (`"water"`, `"waterbottle"`):** Retorna `false` en $O(1)$.
2. **Cadenas vacías (`""`, `""`):** Gestionado por la condición `len > 0`, retornando `false`.
3. **Cadenas idénticas (`"apple"`, `"apple"`):** Rotación de 0 posiciones, retorna `true`.
4. **Cadenas de un carácter (`"a"`, `"a"`):** Retorna `true`.
5. **Cadenas nulas:** Protegidas por verificaciones iniciales.
