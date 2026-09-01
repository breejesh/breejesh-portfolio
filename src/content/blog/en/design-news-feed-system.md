---
title: "Design a News Feed System (Beginner Guide): Fan-out, Ranking, and Cache"
description: "A plain-language guide to social news feeds: fan-out on write vs read as mailbox stuffing vs checking the bulletin board, ranking, cache, and the celebrity problem."
date: "2025-10-05"
tags: [System Design & Architecture, Backend & Databases]
coverImage: /assets/images/design-news-feed-system.webp
previewImage: /assets/images/design-news-feed-system.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** A plain-language guide to social news feeds: fan-out on write vs read as mailbox stuffing vs checking the bulletin board, ranking, cache, and the celebrity problem.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Open Instagram, X, or Facebook. You do not get a blank page and a research assignment. You get a list: friends, photos, jokes, news. That list is the **news feed** (sometimes called a **home timeline**).

In system design interviews, the prompt sounds huge: "Design Facebook feed" or "Design Twitter timeline." It is not huge if you start from everyday life. A feed is closer to a **neighborhood bulletin board** and a **newspaper delivery route** than it is to magic.

This post teaches that design from zero. No assumed jargon. When a term shows up, we define it first.

---

## The everyday picture

Imagine your street has a wooden bulletin board at the corner.

- Neighbors pin notes: "Garage sale Saturday," "Lost cat," "New bakery."
- You walk over, read what matters, go home.

Now scale that up to millions of people, each with their own board, each following hundreds of "neighbors." Two hard questions appear:

1. **When** do we put a new note onto everyone's board?
2. How do we keep opening the app **fast** when the neighborhood is enormous?

Those two questions are the whole interview, dressed in engineering clothes.

---

## What the product actually needs

Before architecture, pin the product. Interviews reward people who clarify, not people who invent Kafka first.

**Must work**

1. A user can **publish** a post (text; photos and video usually stored elsewhere and linked by URL).
2. A user can **follow** people (or be friends) and see their posts on a home feed.
3. The home feed shows recent stories, usually newest first at first version.
4. Later options: likes, comments, mute, close friends, smarter ranking.

**Nice numbers to agree out loud** (examples, not law)

| Goal | Example target |
| --- | --- |
| Daily active users | About 10 million |
| Follows for a normal person | Up to a few thousand |
| Celebrity follows | Millions of followers |
| Publishing traffic | Thousands of posts per second at peak |
| Opening the feed | Much higher than publishing; this is the busy path |
| Feel of the feed | First page loads in a few hundred milliseconds |
| Freshness | New posts show up within seconds for normal accounts |

**Usually out of scope unless asked:** full ads auction, live video, Stories, "people you do not follow" Explore, encryption end to end. Say what you are *not* building so the hour stays on feed assembly.

Two flows matter more than anything else:

1. **Publish (write path):** someone posts; the system stores it and gets it toward followers' feeds.
2. **Home feed (read path):** someone opens the app; the system returns a page of stories ready to show.

---

## Fan-out: the one idea that decides everything

**Fan-out** means: "this one post needs to become visible to many people."

One author. Many followers. How do you spread the news?

There are two classic strategies. Remember them with the newspaper and the bulletin board.

### Fan-out on write: pre-stuff everyone's mailbox

Think of a newspaper carrier at 5 a.m.

When you publish, workers look up your followers and **drop a copy of the news into each follower's mailbox** (in software: into each follower's prebuilt feed list). When a follower opens the app, their feed is already waiting. Opening the mailbox is cheap.

In jargon this is **fan-out on write**, also called the **push model**.

**Why it feels great**

- Home feed reads are simple: "give me the next page of my list."
- For normal accounts (hundreds or a few thousand followers), it feels almost live.

**Why it hurts**

- Cost scales with follower count. One post from someone with 10 million followers tries to update 10 million mailboxes.
- People who never open the app still get mail stuffed for them. Wasted work.
- Super-popular accounts create a **write storm**.

