---
title: "Constructor Privado: Prevención de Herencia y Patrones Creacionales en Java (CTCI 13.1)"
description: "Analiza el impacto de los constructores privados en la herencia en Java, detallando la resolucion de super(), clases utilitarias y el patron Singleton."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---

> **TL;DR**
> * **El Problema del Libro:** En terminos de herencia, ¿cual es el efecto de mantener un constructor privado en Java?
> * **La Solución Óptima:** **Imposibilidad de Subclasificación por Inaccesibilidad de Super()**: (1) En Java, todo constructor de una subclase debe invocar a un constructor de su clase padre (sea explicitamente con `super(...)` o implicitamente con `super()`); (2) Si todos los constructores de la clase son `private`, ninguna clase externa puede acceder a `super()`, haciendo que la herencia sea imposible (error de compilacion); (3) **Excepción de Clases Internas**: Las clases anidadas estaticas dentro de la misma clase exterior si pueden acceder a constructores privados y heredar de ella; (4) **Patrones de Diseño**: Permite implementar el patron Singleton, clases utilitarias estaticas (`Math`, `Arrays`) y metodos de factoria estaticos.
> * **Realidad en Producción:** Factorias de beans en Spring Framework y constructores de registros inmutables en Jackson.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 13.1), se nos plantea:

*"Explica el impacto de declarar todos los constructores de una clase como privados sobre la herencia y los patrones creacionales en Java."*

## 2. Herencia en Java y Resolución de `super()`

Todo constructor de clase derivada intenta llamar a `super()`:
* Si el constructor padre es `private`, el compilador emite un error de acceso prohibido impidiendo la compilacion de la subclase.

## Implementación de Producción

```java
public class DatabaseConnectionPool {
    private DatabaseConnectionPool() {
        System.out.println("Inicializando singleton...");
    }

    private static class InstanceHolder {
        private static final DatabaseConnectionPool INSTANCE = new DatabaseConnectionPool();
    }

    public static DatabaseConnectionPool getInstance() {
        return InstanceHolder.INSTANCE;
    }

    // Las clases anidadas internas SI pueden heredar
    public static class TestablePool extends DatabaseConnectionPool {
        public TestablePool() {
            super(); // Permitido porque es clase interna
        }
    }
}

public final class MathUtils {
    private MathUtils() {
        throw new AssertionError("Clase utilitaria no instanciable");
    }

    public static int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }
}
```

## Patrones Arquitectónicos Habilitados

| Patrón | Propósito | Justificación del Constructor Privado |
|---|---|---|
| **Singleton** | Garantiza 1 unica instancia global. | Impide que clientes ejecuten `new MyClass()`. |
| **Clase Utilitaria** | Agrupa funciones puras estaticas. | Evita instanciaciones vacias en heap. |
| **Factoría Estática** | Creacion controlada (`Optional.of()`). | Permite reutilizacion de instancias en cache. |
| **Builder** | Construccion de objetos inmutables. | Canaliza la creacion exclusivamente por el builder. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Clases Selladas en Java 17+

1. **Clases Selladas (Sealed Classes):** Java 17 introduce la clausula `sealed ... permits`, permitiendo restringir la herencia a una lista estricta sin necesidad de ocultar los constructores.
2. **Defensa contra Reflexión:** Incluir `throw new AssertionError()` dentro del constructor privado protege contra invocaciones maliciosas mediante `setAccessible(true)`.

## Casos Límite y Robustez en Producción

1. **Serialización:** La deserializacion puede crear nuevas instancias ignorando constructores privados; se resuelve implementando `readResolve()`.
