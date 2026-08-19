---
title: "Back-of-the-Envelope Estimation for System Design Interviews"
description: "Learn rough capacity math for interviews: QPS, storage, bandwidth, and latency with everyday analogies, one slow worked example, and a friend-level recap."
date: "2026-02-13"
tags: [System Design]
coverImage: /assets/images/design-back-of-envelope-estimation.webp
previewImage: /assets/images/design-back-of-envelope-estimation.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** Learn rough capacity math for interviews: QPS, storage, bandwidth, and latency with everyday analogies, one slow worked example, and a friend-level recap.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

You are hosting a party for about 30 friends. You do not need a catering spreadsheet. You ask: How many people will actually show up? How many slices does each person eat? Do people drink soda or water more? From that, you buy pizza and drinks. You might be off by a pie or two. That is fine. Buying 3 pizzas for 30 hungry adults is a disaster. Buying 40 is wasteful but survivable.

Or think of a weekly grocery run. You glance at the fridge, estimate how many meals you will cook, add a little buffer, and leave. You are not weighing every tomato. You are doing **order-of-magnitude** planning so you do not run out mid-week or fill the cart with food that will rot.

**Back-of-the-envelope estimation** is the same habit, applied to software. Before you draw twenty boxes on a whiteboard, you ask: How many requests hit us per second? How much data do we store? How fat are the responses leaving the network? Rough answers shape the design. Wrong by about 2x is usually okay. Wrong by 100x (forgetting peaks, or mixing megabytes with gigabytes) is what makes an interviewer wince.

This post teaches that skill from zero. No assumed interview polish. We start with *why*, then name the four numbers with kitchen and traffic analogies, then walk one photo app example slowly, arithmetic written out, and end with a short "explain it to a friend" recap.

---

## Why rough math matters before any formula

In a system design interview, the room is not grading long division. The room is checking:

1. **Do you let scale shape architecture?** A feed with 50 requests per second and a feed with 50,000 requests per second are different products, even if both are "a timeline."
2. **Do you separate average from peak?** Lunch hour and launch day are not the daily mean.
3. **Do you keep units honest?** "About 5" means nothing. "About 5 TB per year of photos" means something.
4. **Can you talk while you compute?** Interviews are narration plus numbers, not silent calculator work.

If you skip estimation, you often over-design (microservices and multi-region for a tool with 200 users) or under-design (one database for every photo view in the world). Five minutes of rough math prevents both.

You are **not** producing a finance-grade capacity plan. State assumptions out loud. Round aggressively. Move on when the order of magnitude is clear enough to pick an architecture direction.

---

## The four numbers, in plain language

Memorize the names. The formulas come after you can *feel* them.

### QPS (queries per second): the traffic at the door

**QPS** is how many requests your system handles in one second.

Kitchen picture: a food truck. If 3,600 customers order over one hour and they arrive evenly, that is about 1 customer per second. If a concert ends and 30 people line up at once, your *peak* rate is much higher than your *average*.

Traffic picture: cars through a toll booth. Average cars per second over a day is calm. Friday evening peak is what sizes the lanes.

In interviews:

- **Average QPS** = baseline load for servers, databases, and rate limits.
- **Peak QPS** = what you size for (often 2x to 5x average; say your factor out loud).
- **Read QPS vs write QPS** = usually different. Social apps are often read-heavy (many views, fewer posts).

Tiny example, spelled out:

- 1,000,000 people use the app each day (1M DAU).
- Each does 1 request per day.
- One day has about 100,000 seconds (we round 86,400 up; more on that later).
- Average QPS ≈ 1,000,000 ÷ 100,000 = **10 QPS**.

That is a small system. You do not need a massive cluster for 10 QPS of simple requests.

### Storage: the pantry and the warehouse

**Storage** is how much disk (or object storage) you need to keep data for as long as the product requires.

Kitchen picture: pantry size depends on package size × how many packages you buy × how long you keep leftovers. A jar of spices is tiny. A freezer full of ice cream is not.

In software:

- A chat message metadata row might be a few hundred bytes.
- A photo might be 0.5 MB after compression.
- A video can be hundreds of MB.

Always separate **metadata** (tiny rows: who, when, title) from **blobs** (photos, videos, files). They live in different systems and dominate cost in different ways.

