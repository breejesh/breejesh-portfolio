---
title: "Desnormalización: Optimización de Lectura y Anomalías de Escritura (CTCI 14.5)"
description: "Analiza los compromisos de la desnormalizacion en bases de datos, pasando de esquemas relacionales 3NF a modelos planos, vistas materializadas y CQRS."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-14-5-denormalization.webp
previewImage: /assets/images/ctci-14-5-denormalization.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Que es la desnormalizacion? Explica sus ventajas y desventajas.
> * **Definición Arquitectónica:** La desnormalizacion es la introduccion deliberada de datos redundantes o calculos preagregados en un esquema relacional normalizado (3NF) para optimizar la velocidad de lectura al eliminar costosas operaciones `JOIN`.
> * **Compromisos Principales:**
>   * **Ventajas**: Consultas ultrarrapidas en una sola tabla, simplificacion del codigo SQL y metricas agregadas instantaneas.
>   * **Desventajas**: Amplificacion de escritura (actualizar varias tablas por cada cambio), riesgo de inconsistencias de datos y mayor consumo de almacenamiento.
> * **Cuándo Aplicar**: Proporciones de lectura/escritura elevadas ($\ge 100:1$), almacenes de datos analiticos (esquemas en estrella en BigQuery/Snowflake) y modelos de lectura CQRS.
> * **Realidad en Producción:** Motores de busqueda de comercio electronico y contadores de seguidores en redes sociales.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 14.5), se nos plantea:

*"Explica que es la desnormalizacion de bases de datos, sus ventajas, desventajas y casos de uso en ingenieria de software."*

## 2. Comparativa Arquitectónica: 3NF vs Desnormalización

* **Modelo Normalizado (3NF):** Minimiza la redundancia y previene anomalias, pero requiere realizar multiples `JOINs` para consultar datos relacionados.
* **Modelo Desnormalizado:** Aplana las tablas para permitir lecturas en $O(1)$ a costa de duplicar informacion.

## Implementación de Producción

```sql
-- 1. Tabla Normalizada
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    TotalPosts INT DEFAULT 0 -- Campo desnormalizado para evitar COUNT(*) costosos
);

CREATE TABLE Publicaciones (
    PostID INT PRIMARY KEY,
    UsuarioID INT REFERENCES Usuarios(UsuarioID),
    Contenido TEXT NOT NULL
);

-- 2. Disparador (Trigger) para mantener la consistencia
CREATE OR REPLACE FUNCTION actualizar_conteo_posts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE Usuarios SET TotalPosts = TotalPosts + 1 WHERE UsuarioID = NEW.UsuarioID;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE Usuarios SET TotalPosts = TotalPosts - 1 WHERE UsuarioID = OLD.UsuarioID;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conteo_posts
AFTER INSERT OR DELETE ON Publicaciones
FOR EACH ROW EXECUTE FUNCTION actualizar_conteo_posts();
```

## Matriz de Compromisos

| Métrica | Esquema Normalizado (3NF) | Esquema Desnormalizado |
|---|---|---|
| **Latencia de Lectura** | Elevada (Multiples JOINs y agregaciones) | **Submilimétrica** (Busqueda en una sola tabla) |
| **Latencia de Escritura**| **Rápida** (Unica fila por entidad) | Lenta (Escritura duplicada en varias tablas) |
| **Consistencia** | **Garantizada** (Fuente unica de verdad) | Riesgo de desfase en sincronizaciones asincronas |
| **Almacenamiento** | Minimo | Mayor ($2\times\text{--}5\times$) |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Patrón CQRS y Almacenes Analíticos

1. **Patrón CQRS:** Separa la base de datos relacional de escritura (PostgreSQL) de vistas desnormalizadas de lectura en Elasticsearch o Redis.
2. **Esquema en Estrella (Star Schema):** Agrupa hechos y dimensiones para acelerar consultas analiticas en Snowflake y ClickHouse.

## Casos Límite y Robustez en Producción

1. **Anomalías de Actualización:** Si falla la sincronizacion de datos duplicados, se deben ejecutar tareas de reconciliacion periodicas para reparar inconsistencias.
