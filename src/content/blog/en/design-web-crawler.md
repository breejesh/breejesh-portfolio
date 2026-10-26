---
title: "Design a Web Crawler: Frontier, Politeness, Fetching, Dedup, and Recrawl at Scale"
description: "A billion-page crawler design: capacity math, a Mercator-style URL frontier with priority front queues and per-host back queues, robots.txt and politeness, async fetching with DNS caching, WARC storage, URL and SimHash content dedup, spider traps, and recrawl scheduling."
date: "2025-10-30"
tags: [System Design & Architecture]
coverImage: /assets/images/design-web-crawler.webp
previewImage: /assets/images/design-web-crawler.webp
---

> **TL;DR**
> * **The Problem:** Download a billion pages a month from millions of independent websites, without overloading any of them, without fetching the same thing twice, without getting stuck in infinite URL spaces, and while revisiting pages that change.
> * **The Design:** A loop of frontier, fetch, store, parse, filter, dedup and back to the frontier. The frontier has priority queues in front and one queue per host behind, gated by a heap of "next allowed fetch time," so politeness is enforced by construction. URL-seen checks use a Bloom filter backed by a key-value store; near-duplicate content is caught with SimHash.
> * **The Result:** About 400 pages per second sustained on a modest fleet, every host contacted at most once every few seconds, and crawl effort spent on pages that are new, important or likely to have changed.

A crawler looks like the simplest program in this series: fetch a page, find its links, fetch those. Writing that loop takes ten minutes. Running it against the real web for a week teaches you everything else: servers that slow down when you are rude, calendars with infinite "next month" links, a million pages that are the same page with different session IDs, and site owners who email you.

This post designs a general-purpose crawler of the kind that feeds a search index or a large research corpus such as Common Crawl.

---

## Requirements and Numbers

**Functional:** start from seed URLs, discover and download HTML pages, store raw content, extract links, respect robots.txt, revisit pages over time.

**Non-functional:** politeness (never overload a site), robustness against malformed HTML and hostile URL spaces, scalable to billions of pages, extensible to new content types.

| Assumption | Value | Derived |
| --- | --- | --- |
| Pages per month | 1 billion | ~385 pages/s average |
| Average HTML page | ~100 KB | ~100 TB/month raw, a few tens of TB compressed |
| Average fetch time | ~500 ms | ~200 concurrent fetches keep pace; plan for thousands for headroom |
| Links per page | ~50 | ~20k new candidate URLs/s before dedup |
| URLs seen over a year | ~10s of billions | URL-seen set does not fit naively in one machine's memory |

The interesting numbers are not bandwidth. They are the 20,000 candidate URLs per second that need a "have I seen this?" answer, and the millions of hosts each needing their own rate limit.

---

## The Pipeline

![Web crawler pipeline: seed URLs enter the URL frontier, fetchers use DNS and robots.txt caches and store raw pages as WARC in object storage, the parser extracts text and links, SimHash deduplicates content before indexing, outlinks pass a URL filter and a URL-seen check before unseen URLs return to the frontier, and a recrawl scheduler re-adds changing pages](/assets/images/hld/design-web-crawler-pipeline.webp)

* **Seed URLs.** A starting set of well-known, high-quality sites. Their quality shapes the whole crawl.
* **URL Frontier.** The to-do list. It decides both *what* to fetch next (priority) and *when* each host may be contacted (politeness). It is the heart of the design and gets its own diagram below.
* **Fetchers (async HTTP).** Thousands of concurrent connections from a handful of machines using non-blocking IO. Timeouts, size limits and redirect limits on every request. Identify yourself with a clear user agent and a contact URL.
* **DNS cache + robots.txt cache.** DNS lookups can easily become the bottleneck at hundreds of fetches per second, so cache them aggressively. Fetch each host's `robots.txt` once, cache it for about a day, and check every URL against it before fetching. RFC 9309 (2022) finally standardized the Robots Exclusion Protocol.
* **Raw Pages (WARC in object store).** Store exactly what you downloaded, with headers, in WARC files (the archival format Common Crawl and the Internet Archive use). Parsing can be redone later; fetching cannot.
* **Parser.** Turns HTML into text and links, resolves relative URLs, and survives broken markup.
* **Content Dedup (SimHash).** Many URLs serve identical or nearly identical content (mirrors, print views, tracking parameters). A 64-bit SimHash fingerprint lets you detect near-duplicates by comparing Hamming distance; Google described doing exactly this in its 2007 crawler paper.
* **URL Filter.** Normalizes URLs (lowercase host, remove default ports and fragments, sort or strip tracking parameters), applies scope rules, and blocks known traps.
* **URL Seen (Bloom + KV).** A Bloom filter answers "definitely not seen" in memory; maybes are confirmed against a persistent key-value store keyed by a hash of the normalized URL.
* **Index / Search consumers.** Unique documents flow to whatever uses the crawl.
* **Recrawl scheduler.** Puts known URLs back into the frontier according to how often they change.

---

## The Frontier: Priority in Front, Politeness Behind

