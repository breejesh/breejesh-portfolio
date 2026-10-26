---
title: "Keep Learning System Design: Building Blocks, Practice Order, and This Series"
description: "A study plan for system design: the order to read this series in and why, the building blocks that every design reuses, how to practice so it sticks, the books and engineering blogs worth your time, and how to tell when you are actually ready."
date: "2026-01-30"
tags: [System Design & Architecture]
coverImage: /assets/images/design-interview-learning-path.webp
previewImage: /assets/images/design-interview-learning-path.webp
---

> **TL;DR**
> * **The Problem:** System design is usually learned as a pile of unrelated case studies. People memorize "how Twitter works" and then freeze when the prompt is slightly different.
> * **The Path:** Learn the process first (framework, estimation, scaling), then the building blocks (partitioning, replication, IDs, rate limiting), then the classic product designs that combine them, then the large data-heavy systems. Practice each one out loud, with a timer, before reading the solution.
> * **The Result:** You stop memorizing designs and start recognizing the same dozen ideas in new combinations. That is what transfers to interviews and to real architecture reviews.

Every post in this series reuses the same small set of ideas: split the data, copy the data, put a queue in front of slow work, cache what is read often, and decide what happens when something fails. The case studies are just different arrangements of those ideas.

This post is the map: what to read in which order, what to practice, and where to go after this series runs out.

---

## The Roadmap

![Learning roadmap in four phases: phase zero covers process with the interview framework, estimation and scaling from zero to millions; phase one covers building blocks with consistent hashing, key-value store, unique ID generator, rate limiter and URL shortener; phase two covers product designs with notifications, news feed, chat and autocomplete; phase three covers large systems with web crawler, Google Drive and video streaming; a note says the building blocks reappear in every later design](/assets/images/hld/design-learning-roadmap.webp)

The phases are ordered so that each one leans on the previous one. The news feed is much easier once you already know how sharding and caching behave; the video platform is much easier once queues and idempotent workers feel routine.

---

## Phase 0: The Process

Read these first, even if you have done system design before. They are the habits the rest of the series assumes.

* [A Practical Framework for System Design Interviews](/blog/en/design-interview-framework): how to spend 45 minutes and what gets scored.
* [Back-of-the-Envelope Estimation](/blog/en/design-back-of-envelope-estimation): turning adjectives into numbers that pick the design for you.
* [Scale From Zero to Millions of Users](/blog/en/design-scale-zero-to-millions): the standard evolution from one server to a multi-region system, each step triggered by a real bottleneck.

---

## Phase 1: Building Blocks

Each of these is small enough to design completely and shows up inside almost every bigger design.

| Post | The idea you take away |
| --- | --- |
| [Consistent Hashing](/blog/en/design-consistent-hashing) | Adding a node should move a small fraction of keys, not almost all of them |
| [Distributed Key-Value Store](/blog/en/design-key-value-store) | Quorums, replication, conflict handling and how LSM storage makes writes cheap |
| [Unique ID Generator](/blog/en/design-unique-id-generator) | Ordered IDs without a central counter, and the cost of clock trouble |
| [Rate Limiter](/blog/en/design-a-rate-limiter) | Algorithm trade-offs and atomic counters in a shared store |
| [URL Shortener](/blog/en/design-url-shortener) | Key generation, read-heavy caching and keeping the hot path tiny |

---

## Phase 2: Product Designs

These combine the building blocks into systems users touch directly. The interesting parts are about latency, fan-out and delivery guarantees.

| Post | The idea you take away |
| --- | --- |
| [Notification System](/blog/en/design-notification-system) | Queues, retries, idempotency and respecting user preferences |
| [News Feed](/blog/en/design-news-feed-system) | Fan-out on write vs read, and the hybrid that handles celebrities |
| [Chat System](/blog/en/design-chat-system) | Long-lived connections, per-conversation ordering and delivery states |
| [Search Autocomplete](/blog/en/design-search-autocomplete) | Precomputing answers offline so the online path is a lookup |

---

## Phase 3: Large, Data-Heavy Systems

Here the hard part is volume and cost: petabytes, billions of pages, millions of concurrent viewers.

