---
title: "Dénormalisation: Optimisation de Lecture et Anomalies d'Écriture (CTCI 14.5)"
description: "Analysez les compromis de la dénormalisation en bases de données : passage de la 3NF aux modèles plats, vues matérialisées et architecture CQRS."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-14-5-denormalization.webp
previewImage: /assets/images/ctci-14-5-denormalization.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Qu'est-ce que la dénormalisation ? Expliquez ses avantages et inconvénients.
> * **Définition Architecturale :** La dénormalisation consiste à introduire délibérément de la redondance ou des agrégats précalculés au sein d'un schéma relationnel normalisé (3NF) afin d'accélérer les lectures en éliminant les opérations `JOIN` coûteuses.
> * **Les Compromis Majeurs :**
>   * **Avantages** : Temps de lecture quasi-instantané en une seule passe d'index, simplification des requêtes et métriques d'agrégation immédiates.
>   * **Inconvénients** : Amplification d'écriture (mise à jour de multiples tables par modification), risques d'incohérences de données et surcoût de stockage.
> * **Quand l'Appliquer :** Ratios lecture/écriture très élevés ($\ge 100:1$), entrepôts de données décisionnels (schémas en étoile dans BigQuery / Snowflake) et projections de lecture CQRS.
> * **Réalité en Production:** Catalogues produits en e-commerce et compteurs d'abonnés sur les réseaux sociaux.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 14.5), l'énoncé est :

*"Exposez les principes de la denormalisation de bases de donnees, ses benefices sur les lectures intensives et ses contraintes d'integrite."*

## 2. Comparatif Architectural : 3NF vs Dénormalisation

* **Schéma Normalisé (3NF) :** Élimine toute redondance mais impose des jointures multi-tables à chaque restitution.
* **Schéma Dénormalisé :** Aplatit les entités pour garantir des temps de réponse sub-milliseconde.

## Implémentation de Production

```sql
-- 1. Table Utilisateurs avec compteur denormalise
CREATE TABLE Utilisateurs (
    UtilisateurID INT PRIMARY KEY,
    Nom VARCHAR(50) NOT NULL,
    TotalPublications INT DEFAULT 0 -- Évite les requêtes SELECT COUNT(*)
);

CREATE TABLE Publications (
    PublicationID INT PRIMARY KEY,
    UtilisateurID INT REFERENCES Utilisateurs(UtilisateurID),
    Contenu TEXT NOT NULL
);

-- 2. Déclencheur (Trigger) garantissant la cohérence
CREATE OR REPLACE FUNCTION actualiser_total_publications()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE Utilisateurs SET TotalPublications = TotalPublications + 1 WHERE UtilisateurID = NEW.UtilisateurID;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE Utilisateurs SET TotalPublications = TotalPublications - 1 WHERE UtilisateurID = OLD.UtilisateurID;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_publications_count
AFTER INSERT OR DELETE ON Publications
FOR EACH ROW EXECUTE FUNCTION actualiser_total_publications();
```

## Synthèse des Compromis

| Métrique | Schéma Normalisé (3NF) | Schéma Dénormalisé |
|---|---|---|
| **Temps de Lecture** | Élevé (Multiples JOINs et calculs) | **Sub-milliseconde** (Index sur table unique) |
| **Temps d'Écriture** | **Très rapide** (Une ligne par entité) | Plus lent (Multiples écritures en cascade) |
| **Cohérence** | **Absolue** (Source unique de vérité) | Risque de désynchronisation temporaire |
| **Stockage** | Minimal | Accru ($2\times\text{--}5\times$) |

## Ingénierie des Systèmes en Production

### Architecture Système : Patron CQRS et Entrepôts Décisionnels

1. **Architecture CQRS :** Isole la base relationnelle transactionnelle (PostgreSQL) des magasins de lecture optimisés (Elasticsearch / Redis).
2. **Schémas en Étoile (Star Schema) :** Structure dénormalisée associant une table de faits à des dimensions larges pour maximiser le débit de traitement analytique.

## Cas Limites et Robustesse

1. **Anomalies de Mise à Jour :** Mettre en place des mécanismes de réconciliation asynchrones pour corriger d'éventuelles dérives de données.
