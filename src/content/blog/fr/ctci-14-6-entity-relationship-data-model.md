---
title: "Modèle Entité-Association: Schémas de Réseaux Professionnels en SQL (CTCI 14.6)"
description: "Concevez un modèle de données Entité-Association (EA) normalisé pour réseaux professionnels (Entreprises, Personnes, Emplois) avec DDL et cardinalités M:N."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
previewImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Dessinez un diagramme Entité-Association (EA) pour une base de données répertoriant les Entreprises, les Personnes et les Professionnels (personnes ayant occupé des postes en entreprise).
> * **La Solution Optimale:** **Modélisation Relationnelle Normalisée** :
>   1. **Entité `People`** : Identité civile (`PersonID (PK)`, `FirstName`, `LastName`, `Email`).
>   2. **Entité `Companies`** : Personnes morales (`CompanyID (PK)`, `CompanyName`, `Industry`).
>   3. **Statut de `Professionals`** : Modélisé comme une vue ou un sous-type 1:1 de `People` possédant au moins un emploi enregistré.
>   4. **Table de Jointure `JobHistory` (M:N)** : Associe personnes et entreprises (`PositionID (PK)`, `PersonID (FK)`, `CompanyID (FK)`, `Title`, `StartDate`, `EndDate`).
> * **Réalité en Production:** Modélisation des réseaux professionnels (LinkedIn) et progiciels RH (Workday).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 14.6), l'énoncé est :

*"Etablissez le diagramme entite-association et le schema DDL relationnel complet pour modeliser des personnes, des entreprises et leur historique professionnel."*

## 2. Architecture Entité-Association

* **Personnes (1) vers Emplois (N) :** Une personne peut cumuler ou enchaîner plusieurs postes.
* **Entreprises (1) vers Emplois (N) :** Une entreprise emploie plusieurs personnes.

## Implémentation de Production

```sql
-- 1. Table des Personnes
CREATE TABLE People (
    PersonID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(30),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des Entreprises
CREATE TABLE Companies (
    CompanyID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL,
    Industry VARCHAR(100),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Historique d'Emploi (Relation N:M)
CREATE TABLE JobHistory (
    PositionID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PersonID BIGINT NOT NULL REFERENCES People(PersonID) ON DELETE CASCADE,
    CompanyID BIGINT NOT NULL REFERENCES Companies(CompanyID) ON DELETE RESTRICT,
    Title VARCHAR(150) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE, -- NULL represente le poste actuel
    CONSTRAINT chk_dates CHECK (EndDate IS NULL OR EndDate >= StartDate)
);

-- 4. Vue des Professionnels
CREATE VIEW Professionals AS
SELECT DISTINCT p.*
FROM People p
INNER JOIN JobHistory j ON p.PersonID = j.PersonID;
```

## Optimisation par Index

| Table | Index Composé | Usage Opérationnel |
|---|---|---|
| `JobHistory` | `(PersonID, StartDate DESC)` | Affichage chronologique instantané du CV. |
| `JobHistory` | `(CompanyID, StartDate DESC)` | Recherche de l'annuaire des salariés par société. |

## Ingénierie des Systèmes en Production

### Architecture Système : Historisation Bitemporelle

1. **Données Temporelles (SCD Type 2) :** Conservation de l'évolution des postes et salaires via des fenêtres de validité temporelle (`ValidFrom`, `ValidTo`).
2. **Projections en Graphes :** Alimentation de moteurs de graphes (Neo4j) pour résoudre les recommandations d'amis et liens d'affinité.

## Cas Limites et Robustesse

1. **Intégrité Référentielle :** Clause `ON DELETE RESTRICT` sur `Companies` pour interdire la suppression accidentelle d'employeurs référencés dans des historiques.
