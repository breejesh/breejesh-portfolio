---
title: "A Practical Framework for System Design Interviews: What Gets Scored and How to Spend 45 Minutes"
description: "A repeatable plan for system design interviews: what interviewers actually score, a minute-by-minute budget, the clarifying questions that matter, how to present a high-level design and get buy-in, where to go deep for each problem type, a sample dialogue, and the habits that sink otherwise strong candidates."
date: "2026-01-22"
tags: [System Design & Architecture]
coverImage: /assets/images/design-interview-framework.webp
previewImage: /assets/images/design-interview-framework.webp
---

> **TL;DR**
> * **The Problem:** System design interviews are open-ended on purpose. Strong engineers fail them not for lack of knowledge but for lack of structure: they jump into details, design for requirements nobody stated, and run out of time before showing depth.
> * **The Framework:** Clarify (5 minutes), estimate (5), high-level design with buy-in (15), deep dives on two or three hard parts (15), wrap up with trade-offs and next steps (5). Narrate decisions as trade-offs, not facts.
> * **The Result:** A conversation the interviewer can score on every axis they care about: navigating ambiguity, sound design, technical depth and communication, with time left to go deep where it counts.

There is no correct answer to "design Twitter" in 45 minutes. Interviewers know that. What they are scoring is how you get from an ambiguous prompt to a reasonable design, and how you think when they push on it.

This post is the structure I use and recommend. It is not a script. It is a budget for your attention.

---

## What the Interviewer Is Actually Scoring

Rubrics differ by company, but they cluster into four areas:

| Area | What good looks like |
| --- | --- |
| Problem navigation | Asks the questions that change the design; scopes the problem deliberately; states assumptions |
| Solution design | Produces a coherent end-to-end design whose components each have a reason to exist |
| Technical depth | Goes deep on the hardest parts: data model, consistency, scaling bottlenecks, failure modes |
| Communication | Thinks out loud, checks in, takes hints, explains trade-offs in plain terms |

Notice what is missing: memorized architectures, buzzwords, and the "right" database. A candidate who picks the unusual option and explains the trade-off clearly scores better than one who picks the expected option and cannot say why.

---

## The 45-Minute Budget

![Interview timeline: clarify for the first five minutes, estimate from five to ten, high-level design from ten to twenty-five, deep dives from twenty-five to forty, and wrap up in the last five, with the reminder that most failed interviews skip clarification and spend forty minutes in deep dives](/assets/images/hld/design-interview-timeline.webp)

The red note describes the most common failure: diving straight into one component's internals and never establishing what the system is for.

---

## Step 1: Clarify (0 to 5 minutes)

Your goal is a short, explicit list of requirements you and the interviewer agree on.

**Functional questions (what must it do?)**

* Who are the users, and what are the two or three core actions?
* Which features are in scope today, and which can we explicitly leave out?
* Any special cases that change the design (private accounts, edits, deletes, media)?

**Non-functional questions (how well must it do it?)**

* How many users, and how active? Is traffic global or regional?
* What latency matters, and for which operation?
* Is it acceptable to show slightly stale data? Can we ever lose a write?
* Read-heavy or write-heavy?

Then write the list where you both can see it. Example for "design a news feed": post text and images, follow users, see a home feed of followed accounts newest first; 300M DAU; feed loads under 200 ms; a few seconds of delay before a post appears is fine. Out of scope: ads, messaging, search.

That list is your contract for the next 40 minutes.

---

## Step 2: Estimate (5 to 10 minutes)

Do just enough math to find the hard part: read and write QPS, storage growth, and any bandwidth that might dominate. The [estimation post](/blog/en/design-back-of-envelope-estimation) in this series has the recipes.

Say the conclusion, not just the numbers: "Reads outnumber writes about 100 to 1, and fan-out multiplies writes by follower count, so timeline storage and fan-out are the hard part."

Some interviewers will tell you to skip estimation. Do it in one sentence anyway; the conclusion still shapes your design.

---

## Step 3: High-Level Design and Buy-In (10 to 25 minutes)

Draw the end-to-end flow for each core action before drilling into anything.

1. **APIs first.** Two or three endpoints with their key parameters: `POST /posts`, `GET /feed?cursor=`. They force clarity about what each request does.
2. **Data model.** The main entities and how they are keyed and partitioned. This is where many designs quietly succeed or fail.
3. **Boxes and arrows.** Clients, edge (load balancer, CDN), services, data stores, queues. Walk one request through each core action.
4. **Check in.** "Does this cover what you want, or should we adjust before going deeper?" This is the buy-in moment, and it often earns a hint about where the interviewer wants depth.

