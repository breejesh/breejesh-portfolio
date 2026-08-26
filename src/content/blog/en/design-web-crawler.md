---
title: "Design a Web Crawler: Frontier, Politeness, Fetch, Dedup, and Scale"
description: "How a web crawler works in plain language: seed URLs, the frontier queue, politeness, fetch, parse, store, and dedup. One page walked through the pipeline, plus a short recap."
date: "2025-10-30"
tags: [System Design & Architecture]
coverImage: /assets/images/design-web-crawler.webp
previewImage: /assets/images/design-web-crawler.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** How a web crawler works in plain language: seed URLs, the frontier queue, politeness, fetch, parse, store, and dedup. One page walked through the pipeline, plus a short recap.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Imagine a librarian who wants a card for every public book on Earth, except the "books" are web pages and new ones appear every second. Or picture a vacuum robot that must visit every room in a city-sized building: it needs a list of rooms to clean next, it must not slam the same door a hundred times, and it should remember which rooms it already cleaned so it does not loop forever.

A **web crawler** is that librarian and that robot combined into software. Search engines, archives, price monitors, and research tools all use some form of it. Google's crawler is famous, but the idea is the same at any size: start somewhere, download a page, find links, visit those next, store what you found, and avoid doing the same work twice.

This post is for absolute beginners. We will name each piece in plain words, walk one page through the whole pipeline, and end with a recap you could tell a friend over coffee.

---

## What problem are we solving?

The public web is a giant graph. Each page is a node. Each hyperlink is a directed edge from one page to another. Nobody hands you a complete map. You only get a few starting addresses and the links written on each page you visit.

So the crawler must:

1. Start from a short list of known good addresses.
2. Keep a to-do list of pages still waiting to be visited.
3. Download each page carefully so it does not crush a website.
4. Read the HTML, pull out useful text and links.
5. Save the page somewhere durable.
6. Notice duplicates so storage and time are not wasted.
7. Repeat until the budget or the queue runs out.

If you only remember the loop: **discover → download → understand → save → discover more.**

---

## The cast of characters (plain words)

| Name | What it means in real life |
| --- | --- |
| **Seed URLs** | The first few doors you open on purpose |
| **Frontier (queue)** | The sticky note list of "visit next" addresses |
| **Politeness** | Do not hammer one site; wait your turn per host |
| **Fetch** | Actually download the page over HTTP |
| **Parse** | Read the HTML, find links and content |
| **Store** | Keep the page body and metadata on disk or object storage |
| **Dedup** | Skip addresses and page bodies you already handled |

In interviews people say "URL frontier," "fetcher," "content store," and "URL seen." Those are just professional names for the same cast.

---

## Seed URLs: where the crawl begins

A **seed** is a URL you put in the system by hand (or from a trusted list) before discovery starts. The crawler cannot invent the first page out of thin air. Seeds are the entrance doors.

Good seeds look like:

- Well-known homepages (news sites, government portals, university roots).
- Topic hubs if you only care about shopping, sports, or docs.
- Sitemaps or "top hosts from last month's crawl" when you are restarting.

Bad seeds trap you. If every seed is a tiny blog that only links to itself, your vacuum robot never leaves one hallway. For a broad crawl you want **many different neighborhoods**, not one dense clique.

Seeds go into the frontier first. After that, almost every new URL comes from links found on pages you already downloaded.

---

## The frontier: the to-do list of the internet

The **URL frontier** is the queue of pages waiting to be fetched. Think of it as the robot's list of rooms still dirty, or the librarian's stack of books still unchecked.

Important habits for that list:

1. **First in, first out is the simple story.** Breadth-first search (BFS) means: visit near the seeds first, then expand outward. That matches "clean every room on this floor before diving into one endless basement staircase."
2. **Depth-first is a bad default.** Following one chain of links forever can trap you in calendars, session ids, or infinite path tricks.
3. **Priority helps.** The homepage of a major newspaper often deserves attention before a random comment thread. Production systems keep several front queues (high, medium, low priority) and pick from them with a bias toward important work without starving everything else.
4. **The list is huge.** Hundreds of millions of pending URLs will not sit happily in one laptop's RAM. Real frontiers live on disk-backed queues, often split across machines by host name.

One more structural trick: many designs use **front queues** for priority and **back queues** per website host. Priority decides *what kind* of work is ready; the per-host queue decides *when* that host may be contacted again. That split is how politeness and useful ordering live in the same system.

```
new URL → score priority → front queues → route by host → back queue per host → worker
```

---

## Politeness: do not hammer one site

If your robot finds 500 links on `example.com` and opens 500 connections at once, you are not crawling. You are attacking. Sites will slow down, return errors, or ban your IP. Good crawlers treat each host like a shared library desk: one careful request at a time (or a small, documented limit), then a short pause.

