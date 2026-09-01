---
title: "Web Crawler: Preventing Infinite Loops in Distributed Crawlers (CTCI 9.3)"
description: "Design a distributed web crawler architecture that prevents infinite crawl loops and spider traps using URL normalization, Bloom filters, and SimHash near-duplicate detection."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-9-3-web-crawler.webp
previewImage: /assets/images/ctci-9-3-web-crawler.webp
---

> **TL;DR**
> * **The Book Problem:** If you were designing a web crawler, how would you avoid getting into infinite loops?
> * **The Optimal Solution:** Multi-Tier Loop & Trap Defense Pipeline: (1) **URL Normalization**: Canonicalize protocols, strip tracking parameters (`utm_*`, `sid`), sort query parameters, and resolve relative path traversals; (2) **Visited URL Registry**: Distributed in-memory Bloom filter backed by Cassandra/RocksDB; (3) **Content Fingerprinting (SimHash / MinHash)**: Detects dynamic URL spider traps serving identical or near-duplicate HTML content; (4) **Host-Level Throttling & Depth Budgeting**: Strict domain crawl depth ceilings ($d \le 15$) and domain-level rate limiting.
> * **Production Reality:** Googlebot crawler architecture, Apache Nutch, and Common Crawl infrastructure.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 9.3), we are asked:

*"If you were designing a web crawler, how would you avoid getting into infinite loops?"*

## 2. Spider Traps & Defense Mechanisms

### Types of Infinite Loops:
1. **Graph Cycles:** Page $A \to \text{Page } B \to \text{Page } A$.
2. **Infinite Path Trees:** Dynamic calendars (`/events?year=2026&month=13...`) and symlink directory nesting (`/a/b/a/b/a/b/...`).
3. **Session ID Mutation:** Identical pages served under distinct URLs (`/page?session_id=123`, `/page?session_id=456`).

### Defense Pipeline:
1. **URL Normalizer:** Converts URLs to canonical form (`https://example.com:80/dir/../page` $\to$ `http://example.com/page`).
2. **Distributed Visited Set:** Fast Bloom filter in RAM rejects 99.9% of seen URLs before hitting database.
3. **SimHash 64-bit Fingerprint:** Computes 64-bit locality-sensitive hash of parsed HTML text. If Hamming distance $\le 3$, drop page as near-duplicate.
4. **Domain Budgeting:** Bounded depth per domain with domain priority queues.

## Production Implementation

```java
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.Set;

public class WebCrawlerLoopGuard {
    private final Set<String> visitedCanonicalUrls = new HashSet<>();
    private final Set<Long> contentSimHashes = new HashSet<>();
    private final int MAX_PATH_DEPTH = 10;

    /**
     * Canonicalizes and normalizes a raw URL string.
     */
    public String normalizeUrl(String rawUrl) {
        try {
            URI uri = new URI(rawUrl.trim()).normalize();
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();
            
            // Remove trailing slashes
            if (path.endsWith("/") && path.length() > 1) {
                path = path.substring(0, path.length() - 1);
            }

            return uri.getScheme() + "://" + host + path;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    /**
     * Evaluates whether a URL should be crawled or rejected.
     */
    public boolean shouldCrawl(String url, int currentDepth) {
        if (currentDepth > MAX_PATH_DEPTH) return false;

        String canonical = normalizeUrl(url);
        if (canonical == null || visitedCanonicalUrls.contains(canonical)) {
            return false;
        }

        // Spider trap pattern detection: repeating subpath segments (/a/b/a/b/a/b)
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
                if (repeatCount >= 3) return true; // Repeating path trap
            }
        }
        return false;
    }

    /**
     * Checks if parsed page content is a near-duplicate of an already crawled page.
     */
    public boolean isDuplicateContent(long simHash64) {
        return !contentSimHashes.add(simHash64);
    }
}
```

## Complexity & Architecture Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| URL Deduplication | `O(1)` | In-memory Bloom filter lookup per discovered URL. |
| Near-Duplicate Check | `O(1)` | 64-bit SimHash table insertion. |
| Path Verification | `O(L)` | Tokenizing and inspecting URL path segments of length $L$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Googlebot Crawl Budget

1. **Host-Level Polite Queueing:** Crawlers maintain a dedicated Priority Queue per target domain host, strictly enforcing a minimum delay (e.g. 500ms) and a daily page limit (Crawl Budget).
2. **Dynamic Trap Detection:** If a domain yields $> 10,000$ unique URLs without increasing PageRank or novel content shingles, crawler heuristics automatically quarantine the domain's subtrees.

## Edge Cases & Production Hardening

1. **Circular Redirection Loops (HTTP 301/302):** Track redirect hop count, failing after max 5 hops.
2. **Malformed URI syntax:** Handled via `URISyntaxException` fallback filters.
