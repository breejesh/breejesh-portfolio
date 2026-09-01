---
title: "Datos Bursátiles: Arquitectura de Distribución de Cotizaciones Financieras (CTCI 9.1)"
description: "Disena un servicio de consulta de datos bursatiles para 1.000 aplicaciones clientes con latencia submilisecondo usando memoria compartida y archivos planos."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-1-stock-data.webp
previewImage: /assets/images/ctci-9-1-stock-data.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina que estas construyendo un servicio que sera consumido por hasta 1.000 aplicaciones clientes para consultar datos bursatiles recientes (`open`, `close`, `high`, `low`). Establece suposiciones, describe tu enfoque y explica como escala y maneja fallos.
> * **La Solución Óptima:** Caché en Memoria Particionada + Publicación de Archivos Planos: (1) Ingestion mediante feeds UDP multicast hacia workers; (2) Almacenamiento en RAM sin bloqueos (`ConcurrentHashMap`); (3) Publicacion periodica de instantaneas estaticas en archivos planos servidos por NGINX / CDN; (4) Alta disponibilidad mediante redundancia de feeds (Feed A / Feed B).
> * **Realidad en Producción:** Sistemas de difusion de mercado en Bloomberg Terminal y protocolos Nasdaq ITCH / OUCH.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.1), se nos plantea:

*"Disena un servicio de consulta de cotizaciones bursatiles para 1.000 aplicaciones empresariales clientes optimizado para latencia y escalabilidad."*

## 2. Arquitectura del Sistema

### Supuestos de Escala
* **Clientes:** 1.000 aplicaciones con consultas continuas ($\approx 10.000\text{ QPS}$).
* **Acciones:** $\approx 10.000$ simbolos bursatiles activos.
* **Tamano en Memoria:** $10.000 \times 32\text{ bytes} \approx 320\text{ KB}$ (cabe integramente en la memoria RAM).

### Componentes Clave
1. **Ingestor de Feeds:** Recibe eventos de precios y actualiza la tabla en memoria.
2. **Generador de Instantáneas:** Guarda archivos JSON / Protobuf estaticos cada segundo.
3. **Servidores Web / CDN:** Distribuyen los archivos estaticos directamente a los clientes sin consultar bases de datos.

## Implementación de Producción

```java
import java.util.concurrent.ConcurrentHashMap;

public class StockDataService {
    public static class StockQuote {
        public final String ticker;
        public final double open;
        public final double high;
        public final double low;
        public final double current;
        public final long volume;
        public final long timestamp;

        public StockQuote(String ticker, double open, double high, double low, double current, long volume) {
            this.ticker = ticker;
            this.open = open;
            this.high = high;
            this.low = low;
            this.current = current;
            this.volume = volume;
            this.timestamp = System.currentTimeMillis();
        }
    }

    private final ConcurrentHashMap<String, StockQuote> priceCache = new ConcurrentHashMap<>(16384);

    public void updatePrice(String ticker, double price, long volumeDelta) {
        priceCache.compute(ticker, (k, old) -> {
            if (old == null) {
                return new StockQuote(ticker, price, price, price, price, volumeDelta);
            }
            double newHigh = Math.max(old.high, price);
            double newLow = Math.min(old.low, price);
            return new StockQuote(ticker, old.open, newHigh, newLow, price, old.volume + volumeDelta);
        });
    }

    public StockQuote getLatestQuote(String ticker) {
        return priceCache.get(ticker);
    }
}
```

## Análisis de Complejidad y Rendimiento

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Latencia de Consulta | `O(1)` | Lectura concurrente en memoria en menos de 5 microsegundos. |
| Consumo de Memoria | `O(T)` | Menos de 1 MB para 10.000 cotizaciones activas. |
| Rendimiento de Red | `> 500.000 QPS` | Servido directamente desde buffers estaticos en NGINX. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Feeds de Mercado

1. **Memoria Compartida y Ring Buffers (LMAX Disruptor):** Los motores de alta frecuencia leen cotizaciones directamente en memoria compartida sin sobrecarga TCP.
2. **Descarga en CDN:** Evita cuellos de botella en backend al cachear instantaneas estaticas con HTTP/2.

## Casos Límite y Robustez en Producción

1. **Pérdida de Conexión del Feed:** Conmutacion automatica a la linea de respaldo B.
2. **Detección de Datos Obsoletos:** Validacion de marcas de tiempo en el cliente.
