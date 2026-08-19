---
title: "Design a URL Shortener: Encoding, Storage, Cache, Redirects, and Scale"
description: "URL shortener system design explained for beginners: coat-check codes, create and redirect walk-throughs, Base62 encoding, storage, cache, and how to scale step by step."
date: "2026-04-02"
tags: [System Design]
coverImage: /assets/images/design-url-shortener.webp
previewImage: /assets/images/design-url-shortener.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** URL shortener system design explained for beginners: coat-check codes, create and redirect walk-throughs, Base62 encoding, storage, cache, and how to scale step by step.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

A URL shortener turns a long web address into a short one and, when someone clicks, sends their browser to the original page. Products like TinyURL and bit.ly do this. So do the short links inside almost every app you use.

Think of a coat check. You hand over a long heavy jacket. The clerk gives you a small paper number. Later you show the number and get the same jacket back. The number is not the jacket. It is a ticket that points to where the jacket is stored.

A short URL is the same idea for the internet:

- The long URL is the jacket (the full address).
- The short code is the coat-check number (or a nickname for that long address).
- The shortener is the clerk who keeps the list: number → jacket.

This post teaches the design the way I would teach a first class on the topic. No assumed jargon. We walk one create, one click, then encoding, storage, cache, and scale.

---

## What problem are we solving?

Long URLs are ugly and hard to share:

```
https://shop.example.com/products/category/electronics/laptops/2026/model-x?utm_source=newsletter&ref=homepage
```

A shortener turns that into something like:

```
https://sho.rt/aB3xY9q
```

Two jobs matter:

1. **Create:** accept a long URL, invent a short code, remember the mapping, return the short link.
2. **Redirect:** when someone opens the short link, look up the long URL and send the browser there.

Everything else (click stats, custom names, expiry) is extra. Get create and redirect right first.

---

## Coat check in one picture

```
Create path (hand over the jacket)
  You → shortener API → pick a code → save "code → long URL" → return short link

Redirect path (claim the jacket)
  Friend clicks short link → shortener looks up code → replies "go to long URL"
  → browser opens the long page
```

The short domain (`sho.rt`) is like the coat-check desk. The path after the slash (`aB3xY9q`) is the number on your ticket.

---

## Walk-through: create a short link

Imagine you want to share a product page. You call the create API.

**Request (simplified)**

```http
POST /api/v1/links
Content-Type: application/json

{
  "url": "https://shop.example.com/products/laptops/model-x"
}
```

**What the server does, step by step**

1. **Check the URL.** Only allow normal web links (`http` or `https`). Reject weird schemes that could be dangerous. Cap the length so nobody pastes a novel.
2. **Make a short code.** For example `aB3xY9q`. We will cover how in the encoding section. For now, treat it as a unique ticket number.
3. **Save the mapping** in a database:

| code | long_url |
| --- | --- |
| aB3xY9q | https://shop.example.com/products/laptops/model-x |

4. **Return the short URL** to you:

```http
201 Created
{
  "code": "aB3xY9q",
  "short_url": "https://sho.rt/aB3xY9q",
  "long_url": "https://shop.example.com/products/laptops/model-x"
}
```

You paste `https://sho.rt/aB3xY9q` in a chat. Done. Creating is the rare path. Most traffic is people clicking, not people creating.

Optional extras on create:

- **Custom alias:** you ask for `launch` instead of a random code. The system checks that name is free and not reserved (`api`, `health`, and so on).
- **TTL (time to live):** the link dies after a set time, like a temporary coat-check ticket.

---

## Walk-through: one user click (redirect)

Your friend taps the short link. Watch the full trip.

```
1. Browser asks: GET https://sho.rt/aB3xY9q
2. Request hits a load balancer, then a redirect service.
3. Service asks cache: "Do you know aB3xY9q?"
   - Hit: use the stored long URL immediately.
   - Miss: ask the database, then fill the cache for next time.
4. Service responds with an HTTP redirect:
   status 302 (or 301)
   header Location: https://shop.example.com/products/laptops/model-x
5. Browser follows Location and loads the real page.
6. Optionally, the service drops a "someone clicked" event on a side queue for analytics.
   That work must not slow down the redirect.
```

If the code is unknown, expired, or turned off, return **404**, not a guess.

### 301 vs 302 in plain words

| Status | Meaning | Why it matters |
| --- | --- | --- |
| **301** | "This move is permanent." | Browsers and CDNs may remember hard. Fewer hits on your servers. Click counts can be lower than real human clicks. |
| **302** | "This move is temporary." | Clients re-ask your service more often. Better if you care about accurate click analytics. |

