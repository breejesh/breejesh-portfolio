---
title: "Veneno: Identificar la Botella Envenenada en Días Mínimos con Codificación Binaria (CTCI 6.10)"
description: "Disena un esquema optimo con 10 tiras reactivas y representacion binaria para identificar 1 botella envenenada entre 1000 en exactamente 7 dias."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-10-poison.webp
previewImage: /assets/images/ctci-6-10-poison.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes 1000 botellas de refresco y exactamente una esta envenenada. Tienes 10 tiras reactivas. Una sola gota vuelve la tira positiva. Los resultados tardan 7 dias. ¿Como descubres la botella envenenada en el menor numero de dias posible?
> * **La Solución Óptima:** **Codificación Binaria (7 Días / 1 Ronda)**: Numera las botellas de 0 a 999. Como $2^{10} = 1024 > 1000$, cada botella se representa con 10 bits binarios ($b_9 \dots b_0$). El Dia 0, coloca una gota de la botella $k$ en la tira $i$ si el bit $i$ de $k$ es `1`. El Dia 7, el conjunto de tiras positivas forma directamente el indice binario de la botella envenenada en exactamente **7 días**.
> * **Realidad en Producción:** Pruebas agrupadas (Dorfman pooling) en epidemiologia y diagnostico de enlaces de red.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.10), se nos plantea:

*"Tienes 1000 botellas y 10 tiras reactivas. Las tiras tardan 7 dias en dar positivo si reciben veneno. ¿Como encuentras la botella envenenada en el menor tiempo posible?"*

## 2. Asignación Binaria de Gotas

1. **Capacidad de Información:** 10 tiras binarias tienen $2^{10} = 1024$ estados posibles ($1024 \ge 1000$).
2. **Día 0:** Para cada botella $k \in [0, 999]$, si su $i$-ésimo bit es 1, se añade una gota a la tira $i$.
3. **Día 7:** Las tiras positivas revelan los bits `1` del número de botella envenenada.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class PoisonDetection {
    public static class TestStrip {
        private final int id;
        private final List<Integer> drops = new ArrayList<>();

        public TestStrip(int id) { this.id = id; }
        public void addDrop(int bottleId) { drops.add(bottleId); }
        public boolean isPositive(int poisonedId) { return drops.contains(poisonedId); }
    }

    public static int findPoisonedBottle(int poisonedBottleId, int totalBottles, int totalStrips) {
        List<TestStrip> strips = new ArrayList<>();
        for (int i = 0; i < totalStrips; i++) {
            strips.add(new TestStrip(i));
        }

        // Dia 0: Agregar gotas segun representacion binaria
        for (int bottle = 0; bottle < totalBottles; bottle++) {
            for (int bit = 0; bit < totalStrips; bit++) {
                if (((bottle >> bit) & 1) == 1) {
                    strips.get(bit).addDrop(bottle);
                }
            }
        }

        // Dia 7: Reconstruir el indice binario
        int resultBottleId = 0;
        for (int bit = 0; bit < totalStrips; bit++) {
            if (strips.get(bit).isPositive(poisonedBottleId)) {
                resultBottleId |= (1 << bit);
            }
        }

        return resultBottleId;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Latencia Total | `7 Días` | Una sola ronda paralela. |
| Espacio Auxiliar | `O(S)` | 10 estados booleanos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Pruebas Agrupadas

1. **Dorfman Pooling en Epidemiología:** Análisis clínico de muestras biológicas agrupadas para reducir pruebas masivas de laboratorio.
2. **Sondas de Diagnóstico en Mallas de Red:** Identificación de enlaces ópticos defectuosos mediante cabeceras de prueba multiplexadas.

## Casos Límite y Robustez en Producción

1. **Botella 0 (Todos los bits en 0):** Ninguna tira reacciona, decodificando al índice 0.
