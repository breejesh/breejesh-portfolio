import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { SeoService } from '../services/seo/seo.service';

/**
 * Root catch-all 404 (Analog routing docs).
 * Prerendered as /404.html with nitro routeRules ssr:false for static hosts.
 * SPA fallback for unknown paths remains public/index.html via Firebase rewrite
 * so non-prerendered blog posts still hydrate client-side.
 */
export const routeMeta: RouteMeta = {
  title: 'Page Not Found | Breejesh Rathod',
  meta: [
    {
      name: 'description',
      content: 'The page you requested could not be found.',
    },
    {
      name: 'robots',
      content: 'noindex, follow',
    },
  ],
  canActivate: [
    () => {
      // Analog catch-all docs: set HTTP status during SSR (status only —
      // do not response.end() so the 404 body can still render).
      const response = injectResponse();
      if (import.meta.env.SSR && response) {
        response.statusCode = 404;
      }
      return true;
    },
  ],
};

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>Page not found</h1>
      <p>That URL does not match any page on this site.</p>
      <p>
        <a routerLink="/">Go home</a>
        ·
        <a routerLink="/blog">Blog</a>
      </p>
    </section>
  `,
  styles: [
    `
      .not-found {
        max-width: 40rem;
        margin: 4rem auto;
        padding: 0 1.25rem;
        text-align: center;
      }
      h1 {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
      }
      p {
        color: var(--text-secondary, #a1a1aa);
        margin-bottom: 0.75rem;
      }
      a {
        color: var(--accent-color, #64ffda);
      }
    `,
  ],
})
export default class NotFoundPage {
  private seo = inject(SeoService);

  constructor() {
    this.seo.updateMeta({
      title: 'Page Not Found',
      description: 'The page you requested could not be found.',
      url: '/404',
      robots: 'noindex, follow',
      rawTitle: false,
    });
  }
}
