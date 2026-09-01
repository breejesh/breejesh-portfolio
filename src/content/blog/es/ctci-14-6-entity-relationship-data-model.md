---
title: "Modelo Entidad-Relación: Esquemas de Redes Profesionales en SQL (CTCI 14.6)"
description: "Disena un modelo de datos Entidad-Relacion (ER) normalizado para redes profesionales (Empresas, Personas, Empleos) con DDL y cardinalidades M:N."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
previewImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dibuja un diagrama Entidad-Relacion (ER) para una base de datos con Empresas, Personas y Profesionales (personas que han tenido empleos en empresas).
> * **La Solución Óptima:** **Modelado Relacional Normalizado**:
>   1. **Entidad `People`**: Identidad de la persona (`PersonID (PK)`, `FirstName`, `LastName`, `Email`).
>   2. **Entidad `Companies`**: Organizaciones (`CompanyID (PK)`, `CompanyName`, `Industry`).
>   3. **Modelado de `Professionals`**: Se modela como una vista o subtipo 1:1 de `People` que posee al menos un registro laboral.
>   4. **Tabla Intermedia `JobHistory` (M:N)**: Relaciona personas con empresas (`PositionID (PK)`, `PersonID (FK)`, `CompanyID (FK)`, `Title`, `StartDate`, `EndDate`).
> * **Realidad en Producción:** Esquemas de redes profesionales (LinkedIn) y bases de datos de recursos humanos (Workday).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 14.6), se nos plantea:

*"Disena el modelo entidad-relacion y el esquema DDL para gestionar personas, empresas y el historial profesional de puestos de trabajo."*

## 2. Arquitectura del Modelo Entidad-Relación

* **Personas (1) a Historial (N):** Una persona puede haber ocupado multiples cargos a lo largo del tiempo.
* **Empresas (1) a Historial (N):** Una empresa emplea a multiples personas.

## Implementación de Producción

```sql
-- 1. Tabla de Personas
CREATE TABLE People (
    PersonID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(30),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Empresas
CREATE TABLE Companies (
    CompanyID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL,
    Industry VARCHAR(100),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Historial de Empleo (Relación Muchos a Muchos)
CREATE TABLE JobHistory (
    PositionID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PersonID BIGINT NOT NULL REFERENCES People(PersonID) ON DELETE CASCADE,
    CompanyID BIGINT NOT NULL REFERENCES Companies(CompanyID) ON DELETE RESTRICT,
    Title VARCHAR(150) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE, -- NULL representa el empleo actual
    CONSTRAINT chk_fechas CHECK (EndDate IS NULL OR EndDate >= StartDate)
);

-- 4. Vista de Profesionales
CREATE VIEW Professionals AS
SELECT DISTINCT p.*
FROM People p
INNER JOIN JobHistory j ON p.PersonID = j.PersonID;
```

## Índices de Rendimiento

| Tabla | Columnas Indexadas | Propósito |
|---|---|---|
| `JobHistory` | `(PersonID, StartDate DESC)` | Carga instantánea del perfil y trayectoria laboral. |
| `JobHistory` | `(CompanyID, StartDate DESC)` | Listado de empleados actuales y antiguos por empresa. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Historial Bitemporal

1. **Datos Temporales (SCD Tipo 2):** Registro historico de cambios salariales y ascensos mediante intervalos temporales (`ValidFrom`, `ValidTo`).
2. **Proyección en Grafos:** En redes sociales, estas tablas relacionales alimentan motores de grafos (Neo4j) para calcular conexiones de 2do y 3er grado.

## Casos Límite y Robustez en Producción

1. **Integridad Referencial:** Restriccion `ON DELETE RESTRICT` en empresas para evitar que el borrado de una compania elimine el historial historico de los empleados.
