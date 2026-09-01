---
title: "Base de Données Scolaire: Calcul de Moyennes et Centiles en SQL (CTCI 14.7)"
description: "Concevez une base de données académique en 3NF et calculez le décile supérieur (top 10%) des étudiants selon leur moyenne GPA via les fonctions de fenêtrage SQL."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-14-7-design-grade-database.webp
previewImage: /assets/images/ctci-14-7-design-grade-database.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez une base de données pour un établissement scolaire répertoriant les étudiants, cours, enseignants et notes. Rédigez une requête SQL extrayant le top 10% des étudiants classés selon leur moyenne générale (GPA).
> * **La Solution Optimale:** **Schéma 3NF Normalisé et Fonctions de Fenêtrage** :
>   1. **Schéma Relationnel** : Tables `Students`, `Courses`, `Teachers` et table d'association `CourseEnrollment` avec `Grade` et `Credits`.
>   2. **Calcul de Moyenne Pondérée** : $\text{GPA} = \frac{\sum (\text{Grade} \times \text{Credits})}{\sum \text{Credits}}$.
>   3. **Centile Top 10%** : Fonction de fenêtrage analytique `PERCENT_RANK() OVER (ORDER BY GPA DESC)` filtrée avec `WHERE PctRank <= 0.10`.
>   4. S'exécute en **temps $O(N \log N)$** via un tri indexé.
> * **Réalité en Production:** Progiciels de scolarité universitaire et attribution de bourses d'excellence.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 14.7), l'énoncé est :

*"Etablissez le modele relationnel normalise pour le suivi des notes scolaires et redigez la requete SQL extrayant le premier decile (top 10%) des etudiants selon leur moyenne generale."*

## 2. Schéma DDL en 3NF

```sql
CREATE TABLE Students (
    StudentID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StudentName VARCHAR(100) NOT NULL
);

CREATE TABLE Courses (
    CourseID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CourseName VARCHAR(100) NOT NULL,
    Credits INT NOT NULL CHECK (Credits > 0)
);

CREATE TABLE Teachers (
    TeacherID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TeacherName VARCHAR(100) NOT NULL
);

CREATE TABLE CourseEnrollment (
    EnrollmentID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StudentID BIGINT NOT NULL REFERENCES Students(StudentID) ON DELETE CASCADE,
    CourseID BIGINT NOT NULL REFERENCES Courses(CourseID) ON DELETE RESTRICT,
    TeacherID BIGINT NOT NULL REFERENCES Teachers(TeacherID) ON DELETE RESTRICT,
    Term VARCHAR(20) NOT NULL,
    Grade NUMERIC(3, 2) NOT NULL CHECK (Grade >= 0.00 AND Grade <= 4.00),
    CONSTRAINT uq_student_course_term UNIQUE (StudentID, CourseID, Term)
);
```

## 3. Requête SQL du Top 10%

```sql
WITH StudentGPA AS (
    SELECT 
        e.StudentID,
        SUM(e.Grade * c.Credits) / SUM(c.Credits) AS GPA
    FROM CourseEnrollment e
    INNER JOIN Courses c ON e.CourseID = c.CourseID
    GROUP BY e.StudentID
    HAVING SUM(c.Credits) > 0
),
RankedCohort AS (
    SELECT 
        StudentID,
        GPA,
        PERCENT_RANK() OVER (ORDER BY GPA DESC) AS PctRank
    FROM StudentGPA
)
SELECT 
    s.StudentID,
    s.StudentName,
    ROUND(r.GPA, 2) AS FinalGPA
FROM RankedCohort r
INNER JOIN Students s ON r.StudentID = s.StudentID
WHERE r.PctRank <= 0.10
ORDER BY r.GPA DESC;
```

## Plan d'Exécution et Performances

| Étape | Opération | Complexité |
|---|---|---|
| 1. Agrégation GPA | Agrégation de groupe sur `CourseEnrollment` | $O(E)$ |
| 2. Tri Fenêtré | Algorithme de tri pour centiles | $O(S \log S)$ |
| 3. Filtrage Décile | Filtrage linéaire `PctRank <= 0.10` | $O(S)$ |
| 4. Jointure Étudiants | Recherche par clé primaire | $O(K)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Pré-Calcul de Moyennes

1. **Vues Matérialisées :** Pour éviter de saturer la base de données lors des inscriptions, la moyenne cumulative est précalculée en fin de semestre.
2. **Gestion des Ex-Aequo :** L'utilisation de `PERCENT_RANK()` inclut de façon équitable tous les élèves ayant la même note de coupure.

## Cas Limites et Robustesse

1. **Division par Zéro :** Neutralisée par la clause `HAVING SUM(Credits) > 0`.