### Fan-out on read: check the neighborhood when you open the app

Now flip the design.

When you publish, you only pin your note on **your own** board (store one post). When a follower opens the app, the system walks everyone they follow, collects recent notes, and merges them into a temporary list for that visit.

In jargon this is **fan-out on read**, also called the **pull model**.

**Why it feels great for publishing**

- Publish is cheap: write one post and stop.
- No wasted work for inactive users.

**Why it hurts when reading**

- Opening the app does heavy lifting: many sources to fetch and merge.
- If you follow hundreds of active people, merge cost and latency climb.
- Hitting a tight "feels instant" budget needs careful caching.

### One sentence comparison

| Style | Everyday image | Hard moment |
| --- | --- | --- |
| Fan-out on write | Pre-stuff every mailbox at publish time | Celebrity publishes |
| Fan-out on read | Walk every neighbor's board when you open the app | User follows many busy accounts |

Most real systems land on a **hybrid**. We cover that after the celebrity problem, because the hybrid exists mainly to solve that problem.

---

## The celebrity problem (gently)

A **celebrity account** is not "someone famous." In this design it means **an account with a huge follower count**: a pop star, a sports team, a news brand, a viral meme page.

Picture the newspaper carrier again.

- Your cousin posts a photo. She has 80 followers. Stuffing 80 mailboxes is fine.
- A celebrity posts a photo. They have 20 million followers. Stuffing 20 million mailboxes for one photo is like asking one carrier to deliver the city newspaper door to door **right now**, every time that person sneezes online.

What goes wrong if you only use fan-out on write for celebrities?

1. **Publish feels slow or the queue explodes.** Millions of tiny updates pile up.
2. **Cache machines melt.** Hot keys and write amplification concentrate pain.
3. **Quiet users still get stuffed.** Most of those 20 million people are not online this second.

So production systems treat celebrities differently. They do **not** pre-stuff every mailbox for mega-accounts. They store the celebrity post once (or in a "posts by this author" list) and **pull it in when a follower opens the feed**.

That is not rudeness toward famous people. It is physics: write cost must not grow without bound for one action.

A simple rule of thumb interviewers like:

- Followers under a threshold (say 10,000): push into follower timelines.
- Followers above the threshold: write the post, mark the author as a **pull source**, merge on read.

You can move the threshold later after measuring fan-out lag and home-feed latency. The idea matters more than the exact number.

---

## Hybrid: the design most teams ship

| Account type | What happens on publish | What happens when a follower opens the feed |
| --- | --- | --- |
| Normal | Fan-out on write into followers' mailbox lists | Read the prebuilt list |
| Celebrity / mega | Store the post; do not mass-push | Merge prebuilt list **with** recent posts from followed celebrities |

Sketch of a read merge (conceptual):

```
normal_ids   = last items from my prebuilt timeline
celeb_ids    = recent posts from each celebrity I follow
merged       = sort both by time (newest first)
page         = take the first N items, remember a cursor for "next page"
```

That hybrid keeps everyday publish work bounded and keeps everyday open-app work light, while still showing celebrity posts without stuffing the whole planet.

---

## Who follows whom: the graph

You need a reliable list of relationships:

- Who follows me? (needed for fan-out on write)
- Who do I follow? (needed for fan-out on read / celebrity merge)
- Did I mute or block someone? (filter both write and read)

Call this the **follow graph** or social graph. It can live in a normal database with good indexes, a graph database, or a wide-column store. Interview detail that matters:

- Cache hot follower and followee lists.
- Apply mute, block, and privacy (for example close-friends-only) **before** you fan out, so you do not write posts into timelines that must never see them.

Think of the graph as the **address book for newspaper delivery**. Wrong addresses mean wrong mailboxes.

---

## What you store in a "mailbox" (timeline)

