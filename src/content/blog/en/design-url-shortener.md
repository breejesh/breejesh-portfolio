---
title: "Design a URL Shortener: Encoding, Storage, Cache, Redirects, and Scale"
description: "A production-grade URL shortener design: capacity math, block-leased IDs with Feistel scrambling, Base62 codes, a cache-first redirect path, 301 vs 302 trade-offs, async click analytics, abuse controls and the failure modes that actually page you."
date: "2026-04-02"
tags: [System Design & Architecture]
coverImage: /assets/images/design-url-shortener.webp
previewImage: /assets/images/design-url-shortener.webp
---

> **TL;DR**
> * **The Problem:** A shortener is two paths with wildly different shapes: a rare, write-heavy create path and a read path that can be 100x hotter, latency-sensitive, and the only thing users actually notice.
> * **The Design:** Mint IDs from leased 1M-ID blocks, scramble them with a Feistel network, encode to 7 Base62 characters, store `code -> url` in a store sharded by code, and serve redirects from CDN and Redis with the database as a miss path. Click analytics leave the hot path through a queue.
> * **The Result:** One database write per million links for ID allocation, a redirect p99 under 20 ms at the edge, analytics that can lag or drop without ever slowing a redirect, and a clear story for every failure mode.

Every system design interview list has a URL shortener near the top, and most write-ups treat it as a warm-up. It is not. It is one of the cleanest examples of a system where **the read path and the write path deserve different architectures**, and where small decisions (which redirect status code, where a counter lives) decide whether the system survives a link going viral.

This post designs it the way I would for production, then calls out what changes in an interview.

---

## Requirements and the Numbers That Shape Them

**Functional**

1. `POST /links` takes a long URL and returns a short one. Optional custom alias and expiry.
2. `GET /{code}` redirects to the long URL, or returns 404 if the code is unknown, expired or taken down.
3. Owners can see click counts. Approximate and slightly delayed is acceptable.

**Non-functional**

* Redirects must be fast and highly available. A broken short link is visible to everyone who clicks it.
* Once a create call returns `201`, the mapping must never be lost. The user has already pasted the link somewhere.
* Codes should not be trivially enumerable.

**Back-of-the-envelope**

| Assumption | Value | Derived |
| --- | --- | --- |
| New links per month | 100M | ~40 writes/s average, ~400/s at a 10x peak |
| Read:write ratio | 100:1 | ~4,000 redirects/s average, ~40,000/s peak |
| Row size (code, URL, owner, timestamps, flags) | ~500 bytes | ~50 GB/month, ~3 TB over 5 years |
| Hot set | ~20% of links get ~80% of clicks | A few GB of `code -> url` fits easily in Redis |
| Code space at 7 Base62 chars | 62^7 ≈ 3.5 trillion | ~2,900 years of headroom at 100M/month |

Two things fall out of this table immediately. Storage is not the hard part: 3 TB is a modest database. And the redirect path is a caching problem far more than a database problem.

---

## The Architecture

![URL shortener high-level architecture: clicker and creator clients, CDN edge and API gateway, redirect and create services, Redis cache, sharded mappings database, click event queue and analytics rollups](/assets/images/hld/design-url-shortener-architecture.webp)

Walk it left to right.

* **Clicker / Creator.** Two very different clients. Clickers are anonymous, global and impatient. Creators are authenticated users or API integrations, far fewer of them.
* **CDN Edge.** Terminates TLS close to the user and can cache redirect responses for popular codes. For a viral link, most clicks should never reach your origin.
* **API Gateway.** Authenticates creators, enforces per-user and per-IP rate limits on creation, and rejects oversized or malformed payloads before they cost anything.
* **Redirect Service.** A tiny stateless service with one job: resolve a code and return a redirect. It reads Redis first, falls back to the mappings database on a miss, and fires a click event without waiting for it.
* **Create API.** Validates the URL (scheme allowlist, length cap, blocklist check), takes the next ID from its leased block, encodes it, and inserts the mapping.
* **ID Range Allocator.** Hands out blocks of one million IDs to Create API pods. It is touched once per million links, so it can be a single row in a boring relational database.
* **Redis (`code -> url`).** The hot cache. Entries carry a TTL, and "not found" results are cached briefly so scanners cannot hammer the database.
* **Mappings DB.** The source of truth, sharded by code. Every redirect lookup is a primary-key read on `code`, which is the one access pattern this system must make cheap.
* **Click Events, Rollup Workers, Click Counts.** Redirects emit events to a log (Kafka, Kinesis or similar). Workers aggregate them into per-link, per-day counts in an OLAP store. If this whole box catches fire, redirects keep working.

