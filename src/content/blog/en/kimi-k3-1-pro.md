---
title: "Kimi K3.1 Pro: Three Points From the Frontier, Twelve Days From Open Weights"
description: "Moonshot's Kimi K3.1 Pro is the same 2.8T-parameter model as K3 with far more reinforcement learning. It scores 55 on the Artificial Analysis Intelligence Index, three behind Claude Opus 5.5, at $2 / $10 per million tokens, with weights promised by November 4. Here's what the price cut, the benchmarks and the cyber filtering actually mean."
date: "2026-10-23"
tags: [AI & Machine Learning]
coverImage: /assets/images/kimi-k3-1-pro.webp
previewImage: /assets/images/kimi-k3-1-pro.webp
---

> **TL;DR**
> * **The Catalyst:** Moonshot AI released Kimi K3.1 Pro and a faster K3.1 Pro Highspeed on October 23, 2026. It is live in the Kimi apps, Kimi Work, Kimi Code and the API, at $2 / $10 per million input / output tokens. Moonshot says full weights will be released by November 4.
> * **The Mechanism:** There is no new architecture. K3.1 Pro is K3, the 2.8T-parameter mixture-of-experts model from July, put through much more post-training: large-scale reinforcement learning across hundreds of task domains. On the Artificial Analysis Intelligence Index it moves from 44 to 55, fourth overall and three points behind Claude Opus 5.5.
> * **The Outlook:** The per-token price fell by a third, but the cost per task barely moved because the model writes more. The real news is the calendar. If the weights ship as promised, the gap between the best open model and the best closed one falls to three index points.

In July I wrote that [Kimi K3 was a strong open model and not a Fable 5 killer](/blog/en/kimi-k3-benchmarks). Three months later Moonshot is back with a model that is closer to the frontier, cheaper per token and still not quite at the top.

What makes it interesting is how Moonshot got here. It did not train a bigger model. It spent more compute teaching the same one.

---

## What Shipped

| Item | Kimi K3 (July) | Kimi K3.1 Pro | K3.1 Pro Highspeed |
| --- | --- | --- | --- |
| Total / active parameters | 2.8T MoE | Same dimensions as K3; about 104B active reported | Same model, faster serving |
| Context window | 1M tokens | 1M tokens | 1M tokens |
| Input modalities | Text, image | Text, image | Text, image |
| Input / output price (per 1M tokens) | $3 / $15 | $2 / $10 | $4 / $20 |
| Cached input (per 1M tokens) | $0.30 | $0.20 | $0.20 |
| Speed claim | n/a | Baseline | 2 to 3x faster, per Moonshot |
| API model ID | `kimi-k3` | `kimi-k3.1-pro` | `kimi-k3.1-pro-highspeed` |
| Weights | Released | Promised by November 4 | Same weights |

Moonshot calls K3.1 Pro "a post-trained version of Kimi K3, with substantially larger post-training compute." The credit goes to infrastructure, not architecture: its reinforcement learning framework, long-context inference, sandbox environments, rollout scheduling and checks on environment quality.

Some practical details matter more than the headline. The API defaults reasoning effort to max and fixes temperature at 1.0. Zero Data Retention is available to API customers. Hosted inputs go to servers that Moonshot's privacy policy places in Singapore. Enterprise access is off by default, so an administrator has to turn it on.

---

## Same Model, More Teaching

This is the pattern of the year. Pretraining a frontier-scale base model is extremely expensive and takes months. Post-training (reinforcement learning on tasks with checkable outcomes such as passing tests, solving terminal problems or filling in spreadsheets correctly) is cheaper per point of improvement and much faster to repeat.

K3.1 Pro is the clearest example yet of how much was left in a base model. Moonshot's internal numbers show where the reinforcement learning went:

| Internal evaluation (Moonshot) | Kimi K3 | Kimi K3.1 Pro |
| --- | --- | --- |
| Kimi Code Bench 3.0, long-horizon | 55.95% | 61.2% |
| Financial Modeling | 50.4 | 57.6 |
| Financial Research | 58.8 | 70.4 |
| Business Operation | 8.9 | 37.0 |
| Kimi Hallu Bench Hard, claim-level hallucination (lower is better) | 23.4% | 8.3% |

The Business Operation jump, about 4x, is the kind of result you get when a model is trained on a task family it previously barely saw. The hallucination drop is the one I would want verified independently, and part of it has been: on Artificial Analysis's AA-Omniscience test, the hallucination rate fell from 53% to 44%. That is real progress, but it is a much smaller drop than Moonshot's internal benchmark shows.

---

## The Benchmarks, Independent First

### Artificial Analysis

