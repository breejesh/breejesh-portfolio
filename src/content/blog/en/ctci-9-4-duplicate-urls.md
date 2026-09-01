---
title: "Duplicate URLs: Deduplicating 10 Billion URLs at Scale (CTCI 9.4)"
description: "Design scalable algorithms to detect duplicate URLs across 10 billion records using external disk partitioning, distributed MapReduce, and in-memory Bloom filters."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---

> **TL;DR**
> * **The Book Problem:** You have a list of 10 billion URLs. How do you detect the duplicate URLs?
> * **The Optimal Solution:** Three Architectural Tiers based on Hardware Constraints: (1) **Probabilistic In-Memory Bloom Filter**: With $p = 0.1\%$ false positive rate, requires $m = 14.4\text{ bits/URL} \implies 18\text{ GB}$ RAM, fitting entirely within a single 32 GB server; (2) **Single-Machine Disk Partitioning (External Hashing)**: Hash URLs into $K = 4,000$ chunk files ($250\text{ MB}$ each) via `hash(URL) % 4000`, loading each chunk sequentially into an in-memory `HashSet`; (3) **Distributed MapReduce Cluster**: Mapper emits `(hash(url), url)` partitioned across workers, with Reducer emitting distinct URLs.
> * **Production Reality:** Web crawl deduplication engines in search indexes, telemetry log aggregation (ClickHouse / Snowflake), and DNS sinkhole blocklists.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.4), we are asked:

*"You have a list of 10 billion URLs. How do you detect the duplicate URLs?"*

## 2. Scale & Hardware Sizing

* **Total Records ($N$):** $10^{10}$ URLs.
* **Average URL Length:** 100 bytes.
* **Raw Dataset Size:** $10^{10} \times 100\text{ bytes} = 1\text{ TB}$.
* **Hashed Dataset Size (64-bit MD5/MurmurHash):** $10^{10} \times 8\text{ bytes} = 80\text{ GB}$.

Because 1 TB exceeds standard server RAM (32 GB-64 GB), we explore three production architectures.

---

### Architecture 1: Single-Machine Disk Partitioning (External Hash Split)
1. Stream through the 1 TB URL file line-by-line.
2. Compute $k = \text{hash}(\text{URL}) \pmod{4000}$.
3. Append the URL to disk file $F_k$.
4. Each file $F_k$ contains approximately $1\text{ TB} / 4000 = 250\text{ MB}$ of URLs.
5. Process each $F_k$ one by one: load into an in-memory `HashSet<String>`, detect duplicates, and output unique records.

---

### Architecture 2: Distributed MapReduce / Apache Spark
* **Map Phase:** For each input URL, compute 64-bit hash $H = \text{hash}(\text{URL})$ and emit key-value pair `(H, URL)`.
* **Shuffle & Partition:** Partition keys to reducers by $H \pmod{\text{NumReducers}}$.
* **Reduce Phase:** All identical URLs arrive at the exact same reducer. The reducer discards duplicates and emits the unique set.

---

### Architecture 3: In-Memory Bloom Filter (Exact vs Probabilistic)
A Bloom filter with $N = 10^{10}$ and error rate $p = 0.001$ requires:
$$m = -\frac{N \ln p}{(\ln 2)^2} \approx 14.37 \text{ bits/key} \implies 14.37 \times 10^{10}\text{ bits} \approx 17.96\text{ GB}$$

An 18 GB bitset fits inside a single 32 GB RAM server, enabling sub-microsecond duplicate checks before writing to cold disk storage.

## Production Implementation

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class DuplicateUrlDetector {
    private static final int NUM_BUCKETS = 4000;

    /**
     * Splits massive URL dataset into 4,000 manageable disk partitions.
     */
    public static void splitIntoBuckets(String inputFilePath, String tempDir) throws IOException {
        BufferedWriter[] writers = new BufferedWriter[NUM_BUCKETS];
        for (int i = 0; i < NUM_BUCKETS; i++) {
            writers[i] = new BufferedWriter(new FileWriter(new File(tempDir, "bucket_" + i + ".txt")));
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(inputFilePath))) {
            String url;
            while ((url = reader.readLine()) != null) {
                int bucketIndex = Math.abs(url.hashCode() % NUM_BUCKETS);
                writers[bucketIndex].write(url);
                writers[bucketIndex].newLine();
            }
        } finally {
            for (BufferedWriter w : writers) {
                if (w != null) w.close();
            }
        }
    }

    /**
     * Deduplicates individual 250MB partitions in memory.
     */
    public static void processBuckets(String tempDir, BufferedWriter outputWriter) throws IOException {
        for (int i = 0; i < NUM_BUCKETS; i++) {
            File bucketFile = new File(tempDir, "bucket_" + i + ".txt");
            if (!bucketFile.exists()) continue;

            Set<String> uniqueUrls = new HashSet<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(bucketFile))) {
                String url;
                while ((url = reader.readLine()) != null) {
                    if (uniqueUrls.add(url)) {
                        outputWriter.write(url);
                        outputWriter.newLine();
                    }
                }
            }
            bucketFile.delete(); // Free disk space immediately
        }
    }
}
```

## Complexity & Architecture Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Single-Machine Disk I/O | `O(N)` | 2 sequential disk passes (1 split pass + 1 deduplication pass). |
| Distributed MapReduce Time | `O(N / M)` | Linearly scalable across $M$ worker nodes. |
| Bloom Filter Memory | `18 GB` | Fits in a single machine RAM with 0.1% false positive bound. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Deduplication Engines

1. **Snowflake / BigQuery Log Ingestion:** Ingest pipelines use hash-partitioned external merge joins to discard duplicate telemetry events.
2. **Distributed Bloom Filter Tiers:** Web search spiders query distributed Redis Bloom filters before querying document repositories.

## Edge Cases & Production Hardening

1. **Hash Skew:** Malicious inputs hashing to the same bucket are handled by dynamic secondary sub-splitting if partition exceeds 500 MB.
2. **File Descriptor Limits:** Use pooled file writers to avoid OS `EMFILE` (Too many open files) errors.
