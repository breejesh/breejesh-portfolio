---
title: "Base de Datos de Calificaciones: Esquema Académico y Percentiles en SQL (CTCI 14.7)"
description: "Disena una base de datos academica en 3NF y calcula el 10% superior de estudiantes segun su promedio GPA mediante funciones de ventana en SQL."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-14-7-design-grade-database.webp
previewImage: /assets/images/ctci-14-7-design-grade-database.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena una base de datos para una escuela que registre estudiantes, cursos, profesores y calificaciones. Escribe una consulta SQL para hallar el 10% superior de estudiantes segun su promedio de calificaciones (GPA).
> * **La Solución Óptima:** **Esquema Relacional Normalizado en 3NF y Funciones de Ventana**:
>   1. **Esquema**: Entidades `Students`, `Courses`, `Teachers` y tabla intermedia `CourseEnrollment` con `Grade` y `Credits`.
>   2. **Cálculo de Promedio**: Promedio ponderado por creditos: $\text{GPA} = \frac{\sum (\text{Grade} \times \text{Credits})}{\sum \text{Credits}}$.
>   3. **Percentil Superior del 10%**: Usar la funcion de ventana analitica `PERCENT_RANK() OVER (ORDER BY GPA DESC)` con la condicion `WHERE PctRank <= 0.10`.
>   4. Se ejecuta en **tiempo $O(N \log N)$** mediante ordenacion en base de datos.
> * **Realidad en Producción:** Sistemas de informacion estudiantil (SIS) y generacion de cuadros de honor para becas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 14.7), se nos plantea:

*"Disena un esquema relacional para un sistema academico y formula una consulta SQL para obtener el top 10% de estudiantes con mayor rendimiento."*

## 2. Esquema DDL en 3NF

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

## 3. Consulta SQL para el 10% Superior

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

## Plan de Ejecución y Complejidad

| Etapa | Operación | Complejidad |
|---|---|---|
| 1. Agregación de GPA | Agrupación en `CourseEnrollment` | $O(E)$ |
| 2. Ordenación de Ventana | TimSort / Quicksort de percentiles | $O(S \log S)$ |
| 3. Filtro de Percentil | Filtrado lineal `PctRank <= 0.10` | $O(S)$ |
| 4. Búsqueda de Nombres | Acceso por clave primaria en `Students` | $O(K)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: GPA Precalculado

1. **Vistas Materializadas:** Calcular promedios en tiempo real para 50.000 estudiantes degrada el rendimiento de la base de datos durante inscripciones; se precalcula el GPA al finalizar cada periodo lectivo.
2. **Empates en el Límite:** El uso de `PERCENT_RANK()` o `DENSE_RANK()` permite incluir justamente a todos los alumnos que compartan la misma nota de corte.

## Casos Límite y Robustez en Producción

1. **División por Cero:** Controlado con `HAVING SUM(Credits) > 0`.
