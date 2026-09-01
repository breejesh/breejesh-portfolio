---
title: "Destructeur Virtuel de Classe de Base: Prévention des Fuites en C++ (CTCI 12.7)"
description: "Pourquoi les destructeurs de classes de base doivent être virtuels en C++ pour éviter les fuites de ressources et les comportements indéfinis en polymorphisme."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-7-virtual-base-class.webp
previewImage: /assets/images/ctci-12-7-virtual-base-class.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Pourquoi le destructeur d'une classe de base doit-il être déclaré virtuel ?
> * **La Solution Optimale:** **Destruction Polymorphique par Vtable** : (1) Lors de la suppression d'un objet dérivé via un pointeur de classe de base (`Base* ptr = new Derived(); delete ptr;`), la liaison statique n'appelle que `Base::~Base()` si le destructeur n'est pas virtuel ; (2) Le destructeur dérivé `Derived::~Derived()` est ignoré, provoquant une fuite de mémoire sur le tas et des descripteurs de fichiers non fermés ; (3) La norme ISO C++ qualifie cette suppression sans destructeur virtuel de **Comportement Indéfini (Undefined Behavior)** ; (4) Déclarer `virtual ~Base() = default;` achemine l'appel par la `vtable`, exécutant d'abord le destructeur dérivé puis celui de base.
> * **Réalité en Production:** Hiérarchies de classes Qt (`QObject`) et nœuds d'arbres syntaxiques LLVM.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.7), l'énoncé est :

*"Pourquoi le destructeur d'une classe de base doit-il obligatoirement etre virtuel en C++ en contexte polymorphique ?"*

## 2. Ordre de Destruction et Libération de Ressources

* **Sans Destructeur Virtuel :** Le compilateur applique une résolution statique au type du pointeur (`Base*`), omettant la classe dérivée.
* **Avec Destructeur Virtuel :** L'appel est acheminé dynamiquement vers la classe dérivée, assurant la destruction en cascade du bas vers le haut.

## Implémentation de Production

```cpp
#include <iostream>

class BaseSecurisee {
public:
    BaseSecurisee() = default;
    virtual ~BaseSecurisee() {
        std::cout << "Destructeur Base Securise\n";
    }
};

class DeriveeSecurisee : public BaseSecurisee {
private:
    int* tampon;
public:
    DeriveeSecurisee() {
        tampon = new int[1000];
    }
    ~DeriveeSecurisee() override {
        delete[] tampon;
        std::cout << "Destructeur Derive: Memoire liberee!\n";
    }
};
```

## Comparatif des Comportements

| Scénario | Appel Réalisé | Destructeur Dérivé Exécuté ? | Résultat |
|---|---|---|---|
| Base Non Virtuelle | `delete (Base*)ptr;` | **Non** | Fuite de ressources + Comportement Indéfini. |
| Base Virtuelle | `delete (Base*)ptr;` | **Oui** | Nettoyage intégral de la mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Directives C++ (C.35)

1. **Règle C++ Core Guidelines C.35 :** Le destructeur d'une classe de base doit être public et virtuel, ou protégé et non virtuel.
2. **Conteneurs STL :** Des classes telles que `std::vector` ou `std::string` ne possèdent pas de destructeur virtuel ; en hériter publiquement est prohibé.

## Cas Limites et Robustesse

1. **Destructeur Virtuel Pur :** `virtual ~Base() = 0;` rend la classe abstraite mais impose obligatoirement une implémentation `Base::~Base() {}`.
