---
title: "DeepSeek Raised Prices Up to 4.5x and Doubled Revenue. China's Cheap-AI Era Is Ending in Public"
description: "DeepSeek hit a $1 billion revenue run rate after raising API prices by roughly 2.3x to 4.5x. Domestic AI chips got 20% to 50% pricier, Moonshot filed for an IPO, and the price war that defined Chinese AI is turning into a scarcity market."
date: "2026-09-25"
tags: [AI & Machine Learning, Tech Business & Finance, Hardware & Semiconductors]
coverImage: /assets/images/deepseek-price-hikes-china-ai-repricing.webp
previewImage: /assets/images/deepseek-price-hikes-china-ai-repricing.webp
---

> **TL;DR**
> * **The Catalyst:** DeepSeek has reached a $1 billion annualized revenue run rate, more than double the pace of a few months ago, according to The Information. Part of the jump came from API price increases of roughly 2.3x to 4.5x. It is now raising about 50 billion yuan (roughly $7.45 billion) and has hired CITIC Securities for a possible Shanghai listing.
> * **The Mechanism:** Chinese AI was cheap because labs were buying market share and compute was still obtainable. Neither is true anymore. US controls on high-bandwidth memory pushed Huawei's newest Ascend accelerator 20% to 50% higher in two months, and DeepSeek reportedly spends more than 70% of its compute on training, leaving under 30% to serve customers.
> * **The Outlook:** The labs that started the 2025 price war are now pricing for scarcity and for public-market investors. Developers who built on rock-bottom Chinese API prices should plan for costs that look a lot more like everyone else's, or self-host the open weights.

In January 2025, DeepSeek's R1 knocked roughly half a trillion dollars off Nvidia's market cap in a day because it looked cheap. Cheap to train, cheap to serve, cheap to call. For eighteen months, "the Chinese labs will undercut you" was the most reliable assumption in AI pricing.

This week we learned what DeepSeek did with that reputation. It raised prices by up to 4.5x, and revenue more than doubled.

That is not a contradiction. It is a market telling you the product was underpriced.

---

## The DeepSeek Numbers

| Metric | Reported figure |
| --- | --- |
| Annualized revenue run rate | ~$1 billion, more than double a few months earlier |
| API price increases | Roughly 2.3x to 4.5x |
| Funding target | ~50 billion yuan (~$7.45 billion), aiming to close by end of October |
| Reported valuation | ~500 billion yuan |
| IPO preparation | CITIC Securities hired for a possible STAR Market listing (timing undecided) |
| Compute allocation | Reportedly over 70% to training, under 30% to inference |
| Latest model | DeepSeek-V4.1-Flash, released this month |

CEO Liang Wenfeng reportedly disclosed the run rate at an investor meeting. It is worth being precise about what a run rate is: the current pace annualized, not revenue booked over the past year. Reported revenue for January through July was far smaller, around 475 million yuan. The curve is steep and recent.

The compute split is the line I would underline. A lab that sends seven of every ten accelerators to training has very little room to serve traffic. When demand rises and supply cannot, the only lever left is price. DeepSeek pulled it.

---

## The Supply Side: Chips Got Expensive Too

DeepSeek is not raising prices in a vacuum. Two weeks ago, Reuters reported that China's domestic AI chipmakers were raising prices as a shortage of high-bandwidth memory bit.

| Chip | Old price (approx.) | New price (approx.) | Change |
| --- | --- | --- | --- |
| Huawei Ascend 950DT (ships Q4 2026) | n/a | Over 250,000 yuan (~$37,000) | 20% to 50% above quotes two months earlier |
| Huawei Ascend 950PR | ~60,000 yuan | Over 80,000 yuan | ~30% |
| Huawei Ascend 910C | ~90,000 yuan | Over 110,000 yuan | ~22% |
| Cambricon 690 (unreleased) | n/a | n/a | Repriced 20% to 30% higher |
| MetaX, Iluvatar CoreX | n/a | n/a | Similar increases reported |

The cause is memory, not logic. US export controls on advanced HBM tightened in December 2024. Chinese accelerator vendors can design competitive compute dies and get them made domestically, but they need stacks of HBM next to them, and grey-market HBM reportedly costs several times what buyers outside China pay. CXMT has started small-scale HBM3E production and plans to expand in 2027. Until then, every Ascend board carries an expensive memory problem.

