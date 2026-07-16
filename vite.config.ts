/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  build: {
    target: ['es2020'],
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
      }
    },
    analog({
      content: {
        highlighter: 'prism',
        prismOptions: {
          additionalLangs: ['kotlin'],
        }
      },
      nitro: {
        preset: 'static',
        prerender: {
          concurrency: 1,
        }
      },
      prerender: {
        routes: async () => [
          '/',
          '/blog',
          {
            contentDir: 'src/content/blog',
            transform: (file) => {
              const slug = file.name.replace('.md', '');
              return `/blog/${slug}`;
            },
          },
        ],
      },
    }),
  ],
  ssr: {
    external: [
      '@angular/core',
      '@angular/common',
      '@angular/platform-browser',
      '@angular/platform-server',
      '@angular/compiler',
      '@angular/router',
      '@angular/animations',
      '@angular/localize',
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
