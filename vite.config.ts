/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import fs from 'fs';
import path from 'path';

/**
 * Which blog locales to prerender as static HTML.
 * - Default: all (en,es,fr,hi) for production ship
 * - Fast local: PRERENDER_LANGS=en npm run ship:fast
 * Client still bundles every locale; this only cuts SSR page render time.
 */
function blogPrerenderRoutes(): string[] {
  const langs = (process.env.PRERENDER_LANGS || 'en,es,fr,hi')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const routes: string[] = [];
  const blogRoot = path.join(__dirname, 'src/content/blog');

  for (const lang of langs) {
    const dir = path.join(blogRoot, lang);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.slice(0, -3);
      routes.push(`/blog/${lang}/${slug}`);
    }
  }
  return routes;
}

const prerenderConcurrency = Number(process.env.PRERENDER_CONCURRENCY || 8);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  build: {
    target: ['es2020'],
    // Skip gzip size reporting: small win on large multi-chunk builds.
    reportCompressedSize: false,
    // Angular + RxJS cannot be safely force-split via manualChunks; that caused
    // production "Fn is not a function" / broken navigation (init order issues).
    // Let Rollup/Vite choose chunk boundaries for framework code.
    chunkSizeWarningLimit: 1500,
  },
  css: {
    devSourcemap: false,
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
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
      content: {
        highlighter: 'prism',
        prismOptions: {
          additionalLangs: [
            'kotlin',
            'dockerfile',
            'sql',
            'properties',
            'java',
            'python',
            'yaml',
            'bash',
            'typescript',
            'javascript',
            'jsx',
            'tsx',
            'json',
            'ini',
            'css',
            'markup',
            'http',
            'go',
            'rust',
          ],
        },
      },
      nitro: {
        preset: 'static',
        prerender: {
          concurrency: Number.isFinite(prerenderConcurrency) ? prerenderConcurrency : 8,
          failOnError: false,
        },
      },
      prerender: {
        routes: async () => [
          '/',
          '/experience',
          '/projects',
          '/achievements',
          '/blog',
        ],
      },
    }),
  ],
  ssr: {
    noExternal: ['@analogjs/**', '@ngx-translate/**', '@ng-bootstrap/**'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