### Bandwidth: the width of the pipe

**Bandwidth** is how much data moves per second (or per day) in or out of a service.

Kitchen picture: the width of the sink drain. A trickle of water is fine. Dumping a bucket all at once floods the counter.

Traffic picture: a highway with 2 lanes vs 8 lanes. Same "cars," different capacity if each car is a semi truck full of video.

In interviews, a classic check is:

`peak read QPS × average response size ≈ peak bandwidth`

If that number is huge, you often need a CDN (edge cache close to users) or smaller payloads, not a bigger app server.

### Latency: how long one order takes

**Latency** is how long one request waits from start to finish (or how long one step inside the system takes).

Kitchen picture: time from "I ordered" to "plate in hand." One slow step (oven cold, courier stuck) ruins the whole meal experience even if the kitchen is huge.

Traffic picture: time for one car to go from home to work. Adding more cars (higher QPS) does not fix a bridge that always takes 2 hours to cross.

Rough intuition you should keep (orders of magnitude, not a 2026 hardware sheet):

| Kind of work | Rough feel |
| --- | --- |
| Read from memory / cache | very fast |
| Read from local SSD | still fast for interviews |
| Spinning disk random seek | noticeably slower |
| Network inside one datacenter | often under 1 ms ballpark |
| Network across continents | tens to hundreds of ms |

What that buys you: do not put "write every event to spinning disk before we reply" on the hot path without a reason. Do not "just replicate everywhere" without saying multi-region latency is real.

---

## Units you should not invent under pressure

Everything starts from **bytes**. People freeze when they mix KB, MB, GB, TB.

Handy table (powers of two, approximate):

| Power of 2 | About | Name | Everyday feel |
| --- | --- | --- | --- |
| 10 | ~1 thousand | 1 KB | short text, ids, headers |
| 20 | ~1 million | 1 MB | small photo, short clip |
| 30 | ~1 billion | 1 GB | laptop RAM tier, big daily logs |
| 40 | ~1 trillion | 1 TB | large database or media store slice |
| 50 | ~1 quadrillion | 1 PB | multi-year media archives at big scale |

Shortcuts for interview math:

- 1 day = 86,400 seconds ≈ **100,000** seconds (10^5). Close enough.
- 1 month ≈ 2.5 million seconds.
- Million users × 1 action per day ≈ **10 QPS** average (1,000,000 ÷ 100,000).

When stuck, round toward easy powers of ten. 86,400 becomes 100,000. 365 days can become 400 if you need multi-year storage fast and only care about order of magnitude.

---

## Availability in one minute (the "nines")

Sometimes interviewers ask how often the system can be down. "Nines" are uptime percentages:

| Availability | Rough downtime per year |
| --- | --- |
| 99% (two nines) | about 3.65 days |
| 99.9% (three nines) | about 8.8 hours |
| 99.99% (four nines) | about 53 minutes |
| 99.999% (five nines) | about 5 minutes |

Kitchen picture: a cafe that is "open 99% of the year" is still closed for days. A payments system often aims higher than an internal wiki.

Do not invent a dramatic SLA to sound senior. Pick a target that matches the product, and design for that.

---

## QPS recipe (write this on the board)

1. Get **DAU** (daily active users), or estimate from MAU (monthly active users).
2. Get **actions per user per day** on the hot endpoint (uploads, views, posts).
3. Average QPS ≈ `(DAU × actions per day) / 100,000`.
4. Peak QPS ≈ average × peak factor (often **2x to 5x**; ask or state 3x).
5. Split **reads** and **writes**. One "traffic" number hides the real bottleneck.

From QPS to servers (very rough sanity check only):

If one app instance handles about 1,000 simple QPS at acceptable latency (depends wildly on work per request):

`servers ≈ peak QPS / QPS per instance`

Add headroom (say 2x) for deploys and failures. This is not a purchase order. It is a check that "one box" or "a small fleet" is plausible.

---

## Storage recipe

Storage ≈ **object size × writes per day × days retained**, then multiply for replicas, indexes, and waste.

