---
title: "URLify: Remplacer les espaces par '%20' sur place par la fin (CTCI 1.3)"
description: "Remplacement des espaces par '%20' in-place via un algorithme de copie arrière en temps linéaire O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-3-urlify.webp
previewImage: /assets/images/ctci-1-3-urlify.webp
---

> **TL;DR**
> * **Le Défi du Livre:** Remplacer tous les espaces par '%20' dans un tableau de caractères avec tampon suffisant.
> * **L'Approche:** Calcul de la longueur finale puis écriture rétrograde en temps O(N) et mémoire O(1).
> * **En Production:** Encodage d'URL (percent-encoding RFC 3986) dans les serveurs HTTP.

## 1. Spécification du problème

Transformation de chaînes de caractères sans allocation de mémoire auxiliaire.

## 2. Balayage inverse

L'écriture depuis la fin élimine les décalages répétés de caractères.

## Implémentation de production

```java
public static void replaceSpaces(char[] str, int trueLength) {
    int spaces = 0;
    for (int i = 0; i < trueLength; i++) if (str[i] == ' ') spaces++;
    int index = trueLength + spaces * 2;
    for (int i = trueLength - 1; i >= 0; i--) {
        if (str[i] == ' ') {
            str[--index] = '0'; str[--index] = '2'; str[--index] = '%';
        } else {
            str[--index] = str[i];
        }
    }
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Temps | `O(N)` | Deux passes linéaires. |
| Espace | `O(1)` | Traitement en place. |

## Analyse d'ingénierie système en production réelle

### Utilisation en Production: Proxies HTTP (Nginx / Envoy)

Normalisation des chemins URI sur les flux réseau sans surcharge du ramasse-miettes.

## Cas limites et durcissement en production

1. Chaîne sans espace.
