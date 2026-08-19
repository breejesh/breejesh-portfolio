---
title: "Design a Rate Limiter: Algorithms, Redis Patterns, and Gateway Reality"
description: "Rate limiting explained for absolute beginners: the club bouncer analogy, why limits exist, token buckets and sliding windows in plain language, Redis as a shared notebook, and one request walked end to end."
date: "2026-04-10"
tags: [System Design]
coverImage: /assets/images/design-a-rate-limiter.webp
previewImage: /assets/images/design-a-rate-limiter.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** Rate limiting explained for absolute beginners: the club bouncer analogy, why limits exist, token buckets and sliding windows in plain language, Redis as a shared notebook, and one request walked end to end.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Imagine a popular club on a Saturday night. A bouncer stands at the door with a simple job: let people in at a pace the room can handle. Too many at once and the bar, the bathrooms, and the exits all fail. Too strict and honest guests leave angry. A **rate limiter** is that bouncer for your API. Every request walks up and asks "can I come in right now?" The limiter says yes, wait, or no.

This post teaches rate limiting the way a patient professor would: human reasons first, then the two algorithms you will actually meet, then the multi-server trap, then one full walk of a single request. You do not need distributed systems experience. You need curiosity and a willingness to think in tickets and water buckets for a few minutes.

---

## Why rate limits exist (in human terms)

Without a bouncer, three kinds of pain show up fast.

**Fairness.** One person who hammers refresh can eat the whole room. Everyone else waits. Rate limits give each guest (user, IP, API key) a budget so one loud neighbor does not starve the rest.

**Cost.** Every request costs something: CPU, database time, money paid to a third-party SMS or AI API. Unlimited free traffic is unlimited free bill. Limits are how free tiers stay free and paid tiers stay honest.

**Abuse.** Bots try password guesses, scrape your catalog, or spam signups. A limit does not stop a determined attacker forever, but it slows the cheap attacks enough that logs, CAPTCHA, and security teams can breathe.

Product language you already know:

- Free plan: 100 API calls per day.
- Login: try a few times, then cool down.
- Weather API: 60 requests per minute per key.

Same idea everywhere: **a budget of actions over time**.

---

## What you are counting

Before you pick an algorithm, decide **who** you limit and **what** one "ticket" means.

| You count by... | Real life meaning | When it goes wrong |
| --- | --- | --- |
| IP address | "This phone network" | Many people share one IP (office, mobile carrier) |
| User id | "This logged-in person" | Shared bot accounts or forgotten service users |
| API key | "This partner app" | One key used from many places at once |
| Tenant + route | "This company on this expensive endpoint" | One hot feature burns the whole company quota |
| Everyone together | "Protect the shared kitchen" | One noisy tenant hurts the platform |

A good limiter answers three things:

1. **Allow or deny** (yes or no right now).
2. **How long to wait** if denied (`Retry-After` style guidance).
3. **How much budget remains** so clients can slow down politely.

HTTP status **429** means "too many requests." Think of it as the bouncer's polite "not yet."

---

## Two mental models you will keep forever

Interviews and production both circle two ideas. Learn them with pictures in your head, not only formulas.

### 1. Token bucket = a water jug of tickets

Picture a jug on the counter. It can hold **B** tickets (the capacity). Every second (or minute), the club drops **R** new tickets into the jug (the refill rate). When you arrive, you need one ticket. If the jug has one, you take it and walk in. If the jug is empty, you wait.

Important feelings:

- If the club is quiet, tickets pile up until the jug is full. Then you can let a short **burst** in (up to B people at once).
- After a burst, the jug is empty. New guests only enter as fast as tickets refill (rate R).
- Burst size and long-term speed are separate knobs. Product teams love that: "allow a short spike, never more than R forever."

That is **token bucket**. Tokens are tickets. Capacity is how many spare tickets you store. Rate is how fast you mint new ones.

### 2. Sliding window = a rolling strip of time

Imagine a ticket counter that only looks at the **last 60 seconds**, not "this calendar minute." A rolling window of glass slides over the timeline. You count how many people entered under that glass. If the count is under the limit, the next person gets a stamp. If not, they wait until older stamps fall out of the window.

Two common flavors:

**Sliding window log (exact, expensive):** you write down every entry timestamp. On each new person, erase stamps older than 60 seconds and count the rest. Perfectly fair. Heavy if millions of people hit you, because every request is a write and a cleanup.

**Sliding window counter (good enough, practical):** instead of every stamp, keep two rough buckets: "previous minute" and "current minute." Blend them by how far you are into the current minute. Almost as smooth as the log, with two numbers instead of a long list.

**Fixed window** is the naive cousin: "only 100 per calendar minute." At 12:00:59 someone uses 100. At 12:01:00 the counter resets and they use 100 again. In two seconds they used 200. Soft limits tolerate that. Hard SLAs often do not.

