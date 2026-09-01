---
title: "Recherche Multiple: Correspondance Simultanée de Motifs avec Aho-Corasick (CTCI 17.17)"
description: "Identifiez toutes les occurrences de plusieurs chaînes dans un document en parallèle grâce à l'automate de correspondance Aho-Corasick en temps O(B + somme(L) + M)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-17-multi-search.webp
previewImage: /assets/images/ctci-17-17-multi-search.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une grande chaîne $B$ et un tableau de petites chaînes $S$, trouvez toutes les positions dans $B$ où chaque motif de $S$ apparaît.
> * **La Solution Optimale:** **Automate Aho-Corasick pour la Correspondance Multi-Motifs**:
>   1. **Phase 1 (Trie):** Construire un Trie de tous les motifs. Chaque feuille marque le motif terminé.
>   2. **Phase 2 (Liens d'Échec BFS):** Pour chaque nœud, précalculer un lien `fail` vers le plus long suffixe propre étant aussi un préfixe valide du Trie.
>   3. **Phase 3 (Balayage Linéaire):** Parcourir $B$ caractère par caractère en suivant les transitions du Trie ou en empruntant les liens `fail`. À chaque nœud accepteur, émettre les motifs reconnus via les liens de sortie.
>   4. S'exécute en **temps $O(B + \sum L + M)$** et **espace $O(\sum L)$**.
> * **Réalité en Production:** Détection d'intrusions réseau (Snort/Suricata) et inspection de contenu (Google Cloud DLP).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.17), l'énoncé est :

*"Repérez toutes les positions des petites chaines dans un grand texte en temps proportionnel a la longueur du document et a la somme des patterns."*

## 2. Liens d'Échec de l'Automate

Les liens d'échec permettent de conserver le maximum de progression acquise lors de la transition vers un état non défini, sans revenir à la racine.

## Implémentation de Production

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

## Analyse de Complexité

| Phase | Complexité Temporelle | Détail Technique |
|---|---|---|
| Construction du Trie | $O(\sum L)$ | Un parcours par caractère de motif. |
| BFS des Liens d'Échec | $O(\sum L \cdot |\Sigma|)$ | Borné par la taille de l'alphabet. |
| Balayage du Texte | $O(B + M)$ | Linéaire sur le texte entier. |
| **Total** | **$O(B + \sum L + M)$** | **Optimal pour la recherche multi-motifs.** |

## Ingénierie des Systèmes en Production

### Architecture Système : Détection d'Intrusions et Filtrage de Contenu

1. **Snort / Suricata NIDS :** Inspection simultanée des charges utiles de paquets réseau contre des milliers de signatures.
2. **Google Cloud DLP :** Détection parallèle de données sensibles sur de grands corpus documentaires.

## Cas Limites et Robustesse

1. **Chaînes Vides :** Renvoie des listes de positions vides.
2. **Motifs Imbriqués :** Les liens de sortie chaînent correctement les correspondances superposées.