| Metric | Kimi K3 | Kimi K3.1 Pro | For context |
| --- | --- | --- | --- |
| Intelligence Index | 44 | **55** (4th overall) | Opus 5.5: 58; Sonnet 5.5 and Muse Wonder Full: 56 |
| Terminal-Bench 4.0 | 13% | 67% | Sonnet 5.5: 64% |
| GDPval-AA (Elo) | 1,534 | 1,846 | Opus 5.5: 1,866; Wonder Full: 1,857 |
| Humanity's Last Exam | 47% | 52% | Opus 5.5: 61% |
| CritPt | 23% | 25% | Opus 5.5: 32% |
| SciCode | 59% | 61% | |
| AutomationBench-AA | 58% | 73% | Opus 5.5: 70% |
| Cyber Index | 41% | 64% | Highest of any openly available model |

The pattern is clear. The biggest gains are in agentic and workplace tasks: terminal work, office automation and economically useful tasks. The smallest gains are in hard science reasoning (CritPt, SciCode, Humanity's Last Exam), where Opus 5.5 still leads comfortably. Reinforcement learning on checkable tasks improves what it trains on. It does not make a model a better physicist.

One warning about comparing across posts. In July, Artificial Analysis scored K3 at 57. It now lists K3 at 44. The model did not get worse. The index was revised, and benchmark versions moved too: K3 scored 88.3 on Terminal-Bench 2.1 and 13% on Terminal-Bench 4.0. Only compare numbers taken from the same version of the same board.

### Moonshot's own table

| Benchmark (Moonshot-reported, max effort) | K3.1 Pro | Claude Opus 5.5 | GPT-6 Astra | DeepSeek V4.1 Flash |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | 65.7 | 66.4 | 58.2 | 42.3 |
| SWE Marathon v1.1 | 51.7 | 46.3 | 42.5 | 40.0 |
| DeepSWE v1.1 | 75.5 | 74.2 | 74.1 | 77.0 |
| HLE-Full (with tools) | 70.0 | 67.7 | 57.2 | 58.8 |
| BrowseComp | 92.1 | 90.8 | 91.5 | n/a |
| OfficeQA Pro v2 | 64.4 | 62.2 | 54.4 | 40.4 |
| GPQA Diamond | 94.2 | 93.9 | 96.1 | 92.2 |
| BenchCAD (with tools) | 92.7 | 96.2 | 95.9 | 81.6 |
| ExploitBench | 74.7 | 91.0 | 100 | n/a |

Two things stand out. First, Moonshot's own Terminal-Bench 4.0 number (65.7) puts K3.1 Pro slightly *behind* Opus 5.5, while Artificial Analysis's run (67%) puts it slightly ahead. Within the margin of how the test harness is set up, call it a tie. Second, these rows come from different evaluation setups for different models, not a single controlled comparison. Treat them as evidence about the product, not a clean ranking.

The SWE Marathon lead, 51.7 against 46.3 for Opus, is the number Moonshot will promote most. Multi-hour project work is exactly what heavy reinforcement learning on long-horizon coding should improve. It is also self-reported, so I would wait for the public leaderboard before relying on it.

---

## The Price Cut That Mostly Isn't

The rate card fell by a third: $3 / $15 down to $2 / $10. That puts K3.1 Pro at exactly the same list price as Claude Sonnet 5.5 and GPT-6 Sol, the [$2 / $10 tier everyone converged on](/blog/en/frontier-model-price-convergence) this month.

Now look at the bill per task:

| | Kimi K3 | Kimi K3.1 Pro | Change |
| --- | --- | --- | --- |
| Input / output price per 1M tokens | $3 / $15 | $2 / $10 | -33% |
| Average output tokens per Intelligence Index task | ~48,000 | ~55,000 | +14% |
| Cost per Intelligence Index task (AA launch report) | ~$2.00 | ~$1.98 | ~-1% |

The model is more capable, and it writes more to get there. The cheaper tokens are almost exactly offset by the extra tokens. Artificial Analysis counts about 150 million output tokens to run its full index on K3.1 Pro, against a median of about 81 million for comparable models, and measures its output speed near the bottom of the models it tracks.

That does not make it expensive. At roughly $2 per index task it still costs about a third of what Opus 5.5 costs on the same suite. But the honest summary is "the same price for a much better model," not "a price cut." And the Highspeed variant, at $4 / $20, costs the same per token as Opus 5.5.

The rest of the market for comparison:

| Model | Input / output (per 1M tokens) |
| --- | --- |
| Xiaomi MiMo-V2.6-Pro | $0.435 / $0.87 |
| DeepSeek V4.1 Flash 1017 (peak) | $0.30 / $1.20 |
| Kimi K3.1 Pro | $2 / $10 |
| Claude Sonnet 5.5 / GPT-6 Sol | $2 / $10 |
| Kimi K3.1 Pro Highspeed | $4 / $20 |
| Claude Opus 5.5 / Meta Muse Wonder | $4 / $20 |
| GPT-6 Astra | $10 / $50 |

Moonshot is not competing with DeepSeek on price. It is pricing like a Western workhorse model and betting that open weights and near-Opus scores justify it.

---

## The Cyber Line Moonshot Drew

The most interesting paragraph in the launch post is about what Moonshot removed. It says it "identified and removed cyber-related data from both training stages" for the open-weight release, and states a principle: "we aim not to release open weights that would extend the absolute frontier of cyber capability."

It published the cost of that choice on its internal xdev-bench-hard (pass@3):

| Checkpoint | xdev-bench-hard |
| --- | --- |
| K3.1 Pro before cyber risk reduction | 90.5% |
| K3.1 Pro as released | 81.0% |
| DeepSeek V4.1 Flash | 85.7% |
| GLM-5.3 | 57.1% |
| Kimi K3 | 33.3% |

It is rare for any lab to publish a before-and-after number for deliberately limiting a capability in open weights. It follows the logic of the [GPT-6 Astra critical cyber threshold](/blog/en/gpt-6-astra-critical-cyber-threshold): once weights are public, there is no way to restrict access afterward, so the restriction has to happen during training.

There is a tension, though. Even after the filtering, Artificial Analysis ranks K3.1 Pro the strongest openly available model on its Cyber Index (64%) and reports 95% on CyberGym-E2E-AA, with no safety refusals in its runs. The released model still scores more than twice what K3 did on Moonshot's own exploit benchmark. Moonshot says its cyber capability "remains behind that of frontier proprietary models," and that is true. But behind the frontier still means far beyond anything that was openly downloadable a year ago.

---

## What 2.8 Trillion Open Parameters Actually Gets You

"Open weights" at this size does not mean you can run it on your laptop. For K3 in July, Moonshot recommended a supernode of 64 or more accelerators for self-hosting. K3.1 Pro has the same dimensions, so plan for the same scale.

The people who benefit are specific:

1. **Inference providers.** Anyone with a large cluster can host it and compete with Moonshot's own API on price and speed. Expect OpenRouter listings from several hosts within days of the weight release.
2. **Sovereign and regulated deployers.** Governments, banks and hospitals that cannot send data to Singapore, or to any hosted API, get a near-frontier model they can run on their own hardware.
3. **Fine-tuners and researchers.** A 55-point base to distill from, specialize or study is something no open release has offered before.

For everyone else, K3.1 Pro is a hosted API that happens to have a public checkpoint. That still matters: it puts a ceiling on what closed labs can charge for this tier of capability.

---

## What to Watch Before November 4

1. **The license.** Moonshot has said "open license" and nothing more. Kimi K2 shipped under a modified MIT license that only adds an attribution requirement for very large commercial deployments. Anything stricter than that would be the story.
2. **Whether the weights match the API.** The cyber-filtered checkpoint is described as the released model. Check that the downloadable weights and `kimi-k3.1-pro` behave the same on independent reruns.
3. **Independent SWE Marathon and DeepSWE results.** These are the coding claims that justify the price. Public leaderboards should confirm or deflate them within weeks.
4. **Third-party hosting prices.** If other providers serve it well below $2 / $10, Moonshot's rate card stops being the reference price.

---

## The Leftover

Moonshot's research page has one sentence that describes its strategy: "Our research seeks the optimal conversion from energy into intelligence."

K3.1 Pro shows what that means in practice. The same parameters and the same architecture, with eleven points gained on the index from post-training alone. If the closed labs' lead now depends mostly on post-training, and post-training is the part that is cheap to repeat, a three-point gap will not last long.

---

## Sources

* [Kimi K3.1 Pro launch post (Moonshot AI)](https://www.kimi.com/blog/kimi-k3-1-pro)
* [Kimi K3.1 Pro: Intelligence, Performance and Price Analysis (Artificial Analysis)](https://artificialanalysis.ai/models/kimi-k3-1-pro)
* [Moonshot's Kimi K3.1 Pro flirts with open weights leadership (VentureBeat)](https://venturebeat.com/technology/moonshots-kimi-k3-1-pro-flirts-with-open-weights-leadership-amid-paid-influencer-scandal-allegations)
* [Kimi K3.1 Pro: 1M Context, 3T Open Weights (Tech Insider)](https://tech-insider.org/kimi-k3-1-pro-moonshot-ai-1m-context-open-weight-2026/)
* [Kimi continues to challenge the frontier with K3.1 Pro (The Rundown AI)](https://www.therundown.ai/articles/kimi-continues-to-challenge-the-frontier-with-k3-1-pro)
* Related: [Kimi K3 behind the hype](/blog/en/kimi-k3-benchmarks), [the $2 / $10 price convergence](/blog/en/frontier-model-price-convergence) and [DeepSeek's price hikes](/blog/en/deepseek-price-hikes-china-ai-repricing)
