---
title: "Plus Courte Supersuite: Fenêtre Glissante de Couverture Minimale (CTCI 17.18)"
description: "Trouvez le sous-tableau contigu le plus court d'un grand tableau contenant tous les éléments d'un petit tableau par fenêtre glissante en temps O(N log S)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-18-shortest-supersequence.webp
previewImage: /assets/images/ctci-17-18-shortest-supersequence.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit deux tableaux `big` et `small`, trouvez le sous-tableau contigu le plus court de `big` contenant tous les éléments de `small`.
> * **La Solution Optimale:** **Fenêtre Glissante avec Suivi des Prochaines Occurrences**:
>   1. Précalculer les listes triées de positions dans `big` pour chaque élément de `small`.
>   2. Maintenir un tas min contenant le pointeur d'avancement courant de chaque élément.
>   3. Extraire l'élément au plus petit indice, calculer la taille de la fenêtre, puis avancer à l'occurrence suivante.
>   4. S'arrêter quand un élément de `small` n'a plus d'occurrence future.
>   5. S'exécute en **temps $O(N \log S)$** et **espace $O(N)$**.
> * **Réalité en Production:** Proximité de phrases BM25 dans les moteurs de recherche et fusion de flux multi-capteurs IoT.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.18), l'énoncé est :

*"Retournez les indices de debut et de fin du plus court sous-tableau de 'big' couvrant la totalite des elements de 'small'."*

## 2. Balayage par Tas Minimal

Le tas permet de progresser séquentiellement sur la position minimale de couverture sans rejouer tout le tableau.

## Implémentation de Production

```java
import java.util.*;

public class ShortestSupersequence {

    public static int[] shortestSupersequence(int[] big, int[] small) {
        List<List<Integer>> lists = new ArrayList<>();
        Map<Integer, Integer> map = new HashMap<>();

        for (int s : small) {
            if (!map.containsKey(s)) {
                map.put(s, lists.size());
                lists.add(new ArrayList<>());
            }
        }

        for (int i = 0; i < big.length; i++) {
            Integer idx = map.get(big[i]);
            if (idx != null) lists.get(idx).add(i);
        }

        PriorityQueue<int[]> minHeap = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        int maxIndex = Integer.MIN_VALUE;

        for (int i = 0; i < lists.size(); i++) {
            if (lists.get(i).isEmpty()) return new int[]{-1, -1};
            int firstOcc = lists.get(i).get(0);
            minHeap.add(new int[]{firstOcc, i, 0});
            maxIndex = Math.max(maxIndex, firstOcc);
        }

        int[] best = {-1, -1};
        while (!minHeap.isEmpty()) {
            int[] curr = minHeap.poll();
            int minIndex = curr[0];
            int listIdx = curr[1];
            int posIdx = curr[2];

            if (best[0] == -1 || maxIndex - minIndex < best[1] - best[0]) {
                best[0] = minIndex;
                best[1] = maxIndex;
            }

            if (posIdx + 1 >= lists.get(listIdx).size()) break;
            int nextOcc = lists.get(listIdx).get(posIdx + 1);
            minHeap.add(new int[]{nextOcc, listIdx, posIdx + 1});
            maxIndex = Math.max(maxIndex, nextOcc);
        }

        return best;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N log S)` | N positions balayées avec opérations sur tas de S éléments. |
| Espace Mémoire | `O(N)` | Listes d'occurrences stockant toutes les positions. |

## Ingénierie des Systèmes en Production

### Architecture Système : Pertinence et Proximité dans les Moteurs de Recherche

1. **Score de Proximité BM25 :** Calcul de la fenêtre minimale couvrant tous les termes de requête.
2. **Fusion de Capteurs :** Définition de fenêtres temporelles minimales garantissant une lecture par canal.

## Cas Limites et Robustesse

1. **Élément de `small` Absent de `big` :** Renvoie `{-1, -1}`.
