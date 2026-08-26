---
title: "Keep Learning System Design: Building Blocks, Practice Order, and This Series"
description: "After the classic interview designs, learn the reusable building blocks in plain English, follow a beginner practice order, and use this blog series as your study map."
date: "2026-01-30"
tags: [System Design & Architecture]
coverImage: /assets/images/design-interview-learning-path.webp
previewImage: /assets/images/design-interview-learning-path.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** After the classic interview designs, learn the reusable building blocks in plain English, follow a beginner practice order, and use this blog series as your study map.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

You finished the list. Rate limiter. URL shortener. Feed. Chat. Drive. Video. It feels like a finish line.

Then a new prompt shows up with a different product name, and the same few ideas walk back into the room. That is not a failure. That is the lesson.

**The designs were practice problems. The building blocks are the real course.**

This post is a study plan for after that first pass. I will keep it plain. One sentence per block. A practice order that compounds. Links into this series so you always know what to open next. Think of me as a patient professor: no hype, just a map you can actually follow.

If the interview process still feels fuzzy, start with the [interview framework](/blog/en/design-interview-framework) and [back-of-the-envelope estimation](/blog/en/design-back-of-envelope-estimation). If you have never walked a single server into a multi-region sketch, do [scale from zero to millions](/blog/en/design-scale-zero-to-millions) once with a timer.

---

## What "ready" actually means

You are not ready because you can redraw one architecture from memory. You are in good shape when you can:

1. **Name the blocks** a design needs before you draw boxes.
2. **Explain why** a block is in or out for this product.
3. **Swap tools** (Redis vs Memcached, Kafka vs SQS, hash vs range shard) without rewriting the whole story.
4. **Estimate roughly** (QPS, storage, bandwidth) before you invent services.
5. **Defend two or three trade-offs** out loud under mild pushback.

Interviews reward that muscle. Real on-call work rewards it more.

---

## Building blocks (one plain sentence each)

Most product designs are remixes of a small set of ideas. Learn these cold. Every new prompt gets shorter.

### Load balancer

A **load balancer** sits in front of many servers and sends each request to a healthy one so no single box has to take all the traffic.

### Cache

A **cache** stores a hot copy of data close to the app so most reads never hit the slow primary database.

### Shard

A **shard** is one slice of a dataset (or write load) so many machines share work that one machine could never hold forever.

### Queue

A **queue** holds work for later so the user request does not wait on email, encoding, fan-out, crawl, or a flaky third-party API.

### Replica

A **replica** is an extra copy of data used for failover and often for extra read capacity when one copy is not enough.

### Bonus idea: consistency vs availability

When the network breaks between machines, you often cannot promise perfect agreement and perfect uptime on the same path at the same time, so you choose per feature which pain you accept.

You do not need CAP theorem slogans on every slide. You need a calm sentence: "For checkout I prefer stronger consistency. For a social feed I can live with a short delay."

---

## How the blocks show up in the series

You do not need every cell filled on a whiteboard. You need to know which cells carry the load for the prompt in front of you.

| Design | Load balance | Cache | Shard | Queue | Replica |
| --- | --- | --- | --- | --- | --- |
| [URL shortener](/blog/en/design-url-shortener) | redirect tier | hot codes | by code | analytics later | mapping store |
| [Rate limiter](/blog/en/design-a-rate-limiter) | gateway | Redis state | by key | rare | Redis HA |
| [News feed](/blog/en/design-news-feed-system) | API + workers | timeline | by user | fan-out jobs | graph + posts |
| [Chat](/blog/en/design-chat-system) | connection servers | presence | by conversation | offline push | message store |
| [Search autocomplete](/blog/en/design-search-autocomplete) | query tier | prefix cache | dictionary | rebuild jobs | index copies |
| [YouTube-style](/blog/en/design-youtube-streaming) | CDN + API | thumbs, manifests | video / user | transcode | object store |
| [Google Drive-style](/blog/en/design-google-drive) | upload edges | metadata | by owner / file | scan, index | metadata + blobs |

Deeper patterns for individual blocks:

- Caching: [Redis caching patterns](/blog/en/redis-caching-patterns)
- Async work: [event-driven architecture](/blog/en/event-driven-architecture-intro)
- Live connections: [WebSockets basics](/blog/en/websockets-realtime-basics)

---

## Practice order for beginners

Random hopping feels productive until it does not. This order builds prerequisites first. Adjust if a section is already strong for you.

### Phase 0: Process and numbers (1 to 2 sessions)

1. [Interview framework](/blog/en/design-interview-framework): requirements, API, data, high level, detailed technical breakdowns, wrap-up.
2. [Back-of-envelope estimation](/blog/en/design-back-of-envelope-estimation): QPS, storage, bandwidth, rough machine counts without fake precision.
3. [Scale zero to millions](/blog/en/design-scale-zero-to-millions): vertical scale, load balancer, cache, replica, shard as one story.

### Phase 1: Core data-plane blocks (3 to 5 sessions)

4. [Consistent hashing](/blog/en/design-consistent-hashing)
5. [Key-value store](/blog/en/design-key-value-store)
6. [Unique ID generator](/blog/en/design-unique-id-generator)
7. [Rate limiter](/blog/en/design-a-rate-limiter)
8. [URL shortener](/blog/en/design-url-shortener)

Why this order: hashing and key-value ideas keep reappearing. IDs show up in almost every write path. Rate limiting teaches shared counters under messy clocks. The URL shortener is the first full product that still fits a 45-minute run.

### Phase 2: Async and social graphs (4 to 6 sessions)

