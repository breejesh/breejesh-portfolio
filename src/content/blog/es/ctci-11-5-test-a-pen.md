---
title: "Probar un Bolígrafo: Marco Estructurado de Control de Calidad y Pruebas Físicas (CTCI 11.5)"
description: "Formula una estrategia integral de aseguramiento de calidad (QA) y pruebas de hardware para un producto de consumo cotidiano en dominios funcionales y de estres."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-11-5-test-a-pen.webp
previewImage: /assets/images/ctci-11-5-test-a-pen.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Como probarias un boligrafo?
> * **La Solución Óptima:** **Matriz de Control de Calidad en 5 Fases**: (1) **Definición de Alcance y Usuario**: Identificar publico objetivo (estudiantes, artistas, astronautas, medicos) y tipo de tinta (gel, estilografica, boligrafo presurizado); (2) **Validación Funcional**: Flujo continuo de tinta sobre diversos soportes (papel, carton, tela), secado rapido y resistencia a manchas; (3) **Pruebas de Estrés Ambiental**: Funcionamiento en temperaturas extremas ($-20^\circ\text{C}$ a $+60^\circ\text{C}$), cambios de altitud/presion (cabina de avion sin fugas) y humedad; (4) **Durabilidad y Caídas**: Caida de 2 metros sobre hormigon y ciclos de fatiga de clip y pulsador (50.000 pulsaciones); (5) **Seguridad y Normativa**: Tinta no toxica (ASTM D-4236) y tapas ventiladas antiasfixia infantil (ISO 11540).
> * **Realidad en Producción:** Protocolos de QA en fabricacion de productos de consumo (Bic, Apple Pencil).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 11.5), se nos plantea:

*"Formular un plan de pruebas estructurado para evaluar un boligrafo considerando requerimientos funcionales, ergonomicos, ambientales y de seguridad."*

## 2. Matriz de Pruebas de Calidad

| Categoría | Caso de Prueba | Criterio de Éxito |
|---|---|---|
| **Funcionalidad Básica** | Dibujo continuo en rueda mecánica de prueba | Mínimo 2.000 metros de trazo continuo sin saltos. |
| **Versatilidad de Superficies** | Escritura en papel bond, cartón, recibos térmicos | Adherencia uniforme sin repeler tinta. |
| **Altitud / Presión** | Despresurización en cámara de vacío ($0,5\text{ atm}$) | Cero fugas de tinta alrededor de la punta. |
| **Resistencia a Caídas** | Caída desde 2 metros sobre suelo de hormigón | La punta no se encalla y la carcasa no se fractura. |
| **Seguridad Infantil** | Permeabilidad de aire en la tapa (ISO 11540) | Caudal de aire superior a $8\text{ l/min}$ a $1,33\text{ kPa}$. |

## Implementación de Evaluación Automatizada

```java
public class ProductTestingFramework {
    public interface SensorTelemetry {
        double readInkFlowRate();
        double readTipPressureGrams();
        boolean hasSkippingDetected();
    }

    public static class AutomatedWritingTest {
        private static final double MIN_WRITING_DISTANCE_METERS = 2000.0;

        public static boolean evaluatePenQuality(SensorTelemetry robot, double currentMetersDrawn) {
            if (currentMetersDrawn < MIN_WRITING_DISTANCE_METERS) {
                return false;
            }

            double inkRate = robot.readInkFlowRate();
            if (inkRate <= 0.0 || robot.hasSkippingDetected()) {
                return false;
            }

            return true;
        }
    }
}
```

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Pruebas Aceleradas de Vida Útil (ALT)

1. **Análisis FMEA:** Evaluacion sistematica de modos de fallo (secado de tinta, fractura de muelle).
2. **Cámaras de Choque Térmico:** Simulacion acelerada de 3 anos de envejecimiento en 14 dias mediante ciclos de temperatura y humedad.

## Casos Límite y Robustez en Producción

1. **Evaporación sin Tapa:** Boligrafo destapado durante 72 horas; debe escribir fluidamente tras 3 trazos.
2. **Toxicidad Química:** Cumplimiento de directivas de metales pesados en tintas.
