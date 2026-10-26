---
title: "Design a News Feed System: Fan-out on Write, Fan-out on Read, and the Celebrity Problem"
description: "How social feeds are actually built: capacity math, push vs pull fan-out, the hybrid that Twitter-scale systems ship, Redis timelines, celebrity merging at read time, two-stage ranking, hydration, cursor pagination, and the failure modes of each path."
date: "2025-10-05"
tags: [System Design & Architecture, Backend & Databases]
coverImage: /assets/images/design-news-feed-system.webp
previewImage: /assets/images/design-news-feed-system.webp
---

> **TL;DR**
> * **The Problem:** A home feed has to show each user the newest and most relevant posts from hundreds of accounts they follow, in under 200 ms, for hundreds of millions of users, while some accounts have tens of millions of followers.
> * **The Design:** Precompute timelines by pushing post IDs into each follower's Redis list when a post is created (fan-out on write), except for very large accounts, whose posts are pulled and merged at read time. A feed service merges both sources, ranks candidates, hydrates post and user data from caches, and pages with cursors.
> * **The Result:** Feed reads become a cheap list lookup plus hydration, writes are absorbed asynchronously by workers, and the celebrity problem turns from a write storm into a small read-time merge.

The news feed is the system design problem that most rewards one specific insight. Everything else (caches, sharding, ranking) is supporting cast. The insight is this: **you have to decide when the work of assembling a feed happens, at write time or at read time, and the answer is "both, depending on who posted."**

This post builds the feed around that decision.

---

## Requirements and Numbers

**Functional:** users publish posts (text, images, video); users see a home feed of posts from accounts they follow, newest or most relevant first; infinite scroll.

**Non-functional:** feed load p99 under 200 ms; a new post appears in followers' feeds within seconds (not necessarily instantly); the system stays up when a celebrity posts.

| Assumption | Value | Derived |
| --- | --- | --- |
| Daily active users | 300M | |
| Feed loads per user per day | 10 | 3B reads/day, ~35k/s average, ~100k/s peak |
| Posts per day | 50M | ~600/s average |
| Average followers per author | 200 | 10B timeline inserts/day, ~115k/s |
| Timeline length kept | 800 post IDs x 8 bytes | ~6.4 KB/user, ~2 TB raw for all users before Redis overhead |

Two things jump out. Feed reads dominate request volume. But fan-out multiplies writes by follower count, so **timeline inserts, not post creation, are the biggest write workload.** Any design has to account for that.

Twitter published numbers of the same shape in 2012: around 300,000 timeline reads per second against roughly 6,000 tweets written per second, home timelines capped at 800 entries in Redis, and fan-out for accounts with tens of millions of followers taking minutes.

---

## The Core Decision: When Does the Feed Get Built?

| | Fan-out on write (push) | Fan-out on read (pull) |
| --- | --- | --- |
| When work happens | At post time, push the post ID into every follower's timeline | At read time, fetch recent posts from every followed account and merge |
| Read cost | One list read | N queries, one per followed account, plus merge |
| Write cost | One insert per follower | One insert |
| Freshness | Seconds of fan-out lag | Always fresh |
| Wasted work | Timelines built for users who never open the app | None |
| Breaks on | Celebrities with millions of followers | Users who follow thousands of accounts |

Neither pure approach survives contact with a real social graph. Push turns one celebrity post into tens of millions of writes. Pull turns every feed load into hundreds of queries.

**The hybrid** that production systems converge on: push for normal accounts, pull for a small set of very large ones, merge at read time. Twitter described exactly this. Facebook's Multifeed went further toward read-time assembly, with aggregator servers querying per-user activity stores when the feed is requested. Both are valid; the hybrid is the easier one to defend in an interview and to operate at moderate scale.

---

## The Publish Path

