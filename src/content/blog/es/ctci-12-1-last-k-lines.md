---
title: "Últimas K Líneas: Búfer Circular en C++ para Flujo de Archivos (CTCI 12.1)"
description: "Imprime las ultimas K lineas de un archivo en C++ utilizando un bufer circular (Ring Buffer) en tiempo O(N) y memoria acotada O(K) sin cargar el archivo en RAM."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-1-last-k-lines.webp
previewImage: /assets/images/ctci-12-1-last-k-lines.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo en C++ para imprimir las ultimas $K$ lineas de un archivo de entrada usando flujos I/O de C++.
> * **La Solución Óptima:** **Búfer Circular de Tamaño K**: (1) Asigna un arreglo o vector de cadenas de tamano $K$; (2) Lee linea a linea secuencialmente con `std::getline()`, almacenando cada linea en `ringBuffer[count % K]`; (3) El operador modulo `% K` sobrescribe naturalmente la linea mas antigua sin desplazar memoria; (4) Al llegar a EOF, imprime desde `(count < K ? 0 : count % K)` un total de $\min(count, K)$ lineas; (5) Se ejecuta en **tiempo $O(N)$** y **espacio $O(K)$ en RAM**.
> * **Realidad en Producción:** Implementacion del comando `tail -n K` en UNIX y bufers de registro del kernel en Linux (`dmesg`).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.1), se nos plantea:

*"Escribe un metodo en C++ para imprimir las ultimas K lineas de un archivo de entrada de texto."*

## 2. Mecánica del Búfer Circular (Ring Buffer)

Si el archivo pesa 50 GB y $K = 100$, almacenar todas las lineas en memoria agotaria la RAM.

Al usar un vector de tamano $K$, cada nueva linea reemplaza a la mas antigua:
$$\text{Índice} = \text{count} \pmod K$$
Alcanzado el final del archivo, la linea cronologicamente mas antigua reside en `start = count % K`, permitiendo imprimir las $K$ lineas en orden exacto.

## Implementación de Producción

```cpp
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>

void printLastKLines(const std::string& filename, int k) {
    if (k <= 0) return;

    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: No se pudo abrir el archivo " << filename << std::endl;
        return;
    }

    std::vector<std::string> ringBuffer(k);
    int count = 0;
    std::string line;

    while (std::getline(file, line)) {
        ringBuffer[count % k] = std::move(line);
        count++;
    }

    int start = (count < k) ? 0 : (count % k);
    int totalToPrint = std::min(count, k);

    for (int i = 0; i < totalToPrint; i++) {
        std::cout << ringBuffer[(start + i) % k] << "\n";
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Una sola lectura secuencial del archivo de $N$ líneas. |
| Espacio Auxiliar | `O(K)` | Exactamente $K$ cadenas de texto en memoria RAM. |
| E/S de Disco | `Secuencial` | Lectura hacia adelante optimizada por la cache del SO. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Búfers de Registro en Sistemas Operativos

1. **Comando `tail -n K` de GNU Coreutils:** Para flujos no indexables (pipes), reserva un bufer circular en RAM.
2. **Registro de Kernel en Linux (`dmesg`):** Emplea un bufer circular estatico en memoria de kernel (`__log_buf`) para evitar fugas de memoria por registros continuos.

## Casos Límite y Robustez en Producción

1. **Archivo con menos de K líneas ($N < K$):** Imprime exactamente $N$ lineas sin huecos vacios.
2. **Archivo Vacío ($N = 0$):** Termina sin emitir ninguna linea ni producir errores.
