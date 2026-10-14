---
title: "Everyone Is Charging $2 and $10 Now: The Frontier Model Price War Ended in a Tie, and Moved Somewhere Harder to See"
description: "Claude Sonnet 5.5, Gemini 4 Argon and OpenAI's GPT-6.1 Sol all landed at roughly $2 per million input tokens and $10 per million output. Haiku 5.5 went to $0.10. The real price differences now hide in effort settings, tokenizers, context thresholds and introductory periods."
date: "2026-10-14"
tags: [AI & Machine Learning, Tech Business & Finance]
coverImage: /assets/images/frontier-model-price-convergence.webp
previewImage: /assets/images/frontier-model-price-convergence.webp
---

> **TL;DR**
> * **The Catalyst:** Between September 22 and October 13, Anthropic shipped Opus 5.5, Sonnet 5.5 and Haiku 5.5, OpenAI moved ChatGPT to GPT-6 and listed GPT-6.1 Sol in its API, and Google made Gemini 4 Argon generally available. The workhorse tier converged on about $2 per million input tokens and $10 per million output.
> * **The Mechanism:** When list prices match, vendors compete on the parts of the bill that are harder to compare: tokens per task, effort settings, tokenizer changes, long-context surcharges, cache pricing and introductory rates that expire. Gemini 4 Argon's price doubles after November 30. Haiku 5.5's price rises 5x above 100K tokens.
> * **The Outlook:** Per-token price is no longer a useful comparison. Teams that pick models by rate card will overpay. Teams that measure cost per completed task on their own workloads, and re-measure after every model update, will not.

I opened four pricing pages this week and had the strange experience of seeing the same two numbers on three of them.

$2 per million input tokens. $10 per million output tokens.

Claude Sonnet 5.5. Gemini 4 Argon, at its introductory price. And, according to pricing trackers, OpenAI's GPT-6.1 Sol. Three labs that spent two years undercutting each other have, for their main workhorse models, arrived at the same rate card.

That does not mean the price war is over. It means it moved.

---

## The Rate Cards, Side by Side

| Model | Released | Input / Output (per 1M tokens) | Notes |
| --- | --- | --- | --- |
| Claude Fable 5.1 | Earlier in 2026 | $10 / $50 | Anthropic's top tier |
| GPT-6 Astra | Sep 3 | $10 / $50 | First "Critical" cyber model; offensive tasks gated |
| Claude Opus 5.5 | Sep 22 | $4 / $20 | Cut from $5 / $25; cache reads $0.20 (from $0.50); fast mode $8 / $40 |
| Claude Sonnet 5.5 | Sep 28 | $2 / $10 | Same list price as Sonnet 5; Anthropic claims up to 30% less per task |
| GPT-6.1 Sol | Late Sep | $2 / $10 (as listed by pricing trackers) | 1.1M context reported |
| Gemini 4 Argon | GA Oct 13 | $2 / $10 introductory, then $4 / $20 from Dec 1 | Cached input 95% cheaper; up to 1M tokens |
| Gemini 3.8 Flash | Sep 3 | $0.75 / $3.75 | Introductory through Dec 31 |
| Claude Haiku 5.5 | Oct 7 | $0.10 / $0.50 under 100K tokens; $0.50 / $2.50 above | 1M context, 128K output; Sonnet 5.5 cache reads halved the same day |

The tiers are now obvious. A premium tier at $10 / $50, increasingly gated by identity for the most sensitive capabilities. A workhorse tier at roughly $2 / $10. A budget tier from $0.10 to $0.75 input. Anthropic's Opus sits between the first two, which is a deliberate choice: close enough to the workhorse price that heavy users stop routing around it.

---

## Where the Real Price Lives Now

If the sticker is the same, the bill is not. Here is where the differences moved.

### 1. Tokens per task

Anthropic's pitch for Sonnet 5.5 is not a lower rate. It is that the model finishes the same work with fewer tokens, so you pay up to 30% less per task. That is a real effect when it holds. But independent evaluators have pointed out the flip side: at the highest effort setting, the model reaches top scores by spending far more tokens, and the bill can rise instead of fall. One analysis estimated the effort dial alone can swing cost by a factor of twenty.

### 2. Effort settings and defaults

Opus 5.5's "about 40% cheaper to run than Opus 5" claim compares each model at its default effort, which for Opus 5.5 is medium and for Opus 5 was high. Benchmark wins, meanwhile, were reported at maximum effort. Both statements can be true. They just describe different products.

### 3. Tokenizers

