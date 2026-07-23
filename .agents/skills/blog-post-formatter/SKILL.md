---
name: blog-post-formatter
description: Formats portfolio blog posts with frontmatter, cover images, multi-language sync, and strict human writing voice (no AI-tone prose). Use whenever creating, editing, translating, or reviewing posts under src/content/blog/.
---

# Blog Post Formatter Skill

Use this skill when creating, editing, formatting, translating, or reviewing markdown (`.md`) articles for the portfolio website under `src/content/blog/`.

## Requirements

### 1. Frontmatter Format
Every blog post must begin with standard YAML frontmatter:
```yaml
---
title: "[Post Title]"
description: "[Short summary of the article for the list page]"
date: YYYY-MM-DD
tags: [Tag1, Tag2, Tag3]
coverImage: /assets/images/[image-name].webp
previewImage: /assets/images/[image-name].webp
---
```

### 2. Local Visual Assets (Cover Only)
* **Cover Image:** Every article must have a high-quality cover image generated using `generate_image` based on the article's concept.
* **WebP & Compression:** Convert generated cover images to `.webp` format, resize to a maximum width of `1000px`, and compress to ensure the final file size is under **150 KB** (to prevent performance issues when 1,000s of posts are added, while looking sharp on large screens).
* **Inline Images (manual only):** Inline images in the post body are allowed when the user adds them or **explicitly asks** for specific ones (screenshots, diagrams, repo assets, etc.). **Do not generate or invent inline images by default** when creating or formatting a post—only produce the cover/preview image unless the user requests more. Preserve existing inline images when editing. Prefer existing project/repo URLs or paths the user provides; do not auto-generate decorative mid-article images. Cover/preview still go in `public/assets/images/` as local absolute paths (e.g. `/assets/images/my-image.webp`).

### 3. Multi-Language Synchronization
Every post must be synced across all supported language subdirectories:
* `src/content/blog/en/` (English)
* `src/content/blog/es/` (Spanish)
* `src/content/blog/fr/` (French)
* `src/content/blog/hi/` (Hindi)

When translating:
* Translate titles, descriptions, headings, blockquotes, and prose content accurately.
* Retain original code blocks, shell commands, and literal resource identifiers inside backticks or fenced code (filenames, CLI flags, image paths, URLs).
* **Spanish / French:** keep common technology brand/product terms as in English when that is natural for the locale.
* **Hindi (`hi/`) special rule (strict):** prose, titles, descriptions, tags, table headers, alt text, and markdown link labels must contain **no Latin-script English words**. Translate fully; when a technical or brand term has no common Hindi equivalent, write it in Devanagari (e.g. एप्पल, ओपनएआई, चैटजीपीटी, एपीआई, डॉकर, लैम्ब्डा). Numbers, currency symbols, and code/URLs stay as-is.
* Sync frontmatter keys (`title`, `description`, `tags`) to match the target language, but keep `date`, `coverImage`, and `previewImage` identical.
* Apply the **Human Writing Voice** rules below in every language. Do not reintroduce AI-tone punctuation or filler when translating.
* If English prose is rewritten for voice, update es/fr/hi to match meaning and tone (not a word-for-word calque).

### 4. Human Writing Voice (Mandatory — No AI Tone)

Posts must read like a competent engineer wrote them: direct, specific, slightly uneven sentence rhythm. **Never ship prose that sounds like generic LLM output.**

This applies to **new posts, edits, and all translations**.

#### 4.1 Banned punctuation (hard rules)
* **Do not use em dashes (`—`) anywhere** in title, description, body, comments, or headings.
* **Do not use en dashes (`–`)** for ranges or asides. Use a normal hyphen (`-`) for ranges (`500ms-2s`, `$25-$29`, `2048-8192`) or rewrite with words (`from 2 to 3 minutes`).
* Prefer commas, periods, colons, parentheses, or separate sentences instead of dash asides.

| Avoid | Prefer |
|---|---|
| `NomAI—the offline tracker` | `NomAI, the offline tracker` |
| `stacks up fast — and it scales` | `stacks up fast, and it scales` |
| `not instant — but acceptable` | `not instant. That is acceptable` / `not instant, but acceptable` |
| `# scratch — absolute minimum` | `# scratch: absolute minimum` |

#### 4.2 Banned or heavily restricted phrases
Do **not** use these (or close paraphrases) in any language:

**Openers / transitions**
* deep dive, let's dive, dive into, under the hood
* In today's…, In this article…, Without further ado
* Furthermore, Moreover, Additionally (as empty glue)
* It's worth noting, It is important to note
* At its core, In conclusion, At the end of the day
* Whether you are… (stock CTA ending)

**Hype / filler**
* landscape of X has been rewritten / transformed
* cutting-edge, state-of-the-art (unless quoting a product name)
* robust, seamless / seamlessly, leverage, utilize (prefer *use*)
* revolutionize, game-changer, silver bullet
* embark, unlock, harness, foster, pivotal, multifaceted
* tapestry, realm of, ever-evolving, testament to
* fitness journeys, smart adding journey, "the magic of…"
* Delve / delving

**Translation traps (do not invent AI-sounding equivalents)**
* es: *análisis profundo*, *bala de plata*, *panorama de la concurrencia*, *viajes de fitness*, *de forma fluida/seamless*
* fr: *plongée en profondeur*, *paysage de la concurrence*, *parcours de remise en forme*, *solution miracle*
* hi: *गहरा विश्लेषण* as a stock opener, *परिदृश्य पूरी तरह से फिर से लिखा*, *जादू की छड़ी*, *फिटनेस यात्रा*

Also avoid Spanish conjunction **`y`** leaking into French prose (`gratuit y open-source` → `gratuit et open-source`).

#### 4.3 Preferred voice
* Short and medium sentences. Vary length. One idea per sentence when explaining trade-offs.
* Concrete nouns and numbers over abstract praise (`~1.4 GB model`, `max: 1`, `2-3 minutes`).
* Say what something **is** or **does**, not that it is a paradigm shift.
* CTAs: direct. Prefer *If you care about X, open the repo* over *Whether you are looking to…*
* Headings: descriptive (`Creating Virtual Threads with Thread.ofVirtual()`), not theatrical (`The Magic of Thread.ofVirtual()`).
* Comments in code samples: plain (`// persists across warm invocations`), not dash-heavy asides.

#### 4.4 Before finishing any blog write/edit
Run a quick self-check on **every language file you touched**:
1. Search for `—` and `–` → must be **zero** matches.
2. Search for banned phrases above → rewrite any hits.
3. Read the title + description + first paragraph + conclusion out loud in your head: if it sounds like a template, rewrite once more in plainer language.
4. If you changed English meaning or voice, sync es/fr/hi the same turn.

#### 4.5 Examples

**Bad (AI tone):**
> This is where Multi-Stage Builds come in — allowing you to build robust, production-grade images. Furthermore, they seamlessly unlock a new landscape of container security.

**Good (human tone):**
> Multi-stage builds fix that. You build in a temporary stage and copy only the compiled assets into a small final image.

**Bad (AI tone):**
> NomAI is more than a fitness tracker — it is a proof-of-concept for a new generation of robust, intelligent apps.

**Good (human tone):**
> NomAI is more than a fitness tracker. It is a proof-of-concept for apps that stay private, work offline, and cost nothing to run in the cloud.
