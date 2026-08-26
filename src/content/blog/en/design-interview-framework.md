---
title: "A Practical Framework for System Design Interviews"
description: "A scared-candidate checklist for system design interviews: ask first, plan the boxes, then add detail. Plain English steps, sample dialogue, and a reusable time budget for 45-60 minutes."
date: "2026-01-22"
tags: [System Design & Architecture]
coverImage: /assets/images/design-interview-framework.webp
previewImage: /assets/images/design-interview-framework.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** A scared-candidate checklist for system design interviews: ask first, plan the boxes, then add detail. Plain English steps, sample dialogue, and a reusable time budget for 45-60 minutes.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Nobody expects you to rebuild Google Search in 45 minutes. The interviewer is not waiting for a perfect diagram. They want to see how you turn a fuzzy prompt into a clear problem, how you plan before you polish details, and whether you treat them like a teammate.

If that still sounds scary, use a picture you already know.

**Doctor visit:** the doctor asks what hurts, how long it has been going on, and what you tried. Only then do they order tests or prescribe medicine. Jumping straight to surgery without questions is malpractice.

**Home remodel:** a good contractor measures the room, asks how many people live there, and checks the budget before picking tile. Drawing a fancy kitchen on minute one, then learning the house has no plumbing for a sink, wastes everyone's time.

A **system design interview** works the same way. "System design" just means: plan how the pieces of a product talk to each other so it can handle real users. You ask questions first. You plan the big shape second. You add hard detail third. This post is that process written so a nervous candidate can follow it step by step.

---

## What the interviewer is actually scoring

Think of it as a short working meeting on an open problem, not a quiz with one correct whiteboard.

| Signal | What it looks like in plain English |
| --- | --- |
| Handling fuzzy problems | You ask scoped questions before you draw |
| Working together | You say your assumptions out loud and change course when they correct you |
| Picking what matters | You spend time on the hard path, not every optional feature |
| Trade-off talk | You name cost, speed, safety, and how hard the system is to run |
| Avoiding red flags | No silent monologue, no "perfect system," no microservices on minute one |

**Trade-off** means a choice where you gain one thing and give up another. Example: a copy of the data on many machines can make reads faster, but those copies may not all update at the exact same moment.

Red flags interviewers notice fast:

- Drawing ten boxes before you know who the product is for
- Polishing a tiny detail while the main user flow is still blank
- Refusing rough numbers when size would change the plan
- Declaring the design "done" without talking about what breaks

---

## Soft clock for a 45-minute loop

This is a guide, not a law. If the interviewer wants to stay high level, stay high level. If they pull you into one hard corner, that corner is the job for that day.

| Phase | Minutes | Goal |
| --- | --- | --- |
| 1. Clarify and freeze scope | 3-10 | Features, users, limits, what you will not build |
| 2. Rough size (when it helps) | 2-5 | Order-of-magnitude load and storage |
| 3. High-level plan and buy-in | 10-15 | Big boxes, main flows, simple agreements |
| 4. Detail work on hard parts | 10-25 | Data shape, speed, failures, the real bottleneck |
| 5. Wrap | 3-5 | Risks, monitoring, what breaks at 10x, open questions |

**High-level** means the map of major pieces (client, servers, database, cache), not every line of code. **Bottleneck** means the first place that will choke when traffic grows.

---

## Step 1: Clarify requirements (the doctor questions)

Do not be the candidate who blurts a full architecture before knowing who uses the product. Slow down. When the interviewer says "you decide," write your assumptions where both of you can see them.

### Product questions (start here)

1. What must work in version one? What can wait?
2. Who uses it: consumer app, company tool, or public API?
3. More reads, more writes, or mixed? (A **read** is loading data. A **write** is creating or changing data.)
4. Must updates show up instantly, or is a short delay OK?
5. Mobile, web, or both? Login required?
6. Text only, or images and video too?
7. One region for the interview, or worldwide from day one?

### Quality and scale questions

1. About how many daily active users, and how fast will that grow?
2. Average load vs busy-hour peak?
3. How fast should the main action feel (rough target is fine)?
4. When speed and perfect consistency fight, which wins for this product?
5. How long do we keep data? Any privacy rules (delete-my-account style)?
6. Should we assume tools the company already runs (a common database, a cache, a message queue)?

**API** means the set of requests clients send to the backend (for example: create a post, list a feed). **Cache** means a fast temporary store so you do not hit the main database for every request. **Queue** means a waiting line for work that can happen a moment later (send email, resize image).

### Scope discipline

Say out loud what you will **not** design today. Full ranking machine learning for a news feed, global multi-writer databases, or a long theory lecture usually burns time without earning points. Name those items, park them, move on unless the interviewer reopens them.

### Mini example: "Design a news feed"

