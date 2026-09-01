---
title: "Reespaciado de Texto: Segmentación de Palabras con Programación Dinámica y Trie (CTCI 17.13)"
description: "Reinserta espacios en documentos de texto continuo para minimizar caracteres no reconocidos mediante programacion dinamica memorizada y arboles Trie en tiempo O(N · L)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-13-re-space.webp
previewImage: /assets/images/ctci-17-13-re-space.webp
---

> **TL;DR**
> * **El Problema del Libro:** Has eliminado accidentalmente todos los espacios y signos de puntuacion de un texto (ej. `"iresetthecomputeritstilldidntboot"`). Dado un diccionario, reinserta espacios minimizando los caracteres no reconocidos.
> * **La Solución Óptima:** **Programación Dinámica Memorizada + Árbol Trie**:
>   1. **Estado DP**: $DP[i]$ representa el resultado optimo comenzando en el indice $i$, retornando `(caracteresInvalidos, textoSegmentado)`.
>   2. **Opciones por Carácter**:
>      * **Opción A (Omitir como Inválido)**: Tratar $S[i]$ como no reconocido $\implies 1 + DP[i+1]$.
>      * **Opción B (Coincidencia en Diccionario)**: Buscar todas las palabras validas mediante un prefijo en el arbol Trie desde $i$ hasta $j \implies 0 + DP[j+1]$.
>   3. Seleccionar la rama con el menor numero de caracteres invalidos.
>   4. Se ejecuta en **tiempo $O(N \cdot L)$** (donde $L$ es la longitud maxima de palabra) y **espacio $O(N + \text{Trie})$**.
> * **Realidad en Producción:** Tokenizacion de texto en chino y japones (Jieba / MeCab) y algoritmos Byte-Pair Encoding (BPE) en modelos de lenguaje (LLM).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.13), se nos plantea:

*"Segmenta una cadena continua de texto insertando espacios para reconstruir oraciones legibles minimizando los caracteres desconocidos."*

## 2. Poda de Ramas con Árbol Trie

El arbol Trie permite interrumpir la busqueda de prefijos inmediatamente cuando una secuencia de letras no forma ninguna palabra valida en el diccionario.

## Implementación de Producción

```java
import java.util.*;

public class ReSpace {

    public static class TrieNode {
        public boolean isWord = false;
        public final Map<Character, TrieNode> children = new HashMap<>();

        public void insert(String word) {
            TrieNode curr = this;
            for (char c : word.toCharArray()) {
                curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
            }
            curr.isWord = true;
        }
    }

    public static class ParseResult {
        public int invalid;
        public String parsed;

        public ParseResult(int invalid, String parsed) {
            this.invalid = invalid;
            this.parsed = parsed;
        }
    }

    public static String reSpace(String document, HashSet<String> dictionary) {
        TrieNode root = new TrieNode();
        for (String word : dictionary) {
            root.insert(word);
        }

        ParseResult[] memo = new ParseResult[document.length()];
        ParseResult result = split(document, 0, root, memo);
        return result.parsed;
    }

    private static ParseResult split(String doc, int start, TrieNode root, ParseResult[] memo) {
        if (start >= doc.length()) return new ParseResult(0, "");
        if (memo[start] != null) return memo[start];

        ParseResult best = split(doc, start + 1, root, memo);
        int minInvalid = best.invalid + 1;
        String bestParsed = doc.charAt(start) + (best.parsed.isEmpty() ? "" : " " + best.parsed);

        TrieNode curr = root;
        for (int i = start; i < doc.length(); i++) {
            char c = doc.charAt(i);
            curr = curr.children.get(c);
            if (curr == null) break;

            if (curr.isWord) {
                ParseResult next = split(doc, i + 1, root, memo);
                if (next.invalid < minInvalid) {
                    minInvalid = next.invalid;
                    String word = doc.substring(start, i + 1);
                    bestParsed = word + (next.parsed.isEmpty() ? "" : " " + next.parsed);
                }
            }
        }

        memo[start] = new ParseResult(minInvalid, bestParsed);
        return memo[start];
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar | Poda de Ramas |
|---|---|---|---|
| **DP + Trie** | **$O(N \cdot L)$** | **$O(N + |\text{Trie}|)$** | **Inmediata** |
| **DP + HashSet** | $O(N^2 \cdot L)$ | $O(N)$ | Lenta (substrings redundantes) |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Tokenización en PLN

1. **Segmentación de Idiomas Asiáticos (Jieba):** Los idiomas sin espacios entre palabras se procesan mediante algoritmos Viterbi y arboles Trie para extraer terminos indexables.
2. **Tokenizadores BPE en LLMs:** Algoritmos como SentencePiece dividen cadenas de caracteres sin delimitar en subtokens optimos.

## Casos Límite y Robustez en Producción

1. **Documento Sin Palabras Válidas:** Retorna caracteres individuales separados por espacios.
2. **Solapamiento de Palabras:** La recursion evalua todas las combinaciones para garantizar el optimo global.
