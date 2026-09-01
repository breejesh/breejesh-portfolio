---
title: "Table de Hachage vs. STL Map: Structures Internes et Compromis de Performance (CTCI 12.3)"
description: "Comparez std::unordered_map (Table de Hachage) et std::map (Arbre Rouge-Noir) en C++ : chaînage par alvéoles, équilibrage d'arbres et choix pour petites collections."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
previewImage: /assets/images/ctci-12-3-hash-table-vs-stl-map.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Comparez une table de hachage et un conteneur map de la STL. Comment une table de hachage est-elle implémentée ? Si le nombre d'entrées est restreint, lequel utiliseriez-vous ?
> * **Différences Fondamentales :** (1) **Structure Sous-Jacente** : `std::unordered_map` est une **Table de Hachage** avec alvéoles et listes chaînées, tandis que `std::map` est un **Arbre Binaire de Recherche Rouge-Noir** auto-équilibré ; (2) **Complexité Temporelle** : `unordered_map` offre une recherche en $O(1)$ moyen ($O(N)$ au pire sous collisions), tandis que `std::map` garantit un accès en $O(\log N)$ ; (3) **Ordonnancement** : `std::map` garantit un tri strict selon `operator<`, alors que la table de hachage ne propose aucun ordre déterminé.
> * **Décision pour Faibles Volumes :** Pour $N \le 50$, `std::map` (ou un `std::vector` trié) est souvent privilégié en raison de l'absence de calcul de hachage et de gaspillage d'alvéoles vides.
> * **Réalité en Production:** Carnets d'ordres financiers (arbres ordonnés) vs caches en mémoire haute performance (Swiss Tables de Google Abseil).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.3), l'énoncé est :

*"Comparez une table de hachage et un map de la STL (std::map), detaillez l'architecture d'une table de hachage et justifiez votre choix pour des collections reduites."*

## 2. Tableau Comparatif Structurel

| Caractéristique | `std::unordered_map` (Table de Hachage) | `std::map` (Arbre Rouge-Noir) |
|---|---|---|
| **Structure** | Tableau d'alvéoles (buckets) et listes chaînées. | Arbre binaire de recherche auto-équilibré. |
| **Recherche (Moyenne)** | $O(1)$ | $O(\log N)$ |
| **Recherche (Pire Cas)** | $O(N)$ (collisions totales). | $O(\log N)$ garanti. |
| **Ordre des Clés** | Non ordonné / Aléatoire. | Strictement ordonné (`operator<`). |
| **Conditions** | Fonction `std::hash` et `operator==`. | `std::less<Key>`. |

## Implémentation d'une Table de Hachage Minimale

```cpp
#include <iostream>
#include <string>
#include <vector>

template <typename K, typename V>
class SimpleHashTable {
private:
    struct HashNode {
        K key;
        V value;
        HashNode* next;
        HashNode(const K& k, const V& v) : key(k), value(v), next(nullptr) {}
    };

    static const int BUCKET_COUNT = 101;
    HashNode* table[BUCKET_COUNT];

    int hashFunction(const K& key) const {
        return std::hash<K>{}(key) % BUCKET_COUNT;
    }

public:
    SimpleHashTable() {
        for (int i = 0; i < BUCKET_COUNT; i++) table[i] = nullptr;
    }

    void insert(const K& key, const V& value) {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];

        while (entry != nullptr) {
            if (entry->key == key) {
                entry->value = value;
                return;
            }
            entry = entry->next;
        }

        HashNode* newNode = new HashNode(key, value);
        newNode->next = table[idx];
        table[idx] = newNode;
    }

    bool get(const K& key, V& outValue) const {
        int idx = hashFunction(key);
        HashNode* entry = table[idx];
        while (entry != nullptr) {
            if (entry->key == key) {
                outValue = entry->value;
                return true;
            }
            entry = entry->next;
        }
        return false;
    }
};
```

## Pourquoi Privilégier `std::map` pour Petits Ensembles ?

Pour $N < 50$ :
1. **Pas de calcul lourd de hachage :** Les fonctions cryptographiques ou de mélange consomment de multiples cycles processeur.
2. **Pas d'alvéoles vides inutilisées :** Évite la réservation de pointeurs superflus.
3. **Localité Cache :** Un `std::vector<std::pair<K,V>>` plat ordonné avec dichotomie (`std::lower_bound`) surpasse souvent les deux grâce aux lignes de cache L1/L2.

## Ingénierie des Systèmes en Production

### Architecture Système : Tables Plates Modernes (Swiss Tables)

1. **Abseil `flat_hash_map` :** Utilisation d'instructions vectorielles SIMD pour sonder 16 métadonnées en une seule instruction.
2. **Attaques par Déni de Service (Hash DoS) :** Protection par initialisation aléatoire de graines (SipHash) pour interdire les collisions forcées.

## Cas Limites et Robustesse

1. **Parcours Déterministe :** Dans les moteurs de consensus distribués, `std::map` garantit que tous les nœuds itèrent dans un ordre identique.