| Post | The idea you take away |
| --- | --- |
| [Web Crawler](/blog/en/design-web-crawler) | A frontier that balances priority and politeness, plus dedup at scale |
| [Google Drive](/blog/en/design-google-drive) | Block-level sync, content addressing and conflict handling |
| [Video Streaming](/blog/en/design-youtube-streaming) | Resumable uploads, parallel transcoding, adaptive bitrate and CDN economics |

---

## The Building Blocks, One Line Each

If you only keep one table from this series, keep this one. Nearly every design question is a combination of these.

| Block | Reach for it when | Main cost |
| --- | --- | --- |
| Load balancer | You have more than one instance | Another hop; health checks to get right |
| Cache | Reads dominate and some staleness is fine | Invalidation and cold starts |
| Read replicas | Reads exceed one database | Replication lag |
| Sharding | Data or writes exceed one database | Cross-shard queries, rebalancing, hot keys |
| Replication and quorums | You need to survive node loss | Write latency and conflict handling |
| Message queue | Work can be async or must be retried | Duplicates; you need idempotent consumers |
| CDN | Static or media content to many users | Cost and cache invalidation |
| Object storage | Large blobs | Higher latency than local disk |
| Consistent hashing | Nodes join and leave often | Uneven load without virtual nodes |
| Rate limiting | Protecting shared resources | False positives during legitimate spikes |

---

## How to Practice So It Sticks

Reading a solution feels like learning. It mostly is not. What works:

1. **Attempt first.** Before reading a post in this series, set a 45-minute timer and design the system yourself on paper, out loud, using the framework.
2. **Then compare.** Read the post and write down the one or two things you missed. Those notes are your real study material.
3. **Revisit a week later.** Design the same system again from scratch without looking. If you can explain the main trade-off without notes, you own it.
4. **Change one requirement.** Redo a design with a twist: the URL shortener with a global audience and strict privacy, the chat system with end-to-end encryption, the feed with no ranking. Twists are what interviews actually do.
5. **Practice with another person.** Mock interviews with a peer expose the communication gaps that solo practice hides. Take turns playing interviewer; that role teaches you what a good answer sounds like.

---

## Where to Go After This Series

**Books**

* *Designing Data-Intensive Applications* by Martin Kleppmann. The best single book on how storage, replication and consistency really work. Read it slowly.
* *System Design Interview* volumes 1 and 2 by Alex Xu. Good breadth of case studies; this series covers many of the same problems from a different angle.
* *Site Reliability Engineering* (the Google SRE book). Free online. The chapters on risk, monitoring and overload explain the operational side that whiteboard designs skip.

**Papers worth reading once**

* Amazon's Dynamo paper (the ideas behind the key-value store post).
* Google's Bigtable and MapReduce papers.
* The Raft paper, for a readable explanation of consensus.

**Engineering blogs**

Company engineering blogs describe real systems with real constraints. Netflix, Discord, Cloudflare, Uber, Slack and Meta all publish detailed posts on how they built and scaled specific systems. Read one a week and ask yourself which building blocks it uses.

---

## How to Tell You Are Ready

You are ready for interviews, and for real design discussions, when:

* You can take an unfamiliar prompt and produce a requirement list in five minutes without stalling.
* Your estimates end with a conclusion, not just numbers.
* For every component you draw, you can say what breaks without it.
* You can name the main trade-off of your design and what would make you choose differently.
* You can go deep on at least one area (storage, messaging or caching) until the interviewer runs out of questions.

---

## The Leftover

I used to think the goal was to know more architectures. It turned out the goal was to need fewer. Once the dozen building blocks feel familiar, every new system looks like a remix, and the real question becomes which trade-off this particular product can afford.

That is a much calmer place to design from. Start at Phase 0.

---

## Sources

* [Martin Kleppmann, "Designing Data-Intensive Applications"](https://dataintensive.net/)
* [Google SRE Book (free online)](https://sre.google/sre-book/table-of-contents/)
* [DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store" (2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
* [Chang et al., "Bigtable: A Distributed Storage System for Structured Data" (2006)](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/)
* [Ongaro and Ousterhout, "In Search of an Understandable Consensus Algorithm" (Raft, 2014)](https://raft.github.io/raft.pdf)
* [Alex Xu, "System Design Interview: An Insider's Guide"](https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
