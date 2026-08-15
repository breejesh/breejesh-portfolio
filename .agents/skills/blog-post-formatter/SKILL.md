---
name: blog-post-formatter
description: World-class tech blog authoring & formatting skill. Formats portfolio blog posts with frontmatter, cover images, multi-language sync, strict human writing voice (no AI-tone prose), and industry-leading technical depth (benchmarks, architecture diagrams, trade-off matrices, production edge cases). Use whenever creating, editing, translating, or reviewing posts under src/content/blog/.
---

# World-Class Tech Content Creator & Blog Formatter Skill

Use this skill when creating, writing, editing, formatting, translating, or reviewing technical articles (`.md`) for the portfolio website under `src/content/blog/`.

This skill combines the editorial and technical standards of industry-leading tech engineering blogs:
* **Dan Luu & Phil Eaton**: Empirical benchmark data, flame graphs/profiling results, zero handwaving, deep systems mechanics.
* **Julia Evans (wizardzines)**: Clear visual mental models, diagnostic thought processes, step-by-step problem-solving journeys.
* **ByteByteGo & Stripe Engineering**: Crisp architecture diagrams (ASCII/Mermaid/tables), high-signal executive TL;DR boxes, quantitative trade-off matrices.
* **Cloudflare & Hugging Face**: Post-mortem honesty, exact reproduction commands, production gotchas, and low-level code accuracy.

---

## 1. Article Blueprint & Structural Standards

Every article created or reviewed using this skill must follow this high-signal structural blueprint:

### 1.1 Frontmatter Header
```yaml
---
title: "[Actionable, Specific Title — e.g. Why SQLite Handles 10,000 Writes/sec in Node.js]"
description: "[1-2 sentence high-signal summary of the core insight or benchmark result]"
date: YYYY-MM-DD
tags: [Technology1, Concept2, Benchmark3]
coverImage: /assets/images/[image-name].webp
previewImage: /assets/images/[image-name].webp
---
```

### 1.2 Executive Summary (TL;DR Box)
Place an executive summary box directly after frontmatter to respect the reader's time:
```markdown
> **TL;DR**
> * **The Problem:** [Brief description of the bottleneck, bug, or limitation]
> * **The Insight:** [The core technical discovery, architectural shift, or fix]
> * **The Result:** [Quantified outcome: e.g. 84% latency drop, 3.2x throughput increase, 0 allocation overhead]
```

### 1.3 Core Narrative & Technical Sections
1. **The Real-World Context / Problem Setup**: Start with a concrete failure mode, production bottleneck, or engineering challenge. Avoid generic intros ("In today's fast-paced tech world...").
2. **Mental Model & Architecture**: Use crisp Markdown tables, structured workflow steps, or Mermaid diagrams. **Never use ASCII line-art boxes or ASCII art charts.**
3. **Empirical Proof & Code Breakdown**:
   * Complete, runnable, or production-faithful code snippets.
   * Precise comments pointing to non-obvious lines.
   * Exact terminal commands to reproduce or benchmark locally.
4. **Quantified Trade-off Matrix**: Side-by-side table comparing alternatives across latency, throughput, memory, cost, and complexity.
5. **Production Pitfalls & Edge Cases**: Explicitly document where the solution breaks (e.g. memory leaks under load, race conditions, edge-case limits).

---

## 2. Industry-Leading Engineering Rigor

### 2.1 Quantified Claims Over Abstract Adjectives
* Never state a system is "fast," "efficient," or "scalable."
* Always quantify: `reduced p99 latency from 180ms to 14ms`, `cut memory overhead by 42 MB`, `handled 45,000 requests/sec with 0 drops`.

