---
title: "Búsqueda Múltiple: Coincidencia Simultánea de Patrones con Aho-Corasick (CTCI 17.17)"
description: "Halla todas las ocurrencias de multiples cadenas dentro de un texto extenso de forma simultanea mediante el automata de Aho-Corasick en tiempo O(B + suma(L) + M)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-17-multi-search.webp
previewImage: /assets/images/ctci-17-17-multi-search.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una cadena grande $B$ y un array de cadenas pequeñas $S$, encuentra todas las posiciones en $B$ donde aparece cada cadena de $S$.
> * **La Solución Óptima:** **Automata de Aho-Corasick para Búsqueda Multi-Patrón**:
>   1. **Fase 1 (Trie):** Construir un arbol Trie con todos los patrones. Cada hoja marca el patron completado.
>   2. **Fase 2 (Enlaces de Fallo BFS):** Para cada nodo, precomputar un enlace `fail` al mayor sufijo propio que tambien sea prefijo valido en el Trie.
>   3. **Fase 3 (Escaneo Lineal):** Recorrer $B$ caracter a caracter siguiendo transiciones del Trie o retrocediendo por los enlaces `fail`. En cada nodo aceptador, emitir los patrones coincidentes.
>   4. Se ejecuta en **tiempo $O(B + \sum L + M)$** y **espacio $O(\sum L)$**.
> * **Realidad en Producción:** Deteccion de intrusos en redes (Snort/Suricata) y filtrado de contenido empresarial (Google Cloud DLP).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.17), se nos plantea:

*"Encuentra todas las apariciones de cada cadena pequeña en un texto grande en tiempo proporcional a la longitud del documento y la suma de los patrones."*

## 2. Automata de Fallos de Aho-Corasick

Los enlaces de fallo permiten reutilizar el progreso del automata cuando la transicion actual no existe, evitando reiniciar desde la raiz del Trie.

## Implementación de Producción

```java
import java.util.*;

public class MultiSearch {

    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        TrieNode fail = null;
        List<String> output = new ArrayList<>();
    }

    public static Map<String, List<Integer>> searchAll(String big, String[] smalls) {
        Map<String, List<Integer>> result = new HashMap<>();
        for (String s : smalls) result.put(s, new ArrayList<>());
        if (big == null || big.isEmpty() || smalls == null || smalls.length == 0) return result;

        TrieNode root = new TrieNode();
        for (String s : smalls) {
            if (s == null || s.isEmpty()) continue;
            TrieNode curr = root;
            for (char c : s.toCharArray()) {
                curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
            }
            curr.output.add(s);
        }

        Queue<TrieNode> queue = new LinkedList<>();
        for (TrieNode child : root.children.values()) {
            child.fail = root;
            queue.add(child);
        }
        while (!queue.isEmpty()) {
            TrieNode curr = queue.poll();
            for (Map.Entry<Character, TrieNode> e : curr.children.entrySet()) {
                char c = e.getKey();
                TrieNode child = e.getValue();
                TrieNode fail = curr.fail;
                while (fail != null && !fail.children.containsKey(c)) fail = fail.fail;
                child.fail = (fail == null) ? root : fail.children.getOrDefault(c, root);
                if (child.fail == child) child.fail = root;
                child.output.addAll(child.fail.output);
                queue.add(child);
            }
        }

        TrieNode curr = root;
        for (int i = 0; i < big.length(); i++) {
            char c = big.charAt(i);
            while (curr != root && !curr.children.containsKey(c)) curr = curr.fail;
            curr = curr.children.getOrDefault(c, root);
            for (String matched : curr.output) {
                result.get(matched).add(i - matched.length() + 1);
            }
        }

        return result;
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad Temporal | Detalle Técnico |
|---|---|---|
| Construcción del Trie | $O(\sum L)$ | Un recorrido por caracter de cada patron. |
| BFS de Fallos | $O(\sum L \cdot |\Sigma|)$ | Acotado por el tamano del alfabeto. |
| Escaneo del Texto | $O(B + M)$ | Lineal amortizado sobre el texto. |
| **Total** | **$O(B + \sum L + M)$** | **Optimo para busqueda multi-patron.** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: NIDS y Prevención de Pérdida de Datos

1. **Snort / Suricata:** Inspeccion de carga util de red contra miles de firmas de malware de forma simultanea.
2. **Google Cloud DLP:** Deteccion en paralelo de patrones de datos personales en documentos extensos.

## Casos Límite y Robustez en Producción

1. **Cadenas Vacias:** Retorna listas vacias de coincidencias.
2. **Patrones Superpuestos:** Los enlaces de salida encadenan correctamente todas las coincidencias anidadas.
