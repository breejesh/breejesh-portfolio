---
title: "Entero Faltante: Vectores de Bits y Conteo de Bloques en Dos Pasadas (CTCI 10.7)"
description: "Encuentra un entero ausente entre cuatro mil millones de numeros con restricciones de 1 GB y 10 MB de RAM usando vectores de bits y conteo por bloques."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-7-missing-int.webp
previewImage: /assets/images/ctci-10-7-missing-int.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un archivo con cuatro mil millones de enteros no negativos, proporciona un algoritmo para generar un entero ausente en el archivo bajo 1 GB de RAM. SEGUIMIENTO: ¿Y si solo tienes 10 MB de memoria?
> * **La Solución Óptima:** **Vectores de Bits y Conteo por Bloques en Dos Pasadas**: (1) **Con 1 GB de RAM**: Un vector de bits de $2^{32}\text{ bits} = 512\text{ MB}$ rastrea todos los numeros en una sola pasada; (2) **Con 10 MB de RAM**: En la primera pasada, un arreglo de 65.536 contadores ($256\text{ KB}$ de RAM) cuenta la frecuencia de numeros en bloques de tamano 65.536. Por el Principio del Palomar, al menos un bloque tendra una cuenta menor a 65.536; (3) En la segunda pasada, se asigna un vector de bits de $8\text{ KB}$ ($65.536\text{ bits}$) para el bloque deficiente y se relee el archivo para hallar el bit 0.
> * **Realidad en Producción:** Asignacion de direcciones IPv4 y mapas de bits Roaring en Apache Lucene.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.7), se nos plantea:

*"Dado un archivo con 4.000 millones de enteros no negativos, encuentra un numero que no este presente con 1 GB de memoria, y resuelve la variante con solo 10 MB de memoria."*

## 2. Derivación de Memoria y Principio del Palomar

El conjunto de enteros de 32 bits no negativos contiene $2^{31} \approx 2.140$ millones (o $2^{32}$ sin signo).

### Caso 1: 1 GB de RAM (Una Pasada)
Un arreglo de bits para todos los enteros de 32 bits ocupa:
$$2^{32}\text{ bits} = 512\text{ MB}$$
Cabe holgadamente en 1 GB de RAM.

---

### Caso 2: 10 MB de RAM (Dos Pasadas)
1. **Pasada 1 (Conteo de Frecuencias):**
   * Dividir en $2^{16} = 65.536$ bloques.
   * `int[] blocks = new int[65536]` ocupa $256\text{ KB}$ de RAM.
   * Hallar un bloque con `blocks[B] < 65536`.
2. **Pasada 2 (Vector de Bits Localizado):**
   * Vector de bits de $65.536\text{ bits} = 8\text{ KB}$ de RAM para el bloque $B$.
   * Releer el archivo y localizar el primer bit no marcado.

## Implementación de Producción

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class MissingIntFinder {
    /**
     * Solución con 1 GB de RAM: Vector de bits de 512 MB.
     */
    public static int findMissingInt1GB(String filename) throws IOException {
        byte[] bitfield = new byte[1 << 26]; // 512MB
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                bitfield[n / 8] |= (1 << (n % 8));
            }
        }

        for (int i = 0; i < bitfield.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitfield[i] & (1 << b)) == 0) {
                    return i * 8 + b;
                }
            }
        }
        return -1;
    }

    /**
     * Solución con 10 MB de RAM: Dos pasadas con conteo por bloques.
     */
    public static int findMissingInt10MB(String filename) throws IOException {
        int rangeSize = 1 << 16;
        int[] blocks = new int[rangeSize]; // 256KB RAM

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                blocks[n / rangeSize]++;
            }
        }

        int selectedBlock = -1;
        for (int i = 0; i < blocks.length; i++) {
            if (blocks[i] < rangeSize) {
                selectedBlock = i;
                break;
            }
        }
        if (selectedBlock == -1) return -1;

        byte[] bitVector = new byte[rangeSize / 8]; // 8KB RAM
        int startingInt = selectedBlock * rangeSize;
        int endingInt = startingInt + rangeSize;

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                if (n >= startingInt && n < endingInt) {
                    int offset = n - startingInt;
                    bitVector[offset / 8] |= (1 << (offset % 8));
                }
            }
        }

        for (int i = 0; i < bitVector.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitVector[i] & (1 << b)) == 0) {
                    return startingInt + i * 8 + b;
                }
            }
        }

        return -1;
    }
}
```

## Análisis de Complejidad y Memoria

| Modo | Complejidad Temporal | Memoria RAM Auxiliar | Pasadas de Disco |
|---|---|---|---|
| 1 GB de RAM | `O(N)` | `512 MB` | 1 Pasada |
| 10 MB de RAM | `O(N)` | `264 KB` | 2 Pasadas |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Gestión de Direcciones IP

1. **Tablas de Asignación IPv4:** Los registros de internet utilizan vectores de bits de 512 MB para localizar direcciones libres en tiempo $O(1)$.
2. **Roaring Bitmaps en Motores de Búsqueda:** Alternancia automatica entre arreglos de enteros (dispersos) y mapas de bits (densos) para maximizar la localidad en cache.

## Casos Límite y Robustez en Producción

1. **Todos los números presentes:** Retorna `-1` si no existe vacio en el universo evaluado.
2. **Primer elemento ausente ($n = 0$):** Se detecta en el bit 0 del bloque 0.