One analysis of Haiku 5.5 found its new tokenizer counts the same text as roughly 30% more tokens than Haiku 4.5 did. A 75% lower price on 30% more tokens is still a big cut, but it is not the cut on the headline. Any time a vendor changes tokenizers, your per-token comparison silently breaks.

### 4. Thresholds and cliffs

* Haiku 5.5 costs 5x more per token for prompts above 100K tokens.
* Gemini 4 Argon's $2 / $10 is introductory. After November 30 it becomes $4 / $20 for the public model.
* Gemini 3.8 Flash's pricing is introductory through December 31.

If you are benchmarking in October for a system you will run in January, you are benchmarking a price that will not exist.

### 5. Cache pricing

For agent workloads that reread the same codebase or document set, the cache-read price matters more than the input price. Anthropic cut Opus 5.5 cache reads by 60% and halved Sonnet 5.5's. Google prices Argon's cached input 95% below fresh input. For a long-running coding agent, these numbers dominate the bill.

---

## Why Convergence Happened

A few forces pushed the workhorse tier to the same spot at the same time:

* **Shared hardware economics.** The labs are buying similar accelerators, from Nvidia or from Broadcom-built custom silicon, at similar prices, with similar HBM constraints. Serving costs converge, so prices do too.
* **Enterprise procurement.** Large buyers increasingly run multi-model routers. A model priced 30% above its peers for similar quality simply loses traffic.
* **The premium tier carries the margin.** With top capabilities gated (OpenAI's Daybreak, Google's Fairwind, and Anthropic's Mythos 5.1 released only to vetted cyber defenders and life-sciences researchers on October 6), the highest-value access is sold on trust and identity, not on per-token price.
* **Consumer scale.** ChatGPT now has more than 1.2 billion weekly users, and GPT-6 Sol and Luna rolled out to free and paid users alike in the first week of October. When the consumer product is the distribution, the API price is less of a profit center and more of a reference point.

---

## How I Would Choose a Model This Quarter

| Question | Why it matters more than the rate card |
| --- | --- |
| What is the cost per *completed* task on my eval set? | Captures tokens per task, retries and failures in one number |
| At which effort setting? | The same model can be the cheapest or most expensive option depending on this dial |
| How many of my prompts cross 100K tokens? | Long-context surcharges can dominate a RAG or agent workload |
| What is my cache hit rate? | For agents, cache-read price often matters more than input price |
| When does the introductory price end? | Budget for the price you will pay, not the one you tested |
| Did the tokenizer change? | Re-baseline after every model upgrade, even within a family |

The router pattern is the right default. Send the bulk of traffic to a budget model, escalate to a workhorse model when the budget model fails a quality check, and keep the premium tier for the small slice of tasks where it changes the outcome. Then measure every month, because the vendors certainly will.

---

## The Leftover

There is something almost funny about three competitors landing on $2 and $10. It looks like peace.

It is not. The fight just moved into the footnotes: a tokenizer, an effort default, a threshold at 100,000 tokens, an end date on November 30. The cheapest model is now the one whose footnotes you actually read.

---

## Sources

* [Claude Opus 5.5 launch and price cut (BetaNews)](https://betanews.com/article/claude-opus-5-5-launch-price-cut/)
* [Claude Opus 5.5: benchmarks, pricing and real costs (MetricNexus)](https://metricnexus.ai/blog/claude-opus-5-5-benchmarks-pricing)
* [Claude Sonnet 5.5: benchmarks, pricing and real costs (MetricNexus)](https://metricnexus.ai/blog/claude-sonnet-5-5-benchmarks-pricing)
* [Reading the Claude Haiku 5.5 price table (BrainDetox)](https://braindetox.kr/en/posts/claude_haiku_5_5_release_pricing_2026.html)
* [Introducing Gemini 4 Argon (Google)](https://blog.google/intl/en-in/products/introducing-gemini-4-argon/)
* [GPT-6.1 Sol pricing (AnotherWrapper)](https://anotherwrapper.com/llm-pricing/gpt-6.1-sol)
* [OpenAI launches GPT-6 with Intelligent UI (TechStartups)](https://techstartups.com/2026/10/07/openai-launches-gpt-6-with-intelligent-ui-turning-chatgpt-into-an-interactive-visual-experience/)
* [Top Tech News Today, October 8, 2026 (TechStartups)](https://techstartups.com/2026/10/08/top-tech-news-today-october-8-2026-globalfoundries-google-manus-microsoft-nvidia-openai-tencent-more/)
* Related: [Gemini 3.8 Flash and Flash Cyber](/blog/en/gemini-3-8-flash-cyber)