The green note on the diagram is the contract: under 20 ms p99 at the edge, under 50 ms when the request has to go to Redis or the database.

---

## Minting Codes: Leased Blocks, a Feistel Scramble, Then Base62

There are three common ways to produce a short code:

| Approach | How it works | Strength | Weakness |
| --- | --- | --- | --- |
| Hash the URL | SHA-256 the URL, take the first 40 bits, Base62 it | Same URL can map to the same code | Collisions need retries; two users sharing one code mixes ownership and analytics |
| Random code | 7 random Base62 characters, insert with a unique constraint | Unguessable | Retry on collision; every create is a uniqueness check against the full table |
| Counter + encode | Unique integer, then Base62 | No collisions, no retries | Sequential codes are enumerable unless you scramble them |

I prefer the counter, with two refinements.

![ID allocation: a block counter leases million-ID ranges to create pods, IDs pass through a Feistel scramble and Base62 encoding to produce a 7-character code](/assets/images/hld/design-url-shortener-id-blocks.webp)

**Leased blocks.** A single global counter would be a hot row. Instead, each Create API pod leases a block of one million IDs (`UPDATE counter SET next = next + 1000000 RETURNING next`) and hands them out from memory. That is one database write per million links. If a pod crashes, the rest of its block is simply never used. Gaps are fine; duplicates are not.

**Feistel scramble.** Sequential IDs produce sequential codes, which makes enumerating every link trivial. A Feistel network is a keyed, reversible permutation over a fixed bit width: every 40-bit input maps to exactly one 40-bit output, so uniqueness is preserved, but neighbors stop looking like neighbors. This is not cryptographic secrecy. It is cheap obfuscation that removes the easiest scraping attack.

**Base62.** `0-9a-zA-Z` is URL-safe without escaping. A 40-bit space (about 1.1 trillion IDs, roughly 900 years at 100M links a month) fits in 7 Base62 characters, since 62^7 is about 3.5 trillion. A 42-bit space would not: 2^42 is about 4.4 trillion, and the top quarter of it would spill into 8 characters.

```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
HALF_BITS, MASK = 20, (1 << 20) - 1  # 40-bit permutation, always < 62**7

def feistel(n: int, keys=(0x5bd1e, 0x1b873, 0x2f1d3)) -> int:
    left, right = n >> HALF_BITS, n & MASK
    for k in keys:
        left, right = right, left ^ (((right * 0x9E3779B1) ^ k) & MASK)
    return (left << HALF_BITS) | right

def encode(n: int, width: int = 7) -> str:
    out = []
    while n:
        n, r = divmod(n, 62)
        out.append(ALPHABET[r])
    return "".join(reversed(out)).rjust(width, "0")

code = encode(feistel(8_000_123))  # 7 chars, unique per ID
```

**Custom aliases** go into the same `code` column with the same unique constraint, after a reserved-word check (`api`, `admin`, `login`, `health`) and a profanity and impersonation filter.

---

## Storage

The schema is deliberately boring:

| Column | Type | Notes |
| --- | --- | --- |
| `code` | `varchar(16)` primary key | Partition key; every redirect is a point read on it |
| `long_url` | `text` | Validated at create time, never rewritten at read time |
| `owner_id` | `bigint` | Secondary index for "my links" dashboards |
| `created_at`, `expires_at` | timestamps | `expires_at` null means forever |
| `status` | enum: active, disabled, taken_down | Lets you kill a link without deleting history |

**SQL or key-value?** Either works. A managed key-value store (DynamoDB, Cassandra, Bigtable) makes the point-read path trivially scalable and has native TTL for expiring links. Postgres with hash-partitioning by `code` is perfectly adequate to several terabytes and gives you transactions for the allocator and owner queries for free. The wrong choice is anything that makes `GET by code` more than one round trip.

**Shard by code, not by owner.** Sharding by owner would put a celebrity's links on one hot shard. Sharding by a hash of the code spreads load evenly, and the owner dashboard can use a secondary index or a separate table.

**Never put counters on the mapping row.** `UPDATE links SET clicks = clicks + 1` on every redirect turns your hottest read into a contended write on a single row. A viral link will melt that row. Counts belong in the analytics pipeline.

---

## The Redirect Path, Precisely

1. CDN checks its cache. Hit: return the cached redirect. Done.
2. Redirect Service checks Redis. Hit: respond.
3. Miss: read the mappings DB by primary key. If the row is missing, expired or not active, cache a short-lived "not found" and return 404. Otherwise populate Redis and respond.
4. Fire a click event to the log asynchronously. If the log is slow, drop the event. Never block the redirect.

**Which status code?** This decision has real consequences:

