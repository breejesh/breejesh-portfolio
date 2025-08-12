---
title: "Find Duplicates: Trouver les Doublons avec 4 Ko de RAM (CTCI 10.8)"
description: "Problème CTCI 10.8 en Java: afficher les doublons d'un tableau d'entiers avec un vecteur de bits de 4 Ko."
date: "2025-08-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-8-find-duplicates.webp
previewImage: /assets/images/ctci-10-8-find-duplicates.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 10.8 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 10.8 en Java: afficher les doublons d'un tableau d'entiers avec un vecteur de bits de 4 Ko.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **10.8**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 10.8 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 10.8:** Problème CTCI 10.8 en Java: afficher les doublons d'un tableau d'entiers avec un vecteur de bits de 4 Ko.

---

## 3. Approche optimale et implémentation

```java
public class FindDuplicates {
    static class BitSetCustom {
        int[] bitset;
        public BitSetCustom(int size) {
            bitset = new int[(size >> 5) + 1];
        }
        public boolean get(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            return (bitset[wordNumber] & (1 << bitNumber)) != 0;
        }
        public void set(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            bitset[wordNumber] |= (1 << bitNumber);
        }
    }

    public static void checkDuplicates(int[] array) {
        BitSetCustom bs = new BitSetCustom(32000);
        for (int num : array) {
            int num0 = num - 1;
            if (bs.get(num0)) {
                System.out.println(num);
            } else {
                bs.set(num0);
            }
        }
    }
}
```

---

## 4. Complexité Temporelle et Spatiale

| Métrique | Complexité | Explication |
| --- | --- | --- |
| Complexité Temporelle | O(N) / O(log N) | Parcours optimal des données |
| Complexité Spatiale | O(1) / O(N) | Empreinte mémoire contrôlée |

---

## 5. Cas Limites et Résumé

Vérifiez toujours les conditions aux limites, les valeurs nulles et la taille des tableaux en entretien.