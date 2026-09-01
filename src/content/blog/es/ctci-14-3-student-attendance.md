---
title: "Cerrar Todas las Solicitudes: Actualizaciones por Lotes en SQL (CTCI 14.3)"
description: "Ejecuta operaciones de actualizacion masiva atomicas en SQL para cerrar solicitudes de mantenimiento en un edificio especifico mediante subconsultas y JOINs."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---

> **TL;DR**
> * **El Problema del Libro:** Cierra todas las solicitudes de mantenimiento para los apartamentos ubicados en el edificio numero 11.
> * **La Solución Óptima:** **Sentencia UPDATE Masiva con Subconsulta o JOIN**:
>   1. **Enfoque Subconsulta**: `UPDATE Requests SET Status = 'Closed' WHERE AptID IN (SELECT AptID FROM Apartments WHERE BuildingID = 11)`;
>   2. **Enfoque JOIN Directo**: `UPDATE Requests r SET Status = 'Closed' FROM Apartments a WHERE r.AptID = a.AptID AND a.BuildingID = 11`;
>   3. **Consistencia Transaccional**: Envolver la modificacion en una transaccion explicita (`BEGIN TRANSACTION ... COMMIT`) con bloqueos a nivel de fila para evitar bloqueos mutuos.
> * **Realidad en Producción:** Cierre masivo de incidentes en sistemas de gestion de activos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 14.3), se nos plantea:

*"Cierra todas las solicitudes de mantenimiento de los apartamentos correspondientes al edificio con BuildingID = 11."*

```sql
-- Jerarquía relacional
Buildings (BuildingID=11) ──> Apartments (AptID) ──> Requests (RequestID, Status)
```

## 2. Navegación de Claves Foráneas

Para modificar la tabla hija (`Requests`) filtrando por la tabla abuela (`Buildings`), se requiere resolver la relacion a traves de la tabla intermedia (`Apartments`).

## Implementación de Producción

```sql
-- Enfoque Estándar ANSI SQL con Transacción
BEGIN TRANSACTION;

UPDATE Requests
SET Status = 'Closed'
WHERE AptID IN (
    SELECT AptID
    FROM Apartments
    WHERE BuildingID = 11
)
AND Status <> 'Closed'; -- Optimización: omite registros ya cerrados

COMMIT;
```

```sql
-- Sintaxis con JOIN Directo (PostgreSQL)
UPDATE Requests r
SET Status = 'Closed'
FROM Apartments a
WHERE r.AptID = a.AptID
  AND a.BuildingID = 11
  AND r.Status <> 'Closed';
```

## Plan de Ejecución y Bloqueos

| Etapa | Acción | Índice Empleado | Tipo de Bloqueo |
|---|---|---|---|
| 1. Identificar Apartamentos | Búsqueda por `BuildingID = 11` | `IX_Apartments_BuildingID` | Bloqueo Compartido (`S`) |
| 2. Localizar Solicitudes | Búsqueda por `AptID` | `IX_Requests_AptID` | Intención Exclusiva (`IX`) |
| 3. Actualizar Estado | Modificación de registro y WAL | Clave Primaria | Bloqueo Exclusivo de Fila (`X`) |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Procesamiento por Lotes

1. **Escalamiento de Bloqueos:** En tablas con millones de registros, actualizar todas las filas de golpe puede forzar al gestor a bloquear la tabla entera. Se recomienda procesar en lotes de 1.000 filas.
2. **Escritura en Registro WAL:** Omitir registros que ya estan en estado 'Closed' reduce el trafico en el registro de transacciones.

## Casos Límite y Robustez en Producción

1. **Edificio sin Solicitudes Abiertas:** La sentencia finaliza correctamente con 0 filas modificadas.
