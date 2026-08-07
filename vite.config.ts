/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog, { type PrerenderContentFile } from '@analogjs/platform';
import fs from 'fs';
import path from 'path';
import { contentCachePlugin } from './scripts/vite-content-cache-plugin.mjs';

/**
 * Site origin for Analog sitemap generation (analogjs.org SSG docs).
 */
const SITE_HOST = process.env.SITE_HOST || 'https://breejeshrathod.com';

/**
 * Blog locales under src/content/blog/{lang}/.
 * Analog 1.8 contentDir matches only one directory level (not recursive),
 * so we register one contentDir entry per locale.
 *
 * Env:
 * - PRERENDER_BLOG=1|true  → include blog posts in prerender (SEO)
 * - PRERENDER_LANGS=en,es  → which locales (default: en when blog on)
 * - PRERENDER_BLOG unset   → shell routes only (fast ship)
 * - PRERENDER_CONCURRENCY  → nitro prerender concurrency (default 8)
 */
const BLOG_LANGS = ['en', 'es', 'fr', 'hi'] as const;

function parseLangs(): string[] {
  const raw = process.env.PRERENDER_LANGS;
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => (BLOG_LANGS as readonly string[]).includes(s));
  }
  // When enabling blog prerender without langs, default to English for speed.
  return ['en'];
}

