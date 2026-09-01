---
title: "Appartements Multiples: Requêtes SQL avec Group By et Having (CTCI 14.1)"
description: "Rédigez une requête SQL optimisée pour identifier les locataires louant plusieurs appartements à l'aide de JOIN, GROUP BY et du filtre HAVING."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-14-1-multiple-apartments.webp
previewImage: /assets/images/ctci-14-1-multiple-apartments.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une requête SQL pour obtenir la liste des locataires louant plus d'un appartement.
> * **La Solution Optimale:** **Sous-Requête d'Agrégation et Filtrage Having** : (1) Le schéma comprend `Tenants(TenantID, TenantName)` et la table de jointure `AptTenants(TenantID, AptID)` ; (2) Regrouper `AptTenants` par `TenantID` avec la clause `HAVING COUNT(*) > 1` ; (3) Effectuer une jointure `INNER JOIN` avec `Tenants` pour récupérer le `TenantName` ; (4) Alternativement, exécuter un `JOIN` direct groupé sur `Tenants.TenantID, Tenants.TenantName` avec `HAVING COUNT(AptTenants.AptID) > 1` ; (5) S'exécute en **temps $O(N)$** via des recherches d'index B-Tree.
> * **Réalité en Production:** Audit de gestion locative dans les progiciels ERP et détection de doublons.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 14.1), l'énoncé est :

*"Redigez une requete SQL listant les noms des locataires ayant souscrit plusieurs baux d'habitation simultanes."*

```sql
-- Schema relationnel
Tenants(TenantID, TenantName)
AptTenants(TenantID, AptID)
Apartments(AptID, UnitNumber, BuildingID)
```

## 2. Distinction entre WHERE et HAVING

* **`WHERE` :** Filtre les lignes individuelles *avant* toute opération d'agrégation.
* **`HAVING` :** Filtre les groupes formés *après* l'évaluation de la clause `GROUP BY`.

## Implémentation de Production

```sql
-- Approche Optimale par Sous-Requete
SELECT 
    Tenants.TenantName
FROM Tenants
INNER JOIN (
    SELECT 
        TenantID
    FROM AptTenants
    GROUP BY TenantID
    HAVING COUNT(*) > 1
) MultiLocataires
ON Tenants.TenantID = MultiLocataires.TenantID;
```

## Plan d'Exécution et Performances

| Étape | Opération | Index Mobilisé | Complexité |
|---|---|---|---|
| 1. Agrégation | Regroupement par `TenantID` sur `AptTenants` | Index `(TenantID, AptID)` | $O(M)$ balayage d'index |
| 2. Filtre Having | Élimination des groupes avec `COUNT <= 1` | Mémoire vive | $O(K)$ |
| 3. Jointure Finale | Recherche par clé primaire sur `Tenants` | Clé primaire `TenantID` | $O(K \times 1)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Index Couvrants

1. **Index Couvrant Composé :** Créer `CREATE INDEX idx_apt_tenants ON AptTenants(TenantID, AptID)` permet au moteur SQL d'exécuter un Index-Only Scan sans accéder aux pages de table sur disque.
2. **Dédoublonnage :** En l'absence de contrainte d'unicité, utiliser `HAVING COUNT(DISTINCT AptID) > 1`.

## Cas Limites et Robustesse

1. **Locataires sans Logement :** Le `INNER JOIN` filtre naturellement les comptes inactifs.