Interview default when analytics matter: **302**. If you only care about cheap redirects and approximate counts, **301** is fine. Real products pick based on product needs, not fashion.

---

## Encoding: how we invent short codes

You need a small alphabet that is safe in URLs. The usual choice is **Base62**:

```
0-9  a-z  A-Z
```

That is 62 symbols. No `+` or `/` that Base64 needs to escape.

### How many codes do we get?

| Code length | Rough capacity |
| --- | --- |
| 6 characters | about 57 billion |
| 7 characters | about 3.5 trillion |
| 8 characters | about 218 trillion |

Seven characters is the common interview choice: short enough to share, large enough for huge growth.

### Three ways to mint a code

**A. Counter, then encode (coat-check machine)**

1. Take the next global number: 1, 2, 3, … (database sequence, Redis `INCR`, or a distributed ID).
2. Convert that number into Base62 characters.
3. That string is your code.

Pros: no accidental collision if the counter is unique. Simple story.

Cons: codes can be guessable if they go `…9`, `…a`, `…b` in order. Mitigations: start high, scramble bits before encoding, or shuffle the alphabet. Still treat codes as public tickets, not secrets.

Tiny mental picture of Base62 encode:

```
Number 125 → divide by 62, keep remainders → map remainders to alphabet → "21" (example shape)
```

**B. Hash the long URL**

Hash the URL (SHA-256 or similar), take a prefix, turn it into Base62, check it is free. On collision, take more bits or add salt and try again.

Pros: the same long URL can always map to the same short code if you want that product rule.

Cons: collisions need a retry loop. Two different users may not want to share one code for the same destination (ownership and analytics get messy).

**C. Random codes**

Pick 7 random Base62 characters. Insert with a unique constraint. If taken, pick again.

Pros: hard to guess. Simple code.

Cons: retries when the keyspace fills (at 7 chars you are fine for a long time). Use a good random generator if guess resistance matters.

**Practical default for interviews and many products:** unique ID (counter or Snowflake-style) → optional scramble → Base62. Custom aliases live in the same unique `code` column (or a dedicated unique alias column).

---

## Storage: where the jacket list lives

At heart this is a **key-value map**: short code → long URL, plus a little metadata.

### Simple SQL table

| Column | Role |
| --- | --- |
| `code` | Primary key. The ticket number. |
| `long_url` | The real destination. |
| `user_id` | Who owns the link (optional). |
| `created_at` | When it was created. |
| `expires_at` | When it dies (null = forever). |
| `is_active` | Soft delete or takedown switch. |

Lookups on redirect are always "find by code." That access pattern is perfect for a primary key or a key-value store.

### NoSQL / key-value option

Stores like DynamoDB or Cassandra shine here:

- Partition key: `code`
- Attributes: long URL and metadata
- Native TTL for expiry when the product needs it

Redirect becomes one key lookup. "List all links for user X" needs a secondary index or a separate table.

### Do not put click counters on the hot row

Updating `clicks = clicks + 1` on every redirect turns a read path into a write fight. A viral link hammers one row.

Better:

1. Redirect only **reads** the mapping.
2. Emit a click event to a queue (async).
3. Workers aggregate counts offline.

For a tiny MVP: Redis `INCR` for a live counter is OK if you accept some loss and snapshot to durable storage later.

---

## Cache: the clerk's sticky note

Most clicks hit a small set of popular codes. Reading the database every time is slower and more expensive than necessary.

**Three layers people talk about:**

1. **CDN** in front of the short domain (great for global latency; can complicate exact analytics).
2. **Redis (or Memcached)** close to the app: `code → long_url` with a TTL.
3. **Database** as source of truth.

**Redirect with cache, simple flow:**

```
ask Redis for code
if found and still valid → redirect
else
  ask DB
  if missing / inactive / expired → 404 (and maybe remember "not found" briefly)
  else write Redis with a TTL → redirect
also enqueue analytics (best effort)
```

**Why cache helps:** memory lookups are fast. Popular tickets stay on the sticky note. Rare tickets still go to the full jacket room (the DB).

**Watch-outs:**

- **Cache stampede:** many requests miss at once for a cold popular code. Coalesce work (one fetch, many waiters) or use a short lock.
- **Negative cache:** briefly remember "this code does not exist" so scanners do not beat the DB.
- **Takedown:** when you disable a link, delete or overwrite the cache entry so the old Location does not linger.

---

## Scale path, step by step

Do not start with a 40-box diagram. Grow with pain.

