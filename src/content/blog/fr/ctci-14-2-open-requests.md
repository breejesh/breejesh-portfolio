---
title: "Demandes Ouvertes: Préservation du Left Join et Agrégation en SQL (CTCI 14.2)"
description: "Rédigez une requête SQL listant l'ensemble des bâtiments et leur nombre de demandes ouvertes, en détaillant la conservation des valeurs nulles et COUNT(col)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-14-2-open-requests.webp
previewImage: /assets/images/ctci-14-2-open-requests.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une requête SQL pour obtenir la liste de tous les bâtiments et le nombre de demandes ouvertes (demandes où le statut vaut 'Open').
> * **La Solution Optimale:** **LEFT JOIN Multi-Niveaux avec Prédicat dans la Clause ON** :
>   1. **Le Piège** : Un `INNER JOIN` élimine silencieusement les bâtiments sans incident ; placer `WHERE Status = 'Open'` transforme le `LEFT JOIN` en un `INNER JOIN`.
>   2. **La Correction** : Chaîner en `LEFT JOIN` depuis `Buildings` vers `Apartments` puis `Requests`, en plaçant le filtre dans la condition de jointure : `ON Apartments.AptID = Requests.AptID AND Requests.Status = 'Open'`.
>   3. **Agrégation** : Utiliser `COUNT(Requests.RequestID)` (évalue les nuls à 0) plutôt que `COUNT(*)` (qui compterait la ligne nulle pour 1).
>   4. S'exécute en **temps $O(N)$** via des recherches d'index.
> * **Réalité en Production:** Tableaux de bord de maintenance d'infrastructures et calcul de métriques SLA.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 14.2), l'énoncé est :

*"Redigez une requete SQL renvoyant l'integralite des immeubles et le total de leurs tickets de maintenance au statut 'Open'."*

## 2. Pièges Classiques du Left Join

1. **Prédicat dans WHERE :** Supprime les lignes synthétisées contenant des valeurs nulles pour les bâtiments sans incident.
2. **Utilisation de `COUNT(*)` :** Comptabilise la ligne nulle comme 1 demande existante. Utiliser `COUNT(colonne)`.

## Implémentation de Production

```sql
SELECT 
    b.BuildingID,
    b.BuildingName,
    COUNT(r.RequestID) AS NumberOfOpenRequests
FROM Buildings b
LEFT JOIN Apartments a 
    ON b.BuildingID = a.BuildingID
LEFT JOIN Requests r 
    ON a.AptID = r.AptID 
   AND r.Status = 'Open'
GROUP BY 
    b.BuildingID, 
    b.BuildingName;
```

## Plan d'Exécution et Performances

| Étape | Opération | Index Recommandé | Complexité |
|---|---|---|---|
| 1. Balayage Bâtiments | Balayage d'index primaire | `PK_Buildings` | $O(B)$ |
| 2. Recherche Logements | Recherche par clé étrangère | `IX_Apartments_BuildingID` | $O(B \log A)$ |
| 3. Filtrage Demandes | Index filtré | `IX_Requests_Status_Open` | $O(A \log R)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Index Partiels / Filtrés

1. **Index Filtré Partiel :** Sur des bases de données volumineuses, l'instruction `CREATE INDEX idx_open ON Requests(AptID) WHERE Status = 'Open'` réduit la taille de l'index de $99\%$, assurant sa résidence en mémoire cache.
2. **Gestion des Nuls :** `COALESCE` pour assurer la restitution de zéros stricts.

## Cas Limites et Robustesse

1. **Immeuble sans Logement :** Comptabilisé avec 0 demande ouverte.
2. **Immeuble avec Logements mais sans Demande :** Comptabilisé avec 0 demande ouverte.