1. Average **payload size** (text, metadata, media). Cap and average separately if media exists.
2. **Writes per day** from DAU and create rate.
3. **Retention** (30 days? 5 years? forever?).
4. Multipliers: replication (3x is a common interview default), indexes (maybe 20% to 50% extra on some tables), logs, versions.

Media dominates when present. A 1 MB average photo at 1,000,000 uploads per day is **1 TB per day** before thumbnails and CDN caches. Always separate metadata database size from object store size.

---

## Bandwidth recipe

1. **Response size × QPS** on the hot read path.
2. Or **bytes written per day / 100,000** for sustained write ingress.
3. Peak bandwidth ≈ peak QPS × bytes per response.

Example fragment:

- 50,000 read QPS
- 2 KB average response

`50,000 × 2 KB = 100,000 KB/s = 100 MB/s`

100 MB/s is about **0.8 Gbps**. That single number tells you whether one machine's network card is absurd, whether you need edge CDN, and whether smaller responses (pagination, fewer fields) belong in the design.

---

## Worked example: photo-sharing app (slow walk)

Use fake but consistent numbers. Say they are assumptions. Write them down.

**Assumptions:**

- 200 million monthly active users (MAU)
- Half use the app on a given day → **100 million DAU**
- Each daily user uploads **0.2** photos per day on average (about 1 photo every 5 days)
- Each daily user views **20** photos per day
- Average stored photo: **0.5 MB** after compression
- Feed thumbnail: **20 KB**
- Metadata per photo: **200 bytes**
- Keep originals **5 years**
- Peak factor on views: **3x**

### Step 1: Write QPS (uploads)

Daily uploads:

`100,000,000 DAU × 0.2 photos = 20,000,000 photos per day`

Average write QPS (using 100,000 seconds per day):

`20,000,000 ÷ 100,000 = 200 QPS`

Peak write QPS (if we also peak uploads at 3x, or at least mention burst):

`200 × 3 = 600 QPS`

**Meaning in plain words:** about 200 upload requests per second on a normal second. That is real work, but it is not the scary number in this product.

### Step 2: Read QPS (views)

Daily views:

`100,000,000 × 20 = 2,000,000,000 views per day`

Average view QPS:

`2,000,000,000 ÷ 100,000 = 20,000 QPS`

Peak view QPS:

`20,000 × 3 = 60,000 QPS`

**Meaning:** reads are about 100× writes (20,000 vs 200 average). The scale problem is **viewing**, not uploading.

### Step 3: Object storage (the photos themselves)

Daily media volume:

`20,000,000 photos × 0.5 MB = 10,000,000 MB per day`

10,000,000 MB = **10,000 GB** = **10 TB per day**

Five years (use 365 days per year):

`10 TB/day × 365 days/year × 5 years`

First: `10 × 365 = 3,650 TB per year`

Then: `3,650 × 5 = 18,250 TB`

1,000 TB ≈ 1 PB, so 18,250 TB ≈ **18 PB** raw for one copy.

If you keep 3 copies for durability (simple interview model), plan on the order of **tens of petabytes**. Thumbnails and transcodes add more; mention them even if you do not compute every variant.

### Step 4: Metadata storage (tiny rows about each photo)

Daily metadata:

`20,000,000 × 200 bytes = 4,000,000,000 bytes`

4,000,000,000 bytes = **4 GB per day** (because 1 GB is about 1 billion bytes for this rough math)

Five years:

`4 GB/day × 365 × 5`

`4 × 365 = 1,460 GB per year`

`1,460 × 5 = 7,300 GB` ≈ **7.3 TB** raw

**Meaning:** metadata is a few terabytes over years. That can live in a normal database tier. The **photos** are the multi-petabyte problem. Different storage systems for different jobs.

### Step 5: Bandwidth if origin served every thumbnail

Suppose every view fetched a 20 KB thumbnail from your origin (no CDN):

Peak:

`60,000 QPS × 20 KB = 1,200,000 KB/s`

1,200,000 KB/s = **1,200 MB/s** = **1.2 GB/s**

1.2 GB/s × 8 bits/byte ≈ **9.6 Gbps**, often said as about **10 Gbps**.

**Meaning:** serving every hot image from your app tier or origin database path is painful. This is a strong argument for **CDN + edge cache** on popular images.

### What you tell the interviewer (the point of the math)

