/**
 * Warm (or rebuild) the content frontmatter + HTML blog-data cache.
 *
 *   npm run content:cache
 *   npm run content:cache -- --force
 *   npm run content:cache:clear
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const clearOnly =
  process.argv.includes('--clear') || process.argv.includes('--clear-only');

const cacheTargets = [
  path.join(root, '.cache', 'content-list'),
  path.join(root, 'public', 'blog-data'),
  path.join(root, 'public', 'assets', 'blog-data'),
];

function clearCaches(all = false) {
  const targets = all
    ? cacheTargets
    : [path.join(root, '.cache', 'content-list')];
  for (const t of targets) {
    fs.rmSync(t, { recursive: true, force: true });
    console.log('[content-cache] cleared', path.relative(root, t) || t);
  }
}

if (clearOnly) {
  clearCaches(process.argv.includes('--all'));
  console.log('[content-cache] done. Run: npm run content:cache');
  process.exit(0);
}

if (force) {
  clearCaches(false);
}

process.env.SHIP_PROGRESS = process.env.SHIP_PROGRESS || '1';
process.env.CONTENT_CACHE = process.env.CONTENT_CACHE || '1';

const mod = await import(
  pathToFileURL(path.join(root, 'scripts/vite-content-cache-plugin.mjs')).href
);

const plugins = mod.contentCachePlugin({ root });
const pre = plugins.find((p) => p.name === 'analog-content-list-cache');
if (pre?.configResolved) {
  pre.configResolved({ root });
}
if (pre?.buildStart) {
  pre.buildStart.call({ meta: {} });
}
if (pre?.load) {
  const code = pre.load('\0virtual:analog-content-list');
  if (code) {
    const map = JSON.parse(
      code.replace(/^export default /, '').replace(/;$/, '')
    );
    console.log(`[content-cache] warm OK — ${Object.keys(map).length} entries`);
  }
}

console.log('[content-cache] done → .cache/content-list/ + public/assets/blog-data/');
