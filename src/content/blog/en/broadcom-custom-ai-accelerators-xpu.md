---
title: "Broadcom's XPU Boom: The AI Labs Are Becoming Chip Companies, and Wall Street Is Paying for the Fabs"
description: "Broadcom's AI chip revenue grew 221% to $16.7 billion, with Anthropic on track to be its largest custom accelerator customer. Behind the growth is a financing machine, a 10-gigawatt order book and Nvidia's quiet counter-move."
date: "2026-09-18"
tags: [Hardware & Semiconductors, Tech Business & Finance]
coverImage: /assets/images/broadcom-custom-ai-accelerators-xpu.webp
previewImage: /assets/images/broadcom-custom-ai-accelerators-xpu.webp
---

> **TL;DR**
> * **The Catalyst:** Broadcom reported fiscal Q3 2026 AI semiconductor revenue of $16.7 billion (up 221% year over year), guided Q4 to $21.7 billion, and laid out an AI revenue outlook of roughly $115 billion for fiscal 2027 and $230 billion for fiscal 2028.
> * **The Mechanism:** Six customers now design their own accelerators (XPUs) with Broadcom. Anthropic alone has 1 GW of TPUs deploying this year, 5 GW planned for 2027 and an incremental 10 GW in line of sight for 2028. The two labs that cannot fund this from cash flow, Anthropic and OpenAI, are financed through an Apollo and Blackstone vehicle.
> * **The Outlook:** The GPU monopoly is not breaking. It is being routed around, one gigawatt at a time. Nvidia's answer, a $3.5 billion investment in MediaTek and NVLink Fusion, is to make sure custom chips still plug into its racks.

For three years the AI hardware story had one protagonist. You bought Nvidia, or you waited for Nvidia.

Broadcom's Q3 call was the clearest evidence yet that the biggest buyers have stopped waiting. They are designing their own silicon, and Broadcom is the company that turns those designs into wafers, packages, networks and racks.

The number that got the headlines was 221%. The number I keep looking at is 10 gigawatts. That is how much incremental capacity Hock Tan said Broadcom has line of sight to deliver in 2028, and then added: "10 gigawatts is just for Anthropic."

---

## The Quarter in One Table

| Metric (fiscal Q3 2026, ended Aug 2) | Value |
| --- | --- |
| Total revenue | $29.6B, up 86% YoY |
| AI semiconductor revenue | $16.7B, up 221% YoY and 54% QoQ |
| Semiconductor solutions | $20.8B (70% of revenue) |
| Infrastructure software (VMware) | $8.8B (30% of revenue) |
| Free cash flow | $13.7B (46% of revenue) |
| Q4 revenue guidance | ~$34.8B, up 93% YoY |
| Q4 AI semiconductor guidance | $21.7B, up 236% YoY |
| FY2026 AI revenue guidance | Raised to $58B from $56B |
| AI revenue outlook | ~$115B in FY2027, ~$230B in FY2028 |
| Gross margin | 75% in Q3, guided to ~73% in Q4 |

The margin line is the honest one. Broadcom expects gross margin to slip because of higher memory content in XPU shipments. It is buying a lot of HBM on behalf of its customers and passing it through. That is what happens when you move from selling chips to selling something closer to a finished accelerator.

---

## Who Is Building What

Broadcom does not usually name customers. On this call it did, in detail:

| Customer | Program | Deployment path |
| --- | --- | --- |
| Anthropic | Google TPU (Ironwood, then TPU v8i) | 1 GW in 2026, 5 GW in 2027, incremental 10 GW in 2028. Expected to be Broadcom's largest XPU customer in 2027 and 2028 |
| OpenAI | Jalapeno, plus a successor approaching tape-out | 1.3 GW in 2027, over 5 GW in 2028. Expected to be the second-largest |
| Google | TPU (long-term development and supply agreement) | "Multi-tens of billions of dollars" of TPUs annually for several years |
| Meta | MTIA, three generations through 2027 | About 3 GW through 2028; production shipments starting in Q4 |
| Two others | Undisclosed | Self-funded, according to management |

Two things in that table would have sounded absurd eighteen months ago.

First, a model lab that does not own a data center is on track to be the largest custom-silicon customer of the largest custom-silicon company. Anthropic does not design TPUs, Google does, but Anthropic is buying them at a scale where it effectively reserves a production line.

Second, OpenAI's chip has a code name, a tape-out schedule and a third generation in development. "Building our own chip" used to be a negotiating posture with Nvidia. It is now a roadmap.

---

## Follow the Money: The XPV Vehicle

The obvious question is how a company with Anthropic's losses pays for 15 gigawatts of accelerators.

The answer is that it mostly does not pay up front. In June, Broadcom set up a platform with Apollo and Blackstone (management calls it XPV) to finance more than 20 GW of compute for OpenAI and Anthropic by the end of 2028. Third-party investors underwrite and own the assets. The first tranche, $35 billion, closed in June for Anthropic's first gigawatt.