function blogPrerenderEnabled(): boolean {
  const v = (process.env.PRERENDER_BLOG || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Analog contentDir config per locale (docs: From Content Directory).
 * Skips draft posts; uses frontmatter slug or filename.
 */
function blogContentDirEntries() {
  if (!blogPrerenderEnabled()) {
    return [];
  }

  const langs = parseLangs();
  return langs.map((lang) => ({
    contentDir: `/src/content/blog/${lang}`,
    transform: (file: PrerenderContentFile) => {
      if (file.attributes?.draft === true || file.attributes?.draft === 'true') {
        return false;
      }
      const slug = (file.attributes?.slug as string) || file.name;
      if (!slug) return false;
      return `/blog/${lang}/${slug}`;
    },
    sitemap: (file: PrerenderContentFile) => {
      const date = file.attributes?.date as string | undefined;
      return {
        lastmod: date || undefined,
        changefreq: 'monthly' as const,
        priority: '0.7',
      };
    },
  }));
}

const prerenderConcurrency = Number(process.env.PRERENDER_CONCURRENCY || 4);
const shipProgress =
  process.env.SHIP_PROGRESS === '1' ||
  process.env.SHIP_DEBUG === '1' ||
  process.env.SHIP_DEBUG === 'true';
const nitroLogLevel = Number(
  process.env.NITRO_LOG_LEVEL !== undefined ? process.env.NITRO_LOG_LEVEL : shipProgress ? 1 : 0
);

/**
 * Timestamps + stage banners so long production builds do not look frozen.
 *
 * Vite 6 runs client + SSR environments, so buildStart/closeBundle fire twice.
 * A leaked setInterval (without .unref) keeps Node alive after Nitro finishes —
 * that looked like a hang at "closeBundle" after "server has been successfully built".
 */
function shipProgressPlugin() {
  const t0 = Date.now();
  const ago = () => {
    const s = Math.round((Date.now() - t0) / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };
  const log = (msg: string) => {
    console.log(`[ship-build +${ago()}] ${msg}`);
  };

  // Module-level for this plugin instance (one per vite process)
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let lastStage = 'init';
  let openBuilds = 0;

  const startHeartbeat = () => {
    if (heartbeat) return; // only one interval for client+SSR
    heartbeat = setInterval(() => {
      log(`still in stage "${lastStage}" (heartbeat every 15s)`);
    }, 15_000);
    // Critical: do not keep the Node process alive after the real work is done
    heartbeat.unref?.();
  };

  const stopHeartbeat = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = undefined;
    }
  };

  return {
    name: 'ship-progress',
    apply: 'build' as const,
    buildStart() {
      if (!shipProgress && !process.env.SHIP_PROGRESS) return;
      openBuilds += 1;
      lastStage = 'buildStart';
      log(
        `Vite buildStart (#${openBuilds}) — client/SSR graph compile (PRERENDER_BLOG=${process.env.PRERENDER_BLOG || 'off'})`
      );
      startHeartbeat();
    },
    configResolved(config) {
      if (!shipProgress) return;
      log(`mode=${config.mode} command=${config.command} ssr=${Boolean(config.build?.ssr)}`);
    },
    resolveId(id) {
      if (!shipProgress) return null;
      if (id.includes('entry-server') || id.includes('main.server')) {
        if (lastStage !== 'ssr-entry') {
          lastStage = 'ssr-entry';
          log(`resolving SSR entry: ${id}`);
        }
      }
      return null;
    },
    transform(_code, id) {
      if (!shipProgress) return null;
      if (
        id.includes('analog-content-list=true') ||
        id.includes('analog-content-file=true')
      ) {
        if (lastStage !== 'content-transform') {
          lastStage = 'content-transform';
          log(
            `WARN still transforming per-file content module (cache miss?): ${id.slice(0, 120)}`
          );
        }
      }
      return null;
    },
    writeBundle(options) {
      if (!shipProgress) return;
      lastStage = 'writeBundle';
      log(`writeBundle → ${options.dir || '(bundle)'}`);
    },
    closeBundle() {
      if (!shipProgress && !process.env.SHIP_PROGRESS) return;
      openBuilds = Math.max(0, openBuilds - 1);
      lastStage = 'closeBundle';
      log(
        `Vite closeBundle (remaining env builds: ${openBuilds}) — Nitro may run on the client bundle close`
      );
      if (openBuilds === 0) {
        stopHeartbeat();
        log('all Vite environments closed — waiting for process exit');
      }
    },
    buildEnd(err) {
      if (!shipProgress && !process.env.SHIP_PROGRESS) return;
      if (err) log(`buildEnd with ERROR: ${err.message}`);
      else log('buildEnd OK');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  /**
   * ~1000 markdown files under src/content make Analog's eager content-list
   * graph (ANALOG_CONTENT_FILE_LIST) exceed Vite 6's 60s SSR module-runner
   * transport timeout on first `~analog/entry-server` import in dev.
   *
   * Client-only in development keeps `npm run dev` responsive. Production
   * builds keep SSR so static prerender / SSG still works.
   *
   * Override: ANALOG_SSR_DEV=1 npm run dev
   */
  const enableSsr =
    isProd || process.env.ANALOG_SSR_DEV === '1' || process.env.ANALOG_SSR_DEV === 'true';

  if (isProd && shipProgress) {
    console.log(
      `[ship-build] production config: ssr=${enableSsr} static=${isProd && enableSsr} blogPrerender=${blogPrerenderEnabled()} langs=${parseLangs().join(',')} nitroLogLevel=${nitroLogLevel}`
    );
  }

  return {
    publicDir: 'public',
    logLevel: shipProgress || process.env.SHIP_DEBUG ? 'info' : 'info',
    build: {
      target: ['es2020'],
      sourcemap: false,
      // Skip gzip size reporting: small win on large multi-chunk builds.
      reportCompressedSize: false,
      // Angular + RxJS cannot be safely force-split via manualChunks; that caused
      // production "Fn is not a function" / broken navigation (init order issues).
      chunkSizeWarningLimit: 1500,
    },
    css: {
      devSourcemap: false,
    },
    resolve: {
      mainFields: ['module'],
    },
    server: {
      // Large content graphs + Windows antivirus can slow cold transforms.
      warmup: {
        clientFiles: ['./src/main.ts', './src/app/app.config.ts'],
      },
    },
    plugins: [
      // Disk-backed frontmatter index + body cache (file-by-file progress).
      // Turns Analog's 1000+ eager content-list imports into one virtual module.
      ...contentCachePlugin(),
      shipProgressPlugin(),
      {
        name: 'ignore-resource-fallbacks',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0].split('#')[0] || '';
            if (
              url.endsWith('.map') ||
              url.endsWith('.json') ||
              url.includes('.well-known')
            ) {
              const publicPath = path.join(__dirname, 'public', url);
              const srcPath = path.join(__dirname, url);
              if (!fs.existsSync(publicPath) && !fs.existsSync(srcPath)) {
                res.statusCode = 404;
                res.end('Not Found');
                return;
              }
            }
            next();
          });
        },
      },
      analog({
        ssr: enableSsr,
        // Docs: static SSG for deploy from dist/analog/public (Firebase Hosting).
        // Only meaningful for production builds (prerender → dist/analog/public).
        static: isProd && enableSsr,
        content: {
          highlighter: 'prism',
          prismOptions: {
            // Prism language IDs only (not 'prism-*' filenames). Defaults already
            // include bash/css/javascript/json/markup/typescript — do not duplicate.
            additionalLangs: [
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
            ],
          },
        },
        nitro: {
          preset: 'static',
          // 0=silent (Analog default), 1=info, 3=verbose — ship.mjs sets NITRO_LOG_LEVEL
          logLevel: Number.isFinite(nitroLogLevel) ? nitroLogLevel : 0,
          prerender: {
            concurrency: Number.isFinite(prerenderConcurrency)
              ? prerenderConcurrency
              : 4,
            failOnError: false,
          },
          routeRules: {
            // Client-only fallback page (docs hybrid rendering example).
            '/404.html': { ssr: false },
          },
        },
        prerender: {
          // Keep public/sitemap.xml (hreflang alternates for every post).
          // Analog auto-sitemap only covers prerendered routes and would overwrite
          // the fuller public file on fast/shell builds — enable only for SEO ships.
          ...(blogPrerenderEnabled()
            ? {
                sitemap: {
                  host: SITE_HOST,
                },
              }
            : {}),
          routes: async () => {
            if (!enableSsr) {
              console.log('[ship-build] prerender routes: [] (ssr disabled)');
              return [];
            }
            const routes = [
              '/',
              '/experience',
              '/projects',
              '/achievements',
              '/blog',
              // Legal pages (Play Store privacy URL + site terms)
              '/privacy',
              '/terms',
              // SPA fallback file for static hosts (Analog SSG docs)
              '/404.html',
              // Blog posts when PRERENDER_BLOG=1 (contentDir + transform per locale)
              ...blogContentDirEntries(),
            ];
            if (shipProgress) {
              const contentEntries = routes.filter((r) => typeof r === 'object').length;
              console.log(
                `[ship-build] prerender plan: ${routes.length} entries (${contentEntries} contentDir groups, rest static paths)`
              );
            }
            return routes;
          },
        },
      }),
    ],
    ssr: {
      // Docs: packages that break under SSR must be noExternal.
      noExternal: [
        '@analogjs/**',
        '@ngx-translate/**',
        '@ng-bootstrap/**',
        'ngx-owl-carousel-o',
        'ng2-animate-on-scroll',
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
    },
  };
});
