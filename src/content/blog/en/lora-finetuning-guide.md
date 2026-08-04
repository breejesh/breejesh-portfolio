---
title: "LoRA Fine-Tuning for LLMs: Ranks, Target Modules, and Memory Math"
description: "A practical engineer guide to LoRA and QLoRA: when adapters beat full fine-tunes, how to pick rank and modules, rough VRAM math, and failures that waste a weekend."
date: "2026-08-04"
tags: [AI]
coverImage: /assets/images/lora-finetuning-guide.webp
previewImage: /assets/images/lora-finetuning-guide.webp
---

Full fine-tunes still win on some jobs. For most product work, they are the wrong default. **LoRA** freezes the base weights and trains a pair of low-rank matrices per chosen layer. **QLoRA** keeps that idea and loads the base model in 4-bit, so a 7B or 13B model can train on a single 24 GB card.

This is the checklist I use before burning GPU hours.

---

## When LoRA is the right tool

Pick LoRA (or QLoRA) when:

1. **You have a strong base model** and only need style, format, domain jargon, or tool-calling habits. Instruction-tuned 7B-70B checkpoints already know language. You are steering, not teaching English from scratch.
2. **VRAM is the constraint.** Full AdamW on a 7B model in FP16 is roughly weights + grads + two optimizer states: about 14 + 14 + 28 = **56 GB** before activations and KV cache. A 24 GB GPU will not finish that job cleanly.
3. **You want many cheap adapters.** One frozen base, N LoRA packs for customers or products. Swap adapters at load time. Full fine-tunes force you to store and serve N full copies.
4. **Data is small or medium.** Thousands to low hundreds of thousands of examples is the usual LoRA range. If you have a multi-billion-token domain corpus and care about peak quality, full (or continued pretrain) still has a role.

Skip LoRA when you need deep capability change: new languages with almost no pretrain coverage, heavy multi-step reasoning lifts, or large architecture surgery. Low rank cannot invent capacity the base never had.

---

## What LoRA actually trains

For a frozen weight matrix \(W \in \mathbb{R}^{d \times k}\), LoRA learns \(A \in \mathbb{R}^{r \times k}\) and \(B \in \mathbb{R}^{d \times r}\) so the forward pass becomes \(W x + B A x\) (with a scaling factor \(\alpha / r\)).

Trainable count per matrix is \(r(d + k)\). For attention projections with \(d = k = 4096\) and rank \(r = 16\):

\[
16 \times (4096 + 4096) = 131{,}072 \text{ parameters}
\]

That is tiny next to a full 4096x4096 matrix (16.7M weights). Across all targeted layers you often land at **0.1% to 2%** of base parameters, which is why optimizer state finally fits.

**QLoRA** (Dettmers et al., 2023) quantizes base weights to **NF4**, can double-quantize the constants, and uses paged optimizers so optimizer spikes do not OOM. Adapters still train in higher precision (usually BF16/FP16).

---

## Rank: start small, measure, then grow

| Rank | Typical use | Notes |
|---|---|---|
| 4-8 | Style, chat tone, light formatting | Fast, low risk of overfitting small sets |
| 16 | Default first try for instruction / domain SFT | Good quality / cost balance on 7B-13B |
| 32-64 | Harder domain shift, multi-task adapters | More VRAM and more data needed |
| 128+ | Rarely needed for SFT | Often matches full fine-tune cost without matching it |

Rule of thumb: **rank 16, alpha 32** (alpha = 2r) is a sane starting point for Llama-class models. If evals plateau and data is clean, bump to 32 or 64. If train loss collapses and eval gets worse, your rank (or learning rate) is too aggressive for the set size.

Alpha scales the adapter contribution. Pick fixed alpha or alpha = 2r, keep that scheme fixed while you sweep rank, and log both values. Changing both at once makes ablations useless.

---

## Target modules matter more than people admit