| Piece | Who carries it |
| --- | --- |
| Chip design and supply | Broadcom (and Google for TPUs) |
| Capital for the hardware | Apollo, Blackstone and co-investors |
| Usage and revenue risk | Anthropic and OpenAI |
| Residual value of the hardware | Investors, with "modest" residual value guarantees from Broadcom |

Management gave two rules of thumb worth writing down. Broadcom content is roughly $20 billion to $30 billion per gigawatt. And, in management's estimate, Anthropic could generate about $30 billion of annual revenue per gigawatt deployed.

If the second number holds, the math works and the debt is cheap. If it does not, private credit is holding a lot of very specific silicon with a short useful life. The residual value guarantee is the line I would watch in future filings. "Modest" and "low risk" are what everyone says before a depreciation cycle turns.

---

## Nvidia Is Not Standing Still

Two days before Broadcom reported, Nvidia invested $3.5 billion in MediaTek convertible bonds, most of MediaTek's record overseas offering. MediaTek in turn adopted NVLink Fusion and will offer design services around Nvidia's chiplet, NVLink-C2C and memory architecture.

Read that next to Broadcom's call and the strategy is clear. Nvidia cannot stop the largest buyers from building XPUs. It can try to make sure those XPUs live inside Nvidia racks, on Nvidia interconnect, next to Nvidia GPUs and Grace or Vera CPUs. If you cannot own the accelerator, own the backplane.

Jensen Huang rejected the "circular financing" label: "This is not circular because obviously they do their own business and we do our own business." Maybe. It is still Nvidia using its balance sheet to pull a would-be competitor's customers onto its interconnect.

Meanwhile, the Justice Department is reportedly examining whether Nvidia's December licensing and hiring deal with Groq was structured to avoid merger review, according to the New York Times. Nvidia calls it "a prime example of the American system working as designed." Either way, regulators are now paying attention to the edges of Nvidia's empire, not just the center.

And capital is still flowing to the next challenger. Positron, a Reno inference-chip startup, just raised $875 million at a $5 billion valuation, about five times its valuation six months ago, pitching up to 2.3 TB of memory per chip.

---

## Ethernet Quietly Won the Network

The other half of Broadcom's AI business is networking, and it is growing as fast as the accelerators. AI networking revenue rose more than 2.5 times year over year.

* **Tomahawk 6** (100 Tbps class) is deployed across the hyperscalers building XPUs.
* **Tomahawk 7** has taped out as a 200 Tbps Ethernet switch.
* **Tomahawk Ultra** brings Ethernet into scale-up, the tight GPU-to-GPU domain where Nvidia's NVLink has been unchallenged.

This matters because the custom-silicon camp needs a network that is not owned by Nvidia. InfiniBand came with Mellanox. Ethernet is the open alternative, and Broadcom sells most of the switch silicon it runs on.

---

## What Could Go Wrong

1. **Concentration.** If Anthropic becomes the largest XPU customer, Broadcom's 2028 depends heavily on one company's revenue growth and access to capital.
2. **Margin dilution.** More memory and more system content lower the percentage margin even as dollars rise. Investors who priced Broadcom as a 75% gross-margin chip company will be recalibrating.
3. **Power and shells.** Management itself flagged that land, power and data center shells constrain deployment. A gigawatt on a slide is not a gigawatt energized.
4. **Model efficiency.** If inference gets cheaper per token faster than demand grows, today's gigawatt plans will look like 2000-era fiber.

---

## The Leftover

The phrase that stayed with me is "line of sight." It is what you say about something you can see but have not reached yet.

Ten gigawatts, for one customer, two years out, financed by private equity, with a modest guarantee. Everyone on the call sounded calm. The order book is real. So is the distance between seeing a thing and getting there.

---

## Sources

* [Broadcom Q3 FY2026 results, Form 8-K exhibit (SEC)](https://www.sec.gov/Archives/edgar/data/0001730168/000173016826000076/avgo-08022026x8kxex99.htm)
* [Broadcom (AVGO) Q3 2026 earnings call transcript (The Motley Fool)](https://www.fool.com/earnings/call-transcripts/2026/09/09/broadcom-avgo-q3-2026-earnings-call-transcript/)
* [Broadcom Q3 revenue jumps 86 pct on strong AI demand (The Star / Reuters)](https://www.thestar.com.my/news/world/2026/09/03/broadcom-q3-revenue-jumps-86-pct-on-strong-ai-demand)
* [Nvidia invests $3.5B in MediaTek to extend its grip on AI (Network World)](https://www.networkworld.com/article/4220808/nvidia-invests-3-5b-in-mediatek-to-extend-its-grip-on-ai.html)
* [US DOJ probes Nvidia's licensing deal with AI startup Groq, NYT reports (The Star / Reuters)](https://www.thestar.com.my/tech/tech-news/2026/09/10/us-doj-probes-nvidia039s-licensing-deal-with-ai-startup-groq-nyt-reports)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
