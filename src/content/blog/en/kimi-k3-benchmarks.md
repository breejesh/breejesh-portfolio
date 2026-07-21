---
title: "Kimi K3 Behind the Hype: Is It Really a Fable 5 Killer?"
description: "Behind the Kimi K3 hype: Artificial Analysis, LMArena, and Moonshot benchmarks vs Claude Fable 5. Spoiler: strong open model, not a clean Fable 5 killer."
date: 2026-07-19
tags: [AI, LLM, Benchmarks, Kimi, Moonshot AI]
coverImage: /assets/images/kimi-k3-cover.webp
previewImage: /assets/images/kimi-k3-cover.webp
---

The timeline treated **Kimi K3** like a **Claude Fable 5** funeral. A 2.8T open model, #1 on a coding arena, near-frontier intelligence scores. Cue the "China ends the frontier" posts.

So: is K3 actually a Fable 5 killer?

**No.** Not on overall capability. Moonshot itself says K3 still trails **Claude Fable 5** and **GPT-5.6 Sol**. Independent boards put it close to Opus-class, not above Fable. On a few coding boards it punches up. On price, speed, and verbosity it is not free power.

What follows is the receipts: vendor vs independent scores, and where the hype overshoots the data. Bookmarkable live boards sit at the end.

### What Kimi K3 actually is

