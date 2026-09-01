---
title: "Final, Finally y Finalize: Modificadores y Ciclo de Vida en Java (CTCI 13.3)"
description: "Diferencia final, finally y finalize en Java, detallando inmutabilidad, bloques de limpieza garantizados y la deprecacion de finalize en la JVM moderna."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-3-final-etc.webp
previewImage: /assets/images/ctci-13-3-final-etc.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Cual es la diferencia entre `final`, `finally` y `finalize` en Java?
> * **Diferencias Fundamentales:** (1) **`final` (Modificador)**: Aplicable a variables (hace inmutable el valor o la referencia), metodos (impide sobreescritura y facilita el inlining del compilador JIT) y clases (impide la herencia, ej. `String`); (2) **`finally` (Bloque de Control)**: Bloque adjunto a `try-catch` cuya ejecucion esta garantizada para liberar recursos; (3) **`finalize()` (Método del Recolector de Basura)**: Metodo heredado de `Object` ejecutado antes de destruir un objeto (**obsoleto desde Java 9 y eliminado en Java 18+** por causar pausas en el GC, bloqueos mutuos y problemas de seguridad; reemplazado por `AutoCloseable` y `Cleaner`).
> * **Realidad en Producción:** Clases inmutables en records de Java y liberacion determinista de memoria nativa.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 13.3), se nos plantea:

*"Explica las diferencias conceptuales, sintacticas y de ciclo de vida entre final, finally y finalize en Java."*

## 2. Comparativa Estructural

| Característica | `final` | `finally` | `finalize()` |
|---|---|---|---|
| **Tipo** | Modificador de acceso / Palabra clave | Bloque de control de flujo | Método en `java.lang.Object` |
| **Se Aplica A** | Variables, Métodos, Clases | Bloques `try-catch` | Objetos recolectados por el GC |
| **Garantía** | Inmutabilidad y restricción de herencia | Limpieza de recursos garantizada | **No garantizado ni determinista** |
| **Estado Actual** | Uso activo estándar | Uso activo estándar | **Deprecado y eliminado** |

## Implementación de Producción

```java
import java.lang.ref.Cleaner;

public final class SecurityToken {
    private final String token; // Referencia inmutable

    public SecurityToken(String token) {
        this.token = token;
    }

    public final String getToken() {
        return token;
    }
}

public class NativeBufferWrapper implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();

    private static class CleanAction implements Runnable {
        private long address;
        CleanAction(long addr) { this.address = addr; }
        @Override
        public void run() {
            if (address != 0) {
                System.out.println("Liberando memoria nativa: " + address);
                address = 0;
            }
        }
    }

    private final Cleaner.Cleanable cleanable;

    public NativeBufferWrapper(long address) {
        this.cleanable = CLEANER.register(this, new CleanAction(address));
    }

    @Override
    public void close() {
        cleanable.clean(); // Limpieza determinista inmediata
    }
}
```

## Razones de la Eliminación de `finalize()`

1. **Ejecución No Determinista:** No existe garantia de cuando se ejecutara `finalize()`.
2. **Pausas de Recolección de Basura:** Los objetos con finalizadores se promueven a colas especiales, retrasando la liberacion de memoria.
3. **Resurrección de Objetos:** Un atacante podia reasignar `this` a una variable estatica dentro de `finalize()`, reviviendo un objeto corrupto.

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Optimización JIT

1. **Inlining Monomórfico:** Marcar metodos como `final` permite al compilador HotSpot JIT evitar la consulta en la tabla de metodos virtuales e integrar el codigo directamente en ensamblador.
2. **Publicación Segura (JMM):** El Java Memory Model garantiza que los campos `final` son visibles inmediatamente para todos los hilos al finalizar el constructor sin requerir bloqueos de memoria.

## Casos Límite y Robustez en Producción

1. **Referencia Final vs Inmutabilidad de Objeto:** `final List<String> list` impide reasignar la lista, pero permite agregarle elementos (`list.add()`). Para inmutabilidad real se utiliza `List.of()`.
