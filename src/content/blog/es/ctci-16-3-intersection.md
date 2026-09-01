---
title: "Intersección: Intersección de Segmentos en Geometría Computacional (CTCI 16.3)"
description: "Calcula el punto exacto de interseccion entre dos segmentos 2D mediante la regla de Cramer, productos vectoriales y solapamientos colineales."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-3-intersection.webp
previewImage: /assets/images/ctci-16-3-intersection.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dados dos segmentos de recta (representados por puntos de inicio y fin), calcula su punto exacto de interseccion si existe.
> * **La Solución Óptima:** **Determinantes de Álgebra Lineal (Regla de Cramer) y Bounding Boxes**:
>   1. Convertir los segmentos a la forma estandar $A_1 x + B_1 y = C_1$ y $A_2 x + B_2 y = C_2$.
>   2. Calcular el determinante $\Delta = A_1 B_2 - A_2 B_1$.
>   3. **Paralelas o Colineales ($\Delta = 0$)**: Si son colineales, verificar el solapamiento en sus cajas envolventes.
>   4. **No Paralelas ($\Delta \neq 0$)**: Resolver $(x, y)$ mediante determinantes y validar que el punto caiga dentro de **ambos** segmentos.
>   5. Se ejecuta en **tiempo $O(1)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Motores de videojuegos (Unity/Unreal) y bases de datos geoespaciales (PostGIS).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.3), se nos plantea:

*"Calcula el punto de interseccion de dos segmentos de linea bidimensionales contemplando paralelismo, verticalidad y colinealidad."*

## 2. Álgebra Lineal y Determinantes

$$\Delta = (p_2.y - p_1.y)(p_3.x - p_4.x) - (p_4.y - p_3.y)(p_1.x - p_2.x)$$

Si $\Delta \neq 0$, se resuelve el sistema lineal de dos ecuaciones para obtener $(x, y)$ y se verifica que este contenido en los limites de ambos segmentos.

## Implementación de Producción

```java
public class LineIntersection {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public static Point intersection(Point p1, Point p2, Point p3, Point p4) {
        double a1 = p2.y - p1.y;
        double b1 = p1.x - p2.x;
        double c1 = a1 * p1.x + b1 * p1.y;

        double a2 = p4.y - p3.y;
        double b2 = p3.x - p4.x;
        double c2 = a2 * p3.x + b2 * p3.y;

        double delta = a1 * b2 - a2 * b1;
        double epsilon = 1e-9;

        if (Math.abs(delta) < epsilon) {
            if (Math.abs(a1 * p3.x + b1 * p3.y - c1) < epsilon) {
                return getCollinearOverlap(p1, p2, p3, p4);
            }
            return null;
        }

        double x = (b2 * c1 - b1 * c2) / delta;
        double y = (a1 * c2 - a2 * c1) / delta;
        Point pt = new Point(x, y);

        if (isBetween(p1, pt, p2) && isBetween(p3, pt, p4)) {
            return pt;
        }
        return null;
    }

    private static boolean isBetween(Point start, Point middle, Point end) {
        double epsilon = 1e-9;
        return middle.x >= Math.min(start.x, end.x) - epsilon &&
               middle.x <= Math.max(start.x, end.x) + epsilon &&
               middle.y >= Math.min(start.y, end.y) - epsilon &&
               middle.y <= Math.max(start.y, end.y) + epsilon;
    }

    private static Point getCollinearOverlap(Point p1, Point p2, Point p3, Point p4) {
        Point left1 = (p1.x < p2.x || (p1.x == p2.x && p1.y < p2.y)) ? p1 : p2;
        Point right1 = (left1 == p1) ? p2 : p1;
        Point left2 = (p3.x < p4.x || (p3.x == p4.x && p3.y < p4.y)) ? p3 : p4;
        Point right2 = (left2 == p3) ? p4 : p3;

        if (isBetween(left1, left2, right1)) return left2;
        if (isBetween(left2, left1, right2)) return left1;
        return null;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Evaluacion directa de determinantes y comparaciones. |
| Espacio Auxiliar | `O(1)` | Sin estructuras de datos adicionales. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Precisión en Punto Flotante

1. **Tolerancias Épsilon:** En calculos geometricos, nunca se comparan flotantes directamente (`x == y`); se utiliza un margen $\epsilon = 10^{-9}$ para absorber errores de redondeo IEEE 754.
2. **Filtrado Espacial con Árboles R:** Los sistemas GIS descartan segmentos no intersectantes evaluando primero sus cajas envolventes (MBR).

## Casos Límite y Robustez en Producción

1. **Líneas Verticales:** La forma estandar $Ax + By = C$ evita indeterminaciones por division entre cero.
