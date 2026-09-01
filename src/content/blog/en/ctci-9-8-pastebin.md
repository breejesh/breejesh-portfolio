---
title: "Pastebin: Scalable Text Storage and URL Shortening Architecture (CTCI 9.8)"
description: "Design a scalable Pastebin text sharing and URL shortener service supporting millions of daily pastes using Base62 encoding, object storage, and Key Generation Services."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-8-pastebin.webp
previewImage: /assets/images/ctci-9-8-pastebin.webp
---

> **TL;DR**
> * **The Book Problem:** Design a system like Pastebin, where a user can enter a piece of text and get a randomly generated URL to access it.
> * **The Optimal Solution:** Decoupled Object Storage + Key Generation Service (KGS): (1) **Key Encoding**: 7-character Base62 (`[a-zA-Z0-9]`) string yielding $62^7 \approx 3.52\text{ trillion}$ unique URLs; (2) **Key Generation Service (KGS)**: Standalone worker pre-generating unique keys into an in-memory ring buffer (eliminating race conditions and duplicate DB writes); (3) **Hybrid Storage**: Metadata stored in Cassandra/DynamoDB (`slug`, `created_at`, `expiration`, `s3_key`) while raw text blobs are persisted in Amazon S3 / MinIO; (4) **Caching**: Top 20% viral pastes cached in Redis with sub-millisecond retrieval.
> * **Production Reality:** Pastebin.com, GitHub Gist architecture, and Bitly / TinyURL shortener infrastructure.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.8), we are asked:

*"Design a system like Pastebin, where a user can enter a piece of text and get a randomly generated URL to access it."*

## 2. Scale & Capacity Estimation

* **Writes:** 10 million pastes/day ($\approx 115\text{ pastes/second}$).
* **Reads:** 100 million reads/day ($\approx 1,150\text{ reads/second}$, a 10:1 read-heavy system).
* **Average Paste Size:** 10 KB.
* **Storage per Day:** $10\text{M} \times 10\text{ KB} = 100\text{ GB/day} \implies 36.5\text{ TB/year}$.
* **Key Space:** $62^7 = 3.52 \times 10^{12}$ unique 7-character alphanumeric slugs.

## 3. High-Level System Architecture

```
[Client] ──> [Load Balancer] ──> [Paste Application Server]
                                    │               │
                 ┌──────────────────┴──┐         ┌──┴──────────────────┐
                 ▼                     ▼         ▼                     ▼
          [Key Generation]      [Redis Cache]  [NoSQL Metadata]   [Amazon S3]
            Service (KGS)        (Top Pastes)    (Cassandra)     (Raw Content)
```

## Production Implementation

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

    /**
     * Converts a 64-bit sequence counter into a 7-character Base62 alphanumeric string.
     */
    public String encodeBase62(long num) {
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            sb.append(BASE62.charAt((int) (num % 62)));
            num /= 62;
        }
        return sb.reverse().toString();
    }

    /**
     * Creates a new paste and returns its unique URL slug.
     */
    public String createPaste(String content, long ttlSeconds) {
        long id = counter.incrementAndGet();
        String slug = encodeBase62(id);
        PasteMetadata meta = new PasteMetadata(slug, content, ttlSeconds);
        pasteStorage.put(slug, meta);
        return slug;
    }

    /**
     * Retrieves an active paste by its slug, returning null if expired or missing.
     */
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

## Complexity & Architecture Analysis

| Operation | Complexity | Technical Detail |
|---|---|---|
| Create Paste | `O(1)` | Atomic counter increment + Base62 string encoding + S3 write. |
| Get Paste (Cache Hit) | `O(1)` | Redis memory lookup in under 1 millisecond. |
| Key Collision Probability | `0%` | Guaranteed zero collisions via centralized sequence/KGS allocator. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Key Generation Service (KGS)

1. **Pre-Generated Key Buffer:** A dedicated KGS cluster continuously computes Base62 keys in the background, storing unused keys in a memory queue. When a paste request arrives, a key is popped in $O(1)$ time with zero database lock contention.
2. **Automated S3 Lifecycle Cleanup:** S3 bucket lifecycle rules automatically purge expired paste objects after their expiration timestamp, offloading database delete overhead.

## Edge Cases & Production Hardening

1. **Custom Slugs:** Checked against reserved routes (`/api`, `/admin`, `/login`) and verified for uniqueness before insertion.
2. **Abuse & Rate Limiting:** Enforces maximum paste size (e.g. 10 MB) and token bucket rate limits per client IP.
