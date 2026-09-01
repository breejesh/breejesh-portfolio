---
title: "Pointeur Intelligent: Implémentation du Comptage de Références en C++ (CTCI 12.9)"
description: "Implémentez une classe template de pointeur intelligent (Smart Pointer) en C++ avec libération automatique de mémoire et surcharge d'opérateurs."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une classe template de pointeur intelligent simulant un pointeur classique tout en assurant un ramasse-miettes automatique par comptage de références.
> * **La Solution Optimale:** **Pointeur Partagé avec Compteur sur le Tas** : (1) Gérer deux pointeurs : le pointeur brut vers l'objet `T* ref` et un compteur partagé alloué sur le tas `unsigned* ref_count` ; (2) **Constructeur** : Initialiser l'objet et allouer le compteur avec la valeur 1 ; (3) **Constructeur de Copie** : Partager l'adresse et incrémenter `(*ref_count)++` ; (4) **Affectation** : Décrémenter la référence actuelle (libérer si 0) et lier le nouvel objet ; (5) **Destructeur** : Décrémenter `(*ref_count)--` et libérer mémoire et compteur lorsque le compteur atteint 0 ; (6) Surcharger `operator*` et `operator->`.
> * **Réalité en Production:** Fonctionnement sous-jacent de `std::shared_ptr` en C++11 et `boost::shared_ptr`.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.9), l'énoncé est :

*"Implementez une classe template de pointeur intelligent en C++ avec gestion de duree de vie par comptage de references."*

## 2. Architecture du Comptage Partagé

Pour que tous les clones d'un `SmartPointer<T>` partagent le même compteur, l'entier doit obligatoirement résider sur le tas.

## Implémentation de Production

```cpp
#include <iostream>

template <typename T>
class SmartPointer {
private:
    T* ref;
    unsigned* ref_count;

    void remove() {
        if (!ref_count) return;

        (*ref_count)--;
        if (*ref_count == 0) {
            delete ref;
            delete ref_count;
            ref = nullptr;
            ref_count = nullptr;
        }
    }

public:
    explicit SmartPointer(T* ptr = nullptr) {
        ref = ptr;
        ref_count = new unsigned(1);
    }

    SmartPointer(const SmartPointer<T>& sptr) {
        ref = sptr.ref;
        ref_count = sptr.ref_count;
        if (ref_count) {
            (*ref_count)++;
        }
    }

    SmartPointer<T>& operator=(const SmartPointer<T>& sptr) {
        if (this == &sptr) {
            return *this;
        }

        remove();

        ref = sptr.ref;
        ref_count = sptr.ref_count;
        if (ref_count) {
            (*ref_count)++;
        }
        return *this;
    }

    ~SmartPointer() {
        remove();
    }

    T& operator*() const {
        return *ref;
    }

    T* operator->() const {
        return ref;
    }

    T* get() const {
        return ref;
    }

    unsigned use_count() const {
        return ref_count ? *ref_count : 0;
    }
};
```

## Analyse de Complexité et Mémoire

| Opération | Complexité | Détail Technique |
|---|---|---|
| Copie / Affectation | `O(1)` | Incrément/décrément de compteur scalaire. |
| Déréférencement (`*` / `->`) | `O(1)` | Accès direct sans surcoût. |
| Empreinte Mémoire | 16 Octets | Pointeur de donnée brute + pointeur vers compteur de contrôle. |

## Ingénierie des Systèmes en Production

### Architecture Système : `std::make_shared`

1. **Bloc de Contrôle Contigu (`std::make_shared`) :** Regroupe l'objet et son compteur dans un unique segment alloué pour éliminer la fragmentation.
2. **Références Circulaires :** Deux pointeurs partagés mutuels empêchent le compteur d'atteindre zéro, résolu via `std::weak_ptr`.

## Cas Limites et Robustesse

1. **Auto-Affectation (`ptr = ptr`) :** Protégée par le test `this == &sptr`.
