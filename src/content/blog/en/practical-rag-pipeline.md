---
title: "Build a Practical RAG Pipeline: Chunking, Embeddings, Retrieval, Rerank, Eval"
description: "A production-minded RAG walkthrough: chunking strategies, embedding choices, hybrid retrieval, reranking, evaluation metrics, and when RAG quietly fails."
date: "2026-08-03"
tags: [AI]
coverImage: /assets/images/practical-rag-pipeline.webp
previewImage: /assets/images/practical-rag-pipeline.webp
---

Retrieval-augmented generation looks simple on a slide: embed docs, store vectors, retrieve top-k, stuff the prompt, generate. In production that pipeline leaks quality at every stage. This post is a concrete walkthrough of a practical RAG stack, the decisions that actually move the needle, and the cases where RAG is the wrong tool.

Knowledge here is framed as of early 2026. Tool names change; the failure modes mostly do not.

---

## What you are actually building

A useful mental model has five stages:

1. **Ingest and chunk** your source corpus into units the model can use.
2. **Embed** those units into a vector space (and often keep a keyword index too).
3. **Retrieve** candidates for a query (dense, sparse, or hybrid).
4. **Rerank** those candidates with a stronger, slower model.
5. **Generate**, then **evaluate** answers against ground truth so you can improve the loop.

Skip evaluation and you are tuning on vibes. Skip reranking and hybrid search and you will over-credit the embedding model for problems it cannot fix.

```
Documents -> Chunker -> Embedder -> Vector store (+ BM25)
                              ^
User query ------------------+--> Hybrid retrieve -> Rerank -> Prompt + LLM -> Answer
                                                              |
                                                         Eval harness (offline)
```

---

## Stage 1: Chunking (where most quality is lost early)

Embeddings do not "understand documents." They score similarity over whatever unit you stored. Bad chunk boundaries produce bad retrieval no matter which model you pick.

### Practical defaults

| Strategy | Typical size | When it works | Common failure |
|---|---|---|---|
| Fixed tokens with overlap | 256-512 tokens, 10-20% overlap | Uniform prose, policies, wikis | Splits tables, code, or procedures mid-step |
| Structure-aware (headings, sections) | Section length capped | Markdown, docs sites, handbooks | Huge sections still need secondary splits |
| Semantic / recursive splitters | Variable | Mixed corpora | Harder to debug; drift when the splitter changes |
| Parent-child (small retrieve, large context) | Child ~128-256, parent ~1k+ | Long manuals | More index complexity and storage |

**Rules that hold up in practice:**

* Prefer structure over pure token windows when the source has headings.
* Keep **one idea per chunk** when you can. Procedures and API examples should not be cut mid-example.
* Store **rich metadata**: source path, title, section, product version, language, last updated, access ACL.
* Overlap helps continuity, but 50% overlap mostly burns storage and confuses dedup.
* For tables, store a prose summary chunk **and** keep the structured table elsewhere if answers depend on exact numbers.

Example sketch (Python-ish, library-agnostic):

```python
def chunk_markdown(md: str, max_tokens: int = 400, overlap: int = 40):
    sections = split_on_headings(md)  # keep # / ## boundaries
    chunks = []
    for section in sections:
        if token_len(section) <= max_tokens:
            chunks.append(section)
        else:
            chunks.extend(sliding_window(section, max_tokens, overlap))
    return chunks
```

If retrieval is weak, re-chunk before you switch embedding models. That fix is cheaper and more often correct.

---

## Stage 2: Embeddings

Your embedding model defines the geometry of search. In 2025-2026, open multilingual models and strong commercial APIs both work; the choice is latency, cost, language coverage, and whether data can leave your VPC.

### Selection checklist

* **Dimension and cost**: higher dims are not free at scale (storage + ANN memory).
* **Max input length**: if chunks are 512 tokens, a 256-token embedder silently truncates.
* **Domain**: legal, medical, and code corpora often need domain-tuned or fine-tuned embeddings.
* **Version pin**: never "latest" in production. Re-embedding a full corpus is a migration.
* **Same model for query and document** unless you explicitly use an asymmetric pair trained that way.

