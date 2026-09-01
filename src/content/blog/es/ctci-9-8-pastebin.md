---
title: "Pastebin: Arquitectura Escalable de Almacenamiento de Texto y Acortador de URLs (CTCI 9.8)"
description: "Disena un servicio escalable tipo Pastebin para compartir texto mediante codificacion Base62, almacenamiento de objetos S3 y servicio de generacion de claves."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-8-pastebin.webp
previewImage: /assets/images/ctci-9-8-pastebin.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un sistema como Pastebin, donde un usuario puede ingresar un texto y obtener una URL generada aleatoriamente para acceder a el.
> * **La Solución Óptima:** Almacenamiento de Objetos + Servicio de Generación de Claves (KGS): (1) Codificacion Base62 de 7 caracteres (`[a-zA-Z0-9]`) que proporciona $62^7 \approx 3,52\text{ billones}$ de combinaciones; (2) **Servicio KGS**: Pre-genera claves unicas en memoria eliminando colisiones y bloqueos en base de datos; (3) **Almacenamiento Híbrido**: Metadatos en Cassandra/DynamoDB y contenido de texto sin procesar en Amazon S3 / MinIO; (4) **Caché**: Pastes mas consultados cacheados en Redis con respuesta sub-milisegundo.
> * **Realidad en Producción:** Pastebin.com, GitHub Gist y acortadores de URL tipo Bitly.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.8), se nos plantea:

*"Disena un servicio escalable de almacenamiento de texto temporal y acortamiento de enlaces tipo Pastebin."*

## 2. Estimación de Escala

* **Escrituras:** 10 millones de pastes/dia ($\approx 115\text{ pastes/segundo}$).
* **Lecturas:** 100 millones de lecturas/dia (proporcion 10:1 lectura/escritura).
* **Tamano Promedio:** 10 KB por texto.
* **Almacenamiento:** $100\text{ GB/dia} \implies 36,5\text{ TB/ano}$.
* **Espacio de Claves:** $62^7 \approx 3,52 \times 10^{12}$ slugs unicos.

## Implementación de Producción

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class PastebinService {
    private static final String BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static class PasteMetadata {
        public final String slug;
        public final String content;
        public final long createdAt;
        public final long expiresAt;

        public PasteMetadata(String slug, String content, long ttlSeconds) {
            this.slug = slug;
            this.content = content;
            this.createdAt = System.currentTimeMillis();
            this.expiresAt = ttlSeconds > 0 ? this.createdAt + (ttlSeconds * 1000) : Long.MAX_VALUE;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private final AtomicLong counter = new AtomicLong(10000000000L);
    private final ConcurrentHashMap<String, PasteMetadata> pasteStorage = new ConcurrentHashMap<>();

    public String encodeBase62(long num) {
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            sb.append(BASE62.charAt((int) (num % 62)));
            num /= 62;
        }
        return sb.reverse().toString();
    }

    public String createPaste(String content, long ttlSeconds) {
        long id = counter.incrementAndGet();
        String slug = encodeBase62(id);
        PasteMetadata meta = new PasteMetadata(slug, content, ttlSeconds);
        pasteStorage.put(slug, meta);
        return slug;
    }

    public String getPaste(String slug) {
        PasteMetadata meta = pasteStorage.get(slug);
        if (meta == null || meta.isExpired()) {
            pasteStorage.remove(slug);
            return null;
        }
        return meta.content;
    }
}
```

## Análisis de Complejidad y Arquitectura

| Operación | Complejidad | Detalle Técnico |
|---|---|---|
| Crear Paste | `O(1)` | Incremento atomico + codificacion Base62 + escritura en S3. |
| Obtener Paste | `O(1)` | Lectura directa en Redis o NoSQL. |
| Probabilidad de Colisión | `0%` | Garantizada por asignacion secuencial centralizada en KGS. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Servicio de Generación de Claves (KGS)

1. **Colas de Claves Precalculadas:** Un cluster KGS genera claves Base62 en segundo plano. Al recibir un nuevo paste, se extrae una clave directamente de memoria sin competir por bloqueos en bases de datos.
2. **Políticas de Ciclo de Vida en S3:** Eliminacion automatica de objetos expirados sin necesidad de ejecucion de consultas de borrado en la base de datos principal.

## Casos Límite y Robustez en Producción

1. **Límites de Tamaño:** Restriccion de pastes a un maximo de 10 MB por peticion.
2. **Protección contra Abuso:** Limitacion de tasa mediante algoritmo de cubeta de tokens (Token Bucket).