Do **not** copy the full post body into every follower's list. Copy a **pointer**: usually the post id and a score (often time).

Why?

- One funny video caption does not need to live in 50,000 copies of text.
- Bodies live once in a post store (and a post cache). Timelines only hold ids.

Redis-style mental model for a pushed timeline:

```
timeline for user U = ordered list of post_ids (newest near the top)
keep only the last few hundred or thousand ids
older history can fall back to a durable store or be rebuilt if needed
```

The timeline is a **derived view**, like a personalized table of contents. The posts table is the source of truth for content.

---

## Cache in plain language

A **cache** is a fast shelf of answers you expect to need again soon. Disk and complex joins are the back warehouse. The feed path wants the shelf.

Useful shelves for a feed:

| Shelf | What sits there | Why |
| --- | --- | --- |
| Timeline cache | Ordered post ids per user | Home open should not rebuild from scratch |
| Post cache | Text, media links, author id | Many users see the same viral post |
| User cache | Name, avatar | Same author appears on many cards |
| Graph cache | Followers / followees / mutes | Fan-out and merge need these fast |
| Counters | Like and comment counts | Cheap numbers updated often |

**CDN** (content delivery network) sits outside those shelves for the actual photo and video **bytes**. Your feed API should return URLs, not stream megabytes of video through the app servers.

Memory tip: ids-only timelines keep RAM about `users × timeline_length`, not `users × post_body_size`. Bodies are shared.

If you want a deeper cache toolkit after this post, see [Redis caching patterns](/blog/en/redis-caching-patterns).

---

## Ranking: chronological first, smarter later

**Ranking** means choosing order. Beginners can start with honesty:

### Version 1: reverse chronological

Newest first. Easy to explain. Easy to store (score = time). Good interview v1.

### Version 2: scored ranking

Production apps often re-order with signals:

- How recent is it?
- How close is the viewer to the author? (affinity)
- Is the post getting engagement?
- Is it a type the viewer likes (photo vs link)?
- Penalties: already seen, muted topics, spammy patterns

A tiny formula shape (not production ML):

```
score = recency + affinity + engagement - penalties
```

Where ranking usually runs:

