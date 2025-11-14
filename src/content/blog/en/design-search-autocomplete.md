---
title: "Design a Search Autocomplete System: How Typeahead Really Works"
description: "Search autocomplete for beginners: prefixes, a letter tree (trie), top suggestions, why we precompute answers, and a letter-by-letter walk of typing din."
date: "2025-11-14"
tags: [System Design]
coverImage: /assets/images/design-search-autocomplete.webp
previewImage: /assets/images/design-search-autocomplete.webp
---


> **TL;DR**
> * **The Problem:** Designing scale-ready architectures requires balancing trade-offs between availability, throughput, and operational complexity.
> * **The Insight:** Search autocomplete for beginners: prefixes, a letter tree (trie), top suggestions, why we precompute answers, and a letter-by-letter walk of typing din.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

You already use search autocomplete every day. Open Google, Amazon, or your phone messages. You type a few letters, and a short list of finished phrases appears before you hit Enter. That dropdown is not magic. It is a small system with one job: **given the letters you have typed so far, return a few good full queries, very fast.**

Think of your **phone keyboard suggestions**. As you type `din`, the keyboard tries to finish the word for you. Or think of a **dictionary that only looks at the start of words**, not the middle, and hands you the most common matches first. That is the mental model for this whole design.

This post teaches autocomplete the way I would teach it on a whiteboard to someone who has never built search before. We will use plain language, one small example (`din`), and only the ideas you need for an interview or a first production version.

---

## What we are building (and what we are not)

**In scope**

1. User types a **prefix** (the start of a query).
2. System returns the **top k** suggestions (often 5 to 10).
3. Suggestions are ranked mostly by **how often people searched them**.
4. The answer must feel instant (rough target: under about **100ms**).
5. We keep the suggestion list reasonably up to date from real search logs.

**Out of scope unless someone asks**

- Full Google-quality ranking with machine learning
- Fixing typos (`dinnr` → `dinner`)
- Finding matches in the middle of a sentence
- Personalized "just for you" lists

Name those out loud in an interview so you do not get dragged into a research paper.

---

## Start with one word: prefix

A **prefix** is simply the beginning of a string.

| You typed | That is the prefix of |
| --- | --- |
| `d` | `dinner`, `dinosaur`, `doctor`, ... |
| `di` | `dinner`, `dinosaur`, `diners near me`, ... |
| `din` | `dinner recipes`, `dinosaur`, `diners near me`, ... |
| `dino` | `dinosaur`, `dinosaur toys`, ... |

Autocomplete almost always means **prefix match from the start**, not "find this substring anywhere."

If the product only needs that, say so. Mid-string match is a different, harder problem.

---

## Why a plain list of words is not enough

Imagine you store every popular search in a big table:

```
query                 times_searched
------------------------------------
dinner recipes        98012
dinosaur              77120
diners near me        54001
doctor near me        41000
... millions more ...
```

A naive answer for prefix `din` is:

```sql
SELECT query
FROM queries
WHERE query LIKE 'din%'
ORDER BY times_searched DESC
LIMIT 5;
```

That works on a laptop demo. At real scale, each keystroke becomes a request, and tens of thousands of requests per second may hit you. Scanning or sorting a giant table for every letter people type is too slow and too expensive.

We need a structure built for **walking letters one by one**.

---

## The phone keyboard idea: a tree of letters

Here is the core picture.

Imagine a **tree**. The root is empty (you have typed nothing). Each step down is one letter. Shared starts share the same path.

That tree is called a **trie** (say "try"). People also call it a **prefix tree**.

Tiny dictionary: `be`, `bee`, `beer`, `best`, `bet`.

```
        (root)
          |
          b
          |
          e
       /  |  \
      e   s   t
      |   |
      r   t
```

How to read it:

- Path `b → e` is the prefix `be`.
- Path `b → e → e → r` is the word `beer`.
- Words that share a start share nodes, so you do not store the letters of `be` three separate times for `be`, `bee`, and `beer`.

Same idea as keyboard suggestions: the keyboard is not rereading the whole dictionary from A to Z for every letter. It follows the path of letters you already typed, then looks at what can still grow from there.

