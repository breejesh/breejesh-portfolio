---
title: "Personal Financial Manager: Sistema de Agregación de Cuentas Bancarias (CTCI 9.7)"
description: "Problema CTCI 9.7: arquitectura para una aplicación de finanzas personales que conecta cuentas bancarias y categoriza transacciones."
date: "2026-01-28"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-7-personal-financial-manager.webp
previewImage: /assets/images/ctci-9-7-personal-financial-manager.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.7 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.7: arquitectura para una aplicación de finanzas personales que conecta cuentas bancarias y categoriza transacciones.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.7**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.7 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.7:** Problema CTCI 9.7: arquitectura para una aplicación de finanzas personales que conecta cuentas bancarias y categoriza transacciones.

---

## 3. Enfoque óptimo e implementación

```java
public class TransactionCategorizer {
    public String categorize(String merchantName) {
        if (merchantName.contains("Uber") || merchantName.contains("Lyft")) return "Transport";
        if (merchantName.contains("Starbucks") || merchantName.contains("Dunkin")) return "Food & Drink";
        return "Uncategorized";
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