- **Not** fully at publish time for every viewer (you do not know each viewer's context yet).
- **Often** at read time: take a candidate window of recent ids, re-score, apply light diversity (do not show five posts from the same person in a row), return a page.

For interviews: say chronological retrieval first, then optional re-rank on a small candidate set. Full machine-learning ranking is a separate career; name it, do not drown in it.

---

## Publish path, step by step

1. Check auth and rate limits (do not let one user flood the network).
2. Validate text and media ids.
3. Create a post id and **save the post durably** (database). This is the reliability line.
4. Put the post object into the post cache.
5. Enqueue fan-out work (async). Reply success to the client **after durable save**, not after every mailbox is stuffed.
6. Workers load eligible followers from the graph (privacy filters applied).
7. For normal followers, append the post id into each timeline cache.
8. For celebrity authors, skip mass push; keep a "posts by author" list for pull.
9. Optional: enqueue notifications ("Asha posted") on a separate path.

Why async fan-out? Users accept "your post is saved, friends will see it in a second." They do not accept a 30-second spinner because a celebrity-scale graph is updating.

That async handoff is the same family of thinking as [event-driven architecture](/blog/en/event-driven-architecture-intro).

---

## Home feed path, step by step

1. Auth, then feed service.
2. Load candidate post ids from `timeline:{me}`.
3. If the user follows celebrities, merge celebrity recent posts.
4. Paginate with a cursor (opaque token meaning "continue after this score").
5. **Hydrate**: batch-load post bodies and author profiles (multi-get, not one query per card).
6. Attach counters if needed.
7. Optional ranking pass.
8. Return JSON. Client loads media from CDN using URLs in the JSON.

Hydration is where beginner implementations quietly die: looping "fetch this post, then that post" creates an N+1 storm. Always batch.

---

## Simple data model sketch

**Posts**

| Field | Role |
| --- | --- |
| post_id | Primary key |
| author_id | Who wrote it |
| text | Capped size |
| media_ids | Links to media service / CDN |
| visibility | public / followers / close friends |
| created_at | Time order and pagination |
| deleted_at | Soft delete |

**Edges (follows)**

| Field | Role |
| --- | --- |
| follower_id | Who follows |
| followee_id | Who is followed |
| state | active / muted / blocked style flags |

Unique pair `(follower_id, followee_id)`. Index both directions so you can answer "followers of A" and "followees of B" without table scans.

---

## Things that go wrong (and calm fixes)

| Problem | Calm fix |
| --- | --- |
| Celebrity publish melts fan-out | Hybrid pull; never push to millions of timelines in the request thread |
| Deleted post still shows as an id | Soft-delete flag; hydration drops it; optional background scrub |
| Unfollow but old posts remain | Accept until they scroll off, or background-remove that author from the timeline |
| Mute / block ignored | Filter at destination selection and at read |
| Viral post cache stampede | Single-flight load of the post object; warm cache on publish |
| Fan-out lag | Watch queue depth and time-to-deliver; add workers |
| Multi-region complexity | Durable posts replicate; timelines often regional with careful failover |

Consistency for feeds is usually **eventual** for delivery: the post row is solid; timelines catch up. You do not promise every follower sees the same millisecond worldwide.

---

## Tiny capacity intuition (say it out loud)

With about 10 million daily active users:

- If people open the app often and each open shows many cards, **read path dominates**.
- Pure pull for everyone who follows hundreds of active authors gets expensive fast. Push helps the common case.
- Timeline memory is large even with ids only: many users × hundreds of ids × bytes per entry. Cap list length. Shard the cache.

These are discussion numbers, not a finance plan. Adjust with the interviewer.

---

## What to watch in production

- Publish success and time-to-durable-write.
- Fan-out queue lag, especially bucketed by follower-count size.
- Home feed latency (median and slow tail) and cache hit rates.
- Hydration misses that hit the database.
- Share of pure-push pages vs hybrid merge pages.
- Rate of missing or deleted ids in the feed (should stay low).

Protect publish with limits so one spammer cannot burn the fan-out fleet. See [design a rate limiter](/blog/en/design-a-rate-limiter).

---

## Recap for a friend

If you had thirty seconds at coffee:

A news feed is each person's personalized list of stories from people they follow. The hard choice is **when** you build that list.

**Fan-out on write** is pre-stuffing every follower's mailbox when someone posts. Opening the app is easy; celebrity posts can explode the post office.

**Fan-out on read** is only storing the post once, then gathering from everyone you follow when you open the app. Publishing is easy; busy follow lists make open slow.

**Hybrid** pushes for normal accounts and pulls for celebrities so neither path melts.

**Cache** keeps hot timelines, posts, and profiles on a fast shelf. **Ranking** can start as newest-first and later re-score a small candidate set. Timelines store **ids**, not full copies of every caption. Publish should succeed when the post is saved, while mailbox stuffing continues in the background.

That is the whole design, without the buzzword fog.

---

## Interview wrap

A strong answer has:

1. Clear product scope.
2. Two flows: publish and home.
3. A crisp **push vs pull vs hybrid** choice, with the celebrity problem named gently.
4. A follow graph.
5. Id-only timelines, multi-get hydration, and a cache map.
6. Chronological ranking first, scored ranking as an extension.

If time remains: scale the web tier horizontally, shard posts, multi-region read replicas, and why the feed is a derived index rather than one giant SQL join of "everything my friends ever wrote."

Related on this blog: [Redis caching patterns](/blog/en/redis-caching-patterns), [event-driven architecture](/blog/en/event-driven-architecture-intro), [design a rate limiter](/blog/en/design-a-rate-limiter).