Index tips:

* Use **HNSW** or a managed equivalent for most app-scale corpora.
* Normalize vectors if you use cosine similarity (many clients do this for you).
* Keep the **raw text** next to the vector. You will need it for prompts, citations, and re-indexing.

```python
# Pseudocode: embed and upsert
vectors = embed_model.encode(chunk_texts, normalize=True)
store.upsert([
    {"id": ids[i], "vector": vectors[i], "text": chunk_texts[i], "meta": metas[i]}
    for i in range(len(ids))
])
```

---

## Stage 3: Retrieval (dense alone is not enough)

Pure vector search fails on exact identifiers: error codes, SKUs, function names, invoice numbers, policy IDs. Pure keyword search fails on paraphrase. **Hybrid retrieval** is the default for serious apps.

### A solid hybrid pattern

1. Run **dense** search (top 30-50).
2. Run **BM25 / sparse** search (top 30-50).
3. **Fuse** with Reciprocal Rank Fusion (RRF) or weighted score fusion.
4. Deduplicate near-identical chunks (same source + high text overlap).
5. Hand the fused shortlist to the reranker.

```python
def rrf(rank_lists, k=60):
    scores = {}
    for ranks in rank_lists:
        for rank, doc_id in enumerate(ranks, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)
```

### Query-side upgrades that matter

* **Query rewriting**: expand acronyms, add product names from session context.
* **Multi-query**: generate 2-4 paraphrases, retrieve for each, fuse.
* **Filters first**: apply ACL, tenant, language, and version filters **before** or inside ANN, not after generation.
* **HyDE** (hypothetical document embeddings) can help sparse corpora; measure it, do not assume it.

If users ask multi-hop questions ("compare plan A and plan B pricing after the 2024 change"), single-shot top-k often fails. You need multi-step retrieval or a graph/structured layer. That is a product decision, not a prompt tweak.

---

## Stage 4: Reranking

Bi-encoders (embed query and doc separately) are fast and approximate. A **cross-encoder reranker** reads query and document together and usually reorders the shortlist much more accurately.

Typical pattern:

* Retrieve 30-50 candidates cheaply.
* Rerank to top 5-10 for the prompt.
* Budget latency: rerankers cost more; cache by (query hash, doc id) when traffic repeats.

```python
pairs = [(query, doc["text"]) for doc in candidates]
scores = reranker.predict(pairs)
top = [doc for _, doc in sorted(zip(scores, candidates), reverse=True)[:8]]
```

When reranking helps most: similar policies, near-duplicate manuals, "almost right section" noise. When it does not: empty or wrong corpus, bad chunking, or questions that need calculation rather than quotes.

---

## Stage 5: Generation prompt (keep it boring and strict)

The generator should be constrained:

* Answer **only** from provided context.
* Cite chunk ids or source paths.
* Say **I do not know** when context is insufficient.
* Prefer extractive quotes for numbers and legal language.

Sketch:

```
You are a support assistant. Use ONLY the CONTEXT blocks.
If the answer is not in CONTEXT, say you do not know.
Cite sources as [n] matching the block numbers.

QUESTION: {question}

CONTEXT:
[1] {chunk_1}
[2] {chunk_2}
...
```

Temperature low for factual support bots. Do not stuff 20 long chunks; you pay in cost, latency, and lost-in-the-middle errors. After rerank, 4-8 focused chunks beat 20 mediocre ones.

---

## Stage 6: Evaluation (without this you are guessing)

Offline eval is how you compare chunk sizes, models, and prompts without shipping regressions to users.

### Build a small golden set

Start with 50-200 real questions from tickets, search logs, or SMEs. For each item store:

* question
* expected answer (or key facts)
* relevant doc ids / chunk ids (labels)
* optional: hard negatives

### Metrics that map to pipeline stages

| Stage | Metric | What it tells you |
|---|---|---|
| Retrieval | Recall@k, MRR, nDCG | Did the right chunk enter the shortlist? |
| Rerank | nDCG / MRR after rerank | Did ordering improve? |
| Generation | Faithfulness / groundedness | Did the model invent facts? |
| Generation | Answer relevance | Did it address the question? |
| End-to-end | Exact match / F1 / LLM-as-judge with rubrics | Overall quality |

