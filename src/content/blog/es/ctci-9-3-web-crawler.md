---
title: "Rastreador Web: Prevención de Bucles Infinitos en Crawlers Distribuidos (CTCI 9.3)"
description: "Disena la arquitectura de un rastreador web distribuido que previene bucles infinitos y trampas para spiders mediante filtros de Bloom y SimHash."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-3-web-crawler.webp
previewImage: /assets/images/ctci-9-3-web-crawler.webp
---

> **TL;DR**
> * **El Problema del Libro:** Si estuvieras disenando un rastreador web (web crawler), ¿como evitarias caer en bucles infinitos?
> * **La Solución Óptima:** Canalización Defensiva Multinivel: (1) **Normalización Canónica de URLs**: Elimina parametros de seguimiento (`utm_*`, `sid`), ordena query strings y normaliza rutas; (2) **Registro de URLs Visitadas**: Filtro de Bloom distribuido en RAM respaldado por base de datos; (3) **Detección de Contenido Casi Duplicado (SimHash)**: Identifica trampas dinamicas con URLs distintas pero contenido identico; (4) **Presupuesto de Rastreo y Límite de Profundidad**: Tope de profundidad por dominio ($d \le 15$) y control de tasa de peticiones.
> * **Realidad en Producción:** Arquitectura de Googlebot y Apache Nutch.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.3), se nos plantea:

*"Explica como evitar bucles infinitos y trampas para spiders en el diseno de un rastreador web distribuido."*

## 2. Trampas para Spiders y Mecanismos de Defensa

### Causas de Bucles Infinitos
1. **Ciclos en el Grafo:** $A \to B \to A$.
2. **Árboles de Rutas Infinitas:** Calendarios dinamicos (`/eventos?ano=2026&mes=13...`) o enlaces simbolicos anidados (`/dir/dir/dir/...`).
3. **Parámetros de Sesión:** URLs con identificadores efimeros que apuntan a la misma pagina.

### Mecanismos de Protección
1. **Normalizador Canónico:** Convierte URLs equivalentes a una representacion estandar.
2. **Filtro de Bloom:** Rechaza de inmediato URLs ya visitadas.
3. **Huellas Digitales SimHash:** Calcula un hash de 64 bits del contenido de texto para descartar paginas casi identicas.
4. **Límite de Profundidad:** Limita el numero de niveles por dominio.

## Implementación de Producción

```java
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.Set;

public class WebCrawlerLoopGuard {
    private final Set<String> visitedCanonicalUrls = new HashSet<>();
    private final Set<Long> contentSimHashes = new HashSet<>();
    private final int MAX_PATH_DEPTH = 10;

    public String normalizeUrl(String rawUrl) {
        try {
            URI uri = new URI(rawUrl.trim()).normalize();
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();
            
            if (path.endsWith("/") && path.length() > 1) {
                path = path.substring(0, path.length() - 1);
            }

            return uri.getScheme() + "://" + host + path;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    public boolean shouldCrawl(String url, int currentDepth) {
        if (currentDepth > MAX_PATH_DEPTH) return false;

        String canonical = normalizeUrl(url);
        if (canonical == null || visitedCanonicalUrls.contains(canonical)) {
            return false;
        }

        if (hasRepeatingPathSegments(canonical)) {
            return false;
        }

        visitedCanonicalUrls.add(canonical);
        return true;
    }

    private boolean hasRepeatingPathSegments(String url) {
        String[] segments = url.split("/");
        Set<String> seenSegments = new HashSet<>();
        int repeatCount = 0;
        for (String segment : segments) {
            if (!segment.isEmpty() && !seenSegments.add(segment)) {
                repeatCount++;
                if (repeatCount >= 3) return true;
            }
        }
        return false;
    }

    public boolean isDuplicateContent(long simHash64) {
        return !contentSimHashes.add(simHash64);
    }
}
```

## Análisis de Complejidad y Arquitectura

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Deduplicación de URL | `O(1)` | Consulta en filtro de Bloom en memoria. |
| Detección de Contenido | `O(1)` | Comprobación de colisión en tabla SimHash. |
| Validación de Ruta | `O(L)` | Segmentación de la cadena de URL de longitud $L$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Crawl Budget de Googlebot

1. **Colas de Cortesía por Dominio:** Cada dominio posee una cola de prioridad independiente con pausas obligatorias (ej. 500 ms) para no sobrecargar el servidor de destino.
2. **Detección Automática de Trampas:** Si un subdominio genera miles de URLs sin contenido nuevo, los sistemas heuristicos lo ponen en cuarentena.

## Casos Límite y Robustez en Producción

1. **Redirecciones Circulares (HTTP 301/302):** Contador de saltos limitado a 5.
2. **Sintaxis Malformada:** Filtros de proteccion contra errores de parseo.
