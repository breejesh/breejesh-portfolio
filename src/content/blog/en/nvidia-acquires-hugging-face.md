---
title: "Nvidia Buys Hugging Face: The Neutral Ground of Open AI Now Has a Landlord"
description: "Nvidia agreed to pay $12.93 billion for Hugging Face, its largest deal ever. The promise is that the hub stays open. The incentives say the hub becomes the cheapest distribution channel for CUDA ever built."
date: "2026-09-04"
tags: [Tech Business & Finance, AI & Machine Learning]
coverImage: /assets/images/nvidia-acquires-hugging-face.webp
previewImage: /assets/images/nvidia-acquires-hugging-face.webp
---

> **TL;DR**
> * **The Catalyst:** On September 3, Nvidia agreed to acquire Hugging Face for $12,930,300,000, almost double its previous record (Mellanox, $6.9 billion in 2020) and nearly three times Hugging Face's 2023 valuation of $4.5 billion.
> * **The Mechanism:** Nvidia is not buying revenue. It is buying the default place where 18 million developers download weights, run evals and pick an inference provider. Whoever owns that page decides which hardware is the path of least resistance.
> * **The Outlook:** Jensen Huang promised the platform stays open and that Nvidia compute will not be required. That is probably true on day one. The pressure shows up later, in defaults, in which "Deploy" button is first, and in which optimized checkpoint gets the badge.

Every ML engineer I know has the same muscle memory. A paper drops. You open Hugging Face. You read the model card, check the license, look at the downloads, and `from_pretrained` it into a notebook before lunch.

On September 3, that page got an owner with a $5 trillion stake in what happens next.

Nvidia agreed to buy Hugging Face for $12.93 billion. Huang announced it with the full, oddly precise number ("$12,930,300,000"), and then said the two sentences that matter more than the price: "Hugging Face will remain an open platform for the entire AI ecosystem," and "NVIDIA compute will not be required to build on or deploy through Hugging Face."

I believe him. I also think the sentence is answering the wrong question.

---

## What Nvidia Actually Bought

Hugging Face is not a big business by Nvidia standards. It is a big *position*.

| Asset | Scale (company-reported) | Why it matters to Nvidia |
| --- | --- | --- |
| Model hub | 3M+ models | The canonical source of open weights, including most Chinese open-weight releases |
| Datasets | ~500,000 | Training and eval data that pipelines reference by name |
| Spaces (apps) | 1M+ | Live demos, which double as inference workloads |
| Community | 18M+ users, 200,000 companies | The largest developer funnel in AI outside of the labs themselves |
| Libraries | `transformers`, `diffusers`, `datasets`, TGI, `accelerate` | The code path between a checkpoint and a GPU |

The last row is the one I would watch. `transformers` is the layer that turns "a folder of safetensors" into "a model running on a device." Kernels, attention backends, quantization formats and default dtypes are all decided there, in pull requests, by maintainers. From September onward, many of those maintainers will hold Nvidia equity. Reporting on the agreement puts up to $1 billion aside for employee retention, out of roughly $11.9 billion going to shareholders.

None of that requires closing anything. It only requires being the team that ships the fast path first.

---

## The Price, in Context

| Deal | Year | Price | What Nvidia got |
| --- | --- | --- | --- |
| Mellanox | 2020 | $6.9B | InfiniBand and the networking that made DGX clusters possible |
| Arm (abandoned) | 2020 to 2022 | $40B (proposed) | Would have been the CPU ISA everyone licenses. Regulators killed it |
| Groq (license and hires) | Dec 2025 | ~$17B to $20B (reported) | Inference silicon IP and its leadership, without a formal merger |
| MediaTek convertible bonds | Aug 31, 2026 | $3.5B | A custom-silicon partner pulled onto NVLink Fusion |
| Hugging Face | Sep 3, 2026 | $12.93B | The distribution layer for open models |

Read the table top to bottom and the pattern is clear. Nvidia keeps buying the thing *next to* the GPU that decides whether the GPU gets chosen: the network, the interconnect, the inference startup, the partner ASIC, and now the model registry.

The Arm row is the one Nvidia's lawyers will have on a sticky note. A neutral platform that everyone builds on, bought by the company that sells the most expensive thing built on top of it, is exactly the story that sank Arm. The difference is that Hugging Face has no licensing revenue to withhold. Its leverage is softer: attention, defaults, and trust.

---

## "Open" Is Not the Same as "Neutral"

Huang's promise covers access. Nobody will be forced to run on Nvidia hardware to use the hub. That is the easy part, because forcing it would destroy the asset in a week.

Neutrality is a different property, and it lives in small product decisions:

1. **The Deploy button.** Today a model page offers multiple inference providers and clouds. The order of that list, and which one is preselected, is worth more than any partnership press release.
2. **Optimized checkpoints.** If NVFP4 or TensorRT-LLM builds of popular models start showing up as "official" variants first, AMD's ROCm builds and Google's TPU paths become the second-class download, even if they work.
3. **Leaderboards and evals.** Who funds the compute behind the open leaderboards matters. "Fastest tokens per second" is a hardware-shaped metric.
4. **Kernel defaults in `transformers`.** A default attention backend that is tuned for Hopper and Blackwell is a perfectly reasonable engineering choice. It is also how ecosystems tilt without anyone writing a policy.

Each of these can be defended individually. Together they are a moat. That is the honest reading: Nvidia does not need to close Hugging Face to benefit from owning it. It only needs to be the best-supported path on a platform it controls.

---

## Who Loses Pricing Power

**AMD and the custom-silicon camp.** AMD spent two years making ROCm a credible target for open models. Google, Amazon, Meta and Microsoft are all pushing their own accelerators. All of them relied on Hugging Face as the shared on-ramp where a model could be published once and run anywhere. That on-ramp now has a stakeholder.

**Inference clouds.** Together, Fireworks, Replicate, Baseten and the rest compete for the "Deploy" click on model pages. They now compete inside a storefront owned by their largest supplier.

**Chinese open-weight labs.** A large share of the most downloaded open models in 2026 came from Chinese labs (Qwen, DeepSeek, Kimi). Their default distribution channel is now owned by a US company that sits at the center of export-control policy. I would not be surprised to see more mirrors, and more weight releases that go to ModelScope first.

**Who wins:** Hugging Face itself, in the short term. Clem Delangue framed the deal around compute, support, collaboration and visibility. A hub that serves petabytes of weights a day has real infrastructure costs, and its 2023 investors (Salesforce Ventures led that round, with Nvidia, Google, Amazon, IBM, Intel, AMD and Qualcomm participating) get a clean exit at nearly 3x.

There is an irony in that investor list. Almost every company on it is a competitor of the new owner.

---

## The Regulatory Question

The deal still needs regulatory review, and one report expects closing in 2027. The case for scrutiny writes itself: Nvidia controls the dominant AI accelerator, the dominant software stack (CUDA), the dominant scale-out networking (from Mellanox), and would now own the dominant open-model registry.

The case against is also simple. Hugging Face has no meaningful revenue moat, switching costs for a model download are close to zero, and anyone can host safetensors on S3. Regulators who struggled to define a market for the Groq license will struggle to define one for "places you download weights from."

My guess is that the deal closes with behavioral commitments: neutrality in inference-provider listings, public kernel contributions for other hardware, and some kind of governance over the open-source libraries. Those commitments will be written by lawyers and enforced by maintainers, which is to say, by culture.

---

## What Developers Should Do Now

* **Pin your dependencies on revisions, not on `main`.** If model cards, configs or default kernels change under you, you want to notice in a diff, not in production.
* **Mirror what you depend on.** Teams that run regulated or long-lived workloads should already keep internal copies of weights and datasets. This is a good week to make that real.
* **Test the non-Nvidia path occasionally.** If your stack only works on CUDA today, that is a fact. If it only works on CUDA in 2028 because nobody tried anything else, that is a decision you did not know you made.
* **Read the license, not the logo.** Ownership of the hub changes nothing about the license on any individual model. Apache 2.0 weights stay Apache 2.0.

---

## The Leftover

Hugging Face started in 2016 as a chatbot app for teenagers. It became the commons of open AI almost by accident, because it was useful and because it had no hardware to sell.

The second part of that sentence stopped being true on September 3.

The hub will stay open. The question is whether it stays boring, a neutral shelf where weights sit and wait. The best thing that could happen is that in two years nobody notices who owns it. Somebody will be watching the order of the Deploy buttons, though. I will be.

---

## Sources

* [Nvidia buys Hugging Face for $12.93 billion in its biggest acquisition ever (TechStartups, citing the Financial Times)](https://techstartups.com/2026/09/03/nvidia-buys-hugging-face-for-12-93-billion-in-its-biggest-acquisition-ever/)
* [NVIDIA Acquiring Hugging Face For $12.93 Billion (Phoronix)](https://www.phoronix.com/news/NVIDIA-Hugging-Face)
* [Nvidia buying artificial intelligence platform Hugging Face for $13 billion (La Nación / AP)](https://www.lanacion.com.ar/usa/nvidia-buying-artificial-intelligence-platform-hugging-face-for-13-billion-nid03092026/)
* [Nvidia invests $3.5B in MediaTek to extend its grip on AI (Network World)](https://www.networkworld.com/article/4220808/nvidia-invests-3-5b-in-mediatek-to-extend-its-grip-on-ai.html)
* [Top Tech News Today, September 3, 2026 (TechStartups)](https://techstartups.com/2026/09/03/top-tech-news-today-september-3-2026-google-hugging-face-meta-moonshot-ai-nvidia-more/)
* Related: [How an OpenAI agent hacked Hugging Face](/blog/en/openai-agent-hacks-huggingface)