| Idea | Everyday picture | Burst feel | Memory cost |
| --- | --- | --- | --- |
| Fixed window | Reset the clicker every top of the minute | Spikes at the edges | Tiny (one counter) |
| Sliding log | Exact guest list for the last 60s | Smooth and fair | Large |
| Sliding counter | Approximate blend of two minutes | Nearly smooth | Tiny (two counters) |
| Token bucket | Jug of tickets that refills slowly | Controlled bursts | Tiny |
| Leaky bucket | Sink that drains at a fixed drip | Smooth outflow | Queue or counter |

**Leaky bucket** (bonus picture): people line up, and the door lets one through every fixed tick, like a sink draining at a steady drip. Output is smooth. When the line is full, new arrivals are turned away. Great when the thing you protect needs steady inflow more than short spikes.

For most APIs, **token bucket** or **sliding window counter** is the sweet spot.

---

## Token bucket in the simplest code shape

One process, one clock, no Redis yet. This is the jug in code form:

```python
import time

class TokenBucket:
    def __init__(self, rate: float, capacity: float):
        self.rate = rate          # tickets added per second
        self.capacity = capacity  # max tickets in the jug
        self.tokens = capacity
        self.updated_at = time.monotonic()

    def allow(self, cost: float = 1.0) -> bool:
        now = time.monotonic()
        elapsed = now - self.updated_at
        # refill based on time passed, never above capacity
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.updated_at = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False
```

What a careful professor would underline:

- Prefer a **steady clock** (monotonic) for refill math so a laptop clock jump does not invent free tickets.
- **Cost** can be more than 1. An expensive "export all data" route can cost 10 tickets; a cheap health check can cost 1 or even 0.
- One process is fine for demos. Many servers need a **shared** jug, or each server becomes its own bouncer with its own full budget.

---

## Many servers: private notebooks vs one shared notebook

Here is the multi-server trap in plain language.

You run **20** copies of your API behind a load balancer. Each copy keeps a private notebook: "this user used 5 of 100." The user can hit all 20 copies. If traffic spreads evenly, they effectively get about **20 × 100** before anyone says no. Your advertised limit became fiction.

| Approach | Picture | What really happens |
| --- | --- | --- |
| Limit only in app memory | Each bouncer has a private notebook | Budget multiplies by server count |
| Sticky sessions only | "Always send this guest to the same door" | Retries and mobile networks break stickiness |
| Shared store (usually Redis) | One notebook all bouncers read and write | The real limit is roughly the real limit |

**Redis** is the shared notebook of choice for many teams: very fast, good at simple counters and small hashes, scripts that update one key without two apps racing.

### Patterns people actually ship

**Fixed window notebook page**

```
key = rl:{apiKey}:{yyyyMMddHHmm}
count = INCR key
if count == 1: EXPIRE key 120
if count > limit: DENY
```

Cheap and simple. Accept edge spikes if your product can live with them.

**Token bucket on a shared hash**

Store `tokens` and `last_refill_time` on one Redis key. On each request, a small **Lua script** (runs as one atomic step on Redis) refills by elapsed time, spends a token if possible, writes the new balance, and returns allow/deny plus remaining tickets. Without atomic update, two servers can both read "1 left," both allow, and oversell the last ticket.

**Sliding log as a sorted set**

Store timestamps, drop old ones, count, then add the new stamp. Exact, but memory and CPU grow with traffic. High QPS teams often regret this first.

**Sliding counter with two pages**

Keys for "this window" and "previous window," blended with a weight. Most of the smoothness, little of the cost.

### Fail-open vs fail-closed (when the notebook is missing)

If Redis is down, you still need a policy:

- **Fail open:** let traffic through (maybe with a tiny local emergency limit). Consumer apps often choose this so Redis pain does not become total outage.
- **Fail closed:** reject. Payments and login often choose this so chaos does not mean free unlimited tries.

Neither is free. Choose on purpose per surface, and alarm on Redis errors either way.

### Clocks will lie if you let them

If every app server uses its own wall clock to decide "which minute am I in," two servers can disagree for a moment. Safer pattern: use **Redis server time** inside the script for refill and window id. For pure local demos, use a monotonic clock. Never trust a timestamp the client invents.

---

## Walk one API request through the limiter

Meet **Priya**. She is logged in. Her free plan allows **100 requests per minute**, with a short burst of **20**. Your system has many API pods and one Redis notebook.

1. **Client sends request**  
   Browser or mobile app calls `GET /api/weather?city=Pune` with Priya's session cookie (or API key).

2. **Load balancer picks a pod**  
   Any healthy app server can handle her. That is fine, because the count will not live only in that pod's memory.

