/**
 * Regenerate crawler-facing files from src/content/blog so they never go stale:
 *   public/sitemap.xml   every post in every locale, with hreflang alternates
 *   public/rss.xml       latest English posts (feed.xml is an identical copy)
 *   public/llms.txt      site index for LLM crawlers
 *   public/llms-full.txt index plus TL;DR excerpts
 *
 * Runs in ship.mjs preflight; also `npm run seo:generate`.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import fm from 'front-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const PUBLIC = join(ROOT, 'public');
const SITE = (process.env.SITE_HOST || 'https://breejeshrathod.com').replace(/\/$/, '');
const LANGS = ['en', 'es', 'fr', 'hi'];
const RSS_ITEMS = 50;

const STATIC_PAGES = [
  { path: '/', name: 'Homepage', about: 'Portfolio homepage with introduction, about section, and contact information.' },
  { path: '/experience', name: 'Experience', about: 'Professional experience across engineering leadership roles in fintech, cybersecurity, and enterprise software.' },
  { path: '/projects', name: 'Projects', about: 'Featured open-source projects and applications built by Breejesh Rathod.' },
  { path: '/achievements', name: 'Achievements', about: 'Awards, certifications, and career milestones.' },
  { path: '/blog', name: 'Blog', about: 'Technical articles and analysis on system design, AI models and agents, semiconductors, distributed systems, cloud engineering, and the business of tech.' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
];

const SUMMARY =
  'Engineering leader and software developer with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software.';

const xml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isoDay = (d) => {
  if (!d) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

/** Last commit day per content file, from one git call. Uncommitted files fall back to today. */
function gitLastModified() {
  const map = new Map();
  try {
    const out = execFileSync(
      'git',
      ['log', '--format=@%cs', '--name-only', '--', 'src/content/blog'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    let day;
    for (const line of out.split('\n')) {
      if (line.startsWith('@')) day = line.slice(1).trim();
      else if (line.trim() && !map.has(line.trim())) map.set(line.trim(), day);
    }
  } catch {
    // Not a git checkout (CI tarball): frontmatter dates only.
  }
  return map;
}

function loadPosts() {
  const modified = gitLastModified();
  const posts = [];
  for (const lang of LANGS) {
    const dir = join(BLOG_DIR, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const { attributes: a, body } = fm(readFileSync(join(dir, file), 'utf8'));
      if (a.draft === true || a.draft === 'true') continue;
      const slug = a.slug || file.replace(/\.md$/, '');
      const date = isoDay(a.date);
      const gitDay = modified.get(`src/content/blog/${lang}/${file}`) || isoDay(new Date());
      posts.push({
        lang,
        slug,
        url: `${SITE}/blog/${lang}/${slug}`,
        title: a.title || slug,
        description: a.description || '',
        tags: Array.isArray(a.tags) ? a.tags : [],
        date,
        lastmod: date && date > gitDay ? date : gitDay,
        body,
      });
    }
  }
  return posts.sort((x, y) => (y.date || '').localeCompare(x.date || '') || x.slug.localeCompare(y.slug));
}

function sitemap(posts) {
  const bySlug = new Map();
  for (const p of posts) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, new Map());
    bySlug.get(p.slug).set(p.lang, p);
  }
  const latest = posts.reduce((m, p) => (p.lastmod > m ? p.lastmod : m), '');
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const page of STATIC_PAGES) {
    lines.push('  <url>', `    <loc>${SITE}${page.path}</loc>`);
    if (page.path === '/' || page.path === '/blog') lines.push(`    <lastmod>${latest}</lastmod>`);
    lines.push('  </url>');
  }
  for (const p of posts) {
    const versions = bySlug.get(p.slug);
    lines.push('  <url>', `    <loc>${xml(p.url)}</loc>`, `    <lastmod>${p.lastmod}</lastmod>`);
    if (versions.size > 1) {
      for (const lang of LANGS) {
        const v = versions.get(lang);
        if (v) lines.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${xml(v.url)}"/>`);
      }
      const def = versions.get('en') || p;
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(def.url)}"/>`);
    }
    lines.push('  </url>');
  }
  lines.push('</urlset>', '');
  return lines.join('\n');
}

