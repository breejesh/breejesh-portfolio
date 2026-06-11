---
title: "Pastebin: Servicio de Almacenamiento de Texto Escalable (CTCI 9.8)"
description: "Problema CTCI 9.8: diseño completo de un servicio estilo Pastebin con claves cortas únicas y expiración de contenido."
date: "2026-06-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-8-pastebin.webp
previewImage: /assets/images/ctci-9-8-pastebin.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.8 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.8: diseño completo de un servicio estilo Pastebin con claves cortas únicas y expiración de contenido.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.8**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.8 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.8:** Problema CTCI 9.8: diseño completo de un servicio estilo Pastebin con claves cortas únicas y expiración de contenido.

---

## 3. Enfoque óptimo e implementación

```java
public class KeyGeneratorService {
    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public String encode(long id) {
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(ALPHABET.charAt((int) (id % 62)));
            id /= 62;
        }
        return sb.reverse().toString();
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