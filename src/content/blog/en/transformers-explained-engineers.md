---
title: "How Transformers Work: A Practical Map for Working Engineers"
description: "Attention, embeddings, encoder/decoder stacks, context windows, and KV cache explained without the research paper fog. What actually matters when you ship or host LLMs."
date: "2026-08-02"
tags: [AI]
coverImage: /assets/images/transformers-explained-engineers.webp
previewImage: /assets/images/transformers-explained-engineers.webp
---

You do not need a PhD to reason about transformers. You need a mental model that survives contact with production: why latency jumps at long prompts, why VRAM dies before the CPU does, and why "128k context" is not free.

This is that map. No paper recap. No hype. Just the pieces you will actually touch when you call an API, run a local model, or debug an inference server.

---

## The one-line version

A transformer turns a sequence of tokens into predictions for the next tokens by repeatedly letting every token look at every other token (or a restricted window of them), then mixing those signals through dense layers.

Everything else is engineering around that idea: how we represent tokens, how deep the stack is, how much history we allow, and how we avoid recomputing work on every new token.

---

## Tokens and embeddings: discrete text becomes vectors

Models do not see words. They see **tokens**, which are chunks of text (subwords, whole words, punctuation, sometimes bytes). Tokenizers are the boring plumbing that make or break cost estimates. The same English sentence can be 12 tokens in one model family and 20 in another.

Each token id is mapped to a learned vector: the **embedding**. Think of it as a lookup table of size `vocab_size x d_model`. Early layers mostly refine these vectors; later layers mix them with context until the final vector is useful for predicting the next token (or a classification head).

Position matters. Pure attention has no built-in order, so models add **positional information** (absolute positions, relative biases, rotary embeddings like RoPE, and related variants). You do not need the formula. You need the implication: long sequences stress both compute and the quality of how position is encoded.

```
"Transformers are useful."
        |
   [tokenizer]
        |
 [tok1, tok2, tok3, tok4, ...]
        |
  [embedding + position]
        |
  matrix of shape [seq_len, d_model]
```

---

## Attention: the useful intuition (not the matrix algebra)

Attention answers: for this token, which other tokens should I listen to right now?

For each position, the model builds three projections from the current hidden state:

| Name | Role (engineering intuition) |
| --- | --- |
| **Query (Q)** | What am I looking for? |
| **Key (K)** | What do I advertise that I contain? |
| **Value (V)** | What content do I pass along if selected? |

Similarity between Q and K decides weights. Those weights mix the V vectors into a new representation for that position. Multi-head attention runs several of these in parallel so one head can track syntax while another tracks names, numbers, or code structure. The model learns the split. You mostly care that heads cost memory and matmuls.

**Causal (decoder) attention** masks the future: token *t* may only attend to tokens `1..t`. That is what makes left-to-right generation valid. **Bidirectional (encoder) attention** lets every token see the full input, which is what classic BERT-style models used for understanding tasks.

A concrete picture for a short prompt:

```
Tokens:  [The] [cat] [sat] [on] [the] [mat]
When predicting after "sat":
  "sat" can see: The, cat, sat
  "sat" cannot see: on, the, mat   (causal mask)
```

The famous scaling cost: naive full attention is **O(n²)** in sequence length for both compute and the attention score storage pattern. Double the context, roughly 4x the attention work (before clever kernels and approximations). That is why long context is a product feature and a systems problem at the same time.

---

## Encoder, decoder, and the models you actually use

The original 2017 transformer paper used an **encoder-decoder** stack for translation: encoder reads the source sentence fully, decoder generates the target with causal attention plus cross-attention into the encoder states.

The options for working engineers are simpler in practice:

| Family | Pattern | Typical use |
| --- | --- | --- |
| **Encoder-only** | Bidirectional stack | Classification, embeddings, NER (BERT-style) |
| **Decoder-only** | Causal stack | Chat, code, agents, most frontier LLMs |
| **Encoder-decoder** | Both stacks | Translation, some summarization / seq2seq tasks |

When people say "LLM" in 2025-2026 product work, they almost always mean a **decoder-only** transformer trained to predict the next token, then instruction-tuned and aligned. Encoder-only models still matter for retrieval embeddings and classical NLP pipelines. Encoder-decoder models still matter for specialized seq2seq work. The core attention math is shared; the mask and the training objective differ.

Stack depth, width (`d_model`), number of heads, and feed-forward expansion ratio set the parameter count. More parameters can mean better quality, but they also mean more weights to load and more FLOPs per token.