### Stage 1: One app, one database

Enough for a side project or early product.

```
Client → App (create + redirect) → DB
```

### Stage 2: Separate create and redirect a bit, add cache

Redirects dominate. Put Redis in front of lookups. Keep create on the primary DB.

```
Create  → API → DB
Redirect → API → Redis → (miss) DB
```

### Stage 3: Many redirect servers behind a load balancer

Redirect handlers stay **stateless**. Scale them horizontally. Cache and DB hold the state.

```
Client → LB → Redirect pod 1..N → Redis → DB
```

### Stage 4: Read-heavy database tricks

- Read replicas for cache misses if needed.
- Keep analytics off the mapping table.
- Partition (shard) the mapping table by code hash when one primary cannot hold the data and indexes.

### Stage 5: Write path for high create volume

Creates are usually far fewer than redirects. When creates grow:

- Use a solid ID generator (block allocation, Snowflake-style IDs).
- Keep a unique constraint on `code`.
- Pin multi-region creates carefully so two regions never mint the same code.

### Stage 6: Reliability rules that matter

| Rule | Why |
| --- | --- |
| Redirect is more important than create | Users clicking must win over people making new links. |
| Never lose a mapping after you returned 201 | The client already shared the short link. |
| Analytics may drop under extreme load | Better a missing click event than a slow redirect. |
| If Redis is down, fall through to DB | Higher latency, still correct. |
| Fail open on metrics, fail closed on missing codes | Unknown code → 404, not a wrong page. |

**Rough capacity intuition (say out loud in interviews):**

- Creates might be thousands per second at peak.
- Redirects can be 100x or more.
- Each mapping row is often under 1 KB with metadata.
- 100 million rows is tens of GB, not petabytes. Sharding is about growth and QPS, not panic on day one.

---

## Security and abuse (short list)

Short codes are public tickets. Expect:

1. **Guessing codes** by walking the space. Rate limit. Prefer longer or scrambled codes.
2. **Phishing** via your trusted short domain. Scan or blocklist bad destinations. Offer report and takedown.
3. **Spam creates** filling storage. Auth, quotas, CAPTCHA, paid tiers.
4. **Open redirects** only if you ever let the long URL be user-controlled at click time (normally you fix it at create time and only serve that stored value).

Never put secrets in a short URL and assume nobody will find them.

---

## End-to-end design you can defend

**Requirements example:** 7-char Base62 codes, optional custom alias and TTL, roughly accurate clicks, high redirect QPS, multi-AZ.

**Pieces:**

1. API service for create / list / delete (with auth).
2. Thin redirect service (hot path stays light).
3. ID generator for unique numbers.
4. Primary store for mappings (SQL or DynamoDB-style).
5. Redis for `code → url`.
6. Queue + workers for click events and rollups.

**Create:** validate → mint code → insert → return short URL.

**Redirect:** cache → DB → 302 + Location → async click event.

**Trade-offs to say out loud:**

- Counter encoding is simple and collision-free; random and hash need uniqueness checks.
- 301 saves origin load; 302 keeps analytics more honest.
- Click counters on the mapping row will melt under viral traffic.
- Redirect correctness beats perfect global analytics.

---

## Recap you can tell a friend

A URL shortener is a coat check for web addresses.

You hand over a long jacket (long URL). The clerk gives you a small number (short code) and writes it in a book (database). When someone shows the number, the clerk looks it up and points them to the jacket rack (redirect with a `Location` header). For popular numbers, the clerk keeps a sticky note (cache) so they do not walk to the back room every time.

Encoding is how you print ticket numbers from counters, hashes, or dice. Storage is the durable list. Cache is speed. Scale means many clerks for the front desk, a bigger book when needed, and never letting the click counter freeze the line.

If you remember one production lesson: **protect the redirect path like an edge service**, and treat analytics as a side conversation, not a step that must finish before the user is allowed through the door.

---

## Production checklist

- [ ] Alphabet and code length chosen with growth math
- [ ] Unique codes (counter or unique constraint)
- [ ] URL validation and scheme allowlist
- [ ] Reserved words for custom aliases
- [ ] Redis cache with TTL and negative caching
- [ ] 301 vs 302 decision written down for product and analytics
- [ ] Analytics off the hot path
- [ ] Expiry and takedown clear the cache
- [ ] Rate limits on create and suspicious redirect volume
- [ ] Load test hot key, cold key, cache failure, DB failover
- [ ] Dashboards: create QPS, redirect QPS, cache hit ratio, p99 redirect latency, 404 rate