/**
 * Smart Analog content cache for large blogs (1000+ md files).
 *
 * Analog normally injects:
 *   1) Eager frontmatter imports  (?analog-content-list=true)  × N
 *   2) Dynamic body imports       (?analog-content-file=true)  × N
 *
 * Vite still transforms (2) during production builds even when "lazy", which is
 * why ship sits quiet for minutes after "rewired content list".
 *
 * This plugin:
 *   - Disk-caches frontmatter (mtime|size) under .cache/content-list/
 *   - Replaces list with virtual:analog-content-list (one module)
 *   - Replaces body map with virtual:analog-content-files (runtime loaders)
 *   - SSR: reads .md from disk via Node fs (no per-file Vite transform)
 *   - Client: fetches /blog-data/posts/{lang}/{slug}.json (prebuilt)
 *   - Writes those JSON files incrementally into public/blog-data/
 *   - Logs file-by-file progress
 *
 * Disable: CONTENT_CACHE=0
 * Clear:   npm run content:cache:clear
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { normalizePath } from 'vite';

const require = createRequire(import.meta.url);

const VIRTUAL_LIST_ID = 'virtual:analog-content-list';
const RESOLVED_VIRTUAL_LIST = '\0' + VIRTUAL_LIST_ID;
const VIRTUAL_FILES_ID = 'virtual:analog-content-files';
const RESOLVED_VIRTUAL_FILES = '\0' + VIRTUAL_FILES_ID;
const VIRTUAL_SSR_FS_ID = 'virtual:analog-content-ssr-fs';
const RESOLVED_VIRTUAL_SSR_FS = '\0' + VIRTUAL_SSR_FS_ID;

// v5: blog-data `content` is pre-rendered HTML (Analog NoopContentRenderer expects HTML,
// not raw markdown — previously vite ?analog-content-file=true did this at build time).
const CACHE_VERSION = 5;

/** Same languages as vite.config.ts prismOptions.additionalLangs + Analog defaults. */
const PRISM_LANGS = [
  'bash',
  'css',
  'javascript',
  'json',
  'markup',
  'typescript',
  'kotlin',
  'dockerfile',
  'sql',
  'properties',
  'java',
  'python',
  'yaml',
  'jsx',
  'tsx',
  'ini',
  'http',
  'go',
  'rust',
  'diff',
];

let markedParser = null;

/**
 * Build-time markdown → HTML (marked + prism), matching Analog's content-file transform.
 * Runtime uses NoopContentRenderer, so content MUST already be HTML.
 */