![News feed publish path: an author posts through the API gateway to the post service, which stores the post in a sharded posts database and emits a PostCreated event; fan-out workers page through the social graph and push the post id into each follower's Redis timeline, skipping authors with more than one million followers](/assets/images/hld/design-news-feed-publish.webp)

* **Author.** Publishes a post. Media uploads go straight to object storage first (presigned URLs); the post only references them.
* **API Gateway.** Authentication, rate limiting, request validation.
* **Post Service.** Assigns a time-ordered ID (Snowflake style, see the [unique ID post](/blog/en/design-unique-id-generator)), writes the post, and returns to the user immediately. It does not wait for fan-out.
* **Posts DB (sharded by id).** Source of truth for post content. Time-ordered IDs make "recent posts by author X" a cheap range query with an index on `(author_id, post_id)`.
* **PostCreated events.** A durable log decouples the user's request from the expensive fan-out. If fan-out falls behind, posting still works.
* **Fan-out Workers.** Consume events, page through the author's followers in batches of a few thousand, and push the post ID into each follower's timeline. Workers can skip followers who have not been active in weeks; their feeds get rebuilt on demand if they return.
* **Social Graph (followers).** A store optimized for "who follows X" and "whom does Y follow." Facebook's TAO is the canonical large-scale example. At smaller scale, a sharded table of edges with two indexes works.
* **Redis timelines.** One list per user of recent post IDs. `LPUSH` the new ID, `LTRIM` to 800. IDs only, never full posts, so a post edit or delete does not require touching millions of lists.

The red note is the celebrity rule: above a follower threshold (one million is a reasonable start), skip fan-out entirely and let readers pull.

---

## The Read Path

![News feed read path: the reader requests the feed through the gateway; the feed service reads pushed ids from Redis, pulls recent celebrity posts, sends candidates to a ranking service backed by a feature store, hydrates post and user data from caches, and returns media URLs served from a CDN](/assets/images/hld/design-news-feed-read.webp)

1. **Read pushed IDs** from the user's Redis timeline.
2. **Pull celebrity posts.** For the handful of large accounts the user follows, fetch their recent post IDs from a heavily cached "recent posts by author" store. Because many readers follow the same celebrities, this cache has an excellent hit rate.
3. **Rank.** Merge both lists into a candidate set (a few hundred posts) and send it to the ranking service, which scores candidates using features such as author affinity, post age, engagement so far and content type.
4. **Hydrate.** Fetch post bodies, author profiles and counters for the top results from caches in a single batched call.
5. **Return a page** with a cursor. Media URLs point at the CDN, so images and video never pass through the feed service.

The green note covers pagination, which is easy to get wrong. **Use cursors, not offsets.** With offsets, a new post arriving between page 1 and page 2 shifts everything by one, and users see duplicates. With a cursor ("posts older than ID X," or an opaque token encoding the ranker's position), pages are stable.

---

## Ranking, From Simple to Real

| Stage | Approach | What it costs |
| --- | --- | --- |
| Version 1 | Reverse chronological by post ID | Nothing. Time-ordered IDs make it free |
| Version 2 | Heuristic score: affinity x content weight x time decay | A few features per candidate; easy to explain |
| Version 3 | Two-stage ML ranking: cheap candidate generation, then a learned model over a few hundred candidates | Feature store, model serving, experimentation platform |

Facebook's early EdgeRank was a version-two heuristic of exactly this shape. Most large feeds today are version three. In an interview, start with version one, describe version two, and mention that version three exists. Do not design the ML system unless asked.

Whatever the ranking, keep it **out of the write path**. Ranking depends on the reader, the time of day and engagement that has not happened yet, so it belongs at read time.

---

## Data Model Sketch

| Store | Key | Value | Notes |
| --- | --- | --- | --- |
| Posts DB | `post_id` | author, text, media refs, created_at | Index on `(author_id, post_id)` for author timelines |
| Social graph | `(follower_id, followee_id)` | created_at | Two directions indexed: followers of X, followees of Y |
| Redis timeline | `timeline:{user_id}` | list of post IDs | Capped at 800; TTL for inactive users |
| Post cache | `post:{post_id}` | serialized post | Write-through on create, invalidated on edit or delete |
| Counters | `post:{post_id}:likes` | integer | Separate from post body; updated asynchronously |

---

## What Goes Wrong

| Problem | Symptom | Fix |
| --- | --- | --- |
| Celebrity posts | Fan-out queue backs up for minutes | Follower threshold; pull at read time |
| Hot post | One post's counters and cache key overloaded | Shard counters; local caching; approximate counts |
| Deleted post still visible | IDs remain in millions of timelines | Filter at hydration: missing or deleted posts are dropped |
| Fan-out lag | New posts appear late | Prioritize fan-out to recently active followers first |
| Redis node loss | Some timelines empty | Rebuild on demand by pulling from followed authors; Redis replicas |
| Users following thousands | Large pull merges if many are "celebrities" | Cap pulled authors; rely on push for the rest |
| Feed shows the same post twice | Offset pagination | Cursor pagination |

---

## Interview Wrap

A strong answer fits in this order:

1. Requirements and the read/write numbers, including the fan-out multiplier.
2. Push vs pull table, and why neither alone works.
3. Hybrid with a celebrity threshold.
4. Publish path with async fan-out workers and ID-only timelines.
5. Read path: merge, rank, hydrate, cursor.
6. One or two failure modes (celebrity, deletes).

---

## Production Checklist

- [ ] Fan-out is asynchronous; posting never waits for it
- [ ] Timelines store IDs only, capped in length, with TTL for inactive users
- [ ] Celebrity threshold configured and monitored (fan-out lag by author size)
- [ ] Inactive followers skipped during fan-out; on-demand rebuild works
- [ ] Hydration filters deleted, private and blocked content
- [ ] Cursor-based pagination
- [ ] Ranking isolated from the write path, with a chronological fallback if the ranker is down
- [ ] Dashboards: feed p99, fan-out queue lag, timeline cache hit rate, hydration batch size

---

## The Leftover

The feed is the place where your social graph's inequality becomes an engineering problem. Most people have a few hundred followers. A few have tens of millions. One design cannot serve both, so you build two and stitch them together at the last possible moment.

Somewhere in the fan-out queue right now there is a post from someone with ten followers, waiting behind a pop star. The hybrid exists so that post still shows up on time.

---

## Sources

* [High Scalability: The Architecture Twitter Uses to Deal with 150M Active Users, 300K QPS (Raffi Krikorian's talk)](https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/)
* [Bronson et al., "TAO: Facebook's Distributed Data Store for the Social Graph" (USENIX ATC 2013)](https://www.usenix.org/conference/atc13/technical-sessions/presentation/bronson)
* [Facebook Engineering: Serving Facebook Multifeed](https://engineering.fb.com/2015/03/10/production-engineering/serving-facebook-multifeed-efficiency-performance-gains-through-redesign/)
* [Redis documentation: lists (LPUSH, LTRIM)](https://redis.io/docs/latest/develop/data-types/lists/)
* Related in this series: [Design a Unique ID Generator](/blog/en/design-unique-id-generator), [Design a Chat System](/blog/en/design-chat-system), [Scale From Zero to Millions](/blog/en/design-scale-zero-to-millions)
