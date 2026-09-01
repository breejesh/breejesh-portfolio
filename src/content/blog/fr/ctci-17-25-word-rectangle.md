---
title: "Rectangle de Mots: Recherche DFS Élaguée par Trie pour la Plus Grande Grille Valide (CTCI 17.25)"
description: "Trouvez le plus grand rectangle de mots où chaque ligne et colonne est un mot valide du dictionnaire grâce à un DFS élagué par Trie pour valider les préfixes de colonnes."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-25-word-rectangle.webp
previewImage: /assets/images/ctci-17-25-word-rectangle.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une liste de millions de mots, concevez un algorithme pour construire le plus grand rectangle possible de lettres où chaque ligne forme un mot de gauche à droite et chaque colonne forme un mot de haut en bas.
> * **La Solution Optimale:** **Recherche DFS Élaguée par Trie**:
>   1. **Grouper les mots par longueur** et construire un Trie par groupe.
>   2. **Énumérer les dimensions** (largeur x hauteur) par surface décroissante.
>   3. **DFS Ligne par Ligne**: Placer itérativement un mot comme ligne suivante. Après chaque insertion, **élaguer les colonnes** avec le Trie des mots de hauteur correspondante. Si un préfixe de colonne est invalide, rétrograder immédiatement.
> * **Réalité en Production:** Générateurs de grilles de mots croisés et analyse de treillis en traitement du langage naturel (NLP).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.25), l'énoncé est :

*"Étant donné une liste de millions de mots, créez le plus grand rectangle possible de lettres tel que chaque ligne et chaque colonne forme un mot valide."*

## 2. Stratégie d'Élagage de Colonnes par Trie

Vérifier la validité du préfixe de chaque colonne dans le Trie associé à la hauteur cible permet de couper les branches invalides de l'arbre DFS dès les premières lignes.

## Implémentation de Production

```java
import java.util.*;

public class WordRectangle {

    public static String[] findLargestRectangle(String[] words) {
        Map<Integer, List<String>> byLen = new HashMap<>();
        int maxLen = 0;
        for (String w : words) {
            byLen.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
            maxLen = Math.max(maxLen, w.length());
        }

        for (int area = maxLen * maxLen; area > 0; area--) {
            for (int width = maxLen; width >= 1; width--) {
                if (area % width != 0) continue;
                int height = area / width;
                if (height > maxLen) continue;
                List<String> widthWords  = byLen.getOrDefault(width, Collections.emptyList());
                List<String> heightWords = byLen.getOrDefault(height, Collections.emptyList());
                if (widthWords.isEmpty() || heightWords.isEmpty()) continue;

                Trie colTrie = new Trie();
                for (String w : heightWords) colTrie.insert(w);

                String[] result = dfs(new String[height], widthWords, colTrie, width, height, 0);
                if (result != null) return result;
            }
        }
        return null;
    }

    static String[] dfs(String[] rect, List<String> words, Trie colTrie, int width, int height, int row) {
        if (row == height) return rect;
        for (String word : words) {
            rect[row] = word;
            if (columnsValid(rect, colTrie, width, row + 1, height)) {
                String[] res = dfs(rect, words, colTrie, width, height, row + 1);
                if (res != null) return res;
            }
        }
        rect[row] = null;
        return null;
    }

    static boolean columnsValid(String[] rect, Trie colTrie, int width, int rowsFilled, int height) {
        for (int c = 0; c < width; c++) {
            StringBuilder col = new StringBuilder();
            for (int r = 0; r < rowsFilled; r++) col.append(rect[r].charAt(c));
            if (rowsFilled == height) {
                if (!colTrie.contains(col.toString())) return false;
            } else {
                if (!colTrie.startsWith(col.toString())) return false;
            }
        }
        return true;
    }

    static class Trie {
        Map<Character, Trie> children = new HashMap<>();
        boolean isEnd;
        void insert(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Trie());
            node.isEnd = true;
        }
        boolean startsWith(String prefix) {
            Trie node = this;
            for (char c : prefix.toCharArray()) {
                node = node.children.get(c);
                if (node == null) return false;
            }
            return true;
        }
        boolean contains(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) {
                node = node.children.get(c);
                if (node == null) return false;
            }
            return node.isEnd;
        }
    }
}
```

## Analyse de Complexité

| Phase | Complexité | Détail |
|---|---|---|
| Regroupement des Mots | $O(W)$ | W = nombre total de mots. |
| Construction du Trie | $O(W \cdot L)$ | L = longueur maximale. |
| DFS avec Élagage Trie | Exponentielle au pire cas, hautement élaguée | Les préfixes invalides coupent l'arbre immédiatement. |

## Ingénierie des Systèmes en Production

1. **Génération de Mots Croisés :** Les moteurs automatisés de puzzles utilisent le retour sur trace avec validation par Trie pour construire des grilles denses.
2. **Analyse de Treillis NLP :** La propagation de contraintes sur les grilles de tokens s'appuie sur un élagage par préfixe identique.

## Cas Limites et Robustesse

1. **Aucun Rectangle Valide :** Retourne `null`.
2. **Mots d'un Caractère :** Les rectangles de dimension 1 sont trouvés immédiatement.
