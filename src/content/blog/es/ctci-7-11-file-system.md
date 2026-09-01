---
title: "Sistema de Archivos: Arquitectura Jerárquica de Archivos y Directorios en Memoria (CTCI 7.11)"
description: "Disena las estructuras de datos y algoritmos para un sistema de archivos jerarquico en memoria usando el patron Composite en tiempo O(D)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---

> **TL;DR**
> * **El Problema del Libro:** Explica las estructuras de datos y algoritmos que utilizarias para disenar un sistema de archivos en memoria. Ilustra con codigo.
> * **La Solución Óptima:** **Patrón de Diseño Composite**: (1) Clase abstracta `Entry` con nombre, directorio padre, marcas de tiempo y metodos abstractos `size()` y `getFullPath()`; (2) Subclase `File` que almacena `byte[] content`; (3) Subclase `Directory` que gestiona `List<Entry> contents`, calculando el tamano de forma recursiva; (4) Resolucion de rutas jerarquicas en tiempo $O(D)$ donde $D$ es la profundidad del arbol.
> * **Realidad en Producción:** Sistemas de archivos virtuales en Linux (`tmpfs` / `procfs`) y emulacion de carpetas en almacenamiento de objetos (Amazon S3).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.11), se nos plantea:

*"Explica las estructuras de datos y clases para disenar un sistema de archivos en memoria con soporte para directorios anidados y archivos de contenido binario."*

## 2. Arquitectura Orientada a Objetos (Patrón Composite)

1. **`Entry` (Clase Base Abstracta):** Atributos comunes (nombre, directorio padre, fechas) y firmas para `size()` y `getFullPath()`.
2. **`File` (Extiende `Entry`):** Nodo hoja que contiene datos binarios (`byte[] content`).
3. **`Directory` (Extiende `Entry`):** Nodo compuesto interior con lista de hijos (`List<Entry> contents`).

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class FileSystemDesign {
    public static abstract class Entry {
        protected Directory parent;
        protected long created;
        protected long lastUpdated;
        protected String name;

        public Entry(String n, Directory p) {
            this.name = n;
            this.parent = p;
            this.created = System.currentTimeMillis();
            this.lastUpdated = System.currentTimeMillis();
        }

        public boolean delete() {
            if (parent == null) return false;
            return parent.deleteEntry(this);
        }

        public abstract int size();

        public String getFullPath() {
            if (parent == null) return name;
            return parent.getFullPath() + "/" + name;
        }

        public String getName() { return name; }
    }

    public static class File extends Entry {
        private byte[] content;
        private int size;

        public File(String n, Directory p, int sz) {
            super(n, p);
            this.size = sz;
        }

        public int size() { return size; }
        public byte[] getContent() { return content; }
        public void setContent(byte[] c) {
            this.content = c;
            this.size = c == null ? 0 : c.length;
        }
    }

    public static class Directory extends Entry {
        protected List<Entry> contents = new ArrayList<>();

        public Directory(String n, Directory p) {
            super(n, p);
        }

        public int size() {
            int size = 0;
            for (Entry e : contents) {
                size += e.size();
            }
            return size;
        }

        public boolean deleteEntry(Entry entry) {
            return contents.remove(entry);
        }

        public void addEntry(Entry entry) {
            contents.add(entry);
        }

        public List<Entry> getContents() { return contents; }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| getFullPath() | `O(D)` | Recorre los ancestros hasta la raiz en profundidad $D$. |
| Directory size() | `O(N)` | Suma recursiva de todos los nodos descendientes. |
| Espacio Auxiliar | `O(N)` | Nodos en memoria proporcionales a archivos y carpetas $N$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: VFS en Linux

1. **Linux `tmpfs` y `procfs`:** Estructuras jerarquicas puramente en RAM que exponen informacion de procesos y estado del kernel como archivos virtuales.
2. **Prefijos en Amazon S3:** Emulacion de carpetas jerarquicas sobre un sistema plano de clave-valor.

## Casos Límite y Robustez en Producción

1. **Eliminación del Directorio Raíz:** Controlado de forma segura mediante `parent == null`.
