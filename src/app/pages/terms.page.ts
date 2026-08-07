import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { GeneralModule } from '../components/general/general.module';
import { SeoService } from '../services/seo/seo.service';

const PAGE_TITLE = 'Terms of Use | Breejesh Rathod';
const PAGE_DESCRIPTION =
  'Terms of Use for breejeshrathod.com and related services and applications published by Breejesh Rathod.';
const CANONICAL = 'https://breejeshrathod.com/terms';
export const TERMS_LAST_UPDATED = '6 August 2026';

export const routeMeta: RouteMeta = {
  title: PAGE_TITLE,
  meta: [
    { name: 'description', content: PAGE_DESCRIPTION },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: PAGE_DESCRIPTION },
    { property: 'og:url', content: CANONICAL },
    { name: 'twitter:title', content: PAGE_TITLE },
    { name: 'twitter:description', content: PAGE_DESCRIPTION },
  ],
};

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [GeneralModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-inner">
        <header class="legal-header">
          <p class="legal-kicker">Legal</p>
          <h1>Terms of Use</h1>
          <p class="legal-meta">
            <strong>Last updated:</strong> {{ lastUpdated }}
            ·
            <a href="https://breejeshrathod.com/terms">https://breejeshrathod.com/terms</a>
          </p>
          <p class="legal-lede">
            These Terms of Use (“Terms”) govern access to
            <a href="https://breejeshrathod.com">breejeshrathod.com</a>
            and, where applicable, mobile applications and demos published by
            Breejesh Rathod that reference these Terms (the “Services”).
          </p>
        </header>

        <article class="legal-body">
          <section>
            <h2>1. Acceptance</h2>
            <p>
              By using the Services you agree to these Terms and to the
              <a routerLink="/privacy">Privacy Policy</a>. If you do not agree,
              do not use the Services.
            </p>
          </section>

          <section>
            <h2>2. Services provided “as is”</h2>
            <p>
              The Site is a personal portfolio and technical blog. Apps and demos
              may be experimental or provided without charge. Unless a separate
              paid agreement says otherwise, the Services are provided
              <strong>as is</strong> and <strong>as available</strong>, without
              warranties of any kind, whether express or implied, including
              merchantability, fitness for a particular purpose, and
              non-infringement, to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2>3. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Services for unlawful, harmful, or abusive purposes.</li>
              <li>
                Attempt to disrupt, scrape in an abusive way, or reverse engineer
                systems except as allowed by open-source licenses of published
                code.
              </li>
              <li>
                Post spam, malware links, harassment, or illegal content in
                comments or other user-generated features.
              </li>
              <li>
                Impersonate others or misrepresent affiliation when commenting or
                contacting me.
              </li>
            </ul>
            <p>
              I may remove comments or restrict access that violate these Terms
              or applicable law.
            </p>
          </section>

          <section>
            <h2>4. Intellectual property</h2>
            <p>
              Site design, branding, and original written content are owned by
              Breejesh Rathod unless otherwise stated. Blog posts and portfolio
              materials may be shared for personal learning with attribution;
              commercial reuse requires permission unless an open-source license
              on a specific repository says otherwise.
            </p>
            <p>
              Code repositories linked from the Site are governed by their own
              LICENSE files (for example MIT or Apache-2.0).
            </p>
          </section>

          <section>
            <h2>5. Third-party links and services</h2>
            <p>
              The Services may link to third-party sites, SDKs, or platforms
              (GitHub, Google Firebase, Google Play, etc.). I am not responsible
              for third-party content, policies, or availability.
            </p>
          </section>

          <section>
            <h2>6. User content</h2>
            <p>
              If you submit comments or other content, you grant me a
              non-exclusive, worldwide, royalty-free license to host, display,
              and moderate that content in connection with the Services. You
              represent that you have the rights to submit it and that it does
              not violate law or third-party rights.
            </p>
          </section>

          <section>
            <h2>7. Mobile applications</h2>
            <p>
              Apps on Google Play or other stores may have additional in-app
              terms, open-source notices, or store-required disclosures. Store
              rules (for example Google Play Developer Distribution Agreement)
              also apply between you and the store operator.
            </p>
          </section>

          <section>
            <h2>8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Breejesh Rathod will not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits, data, or goodwill,
              arising from your use of the Services. Total liability for any
              claim relating to the Services will not exceed the greater of (a)
              amounts you paid me for the specific paid service giving rise to
              the claim in the 12 months before the claim, or (b) USD 50, if the
              service was free.
            </p>
          </section>

          <section>
            <h2>9. Indemnity</h2>
            <p>
              You agree to indemnify and hold harmless Breejesh Rathod from
              claims arising out of your misuse of the Services or your
              violation of these Terms, to the extent permitted by law.
            </p>
          </section>

          <section>
            <h2>10. Governing law</h2>
            <p>
              These Terms are governed by the laws of India, without regard to
              conflict-of-law principles, unless mandatory consumer protections
              in your country of residence require otherwise. Courts in India
              shall have exclusive jurisdiction, subject to those mandatory
              protections.
            </p>
          </section>

          <section>
            <h2>11. Changes</h2>
            <p>
              I may update these Terms by posting a new version on this page and
              updating the “Last updated” date. Continued use after changes
              constitutes acceptance where allowed by law.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>
              Questions:
              <a href="mailto:breejeshrathod@gmail.com">breejeshrathod&#64;gmail.com</a>
            </p>
          </section>
        </article>

        <p class="legal-nav">
          <a routerLink="/">Home</a>
          ·
          <a routerLink="/privacy">Privacy Policy</a>
          ·
          <a routerLink="/blog">Blog</a>
        </p>
      </div>
      <app-footer></app-footer>
    </div>
  `,
  styles: [
    `
      .legal-page {
        padding-top: 120px;
        min-height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .legal-inner {
        max-width: 800px;
        width: 100%;
        margin: 0 auto;
        padding: 0 24px 48px;
        box-sizing: border-box;
        color: var(--text-primary);
      }
      .legal-kicker {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent-color, #64ffda);
        margin: 0 0 8px;
      }
      .legal-header h1 {
        font-size: 2rem;
        margin: 0 0 12px;
      }
      .legal-meta {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0 0 16px;
      }
      .legal-lede {
        color: var(--text-secondary);
        line-height: 1.65;
      }
      .legal-body section {
        margin-bottom: 28px;
      }
      .legal-body h2 {
        font-size: 1.25rem;
        margin: 0 0 10px;
      }
      .legal-body p,
      .legal-body li {
        line-height: 1.65;
        color: var(--text-secondary);
      }
      .legal-body ul {
        padding-left: 1.25rem;
      }
      .legal-body a {
        color: var(--accent-color, #64ffda);
      }
      .legal-nav {
        margin: 24px 0 8px;
      }
      .legal-nav a {
        color: var(--accent-color, #64ffda);
      }
    `,
  ],
})
export default class TermsPage {
  readonly lastUpdated = TERMS_LAST_UPDATED;
  private seo = inject(SeoService);

  constructor() {
    this.seo.updateMeta({
      title: 'Terms of Use',
      description: PAGE_DESCRIPTION,
      url: '/terms',
    });
  }
}
