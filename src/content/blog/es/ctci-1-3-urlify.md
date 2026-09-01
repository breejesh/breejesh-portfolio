---
title: "URLify: Reemplazar espacios por '%20' in-place desde el final (CTCI 1.3)"
description: "Cómo reemplazar espacios por '%20' in-place mediante un algoritmo de escritura inversa en tiempo lineal O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-3-urlify.webp
previewImage: /assets/images/ctci-1-3-urlify.webp
---

> **TL;DR**
> * **El Problema del Libro:** Reemplazar todos los espacios de una cadena por '%20' in-place dado el tamaño real de la cadena.
> * **La Solución:** Calcular la longitud final y reescribir de atrás hacia adelante en tiempo O(N) y memoria O(1).
> * **En Producción:** Codificación porcentual de URLs en servidores web como Nginx.

## 1. Planteamiento del Problema

En *Cracking the Coding Interview* (Problema 1.3), se transforma `"Mr John Smith    ", 13` en `"Mr%20John%20Smith"` sin crear arrays nuevos.

## 2. Escritura Inversa sin Desplazamientos

Calcular el tamaño final y copiar desde el final hacia adelante evita el coste cuadrático de desplazar caracteres.

## Implementación en producción

```java
public static void replaceSpaces(char[] str, int trueLength) {
    int spaces = 0;
    for (int i = 0; i < trueLength; i++) if (str[i] == ' ') spaces++;
    int index = trueLength + spaces * 2;
    for (int i = trueLength - 1; i >= 0; i--) {
        if (str[i] == ' ') {
            str[--index] = '0'; str[--index] = '2'; str[--index] = '%';
        } else {
            str[--index] = str[i];
        }
    }
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| Tiempo | `O(N)` | Dos recorridos lineales. |
| Espacio | `O(1)` | Modificación in-place. |

## Discusión de ingeniería de sistemas en el mundo real

### Aplicación en Producción: Servidores Web Nginx y Envoy

Codificación porcentual en búferes de sockets de red sin asignación dinámica de memoria.

## Casos límite y robustez en producción

1. Cadena sin espacios.
