---
title: "Ré-espacement de Texte: Segmentation par Programmation Dynamique et Trie (CTCI 17.13)"
description: "Réinsérez des espaces dans un document continu afin de minimiser les caractères non reconnus par programmation dynamique et arbre Trie en temps O(N · L)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-13-re-space.webp
previewImage: /assets/images/ctci-17-13-re-space.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Tous les espaces et ponctuations d'un document ont été supprimés (ex. `"iresetthecomputeritstilldidntboot"`). À partir d'un dictionnaire, réinsérez les espaces de manière à minimiser les caractères non reconnus.
> * **La Solution Optimale:** **Programmation Dynamique Mémorisée + Arbre Trie** :
>   1. **État DP** : $DP[i]$ calcule le découpage optimal à partir de l'indice $i$, produisant `(caracteresInvalides, texteSegmente)`.
>   2. **Choix à l'Indice $i$** :
>      * **Option A (Ignorer le Caractère)** : Considérer $S[i]$ comme invalide $\implies 1 + DP[i+1]$.
>      * **Option B (Recherche Dictionnaire)** : Parcourir les mots valides débutant en $i$ via l'arbre Trie $\implies 0 + DP[j+1]$.
>   3. Sélectionner l'embranchement minimisant strictement le coût d'invalidité.
>   4. S'exécute en **temps $O(N \cdot L)$** (où $L$ est la longueur maximale d'un mot) et **espace $O(N + \text{Trie})$**.
> * **Réalité en Production:** Tokenisation des langues asiatiques (chinois/japonais dans Jieba et MeCab) et Byte-Pair Encoding (BPE) dans les LLM.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.13), l'énoncé est :

*"Reinserez des espaces dans une chaine continue pour minimiser le nombre total de caracteres inconnus."*

## 2. Élagage par Arbre Trie

L'arbre préfixe permet d'interrompre l'exploration dès qu'une suite de lettres ne correspond à aucun début de mot valide.

## Implémentation de Production

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

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire | Élagage Préfixe |
|---|---|---|---|
| **DP + Trie** | **$O(N \cdot L)$** | **$O(N + |\text{Trie}|)$** | **Immédiat** |
| **DP + HashSet** | $O(N^2 \cdot L)$ | $O(N)$ | Allocations redondantes |

## Ingénierie des Systèmes en Production

### Architecture Système : Traitement du Langage Naturel (NLP)

1. **Segmentation de Textes CJK (Jieba) :** Découpage de textes sans espaces en lemmes indexables pour les moteurs de recherche.
2. **Tokenisation BPE dans les Modèles LLM :** Regroupement de sous-mots par programmation dynamique.

## Cas Limites et Robustesse

1. **Document Sans Mot Connu :** Sépare chaque caractère par un espace en indiquant une invalidité égale à la longueur du texte.
