---
title: "Vector Embeddings Explained: What Engineers Actually Need"
description: "What embeddings encode, how similarity works, what dimensions buy you, how search and RAG use them, and the mistakes that quietly wreck retrieval quality."
date: "2026-08-01"
tags: [AI]
coverImage: /assets/images/vector-embeddings-explained.webp
previewImage: /assets/images/vector-embeddings-explained.webp
---

Most teams meet embeddings the day someone says "just put it in a vector DB." That shortcut works for a demo. It also hides the only thing that matters: an embedding is a **fixed-length numeric summary of meaning**, and every retrieval system is only as good as what that summary keeps and what it throws away.

This post is the engineer version. Not a research survey. What embeddings are, how you compare them, what dimension counts mean in practice, how search and RAG actually use them, and the mistakes that show up after you ship.

Knowledge here is framed as of early 2026. Model names churn. The geometry and failure modes stick around.

---

## The one-line version

A **vector embedding** is a list of numbers (a vector) that places text, an image, audio, or another item in a high-dimensional space so that **similar items land near each other**.

"Near" is not poetic. It is a distance or angle you can compute with simple math. Search becomes "embed the query, find the closest stored vectors, return their payloads."

```
"refund policy for annual plans"
        |
   [embedding model]
        |
  [0.12, -0.44, 0.08, ..., 0.31]   // e.g. 768 or 1536 floats
        |
  compare to every doc chunk vector
        |
  top-k nearest chunks → your answer context
```

That is the whole product trick. Everything else is which model you pick, how you chunk, how you index, and whether you pretend pure vectors fix keyword problems they cannot see.

---

## What an embedding actually encodes

An embedding model is trained so that items that should be treated as related end up with similar vectors. For text, "related" usually means some mix of:

* **Semantic paraphrase:** "cancel my subscription" and "how do I stop auto-renew" sit close even when few words overlap.
* **Topic / domain:** two paragraphs about Kubernetes networking cluster together vs cooking recipes.
* **Task signal (sometimes):** models trained for retrieval often pull **queries** toward **documents that answer them**, not just documents that restate the query.

What embeddings do **not** magically encode:

* Exact identifiers you care about literally (SKU `AB-4419`, error code `E_TIMEOUT_92`, a UUID).
* Strict logical constraints ("all invoices over $10k in Q3 that are unpaid").
* Fresh facts the model never saw if you expect the **embedding alone** to "know" them (that is retrieval + a generator's job, not the vector).
* Cross-model geometry. Vector A from model X is not comparable to vector B from model Y. Different spaces.

Think of the vector as a **lossy compression of meaning for nearest-neighbor lookup**, not as a database row and not as an LLM's full internal state.

### Token embeddings vs document embeddings

Two things share the word "embedding" and confuse people:

| Kind | What it is | Where you see it |
| --- | --- | --- |
| **Token embedding** | Learned vector for one vocabulary piece inside a transformer | LLM internals, training diagrams |
| **Sentence / document embedding** | One vector for a whole string (or chunk), usually pooled or from a dedicated encoder | Search, clustering, RAG, recommendations |

This post is about the second kind: the vectors you store and query in product systems. (Token embeddings still matter under the hood of those models. You rarely store one vector per token for RAG.)

---

## Similarity: cosine, dot product, L2

You compare two vectors with a score. The three you will see in every vector DB and SDK:

### Cosine similarity

Measures the **angle** between vectors. Direction matters more than length.

```
cosine(a, b) = (a · b) / (||a|| * ||b||)
```

Range is roughly -1 to 1 for real embeddings (many text models live in a narrower positive band after training). Higher means more similar when you rank by cosine.

**Why teams default to it:** document length and embedding magnitude vary; cosine ignores pure scale. If you **L2-normalize** vectors first, cosine ranking becomes equivalent to **dot product** ranking, which is faster in many indexes.

### Dot product (inner product)

```
dot(a, b) = sum_i a_i * b_i
```

If vectors are normalized, same ranking as cosine. If not, longer vectors can dominate. Some dual-encoder models are trained specifically for maximum inner product search (MIPS). Match the metric to how the model was trained. Do not assume.

### Euclidean distance (L2)

```
L2(a, b) = sqrt(sum_i (a_i - b_i)^2)
```

Smaller is closer. In high dimensions, with normalized vectors, nearest neighbors by L2 and by cosine often agree closely. Still: pick one metric, configure the index for it, and keep it consistent at query time.

| Metric | Rank by | Good default when |
| --- | --- | --- |
| Cosine | Higher better | General text search, most SaaS embedding APIs |
| Dot product | Higher better | Model card says MIPS / inner product; normalized vectors |
| L2 | Lower better | Some classic CV pipelines; when the product defaults to it |

**Practical rule:** read the embedding model card for the intended distance. Normalize if you use cosine. Never mix metrics between build and query.

---

## Dimensions: what the number buys you

Common sizes you will see in 2025-2026 product stacks: **384, 512, 768, 1024, 1536, 3072** (and model-specific quirks). Dimension is the length of the float list.

### What higher dimensions tend to mean

* **More capacity** to separate fine distinctions (in theory).
* **More storage and RAM** per vector (and ANN graph overhead).
* **Slightly more compute** per distance calculation (usually not your first bottleneck; index + I/O often are).
* **Not a free quality upgrade.** A strong 768-d open model can beat a lazy use of a larger commercial vector if your chunks and eval are better.

### Matryoshka and truncation

Some models are trained so the **first N dimensions** still form a usable embedding (Matryoshka-style training). That lets you store 256-d for cheap candidate retrieval and keep full dim for rerank, or cut storage without a full retrain. Only use truncation if the model docs say it is supported. Chopping a random model in half is not the same trick.

### Storage napkin math

Rough bytes per vector (float32, ignoring index overhead):

```
bytes ≈ dimensions * 4
```

Examples for **1 million** chunks:

| Dims | Raw vectors (approx) | Plus HNSW / metadata reality |
| --- | --- | --- |
| 384 | ~1.5 GB | Often several GB once indexed |
| 768 | ~3 GB | Plan for multiple GB of RAM/disk |
| 1536 | ~6 GB | Storage and p95 latency both show up |
| 3072 | ~12 GB | Fine for small corpora; painful at huge scale without quantization |

Quantization (int8, binary, product quant) trades quality for memory. Measure on **your** eval set before you celebrate the compression ratio.

---

## How search and RAG use embeddings

### Semantic / vector search

1. Chunk and embed the corpus offline (or on write).
2. Store vectors in an ANN index (HNSW, IVF, disk-based variants, managed vector DBs).
3. At query time, embed the user query with the **same** model (or the paired query encoder if asymmetric).
4. Retrieve top-k neighbors, attach original text and metadata, return or pass downstream.

ANN means **approximate** nearest neighbor. You trade a bit of recall for speed at scale. For most product corpora that trade is correct. For tiny corpora, exact search is fine and easier to reason about.

### RAG (retrieval-augmented generation)

RAG is vector search (often **plus** keyword search) feeding an LLM:

```
User question
    → embed query
    → retrieve top-k chunks (dense ± sparse)
    → optional rerank
    → stuff chunks into the prompt
    → LLM answers with that context
```

The embedding model does not "answer." It **selects evidence**. If the right chunk never enters the top-k, the generator is guessing with nicer prose.

Hybrid retrieval is the boring default for serious apps: dense vectors for paraphrase, BM25/sparse for exact tokens and rare terms, then fuse (for example Reciprocal Rank Fusion) and optionally rerank with a cross-encoder.

### Other product uses (same geometry)

* **Dedup / near-duplicate detection** of tickets, listings, or support macros
* **Clustering** of feedback or incident notes
* **Recommendations** ("more like this")
* **Moderation routing** (embed text, nearest policy bucket)

Same caveats: metric, model version, and evaluation still decide whether it is useful or theater.

---

## Choosing and operating a model

Checklist that survives vendor churn:

* **Same model (and version) for index and query**, unless you intentionally use an asymmetric pair trained that way.
* **Max input length** ≥ your chunk size. Silent truncation is a silent quality bug.
* **Language coverage** for your users, not just English benchmarks.
* **Domain fit.** Code, legal, and biomedical corpora often need specialized or fine-tuned embedders.
* **Latency and cost** at your QPS, including cold starts if you self-host.
* **Pin the version.** "Latest" in production is a surprise re-embed migration.
* **Keep raw text next to the vector.** You need it for prompts, citations, debugging, and reindexing.

Re-embedding is a **migration**: dual-write or blue/green index, backfill, switch reads, delete the old space. Budget it like a schema change, not like a config flip.

---

## Common mistakes (the ones that burn sprints)

### 1. Bad chunks, blamed on the model

Embeddings score whatever unit you stored. Mid-sentence cuts, tables shredded into noise, and 4k-token blobs all produce weak neighbors. Fix chunking and metadata before you swap providers.

### 2. One embedding model in docs, another in the query path

Staging used model A. Production query path still had model B from a spike. Scores look random. Lock model id in config and assert it on boot.

### 3. Wrong similarity metric

Index built for cosine, queries scored as L2 without matching normalization (or the reverse). Rankings shift in ways that look like "ANN is broken."

### 4. Pure vector search for exact IDs

Users search `INC-20481` or a function name. Dense retrieval paraphrases; it does not guarantee lexical hits. Add keyword/sparse retrieval or structured filters.

### 5. Ignoring filters and ACLs

Nearest neighbor over the whole corpus returns the right doc for the wrong tenant. Metadata filters (tenant, product version, language, ACL) belong in the retrieval plan, not as an afterthought in the prompt.

### 6. Top-k cargo cult

`k=5` forever. Sometimes you need 20 candidates into a reranker. Sometimes 3 tight chunks beat 15 noisy ones that fill the context window. Tune with an eval set, not vibes.

### 7. No evaluation harness

Without labeled queries (or at least a fixed golden set), every change is storytelling. Track retrieval metrics (recall@k, MRR) and end-to-end answer quality separately. Retrieval can be fine while generation is wrong, and the reverse.

### 8. Treating dimension as a quality dial

Doubling dimensions without measuring does not fix bilingual support, stale docs, or missing access control. Measure.

### 9. Forgetting normalization and duplicate vectors

Unnormalized cosine setups, or the same paragraph embedded ten times from bad ingest, pollute neighbor lists. Dedup on write. Normalize when your metric expects it.

### 10. Expecting embeddings to replace ranking features

Click-through, recency, authority, and business rules still matter. Vectors are one signal. Production search stacks blend them on purpose.

---

## A minimal mental model you can keep

1. **Embed** = map items into a shared vector space.
2. **Similarity** = angle or distance in that space (pick one, stay consistent).
3. **Dimension** = capacity and cost knob, not a magic quality score.
4. **Search / RAG** = nearest neighbors as candidate evidence, usually hybrid, often reranked.
5. **Quality** = chunking + model + metric + filters + eval. Miss one and the demo still looks fine until real users show up.

If you only remember one sentence: **embeddings turn "find related meaning" into geometry, and your system still has to choose the right units, the right metric, and the right candidates before any LLM writes a polished answer.**

That is enough to design a retrieval path, read a model card without glazing over, and push back when someone treats a vector database as a substitute for product thinking.
