---
title: "Codificación XML: Serialización de AST y Tokenización Compacta (CTCI 16.12)"
description: "Codifica arboles de documentos XML estructurados en flujos compactos de bytes mediante recorrido recursivo en preorden y asignacion de identificadores enteros."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-12-xml-encoding.webp
previewImage: /assets/images/ctci-16-12-xml-encoding.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado que XML es muy verboso, disena un algoritmo de codificacion donde cada etiqueta se mapee a un entero predefinido segun la gramatica: `Element -> Tag Attributes END (Value | Children) END`, `Attribute -> Tag Value`, `END -> 0`.
> * **La Solución Óptima:** **Serialización Recursiva en Preorden del Árbol AST**:
>   1. **Diccionario de Mapeo**: Asignar codigos numericos a cada etiqueta (ej. `family` $\to$ 1, `person` $\to$ 2).
>   2. **Gramática**:
>      * Escribir `CodigoEtiqueta`.
>      * Para cada atributo: Escribir `CodigoAtributo` y `Valor`.
>      * Escribir `0` (delimitador de fin de atributos).
>      * Si contiene texto, escribir `Valor`; de lo contrario, serializar recursivamente los hijos.
>      * Escribir `0` (delimitador de fin de elemento).
>   3. Se ejecuta en **tiempo $O(N)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Protocol Buffers (Protobuf) y formatos de XML binario (Fast Infoset / BSON).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.12), se nos plantea:

*"Codifica un elemento XML estructurado en una secuencia compacta de tokens numericos y valores segun la gramatica especificada."*

## 2. Flujo de Serialización

El algoritmo realiza un recorrido en preorden procesando primero las etiquetas y atributos antes de descender recursivamente hacia los elementos hijos.

## Implementación de Producción

```java
import java.util.*;

public class XmlEncoder {

    public static class Attribute {
        public final String tag;
        public final String value;

        public Attribute(String tag, String value) {
            this.tag = tag;
            this.value = value;
        }
    }

    public static class Element {
        public final String name;
        public final List<Attribute> attributes = new ArrayList<>();
        public final List<Element> children = new ArrayList<>();
        public String value;

        public Element(String name) {
            this.name = name;
        }

        public Element(String name, String value) {
            this.name = name;
            this.value = value;
        }
    }

    public static String encode(Element root, Map<String, String> tagMap) {
        StringBuilder sb = new StringBuilder();
        encodeHelper(root, tagMap, sb);
        return sb.toString().trim();
    }

    private static void encodeHelper(Element root, Map<String, String> tagMap, StringBuilder sb) {
        if (root == null) return;

        sb.append(tagMap.getOrDefault(root.name, root.name)).append(" ");

        for (Attribute attr : root.attributes) {
            sb.append(tagMap.getOrDefault(attr.tag, attr.tag)).append(" ");
            sb.append(attr.value).append(" ");
        }

        sb.append("0 "); // Fin de atributos

        if (root.value != null && !root.value.isEmpty()) {
            sb.append(root.value).append(" ");
        } else {
            for (Element child : root.children) {
                encodeHelper(child, tagMap, sb);
            }
        }

        sb.append("0 "); // Fin de elemento
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Recorrido lineal en preorden sobre nodos y atributos. |
| Espacio Auxiliar | `O(N)` | Memoria para la cadena serializada y pila de recursion. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Comparativa con Protocol Buffers

1. **Protocol Buffers de Google:** Protobuf elimina las etiquetas de cierre indicando la longitud de los bytes de carga util (*wire type*), reduciendo drásticamente el ancho de banda.
2. **Fast Infoset (ISO Binary XML):** Sustituye cadenas de texto repetitivas por indices numericos en telecomunicaciones.

## Casos Límite y Robustez en Producción

1. **Etiquetas no Mapeadas:** `getOrDefault()` preserva el nombre textual original evitando excepciones.