function rss(posts) {
  const items = posts.filter((p) => p.lang === 'en' && p.date).slice(0, RSS_ITEMS);
  const built = items.length ? new Date(items[0].date).toUTCString() : new Date().toUTCString();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Breejesh Rathod | Engineering Blog</title>',
    `    <link>${SITE}/blog</link>`,
    '    <description>Engineering articles and analysis on system design, AI, semiconductors, cloud, and the business of tech.</description>',
    '    <language>en-us</language>',
    `    <lastBuildDate>${built}</lastBuildDate>`,
    `    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />`,
  ];
  for (const p of items) {
    lines.push(
      '    <item>',
      `      <title>${xml(p.title)}</title>`,
      `      <link>${xml(p.url)}</link>`,
      `      <guid>${xml(p.url)}</guid>`,
      `      <pubDate>${new Date(p.date).toUTCString()}</pubDate>`,
      `      <description>${xml(p.description)}</description>`,
      '    </item>'
    );
  }
  lines.push('  </channel>', '</rss>', '');
  return lines.join('\n');
}

function llms(posts) {
  const en = posts.filter((p) => p.lang === 'en');
  const lines = ['# Breejesh Rathod', '', `> ${SUMMARY} Technical blog, open-source projects, and engineering leadership.`, '', '## About', ''];
  for (const page of STATIC_PAGES.filter((s) => s.about)) {
    lines.push(`- [${page.name}](${SITE}${page.path}): ${page.about}`);
  }
  lines.push('', '## Blog Articles', '');
  for (const p of en) {
    lines.push(`- [${p.title}](${p.url}): ${p.description} (Published: ${p.date})`);
  }
  lines.push('', '## Translations', '', 'Every article is also available in Spanish, French, and Hindi at the same path with `/blog/es/`, `/blog/fr/`, or `/blog/hi/` in place of `/blog/en/`.', '');
  return lines.join('\n');
}

/** The leading "> **TL;DR**" blockquote, or the first paragraph when a post has none. */
function excerpt(body) {
  const text = body.replace(/\r\n/g, '\n').trim();
  const quote = text.match(/^(>.*\n?)+/);
  const block = quote ? quote[0].trim() : text.split(/\n\s*\n/)[0].trim();
  return block
    .split('\n')
    .map((l) => (l.startsWith('>') ? l : `> ${l}`))
    .join('\n');
}

function llmsFull(posts) {
  const en = posts.filter((p) => p.lang === 'en');
  const lines = [
    '# Breejesh Rathod - Complete Knowledge & Blog Corpus',
    '',
    `> ${SUMMARY} This document contains the index and article summaries for LLM ingestion.`,
    '',
    '## Site Sections',
    '',
    ...STATIC_PAGES.filter((s) => s.about).map((s) => `- [${s.name}](${SITE}${s.path})`),
    '',
    '## Technical Articles',
    '',
  ];
  for (const p of en) {
    lines.push(
      `### ${p.title}`,
      '',
      `- **URL:** [${p.url}](${p.url})`,
      `- **Date:** ${p.date}`,
      `- **Tags:** ${p.tags.join(', ')}`,
      '',
      p.description,
      '',
      excerpt(p.body),
      ''
    );
  }
  return lines.join('\n');
}

const posts = loadPosts();
const feed = rss(posts);
writeFileSync(join(PUBLIC, 'sitemap.xml'), sitemap(posts));
writeFileSync(join(PUBLIC, 'rss.xml'), feed);
writeFileSync(join(PUBLIC, 'feed.xml'), feed);
writeFileSync(join(PUBLIC, 'llms.txt'), llms(posts));
writeFileSync(join(PUBLIC, 'llms-full.txt'), llmsFull(posts));
console.log(
  `[seo] ${posts.length} posts (${LANGS.map((l) => `${l}:${posts.filter((p) => p.lang === l).length}`).join(' ')}) → sitemap.xml, rss.xml, feed.xml, llms.txt, llms-full.txt`
);