- App: mobile and web
- Version one: publish a post, read friends' posts in reverse time order
- Ranking algorithms: later, unless they ask
- Friends per user: about 5,000
- Traffic: about 10 million daily active users
- Media: images and short video allowed

That conversation alone stops you from building the wrong product.

---

## Step 2: Rough capacity (back-of-the-envelope size)

You do not need perfect math. You need credible orders of magnitude so the design is not a toy.

**QPS** means queries per second: how many requests hit the system each second. **Order of magnitude** means "about 100, not about 100,000," not a finance spreadsheet.

Keep these rough tools in your head:

| Quantity | Rule of thumb |
| --- | --- |
| Seconds in a day | about 100,000 (close enough for interview math) |
| Requests per day to average QPS | divide by about 100,000; peak is often 2x-5x average |
| Storage | number of items × average size, then add room for copies and indexes |
| Bandwidth | QPS × size of a typical response |

Say the shape out loud:

```
10M daily active users
Assume 5 feed reads per user per day → 50M reads per day
50 million / 100,000 ≈ 500 average read QPS
Peak maybe 2,000-3,000 read QPS (pick a factor and stick to it)

Assume 1 post per user per day → 10M writes per day ≈ 100 average write QPS
```

If the numbers change the plan (one database is not enough, a cache becomes required, video needs object storage), say so. If they do not change anything, keep the math short and move on. Ask whether they want the numbers before you spend five minutes on them.

For a fuller toolkit, see [back-of-the-envelope estimation](/blog/en/design-back-of-envelope-estimation).

---

## Step 3: High-level design and get buy-in (the remodel plan)

Draw boxes. Walk one happy path from start to finish. Treat the interviewer as a co-designer: pause for feedback before you invent six separate services.

### Common building blocks (what the boxes mean)

| Piece | Why it shows up |
| --- | --- |
| Client (web or mobile) | Where the user taps or types |
| Load balancer / API gateway | Front door: spreads traffic, often handles login checks and limits |
| App / API services | Business rules live here |
| Primary database | Source of truth for lasting data |
| Cache | Hot reads without hammering the database |
| CDN / object store | Static files and media (photos, video) near users |
| Queue / stream | Async work: fan-out, emails, thumbnails |
| Search index | Query patterns the main database hates |
| Workers | Background jobs that process the queue |

**Load balancer** spreads requests across healthy servers. **CDN** is a network of edge caches that serve static content from a location near the user. **Async** means "do it soon, not necessarily in this same request."

### How to present it

1. Sketch clients → front door → services → data stores.
2. Trace the two or three critical use cases (create, main read path, maybe delete).
3. Call out whether reads or writes dominate.
4. Propose APIs only when the problem is small enough (URL shortener, rate limiter). For "design Google Search," stay coarser.
5. Ask: "Does this match the scale and features we agreed?" Fix it before detail work.

### News feed shape (high level only)

- **Publish path:** client → API → save post metadata → job that updates friends' feeds (or marks them dirty).
- **Read path:** client → API → load a prepared feed (or build it on read) → fill in post content from cache or database → return a page.

Two flows keep the whiteboard honest. One giant box labeled "Feed Service" does not.

---

## Step 4: Detail work on the parts that earn signal

You already share goals, a high-level sketch, and interviewer feedback. Now pick the sharp edges.

### Good targets by problem type

| Problem | Worth digging into | Easy time sinks |
| --- | --- | --- |
| URL shortener | How IDs are made, short codes, redirect type, cache keys | Fancy link preview UI |
| Rate limiter | Algorithm choice, how keys live in Redis, multi-server fairness | Perfect global math on every edge case |
| Chat | Delivery guarantees, online status, message order | Full end-to-end encryption product design |
| News feed | Push vs pull for friends' posts, ranking inputs, media pipeline | Recreating a full social ranking model |
| Drive / storage | File chunks, upload consistency, conflict when two devices edit | Pixel-perfect web client |

### Detail checklist (pick 2-4)

1. **Data model:** main entities, keys, indexes, how you split data across machines if needed.
2. **API contracts:** safe retries (**idempotency** means repeating a request does not double-create), pagination, clear errors on the hot path.
3. **Consistency:** strong where money or login is involved; eventual is fine where feeds and counters can lag a moment.
4. **Caching:** what is cached, how long it lives, how you clear it, how you avoid a stampede when it empties.
5. **Async paths:** queues, retries, dead letters (failed jobs that need human or special handling), honest "at least once" delivery language.
6. **Bottlenecks:** hottest QPS, largest objects, single-leader limits.
7. **Failure modes:** server dies, network splits, cache empty, queue piles up.
8. **Security (brief unless asked):** login, abuse limits, private data boundaries.

