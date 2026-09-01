---
title: "Dibujar Línea: Rasterización de Líneas Horizontales en Pantalla Monocromática (CTCI 5.8)"
description: "Implementa una funcion para dibujar una linea horizontal desde (x1, y) hasta (x2, y) en una pantalla monocromatica almacenada como arreglo de bytes en tiempo O(w / 8)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-8-draw-line.webp
previewImage: /assets/images/ctci-5-8-draw-line.webp
---

> **TL;DR**
> * **El Problema del Libro:** Una pantalla monocromatica se almacena como un unico arreglo de bytes, donde cada byte contiene ocho pixeles consecutivos. La pantalla tiene un ancho $w$ divisible por 8. Implementa una funcion para trazar una linea horizontal de $(x_1, y)$ a $(x_2, y)$.
> * **La Solución Óptima:** Relleno Rapido de Bytes Alineados con Mascaras de Borde: (1) Determinar bytes completos inicial y final; (2) Llenar los bytes intermedios completos con `(byte) 0xFF` en bloque; (3) Calcular `start_mask` y `end_mask` para los bordes parciales en tiempo $O((x_2 - x_1) / 8)$ y espacio $O(1)$.
> * **Realidad en Producción:** Controladores de pantallas E-Ink y rasterizadores de fuentes tipograficas (FreeType).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.8), se nos plantea:

*"Una pantalla monocromatica se almacena como un arreglo de bytes, permitiendo 8 pixeles consecutivos por byte. El ancho w es divisible por 8. Implementa una funcion que dibuje una linea horizontal desde (x1, y) hasta (x2, y)."*

## 2. Disposición de Memoria y Máscaras de Bits

Cada fila contiene `width / 8` bytes.
1. Pixel inicial: `start_offset = x1 % 8`.
2. Pixel final: `end_offset = x2 % 8`.
3. Si $x_1$ y $x_2$ estan en el mismo byte: aplicar mascara combinada `start_mask & end_mask`.
4. Si abarcan multiples bytes:
   * Mascara inicial: `0xFF >> start_offset`.
   * Bytes completos intermedios: `0xFF`.
   * Mascara final: `~(0xFF >> (end_offset + 1))`.

## Implementación de Producción

```java
public class DrawLine {
    /**
     * Dibuja una linea horizontal en una pantalla monocromatica.
     * Complejidad Temporal: O(longitud / 8)
     * Complejidad Espacial: O(1)
     */
    public static void drawLine(byte[] screen, int width, int x1, int x2, int y) {
        int start_offset = x1 % 8;
        int first_full_byte = x1 / 8;
        if (start_offset != 0) {
            first_full_byte++;
        }

        int end_offset = x2 % 8;
        int last_full_byte = x2 / 8;
        if (end_offset != 7) {
            last_full_byte--;
        }

        // Rellenar bytes completos intermedios
        for (int b = first_full_byte; b <= last_full_byte; b++) {
            screen[(width / 8) * y + b] = (byte) 0xFF;
        }

        byte start_mask = (byte) (0xFF >> start_offset);
        byte end_mask = (byte) ~(0xFF >> (end_offset + 1));

        if ((x1 / 8) == (x2 / 8)) {
            byte mask = (byte) (start_mask & end_mask);
            screen[(width / 8) * y + (x1 / 8)] |= mask;
        } else {
            if (start_offset != 0) {
                int byte_number = (width / 8) * y + first_full_byte - 1;
                screen[byte_number] |= start_mask;
            }
            if (end_offset != 7) {
                int byte_number = (width / 8) * y + last_full_byte + 1;
                screen[byte_number] |= end_mask;
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(longitud / 8)` | Rellena bytes completos en bloques de 8 pixeles en lugar de evaluar bit a bit. |
| Espacio Auxiliar | `O(1)` | Modificacion in-situ sobre el buffer de pantalla. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Buffers Gráficos de Bajo Nivel

1. **Pantallas E-Ink y OLED Monocromáticas (SSD1306):** Los microcontroladores transmiten lineas a traves de bus SPI utilizando escrituras de bytes directas.
2. **Rasterizadores Tipográficos (FreeType):** Rellena segmentos horizontales en mapas de bits monocromaticos de 1 bit por pixel.

## Casos Límite y Robustez en Producción

1. **Línea contenida en un solo byte:** Gestionada mediante la union de mascaras `start_mask & end_mask`.
2. **Límites exactos de byte:** Relleno de bytes completos sin sobrecarga de mascaras parciales.
