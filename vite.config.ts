/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      content: {
        highlighter: 'prism',
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
