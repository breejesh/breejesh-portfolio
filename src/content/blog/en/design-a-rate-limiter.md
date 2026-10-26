---
title: "Design a Rate Limiter: Algorithms, Redis Patterns, and Gateway Reality"
description: "How production rate limiters actually work: choosing between token bucket, sliding window and GCRA, an atomic Redis Lua implementation, where the limiter lives in the gateway, fail-open vs fail-closed per endpoint, 429 semantics, and the clock and hot-key problems that bite at scale."
date: "2026-04-10"
tags: [System Design & Architecture]
coverImage: /assets/images/design-a-rate-limiter.webp
previewImage: /assets/images/design-a-rate-limiter.webp
---

> **TL;DR**
> * **The Problem:** A rate limiter has to make an allow-or-deny decision on every request, consistently across a fleet of gateways, in well under a millisecond of added latency, without becoming the outage it was meant to prevent.
> * **The Design:** Enforce at the API gateway. Key requests by tenant, user, IP and route. Run a token bucket as a single atomic Lua script against a sharded Redis cluster, cache hot keys locally, and decide per endpoint whether a limiter failure fails open or closed. Return `429` with `Retry-After` and machine-readable limit headers.
> * **The Result:** One Redis round trip per request, fair limits across many gateway nodes, graceful behavior when Redis is slow, and limits that clients can actually reason about.

Every public API eventually learns the same lesson: one customer's retry loop is another customer's outage. A rate limiter is the cheapest piece of insurance you can buy against that, and like most insurance, it only matters on the worst day of the year.

This post designs one the way you would for a real API platform. It is opinionated about algorithms, precise about the Redis implementation, and honest about what breaks.

---

## What a Rate Limiter Is Actually For

People say "rate limiting" and mean four different things. Stripe's well-known write-up on their limiters separates them cleanly, and the distinction still holds:

| Limiter type | Question it answers | Typical rule |
| --- | --- | --- |
| Request rate limiter | Is this client sending too many requests per unit of time? | 100 requests per second per API key |
| Concurrent request limiter | Is this client holding too many requests in flight? | 20 concurrent expensive searches per user |
| Fleet load shedder | Is the whole system near capacity? | Reserve 20% of capacity for critical traffic |
| Worker utilization shedder | Is this specific worker pool saturated? | Drop low-priority jobs when the pool is 90% busy |

This post focuses on the first one, which is what interviewers and most product teams mean. The other three are worth naming, because a request-rate limiter alone will not save you from a single customer running a handful of very expensive queries.

---

## Requirements and Budget

* Decide in **under 1 ms** of added p99 latency at the gateway.
* Enforce limits **globally** across many gateway nodes, not per node.
* Support rules by **tenant, user, API key, IP and route**, with different tiers (free, pro, enterprise).
* Tolerate **bursts** that are legitimate (a page load firing 15 API calls) without letting sustained abuse through.
* Degrade **predictably** when the limiter's own state store is slow or down.
* Tell clients **when to retry**.

At 200,000 requests per second across the fleet, one state-store round trip per request is 200,000 operations per second. A single Redis shard comfortably handles on the order of 100,000 simple operations per second, so plan for a sharded cluster with headroom, plus local caching for the hottest keys.

---

## Choosing the Algorithm

| Algorithm | How it works | Burst behavior | Memory per key | Accuracy | Where you see it |
| --- | --- | --- | --- | --- | --- |
| Fixed window | Count requests per calendar window (for example per minute) | Allows 2x the limit across a window boundary | One counter | Low at edges | Simple quotas, daily caps |
| Sliding log | Store every request timestamp, count those in the last window | No boundary burst | One entry per request | Exact | Low-volume, high-value endpoints |
| Sliding window counter | Weighted blend of the current and previous fixed windows | Smooths edges | Two counters | Approximate, close in practice | Cloudflare described this approach for its edge rate limiting |
| Token bucket | Bucket of `capacity` tokens refilled at `rate`; each request spends tokens | Allows bursts up to capacity, then steady rate | Two numbers | Exact for its model | API gateways, cloud provider APIs |
| Leaky bucket | Requests queue and drain at a fixed rate | Smooths output, adds latency | Queue | Exact | Traffic shaping |
| GCRA | Tracks a single "theoretical arrival time" | Same behavior as token bucket | One timestamp | Exact | Telecom heritage; libraries such as redis-cell |