| Status | Semantics (RFC 9110) | Caching | Use it when |
| --- | --- | --- | --- |
| 301 Moved Permanently | Permanent | Browsers and proxies cache aggressively | You want minimum origin load and do not need accurate click counts |
| 302 Found | Temporary | Not cached by default | You need every click to reach you for analytics, or links can change |
| 307 / 308 | Temporary / permanent, method preserved | As above | Rare for shorteners; matters if non-GET requests are redirected |

My default is **302 with a short explicit `Cache-Control: max-age`** on the CDN (say 60 to 300 seconds). Popular links are served from the edge, analytics stay roughly honest (count CDN logs too), and a takedown propagates within minutes rather than living forever in someone's browser cache.

**Cache stampede.** When a cold link suddenly goes viral, thousands of concurrent misses can hit the database for the same key. Use request coalescing (one fetch, many waiters) in the Redirect Service or a short lock in Redis.

---

## Abuse Is a Core Feature, Not an Add-On

A shortener lends your domain's reputation to whatever URL someone pastes in. That makes it a phishing tool unless you design against it.

* **Check destinations at create time** against a reputation feed such as Google Safe Browsing, and re-scan popular links periodically, because destinations change after creation.
* **Rate limit creation** per account, per IP and per destination domain.
* **Provide a preview page** (`sho.rt/aB3xY9q+` in Bitly's convention) so cautious users can see the destination before visiting it.
* **Make takedown fast:** set `status = taken_down`, delete the Redis key, purge the CDN path. With a 302 and short edge TTL, that is minutes, not days.
* **Rate limit redirects per IP** to slow down enumeration, even with scrambled codes.

---

## Failure Modes and What Should Happen

| Failure | Expected behavior |
| --- | --- |
| Redis down | Redirects fall through to the DB. Latency rises, correctness holds. Shed load at the edge if the DB nears capacity |
| One DB shard down | Codes on that shard fail; everything else works. Replicas should take over in seconds |
| Click log unavailable | Redirects continue; events are dropped or buffered locally. Counts will under-report for the window |
| ID allocator unavailable | Pods keep minting from their current block. With 1M-ID blocks, that is hours of runway |
| Bad deploy of Redirect Service | Blast radius is every link. Canary on a small traffic slice and keep the service tiny so rollbacks are fast |
| A link goes viral | CDN absorbs most of it; request coalescing protects the DB from the first miss storm |

---

## What Changes in an Interview

You will not have time for Feistel networks and CDN TTL tuning in 45 minutes. Prioritize:

1. State the read:write ratio and the capacity math in two sentences.
2. Draw the two paths separately.
3. Pick counter plus Base62, and mention enumeration and the scramble fix.
4. Explain why click counters do not live on the mapping row.
5. Have an opinion on 301 vs 302.

That is enough to show judgment. The rest is a conversation.

---

## Production Checklist

- [ ] Capacity math written down, with read:write ratio and peak multiplier
- [ ] IDs leased in blocks; allocator survives restarts; gaps documented as acceptable
- [ ] Codes scrambled before encoding; custom aliases share the unique constraint
- [ ] URL scheme allowlist, length cap and reputation check at create time
- [ ] Redirect path: CDN, then Redis with TTL and negative caching, then DB by primary key
- [ ] Request coalescing for cold-key stampedes
- [ ] 302 plus short edge TTL, or a written reason for 301
- [ ] Click events async, droppable, and never on the mapping row
- [ ] Takedown clears DB status, Redis and CDN in one operation
- [ ] Dashboards: redirect p99, cache hit ratio, 404 rate, create rate per account

---

## The Leftover

The interesting part of this system is not the encoding trick. It is the discipline of keeping the redirect path boring. Every feature request (real-time counts, A/B destinations, geo-routing) will try to move logic into it.

Say no to most of them. The link someone pasted into a group chat three years ago should still work tomorrow morning, before your coffee and before anyone remembers that it exists.

---

## Sources

* [RFC 9110: HTTP Semantics, Section 15.4 (Redirection 3xx)](https://www.rfc-editor.org/rfc/rfc9110#section-15.4)
* [Google Safe Browsing API](https://developers.google.com/safe-browsing)
* [Amazon DynamoDB: Time to Live](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
* [Luby and Rackoff, "How to Construct Pseudorandom Permutations from Pseudorandom Functions" (Feistel networks)](https://doi.org/10.1137/0217022)
* Related in this series: [Design a Unique ID Generator](/blog/en/design-unique-id-generator), [Design a Rate Limiter](/blog/en/design-a-rate-limiter), [Back-of-the-Envelope Estimation](/blog/en/design-back-of-envelope-estimation)
