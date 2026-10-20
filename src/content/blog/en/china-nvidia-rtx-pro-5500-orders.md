---
title: "Three Million Workstation Cards: China's $35 Billion Nvidia Order Shows Where Export Controls Leak"
description: "ByteDance, Alibaba and Tencent reportedly ordered over 3 million Nvidia RTX PRO 5500 cards, more than $35 billion at list price, to run AI inference. Nvidia warned it may fill only 5% to 10%. The order says more about inference demand and export-control design than about Nvidia's next quarter."
date: "2026-10-20"
tags: [Hardware & Semiconductors, Tech Policy & Law]
coverImage: /assets/images/china-nvidia-rtx-pro-5500-orders.webp
previewImage: /assets/images/china-nvidia-rtx-pro-5500-orders.webp
---

> **TL;DR**
> * **The Catalyst:** Reuters reported that ByteDance, Alibaba and Tencent have ordered more than 3 million Nvidia RTX PRO 5500 cards at about $11,400 each, over $35 billion at list price. Total Chinese orders for the card reportedly exceed 6 million units.
> * **The Mechanism:** The RTX PRO 5500 is a Blackwell-generation workstation card that complies with US export rules, which bar the B300 and review H200 sales case by case. Chinese buyers want it mainly for inference, the workload that is growing fastest and needs less compute per chip than training.
> * **The Outlook:** Nvidia has warned it may deliver only 5% to 10% of requested volumes, may cap worldwide production near 3 million units in 2027, and is shifting TSMC capacity to Rubin. The order is less a sale than a signal: Chinese inference demand is enormous, domestic chips are expensive and scarce, and export controls drawn around "data center" products leave a workstation-shaped gap.

The most interesting number in this story is not $35 billion. It is 5% to 10%.

That is the share of their orders some buyers may actually receive, according to one of Reuters' sources. Nvidia has told customers and partners it cannot guarantee delivery. Another source said Nvidia could make no more than about 3 million RTX PRO 5500 cards worldwide in 2027. Chinese customers alone have asked for more than 6 million.

So three of the largest technology companies in the world placed orders they know will mostly go unfilled. That tells you how desperate the compute situation in China has become.

---

## What Was Ordered, and Why This Card

| Item | Detail |
| --- | --- |
| Buyers | ByteDance, Alibaba, Tencent (plus other Chinese customers) |
| Card | Nvidia RTX PRO 5500, a Blackwell-era workstation GPU |
| Volume | 3M+ from the three; 6M+ from all Chinese customers |
| Price | About $11,400 per card; over $35B at list for the three |
| Use | Mainly inference |
| Timing | Early samples December 2026; commercial deliveries from Q1 2027 |
| Supply risk | Some buyers may receive 5% to 10%; Nvidia shifting TSMC capacity toward Rubin from 2027 |

The RTX PRO 5500 is not a data center chip. That is the point. US rules bar sales of the B300 to China and put the H200 under case-by-case review. Workstation cards sit in a different category. They are less capable per chip, but at inference time, capability per chip matters less than capability per dollar and per watt across thousands of cards.

There is a history here. Last year Nvidia built the RTX 6000D, a cut-down card designed for China's rules. Chinese firms mostly ignored it, hoping Washington would allow better chips. When that hope faded, demand for whatever is legal came back with interest. Nvidia has since stopped making the 6000D, and one source said its price in China has doubled.

---

## Inference Is the Demand Nobody Planned For

Export controls were designed around training: the giant clusters that produce frontier models. Inference was treated as a secondary problem.

It is not secondary anymore. Consider what we learned this month alone:

* DeepSeek reportedly spends more than 70% of its compute on training and under 30% on serving customers, and raised API prices 2.3x to 4.5x as demand outran supply.
* ByteDance reportedly consumes about one-fifth of China's delivered data center capacity. SemiAnalysis estimates China has over 24 GW operational and about 20 GW under development.
* Huawei's newest Ascend accelerators rose 20% to 50% in price in two months because of HBM shortages.

Put those together and the logic of the order becomes clear. Domestic accelerators are expensive and memory-starved. Chinese labs need more serving capacity, not just more training capacity. A legal Nvidia workstation card at around $11,400, which runs the CUDA stack every inference engine already supports, is the cheapest available unit of inference.

---

## Where the Policy Lines Sit

