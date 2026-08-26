---
name: blog-post-formatter
description: World-class tech blog authoring & formatting skill. Formats portfolio blog posts with frontmatter, cover images, multi-language sync, strict human writing voice (no AI-tone prose), and journalistic depth across startups, industry trends, macro policy, and systems engineering. Use whenever creating, editing, translating, or reviewing posts under src/content/blog/.
---

# World-Class Tech Content Creator & Editorial Journalism Skill

Use this skill when creating, writing, editing, formatting, translating, or reviewing articles (`.md`) for the portfolio website under `src/content/blog/`.

This skill embodies the investigative rigor, narrative craft, and analytical sharpness of top-tier technology journalism (Wired, Stratechery, The Verge, Ars Technica, Bloomberg Technology, SemiAnalysis) alongside deep systems engineering and startup post-mortems.

---

## 1. Editorial Archetypes (Preventing Cookie-Cutter Articles)

Articles must **not** follow a rigid, repetitive formula. Choose the appropriate editorial archetype based on the topic:

### Archetype A: Investigative Tech Journalism & Multi-Source Synthesis
* **Focus:** Breaking down major industry shifts, platform wars, and product launches by connecting disparate news events.
* **Methodology:** Triangulate reporting from multiple primary and secondary sources (TechCrunch, The Verge, Ars Technica, VentureBeat, SEC filings, GitHub commits). Contrast company PR spin with ground-truth engineering or economic reality.
* **Core Elements:** Real quotes, timeline of events, conflicting stakeholder incentives, downstream implications for developers and enterprises, explicit source reference links.
* **Code Blocks:** Omit code unless quoting a specific API schema, protocol spec, or configuration snippet directly cited in the news.

### Archetype B: Startup Ecosystem, Venture Capital & Business Dynamics
* **Focus:** Emerging tech startups, funding rounds, business model pivots, pricing wars, and venture dynamics.
* **Methodology:** Analyze unit economics, customer acquisition costs, gross margin realities, moat erosion, and platform risk.
* **Core Elements:** Cap table and funding round details, valuation trajectories, competitive positioning matrices, go-to-market strategy comparisons, and realistic runway analysis.

### Archetype C: Industry Trends, Macro Policy & Geopolitics
* **Focus:** Compute sovereignty, semiconductor supply chains, energy grid bottlenecks (nuclear, SMRs, power grids), antitrust lawsuits, and international regulations (e.g. EU AI Act, US export controls).
* **Core Elements:** Global policy timelines, market share breakdowns, infrastructure capex estimations, and regulatory penalty structures.

### Archetype D: Horizon Scanning & Contrarian Trend Analysis
* **Focus:** Interrogating industry consensus, puncturing hype bubbles, predicting 2-5 year architectural shifts, and identifying second-order consequences that mainstream tech media misses.
* **Core Elements:** Structural arguments, historical precedents (e.g. dot-com, mobile, cloud transitions), counter-intuitive data points, and concrete falsifiable predictions.

### Archetype E: Deep Systems Engineering & Post-Mortems
* **Focus:** Low-level software mechanics, compiler optimizations, database internals, and performance benchmarks.
* **Core Elements:** Empirical benchmark data, flame graphs, complete copy-paste executable code, parameter tuning tables, and production failure modes.

---

## 2. Article Structure & Standards

### 2.1 Frontmatter Header
```yaml
---
title: "[Compelling, Specific Title — e.g. The Sovereign AI Split: Why Nations Are Caught Between US and Chinese Compute Stacks]"
description: "[1-2 sentence high-signal summary of the core insight, investigation, or outcome]"
date: YYYY-MM-DD
tags: [Topic1, Topic2]
coverImage: /assets/images/[slug-name].webp
previewImage: /assets/images/[slug-name].webp
---
```

#### Frozen 11 Canonical Topics Taxonomy
Every blog post MUST use 1 to 3 tags drawn strictly from this frozen 11-topic taxonomy (with localized equivalents per language):