function getMarkdownParser() {
  if (markedParser) return markedParser;

  const { marked } = require('marked');
  const { markedHighlight } = require('marked-highlight');
  let gfmHeadingId;
  try {
    gfmHeadingId = require('marked-gfm-heading-id').gfmHeadingId;
  } catch {
    gfmHeadingId = null;
  }

  const Prism = require('prismjs');
  const loadLanguages = require('prismjs/components/index.js');
  try {
    loadLanguages(PRISM_LANGS);
  } catch (e) {
    console.warn('[content-cache] prism loadLanguages warning:', e?.message || e);
  }

  const extensions = [];
  if (gfmHeadingId) extensions.push(gfmHeadingId());
  extensions.push(
    markedHighlight({
      langPrefix: 'language-',
      highlight(code, lang) {
        if (!lang || lang === 'mermaid') return escapeHtml(code);
        const langName = String(lang).replace(/^diff-/, '');
        if (!Prism.languages[langName]) return escapeHtml(code);
        return Prism.highlight(code, Prism.languages[langName], langName);
      },
    })
  );

  marked.use(...extensions, {
    gfm: true,
    breaks: false,
    pedantic: false,
  });

  markedParser = marked;
  return markedParser;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdownToHtml(mdBody) {
  const marked = getMarkdownParser();
  const out = marked.parse(mdBody || '', { async: false });
  return typeof out === 'string' ? out : String(out);
}

/**
 * Analog content-file payload: frontmatter fence + HTML body.
 * MarkdownComponent + NoopContentRenderer inject this as innerHTML.
 */
function toAnalogHtmlPayload(attributes, htmlBody, rawSource) {
  const fmMatch = typeof rawSource === 'string'
    ? rawSource.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/)
    : null;
  if (fmMatch) {
    return fmMatch[0] + htmlBody;
  }
  // Reconstruct minimal frontmatter
  const lines = ['---'];
  for (const [k, v] of Object.entries(attributes || {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`);
    } else if (typeof v === 'string') {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    }
  }
  lines.push('---', '', htmlBody);
  return lines.join('\n');
}

function buildPostJson(parts, attributes, raw, mdBody) {
  const html = renderMarkdownToHtml(mdBody);
  return {
    slug: parts.slug,
    lang: parts.lang,
    attributes,
    /** Pre-rendered HTML (what the site displays). */
    content: html,
    contentFormat: 'html',
    /** Original file for debugging / rebuilds. */
    raw,
  };
}

function enabled() {
  const v = (process.env.CONTENT_CACHE || '1').toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'off';
}

function logProgress() {
  return (
    process.env.SHIP_PROGRESS === '1' ||
    process.env.SHIP_DEBUG === '1' ||
    process.env.CONTENT_CACHE_VERBOSE === '1'
  );
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha1(buf) {
  return createHash('sha1').update(buf).digest('hex');
}

function loadFrontMatter() {
  const fm = require('front-matter');
  return fm.default || fm;
}

function walkContentFiles(root) {
  const contentRoot = path.join(root, 'src', 'content');
  if (!fs.existsSync(contentRoot)) return [];
  const out = [];
  const stack = [contentRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (name.endsWith('.md') || name.endsWith('.agx')) out.push(full);
    }
  }
  out.sort();
  return out;
}

/** Analog key: `/src/content/...` */
function analogKey(absFile, root) {
  const normRoot = normalizePath(root).replace(/\/$/, '');
  const normFile = normalizePath(absFile);
  let rel = normFile.startsWith(normRoot)
    ? normFile.slice(normRoot.length)
    : normFile;
  if (!rel.startsWith('/')) rel = '/' + rel;
  return rel;
}

/** /src/content/blog/en/foo.md → { lang, slug, jsonRel } */
function blogParts(key) {
  const m = key.match(
    /^\/src\/content\/blog\/([a-z]{2})\/(.+)\.(md|agx)$/i
  );
  if (!m) return null;
  return {
    lang: m[1],
    slug: m[2],
    ext: m[3],
    // Under /assets so Firebase static serving + existing cache headers apply
    jsonRel: `assets/blog-data/posts/${m[1]}/${m[2]}.json`,
  };
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data));
}

/**
 * Incremental frontmatter index + public/blog-data JSON for client fetches.
 */
function buildContentList(root, cacheDir) {
  const t0 = Date.now();
  const verbose = logProgress();
  const frontmatter = loadFrontMatter();
  const files = walkContentFiles(root);
  const metaPath = path.join(cacheDir, 'manifest.json');
  const prev = readJson(metaPath);
  const prevFiles =
    prev && prev.version === CACHE_VERSION && prev.files ? prev.files : {};

  const map = {};
  const keys = [];
  const nextFiles = {};
  let hits = 0;
  let parsed = 0;
  let jsonWritten = 0;

  const total = files.length;
  console.log(
    `[content-cache] scanning ${total} content files → list + HTML blog-data JSON`
  );

  // Warm marked/prism once before the loop (clear progress on first file)
  getMarkdownParser();

  for (let i = 0; i < files.length; i++) {
    const abs = files[i];
    const key = analogKey(abs, root);
    keys.push(key);
    const st = fs.statSync(abs);
    const sig = `${st.mtimeMs}|${st.size}`;
    const prevEntry = prevFiles[key];
    const parts = blogParts(key);
    const jsonAbs = parts
      ? path.join(root, 'public', parts.jsonRel)
      : null;

    let attributes;

    const existingJson = jsonAbs && fs.existsSync(jsonAbs) ? readJson(jsonAbs) : null;
    const jsonIsHtml =
      existingJson &&
      (existingJson.contentFormat === 'html' ||
        (typeof existingJson.content === 'string' &&
          existingJson.content.includes('<') &&
          !existingJson.content.trimStart().startsWith('#')));

    if (
      prevEntry &&
      prevEntry.sig === sig &&
      prevEntry.attributes &&
      jsonIsHtml
    ) {
      attributes = prevEntry.attributes;
      hits++;
    } else {
      const raw = fs.readFileSync(abs, 'utf8');
      const parsedFm = frontmatter(raw);
      attributes = parsedFm.attributes || {};
      parsed++;
      if (jsonAbs && parts) {
        writeJson(
          jsonAbs,
          buildPostJson(parts, attributes, raw, parsedFm.body)
        );
        jsonWritten++;
      }
      if (verbose && (parsed <= 5 || parsed % 50 === 0)) {
        console.log(
          `[content-cache] render ${i + 1}/${total}  ${path.relative(root, abs).replace(/\\/g, '/')}  (rendered=${parsed} hits=${hits})`
        );
      }
    }

    map[key] = attributes;
    nextFiles[key] = {
      sig,
      attributes,
      blog: parts
        ? { lang: parts.lang, slug: parts.slug, json: parts.jsonRel }
        : null,
    };

    if ((i + 1) % 200 === 0) {
      console.log(
        `[content-cache] progress ${i + 1}/${total}  hits=${hits} rendered=${parsed} json=${jsonWritten}`
      );
    }
  }

  writeJson(metaPath, {
    version: CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    count: files.length,
    files: nextFiles,
  });
  writeJson(path.join(cacheDir, 'list.json'), map);
  writeJson(path.join(cacheDir, 'keys.json'), keys);

  // Lightweight index for client discovery / deploy verification
  writeJson(path.join(root, 'public', 'assets', 'blog-data', 'meta.json'), {
    count: keys.length,
    updatedAt: new Date().toISOString(),
    cacheVersion: CACHE_VERSION,
  });

  const ms = Date.now() - t0;
  console.log(
    `[content-cache] list ready in ${ms}ms — total=${total} hits=${hits} parsed=${parsed} jsonWritten=${jsonWritten}`
  );

  return { map, keys, stats: { total, hits, parsed, jsonWritten, ms } };
}

/**
 * Generate virtual module source for content body loaders (no Vite md pipeline).
 */
function virtualFilesModuleSource(keys) {
  // Runtime loaders: return Analog-style "frontmatter + HTML body" strings.
  // ContentRenderer is Noop — body must already be HTML (pre-rendered in JSON).
  return `
const KEYS = ${JSON.stringify(keys)};

function toAnalogPayload(data) {
  if (!data) throw new Error('[content-cache] empty post payload');
  // Preferred: pre-rendered HTML body
  if (data.contentFormat === 'html' && typeof data.content === 'string') {
    const fm =
      typeof data.raw === 'string'
        ? (data.raw.match(/^---\\r?\\n[\\s\\S]*?\\r?\\n---\\r?\\n*/) || [null])[0]
        : null;
    return (fm || '---\\n---\\n\\n') + data.content;
  }
  // Legacy raw markdown file (will look unformatted with NoopContentRenderer)
  if (typeof data.raw === 'string') return data.raw;
  const fm = data.attributes || {};
  const lines = Object.entries(fm).map(([k, v]) => {
    if (Array.isArray(v)) return k + ': [' + v.map((x) => JSON.stringify(x)).join(', ') + ']';
    if (typeof v === 'string') return k + ': ' + JSON.stringify(v);
    return k + ': ' + JSON.stringify(v);
  });
  return '---\\n' + lines.join('\\n') + '\\n---\\n\\n' + (data.content || '');
}

async function loadKey(key) {
  if (import.meta.env.SSR) {
    const { loadContentRaw } = await import('${VIRTUAL_SSR_FS_ID}');
    return loadContentRaw(key);
  }
  const m = key.match(/^\\/src\\/content\\/blog\\/([a-z]{2})\\/(.+)\\.(md|agx)$/i);
  if (!m) {
    throw new Error('[content-cache] unsupported content key on client: ' + key);
  }
  const urls = [
    '/assets/blog-data/posts/' + m[1] + '/' + m[2] + '.json',
    '/blog-data/posts/' + m[1] + '/' + m[2] + '.json',
  ];
  let data = null;
  let lastErr = '';
  for (const url of urls) {
    // cache: 'no-store' bypasses HTTP cache + helps after deploys; SW is excluded in ngsw-config
    const res = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      lastErr = url + ' status ' + res.status;
      continue;
    }
    if (ct.includes('text/html')) {
      lastErr = url + ' returned HTML (not deployed / SPA fallback)';
      continue;
    }
    data = await res.json();
    break;
  }
  if (!data) {
    throw new Error('[content-cache] missing post JSON: ' + lastErr);
  }
  return toAnalogPayload(data);
}

const map = Object.create(null);
for (const key of KEYS) {
  map[key] = () => loadKey(key);
}
export default map;
`;
}

function virtualSsrFsModuleSource() {
  return `
import fs from 'node:fs';
import path from 'node:path';

function toAnalogPayload(data) {
  if (data.contentFormat === 'html' && typeof data.content === 'string') {
    const fm =
      typeof data.raw === 'string'
        ? (data.raw.match(/^---\\r?\\n[\\s\\S]*?\\r?\\n---\\r?\\n*/) || [null])[0]
        : null;
    return (fm || '---\\n---\\n\\n') + data.content;
  }
  if (typeof data.raw === 'string') return data.raw;
  return data.content || '';
}

export async function loadContentRaw(key) {
  // Prefer prebuilt HTML JSON (same as client)
  const m = key.match(/^\\/src\\/content\\/blog\\/([a-z]{2})\\/(.+)\\.(md|agx)$/i);
  if (m) {
    const candidates = [
      path.join(process.cwd(), 'public', 'assets', 'blog-data', 'posts', m[1], m[2] + '.json'),
      path.join(process.cwd(), 'dist', 'analog', 'public', 'assets', 'blog-data', 'posts', m[1], m[2] + '.json'),
      path.join(process.cwd(), 'public', 'blog-data', 'posts', m[1], m[2] + '.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        return toAnalogPayload(data);
      }
    }
  }
  // Last resort: raw markdown (unformatted without runtime marked)
  const rel = key.replace(/^\\//, '');
  const abs = path.join(process.cwd(), rel);
  return fs.promises.readFile(abs, 'utf8');
}
`;
}

/**
 * Strip Analog's giant CONTENT_ROUTE_FILES object (dynamic import per md file).
 */
function rewriteRouteFilesMap(code) {
  if (!code.includes('ANALOG_CONTENT_ROUTE_FILES')) return { code, changed: false };

  let next = code;
  let changed = false;

  // Giant one-liner or multi-line object with analog-content-file imports
  if (
    next.includes('analog-content-file=true') ||
    /ANALOG_CONTENT_ROUTE_FILES\s*=\s*\{\s*["']\/src\/content/.test(next)
  ) {
    const before = next;
    // Prefer replacing full assignment including `let`
    next = next.replace(
      /(?:let\s+)?ANALOG_CONTENT_ROUTE_FILES\s*=\s*\{[\s\S]*?\};/,
      'let ANALOG_CONTENT_ROUTE_FILES = contentFilesMap;'
    );
    if (next === before) {
      // fallback: non-greedy until first `};` after content-file marker
      next = next.replace(
        /(?:let\s+)?ANALOG_CONTENT_ROUTE_FILES\s*=\s*\{[\s\S]*?analog-content-file=true[\s\S]*?\};/,
        'let ANALOG_CONTENT_ROUTE_FILES = contentFilesMap;'
      );
    }
    changed = next !== before;
  } else if (next.includes('let ANALOG_CONTENT_ROUTE_FILES = {}')) {
    next = next.replace(
      'let ANALOG_CONTENT_ROUTE_FILES = {}',
      'let ANALOG_CONTENT_ROUTE_FILES = contentFilesMap'
    );
    changed = true;
  }

  if (changed && !next.includes(VIRTUAL_FILES_ID)) {
    next = `import contentFilesMap from '${VIRTUAL_FILES_ID}';\n` + next;
  }

  return { code: next, changed };
}

/**
 * Strip Analog's eager frontmatter imports + rewire list.
 */
function rewriteContentList(code) {
  if (
    !code.includes('ANALOG_CONTENT_FILE_LIST') &&
    !code.includes('analog_module_')
  ) {
    return { code, changed: false, stripped: 0 };
  }

  const stripped = (code.match(/analog_module_\d+/g) || []).length;
  let next = code;

  next = next.replace(
    /^import\s+\{\s*default\s+as\s+analog_module_\d+\s*\}\s+from\s+["'][^"']+["'];?\s*\n?/gm,
    ''
  );

  if (/let ANALOG_CONTENT_FILE_LIST = \{/.test(next)) {
    next = next.replace(
      /let ANALOG_CONTENT_FILE_LIST = \{[\s\S]*?\};/,
      'let ANALOG_CONTENT_FILE_LIST = contentListCache;'
    );
  } else if (next.includes('let ANALOG_CONTENT_FILE_LIST = {}')) {
    next = next.replace(
      'let ANALOG_CONTENT_FILE_LIST = {};',
      'let ANALOG_CONTENT_FILE_LIST = contentListCache;'
    );
  }

  if (
    !next.includes(`from '${VIRTUAL_LIST_ID}'`) &&
    !next.includes(`from "${VIRTUAL_LIST_ID}"`) &&
    next.includes('contentListCache')
  ) {
    next = `import contentListCache from '${VIRTUAL_LIST_ID}';\n` + next;
  }

  const changed =
    stripped > 0 ||
    next.includes('contentListCache') ||
    next.includes(VIRTUAL_LIST_ID);

  return { code: next, changed, stripped };
}

export function contentCachePlugin(opts = {}) {
  if (!enabled()) {
    console.log('[content-cache] disabled (CONTENT_CACHE=0)');
    return [];
  }

  let root = opts.root || process.cwd();
  let cacheDir = path.join(root, '.cache', 'content-list');
  let listMap = null;
  let listKeys = null;
  let listBuilt = false;

  function ensureList() {
    if (listBuilt && listMap && listKeys) {
      return { map: listMap, keys: listKeys };
    }
    ensureDir(cacheDir);
    const result = buildContentList(root, cacheDir);
    listMap = result.map;
    listKeys = result.keys;
    listBuilt = true;
    return { map: listMap, keys: listKeys };
  }

  return [
    {
      name: 'analog-content-list-cache',
      enforce: 'pre',
      configResolved(config) {
        root = normalizePath(config.root || root);
        cacheDir = path.join(root, '.cache', 'content-list');
        listBuilt = false;
        listMap = null;
        listKeys = null;
      },
      buildStart() {
        if (this.meta?.watchMode && process.env.CONTENT_CACHE_WARM_DEV !== '1') {
          return;
        }
        ensureList();
      },
      resolveId(id) {
        if (id === VIRTUAL_LIST_ID) return RESOLVED_VIRTUAL_LIST;
        if (id === VIRTUAL_FILES_ID) return RESOLVED_VIRTUAL_FILES;
        if (id === VIRTUAL_SSR_FS_ID) return RESOLVED_VIRTUAL_SSR_FS;
        return null;
      },
      load(id) {
        if (id === RESOLVED_VIRTUAL_LIST) {
          const { map } = ensureList();
          return `export default ${JSON.stringify(map)};`;
        }
        if (id === RESOLVED_VIRTUAL_FILES) {
          const { keys } = ensureList();
          console.log(
            `[content-cache] virtual content-files map: ${keys.length} runtime loaders (no Vite md transform graph)`
          );
          return virtualFilesModuleSource(keys);
        }
        if (id === RESOLVED_VIRTUAL_SSR_FS) {
          return virtualSsrFsModuleSource();
        }
        return null;
      },
    },
    {
      name: 'analog-content-cache-post',
      enforce: 'post',
      transform(code, id) {
        const idNorm = id.replace(/\\/g, '/');
        const isAnalogPkg =
          idNorm.includes('@analogjs/content') ||
          idNorm.includes('analogjs-content') ||
          idNorm.includes('@analogjs/router') ||
          idNorm.includes('analogjs-router') ||
          (code.includes('getContentFilesList') &&
            code.includes('ANALOG_AGX_FILES')) ||
          (code.includes('ANALOG_CONTENT_ROUTE_FILES') &&
            code.includes('ANALOG_ROUTE_FILES'));

        if (!isAnalogPkg && !code.includes('analog_module_') && !code.includes('analog-content-file=true')) {
          return null;
        }

        // Only touch modules that actually have Analog content wiring
        if (
          !code.includes('ANALOG_CONTENT_FILE_LIST') &&
          !code.includes('ANALOG_CONTENT_ROUTE_FILES') &&
          !code.includes('analog_module_') &&
          !code.includes('analog-content-file=true')
        ) {
          return null;
        }

        let next = code;
        let any = false;

        const list = rewriteContentList(next);
        if (list.changed) {
          next = list.code;
          any = true;
          if (list.stripped > 0) {
            console.log(
              `[content-cache] rewired content list: removed ${list.stripped} eager imports → ${VIRTUAL_LIST_ID}`
            );
          }
        }

        const routes = rewriteRouteFilesMap(next);
        if (routes.changed) {
          next = routes.code;
          any = true;
          const dyn = (code.match(/analog-content-file=true/g) || []).length;
          console.log(
            `[content-cache] rewired content bodies: removed ${dyn} dynamic md imports → ${VIRTUAL_FILES_ID}`
          );
        }

        if (!any) return null;
        return { code: next, map: null };
      },
    },
  ];
}

export default contentCachePlugin;