**Politeness** usually means:

- At most one active download per host (sometimes per IP, because many sites share a box).
- A delay between visits to the same host (for example a second or two, or whatever the site asks for).
- Reading **`robots.txt`** first. That is a small file site owners publish at `https://host/robots.txt` to say "you may crawl here" and "please stay out of `/admin`."
- A clear **User-Agent** string with a contact page, so humans know who you are.
- Backing off harder when the site returns `429` (too many requests) or `503` (unavailable).

If you only keep one production rule from this post: **never let parallel crawling turn into a denial-of-service against a single host.** Throughput across the whole web matters. Politeness per host is non-negotiable.

---

## Fetch: download the page

**Fetch** is the moment the worker actually says "please give me this URL" over the network.

A careful fetch path looks like:

1. Take the next allowed URL from the frontier (respecting host delay).
2. Normalize it (lowercase host, drop useless fragments like `#section`, fix relative forms later when parsing).
3. Check robots rules for that host (from a cache if you already fetched them).
4. Resolve DNS (with a local cache so you do not wait on name lookup every time).
5. HTTP GET with short timeouts, a max body size, and a limited redirect budget.
6. Hand the response body to the parser, or record the failure and move on.

Practical details beginners should still hear:

| Concern | Simple rule |
| --- | --- |
| Timeouts | Fail in seconds, not minutes |
| Huge files | Cap size so one giant download does not stall the worker |
| Redirects | Limit hops; treat a jump to a new host under that host's politeness |
| Compression | Accept gzip; save bandwidth |
| Recrawl | Use `If-None-Match` / `If-Modified-Since` when you already have a copy |

At scale you run many fetchers on many machines, usually **sharded by host** so the politeness lock for `example.com` lives next to the workers that talk to `example.com`.

---

## Parse: read HTML and find the next doors

**Parse** means: look inside the downloaded bytes and understand them enough to store content and extract links.

For HTML that usually means:

1. Confirm it is roughly HTML (not a random binary blob you did not want).
2. Extract the main text and useful metadata (title, language hints, canonical URL if present).
3. Find every `a href="..."` link.
4. Turn relative links (`/about`) into absolute ones (`https://example.com/about`) using the final URL after redirects.
5. Clean the URL: strip `#fragments`, maybe drop tracking junk if your product allows it.

Then a **URL filter** throws away work you refuse to do:

- `mailto:`, `javascript:`, `data:` schemes.
- File types you do not want (`.zip`, `.mp4`) unless the product says otherwise.
- Absurdly long URLs that look like spider traps.
- Blacklisted hosts.

What survives goes through **URL dedup** (below) and, if new, back into the frontier.

At small scale, parse can sit on the same machine as fetch. At large scale, download workers and parse workers are separate stages so a slow parser does not block the network.

---

## Store: keep what you paid to download

**Store** means durable memory of the crawl: the page body plus enough metadata to use it later (index it, archive it, compare it next week).

Typical split:

- **Blob / object storage** for the HTML (or compressed HTML). Big, write-heavy, cheap tiers over time.
- **Metadata database** for small facts: URL, fetch time, status code, content type, content hash, size.

You keep metadata so you can answer questions without rereading every blob: "When did we last fetch this?" "Was it a 404?" "Is this hash already known?"

Recrawl policy lives nearby. Important pages change often; long-tail pages may wait longer. Blind full recrawl of the whole web is expensive, so systems learn change rates and spend budget where freshness matters.

---

## Dedup: skip work you already did

The web loves copies. The same article may appear on `www` and the bare domain. Mirrors reprint the same body under new URLs. Without **deduplication**, you burn disk and CPU on deja vu.

There are two layers, and beginners should keep both:

| Layer | Question | Everyday analogy |
| --- | --- | --- |
| **URL seen** | Have we already scheduled or fetched this address? | Did we already write this room number on the cleaning list? |
| **Content seen** | Have we already stored this page body (or an exact twin)? | Did we already file this exact book text under another call number? |

**URL dedup** stops the frontier from exploding with the same link found on a thousand pages. Implementations range from a simple set in a database to a Bloom filter in front of a durable store. Bloom filters save memory but can occasionally say "seen" when the URL was new (you lose a bit of coverage). Exact stores cost more memory or disk.

**Content dedup** hashes the body (for exact copies). If the hash already exists, you skip writing another full blob, or you store only a pointer to the first copy. Near-duplicate detection (almost the same article with different ads) is a later, heavier system. Exact hash is the interview default.

Both layers matter for different bugs:

- Two URLs, one body → content dedup saves storage.
- Infinite unique URLs with junk query strings → URL filters, path limits, and per-host budgets save the frontier.

---

## High-level picture