3. **Auth first (usually)**  
   App verifies she is Priya. The rate key becomes something like `rl:user:priya123`, not only her IP. (You may still have a separate IP limit for bots that never log in.)

4. **Limiter check (the bouncer)**  
   App (or gateway plugin) calls Redis with the key, the rule (token bucket: capacity 20, refill about 100/60 per second), and cost 1. The Lua script:
   - reads current tokens and last refill time,
   - adds tickets for time passed (capped at capacity),
   - if tokens ≥ 1, subtracts 1 and allows,
   - else denies and computes a small retry delay.

5. **Allow path**  
   Request continues to business logic, maybe hits the weather service, returns 200. Response headers can say how many tickets remain so her SDK can slow down before the next deny.

6. **Deny path**  
   Request never burns expensive work. Client gets **429**, a `Retry-After` hint, and remaining = 0. Honest clients wait. Abusive clients still get slowed by the shared notebook across all pods.

7. **Observability**  
   Metrics count allows and denys. If denys spike for one key, on-call asks "is this a real outage, a product limit too tight, or a noisy client?" before someone "fixes" it by blindly raising the number.

That whole story is the system design of a rate limiter: **policy + algorithm + shared store + clear client feedback**.

---

## Where the bouncer stands (gateway reality)

You can place limits in more than one spot. Many teams use layers, like club security at the street, at the door, and at the VIP lounge.

| Placement | Strength | Weakness |
| --- | --- | --- |
| CDN / edge | Stops junk early | Coarse keys; little business context |
| API gateway | Plans per key, 429 plumbing ready | Weighted "this body costs 5" gets awkward |
| Service mesh (Envoy) | Per-route local limits | Local only means N × limit again unless global |
| App middleware | Full knowledge of user and product plan | Easy to forget on a new service |
| Library in each service | Fast for one team | Drift across languages |

Practical rule: **coarse IP limits at the edge**, **user or plan limits after auth**, **extra guards on expensive mutations** (password reset, bulk export). Gateways do not remove app limits. They stop every junior service from reinventing ticket math on day one.

Hierarchical stack example:

1. Per IP (abuse)
2. Per user (fairness)
3. Per tenant route (product)
4. Global circuit on a fragile dependency

Deny if **any** layer says no. Check cheap layers first when you can.

---

## A design you can defend in an interview

**Clarify first:**

- 100 requests per user per minute, burst 20.
- Works across 20 app instances.
- Prefer low latency; slight overshoot OK if Redis hiccups.
- Return 429 with retry guidance.

**Propose:**

1. Key: `rl:user:{userId}` (hash-tagged if Redis Cluster).
2. Algorithm: token bucket, capacity 20, refill 100/60 tokens per second.
3. Storage: Redis primary, atomic Lua, Redis time for refill.
4. Placement: gateway for coarse IP; app (or gateway plugin calling Redis) for user quotas after auth.
5. Failure: short local fail-open with a hard local cap; alarm on Redis errors.
6. Observability: allow/deny counters, remaining histogram, top denied keys.

**Say the trade-offs out loud:**

- Fixed window is simple but edge-bursty.
- Sliding log is exact but heavy.
- Token bucket matches product language (burst + sustained).
- Perfect global exactness under network split is expensive; approximate with a chosen fail mode is normal engineering.

---

## Production checklist

- [ ] Keys include user/tenant/route, not only IP
- [ ] Atomic update path (Lua or equivalent), no naive read-then-write races
- [ ] Cluster hash tags if multi-key scripts
- [ ] Shared or monotonic clock source
- [ ] 429 + Retry-After + remaining headers documented
- [ ] Fail-open or fail-closed chosen per surface
- [ ] Load test with N instances and one hot key
- [ ] Dashboards for deny rate and Redis errors
- [ ] Separate limits for login, password reset, and expensive mutations
- [ ] Runbooks for "raise limit" vs "find the noisy client"

---

## Recap for a friend

A rate limiter is a **bouncer for your API**. It exists so one guest does not hog the room (**fairness**), so your cloud bill does not explode (**cost**), and so bots do not hammer you for free (**abuse**).

Two pictures stick:

1. **Token bucket:** a jug of tickets that refills slowly. Short lines of people can enter if tickets are saved up. Long term you never go faster than the refill rate.
2. **Sliding window:** only count what happened in the last stretch of time as the window rolls forward. Exact guest lists are fair but heavy; two blended counters are usually enough.

Many servers each with a **private notebook** quietly multiply your limit. One **shared notebook** (often Redis) keeps the real budget. Walk a request as: client → load balancer → auth → shared check → allow into real work or 429 with "try later."

If you remember one production lesson: **shared counters beat clever local math**, and **clocks will lie** unless you force a single time source. Start with token bucket or sliding window counter on Redis, put coarse limits at the edge, keep product quotas next to auth, and measure denys before you "fix" them by cranking the number.