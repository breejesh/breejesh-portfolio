---
title: "Duplicate URLs: Détecter les Doublons Parmi 10 Milliards d'URLs (CTCI 9.4)"
description: "Problème CTCI 9.4: identifier les URLs en double dans un ensemble de 10 milliards d'URLs avec une mémoire limitée."
date: "2026-04-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 9.4 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 9.4: identifier les URLs en double dans un ensemble de 10 milliards d'URLs avec une mémoire limitée.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **9.4**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 9.4 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 9.4:** Problème CTCI 9.4: identifier les URLs en double dans un ensemble de 10 milliards d'URLs avec une mémoire limitée.

---

## 3. Approche optimale et implémentation

```java
public class SimpleBloomFilter {
    private final BitSet bitSet;
    private final int size;

    public SimpleBloomFilter(int size) {
        this.size = size;
        this.bitSet = new BitSet(size);
    }

    public void add(String url) {
        bitSet.set(Math.abs(url.hashCode() % size));
        bitSet.set(Math.abs((url.hashCode() * 31) % size));
    }

    public boolean mightContain(String url) {
        return bitSet.get(Math.abs(url.hashCode() % size)) 
            && bitSet.get(Math.abs((url.hashCode() * 31) % size));
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