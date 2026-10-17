---
title: "The AI Chip Bottleneck Moved Again: ASML's Record Quarter, Japan's $21 Billion for New York Fabs, and the Interposer Nobody Talks About"
description: "In one week ASML posted record sales, GlobalFoundries signed a $2 billion deal to make TSMC's CoWoS interposers in New York, and Japan agreed to fund up to $21 billion of new GlobalFoundries fabs. The constraint on AI hardware is shifting from wafers to packaging, and from engineering to industrial policy."
date: "2026-10-17"
tags: [Hardware & Semiconductors, Tech Policy & Law]
coverImage: /assets/images/asml-globalfoundries-packaging-reshoring.webp
previewImage: /assets/images/asml-globalfoundries-packaging-reshoring.webp
---

> **TL;DR**
> * **The Catalyst:** ASML reported record Q3 sales of €11.7 billion and said customers are already discussing tool needs for 2029 and 2030. On October 8, GlobalFoundries signed a $2 billion, five-year agreement to make silicon interposers for TSMC's CoWoS packaging in Malta, New York. On October 14, Japan agreed to fund up to $21 billion for two new GlobalFoundries fabs at the same site.
> * **The Mechanism:** Every AI accelerator that matters (Nvidia GPUs, Google TPUs, Broadcom-built XPUs) sits on an advanced package that joins logic dies to HBM through a silicon interposer. Lithography gets the headlines. Packaging capacity decides how many accelerators actually ship.
> * **The Outlook:** The first US-made CoWoS interposers arrive in the first half of 2028, the first new Japanese-funded fab in 2029. Neither fixes 2026 or 2027. Both show that AI hardware supply is now being negotiated between governments as much as between companies.

When people say "chip shortage" in 2026, they usually mean GPUs. When engineers inside the supply chain say it, they increasingly mean something less glamorous: the square of silicon the GPU sits on.

That square is called an interposer. It is a passive slab of silicon covered in extremely fine wiring that lets a compute die talk to stacks of high-bandwidth memory millimeters away, at bandwidths a normal circuit board cannot carry. TSMC's version of this packaging is called CoWoS. Nearly every frontier accelerator uses it or something like it. And for most of the AI boom, it has been one of the tightest constraints in the entire supply chain.

This week, three announcements touched every layer of that chain at once.

---

## Three Announcements, One Supply Chain

| Date | Announcement | Layer of the stack |
| --- | --- | --- |
| Oct 8 | GlobalFoundries signs a $2B, five-year deal to make silicon interposers for TSMC's CoWoS in Malta, New York; volume ramp in H1 2028 | Advanced packaging |
| Oct 8 | TSMC reports September revenue of NT$511.86B, up 54.6% year over year; nine-month revenue NT$3.90T, up 41.1% | Leading-edge wafers |
| Oct 14 | ASML reports Q3 sales of €11.7B, net income €5.0B, 57.5% gross margin, 113 lithography systems sold (up from 86) | Lithography tools |
| Oct 14 | Japan agrees to fund up to $21B for two GlobalFoundries fabs in Malta, New York; US stake in GF rises to about 7% | Mature and specialty wafers, industrial policy |

Read top to bottom, that is the whole physical stack of an AI accelerator: the machines that print the transistors, the fabs that run the machines, the package that joins the dies, and the governments financing all of it.

---

## ASML: The Order Book Is Already in 2030

ASML's numbers were strong by any measure. Q3 sales of €11.7 billion, net income of €5.0 billion and a 57.5% gross margin. It shipped 113 lithography systems, up from 86 the quarter before. It guided Q4 to €14.2 billion to €15.2 billion and full-year 2026 sales to €44 billion to €45 billion.

The line I found most telling was not a number. ASML said customers are already discussing their equipment needs for 2029 and 2030.

Lithography tools have lead times measured in years, so the conversations are always early. But talking about 2030 capacity in October 2026 means chipmakers believe the current AI demand curve is durable enough to justify fabs that will not produce a wafer for three or four years. That belief is the real asset behind every AI capex plan in this industry, and ASML's order book is where it gets priced first.

---

## The Interposer Deal: Small Dollars, Big Signal

At $2 billion over five years, the GlobalFoundries and TSMC agreement is small by AI standards. It matters for three reasons.

1. **It is the first US source of CoWoS interposers.** Today, a US-designed accelerator built on TSMC's leading-edge wafers in Arizona still has to travel back to Taiwan to be packaged. The Malta deal starts to close that loop, at least for the interposer.
2. **It uses a mature process.** Interposers do not need a leading-edge node. They need large, defect-free pieces of silicon with fine wiring. GlobalFoundries, which stepped back from the leading-edge race years ago, has exactly that kind of capacity. This is a smart reuse of an existing fab for the most constrained part of the AI supply chain.
3. **It does not finish the job.** Analysts were quick to point out that interposers alone do not create a US CoWoS line. Final assembly, test and HBM supply are separate operations from separate suppliers. Neither company has named an end customer or broken down the $2 billion.

