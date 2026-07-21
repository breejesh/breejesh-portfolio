---
title: "Gemini 3.6 Flash: 17% fewer tokens, 350 tok/s Lite, and a cyber specialist"
description: "Google shipped Gemini 3.6 Flash, 3.5 Flash-Lite, and 3.5 Flash Cyber in CodeMender. Benchmarks, $1.50/$7.50 pricing, 350 tok/s, and native computer use."
date: 2026-07-21
tags: [AI, Gemini, LLM, Google, Benchmarks, Cybersecurity]
coverImage: /assets/images/gemini-3-6-flash-cover.webp
previewImage: /assets/images/gemini-3-6-flash-cover.webp
---

Google shipped three lightweight models in one go: **Gemini 3.6 Flash**, **Gemini 3.5 Flash-Lite**, and **Gemini 3.5 Flash Cyber**.

If you run agents in production, you already know the bottleneck is rarely "is the model smart enough?" It is usually token burn, latency, and cost per finished task. This release is aimed at that loop: less verbose output, faster decode, and a security-tuned variant for CodeMender.

Quick map of the three:

| Model | Role | Headline number |
| --- | --- | --- |
| **3.6 Flash** | Default workhorse (code, multimodal, general) | ~17% fewer output tokens vs 3.5 Flash |
| **3.5 Flash-Lite** | High throughput, cheap volume work | **350** output tokens/sec |
| **3.5 Flash Cyber** | Security agent inside CodeMender | Frontier CyberGym scores at Flash-class cost |

---

## Gemini 3.6 Flash: better answers, less chatter

3.6 Flash replaces 3.5 Flash as the main coding and multimodal workhorse. Google did not sell it as a parameter flex. The pitch is cleaner agent runs: fewer wasted tokens while tools loop.

![Gemini 3.6 Flash token efficiency and reduced verbosity in OSWorld (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-6-flash__evals__figure-.width-1200.format-webp.webp)

*Source: [Google Blog, Gemini 3.6 Flash announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

### Efficiency numbers that matter

* **~17% fewer output tokens** on the Artificial Analysis Index versus 3.5 Flash for the same work.
* **Up to ~65% fewer output tokens on code tasks** (DeepSWE-style runs), from fewer dead-end tool loops and tighter edits.
* **Price:** **$1.50 / 1M input** and **$7.50 / 1M output**.

For multi-step agents, that combination is the point. You pay less twice: shorter generations, and a lower rate on what remains.

![Gemini 3.6 Flash benchmark gains on DeepSWE, MLE Bench, and OSWorld (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-6-flash__evals__quality.width-1200.format-webp.webp)

*Source: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

### Quality moves (not just cheaper)

| Benchmark | 3.5 Flash | 3.6 Flash | What it tracks |
| --- | --- | --- | --- |
| DeepSWE | 37.0% | **49.0%** | Code edit precision and issue resolution |
| MLE Bench | 49.7% | **63.9%** | ML engineering workflows |
| OSWorld-Verified | 78.4% | **83.0%** | Computer use and GUI navigation |
| GDPval-AA v2 | 1349 | **1421** | Multimodal document parsing and reasoning |

### Native computer use on the client

Computer use is now a first-class client-side tool in the Gemini API and Gemini Enterprise. You do not need a pile of custom wrappers so the model can read the screen, click, and drive a UI.

Google also tightened resistance to CBRN and cyber-offense jailbreaks, while trying not to brick normal developer prompts.

---

## Gemini 3.5 Flash-Lite: 350 tokens per second

When the job is volume and latency, not deep multi-hop reasoning, **3.5 Flash-Lite** is the volume SKU.

![Gemini 3.5 Flash-Lite price and performance positioning (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-5-flash-lite__evals__co.width-1200.format-webp.webp)

*Source: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

* **Speed:** **350 output tokens/sec** on the Artificial Analysis Index (fastest in the Gemini 3.5 family Google cites here).
* **Price:** **$0.30 / 1M input**, **$2.50 / 1M output**.
* **Fits:** bulk document extraction, high-QPS search agents, receipt pipelines, tight UI prototyping loops.

Versus older Flash-Lite, Google claims a clear quality step without giving up sub-second responses under high QPS.

---

## Gemini 3.5 Flash Cyber and CodeMender

Finding and fixing vulns is an agent problem with a nasty cost curve if every step uses a giant generalist model.

**3.5 Flash Cyber** is a security-tuned Flash variant that runs inside **CodeMender**, Google's automated code security agent stack.

![Gemini 3.5 Flash Cyber performance within CodeMender on CyberGym (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-5-flash-cyber__evals__c.width-1200.format-webp.webp)

*Source: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

* Multiple Cyber agents can run in parallel inside CodeMender: audit, validate, propose patches.
* CyberGym results are described as frontier-class at Flash-class spend.
* Access is limited: trusted enterprise and government partners via CodeMender, dual-use policy applies.

---

## Pricing side by side

| Model | Input / 1M | Output / 1M | Best when |
| --- | --- | --- | --- |
| **3.6 Flash** | $1.50 | $7.50 | Default agent / coding / multimodal |
| **3.5 Flash-Lite** | $0.30 | $2.50 | Throughput and bulk jobs |
| **3.5 Flash Cyber** | partner | partner | CodeMender security agents only |

Numbers above are Google's published list rates for the public Flash SKUs. Always re-check the [pricing page](https://ai.google.dev/pricing) before you budget a fleet.

---

## Availability and what Google said next

* **3.6 Flash:** Gemini API, AI Studio, Gemini Enterprise, consumer Gemini app.
* **3.5 Flash-Lite:** API and AI Studio now, Search roll-out called out.
* **3.5 Pro:** partner testing, public release "soon" in Google's wording.
* **Gemini 4:** pre-training underway (Google's statement, not a ship date).

---

## Who should care

* **Agent builders:** 3.6 Flash is the default swap if tool loops were eating your bill.
* **High-QPS pipelines:** Flash-Lite at 350 tok/s and $0.30/$2.50 is the volume lane.
* **Security teams already in Google's enterprise path:** Cyber + CodeMender is the specialized track, not a public free-for-all.

If you only try one thing this week, run the same agent suite on 3.5 Flash vs 3.6 Flash and log **tokens per finished task** plus pass rate. That single A/B usually tells you more than a blog chart.

Full announcement: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/).