![Mercator-style URL frontier: priority front queues F1 to F3 feed a biased selector, which routes URLs by host into per-host back queues; a heap keyed by each host's next allowed fetch time releases ready hosts to fetcher threads, and after each fetch the host's next time is pushed back by a delay](/assets/images/hld/design-web-crawler-frontier.webp)

This two-stage design comes from the Mercator crawler (Heydon and Najork, 1999) and is still the standard answer:

1. **Front queues** hold URLs by priority. Priority can come from PageRank-like importance, freshness needs, or simply domain quality.
2. A **biased selector** pulls from front queues, favoring high priority without starving low priority completely.
3. URLs are routed to **back queues**, with exactly one host per back queue. All of `news.example`'s URLs wait in the same line.
4. A **heap** holds one entry per back queue: the earliest time that host may be contacted again.
5. Fetcher threads pop the host whose time has arrived, fetch one URL from its queue, then push the host back with a new time: **now plus a delay**, commonly a multiple (say 10x) of how long the last fetch took, and never less than any crawl-delay the site asks for.

The red note is the whole politeness policy in one line. A slow server automatically gets more breathing room, because its fetches take longer and therefore its delay grows.

Distributing the frontier across machines is straightforward once you see this structure: partition by host (hash of the hostname), so each host's back queue and politeness state live on exactly one machine.

---

## Traps and Other Hostile Territory

| Trap | Example | Defense |
| --- | --- | --- |
| Infinite URL spaces | Calendar with endless "next month" links | Max URL depth and length; per-host page budgets |
| Session IDs and tracking parameters | `?sid=abc123` making every URL unique | Normalization rules; parameter learning per host |
| Soft 404s | "Not found" pages served with status 200 | Content dedup catches the repeated template |
| Huge or binary responses | A 2 GB file at an HTML-looking URL | Content-type checks, size caps, streaming with early abort |
| Slow-drip servers | Responses that trickle a byte per second | Total-time timeouts, not just connect timeouts |
| Spam and link farms | Millions of auto-generated pages | Quality signals in priority; per-domain budgets |

The per-host page budget is the most effective single defense. No single site gets more than its share, however many links it generates.

---

## Recrawl: Freshness Is a Budget

Pages change at very different rates. A news homepage changes every few minutes; an archived paper never changes. Fetching everything on a fixed cycle wastes most of the budget.

* Track per-URL change history (did the SimHash change since last fetch?).
* Estimate a change rate and schedule the next visit proportionally, within a minimum and maximum interval.
* Use conditional requests (`If-Modified-Since`, `If-None-Match`) so unchanged pages cost a `304` instead of a full download.
* Give important pages tighter intervals; let the long tail age.
* Use sitemaps where sites provide them, since they often include last-modified dates.

---

## Being a Good Citizen

* Honor `robots.txt`, including disallow rules for your user agent and any crawl-delay.
* Identify the crawler in the user agent with a URL explaining what it is and how to opt out.
* Publish the IP ranges you crawl from, so site operators can verify you.
* Back off on `429` and `503`, and respect `Retry-After`.
* Provide a contact address and actually read it.

The web's tolerance for crawlers is a commons. Every badly behaved crawler makes site operators more aggressive about blocking all of them.

---

## Production Checklist

- [ ] Frontier enforces one host per back queue with a next-allowed-time heap
- [ ] robots.txt fetched, cached and checked before every URL; RFC 9309 semantics
- [ ] DNS cached; per-request timeouts on connect, first byte and total time
- [ ] URL normalization and scope rules versioned and tested
- [ ] URL-seen check with Bloom filter plus persistent store
- [ ] Near-duplicate detection with SimHash or similar
- [ ] Per-host and per-domain page budgets; depth and URL-length limits
- [ ] Raw responses stored as WARC before parsing
- [ ] Recrawl scheduling by observed change rate; conditional requests
- [ ] Dashboards: pages/s, error rates by class, hosts in backoff, frontier size, duplicate rate

---

## The Leftover

A crawler is a guest in millions of houses at once. The engineering is about speed, but the reputation is about manners: knock, wait, do not come back too often, leave when asked.

Somewhere there is a small blog on a cheap server that your crawler visits every few days. It will never know your name. It should also never notice you were there.

---

## Sources

* [Heydon and Najork, "Mercator: A Scalable, Extensible Web Crawler" (1999)](https://www.cs.cornell.edu/courses/cs685/2002fa/mercator.pdf)
* [Manku, Jain and Das Sarma, "Detecting Near-Duplicates for Web Crawling" (WWW 2007)](https://research.google/pubs/detecting-near-duplicates-for-web-crawling/)
* [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309)
* [Common Crawl: overview and WARC data](https://commoncrawl.org/overview)
* [ISO 28500: WARC file format (Library of Congress description)](https://www.loc.gov/preservation/digital/formats/fdd/fdd000236.shtml)
* Related in this series: [Design Search Autocomplete](/blog/en/design-search-autocomplete), [Back-of-the-Envelope Estimation](/blog/en/design-back-of-envelope-estimation), [How DNS works](/blog/en/how-dns-works-for-engineers)
