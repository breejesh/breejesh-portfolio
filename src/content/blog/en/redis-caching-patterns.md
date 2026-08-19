---
title: "Redis Caching Patterns That Survive Production"
description: "Cache-aside, stampede control, TTL jitter, invalidation, and hot keys. Patterns that keep Redis useful under real traffic without melting the database."
date: "2026-07-15"
tags: [Databases, Backend]
coverImage: /assets/images/redis-caching-patterns.webp
previewImage: /assets/images/redis-caching-patterns.webp
---

Caching looks simple until traffic is uneven, keys expire together, and one celebrity product id burns a single Redis shard. Most outages I have seen were not "Redis is slow." They were stampede, stale-forever data, or a hot key that nobody measured.

This post is the short list that keeps showing up on real services: **cache-aside**, **stampede control**, **TTL with jitter**, **invalidation**, and **hot keys**. Not a catalog of every Redis command. Just the patterns you need before you put a cache on the read path.

---

## What cache-aside actually does

**Cache-aside** (lazy loading) is the default for app-owned caches:

1. Read Redis for `key`.
2. On hit, return the value.
3. On miss, load from the source of truth (usually Postgres), write Redis with a TTL, return the value.
4. Writes go to the database first. Then you either delete the cache key or overwrite it.

```
value = GET cache:user:{id}
if value is nil:
  value = db.query("SELECT ... WHERE id = ?")
  if value is nil:
    SET cache:user:{id} "null" EX 60   # negative cache; see below
  else:
    SET cache:user:{id} value EX 300
return value
```

Why teams pick it:

* The app owns the key schema and TTL policy.
* The database stays the source of truth.
* You can start with one endpoint and grow.

Costs you accept:

* First request after miss pays full DB latency.
* Concurrent misses for the same key can stampede the DB (next section).
* You must think about what happens after a write.

**Read-through** and **write-through** push more of that into a cache layer or library. Fine when you have one. Most microservice code still does cache-aside by hand.

---

## Cache stampede (thundering herd)

Stampede: a popular key expires (or is evicted), then **hundreds of concurrent requests** all miss and all hit the database with the same query. The DB spikes. Latency climbs. Timeouts create retries. The herd grows.

Classic triggers:

* A fixed TTL on a hot key so every instance sees expiry in the same second.
* Deploy that flushes the cache.
* Traffic spike right when a key dies.
* Missing negative cache: a missing row is re-queried forever.

### Defense 1: single-flight / request coalescing

Only one request rebuilds the value. Others wait (or serve slightly stale data).

```
value = GET key
if hit: return value

if SETNX lock:key "1" EX 10:
  value = load_from_db()
  SET key value EX ttl
  DEL lock:key
  return value
else:
  sleep briefly and retry GET
  # or return last-known if you keep a soft TTL copy
```

`SETNX` (or `SET key NX EX`) is a coarse lock. In multi-pod systems it is usually good enough for stampede. For tighter control, use a short-lived lock plus a wait loop with a hard timeout, then fall through to the DB only if the lock holder died.

In-process single-flight (one goroutine/promise per key per pod) helps **within** a process. It does not stop N pods from each running one rebuild. Combine both for hot keys.

### Defense 2: probabilistic early refresh

Before hard expiry, a fraction of requests refresh early. Popular keys get rebuilt before the cliff. Less popular keys mostly wait for natural miss.

Sketch of XFetch-style logic: if remaining TTL is small relative to total TTL, and a random draw wins, rebuild and rewrite. The math is less important than the idea: **spread refresh work over time** instead of one synchronized miss.

### Defense 3: stale-while-revalidate

Store two times: soft TTL (serve but refresh) and hard TTL (must reload). Or store the payload with a `stale_after` field inside the value and a longer Redis `EX`.

On soft miss: return the old value immediately, kick an async refresh. Users stay fast. Background workers absorb the rebuild. You trade strict freshness for stability.

### Defense 4: negative caching

If the DB says "not found," cache that fact for a short TTL (30s-2m). Without it, bots and broken clients hammer missing ids forever. Keep the TTL short so a newly created row is not invisible for hours.

---

## TTL: not one number for everything

TTL is a **staleness budget**, not a random default of 3600.

