---
title: "Fonctions Virtuelles: Mécanismes Internes de Vtable et Vptr en C++ (CTCI 12.4)"
description: "Explorez le fonctionnement interne des fonctions virtuelles en C++ : table des méthodes virtuelles (vtable), pointeur vptr et surcoût du dispatch dynamique."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-4-virtual-functions.webp
previewImage: /assets/images/ctci-12-4-virtual-functions.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Comment fonctionnent les fonctions virtuelles en C++ ?
> * **La Solution Optimale:** **Dispatch Dynamique par Vtable et Vptr** : (1) **La Table Virtuelle (`vtable`)** : Tableau statique de pointeurs de fonctions généré par le compilateur pour chaque classe polymorphique et stocké dans le segment `.rodata` ; (2) **Le Pointeur Virtuel (`vptr`)** : Pointeur masqué inséré au décalage 0 de chaque instance d'objet pointant vers la `vtable` de sa classe concrète ; (3) **Résolution à l'Exécution** : Lors d'un appel `p->foo()`, le processeur exécute `(p->vptr[index_foo])(p)` en temps $O(1)$ avec un niveau d'indirection ; (4) **Surcoût** : 8 octets par objet en 64 bits et interdiction de l'inlining par le compilateur.
> * **Réalité en Production:** Moteurs de jeux (Unreal Engine) et interfaces COM / DirectX.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.4), l'énoncé est :

*"Expliquez le fonctionnement des fonctions virtuelles en C++, leurs structures internes de donnees et leur impact sur les performances."*

## 2. Organisation en Mémoire : Vptr et Vtable

À la compilation d'une classe contenant des fonctions virtuelles :
1. Une structure `vtable` unique est allouée dans le segment constant `.rodata`.
2. Chaque objet instancié se voit préfixé d'un pointeur `vptr` de 8 octets pointant sur cette table.

À l'exécution :
$$\text{Appel} = (\text{instance}->\text{vptr}[\text{index}])(\text{instance})$$

## Implémentation de Production

```cpp
#include <iostream>

class Shape {
public:
    int id;

    void printId() const {
        std::cout << "Shape ID: " << id << "\n";
    }

    virtual void draw() const {
        std::cout << "Drawing generic Shape\n";
    }

    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    double radius;

    void draw() const override {
        std::cout << "Drawing Circle with radius " << radius << "\n";
    }
};

void renderShape(const Shape* s) {
    s->draw(); // Dispatch dynamique via la vtable
}
```

## Analyse des Coûts et Performances

| Facteur | Impact | Détail Technique |
|---|---|---|
| **Mémoire par Instance** | $+8\text{ Octets}$ | Pointeur `vptr` 64 bits inséré en tête d'objet. |
| **Mémoire par Classe** | $8\text{ Octets} \times N_{\text{méthodes}}$ | `vtable` statique stockée dans `.rodata`. |
| **Latence d'Appel** | $\approx 2\text{ ns}$ | 1 indirection mémoire ; empêche l'inlining de fonction. |

## Ingénierie des Systèmes en Production

### Architecture Système : Polymorphisme Statique (CRTP)

1. **Patron CRTP (Curiously Recurring Template Pattern) :** En trading haute fréquence, le polymorphisme est résolu à la compilation via des templates pour éliminer le coût des `vptr` et permettre l'inlining agressif.
2. **Troncature d'Objet (Object Slicing) :** Passer un objet polymorphe par valeur (`void fn(Shape s)`) tronque les membres dérivés et réinitialise `vptr`. Toujours transmettre par pointeur ou référence.

## Cas Limites et Robustesse

1. **Appels Virtuels dans Constructeurs/Destructeurs :** Ils n'appellent pas les classes dérivées car l'objet enfant n'est pas encore instancié ou est déjà détruit.
