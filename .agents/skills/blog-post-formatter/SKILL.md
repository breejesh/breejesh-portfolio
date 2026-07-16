---
name: blog-post-formatter
description: Automates formatting, local WebP cover image generation, inline image exclusion, and multi-language translation synchronization for developer portfolio blog posts.
---

# Blog Post Formatter Skill

Use this skill when formatting new markdown (`.md`) articles for the portfolio website.

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
* **No Inline Images:** Do not place inline images within the markdown body of the post. If inline images are needed, the user will add them manually. Store the cover in `public/assets/images/` and reference it with a local absolute path (e.g. `/assets/images/my-image.webp`).

### 3. Multi-Language Synchronization
Every post must be synced across all supported language subdirectories:
* `src/content/blog/en/` (English)
* `src/content/blog/es/` (Spanish)
* `src/content/blog/fr/` (French)
* `src/content/blog/hi/` (Hindi)

When translating:
* Translate titles, descriptions, headings, blockquotes, and prose content accurately.
* Retain original code blocks, shell commands, AWS resources, and technology terms without translating them.
* Sync frontmatter keys (`title`, `description`, `tags`) to match the target language, but keep `date`, `coverImage`, and `previewImage` identical.