| Data shape | Typical TTL | Notes |
| --- | --- | --- |
| User session / authz snapshot | minutes | Security sensitive; invalidate on logout/role change |
| Product catalog row | 5-30 min | Invalidate on admin edit |
| Feed ranking / home cards | 30s-5 min | Can be slightly stale |
| Feature flags | 10-60s | Prefer push invalidation if available |
| Rate counters / idempotency | window length | Often exact TTL, not "forever" |
| Negative cache ("not found") | 30s-2 min | Short on purpose |

### Jitter so keys do not expire in a line

If 50,000 product keys all use `EX 300`, a cold start or mass insert can create synchronized expiry waves. Add jitter:

```
ttl = base_ttl + random(0, base_ttl * 0.1)
# e.g. 300 + random(0, 30) seconds
```

Jitter does not replace stampede locks. It reduces the chance that **many different keys** die together and overload both Redis and the DB.

### Memory and eviction

Redis is not infinite. When `maxmemory` is hit, policy matters:

* `allkeys-lru` / `allkeys-lfu`: fine for pure caches where every key can die.
* `volatile-lru`: only keys with TTL. Dangerous if some keys lack TTL and pin memory.
* Never run a production cache without **TTL on almost every key** and a clear `maxmemory-policy`.

If a key must not vanish under pressure (locks, queues), put it on a separate Redis with a different policy, or accept that a cache instance is the wrong store for durability.

---

## Invalidation: the hard part

There are only hard problems in CS, and cache invalidation is the joke for a reason. The failure modes are concrete:

* **Delete-then-write race:** request A deletes cache, request B loads old DB row into cache, request C commits a new write. Cache now holds stale data until TTL.
* **Write-then-forget:** app updates DB and never touches Redis. Stale until TTL.
* **Multi-key objects:** user profile cached under `user:42`, but also embedded in `team:9:members`. You updated one key and left the denormalized copy.

### Patterns that work

**1. Write DB, then delete cache (lazy rebuild)**

```
BEGIN; UPDATE users SET name = ? WHERE id = ?; COMMIT;
DEL cache:user:{id}
```

Next read rebuilds. Prefer **delete over overwrite** when the write path does not have the full object you cache, or when concurrent writers can interleave.

**2. Write DB, then set cache (if you have the full payload)**

Useful when the response shape matches the cache blob. Still race-prone under concurrent writers. Version fields or "write only if version increases" help.

**3. Versioned keys**

`cache:user:{id}:v{version}` or include `updated_at` in the key hash. Bump version on write; old keys die by TTL. Readers always ask for the current version from DB or a small pointer key. More moving parts, fewer "silent stale" bugs on complex objects.

**4. Pub/Sub or stream invalidation**

Writer publishes `invalidate user:42`. App instances drop local L1 caches. Redis key delete still needed for shared L2. Local L1 without invalidation is how "I fixed it in my pod" becomes an incident.

**5. TTL as backstop, not the only plan**

Even with perfect deletes, a worker can miss a message. TTL bounds worst-case staleness. Pick the bound with product, not with superstition.

### Order of operations under concurrency

A practical rule many teams use:

1. Update the database (transaction commits).
2. Delete the cache key (or bump version).
3. Rely on next read to refill.

If you must set the cache on write, set it **after** commit with the committed row, and keep TTL. For high contention rows, add a version column and refuse to cache an older version over a newer one.

---

## Hot keys: when one key is the outage

A hot key is a key that absorbs a disproportionate share of ops: a homepage config blob, a celebrity profile, a global feature-flag document, a flash-sale product.

Symptoms:

* One Redis CPU core pegged (especially with Cluster: one hash slot).
* Latency for **unrelated** keys rises because that node is busy.
* Client timeouts and reconnect storms.

### Mitigations

**Local L1 cache in the app**

In-process LRU (or Caffeine, Ristretto, Guava, etc.) with a short TTL (1s-30s) for known hot keys. Most reads never leave the pod. Invalidate via Pub/Sub or accept short staleness.

**Key splitting / sharding the value**

If the value is a big hash, split into `product:{id}:core`, `product:{id}:stats`, etc., only if access patterns differ. Splitting a single logical counter into `N` shards (read sum, write random shard) helps write-hot counters more than read-hot blobs.

**Read replicas**

