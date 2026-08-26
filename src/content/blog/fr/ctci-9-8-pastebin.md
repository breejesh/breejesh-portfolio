---
title: "Pastebin: Service de Stockage de Extraits de Texte Évolutif (CTCI 9.8)"
description: "Problème CTCI 9.8: conception complète d'un service Pastebin avec génération de cles courtes et expiration."
date: "2026-06-11"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-8-pastebin.webp
previewImage: /assets/images/ctci-9-8-pastebin.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 9.8 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 9.8: conception complète d'un service Pastebin avec génération de cles courtes et expiration.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **9.8**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 9.8 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 9.8:** Problème CTCI 9.8: conception complète d'un service Pastebin avec génération de cles courtes et expiration.

---

## 3. Approche optimale et implémentation

```java
public class KeyGeneratorService {
    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public String encode(long id) {
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(ALPHABET.charAt((int) (id % 62)));
            id /= 62;
        }
        return sb.reverse().toString();
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