| Product | US export status for China (as reported) | Practical role |
| --- | --- | --- |
| B300 (Blackwell data center) | Barred | Training and large-scale inference |
| H200 | Reviewed case by case; Nvidia said in August it expected no data center revenue from first shipments | Training and inference |
| RTX 6000D | Allowed, discontinued | Cut-down China-specific workstation card |
| RTX PRO 5500 | Export-compliant | Workstation card, used here for inference |
| Domestic (Huawei Ascend, Alibaba Zhenwu V900, Cambricon) | Not applicable | Growing share, constrained by HBM supply |

Two other threads matter. Washington is reviewing how Chinese firms rent Nvidia chips they cannot buy, which is the other obvious leak. And Beijing has its own say: The Information reported last month that Chinese authorities may allow Alibaba and ByteDance to buy the new card, which implies permission was not automatic. China has spent two years pushing companies toward domestic silicon.

Nvidia's own position is blunt. Jensen Huang has said US restrictions cut Nvidia's share of China's AI data center chip market from near-monopoly to effectively nothing. A company spokesperson criticized "outdated US export controls, which cover gaming products released nearly a half a decade ago."

---

## Why Nvidia Might Not Want to Fill It Anyway

It sounds strange for a company to turn down $35 billion. But look at the trade-offs:

1. **Wafer allocation.** Every wafer spent on workstation cards for China is a wafer not spent on Rubin, the next data center platform, where margins and strategic value are higher.
2. **Policy risk.** A visible surge of Blackwell-generation silicon into Chinese inference clusters is exactly the kind of headline that triggers a new rule. Shipping slowly is a form of risk management.
3. **Customer concentration.** Hyperscalers in the US are already competing for Nvidia supply. Diverting capacity to China during a shortage creates friction with the customers who buy B300s.

So the likeliest outcome is a partial fill, spread across 2027, with a lot of the remaining demand flowing to Huawei and the domestic ecosystem at higher prices.

---

## What It Means Outside China

* **For inference providers everywhere:** the cheapest usable inference silicon is getting scarcer globally, not just in China. Workstation-class Blackwell cards were a pressure valve. A 6-million-unit order soaks it up.
* **For policy watchers:** controls defined by product category (data center vs workstation vs gaming) will keep leaking at the boundaries. Controls defined by aggregate capability or by end use are harder to write and harder to enforce, but this order is the argument for trying.
* **For Chinese open-weight models:** more serving capacity means lower latency and more availability for models like DeepSeek, Qwen and Kimi, which much of the world now downloads and runs. The geopolitics of inference hardware is not only a Chinese story.

---

## The Leftover

Shenzhen-listed Tansun Technology said in an October 13 filing that it would buy 20,000 RTX PRO 5500 cards, without naming the seller, and warned that shortages and overseas technology controls could delay deliveries or cut volumes.

Twenty thousand cards, from a company most people outside China have never heard of. Filed with a warning that they might not come. That is what the compute market looks like right now: purchase orders written as wishes.

---

## Sources

* [ByteDance, Alibaba and Tencent order $35bn of Nvidia chips, Reuters reports (The Next Web)](https://thenextweb.com/news/nvidia-rtx-pro-5500-china-orders-bytedance-alibaba-tencent)
* [ByteDance, Alibaba, Tencent place over US$35b worth of Nvidia chip orders (The Edge Malaysia / Reuters)](https://theedgemalaysia.com/node/822533)
* [China's tech giants drop $35 billion on export-compliant Nvidia RTX Pro 5500 orders (Tom's Hardware)](https://www.tomshardware.com/pc-components/gpus/chinas-tech-giants-drop-usd35-billion-on-export-compliant-nvidia-rtx-pro-5500-workstation-gpu-orders-to-power-ai-ambitions-according-to-reports-bytedance-alibaba-and-tencent-order-3-million-cards-despite-warnings-that-only-10-percent-of-orders-are-fulfillable)
* [Tech News Today, October 20, 2026 (TechStartups)](https://techstartups.com/2026/10/20/tech-news-today-october-20-2026-amazon-apple-bytedance-microsoft-nvidia-openai-salesforce-more/)
* [Top Tech News Today, September 29, 2026 (TechStartups)](https://techstartups.com/2026/09/29/top-tech-news-today-september-29-2026-anthropic-bytedance-google-meta-openai-samsung-more/)
* Related: [DeepSeek's price hikes and China's AI repricing](/blog/en/deepseek-price-hikes-china-ai-repricing)
