---
title: "Solicitudes Abiertas: Preservación de Left Join y Agregaciones en SQL (CTCI 14.2)"
description: "Escribe una consulta SQL para listar todos los edificios y su conteo de solicitudes abiertas, detallando la preservacion de nulos en Left Join y COUNT(col)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-14-2-open-requests.webp
previewImage: /assets/images/ctci-14-2-open-requests.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una consulta SQL para obtener una lista de todos los edificios y el numero de solicitudes abiertas (donde `Status = 'Open'`).
> * **La Solución Óptima:** **LEFT JOIN Multitabla con Predicado en la Cláusula ON**:
>   1. **La Trampa**: Usar `INNER JOIN` descarta edificios con 0 solicitudes; colocar `WHERE Status = 'Open'` transforma el `LEFT JOIN` en un `INNER JOIN`.
>   2. **La Solución**: Enlazar con `LEFT JOIN` desde `Buildings` hacia `Apartments` y `Requests`, ubicando el filtro de estado en el `ON`: `ON Apartments.AptID = Requests.AptID AND Requests.Status = 'Open'`.
>   3. **Agregación**: Emplear `COUNT(Requests.RequestID)` (evalua los nulos a 0) en lugar de `COUNT(*)` (que contaria la fila nula como 1).
>   4. Se ejecuta en **tiempo $O(N)$** mediante busquedas en indices.
> * **Realidad en Producción:** Paneles de control de mantenimiento y metricas de acuerdos de nivel de servicio (SLA).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 14.2), se nos plantea:

*"Escribe una consulta SQL para listar todos los edificios y su respectiva cantidad de solicitudes de mantenimiento con estado 'Open'."*

## 2. Errores Comunes con Left Join

1. **Filtro en WHERE:** Destruye las filas con valores nulos generadas para edificios sin solicitudes.
2. **Uso de `COUNT(*)`:** Cuenta la fila sintetica de nulos como una solicitud valida. Se debe usar `COUNT(columna)`.

## Implementación de Producción

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

## Plan de Ejecución y Rendimiento

| Etapa | Operación | Índice Recomendado | Complejidad |
|---|---|---|---|
| 1. Escaneo Edificios | Escaneo de índice primario | `PK_Buildings` | $O(B)$ |
| 2. Búsqueda Apartamentos | Búsqueda por clave foránea | `IX_Apartments_BuildingID` | $O(B \log A)$ |
| 3. Filtro Solicitudes | Índice filtrado | `IX_Requests_Status_Open` | $O(A \log R)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Índices Filtrados

1. **Índice Filtrado Parcial:** En tablas con millones de solicitudes historicas cerradas, un indice `CREATE INDEX idx_open ON Requests(AptID) WHERE Status = 'Open'` reduce el tamano del indice en un $99\%$, manteniendo todos los datos en la memoria cache de la base de datos.
2. **Tratamiento de Nulos:** `COALESCE` para garantizar la emision de ceros en interfaces de usuario.

## Casos Límite y Robustez en Producción

1. **Edificios sin Apartamentos:** Se muestran con 0 solicitudes abiertas.
2. **Edificios con Apartamentos pero sin Solicitudes:** Se muestran con 0 solicitudes abiertas.