---

## Walk typing `din` letter by letter

Suppose popular queries that start with `d` include:

- `dinner recipes` (score 98012)
- `dinosaur` (score 77120)
- `diners near me` (score 54001)
- `doctor near me` (score 41000)
- `disney movies` (score 39000)

**Step 1: user types `d`**

Server walks one edge: root → `d`.

Everything under `d` is a candidate: dinner, dinosaur, doctor, disney, and more. If we listed *all* of them, the list would be huge. So we only keep the **top few** for this prefix (more on that soon). Maybe:

```
prefix "d" → dinner recipes, dinosaur, diners near me, doctor near me, disney movies
```

**Step 2: user types `i` (now `di`)**

Walk one more edge: `d` → `i`.

`doctor` and anything that does not continue with `i` drop out. Still under `di`: dinner, dinosaur, diners, disney, and similar.

```
prefix "di" → dinner recipes, dinosaur, diners near me, disney movies, ...
```

**Step 3: user types `n` (now `din`)**

Walk: `i` → `n`.

Now the path is `d-i-n`. Only queries that start with `din` remain:

```
prefix "din" → dinner recipes, dinosaur, diners near me, ...
```

That is the whole query path in one sentence: **follow the letters the user typed, then return the best finished queries hanging under that node.**

Time to reach the node is proportional to how many characters they typed. For short search boxes, that is a handful of steps, not a full table scan.

---

## Top suggestions: we do not show everything

Users do not want 10,000 matches. They want a short, useful list.

So the product says: return **top k**, often `k = 5` or `k = 10`.

**How do we rank?**

Simplest interview answer: **historical frequency**. Count how many times people finished that search. Higher count → higher rank. Optional later upgrades: recent trends, clicks on suggestions, language, location. Start with frequency so the design stays clear.

Example response shape:

```http
GET /v1/autocomplete?q=din&limit=5
```

```json
{
  "prefix": "din",
  "suggestions": [
    {"query": "dinner recipes", "score": 98012},
    {"query": "dinosaur", "score": 77120},
    {"query": "diners near me", "score": 54001}
  ]
}
```

Empty or one-letter prefixes are awkward (almost the whole dictionary). Many products wait until **2 or 3 characters** before calling the server, or they show a special "trending" list for very short input.

---

## Why we precompute (the most important production idea)

You *could* do this on every request:

1. Walk to the prefix node (`din`).
2. Explore the whole subtree under it.
3. Collect every finished query.
4. Sort by score.
5. Take top 5.

For a rare prefix like `xylophone`, the subtree is tiny. For a common prefix like `a` or `the`, the subtree can be enormous. Sorting a huge pile under a 100ms budget, at huge QPS, fails.

So we **precompute**.

At each important node (or for each important prefix), store the answer ahead of time:

```
Node "din":
  top: [dinner recipes, dinosaur, diners near me, ...]
```

Query path becomes:

1. Walk to the node (or look up the prefix in a map).
2. Return the list you already stored.

You trade **memory** for **latency**. That trade is intentional. Autocomplete is a read-heavy product where speed is the product.

### When do those lists get built?

Not on every keystroke in the user's face. Separately:

1. People finish searches (logs).
2. A pipeline counts frequencies (hourly, daily, weekly, product choice).
3. A job builds a new trie (or a map of `prefix → top-k`).
4. Serving machines load the new snapshot and switch over.

Think of it like printing a new pocket dictionary at night, then using that printed book for answers the next day. For newsy products you also add a short "trending" path, but the main idea stays: **do heavy work offline, answer online with ready-made lists.**

---

## Two paths: learn vs answer

Draw this split early. It keeps the design honest.

```
LEARN (slow is OK)
  finished searches → counts → build top-k → publish snapshot

ANSWER (must be fast)
  user types → API → cache / trie → top-k list → response
```

If you update one global live tree on every completed search worldwide, you create write storms, lock fights, and inconsistent ranks. For a first design, prefer **periodic rebuild + atomic swap**.

---

## A tiny capacity story (so scale feels real)

Rough interview numbers you can say out loud:

- 10 million people using the product per day
- Each person searches about 10 times
- Each search may type about 20 characters (if every keystroke hits the server)

```
Average QPS ≈ 10M * 10 * 20 / 86400 ≈ 24,000
Peak might be about 2x → ~50,000
```

In production the client should **debounce** (wait ~150-300ms after the last key before calling) and cancel old requests when a new letter arrives. That cuts traffic a lot. Still, plan for a hot, read-heavy API.

Also: browsers can cache non-personal suggestions for a while. Server caches (Redis or in-process) store hot prefixes like `din`, `how`, brand names. Cache misses load from the trie snapshot.

---

## Safety and ugly results

Popularity alone can surface bad suggestions. Hate speech, scams, or legal takedowns cannot wait for next week's rebuild.

Put a **fast filter** on the answer path:

- Blocklist of full queries and prefixes
- Drop matches before they reach the user
- Also remove them in the next rebuild so they stop taking top-k slots

Immediate hide now, clean index soon.

---

## Scaling without drowning in jargon

One machine will not hold every language and every long-tail query forever.

Practical ideas interviews like:

| Idea | Plain meaning |
| --- | --- |
| Shard by prefix | Queries starting with `a-m` on one set of machines, `n-z` on another |
| Fix letter skew | English loves `s` and `c` more than `x` and `z`; shard by real traffic, not pure alphabet slices |
| Locale tries | Spanish rankings differ from Hindi rankings; separate indexes help |
| Min characters | Do not serve global top-k for empty string |

You do not need a perfect global real-time graph on day one. You need a **prefix → top-k** service that stays fast when traffic grows.

---

## Client details that make the product feel good

| Detail | Why |
| --- | --- |
| Debounce 150-300ms | Avoid a request per key mash |
| Cancel in-flight calls | Backspace should not show a stale list |
| Min length 2-3 | Avoid dumping the whole dictionary |
| Local recent searches | Offline or failure still feels useful |
| Cap prefix length | 50 characters is plenty for a search box |

The backend design is the same for mobile apps and web.

---

## End-to-end picture you can defend

**Product:** prefix top-5 by popularity, tens of thousands of QPS peak, p99 under ~100ms, English first, periodic rebuild, fast moderation kills.

**Pieces:**

1. Autocomplete API (stateless, many copies)
2. Trie or `prefix → top-k` snapshot in memory / Redis
3. Durable snapshot store (versioned builds)
4. Log → aggregate → build workers
5. Read-path blocklist
6. Optional short-window trending merge for breaking news

**Query:** validate → cache → precomputed top-k → filter → respond.

**Learn:** sample completed searches → aggregate → build → publish → warm cache → flip version.

---

## Recap for a friend

If you had to explain this at dinner in one minute:

> Autocomplete is like phone keyboard suggestions for search. You type the start of a phrase (a **prefix**). The system does not reread every search ever done. It keeps a **tree of letters** (a trie). Each step is one letter. When you type `d`, then `i`, then `n`, it walks `d → i → n` and looks at a **short precomputed list** of the most popular full queries under that path, like `dinner recipes` and `dinosaur`. We precompute those top lists offline from real search counts so every keystroke stays cheap and fast. Serving answers and learning from new searches are two different jobs. Mixing them into one live update on every search is how these systems get slow and messy.

That is the design. Everything else (shards, caches, trends, filters) is detail around that story.

---

## Checklist before you ship (or finish the interview)

- [ ] Prefix-only match agreed with product
- [ ] `k` and ranking rule stated (frequency first)
- [ ] Client debounce, cancel, min character length
- [ ] Top-k stored per node or per prefix map
- [ ] Offline or periodic build with atomic swap
- [ ] Read-path safety filter with fast update
- [ ] Cache layers for hot prefixes
- [ ] Rate limits on the autocomplete endpoint
- [ ] Dashboards: latency, cache hit rate, empty results, build lag

---

## Closing

Search autocomplete is not a fancy AI demo. It is a **prefix top-k service** with a soft real-time index. The structure that matches the product is a letter tree. The trick that makes production work is **precomputed short lists** at the nodes people actually walk. Keep the learn path and the answer path separate, and the system stays both fast and understandable.