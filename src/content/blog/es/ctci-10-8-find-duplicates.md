---
title: "Buscar Duplicados: Deduplicación con BitSet de 4 Kilobytes para 32.000 Enteros (CTCI 10.8)"
description: "Imprime todos los numeros duplicados de un arreglo de enteros del 1 al 32.000 con un limite estricto de 4 KB de RAM usando un vector de bits en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-8-find-duplicates.webp
previewImage: /assets/images/ctci-10-8-find-duplicates.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes un arreglo con numeros del 1 al $N$, donde $N \le 32.000$. El arreglo puede tener elementos duplicados y desconoces el valor de $N$. Con solo 4 kilobytes de memoria disponible, ¿como imprimirias todos los duplicados?
> * **La Solución Óptima:** **Vector de Bits de 4 KB**: (1) $4\text{ KB} = 4.096\text{ bytes} = 32.768\text{ bits}$; (2) Para $32.000$ enteros, creamos un vector de bits que ocupa exactamente $32.000 / 8 = 4.000\text{ bytes} \approx 3,91\text{ KB}$; (3) Recorremos el arreglo y para cada numero $v$, consultamos `bitSet.get(v - 1)`: si es verdadero, imprimimos el duplicado; si no, marcamos `bitSet.set(v - 1)`; (4) Se ejecuta en **tiempo $O(N)$** y **espacio exacto $< 4\text{ KB}$**.
> * **Realidad en Producción:** Firmware en microcontroladores embebidos y ventanas de recepcion TCP.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.8), se nos plantea:

*"Imprime todos los elementos duplicados en un arreglo con numeros entre 1 y 32.000 bajo una restriccion estricta de 4 KB de memoria."*

## 2. Cálculo de Memoria y Máscaras de Bits

Un conjunto hash estandar para 32.000 enteros ocuparia $128\text{ KB}$, excediendo el limite por un factor de 32.

Al representar cada numero como un solo bit:
$$32.000\text{ bits} = \frac{32.000}{8 \times 1024}\text{ KB} = 3,91\text{ KB} \le 4\text{ KB}$$

## Implementación de Producción

```java
public class FindDuplicates {
    public static class BitSet {
        private final int[] bitset;

        public BitSet(int size) {
            this.bitset = new int[(size >> 5) + 1];
        }

        public boolean get(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            return (bitset[wordNumber] & (1 << bitNumber)) != 0;
        }

        public void set(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            bitset[wordNumber] |= (1 << bitNumber);
        }
    }

    public static void checkDuplicates(int[] array) {
        BitSet bs = new BitSet(32000);

        for (int i = 0; i < array.length; i++) {
            int num = array[i];
            int num0 = num - 1;

            if (bs.get(num0)) {
                System.out.println(num);
            } else {
                bs.set(num0);
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | 1 pasada lineal sobre el arreglo con operaciones a nivel de bit. |
| Memoria Auxiliar | `3.91 KB` | 1.000 enteros de 32 bits en el arreglo interno ($4.000\text{ bytes}$). |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Microcontroladores

1. **Firmware de Sensores IoT (ARM Cortex-M0):** Dispositivos con escasos 8 KB de SRAM utilizan mapas de bits compactos para deduplicar eventos.
2. **Control de Flujo TCP:** Ventanas deslizantes de acuse de recibo implementadas como campos de bits contiguos.

## Casos Límite y Robustez en Producción

1. **Extremos de Rango ($1$ y $32.000$):** Mapeados sin desbordamiento a los bits 0 y 31.999.
2. **Duplicados Múltiples:** Se reportan de forma consecutiva sin corromper el mapa.
