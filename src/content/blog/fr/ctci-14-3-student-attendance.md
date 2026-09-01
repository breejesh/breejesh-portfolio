---
title: "Fermer Toutes les Demandes: Mises à Jour en Lot Multi-Tables en SQL (CTCI 14.3)"
description: "Exécutez des opérations de mise à jour groupées atomiques en SQL pour clôturer les tickets d'un bâtiment spécifique avec sous-requêtes et indexation."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Clôturez toutes les demandes de maintenance pour les appartements situés dans le bâtiment n°11.
> * **La Solution Optimale:** **Mise à Jour Groupée Atomique par Sous-Requête ou Jointure** :
>   1. **Approche par Sous-Requête** : `UPDATE Requests SET Status = 'Closed' WHERE AptID IN (SELECT AptID FROM Apartments WHERE BuildingID = 11)` ;
>   2. **Approche par Jointure Directe (PostgreSQL)** : `UPDATE Requests r SET Status = 'Closed' FROM Apartments a WHERE r.AptID = a.AptID AND a.BuildingID = 11` ;
>   3. **Transactions ACID** : Encadrer la modification dans une transaction explicite (`BEGIN TRANSACTION ... COMMIT`) avec verrous au niveau de la ligne.
> * **Réalité en Production:** Clôture automatique de tickets dans les outils de GMAO et d'exploitation immobilière.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 14.3), l'énoncé est :

*"Mettez a jour l'etat de tous les tickets de maintenance des logements de l'immeuble BuildingID = 11 pour les marquer comme 'Closed'."*

```sql
-- Hierarchie relationnelle
Buildings (BuildingID=11) ──> Apartments (AptID) ──> Requests (RequestID, Status)
```

## 2. Traversée des Clés Étrangères

La mise à jour de la table enfant (`Requests`) selon un critère sur la table grand-parent (`Buildings`) nécessite la résolution via la table de liaison intermédiaire (`Apartments`).

## Implémentation de Production

```sql
-- Requete ANSI SQL avec Transaction
BEGIN TRANSACTION;

UPDATE Requests
SET Status = 'Closed'
WHERE AptID IN (
    SELECT AptID
    FROM Apartments
    WHERE BuildingID = 11
)
AND Status <> 'Closed'; -- Optimisation: ignore les tickets deja fermes

COMMIT;
```

```sql
-- Variante avec Jointure Directe (PostgreSQL)
UPDATE Requests r
SET Status = 'Closed'
FROM Apartments a
WHERE r.AptID = a.AptID
  AND a.BuildingID = 11
  AND r.Status <> 'Closed';
```

## Plan d'Exécution et Verrous

| Étape | Action | Index Mobilisé | Type de Verrou |
|---|---|---|---|
| 1. Identifier Logements | Recherche par `BuildingID = 11` | `IX_Apartments_BuildingID` | Verrou Partagé (`S`) |
| 2. Cibler Demandes | Recherche par `AptID` | `IX_Requests_AptID` | Intention Exclusive (`IX`) |
| 3. Modifier Statut | Écriture sur page et journal WAL | Clé Primaire | Verrou Exclusif Ligne (`X`) |

## Ingénierie des Systèmes en Production

### Architecture Système : Découpage en Lots (Batch Chunking)

1. **Prévention de l'Escalade de Verrous :** Modifier un million de lignes simultanément risque de provoquer un verrouillage exclusif de la table entière. Il est recommandé de segmenter la mise à jour par paquets de 1 000 enregistrements.
2. **Journalisation (WAL) :** Exclure les enregistrements déjà clôturés évite des écritures disque superflues.

## Cas Limites et Robustesse

1. **Bâtiment sans Demande Ouverte :** Exécution sans erreur avec 0 ligne modifiée.
