---
title: "Hormigas en un Triángulo: Probabilidad de Colisión en Vértices de Polígonos (CTCI 6.4)"
description: "Calcula la probabilidad de colision de n hormigas caminando aleatoriamente sobre los lados de un poligono regular en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
previewImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
---

> **TL;DR**
> * **El Problema del Libro:** Hay tres hormigas en diferentes vertices de un triangulo. ¿Cual es la probabilidad de que colisionen si empiezan a caminar por los lados del triangulo en direcciones aleatorias? Generaliza para $n$ hormigas en un poligono de $n$ vertices.
> * **La Solución Óptima:** **Probabilidad Complementaria**: Las hormigas no chocan unicamente si todas eligen el mismo sentido (todas en sentido horario o todas en sentido antihorario). Existen $2^n$ combinaciones posibles y solo 2 sin colision. $P(\text{sin choque}) = 2 / 2^n = (1/2)^{n-1}$. Por lo tanto, **$P(\text{colision}) = 1 - (1/2)^{n-1}$**. Para un triangulo ($n=3$), la probabilidad es $1 - 1/4 = 3/4 = \mathbf{75\%}$.
> * **Realidad en Producción:** Modelos de colision en redes Ethernet (CSMA/CD) y protocolos Token Ring.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.4), se nos plantea:

*"Hay tres hormigas en vertices de un triangulo. ¿Cual es la probabilidad de colision si eligen direccion aleatoria? Generaliza para n hormigas en un poligono de n vertices."*

## 2. Derivación Matemática

1. **Total de Combinaciones:** Cada una de las $n$ hormigas tiene 2 elecciones $\implies 2^n$.
2. **Casos sin Colisión:**
   * Todas en sentido horario: $(1/2)^n$.
   * Todas en sentido antihorario: $(1/2)^n$.
   * $P(\text{sin colision}) = 2 \times (1/2)^n = (1/2)^{n-1}$.
3. **Probabilidad de Colisión:**
   $$P(\text{colision}) = 1 - \left(\frac{1}{2}\right)^{n-1}$$
4. Para $n = 3$: $1 - (1/2)^2 = 1 - 0.25 = \mathbf{75\%}$.

## Implementación de Producción

```java
public class AntsOnPolygon {
    /**
     * Calcula la probabilidad de colision para n hormigas en un poligono.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static double collisionProbability(int n) {
        if (n < 3) {
            throw new IllegalArgumentException("Un poligono debe tener al menos 3 vertices.");
        }
        return 1.0 - Math.pow(0.5, n - 1);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Evaluación | `O(1)` | Expresion matematica directa. |
| Espacio Auxiliar | `O(1)` | Sin uso de memoria dinamica. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Contención de Medios Compartidos

1. **Protocolos CSMA/CD en Ethernet:** Modela la contencion de paquetes transmitidos simultaneamente en el mismo medio fisico.
2. **Redes en Anillo (Token Ring):** Obligan al flujo unidireccional de paquetes para garantizar colisiones nulas.

## Casos Límite y Robustez en Producción

1. **$n = 3$ (Triángulo):** Retorna $0.75$.
2. **$n$ grande:** Tiende deterministicamente a $1.0$.
