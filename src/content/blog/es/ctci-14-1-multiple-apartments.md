---
title: "Múltiples Apartamentos: Consultas SQL con Group By y Having (CTCI 14.1)"
description: "Escribe una consulta SQL optimizada para identificar inquilinos que alquilan mas de un apartamento usando JOIN, GROUP BY y filtros de agregacion HAVING."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-14-1-multiple-apartments.webp
previewImage: /assets/images/ctci-14-1-multiple-apartments.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una consulta SQL para obtener la lista de inquilinos que estan alquilando mas de un apartamento.
> * **La Solución Óptima:** **Subconsulta Agregada / Filtro Having**: (1) El esquema contiene `Tenants(TenantID, TenantName)` y la tabla intermedia `AptTenants(TenantID, AptID)`; (2) Agrupar `AptTenants` por `TenantID` con la clausula `HAVING COUNT(*) > 1`; (3) Unir (`INNER JOIN`) el resultado filtrado con `Tenants` para extraer el `TenantName`; (4) Alternativamente, realizar un `JOIN` directo agrupado por `Tenants.TenantID, Tenants.TenantName` con `HAVING COUNT(AptTenants.AptID) > 1`; (5) Se ejecuta en **tiempo $O(N)$** mediante busquedas en indices B-Tree.
> * **Realidad en Producción:** Auditorias de contratos multiples y deduplicacion en sistemas CRM y ERP.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 14.1), se nos plantea:

*"Escribe una consulta SQL que devuelva los nombres de los inquilinos que alquilan mas de un apartamento en el sistema."*

```sql
-- Esquema relacional
Tenants(TenantID, TenantName)
AptTenants(TenantID, AptID)
Apartments(AptID, UnitNumber, BuildingID)
```

## 2. Diferencia entre WHERE y HAVING

* **`WHERE`:** Filtra filas individuales *antes* de realizar la agregacion. No admite funciones agregadas (`COUNT`).
* **`HAVING`:** Filtra los grupos resultantes *después* de que `GROUP BY` ha calculado las cuentas agregadas.

## Implementación de Producción

```sql
-- Enfoque Óptimo con Subconsulta
SELECT 
    Tenants.TenantName
FROM Tenants
INNER JOIN (
    SELECT 
        TenantID
    FROM AptTenants
    GROUP BY TenantID
    HAVING COUNT(*) > 1
) MultiLease
ON Tenants.TenantID = MultiLease.TenantID;
```

## Plan de Ejecución y Rendimiento

| Etapa | Operación | Índice Utilizado | Complejidad |
|---|---|---|---|
| 1. Agregación | Agrupación por `TenantID` en `AptTenants` | Índice `(TenantID, AptID)` | $O(M)$ escaneo de índice |
| 2. Filtro Having | Filtrar grupos con `COUNT > 1` | Búfer en memoria | $O(K)$ |
| 3. Join Final | Búsqueda de nombre en `Tenants` | Clave primaria `TenantID` | $O(K \times 1)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Índices de Cobertura

1. **Índice Compuesto de Cobertura:** Definir `CREATE INDEX idx_apt_tenants ON AptTenants(TenantID, AptID)` permite al motor de base de datos resolver la agregacion completa mediante un Index-Only Scan sin acceder a las paginas de datos del disco.
2. **Duplicados:** Si no existe restriccion de clave primaria en la tabla intermedia, usar `HAVING COUNT(DISTINCT AptID) > 1`.

## Casos Límite y Robustez en Producción

1. **Inquilinos sin Apartamentos:** El `INNER JOIN` excluye automaticamente registros sin contratos activos.