Per [Moonshot's launch post](https://www.kimi.com/blog/kimi-k3):

- **2.8T total parameters**, open 3T-class positioning
- **Stable LatentMoE**: 896 experts, **16 active per token**
- **Kimi Delta Attention (KDA)** and **Attention Residuals** for long sequences and deep stacks
- **Native multimodal** text + image input (video and screenshot workflows in product demos)
- **1,048,576 token** context, flat API pricing across the full window
- Roughly **2.5x scaling efficiency** vs Kimi K2, per Moonshot
- Training/serving notes include MXFP4 weights with MXFP8 activations and a recommended **64+ accelerator** supernode for self-hosting

API pricing at launch: **$0.30 / 1M cache-hit input**, **$3.00 / 1M cache-miss input**, **$15.00 / 1M output**. Moonshot says official coding workloads often clear **90%+ cache hits** on its own stack.

That is expensive for a Chinese lab release, and closer to mid-high Western API tiers than to older Kimi pricing. The bet is that long-horizon coding and knowledge work pay for the token bill.

### Independent benchmarks (not vendor slides)

#### Artificial Analysis Intelligence Index

[Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) is the cleanest public third-party snapshot after launch.

| Metric | Reported value (AA) | Notes |
| --- | --- | --- |
| Intelligence Index v4.1 | **57** | About **#4 of 186** models in AA's class ranking |
| Output speed | **~36.9 tokens/s** | Notably slow vs median peers |
| Input / output price | **$3 / $15** per 1M tokens | Cache hit input **$0.30** |
| Evaluation verbosity | **~130M** output tokens on the index run | Far above a ~63M peer median |
| Context window | **1M** tokens | Multimodal text + image input |
| Total eval cost | about **$2.7k** for the full index suite | High token use drives cost |

Index v4.1 blends nine evals, including GDPval-AA v2, Terminal-Bench v2.1, SciCode, Humanity's Last Exam, GPQA Diamond, CritPt, AA-Omniscience, and AA-LCR. Full methodology lives on [Artificial Analysis](https://artificialanalysis.ai/methodology/intelligence-benchmarking).

**How to read the chart:** open the [Kimi K3 Intelligence section](https://artificialanalysis.ai/models/kimi-k3/#intelligence) and the [cost-per-task scatter](https://artificialanalysis.ai/models/kimi-k3/) on the same page. Capability is frontier-adjacent. Efficiency is not free.

Reporting around launch also places K3 roughly level with **Claude Opus 4.8** and **GPT-5.5** on that index, and behind **Claude Fable 5** and **GPT-5.6 Sol**. That matches Moonshot's own "still trails Fable and Sol" line.

#### Vals Index

[Vals](https://www.vals.ai/models/kimi_kimi-k3) lists Kimi K3 at **74.70% ± 0.96** on the Vals Index (release dated July 16, 2026), with a 1M context window. Vals is a separate enterprise-oriented suite, so do not mix the 74.7 figure with AA's 57 as if they share a scale.

#### LMArena Frontend Code Arena

After unblinding, K3 debuted at **#1 on LMArena's Frontend Code Arena at 1679 Elo**, ahead of Claude Fable 5 on that board, with a large jump from Kimi K2.6. Arena posts and recaps are summarized in coverage such as [BenchLM's K3 note](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) and [Simon Willison's write-up](https://simonwillison.net/2026/Jul/16/kimi-k3/).

One preference board is not the whole frontier. It is still a strong public signal for frontend and UI coding, which lines up with Moonshot's "vision in the loop" demos.

### Moonshot coding scores (vendor-reported)

These numbers come from the [official full benchmark table](https://www.kimi.com/blog/kimi-k3#full-benchmark-table). Most K3 rows were run with Moonshot's **Kimi Code** harness at max reasoning effort. Other models often use their own best harness (Claude Code, Codex, Terminus). Treat this as product-level evidence, not a pure model bake-off.

Official launch charts (self-reported suite):

![Kimi K3 official benchmark comparison chart from Moonshot AI](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlgn6rtp4tqfnnmjg?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*Source: [Moonshot AI, Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3)*

![Kimi K3 second official comparison chart from Moonshot AI](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlbnf2ena6205244g?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*Source: [Moonshot AI, Kimi K3 launch post](https://www.kimi.com/blog/kimi-k3)*

| Benchmark | Kimi K3 | What it measures | Public board / notes |
| --- | --- | --- | --- |
| Terminal-Bench 2.1 | **88.3** | Agentic terminal tasks | Cross-check [AA Terminal-Bench](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| FrontierSWE | **81.2** dominance | Hard SWE / research tasks | [frontierswe.com](https://www.frontierswe.com/) (K3 may lag public listing) |
| ProgramBench | **77.8** raw pass rate | Rebuild programs from binary + docs | [programbench.com](https://programbench.com/) / [Vals ProgramBench](https://www.vals.ai/benchmarks/programbench) |
| DeepSWE | **67.5** (Kimi Code); **67.3** mini-SWE-agent | Fresh multi-repo issue fixing | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| SWE Marathon | **42.0** | Multi-hour project work | [swe-marathon.org](https://www.swe-marathon.org/) |

Caveats that matter if you are buying this for a team:

1. **Raw pass rate ≠ fully resolved.** ProgramBench's 77.8 is test-level pass rate, not "77.8% of programs fully rebuilt."
2. **Harness is part of the score.** Moonshot warns K3 is sensitive to **preserved thinking history**. Drop that history and quality can wobble.
3. **Dominance is pairwise win probability**, not percent of tasks completed.
4. Several K3 rows were vendor-run against public harnesses before every owner board refreshed. Prefer independent pages once they update.

### Cost, speed, and token hunger

Independent measurements and early field reports converge:

- Strong intelligence score, **slow decode** (~37 t/s class on AA)
- **High verbosity** on hard evals (more output tokens than median peers)
- Cost per Intelligence Index task competitive with **GPT-5.6 Sol** in some recaps, cheaper than heavier Claude max tiers, still not "budget open model" pricing
- Cache hits matter a lot: $0.30 vs $3.00 input is a 10x swing on repeated repo context

If you run short chat prompts, K3 can feel expensive and over-eager. If you run multi-hour coding agents with stable prefixes and high cache reuse, the bill looks different.

### Native vision and long-horizon work

K3 is multimodal by design. Moonshot's case studies push kernel optimization, compiler work, game/UI loops with live screenshots, chip design sandboxes, and research-to-code pipelines. Those are demos, not leaderboards. Still, they explain the product pitch: long sessions, tools, vision feedback, and less babysitting.

For product surface area, Moonshot lists [kimi.com](https://www.kimi.com/), [Kimi Work](https://www.kimi.com/products/kimi-work), [Kimi Code](https://www.kimi.com/code), and the [Kimi API](https://platform.kimi.ai/) (`kimi-k3`).

### Who should care right now

**Worth a pilot if you:**

- Need long-horizon coding agents on large repos
- Want near-frontier quality with a path to **self-host weights** after July 27
- Care about frontend / UI work where Arena already ranked K3 first
- Can measure **cost per accepted PR**, not cost per million tokens in isolation

**Probably not your default if you:**

- Need low latency chat or high QPS cheap completions
- Cannot tolerate proactive agents that improvise on ambiguous tasks
- Need fully independent, same-harness coding boards for procurement this week

### The honest summary

Kimi K3 did not crown a new global #1 model. It did something more interesting for builders: it compressed the **open vs closed** gap into months, put open 3T-class weights on a calendar, and showed competitive coding agent results while independent labs still place it just behind Fable 5 and GPT-5.6 Sol.

Watch three concrete markers next:

1. July 27 weight release (license, checkpoints, serving stack)
2. Independent boards posting K3 with traces, costs, and confidence intervals
3. Your own bake-off: fixed harness, fixed budget, real repos

### Live charts and boards

Bookmark these when you want the latest numbers, not a screenshot frozen in this post. Key charts are also linked inline above next to the scores they support.

| Chart / board | What it shows | Link |
| --- | --- | --- |
| Artificial Analysis model page | Intelligence Index, speed, price, cost per task, token use | [artificialanalysis.ai/models/kimi-k3](https://artificialanalysis.ai/models/kimi-k3/) |
| Artificial Analysis homepage | Cross-model quality, price, and output speed charts | [artificialanalysis.ai](https://artificialanalysis.ai/) |
| Terminal-Bench 2.1 (AA) | Independent agentic terminal coding results | [artificialanalysis.ai/evaluations/terminalbench-v2-1](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| Vals model page | Vals Index and suite of enterprise / coding evals | [vals.ai/models/kimi_kimi-k3](https://www.vals.ai/models/kimi_kimi-k3) |
| DeepSWE leaderboard | Fresh repository repair tasks | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| FrontierSWE | Hard implementation / performance / research tasks | [frontierswe.com](https://www.frontierswe.com/) |
| ProgramBench | Rebuild programs from behavior + docs | [programbench.com](https://programbench.com/) |
| SWE Marathon | Multi-hour whole-project engineering | [swe-marathon.org](https://www.swe-marathon.org/) |
| Moonshot launch post | Official architecture write-up and full score table | [kimi.com/blog/kimi-k3](https://www.kimi.com/blog/kimi-k3) |
| OpenRouter route | Live API pricing and provider routing | [openrouter.ai/moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3) |

### Sources and credits

Primary and independent sources used for numbers and charts in this post:

1. [Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3) : Moonshot AI launch post, architecture, pricing, full benchmark table, official charts
2. [Kimi K3 on Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) : Intelligence Index, speed, price, verbosity, cost charts
3. [Artificial Analysis Intelligence Index methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
4. [Terminal-Bench 2.1 on Artificial Analysis](https://artificialanalysis.ai/evaluations/terminalbench-v2-1)
5. [Kimi K3 on Vals](https://www.vals.ai/models/kimi_kimi-k3) : Vals Index and related evals
6. [DeepSWE leaderboard](https://deepswe.datacurve.ai/)
7. [ProgramBench](https://programbench.com/)
8. [FrontierSWE](https://www.frontierswe.com/)
9. [SWE Marathon](https://www.swe-marathon.org/)
10. [OpenRouter: moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3)
11. [Simon Willison on Kimi K3](https://simonwillison.net/2026/Jul/16/kimi-k3/) : launch context, AA highlights, practical API notes
12. [BenchLM: Kimi K3 release note](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) : Arena Elo, independent index framing

Scores change as boards refresh. Prefer the live chart links in the section above when you need current rankings.