Classic LoRA papers often adapted **query and value** only. That is cheaper. On modern decoder LLMs, adapting **all linear projections in attention and MLP** usually wins:

```
# Llama-style names (PEFT / Hugging Face)
target_modules = [
  "q_proj", "k_proj", "v_proj", "o_proj",
  "gate_proj", "up_proj", "down_proj",
]
```

If VRAM is tight, drop MLP first and keep attention. If quality is flat, add modules before you jump rank from 16 to 128. Module coverage often moves the needle more than a blind rank bump.

Do not forget **embedding / lm_head** when the task adds many new tokens (tool tags, domain codes). Leave them frozen unless token-level behavior is wrong.

---

## Memory math you can do on a napkin

Rough stationary VRAM for a **7B** dense model (order of magnitude, not a profiler):

| Setup | Base weights | Trainable + Adam states | Ballpark total* |
|---|---|---|---|
| Full FT, FP16 | ~14 GB | ~42 GB | **56 GB+** |
| LoRA r=16, FP16 base | ~14 GB | hundreds of MB | **16-20 GB** |
| QLoRA 4-bit + LoRA | ~3.5-4.5 GB | hundreds of MB | **6-12 GB** |

\*Activations, sequence length, batch size, and gradient checkpointing dominate the rest. Long context (4k-8k) with large micro-batches will still OOM a "fits in theory" setup.

When you are close to the limit: `gradient_checkpointing=True`, micro-batch 1-2 with accumulation, pack or length-group sequences, prefer BF16 on Ampere+, and for QLoRA use bitsandbytes NF4 plus double quant.

A 13B QLoRA SFT with rank 16 and sequence length 2048 often lands on one 24 GB GPU. A 70B QLoRA job wants multi-GPU or offload.

---

## Common failures (and the boring fixes)

**1. Catastrophic style collapse or "I am just a language model" loops**  
Learning rate too high, or you trained on a tiny set for too many epochs. Start around **1e-4 to 2e-4** for LoRA (often higher than full FT). Early stop on a held-out set. One to three epochs is enough for many SFT sets.

**2. Train loss looks great, product eval is garbage**  
Template mismatch. Train with the **exact** chat template and system prompt you will use at inference. If production wraps tools in XML and training used plain text, the adapter learns the wrong surface form.

**3. OOM on step 1 with QLoRA**  
Not the adapters. Activation memory or an unpaged optimizer spike. Turn on gradient checkpointing, cut `max_seq_length`, enable paged AdamW, and confirm you are not accidentally unfreezing the full model.

**4. Adapter does nothing after merge**  
Wrong `target_modules` names for the architecture, or you saved only optimizer state. Print trainable parameter count at startup. If it is zero or absurdly small, stop before the overnight run.

**5. Overfitting a few hundred examples at rank 64**  
Use dropout on LoRA layers (0.05-0.1), lower rank, more diverse data, or stronger eval-based early stopping. High rank is not free capacity; it is free capacity to memorize.

**6. Multi-GPU slower than one GPU**  
Communication overhead plus tiny trainable tensors. For small LoRA jobs, one strong card with accumulation often beats poorly scaled DDP.

---

## A minimal training shape that works

```python
from peft import LoraConfig, get_peft_model, TaskType

config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
)
model = get_peft_model(model, config)
model.print_trainable_parameters()
```

Pack data to the chat template, mask prompt tokens if you only want completion loss, eval every N steps on real tasks (not only perplexity), and export the adapter plus a merged checkpoint if serving cannot load PEFT at runtime.

---

## Bottom line

LoRA is not a substitute for data quality. It spends GPU budget on the slices of the network that move your product metric. Start with **QLoRA + rank 16 + full attention/MLP modules** on a strong instruction base. Measure with the same prompts you ship. Grow rank or unfreeze more only when eval says you need capacity.

If full fine-tune still wins on your offline suite and you can afford the hardware, use it. Otherwise ship the adapter and keep the base frozen.
