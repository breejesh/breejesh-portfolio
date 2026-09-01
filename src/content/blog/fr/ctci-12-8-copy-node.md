---
title: "Copier un Nœud: Clonage Profond de Graphes avec Cycles en C++ (CTCI 12.8)"
description: "Réalisez une copie profonde d'un graphe orienté ou réseau de pointeurs comportant des cycles en C++ via table de hachage en temps O(V + E)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-8-copy-node.webp
previewImage: /assets/images/ctci-12-8-copy-node.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode prenant en paramètre un pointeur vers une structure `Node` et renvoyant une copie complète de la structure de données. La structure `Node` contient deux pointeurs vers d'autres structures `Node`.
> * **La Solution Optimale:** **Copie Profonde avec Détection de Cycles par Table de Hachage** : (1) La structure pouvant former des graphes arbitraires ou des réseaux cycliques, une récursion naïve provoquerait un débordement de pile ; (2) Maintenir une table `std::unordered_map<const Node*, Node*> nodeMap` associant les adresses des nœuds d'origine à leurs clones respectifs ; (3) À chaque visite : si le nœud est nul, renvoyer `nullptr` ; s'il figure déjà dans la table, renvoyer immédiatement son clone existant ; (4) Sinon, instancier `Node* clone = new Node()`, l'enregistrer dans `nodeMap` *avant* d'explorer ses liens, puis dupliquer récursivement `ptr1` et `ptr2` ; (5) S'exécute en **temps $O(V + E)$** et **espace $O(V)$**.
> * **Réalité en Production:** Duplication d'arbres syntaxiques (AST) dans les compilateurs et clonage de graphes de calcul en Deep Learning.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.8), l'énoncé est :

*"Ecrivez une methode en C++ pour cloner fidelement une structure de noeuds a deux pointeurs pouvant presenter des cycles et interconnexions arbitraires."*

```cpp
struct Node {
    Node* ptr1;
    Node* ptr2;
};
```

## 2. Détection de Cycles et Mémorisation

Enregistrement préventif du clone dans la table de hachage :
$$\text{nodeMap}[\text{original}] = \text{clone}$$
Tout arc arrière ou boucle réflexive résout instantanément vers le pointeur déjà alloué, stoppant la récursion infinie.

## Implémentation de Production

```cpp
#include <iostream>
#include <unordered_map>

struct Node {
    Node* ptr1;
    Node* ptr2;
    int data;

    Node(int val = 0) : ptr1(nullptr), ptr2(nullptr), data(val) {}
};

class NodeCloner {
private:
    static Node* copyRecursive(const Node* root, std::unordered_map<const Node*, Node*>& nodeMap) {
        if (!root) return nullptr;

        auto it = nodeMap.find(root);
        if (it != nodeMap.end()) {
            return it->second;
        }

        Node* clone = new Node(root->data);
        nodeMap[root] = clone;

        clone->ptr1 = copyRecursive(root->ptr1, nodeMap);
        clone->ptr2 = copyRecursive(root->ptr2, nodeMap);

        return clone;
    }

public:
    static Node* copy(const Node* root) {
        std::unordered_map<const Node*, Node*> nodeMap;
        return copyRecursive(root, nodeMap);
    }
};
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(V + E)` | Chaque sommet et chaque pointeur est traité une unique fois. |
| Espace Auxiliaire | `O(V)` | Table de hachage associant $V$ paires de pointeurs. |

## Ingénierie des Systèmes en Production

### Architecture Système : Graphes de Compilateur (LLVM)

1. **Clonage de Graphes d'Instructions (LLVM IR) :** Les passes d'optimisation dupliquent les blocs de base via des tables de correspondance d'adresses.
2. **Topologies en Losange :** Les nœuds convergents partagés sont clonés une seule fois et reliés fidèlement.

## Cas Limites et Robustesse

1. **Nœud Auto-Référentiel (`node->ptr1 = node`) :** Géré sans erreur de récursion.
2. **Pointeurs Nuls :** Retour immédiat de `nullptr`.