"Writes are modest, about 200 QPS average. Reads are the scale problem, about 20,000 average and 60,000 peak. Metadata over five years is only a few terabytes. Original photos are multi-petabyte. So the design centers on object storage, a CDN for hot media, and a metadata path that stays simple."

That paragraph is why we did the envelope math. The numbers told you *where* to spend design time.

---

## Cache sizing (quick pass)

Rough interview rule: cache the **working set** (hot data), not the whole warehouse.

Kitchen picture: you keep tonight's ingredients on the counter, not the entire supermarket in your kitchen.

If 20% of keys get 80% of traffic:

- 10 million active objects
- 20% hot = 2 million objects
- 2 KB each

`2,000,000 × 2 KB = 4,000,000 KB = 4 GB` of useful cache before overhead and replicas.

State the 80/20 assumption. If the interviewer gives a different hit rate, recompute.

---

## Tips that keep the whiteboard clean

1. **Round and approximate.** 99,987 ÷ 9.1 is "about 100,000 ÷ 10." Nobody grades long division.
2. **Write assumptions.** DAU, actions per day, object size, retention, peak factor. Revisit them when the design changes.
3. **Label units every time.** "5" is useless. "5 MB/s" or "5 TB/year" is not.
4. **Separate read and write paths.** One traffic number hides the bottleneck.
5. **Separate metadata and media.** Bytes in a row store and bytes in object storage answer different questions.
6. **Say when precision is wasted.** If the design clearly needs sharding either way, do not burn five minutes refining 12,400 vs 15,000 QPS.
7. **Offer the calc, do not force it.** Some interviewers want architecture first. Ask: "Want a quick capacity check before we go deep?"

---

## How to practice

Dry runs beat rereading tables.

1. Flash the unit table until KB → MB → GB → TB → PB is automatic.
2. Pick a product (chat, URL shortener, news feed, drive) and estimate QPS + storage in 10 minutes with a timer.
3. Change one assumption (10× DAU, add video, 30-day retention) and recompute only what breaks.
4. Explain out loud. The interview is speech plus numbers.
5. Keep a one-page cheat sheet while learning, then retire it.
6. Sanity-check against public eng blogs when you can. Same order of magnitude beats matching their exact figure.

Drill both a **read-heavy** system (news feed) and a **write-heavy** path (metrics ingest, chat messages) so you do not always reuse one template.

---

## Where this fits in the interview

Envelope math is usually a short segment:

1. Clarify requirements and scale assumptions.
2. High-level design.
3. **Capacity check** (this post) if scale is non-trivial.
4. Detail work (API, data model, bottlenecks, failure modes).

If your numbers show one primary database can hold metadata and object storage holds blobs, say so and move on. If peak read QPS is six figures and every read hits disk, fix the design before you draw pretty boxes for features nobody asked for.

Related posts: [Design a Rate Limiter](/blog/design-a-rate-limiter), [Design a URL Shortener](/blog/design-url-shortener), [Redis Caching Patterns](/blog/redis-caching-patterns).

---

## Explain it to a friend

If a friend asks "what is back-of-the-envelope estimation in system design?" say this:

"It is party planning for servers. You guess how many people show up, how much each one eats, and how big the leftovers are. In software those guesses are **QPS** (requests per second), **storage** (how much data you keep), **bandwidth** (how fat the pipe must be), and **latency** (how long one request waits). You round hard, say your assumptions, and use the rough answers to pick an architecture: one database, a cache, a CDN, sharding, whatever the numbers push you toward. Being off by 2x is normal. Mixing units or forgetting peaks is the real mistake."

Then give them the one-line formulas:

| Need | Rough formula |
| --- | --- |
| Seconds per day | about 100,000 (10^5) |
| Average QPS | DAU × actions per day ÷ 100,000 |
| Peak QPS | average × 2 to 5 (state your factor) |
| Storage | size × writes per day × days kept × replicas |
| Bandwidth | QPS × bytes per response |
| Cache | hot working set, not full dataset |

Back-of-the-envelope estimation is a communication tool. You show that scale constraints shape architecture, and that you can do honest rough math without fake precision. Practice the recipes until they feel boring. Boring is what you want when the clock is running.