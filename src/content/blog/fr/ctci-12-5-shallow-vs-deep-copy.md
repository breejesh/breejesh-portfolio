---
title: "Copie Superficielle vs. Profonde: Gestion de Mémoire et Règle des Cinq en C++ (CTCI 12.5)"
description: "Distinguez la copie superficielle (shallow) et profonde (deep) en C++ : aliasing de pointeurs, double libération de mémoire et Règle des Cinq en RAII."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Quelle est la différence entre une copie profonde (deep copy) et une copie superficielle (shallow copy) ? Expliquez quand utiliser chacune d'elles.
> * **Différences Fondamentales :** (1) **Copie Superficielle** : Copie octet par octet des membres ; pour les pointeurs bruts, seule l'adresse mémoire est copiée, entraînant le partage du même bloc sur le tas (créant des risques de corruption et d'erreurs `double free`) ; (2) **Copie Profonde** : Alloue un bloc mémoire distinct sur le tas et duplique récursivement les données pointées ; (3) **Règle des Cinq** : Toute classe C++ gérant une ressource dynamique doit définir Destructeur, Constructeur de Copie, Opérateur d'Affectation par Copie, Constructeur de Déplacement et Affectation par Déplacement.
> * **Réalité en Production:** Mécanisme de Copy-On-Write (COW) sous Linux (`fork()`) et sémantique de pointeurs intelligents RAII.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.5), l'énoncé est :

*"Distinguez la copie superficielle de la copie profonde et exposez les regles de gestion des ressources associees en C++."*

## 2. Représentation en Mémoire

* **Copie Superficielle :** Deux instances partagent le même pointeur vers une zone allouée. La destruction de la première rend le second pointeur suspendu (dangling pointer) et conduit à un double `free()`.
* **Copie Profonde :** Chaque objet dispose d'un espace mémoire distinct et isolé.

## Implémentation de Production

```cpp
#include <iostream>
#include <cstring>
#include <utility>

class DeepString {
private:
    char* data;
    size_t length;

public:
    DeepString(const char* str = "") {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
    }

    ~DeepString() {
        delete[] data;
    }

    DeepString(const DeepString& other) {
        length = other.length;
        data = new char[length + 1];
        std::strcpy(data, other.data);
    }

    DeepString& operator=(DeepString other) {
        swap(*this, other);
        return *this;
    }

    DeepString(DeepString&& other) noexcept : data(nullptr), length(0) {
        swap(*this, other);
    }

    friend void swap(DeepString& first, DeepString& second) noexcept {
        using std::swap;
        swap(first.data, second.data);
        swap(first.length, second.length);
    }

    const char* c_str() const { return data; }
};
```

## Synthèse Comparative

| Critère | Copie Superficielle | Copie Profonde |
|---|---|---|
| **Mécanisme** | Copie directe mémoire (`memcpy`). | Allocation sur le tas et duplication des données. |
| **Vitesse** | Instantanée ($O(1)$). | Proportionnelle au volume ($O(N)$). |
| **Risque** | Pointeurs suspendus et crash de double libération. | Isolation complète et sûreté garantie. |
| **Usage** | Types primitifs, vues immuables (`string_view`), comptage de références. | Classes gérant des ressources exclusives (fichiers, mémoire brute). |

## Ingénierie des Systèmes en Production

### Architecture Système : Copy-On-Write (COW)

1. **Appel Système `fork()` sous Linux :** Duplication superficielle instantanée des tables de pages en lecture seule. La copie profonde n'intervient qu'en cas d'écriture effective.
2. **Pointeurs Intelligents RAII :** `std::unique_ptr` interdit la copie superficielle par suppression explicite des opérateurs de copie.

## Cas Limites et Robustesse

1. **Auto-Affectation (`a = a`) :** Gérée de manière sûre via l'idiome Copy-and-Swap.