So the chain is simple. Memory is scarce, accelerators get pricier, inference capacity stays tight, and API prices go up.

---

## The Capital Side: Everybody Wants to List

Pricing for scarcity is also pricing for investors.

* **DeepSeek** is raising roughly $7.45 billion and preparing for a possible STAR Market listing.
* **Moonshot AI**, maker of Kimi, confidentially filed for a Hong Kong IPO in early September after a private round that reportedly valued it around $50 billion, up from $31.5 billion earlier in the summer. Reports put the raise at $3 billion to $5 billion, with a listing as early as Q1 2027.
* **Zhipu and MiniMax** already went public in Hong Kong earlier this year, giving investors a public-market reference point for Chinese model companies.

Public-market investors want to see revenue lines that bend upward and gross margins that are not negative. A lab that charges below cost to win share is a great story in a private round. In a prospectus it is a risk factor. The 2.3x to 4.5x increase reads to me like a company tidying up its numbers before the auditors arrive.

---

## The Geopolitical Side

The price story sits inside a louder argument. Washington has accused Chinese labs of "industrial-scale" distillation of US frontier models. This month China's Ministry of Commerce rejected the claim, said the technique is widely used, and warned it could retaliate if the US adds restrictions.

The irony is that Chinese open weights are increasingly part of the US stack. Harvey, the legal AI company that just raised $550 million at a $15.5 billion valuation, built its first in-house model, Harvey Tenet, on Moonshot's open-weight Kimi K3. The distillation fight is about who copied whom. The deployment reality is that everyone builds on everyone.

---

## What This Means If You Build on Chinese Models

| If you depend on... | What changes | What to do |
| --- | --- | --- |
| DeepSeek or Kimi hosted APIs for cost | Your cost per token may have just doubled or more | Re-run your unit economics with today's rate card, not last year's |
| Open weights (DeepSeek, Qwen, Kimi) | Nothing about the license. The weights are still yours to run | Price self-hosting on your own GPUs or a neutral inference provider |
| A Chinese model as the "cheap fallback" in a router | The spread between budget and frontier tiers is narrowing | Benchmark the fallback against US budget models (Haiku-, Flash-, Luna-class) on your own tasks |
| Long-term commitments | The labs are about to have public shareholders | Expect pricing to follow margin targets, not market-share targets |

The deeper lesson is about where the moat lives. For a while it looked like Chinese labs had found a way to make intelligence nearly free. What they had actually found was a way to make it look nearly free while compute was cheap and investors were patient. Both of those were temporary.

---

## The Leftover

I keep thinking about that compute split. Seventy percent to training. Thirty to serving.

It describes a company that still believes the next model matters more than this month's customers. That is a good instinct for a research lab. It is a strange one for a company about to tell public investors about its revenue. Somewhere between the 70 and the 30 is where DeepSeek's price list now lives.

---

## Sources

* [DeepSeek hits $1 billion revenue run rate as Chinese AI startup targets $7.5 billion raise (TechStartups, citing The Information)](https://techstartups.com/2026/09/24/deepseek-hits-1-billion-revenue-run-rate-as-chinese-ai-startup-targets-7-5-billion-raise/)
* [China's AI chipmakers raise prices as high-bandwidth memory shortage bites (Kuwait Times / Reuters)](https://kuwaittimes.com/article/49537/business/chinas-ai-chipmakers-raise-prices-as-high-bandwidth-memory-shortage-bites/)
* [Prices of Chinese AI chips soar (TrendForce)](https://www.trendforce.com/news/?p=63912)
* [Moonshot AI files confidentially for Hong Kong IPO (Dealroom)](https://dealroom.co/news/info-kyt1c4-moonshot-ai-files-confidentially-for-hong-kong-ipo/)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
* [Top Tech News Today, September 24, 2026 (TechStartups)](https://techstartups.com/2026/09/24/top-tech-news-today-september-24-2026-amazon-anthropic-deepseek-google-meta-openai-oracle-more/)
* Related: [Kimi K3 benchmarks](/blog/en/kimi-k3-benchmarks)
