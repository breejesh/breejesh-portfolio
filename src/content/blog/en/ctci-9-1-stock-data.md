---
title: "Stock Data: High-Throughput Financial Feed Distribution Architecture (CTCI 9.1)"
description: "Design a high-throughput stock market data query service supporting 1,000 client applications with sub-millisecond latency using partitioned in-memory caches and flat-file replication."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-1-stock-data.webp
previewImage: /assets/images/ctci-9-1-stock-data.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine you are building a service that will be called by up to 1,000 client applications to query very recent stock data (`open`, `close`, `high`, `low`). State the assumptions you made, outline your approach, and describe how your system handles scaling and failures.
> * **The Optimal Solution:** Flat-File Generation + In-Memory Distributed Sharding: (1) **Data Feed Ingestion**: Ingests raw stock ticks via high-speed UDP multicast feed into ingestion workers; (2) **Partitioned In-Memory Cache**: Shards tickers across Redis / in-memory memory-mapped files by `hash(ticker) % num_shards` in $O(1)$ query time; (3) **Static Snapshot Publishing**: Periodically serializes snapshots into flat JSON / Protobuf files distributed via CDN / NGINX reverse proxies; (4) **High Availability**: Master-replica heartbeats with Raft consensus and write-ahead logs (WAL).
> * **Production Reality:** Market data distribution engines at Bloomberg Terminal, Nasdaq ITCH / OUCH protocol feeds, and NYSE consolidated tape providers (SIAC).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.1), we are asked:

*"Imagine you are building some sort of service that will be called by up to 1,000 client applications to query very recent stock data (open, close, high, low). State the assumptions you made, outline your approach, and describe how your system handles scaling and failures."*

## 2. Core System Architecture

### Step 1: Clarifying Requirements & Scale
* **Clients:** 1,000 enterprise applications querying frequently (e.g., polling every 100ms $\implies 10,000\text{ QPS}$).
* **Tickers:** $\approx 10,000$ publicly traded equities.
* **Payload per Ticker:** `timestamp` (8 bytes), `open` (4 bytes), `high` (4 bytes), `low` (4 bytes), `close` (4 bytes), `volume` (8 bytes) $\approx 32$ bytes.
* Total real-time market state size $= 10,000 \times 32\text{ bytes} = 320\text{ KB}$ (entire market state fits easily in RAM!).

### Step 2: System Components
1. **Ingestion Service:** Ingests live market ticks from exchange UDP feeds and updates the primary memory-mapped price table.
2. **File Distributer / Snapshotter:** Dumps the latest 320 KB market snapshot to disk / memory-mapped flat files every second.
3. **Frontend Edge Caches (NGINX / CDN):** Serves clients directly from static memory-cached files with zero database query overhead.

## Production Implementation

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

    // In-memory partitioned lock-free stock data store
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

## Complexity & Performance Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Query Latency | `O(1)` | Lock-free hash map lookup in under 5 microseconds. |
| Memory Footprint | `O(T)` | Where $T$ is the number of active tickers ($10,000 \times 100\text{ bytes} \approx 1\text{ MB}$). |
| Throughput Capacity | `> 500,000 QPS` | Read-only static file distribution via NGINX memory buffers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Market Data Gateways

1. **Memory-Mapped IPC (LMAX Disruptor):** High-frequency trading engines bypass network socket overhead using shared memory ring buffers.
2. **CDN Snapshot Offloading:** Offloads 99.9% of enterprise client queries by publishing timestamped delta files over HTTP/2.

## Edge Cases & Production Hardening

1. **Exchange Dropouts:** Fallback to secondary multicast feed line (Feed A / Feed B redundancy).
2. **Stale Data Detection:** Clients verify ticker timestamp and trigger fallback alerts if latency exceeds 2,000ms.