Redis replicas can take read load for cache-aside **if** you accept replication lag. For session-critical data, stay on primary. For homepage JSON that can be 100ms behind, replicas help.

**Copy the hot key (client-side caching at edge)**

CDN or edge cache for truly public, mostly static blobs. Redis should not be your only defense for anonymous traffic that never needed per-user freshness.

**Dedicated instance for the hottest namespace**

Sometimes the honest fix is isolation: one small Redis only for `config:*` and `flags:*`, so a storm there cannot starve cart sessions.

---

## Putting it together: a boring, solid default

For a typical CRUD API with Postgres and Redis:

| Concern | Default choice |
| --- | --- |
| Read path | Cache-aside |
| Miss storm | Lock (`SET NX`) + optional in-process single-flight |
| TTL | Per-domain base + 10% jitter |
| After write | Commit DB, then `DEL` cache key |
| Not found | Negative cache, short TTL |
| Ultra-hot keys | L1 in process + short TTL + metrics |
| Redis down | Fail open to DB with timeout and circuit breaker; alert |

### Minimal metrics worth having

* Cache hit ratio by key prefix (not one global number).
* Miss latency vs hit latency.
* Stampede lock acquire failures / wait time.
* Redis CPU, evicted keys, rejected connections.
* Top keys by ops (Redis `HOTKEYS` / proxy metrics / sampling).

A 99% hit ratio can hide one prefix at 20% that is killing the DB. Split the numbers.

### Failure mode: Redis unavailable

Decide in writing:

* **Fail open to DB:** higher latency, risk of DB overload. Common for product reads.
* **Fail closed:** return errors. Common for auth session stores (which may not be pure cache).
* **Serve stale from disk/L1:** only if you still have something to serve.

Pair fail-open with **timeouts, bulkheads, and load shedding**. An infinite DB fallback during a Redis outage is how you turn a cache incident into a database incident.

---

## Small code shape (Python sketch)

```python
import json
import random
import time
from typing import Any, Callable, Optional

def cache_aside(
    redis,
    key: str,
    loader: Callable[[], Optional[Any]],
    base_ttl: int = 300,
    neg_ttl: int = 60,
    lock_ttl: int = 10,
) -> Optional[Any]:
    raw = redis.get(key)
    if raw is not None:
        return json.loads(raw)

    lock_key = f"lock:{key}"
    if redis.set(lock_key, "1", nx=True, ex=lock_ttl):
        try:
            value = loader()
            ttl = base_ttl + random.randint(0, max(1, base_ttl // 10))
            if value is None:
                redis.set(key, json.dumps(None), ex=neg_ttl)
            else:
                redis.set(key, json.dumps(value), ex=ttl)
            return value
        finally:
            redis.delete(lock_key)

    # Someone else is loading; brief wait then one more get
    time.sleep(0.02)
    raw = redis.get(key)
    if raw is not None:
        return json.loads(raw)
    # Last resort: load without holding the lock (rare)
    return loader()
```

This is intentionally plain. Production adds metrics, circuit breakers, typed codecs, and often a soft-TTL wrapper. The structure is what matters: **get, acquire lock, load, set with jitter, release lock, retry**.

---

## Checklist before you call the cache "done"

* [ ] Every cache key has a TTL (or a documented reason it does not).
* [ ] Hot prefixes have jitter and stampede protection.
* [ ] Writes commit to DB before cache delete/update.
* [ ] Negative caching for high-traffic lookups that can miss.
* [ ] Hit ratio and latency broken out by key prefix.
* [ ] Documented behavior when Redis is down.
* [ ] Hot key candidates listed (config, homepage, flash SKUs) with L1 or edge plan.
* [ ] `maxmemory` and eviction policy set on purpose, not by image default.

---

## Closing

Redis cache is not "put GET/SET around the query." It is a set of contracts about **freshness**, **load under miss**, and **who owns the key after a write**. Cache-aside covers most app code. Stampede control and TTL jitter keep the database alive when popular keys die. Invalidation keeps product truth honest. Hot-key plans keep one celebrity blob from owning your cluster.

Start with one path, measure hit ratio and DB QPS on that path, then add locks and L1 where the graphs demand it. The patterns above are boring on purpose. Boring is what survives on-call.