Practical loop:

1. Fix **recall** first (chunking, hybrid, filters).
2. Then improve **precision at the prompt** (rerank, fewer better chunks).
3. Then tighten **generation** (prompt, citations, refusal behavior).
4. Re-run the suite on every change to chunker, embedder version, or system prompt.

Online signals still matter: thumbs down, escalation to human, citation click-through, "not helpful" tags. Offline gold sets drift; refresh them quarterly.

---

## A minimal reference architecture

For a mid-size internal knowledge bot (tens of thousands of pages):

| Component | Pragmatic choice |
|---|---|
| Ingest | Scheduled crawler + webhook on doc updates |
| Chunk | Structure-aware markdown/HTML, 300-500 tokens, metadata-heavy |
| Embed | One pinned multilingual model; batch re-embed on version bumps |
| Store | Postgres + pgvector **or** a managed vector DB; BM25 in the same system or OpenSearch |
| Retrieve | Hybrid + metadata filters + RRF |
| Rerank | Cross-encoder or API reranker on top 40 |
| LLM | Whatever you already trust for latency/cost; low temperature |
| Eval | Golden set in CI; block deploys on recall@10 regression |
| Observability | Log query, retrieved ids, scores, final citations, latency breakdown |

You do not need five agent frameworks. A boring pipeline with good chunking and eval beats a clever agent graph over a messy index.

---

## When RAG fails (be honest with stakeholders)

RAG is not a general intelligence layer. It fails in predictable ways:

### 1. The answer is not in the corpus
No retrieval trick invents a missing policy. Measure coverage. If support asks about product X and docs only cover product Y, the correct behavior is refusal, not a confident guess.

### 2. Questions need reasoning over many facts
Multi-hop, temporal comparison, and "summarize everything we know" stretch single-shot RAG. You may need multi-step retrieval, structured data, or a human workflow.

### 3. Exactness and arithmetic
Invoice totals, dosage calculations, and SLA math belong in tools or databases, not "hopefully the right paragraph." Pair RAG with calculators and SQL where numbers matter.

### 4. Conflicting or stale sources
Two versions of a policy in the index produce flip-flops. Version filters, document supersession rules, and recency metadata are product features, not nice-to-haves.

### 5. Access control mistakes
Retrieving a doc the user cannot see is a security bug. Enforce ACLs at retrieval time. Do not rely on the LLM to "not mention" restricted text sitting in the prompt.

### 6. Bad evaluation theater
Leaderboard demos on cherry-picked questions hide production pain. If you cannot show recall@k on a real query sample, you do not know if the system works.

### 7. When fine-tuning or plain search is better
* Stable style/tone tasks: fine-tuning or good prompting may beat retrieval.
* Known-item lookup ("open ticket #1842"): keyword and structured search win.
* Highly dynamic personal data: query the system of record; do not freeze it into vectors daily unless you must.

---

## A short build order if you are starting this week

1. **Define the job**: support FAQ, internal wiki Q&A, code docs. Scope the corpus.
2. **Collect 50 real questions** and label relevant docs.
3. **Ship a boring hybrid retrieve + simple prompt** with citations and refusal.
4. **Measure recall@10** and faithfulness on that set.
5. **Add reranking** only after retrieval recall is decent.
6. **Automate ingest and re-index** on doc changes.
7. **Put eval in CI** before you polish the UI.

Most teams invert this: UI and agent demos first, retrieval quality last. Users feel that order immediately.

---

## Closing

A practical RAG pipeline is mostly information retrieval with an LLM at the end. Chunk so units match how people ask. Embed with a pinned model. Retrieve hybrid. Rerank the shortlist. Generate under strict grounding rules. Evaluate every change.

When the corpus is incomplete, the question is multi-hop, or the task is pure calculation, say so and build the right component. RAG is powerful inside its lane. Outside that lane it becomes a fluent way to be wrong.
