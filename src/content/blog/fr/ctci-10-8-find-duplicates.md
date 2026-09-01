---
title: "Trouver les Doublons: Déduplication par BitSet de 4 Ko pour 32 000 Entiers (CTCI 10.8)"
description: "Affichez tous les doublons d'un tableau d'entiers de 1 à 32 000 sous une limite stricte de 4 Ko de RAM via un vecteur de bits compact en temps O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-8-find-duplicates.webp
previewImage: /assets/images/ctci-10-8-find-duplicates.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un tableau contenant des entiers de 1 à $N$, où $N \le 32\,000$. Le tableau peut comporter des doublons et la valeur de $N$ est inconnue. Avec seulement 4 Ko de mémoire disponible, comment afficher tous les doublons ?
> * **La Solution Optimale:** **Vecteur de Bits Compact de 4 Ko** : (1) $4\text{ Ko} = 4\,096\text{ octets} = 32\,768\text{ bits}$ ; (2) Pour $32\,000$ nombres, un vecteur de $32\,000\text{ bits}$ occupe exactement $32\,000 / 8 = 4\,000\text{ octets} \approx 3{,}91\text{ Ko}$ ; (3) Parcourir le tableau et pour chaque valeur $v$, vérifier `bitSet.get(v - 1)` : si vrai, imprimer le doublon, sinon activer `bitSet.set(v - 1)` ; (4) S'exécute en **temps $O(N)$** et **espace $< 4\text{ Ko}$**.
> * **Réalité en Production:** Microcontrôleurs embarqués et fenêtres de glissement TCP.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.8), l'énoncé est :

*"Affichez l'ensemble des elements en doublon dans un tableau d'entiers compris entre 1 et 32 000 avec une limite memoire absolue de 4 Ko."*

## 2. Dimensionnement Mémoire et Masquage de Bits

Une table de hachage classique exigerait $128\text{ Ko}$, soit 32 fois la limite autorisée.

En encodant chaque entier sur un seul bit :
$$32\,000\text{ bits} = \frac{32\,000}{8 \times 1024}\text{ Ko} = 3{,}91\text{ Ko} \le 4\text{ Ko}$$

## Implémentation de Production

```java
public class FindDuplicates {
    public static class BitSet {
        private final int[] bitset;

        public BitSet(int size) {
            this.bitset = new int[(size >> 5) + 1];
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
        BitSet bs = new BitSet(32000);

        for (int i = 0; i < array.length; i++) {
            int num = array[i];
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

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | 1 passage linéaire complet sur le tableau avec opérations binaires. |
| Mémoire Auxiliaire | `3.91 Ko` | 1 000 entiers 32 bits alloués en interne ($4\,000\text{ octets}$). |

## Ingénierie des Systèmes en Production

### Architecture Système : Microcontrôleurs Embarqués

1. **Systèmes Temps Réel (ARM Cortex-M0) :** Les capteurs connectés sous contrainte stricte de SRAM (8 Ko) utilisent des structures de bits pour filtrer les événements en double.
2. **Fenêtres d'Acquittement TCP :** Enregistrement des séquences de paquets réseau via des masques de bits contigus.

## Cas Limites et Robustesse

1. **Valeurs Bornes ($1$ et $32\,000$) :** Adressées sans dépassement aux bits 0 et 31 999.
2. **Occurrences Multiples :** Signalées à chaque réapparition.