Time rule: if a detail does not change correctness or scale for this prompt, park it. Mention it exists, offer to go further, wait for a nod.

---

## Step 5: Wrap without declaring perfection

Never end with "and that is the complete design." Leave room for critique.

1. **Recap** the architecture in about 30 seconds (especially if you explored alternatives).
2. **What breaks first at 10x traffic**, and what you would change.
3. **Operations:** metrics (latency, error rate, queue depth, cache hit rate), logs, alerts, careful rollout (feature flags, small canary releases).
4. **Failure playbook:** primary database failover, read-only mode, poison messages in a queue.
5. **Open items** if you had another hour: multi-region, better ranking, cost cuts, deletion jobs for privacy rules.

Interviewers remember candidates who can criticize their own design without collapsing it.

---

## Sample dialogue (plain English)

**Interviewer:** Design a news feed.

**You:** Before boxes, I want scope. Mobile only or both? Is ranking in version one, or reverse time order is enough?

**Interviewer:** Both clients. Reverse chrono for v1 is fine.

**You:** I will assume about 10 million daily active users, roughly 5,000 friends per user, and posts can include images. Correct me if wrong.

**Interviewer:** Sounds good.

**You:** Rough size: if each user reads the feed five times a day, that is about 500 average read QPS, maybe a few thousand at peak. Writes are much lower if people post once a day. That points to a read-heavy design with a cache on the hot path.

**Interviewer:** OK.

**You:** High level: publish path writes the post, then a background job helps build friends' feeds. Read path loads a prepared feed page and fills post bodies from cache or the database. Does that match what we agreed?

**Interviewer:** Yes. How do you handle celebrities with millions of followers?

**You:** That is the hard corner. For normal users I can push feed entries on write. For huge accounts I pull on read so one post does not explode into millions of writes. Trade-off: celebrity feeds cost more work at read time.

**Interviewer:** What fails first at 10x?

**You:** Feed cache and the fan-out workers. I would split feed storage, add backpressure on the queue, and watch queue depth and cache hit rate. If we had more time I would talk multi-region and stronger ranking.

That conversation is the framework. You never needed a perfect diagram to sound like a calm engineer.

---

## Do / Don't list

**Do**

- Ask clarifying questions early and often.
- Write assumptions where both of you can see them.
- Start high level; add detail only after buy-in.
- Design the critical path first.
- Offer two options when a real trade-off exists (for example push vs pull fan-out).
- Think out loud. Silence is hard to score.
- Ask for a hint if stuck. Collaboration beats frozen pride.
- Keep going until the interviewer ends the session.

**Don't**

- Sprint to a solution with undefined requirements.
- Turn a small product into a worldwide multi-writer system on day one.
- Sink 15 minutes into one micro-optimization while the data model is blank.
- Ignore size numbers that contradict your diagram.
- Pretend the design has no failure modes.
- Argue past clear interviewer guidance.

---

## Reusable interview checklist

Copy this into notes. Run it top to bottom when you are nervous.

```
[ ] Restate the problem in one sentence
[ ] Version-one features only
[ ] Non-functional targets (users, QPS, latency, consistency)
[ ] Explicit out-of-scope list
[ ] Assumptions written and confirmed
[ ] Rough capacity (QPS, storage, bandwidth) if it affects design
[ ] High-level diagram: clients, front door, services, data, async
[ ] Trace happy paths for top use cases
[ ] API or schema only if the problem size warrants it
[ ] Get explicit buy-in before detail work
[ ] Detail 1: data model / IDs / storage
[ ] Detail 2: hot path performance (cache, fan-out, sharding)
[ ] Detail 3: consistency, failures, or ops (pick what they care about)
[ ] Call out bottlenecks and 10x scale changes
[ ] Monitoring, rollout, known risks
[ ] Recap + invite feedback
```

---

## Explain it to a friend

A system design interview is not "draw every server in the company." It is a short planning meeting under a timer.

1. **Ask first**, like a doctor: who uses it, what version one must do, how big, what you will skip.
2. **Size it roughly** so you know if one database is a toy or a real risk.
3. **Draw the remodel plan**: a few big boxes and the main user paths. Get a nod.
4. **Zoom into the hard corners** the interviewer cares about: data, speed, failures.
5. **Close with honesty**: what breaks first, how you would watch it, what you would do with more time.

Practice that skeleton on three different problems (storage, realtime chat, read-heavy feed) until the transitions feel automatic. The goal is not a pretty diagram. The goal is a design conversation that would not embarrass you with a senior engineer on your first week.

If you want the full growth path before more interview prompts, start with [scale from zero to millions](/blog/en/design-scale-zero-to-millions). For a practice order across this series, see the [learning path](/blog/en/design-interview-learning-path).