**Common building blocks and when they earn a place:**

| Block | Add it when |
| --- | --- |
| Load balancer | More than one instance of anything |
| Cache | Read-heavy access to data that tolerates some staleness |
| Read replicas | Read load exceeds one database |
| Message queue | Work can happen after the response, or must be retried |
| CDN | Static or media content served to many users |
| Sharding | Data or write load exceeds one database after cheaper options |
| Object storage | Large blobs: images, video, files, backups |

Every box should answer "what breaks if I remove it?" If you cannot answer, remove it.

---

## Step 4: Deep Dives (25 to 40 minutes)

Pick two or three parts that are genuinely hard for this problem, or follow the interviewer's lead. Good targets by problem type:

| Problem type | Where depth lives |
| --- | --- |
| Feeds and timelines | Fan-out on write vs read, the celebrity problem, ranking, pagination |
| Chat and real-time | Connection management, ordering, delivery guarantees, presence |
| Storage systems | Partitioning, replication, consistency, conflict resolution |
| URL shortener, ID generator | Key generation, collisions, hot keys, caching |
| Rate limiter | Algorithm choice, atomicity, distributed counters, fail-open vs closed |
| Media platforms | Upload pipeline, transcoding, CDN, cost |
| Search and autocomplete | Indexing pipeline, ranking, latency budget |

For each deep dive, cover: the naive approach and why it fails, the better approach, what it costs, and how it fails. That four-part shape demonstrates depth more reliably than any amount of jargon.

---

## Step 5: Wrap Up (40 to 45 minutes)

Do not declare the design perfect. Summarize it in two sentences, then name:

* The current bottleneck and what you would do when it saturates.
* The main trade-off you made and when you would revisit it.
* What you would monitor in production.

This shows the judgment interviewers look for in senior candidates: you know what you built, what it costs, and where it will break first.

---

## A Short Sample Dialogue

> **Interviewer:** Design a URL shortener.
>
> **Candidate:** Before I draw anything, a few questions. Do we need custom aliases and expiry, or just random codes? Do we need click analytics? Roughly how many links per month, and what read-to-write ratio should I assume?
>
> **Interviewer:** Custom aliases yes, analytics roughly, 100 million links a month, mostly reads.
>
> **Candidate:** Then I'll treat redirects as the critical path and analytics as best-effort. 100 million a month is about 40 writes a second, and with 100 to 1 reads that's around 4,000 redirects a second on average. The hard parts are code generation and keeping redirects fast, so I'll design those carefully and keep analytics off the redirect path. Here are the two APIs...

Notice the candidate never claimed a "right" answer. They converted the prompt into requirements, stated the hard part, and earned the right to design it.

---

## Do and Don't

| Do | Don't |
| --- | --- |
| Write requirements down and refer back to them | Start drawing boxes in the first minute |
| Say "I'll assume X; tell me if that's wrong" | Silently assume and hope |
| Explain every choice as a trade-off | Present technologies as obviously correct |
| Walk one request end to end | Describe components in isolation |
| Check in at the end of the high-level design | Monologue for 20 minutes |
| Admit what you don't know and reason from first principles | Bluff about a technology's internals |
| Name failure modes before you're asked | Assume the happy path |

---

## Reusable Checklist

- [ ] Functional requirements listed and agreed; out-of-scope stated
- [ ] Non-functional requirements: scale, latency, consistency, availability
- [ ] Estimates with a stated conclusion about the hard part
- [ ] APIs and core data model
- [ ] End-to-end flow for each core action
- [ ] Buy-in check before deep dives
- [ ] Two or three deep dives: naive approach, better approach, cost, failure
- [ ] Wrap-up: bottleneck, main trade-off, what to monitor

---

## The Leftover

The candidates I remember are not the ones with the cleverest designs. They are the ones who asked one question at the start that I had not thought of, then built the rest of their answer around it.

That is the job, too. Most real design work is figuring out what the system is for. The boxes come later, and they are usually the easy part.

---

## Sources

* [Alex Xu, "System Design Interview: An Insider's Guide"](https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
* [Martin Kleppmann, "Designing Data-Intensive Applications"](https://dataintensive.net/)
* [Tech Interview Handbook: system design interviews](https://www.techinterviewhandbook.org/system-design/)
* [Google SRE Book: Introduction (reliability as a design goal)](https://sre.google/sre-book/introduction/)
* Related in this series: [Back-of-the-Envelope Estimation](/blog/en/design-back-of-envelope-estimation), [Keep Learning System Design](/blog/en/design-interview-learning-path), [Design a News Feed System](/blog/en/design-news-feed-system)
