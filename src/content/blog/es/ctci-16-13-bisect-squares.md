---
title: "Bisección de Cuadrados: Geometría de Centroides y Corte de Áreas (CTCI 16.13)"
description: "Calcula la linea exacta que divide dos cuadrados 2D en partes iguales conectando sus centroides geometricos e intersectando sus perimetros en O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dados dos cuadrados en un plano 2D (con lados paralelos a los ejes), halla una recta que corte ambos cuadrados exactamente por la mitad.
> * **La Solución Óptima:** **Colinealidad de los Centroides**:
>   1. Cualquier recta que atraviese el centro geometrico (centroide) de un cuadrado divide su area exactamente en dos mitades iguales.
>   2. Por tanto, la recta que une el centro del Cuadrado 1 ($C_1$) con el del Cuadrado 2 ($C_2$) **biseca ambos cuadrados simultaneamente**.
>   3. Extender los puntos de la recta hasta los limites perimetrales exteriores.
>   4. Se ejecuta en **tiempo $O(1)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Particionamiento poligonal en sistemas de informacion geografica (GIS) y motores de fisica.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.13), se nos plantea:

*"Encuentra el segmento de recta que corta dos cuadrados alineados con los ejes en dos mitades de igual superficie."*

## 2. Geometría de Centroides

$$C = \left(\text{izq} + \frac{\text{tamano}}{2}, \text{abajo} + \frac{\text{tamano}}{2}\right)$$

La pendiente $m = \frac{C_2.y - C_1.y}{C_2.x - C_1.x}$ define la recta bisectriz universal.

## Implementación de Producción

```java
public class BisectSquares {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class Square {
        public final double left, right, top, bottom, size;

        public Square(double left, double top, double size) {
            this.left = left;
            this.top = top;
            this.bottom = top - size;
            this.right = left + size;
            this.size = size;
        }

        public Point middle() {
            return new Point(left + size / 2.0, bottom + size / 2.0);
        }

        public Point getIntersection(Point mid, double slope) {
            if (slope == Double.POSITIVE_INFINITY || slope == Double.NEGATIVE_INFINITY) {
                return new Point(mid.x, top);
            }
            if (Math.abs(slope) <= 1.0) {
                double x = (mid.x >= this.middle().x) ? right : left;
                double y = slope * (x - mid.x) + mid.y;
                return new Point(x, y);
            } else {
                double y = (mid.y >= this.middle().y) ? top : bottom;
                double x = (y - mid.y) / slope + mid.x;
                return new Point(x, y);
            }
        }
    }

    public static class LineSegment {
        public final Point p1, p2;
        public LineSegment(Point p1, Point p2) {
            this.p1 = p1;
            this.p2 = p2;
        }
    }

    public static LineSegment cut(Square sq1, Square sq2) {
        Point c1 = sq1.middle();
        Point c2 = sq2.middle();

        if (c1.x == c2.x && c1.y == c2.y) {
            return new LineSegment(new Point(c1.x, sq1.top), new Point(c1.x, sq2.bottom));
        }

        double slope = (c1.x == c2.x) ? Double.POSITIVE_INFINITY : (c2.y - c1.y) / (c2.x - c1.x);

        return new LineSegment(sq1.getIntersection(c1, slope), sq2.getIntersection(c2, slope));
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Calculo analitico directo de coordenadas y pendientes. |
| Espacio Auxiliar | `O(1)` | Memoria constante. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Partición en Motores GIS

1. **PostGIS y Geometría Computacional:** La biseccion de poligonos convexos generaliza este principio calculando el centro de gravedad mediante integracion discreta de vertices.

## Casos Límite y Robustez en Producción

1. **Líneas Verticales:** Manejo explicito de pendiente infinita cuando los centros comparten coordenada $X$.