My default is the **token bucket**. It expresses the two numbers product teams actually care about (sustained rate and burst size), it costs two fields per key, and it is easy to explain to customers: "100 per second, bursts up to 200."

The fixed window's boundary problem is worth stating out loud in an interview: with a limit of 100 per minute, a client can send 100 requests at 12:00:59 and another 100 at 12:01:00, which is 200 requests in two seconds.

---

## Where the Limiter Lives

![Rate limiter architecture: mobile and API clients reach an API gateway with a limit filter, which consults a Redis cluster and a local token cache, pulls rules from a config service, forwards allowed traffic to backends and emits decisions to a metrics stream](/assets/images/hld/design-rate-limiter-architecture.webp)

* **Mobile App / API Client.** Untrusted callers. Some are buggy, a few are hostile, most are fine.
* **API Gateway + limit filter.** The enforcement point. It is already parsing auth and routing, so it has the identity and route needed to build a key. Enforcing here protects every backend with one implementation (Envoy's global rate limit service and most managed gateways follow this shape).
* **Rules Config.** A small service or config repo that defines limits per tier, tenant and route. Gateways pull rules every few seconds and keep them in memory, so a config outage never blocks traffic.
* **Redis Cluster (counters).** The shared state. Each decision is one `EVALSHA` of a preloaded Lua script, which makes the read, refill and decrement atomic.
* **Local Token Cache.** For a handful of extremely hot keys (a big tenant hammering one route), gateways can lease a small batch of tokens from Redis and spend them locally, trading a little precision for far fewer round trips.
* **Orders API / Search API.** Backends only see allowed traffic. Expensive routes (search) get tighter limits than cheap ones (orders read).
* **Limit Metrics.** Every decision is emitted asynchronously, so you can see who is being throttled, tune rules and catch false positives. This stream must never sit on the request path.

The red note on the diagram is the most important policy decision in this system, and it is covered below.

---

## The Decision Path for One Request

![Rate limiter decision path: request arrives, build the key from user, IP and route, match a rule, run an atomic token bucket, then forward to the backend or reject with 429 and Retry-After](/assets/images/hld/design-rate-limiter-decision.webp)

1. **Build the key.** For example `rl:{tenant:acme}:route:search`. The braces are a Redis Cluster hash tag, which pins all of a tenant's keys to one slot if you ever need multi-key operations.
2. **Match the rule.** Most specific wins: route-specific tenant override, then tenant tier, then a default tier. A request with no matching rule still gets the default, never "unlimited."
3. **Run the bucket atomically.** Read, refill, spend and write must be one operation. Two gateways doing read-then-write in parallel will both see a token and both spend it.
4. **Allow or reject.** Allowed requests continue with headers describing the remaining budget. Rejected requests get `429 Too Many Requests` and a `Retry-After`.

Here is the whole bucket as a Redis Lua script. It uses Redis server time rather than the gateway's clock, which removes clock skew between gateway nodes from the equation.

```lua
-- KEYS[1]: bucket key   ARGV[1]: capacity   ARGV[2]: refill tokens/sec   ARGV[3]: cost
local cap, rate, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local t = redis.call('TIME')  -- Redis 5+ replicates script effects, so TIME is safe here
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)

local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now

tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)

local retry_ms = 0
if allowed == 0 then retry_ms = math.ceil((cost - tokens) / rate * 1000) end
return { allowed, math.floor(tokens), retry_ms }
```

The `PEXPIRE` matters more than it looks: idle buckets expire once they would have refilled completely, so memory scales with active clients, not with every client that ever existed.

---

## Telling Clients What Happened

A limiter that rejects without explanation creates support tickets and makes client retries worse.

* **Status:** `429 Too Many Requests` (defined in RFC 6585). Do not use `503` for per-client limits; that tells clients the whole service is down.
* **`Retry-After`:** seconds until a retry is likely to succeed (RFC 9110). The Lua script above returns exactly this number.
* **Budget headers:** GitHub's API returns `x-ratelimit-limit`, `x-ratelimit-remaining` and `x-ratelimit-reset` on every response, and the IETF HTTPAPI working group is standardizing `RateLimit` and `RateLimit-Policy` header fields. Pick one convention and document it.
* **Client guidance:** publish that clients should back off with jitter. Without jitter, every throttled client retries at the same instant and you get a synchronized thundering herd.

---

## Fail Open or Fail Closed?

When Redis is slow or unreachable, the limiter has to guess. There is no universally right answer, which is why it should be configured **per route**, not globally.

| Route type | Policy | Why |
| --- | --- | --- |
| Reads, catalog browsing, most APIs | Fail open | A limiter outage should not become a full outage. Backends have their own load shedding |
| Login, password reset, OTP verification | Fail closed | These limits exist to stop credential stuffing and brute force. Failing open removes the protection exactly when an attacker might be causing the instability |
| Expensive writes, payments | Fail closed or fall back to a conservative local limit | Overload here is costly and hard to undo |

Set a tight timeout on the Redis call (single-digit milliseconds). A limiter that waits 2 seconds for Redis has already failed, just more slowly.

---

## The Problems That Show Up at Scale

**Hot keys.** One enormous tenant can concentrate a large share of traffic on a single Redis key and therefore a single shard. Options: shard the key (`rl:{acme}:search:0..7`, each with an eighth of the rate), or lease tokens in batches to gateways through the local cache. Both trade a little precision for throughput.

**Multi-region.** A global limit across regions needs either a global store (latency) or a split budget (each region gets a share, rebalanced periodically). Most systems choose per-region budgets and accept that a client hitting two regions gets slightly more than the nominal limit.

**Clock skew.** Using gateway clocks in the bucket math means two nodes disagree about elapsed time. Using Redis `TIME`, as above, avoids it. If your store has no server clock, use monotonic time on a single authority.

**Retries amplify load.** Clients, SDKs and service meshes all retry. If every layer retries three times, one user request can become dozens. Count retries against the same budget, and make sure internal retries honor `Retry-After` too.

**Limits as product.** Limits are part of your pricing and contract. Changing them silently breaks integrations. Version and announce them like an API.

---

## An Interview-Sized Answer

1. Clarify what is limited (per user, per IP, per key) and whether limits are hard or soft.
2. Put the limiter in the gateway, with shared state in Redis.
3. Choose token bucket, and explain the fixed-window boundary problem as the reason.
4. Make the check atomic with a Lua script.
5. Return `429` with `Retry-After`.
6. Discuss fail-open vs fail-closed per endpoint and the hot-key problem.

That covers what most interviewers are listening for. The rest is depth you can offer if time allows.

---

## Production Checklist

- [ ] Rules defined per tier, tenant and route, with a default tier for everything else
- [ ] Atomic check-and-spend (Lua or an equivalent server-side operation)
- [ ] Server-side time for bucket math
- [ ] Bucket keys expire when idle
- [ ] Tight timeout on state-store calls, with per-route fail-open or fail-closed policy
- [ ] `429`, `Retry-After` and budget headers documented for clients
- [ ] Hot-key mitigation (sharded keys or local token leases)
- [ ] Decisions streamed to metrics; dashboards for throttle rate by tenant and route
- [ ] Separate concurrency limits for expensive endpoints
- [ ] Load test that includes a Redis slowdown, not just a Redis outage

---

## The Leftover

The rate limiter is the only component whose job is to say no to your own customers. Get it slightly wrong and the people you throttle are your best ones, the ones whose integrations grew faster than your rules.

So log every rejection, and read the log. Somewhere in there is a customer you should have called instead of throttling.

---

## Sources

* [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
* [Cloudflare: How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)
* [Envoy proxy: global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting)
* [RFC 6585: Additional HTTP Status Codes (429)](https://www.rfc-editor.org/rfc/rfc6585)
* [IETF draft: RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
* [GitHub REST API: rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
* [Redis: scripting with Lua](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)
* Related in this series: [Design a URL Shortener](/blog/en/design-url-shortener), [Redis caching patterns](/blog/en/redis-caching-patterns)