### 2.2 Concrete Code & Diagnostics
* Code snippets must be syntactically valid and idiomatic.
* Show before-and-after diffs (` ```diff `) when demonstrating optimizations.
* Provide exact CLI commands for reproduction (e.g. `wrk -t12 -c400 -d30s`, `perf record -g`, `go tool pprof`).

### 2.3 Visual Architecture & Structured Data (No Line Art Charts)
* **Prohibit ASCII line-art charts / box drawings:** Never generate ASCII line art diagrams (`+---+`, `| |`, `----->`).
* Use formatted Markdown tables, numbered structural pipelines, or valid Mermaid diagrams to represent system flows and lifecycles clearly.

---

## 3. Human Writing Voice (Mandatory — Zero AI Tone)

Articles must sound like an experienced, passionate systems engineer wrote them: direct, concrete, with natural sentence rhythm. **Never ship prose that sounds like generic LLM output.**

### 3.1 Banned Punctuation (Hard Rules)
* **Do NOT use em dashes (`—`) anywhere** in title, description, body, comments, or headings.
* **Do NOT use en dashes (`–`)** for ranges or asides. Use a normal hyphen (`-`) for ranges (`500ms-2s`, `$25-$29`, `2048-8192`) or rewrite with words (`from 2 to 3 minutes`).
* Prefer commas, periods, colons, parentheses, or separate sentences instead of dash asides.

| Avoid | Prefer |
|---|---|
| `NomAI—the offline tracker` | `NomAI, the offline tracker` |
| `stacks up fast — and it scales` | `stacks up fast, and it scales` |
| `not instant — but acceptable` | `not instant. That is acceptable` / `not instant, but acceptable` |
| `# scratch — absolute minimum` | `# scratch: absolute minimum` |

### 3.2 Banned Phrases & Clichés
Do **not** use these phrases (or close paraphrases) in any language:

**Openers / Transitions**
* deep dive, let's dive, dive into, under the hood
* In today's…, In this article…, Without further ado
* Furthermore, Moreover, Additionally (as empty glue)
* It's worth noting, It is important to note, At its core, In conclusion
* Whether you are… (stock CTA ending)

**Hype / Filler**
* landscape of X has been rewritten / transformed
* cutting-edge, state-of-the-art (unless quoting a product name)
* robust, seamless / seamlessly, leverage, utilize (prefer *use*)
* revolutionize, game-changer, silver bullet, paradigm shift
* embark, unlock, harness, foster, pivotal, multifaceted, tapestry, realm of

### 3.3 Preferred Writing Style
* Short to medium sentences. Vary rhythm naturally.
* Say what something **is** or **does**, not that it is impressive.
* Direct, descriptive headings (`Measuring GC Pauses under 10k RPS` instead of `The Magic of Garbage Collection`).
* Actionable CTAs: `If you want to benchmark this on your machine, clone the repo and run make bench.`

---

## 4. Visual Assets & Cover Image Protocol

* **Cover Image:** Every article must have a high-quality cover image generated using `generate_image` based on the article's concept.
* **WebP & Compression:** Convert generated cover images to `.webp` format, resize to a maximum width of `1000px`, and compress so the final file size is under **150 KB** (for lightning-fast page loads).
* **Inline Assets:** Preserve existing inline images. Do not invent decorative mid-article images unless requested. Inline architecture diagrams should be rendered via code blocks or SVG/tables where possible. Cover/preview images reside in `public/assets/images/` as local absolute paths (e.g. `/assets/images/my-image.webp`).

---

## 5. Multi-Language Synchronization (EN, ES, FR, HI)

Every post must be synchronized across all supported language subdirectories:
* `src/content/blog/en/` (English)
* `src/content/blog/es/` (Spanish)
* `src/content/blog/fr/` (French)
* `src/content/blog/hi/` (Hindi)

### 5.1 Translation Guidelines
* Retain original code blocks, CLI commands, file paths, and technical identifiers backticked or fenced as-is across all languages.
* Keep `date`, `coverImage`, and `previewImage` identical in frontmatter. Localize `title`, `description`, and `tags`.
* Apply the **Human Writing Voice** rules in every language.

### 5.2 Hindi (`hi/`) Strict Localization Rules
* **No Latin-script words in Hindi body/tags/headers**: All prose, titles, descriptions, tags, table headers, alt text, and link labels must contain **no Latin-script English words**. Translate fully into Hindi; when no common Hindi translation exists, transliterate into Devanagari script (e.g. ओपनएआई, चैटजीपीटी, एपीआई, डॉकर, लैम्ब्डा, पायथन, पायटॉर्च).
* **Devanagari Digits**: All numbers in Hindi body text, headings, list markers, dates in body, percentages, and model versions must use Devanagari numerals (`०-९`) (e.g. जीपीटी-५.४, ९६%, २७ जुलाई).
* **Western Digits Exception**: Keep Western digits ONLY for machine-facing fields: frontmatter `date`, file paths, URLs, inline code literals, and fenced code blocks.

---

## 6. Universal Technical Accuracy & Depth Guardrails

Every technical article written or reviewed using this skill must strictly enforce these five universal accuracy and depth guardrails:

### 6.1 Executable, Self-Contained Implementation & Benchmark Proofs
* **No Incomplete Pseudo-Code or Broken Snippets:** All code snippets must be syntactically valid, self-contained, and copy-paste executable. Include required imports, synthetic or real sample data generation, error handling, timing, and metric assertions.
* **Ground-Truth / Baseline Comparison:** When demonstrating an optimization, algorithm, or tool (e.g., lossy compression, caching, concurrency, indexing, or framework alternative), always include an exact baseline comparison (e.g., unoptimized baseline vs optimized version) with empirical measurements (throughput, p99 latency, RAM/CPU allocation, error rates, or accuracy score).

### 6.2 Full Structural Mechanics & Bidirectional Lifecycle Coverage
* **Complete System Mechanics:** Explain both ends of data/system lifecycles (e.g., read vs write paths, encoding vs decoding, request vs response pipeline, normal operating mode vs failure mode, baseline vs fallback). Never present a one-sided or half-explained mechanism.
* **Architectural Variant Analysis:** Explicitly detail the primary architectural or algorithmic choices and trade-offs (e.g., synchronous vs asynchronous, push vs pull, in-memory vs disk-backed, exact vs approximate, client-side vs server-side).

### 6.3 Multi-Point Parameter & Configuration Impact Tables
* **Production Tuning Knobs:** Provide a dedicated tuning matrix showing the impact of primary configuration parameters (e.g., batch sizes, buffer limits, thread pool sizes, sample rates, cache TTLs, probes/thresholds) across at least 4-5 distinct data points.
* **Trade-Off Frontiers:** Map how adjusting each parameter shifts system trade-offs between performance (latency/QPS), resource overhead (RAM/CPU/Disk), and fidelity/accuracy.

### 6.4 Production Edge Cases, Failure Modes & Scale Boundaries
* **Failure Modes & Edge Cases:** Document explicit production failure modes, concurrency issues, memory leaks, scale limits, network partitions, or degradation scenarios. Explain how to detect, mitigate, or recover from each.
* **Scale Estimations & Real-World Integration:** Include a scale estimation matrix showing system behavior and resource demands across orders of magnitude (e.g., 1K vs 100K vs 10M operations/records). Show how the technique integrates into end-to-end production pipelines (e.g., caching layers, fallbacks, re-ranking, or retry policies).

### 6.5 Mathematical, Metric & Narrative Consistency Audit
* **Cross-Section Alignment:** Ensure all quantitative numbers, unit metrics (ms, MB, QPS, %), configuration parameters, and dimensional math are 100% consistent across frontmatter descriptions, TL;DR summary boxes, body narrative, ASCII/Mermaid diagrams, code comments, and benchmark tables.

---

## 7. Pre-Publish Quality Audit Checklist

Run this self-check before finalizing any blog post creation or edit across all language files:

1. **Punctuation Audit:** Search for `—` (em dash) and `–` (en dash) -> must be **zero** occurrences.
2. **Banned Term Check:** Search for *deep dive*, *landscape*, *seamless*, *leverage*, *game-changer* -> remove/rewrite all hits.
3. **No Line Art Based Charts:** Ensure zero ASCII box drawings (`+---+`, `| |`, `----->`). Use clean Markdown tables, Mermaid diagrams, or structured text lists instead.
4. **Signal Density Test:** Is there a TL;DR box at the top? Are there concrete numbers/metrics instead of generic claims?
5. **Code & Article Type Alignment:** Code blocks must be syntactically valid when present; omit code blocks for pure macroeconomic, policy, or financial news analysis articles.
6. **Technical Depth Audit:** Are system variants, full bidirectional lifecycles, production failure modes, multi-point tuning tables, and scale estimations included?
7. **Metric & Data Consistency Audit:** Do numbers, metrics, unit scales, and equations match identically across text, diagrams, code comments, and tables?
8. **Multi-Language Sync:** Are `en/`, `es/`, `fr/`, and `hi/` versions updated? Does Hindi adhere to Devanagari digits (`०-९`) and zero Latin characters in prose?