---

## What a "context window" really means

The **context window** is the maximum number of tokens the model can attend over in one forward pass (prompt + generated tokens so far, depending on how the product counts).

It is **not**:

* Unlimited free memory for your app
* A guarantee that the model uses the middle of a long prompt well
* The same as "training data size"

It **is**:

* A hard architectural and product limit (config + trained positions + serving policy)
* A budget you share between system prompt, retrieved docs, chat history, tool traces, and the answer
* A cost and latency driver, because attention and KV storage grow with tokens

| What you put in context | What it costs |
| --- | --- |
| System instructions | Stable base tokens every request |
| RAG chunks | Often the largest variable |
| Multi-turn history | Grows until you truncate or summarize |
| Tool calls / JSON traces | Easy to underestimate |
| The model's own output | Counts toward the window as it generates |

Practical rule: treat context like a working set, not a dumping ground. Retrieval quality beats stuffing another 20 pages "just in case." Long-context models help, but they do not cancel bad prompting or sloppy retrieval.

Also watch tokenizer mismatch. Billing and limits are in **tokens**, not words or characters. A log dump full of UUIDs and base64 can burn the window surprisingly fast.

---

## Why KV cache matters for inference

Training and prefill are one story. Interactive generation is another.

When you generate token by token, a naive implementation would re-run the full model over the entire prefix for every new token. That is correct and absurdly expensive.

**KV cache** stores the Key and Value tensors already computed for past tokens at each layer. For the new token you only compute its Q/K/V, attend against the cached K/V history, and append the new K/V to the cache.

```
Prefill (prompt once):
  for each prompt token: compute K, V → store in cache
  produce first output distribution

Decode (one token at a time):
  compute Q, K, V for new token only
  attend to cached K, V (+ new)
  append new K, V
  sample / argmax next token
  repeat
```

Why engineers care:

1. **Latency shape:** Prefill is often compute-heavy and parallel over the prompt. Decode is often memory-bandwidth bound because you stream weights and growing cache for a tiny batch size (often 1).
2. **VRAM:** Cache size scales with `layers x heads x seq_len x head_dim x precision` (and batch). Long chats and big batches blow memory even when weights fit.
3. **Throughput:** Continuous batching and paged attention (systems ideas popularized in production serving stacks) exist largely to manage KV layout and avoid fragmentation.
4. **Multi-turn APIs:** "Conversation state" on the server is frequently "keep or rebuild KV." That is why some platforms charge for cached input tokens differently from fresh ones when they can reuse prefixes.

Rough mental model for memory pressure:

| Lever | Effect on KV cache |
| --- | --- |
| Longer prompt / history | Linear growth in seq_len |
| Larger batch (concurrent users) | Linear growth in batch |
| More layers / heads / width | Linear in model shape |
| FP16 → FP8 / INT8 / quantized KV | Shrinks bytes per element (quality trade-offs vary) |
| Sliding window / sparse attention | Caps how far you look, can bound cache |

If your GPU OOMs mid-conversation, weights are not always the villain. The cache is a frequent culprit.

---

## Putting it together: a request lifecycle

1. **Tokenize** the prompt.
2. **Embed** tokens and add position info.
3. **Prefill** through N transformer blocks (attention + feed-forward each block), building the KV cache.
4. **Sample** the next token from the final logits (temperature, top-p, etc. live here).
5. **Decode** step: append token, update cache, sample again until stop condition or max tokens.
6. **Detokenize** for the user.

Where production pain shows up:

* Huge system prompts make every request pay a large prefill (unless prefix caching hits).
* RAG without chunk budgets turns a cheap chat into a long-context job.
* High concurrency multiplies KV memory.
* Output token limits cap cost, but users still feel TTFT (time to first token) from prefill and tokens/sec from decode bandwidth.

---

## What to remember when you design systems

* **Embeddings** map discrete tokens into the vector space the stack operates on.
* **Attention** is selective mixing of information across the sequence; causal masks make generation work.
* **Encoder vs decoder** is mostly about mask + objective; most chat LLMs are decoder-only.
* **Context window** is a shared token budget and a quadratic-ish cost center, not free storage.
* **KV cache** is the reason interactive decoding is feasible, and a primary driver of inference VRAM and batching strategy.

If you only keep one systems sentence: **prefill builds the cache, decode reads a growing cache while streaming weights, and your bill tracks tokens through both phases.**

That is enough to read product docs, size GPUs, and argue productively with the model team without pretending you reinvented 2017 paper math.