9. [Web crawler](/blog/en/design-web-crawler)
10. [Notification system](/blog/en/design-notification-system)
11. [News feed](/blog/en/design-news-feed-system)
12. [Chat system](/blog/en/design-chat-system)
13. [Search autocomplete](/blog/en/design-search-autocomplete)

Here queues, fan-out, presence, and prefix structures stop being abstract. Pair chat with [WebSockets basics](/blog/en/websockets-realtime-basics) if connection state still feels magical.

### Phase 3: Heavy media and files (2 to 3 sessions)

14. [YouTube-style streaming](/blog/en/design-youtube-streaming)
15. [Google Drive-style](/blog/en/design-google-drive)

These force CDN thinking, object storage, chunked upload, encoding pipelines, and metadata consistency. Do them after you can already tell a clean story about queues and replication.

---

## How to practice each design

Use the same loop every time. Boring loops win.

1. **Timer on** (35 to 45 minutes). Speak out loud even alone.
2. **Requirements first.** What is in scope? What is out?
3. **Numbers early.** Even rough ones change the design.
4. **One high-level diagram.** Then deep-dive only two or three hot spots.
5. **Write three trade-offs** at the end, not ten.
6. **Next day, redraw from blank** with no notes. Gaps become your study list.

Optional stretch: build a tiny version of one block (token bucket in Redis, a short code service, a simple fan-out worker). Interviews care about judgment more than code, but shipping a block once kills a lot of hand-waving.

---

## Series map (this blog)

| Order | Topic | Link |
| --- | --- | --- |
| 1 | Scale from zero to millions | [design-scale-zero-to-millions](/blog/en/design-scale-zero-to-millions) |
| 2 | Back-of-envelope estimation | [design-back-of-envelope-estimation](/blog/en/design-back-of-envelope-estimation) |
| 3 | Interview framework | [design-interview-framework](/blog/en/design-interview-framework) |
| 4 | Rate limiter | [design-a-rate-limiter](/blog/en/design-a-rate-limiter) |
| 5 | Consistent hashing | [design-consistent-hashing](/blog/en/design-consistent-hashing) |
| 6 | Key-value store | [design-key-value-store](/blog/en/design-key-value-store) |
| 7 | Unique ID generator | [design-unique-id-generator](/blog/en/design-unique-id-generator) |
| 8 | URL shortener | [design-url-shortener](/blog/en/design-url-shortener) |
| 9 | Web crawler | [design-web-crawler](/blog/en/design-web-crawler) |
| 10 | Notification system | [design-notification-system](/blog/en/design-notification-system) |
| 11 | News feed | [design-news-feed-system](/blog/en/design-news-feed-system) |
| 12 | Chat system | [design-chat-system](/blog/en/design-chat-system) |
| 13 | Search autocomplete | [design-search-autocomplete](/blog/en/design-search-autocomplete) |
| 14 | YouTube-style streaming | [design-youtube-streaming](/blog/en/design-youtube-streaming) |
| 15 | Google Drive-style | [design-google-drive](/blog/en/design-google-drive) |
| 16 | This learning path | [design-interview-learning-path](/blog/en/design-interview-learning-path) |

Supporting posts that sharpen the edges:

- [How DNS works](/blog/en/how-dns-works-for-engineers)
- [How HTTPS and TLS work](/blog/en/how-https-tls-works)
- [OAuth 2.0 for developers](/blog/en/oauth2-for-developers)
- [Redis caching patterns](/blog/en/redis-caching-patterns)
- [Event-driven architecture](/blog/en/event-driven-architecture-intro)
- [WebSockets for real-time apps](/blog/en/websockets-realtime-basics)

---

## A simple weekly plan

If you have limited time, do not polish the plan. Ship the plan.

| Day | Focus | Output |
| --- | --- | --- |
| Mon | One block deep (cache or queue or shard) | One page of notes + failure modes |
| Wed | One full design from the series | Timed whiteboard or doc |
| Fri | Redraw the previous design cold | List of gaps only |
| Weekend (optional) | One real company eng blog | Three ideas you can reuse |

Four steady weeks beat twelve weekends of passive video.

---

## How to keep learning after the series

Whiteboard drills plateau. Stretch in three quiet directions.

**1. Read one real architecture per week.** Ask only: which blocks did they use, what failed at the last scale, and what did they refuse to do?

**2. Compare two designs that share a block.** Rate limiter vs unique ID generator both need care under multi-node writes. Feed fan-out vs notification fan-out both need queues and idempotency, but different latency budgets. Write five bullets on what transfers and what does not.

**3. Add a little operational depth.** Metrics (QPS, p99, queue lag, cache hit ratio), simple failure drills (kill a cache node, stall a consumer), and cost (when CDN beats clever code).

Teaching someone else is the fastest audit. If you cannot explain consistent hashing without looking at a diagram, you do not own it yet. That is fine. That is information.

---

## Recap for a friend

If you had to text this in one breath:

You finished a pile of system design problems. Those were reps, not the curriculum. The curriculum is five blocks: load balancer spreads traffic, cache speeds hot reads, shard splits data across machines, queue defers slow work, replica copies data for safety and reads. Learn the blocks, practice designs in order from process and numbers up to media systems, and keep a short weekly loop of study, timed design, and cold redraw. The series on this blog is one full path through that plan.

---

## Closing

System design skill is not "I memorized YouTube." It is "I can assemble load balancing, caching, sharding, queues, replication, and honest consistency choices under a new product story."

Start where you are weak. If numbers scare you, do estimation. If async confuses you, do crawler and notifications before Drive. If you freeze on structure, run the framework post twice with a timer.

Then keep going. Steady practice is enough. You do not need to be dramatic about it. You only need to show up for the next session.