```
Seed URLs
    │
    ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ URL Frontier│────►│ Fetcher      │────►│ Parser         │
│ (priority + │     │ DNS, robots, │     │ links + body   │
│  politeness)│     │ HTTP GET     │     └────────┬───────┘
└──────▲──────┘     └──────────────┘              │
       │                                          ▼
       │                                 content hash new?
       │                                    │         │
       │                                   yes        no → drop or link only
       │                                    ▼
       │                                 content store
       │                                    ▼
       │                                 extract links
       │                                    ▼
       │                                 filter + URL seen?
       │                                    │
       └────────────── only novel URLs ─────┘
```

---

## Walk one page through the pipeline

Let us follow a single page so the pieces stop feeling abstract.

**Setup.** Seeds include `https://news.example/`. The frontier is empty except that seed. Politeness says: one fetch at a time per host, with a short delay.

1. **Seed load.** `https://news.example/` enters the frontier with high priority because it is a homepage.

2. **Dequeue under politeness.** A worker pulls that URL. No other fetch to `news.example` is running. Robots rules are loaded from `https://news.example/robots.txt` and cached. The path `/` is allowed.

3. **Fetch.** DNS resolves `news.example`. The worker sends HTTP GET with a clear User-Agent and a 10 second timeout. Status 200. Body is about 80 KB of HTML.

4. **Parse.** The parser reads the title "Example News," main article text, and finds links:
   - `https://news.example/politics/bill-42`
   - `https://news.example/sports/final`
   - `https://other-site.org/op-ed`
   - `mailto:tips@news.example` (filtered out)
   - `/local/weather` (becomes `https://news.example/local/weather`)

5. **Content dedup.** Hash of the HTML is new. Write the body to object storage. Write metadata: URL, time, 200, hash, size.

6. **URL filter and URL seen.**  
   - `mailto:` dropped.  
   - The three http(s) links are normalized.  
   - None of them were in the URL-seen set, so all three are marked seen and enqueued.  
   - `other-site.org` goes to a different back queue than `news.example`.

7. **Next cycles.**  
   - The worker must wait the politeness delay before the next `news.example` URL.  
   - Another worker may fetch `https://other-site.org/op-ed` immediately if that host is free.  
   - When `politics/bill-42` is fetched later, its body might be unique, or it might match a mirror already stored (content dedup).  
   - Links found there refill the frontier again.

8. **Failure path (same page idea).** If the fetch times out, the system records a failure, maybe retries with backoff, and does not pretend the page was stored. If robots disallows `/admin`, that URL never leaves the "check robots" step.

After one page you already practiced every major idea: seed, frontier, politeness, fetch, parse, store, dual dedup, and multi-host scheduling.

---

## A few scale notes (still in plain language)

When people say "design a crawler for a billion pages a month," the shape stays the same. The furniture gets bigger.

- **Rough rate:** 1 billion pages / 30 days / 86,400 seconds ≈ 400 pages per second average. Peak might be higher.
- **Storage:** If average HTML is hundreds of kilobytes, monthly raw data is hundreds of terabytes. Compression and multi-year retention make this a real storage design, not a side folder.
- **Shard by host:** Keep frontier slices, politeness state, and often fetch workers grouped by host hash so one machine owns a set of websites.
- **Spider traps:** Infinite calendars, session ids, and recursive paths try to keep the robot in one hallway forever. Cap URL length, path depth, and pages per host per day. Keep a human kill switch.
- **JS-heavy sites:** Some links only appear after a browser runs JavaScript. Full rendering is expensive. Use it for high-value hosts, not for every random page on day one.

You do not need to build Google's crawler in an interview. You need to show you understand the loop, politeness, and the two kinds of dedup.

---

## Recap for a friend

A web crawler is software that catalogs the public web the way a librarian catalogs books and a vacuum robot visits rooms.

You start with a few **seed URLs**, the doors you choose on purpose. Those go into a **frontier**, a big to-do queue of pages still to visit. Workers pull from that queue, but they stay **polite**: one careful request at a time per website, with delays, and they honor `robots.txt` so owners can say "stay out of this hallway."

**Fetch** downloads the page. **Parse** reads the HTML, saves the useful text, and finds new links. **Store** keeps the page and its metadata. **Dedup** works twice: once so you do not enqueue the same URL forever, and once so you do not store the same article body under ten addresses.

Then new links rejoin the frontier, and the robot keeps walking. The whole design is that loop, made safe for the sites you visit and cheap enough to run at internet scale.

---

## Closing

If you draw only one diagram in an interview, draw the loop: frontier → polite fetch → parse → content store → link extract → URL filter and seen → back to frontier. Label seeds at the entrance. Say out loud that priority and politeness live in the frontier, not as an afterthought.

The web will always be messy: bad HTML, traps, duplicates, slow hosts. A good crawler design expects that mess. It is patient per host, aggressive about not repeating itself, and honest about how much of the internet it can actually clean today.