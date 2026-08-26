---
title: "Rank from Stream: Rango de un Número en un Flujo de Datos (CTCI 10.10)"
description: "Problema CTCI 10.10 en Java: rastrea números en flujo con un árbol BST para calcular el rango en tiempo real."
date: "2026-01-18"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.10 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.10 en Java: rastrea números en flujo con un árbol BST para calcular el rango en tiempo real.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.10**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.10 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.10:** Problema CTCI 10.10 en Java: rastrea números en flujo con un árbol BST para calcular el rango en tiempo real.

---

## 3. Enfoque óptimo e implementación

```java
public class RankNode {
    public int leftSize = 0;
    public RankNode left, right;
    public int data = 0;

    public RankNode(int d) { this.data = d; }

    public void insert(int d) {
        if (d <= data) {
            if (left != null) left.insert(d);
            else left = new RankNode(d);
            leftSize++;
        } else {
            if (right != null) right.insert(d);
            else right = new RankNode(d);
        }
    }

    public int getRank(int d) {
        if (d == data) return leftSize;
        else if (d < data) {
            if (left == null) return -1;
            return left.getRank(d);
        } else {
            int rightRank = (right == null) ? -1 : right.getRank(d);
            if (rightRank == -1) return -1;
            return leftSize + 1 + rightRank;
        }
    }
}
```

---

## 4. Complejidad Temporal y Espacial

| Métrica | Complejidad | Explicación |
| --- | --- | --- |
| Complejidad Temporal | O(N) / O(log N) | Recorrido óptimo de datos |
| Complejidad Espacial | O(1) / O(N) | Memoria acotada |

---

## 5. Casos Límite y Resumen

Verifica siempre condiciones de borde, valores nulos y límites de tamaño en entrevistas técnicas.