Volume production ramps in the first half of 2028. Put differently: the accelerators that Broadcom, Nvidia and the hyperscalers are planning for 2028 deployments might be the first to carry a "Made in New York" interposer.

---

## Japan's $21 Billion: Industrial Policy by Tariff Deal

The Japanese funding is a different kind of story. GlobalFoundries said Japan will provide up to $21 billion for two 300mm fabs in Malta. Roughly $10 billion accelerates the first fab, targeted to come online in 2029. Another $10 billion or so could fund a second, with a decision due before the end of 2028.

The money comes from Japan's broader $550 billion US investment commitment, struck as part of the tariff arrangement with the Trump administration. The US government will also take an additional stake, bringing its ownership of GlobalFoundries to about 7%, according to CEO Tim Breen. Renesas and Apple are reported as expected initial customers.

| Feature | What it tells you |
| --- | --- |
| Japan provides all the capital | Allied governments are now paying directly for US fab capacity |
| US takes equity, not just grants | Washington is moving from subsidizing chipmakers to owning pieces of them |
| Earlier federal support redirected elsewhere | The CHIPS-era funding model is being replaced, not supplemented |
| Customers include an automotive chipmaker and Apple | These fabs serve mature and specialty chips, the kind that caused the 2021 auto shortage |

These are not AI accelerator fabs. They are the fabs that make power management chips, microcontrollers and RF parts that every server, car and phone also needs. The lesson of 2021 was that a $5 chip can stop a $50,000 car. The lesson of 2026 is that it can also stop a $3 million AI rack.

---

## Where the Bottleneck Sits Now

| Layer | 2024 to 2025 constraint | Late 2026 constraint |
| --- | --- | --- |
| Lithography | EUV tool supply | Tools available, but orders now stretch to 2030 |
| Leading-edge wafers | TSMC N3 and N2 capacity | Still tight; TSMC revenue up more than 50% year over year |
| Advanced packaging | CoWoS capacity in Taiwan | Still tight; first US interposer supply only in 2028 |
| Memory | HBM supply | Tight everywhere; severe in China under export controls |
| Mature chips | Mostly fine | New fabs funded, but not online until 2029 |
| Power and buildings | Emerging concern | Often the binding constraint on deployment |

If you build AI products, none of this changes your sprint. It does change your planning assumptions. Hardware supply for 2027 is largely spoken for. New capacity, in packaging and in mature fabs, arrives in 2028 and 2029. Pricing for compute is more likely to stay firm than to collapse, which is consistent with what we saw in model pricing and in China's chip market this quarter.

---

## The Leftover

Somewhere in Malta, New York, there is a fab that will start making interposers in 2028, next to a site where two more fabs might exist by 2029, partly owned by the US government and paid for by Japan.

It is a strange place for the AI story to arrive. No models, no agents, no benchmarks. Just a flat piece of silicon with very fine wires on it, which turns out to be one of the things the whole industry has been waiting for.

---

## Sources

* [Top Tech News Today, October 14, 2026 (TechStartups, with ASML investor relations link)](https://techstartups.com/2026/10/14/top-tech-news-today-october-14-2026-apple-asml-google-openai-microsoft-nvidia-more/)
* [Top Tech News Today, October 8, 2026 (TechStartups, with TSMC revenue link)](https://techstartups.com/2026/10/08/top-tech-news-today-october-8-2026-globalfoundries-google-manus-microsoft-nvidia-openai-tencent-more/)
* [GlobalFoundries signs $2bn five-year deal with TSMC for advanced packaging components (DatacenterDynamics)](https://datacenterdynamics.com/en/news/globalfoundries-signs-2bn-five-year-deal-with-tsmc-for-production-of-advanced-packaging-components)
* [GlobalFoundries and TSMC sign U.S. manufacturing deal for AI packaging (HPCwire)](https://hpcwire.com/off-the-wire/globalfoundries-and-tsmc-sign-us-manufacturing-deal-for-ai-packaging)
* [Japan to invest up to $21 billion in two US chip factories to be run by GlobalFoundries (Korea Times / Reuters)](https://www.koreatimes.co.kr/world/20261014/japan-to-invest-up-to-21-billion-in-two-us-chip-factories-to-be-run-by-globalfoundries)
* [Japan puts up to $21bn into two GlobalFoundries chip fabs in New York (The Next Web)](https://thenextweb.com/news/globalfoundries-japan-21bn-new-york-fabs-us-stake)
* Related: [Broadcom's XPU boom](/blog/en/broadcom-custom-ai-accelerators-xpu) and [DeepSeek's price hikes and China's AI repricing](/blog/en/deepseek-price-hikes-china-ai-repricing)