| # | English (`en`) | Spanish (`es`) | French (`fr`) | Hindi (`hi`) |
|---|---|---|---|---|
| 1 | Algorithms & Data Structures | Algoritmos y Estructuras | Algorithmes et Structures | एल्गोरिदम और डेटा संरचनाएं |
| 2 | Backend & Databases | Backend y Bases de Datos | Backend et Bases de Données | बैकएंड और डेटाबेस |
| 3 | System Design & Architecture | Diseño de Sistemas y Arquitectura | Design Système et Architecture | सिस्टम डिजाइन और आर्किटेक्चर |
| 4 | AI & Machine Learning | IA y Machine Learning | IA et Machine Learning | एआई और मशीन लर्निंग |
| 5 | Cloud & DevOps | Cloud y DevOps | Cloud et DevOps | क्लाउड और डेवऑप्स |
| 6 | Development | Desarrollo | Développement | डेवलपमेंट |
| 7 | Tech Policy & Law | Políticas Tech y Legislación | Politiques Tech et Droit | टेक नीतियां और कानून |
| 8 | Frontend & Web | Frontend y Desarrollo Web | Frontend et Développement Web | फ्रंटएंड और वेब डेवलपमेंट |
| 9 | Tech Business & Finance | Negocios Tech y Finanzas | Économie Tech et Finance | टेक व्यापार और वित्त |
| 10 | Cybersecurity & Networking | Ciberseguridad y Redes | Cybersécurité et Réseaux | साइबर सुरक्षा और नेटवर्किंग |
| 11 | Hardware & Semiconductors | Hardware y Semiconductores | Matériel et Semiconducteurs | हार्डवेयर और सेमीकंडक्टर |


### 2.2 Executive Summary (TL;DR Box)
Place an executive summary box directly after frontmatter to respect the reader's time:
```markdown
> **TL;DR**
> * **The Problem / Catalyst:** [The market friction, breaking event, policy shift, or technical breakdown]
> * **The Insight / Mechanism:** [The non-obvious reality, architectural pivot, or economic incentive driving it]
> * **The Result / Outlook:** [Quantified outcome, industry winners/losers, or strategic trajectory]
```

### 2.3 Narrative Development & Critical Value-Add
1. **The Hook & Tension:** Open with real stakes (capital destruction, market disruption, unexpected failure mode). Avoid generic platitudes ("In today's fast-paced tech world...").
2. **Original Analytical Synthesis:** Do not merely summarize source articles. Connect the dots across sources: explain *why* this is happening now, who loses pricing power, what incumbents are scrambling to defend, and what structural hurdles lie ahead.
3. **Structured Data & Comparative Breakdown:** Use clean Markdown tables, numbered pipelines, or financial/market matrices to break down complex realities.
4. **Actionable Takeaways / Strategic Implications:** Give developers, founders, and engineering leaders concrete strategic conclusions.
5. **Sources & References:** End with hyperlinked citations to all primary publications, research papers, and regulatory filings.

---

## 3. Human Writing Voice (Mandatory — Zero AI Tone)

Articles must read like an experienced, opinionated tech journalist or veteran principal engineer wrote them: sharp, perceptive, grounded, and concise.

### 3.1 Banned Punctuation (Hard Rules)
* **Do NOT use em dashes (`—`) anywhere** in title, description, body, comments, or headings.
* **Do NOT use en dashes (`–`)** for ranges or asides. Use standard hyphens (`-`) for ranges (`500ms-2s`, `$25-$29`, `2048-8192`) or rewrite with words (`from 2 to 3 minutes`).
* Prefer commas, periods, colons, parentheses, or separate sentences instead of dash asides.

### 3.2 Unnatural AI Filler & Clichés (Avoid Empty Transitions)
Avoid empty AI padding, generic formulaic openers, and hollow transitions:

**Unnatural Openers & Filler Glue**
* "In today's fast-paced world...", "In this article, we will...", "Without further ado..."
* "It is important to note that...", "It's worth noting...", "At its core..."
* "Whether you are a developer or a business owner..." (stock boilerplate endings)

**Contextual Word Usage**
* Words like *landscape* (e.g. competitive landscape), *leverage* (e.g. operating/financial leverage or leveraging an existing API), *seamless*, and *deep dive* are perfectly valid when they convey precise, grounded technical or business meaning. Avoid them only when used as hollow buzzword fluff without substance.

### 3.3 Preferred Writing Style
* Vary sentence rhythm naturally. Use short, punchy declarative statements alongside well-structured analytical points.
* Say what something **is**, **costs**, or **does**, with concrete facts and data.
* Direct, descriptive headings (`Why Foundation Model Margins Are Collapsing to 15%` instead of generic titles).

---

## 4. Visual Assets & Cover Image Protocol

* **Cover Image:** Every article must have a distinct, thematic cover image generated via `generate_image` tailored to the specific story.
* **WebP & Compression:** Convert generated cover images to `.webp` format, resize to a maximum width of `1000px`, and compress so the final file size is under **150 KB** for instant page loads.
* Cover/preview images reside in `public/assets/images/` as local absolute paths (e.g. `/assets/images/my-image.webp`).

---

## 5. Multi-Language Synchronization (EN, ES, FR, HI)

Every post must be synchronized across all four supported language subdirectories:
* `src/content/blog/en/` (English)
* `src/content/blog/es/` (Spanish)
* `src/content/blog/fr/` (French)
* `src/content/blog/hi/` (Hindi)

### 5.1 Translation Guidelines
* Keep `date`, `coverImage`, and `previewImage` identical in frontmatter. Localize `title`, `description`, and `tags`.
* Apply the **Human Writing Voice** rules in every language.

### 5.2 Hindi (`hi/`) Strict Localization Rules
* **No Latin-script words in Hindi body/tags/headers**: All prose, titles, descriptions, tags, table headers, alt text, and link labels must contain **no Latin-script English words**. Translate fully into Hindi; when no common Hindi translation exists, transliterate into Devanagari script (e.g. ओपनएआई, चैटजीपीटी, एपीआई, क्लाउड, स्टार्टअप, वेंचर कैपिटल, एनवीडिया).
* **Devanagari Digits**: All numbers in Hindi body text, headings, list markers, dates in body, percentages, currency amounts, and model versions must use Devanagari numerals (`०-९`) (e.g. जीपीटी-५.४, ९६%, ₹४० लाख, १५ अगस्त).
* **Western Digits Exception**: Keep Western digits ONLY for machine-facing fields: frontmatter `date`, file paths, URLs, inline code literals, and fenced code blocks.

---

## 6. Pre-Publish Quality Audit Checklist

Run this self-check before finalizing any blog post creation or edit across all language files:

1. **Editorial Variety:** Does the article match a distinct archetype (investigative, startup, policy, trend, or deep systems) rather than a generic template?
2. **Critical Thought & Synthesis:** Are multiple source points connected with original analytical value rather than lazy PR summarization?
3. **Punctuation Audit:** Search for `—` (em dash) and `–` (en dash) -> must be **zero** occurrences.
4. **Tone & Natural Voice Check:** Ensure prose avoids empty AI filler openers ("In today's...", "Without further ado...") while allowing natural, precise technical and business vocabulary.
5. **No Line Art Based Charts:** Ensure zero ASCII box drawings (`+---+`, `| |`, `----->`). Use clean Markdown tables or structured lists.
6. **Code Appropriateness:** Are code blocks omitted for non-coding journalism/startup/macro articles?
7. **Multi-Language Sync:** Are `en/`, `es/`, `fr/`, and `hi/` versions updated? Does Hindi adhere to Devanagari digits (`०-९`) and zero Latin characters in prose?
