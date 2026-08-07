import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { GeneralModule } from '../components/general/general.module';
import { SeoService } from '../services/seo/seo.service';

const PAGE_TITLE = 'Privacy Policy | Breejesh Rathod';
const PAGE_DESCRIPTION =
  'Privacy Policy for breejeshrathod.com and mobile applications published by Breejesh Rathod on Google Play and other app stores.';
const CANONICAL = 'https://breejeshrathod.com/privacy';
/** Keep in sync with “Last updated” shown on the page (Play Console / listings). */
export const PRIVACY_LAST_UPDATED = '6 August 2026';

export const routeMeta: RouteMeta = {
  title: PAGE_TITLE,
  meta: [
    { name: 'description', content: PAGE_DESCRIPTION },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: PAGE_DESCRIPTION },
    { property: 'og:url', content: CANONICAL },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: PAGE_TITLE },
    { name: 'twitter:description', content: PAGE_DESCRIPTION },
  ],
};

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [GeneralModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-inner">
        <header class="legal-header">
          <p class="legal-kicker">Legal</p>
          <h1>Privacy Policy</h1>
          <p class="legal-meta">
            <strong>Last updated:</strong> {{ lastUpdated }}
            ·
            <strong>Public URL:</strong>
            <a href="https://breejeshrathod.com/privacy">https://breejeshrathod.com/privacy</a>
          </p>
          <p class="legal-lede">
            This Privacy Policy applies to the website
            <a href="https://breejeshrathod.com">breejeshrathod.com</a>
            (the “Site”), and to mobile applications and related services published
            by Breejesh Rathod on Google Play and other app stores (collectively,
            the “Services”), including apps such as NomAI, InnoDino, Zunify,
            Vanguard Health, and any other apps that link to this policy.
          </p>
          <p class="legal-lede">
            Use this page as the Privacy Policy URL in Google Play Console and
            other store listings. If an individual app has additional in-app
            disclosures, those apply in addition to this policy.
          </p>
        </header>

        <nav class="legal-toc" aria-label="Table of contents">
          <h2>Contents</h2>
          <ol>
            <li><a href="#who">Who we are</a></li>
            <li><a href="#scope">Scope</a></li>
            <li><a href="#collect">Information we collect</a></li>
            <li><a href="#use">How we use information</a></li>
            <li><a href="#share">Sharing and third parties</a></li>
            <li><a href="#retention">Retention</a></li>
            <li><a href="#security">Security</a></li>
            <li><a href="#rights">Your choices and rights</a></li>
            <li><a href="#children">Children</a></li>
            <li><a href="#international">International transfers</a></li>
            <li><a href="#deletion">Data deletion requests</a></li>
            <li><a href="#changes">Changes</a></li>
            <li><a href="#contact">Contact</a></li>
          </ol>
        </nav>

        <article class="legal-body">
          <section id="who">
            <h2>1. Who we are</h2>
            <p>
              The Services are operated by <strong>Breejesh Rathod</strong>
              (“I”, “me”, “we”), an individual developer based in India.
            </p>
            <ul>
              <li><strong>Website:</strong> https://breejeshrathod.com</li>
              <li><strong>Email:</strong> breejeshrathod&#64;gmail.com</li>
            </ul>
          </section>

          <section id="scope">
            <h2>2. Scope</h2>
            <p>This policy covers:</p>
            <ul>
              <li>Visiting or using the Site (portfolio, blog, project pages).</li>
              <li>
                Using mobile apps published under my developer accounts that
                reference this Privacy Policy.
              </li>
              <li>
                Optional interactions such as blog comments, likes, and view counts.
              </li>
            </ul>
            <p>
              It does not cover third-party websites or apps that we link to
              (for example GitHub, LinkedIn, or external demos). Their own policies apply.
            </p>
          </section>

          <section id="collect">
            <h2>3. Information we collect</h2>
            <p>
              We aim to collect only what is needed to run the Services. Depending
              on how you use them, that may include:
            </p>

            <h3>3.1 Information you provide</h3>
            <ul>
              <li>
                <strong>Blog comments:</strong> display name and comment text you
                submit on the Site.
              </li>
              <li>
                <strong>Contact:</strong> if you email me, the content of that
                email and your address.
              </li>
              <li>
                <strong>App inputs:</strong> content you enter in an app (for
                example notes, preferences, or files you choose to process).
                Apps may process that data on-device and/or using services
                described in the app’s store listing.
              </li>
            </ul>

            <h3>3.2 Information collected automatically</h3>
            <ul>
              <li>
                <strong>Blog engagement (Site):</strong> view counts, likes, and
                related metadata stored in Firebase Realtime Database. To
                prevent duplicate likes we may store a
                <em>hashed</em> identifier derived from network IP (via a public
                IP lookup) or from a random ID in local storage—not your name or
                email.
              </li>
              <li>
                <strong>Device / local preferences:</strong> theme (light/dark)
                and language preference may be stored in the browser’s
                <code>localStorage</code>.
              </li>
              <li>
                <strong>Technical logs:</strong> standard server or hosting logs
                (for example IP address, user agent, timestamps) may be processed
                by infrastructure providers such as Firebase Hosting when you
                load the Site.
              </li>
              <li>
                <strong>Mobile apps:</strong> may collect device type, OS version,
                crash diagnostics, and similar technical data if crash reporting
                or analytics are enabled in that app. Exact SDKs are listed in
                each app’s Play Console Data safety form.
              </li>
            </ul>

            <h3>3.3 What we do not intentionally collect</h3>
            <ul>
              <li>We do not require account registration on the Site for browsing the portfolio or blog.</li>
              <li>We do not sell personal information.</li>
              <li>
                We do not knowingly collect payment card numbers through the Site
                for portfolio content (any paid products would use a separate
                payment provider’s flow and disclosures).
              </li>
            </ul>
          </section>

          <section id="use">
            <h2>4. How we use information</h2>
            <ul>
              <li>Operate, secure, and improve the Site and apps.</li>
              <li>Display blog comments and approximate engagement metrics.</li>
              <li>Respond to messages you send.</li>
              <li>Debug crashes and improve reliability of published apps.</li>
              <li>Comply with law and protect against abuse or fraud.</li>
            </ul>
          </section>

          <section id="share">
            <h2>5. Sharing and third parties</h2>
            <p>We use service providers that process data on our behalf:</p>
            <ul>
              <li>
                <strong>Google Firebase</strong> (Hosting, Realtime Database, and
                potentially other Firebase products used by specific apps) —
                Google’s privacy terms apply:
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer"
                  >firebase.google.com/support/privacy</a
                >.
              </li>
              <li>
                <strong>ipify</strong> (or similar) may be called from the Site
                solely to obtain a public IP for hashing blog like/view identity.
              </li>
              <li>
                <strong>App platforms</strong> (Google Play, Apple App Store if
                applicable) process install and account data under their own policies.
              </li>
            </ul>
            <p>
              We may disclose information if required by law, regulation, legal
              process, or to protect rights, safety, and security.
            </p>
          </section>

          <section id="retention">
            <h2>6. Retention</h2>
            <ul>
              <li>
                Blog comments, likes, and view counters are retained while the
                blog feature remains active, unless you request deletion of your
                comment content.
              </li>
              <li>
                Local preference keys remain until you clear site data in the
                browser.
              </li>
              <li>
                App-side data retention depends on the app (on-device storage vs
                cloud). Uninstalling an app typically removes on-device data;
                cloud-backed data may require a deletion request (see below).
              </li>
            </ul>
          </section>

          <section id="security">
            <h2>7. Security</h2>
            <p>
              We use HTTPS for the Site and industry-standard cloud providers.
              No method of transmission or storage is 100% secure. Please use
              strong device locks and avoid submitting sensitive secrets in blog
              comments.
            </p>
          </section>

          <section id="rights">
            <h2>8. Your choices and rights</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul>
              <li>Access, correct, or delete personal data we hold about you.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Withdraw consent where processing is consent-based.</li>
            </ul>
            <p>
              On the Site you can clear local storage via browser settings. To
              request deletion of a blog comment or other personal data, email
              the contact address below with enough detail to locate the data
              (for example post URL and comment text).
            </p>
            <p>
              Residents of the EEA/UK and other regions may have additional
              rights under GDPR or local law. Contact us to exercise them.
            </p>
          </section>

          <section id="children">
            <h2>9. Children</h2>
            <p>
              The Services are not directed at children under 13 (or the minimum
              age required in your country). We do not knowingly collect personal
              information from children. If you believe a child has provided
              personal data, contact us and we will take reasonable steps to
              delete it.
            </p>
          </section>

          <section id="international">
            <h2>10. International transfers</h2>
            <p>
              Infrastructure may be located outside your country (for example
              Google Cloud / Firebase regions). By using the Services you
              understand that information may be processed in countries with
              different data protection laws. Providers typically use appropriate
              safeguards such as standard contractual clauses where required.
            </p>
          </section>

          <section id="deletion">
            <h2>11. Data deletion requests (including Google Play)</h2>
            <p>
              To request deletion of personal data associated with the Site or a
              mobile app that links to this policy:
            </p>
            <ol>
              <li>
                Email
                <a href="mailto:breejeshrathod@gmail.com">breejeshrathod&#64;gmail.com</a>
                with subject line <strong>“Data deletion request”</strong>.
              </li>
              <li>
                Include: your name or app username if any, app name (if
                applicable), and description of the data (for example comment
                text, approximate date).
              </li>
              <li>
                We will respond within a reasonable period (typically within 30
                days) and delete or anonymize personal data we control, unless we
                must retain it for legal reasons.
              </li>
            </ol>
            <p>
              <strong>Play Console “Delete account URL”:</strong> if an app uses
              accounts, you may use
              <a routerLink="/privacy" fragment="deletion"
                >https://breejeshrathod.com/privacy#deletion</a
              >
              and the email process above, or a dedicated in-app flow if provided
              in that app.
            </p>
          </section>

          <section id="changes">
            <h2>12. Changes</h2>
            <p>
              We may update this policy from time to time. The “Last updated”
              date at the top will change when we do. Continued use of the
              Services after changes means you accept the revised policy, to the
              extent permitted by law.
            </p>
          </section>

          <section id="contact">
            <h2>13. Contact</h2>
            <p>
              Questions about this Privacy Policy or your data:
            </p>
            <ul>
              <li>
                Email:
                <a href="mailto:breejeshrathod@gmail.com">breejeshrathod&#64;gmail.com</a>
              </li>
              <li>
                Website:
                <a href="https://breejeshrathod.com">https://breejeshrathod.com</a>
              </li>
            </ul>
            <p class="legal-play">
              <strong>For Google Play:</strong> paste
              <code>https://breejeshrathod.com/privacy</code>
              into the Privacy policy field of each app listing.
            </p>
          </section>
        </article>

        <p class="legal-nav">
          <a routerLink="/">Home</a>
          ·
          <a routerLink="/terms">Terms of Use</a>
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
        line-height: 1.2;
      }
      .legal-meta {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0 0 16px;
      }
      .legal-lede {
        color: var(--text-secondary);
        line-height: 1.65;
        margin: 0 0 12px;
      }
      .legal-toc {
        margin: 32px 0;
        padding: 20px 24px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        background: var(--surface-elevated, var(--bg-secondary));
      }
      .legal-toc h2 {
        font-size: 1rem;
        margin: 0 0 12px;
      }
      .legal-toc ol {
        margin: 0;
        padding-left: 1.25rem;
        color: var(--text-secondary);
      }
      .legal-toc a {
        color: var(--accent-color, #64ffda);
        text-decoration: none;
      }
      .legal-toc a:hover {
        text-decoration: underline;
      }
      .legal-body section {
        margin-bottom: 32px;
        scroll-margin-top: 100px;
      }
      .legal-body h2 {
        font-size: 1.35rem;
        margin: 0 0 12px;
      }
      .legal-body h3 {
        font-size: 1.05rem;
        margin: 20px 0 8px;
      }
      .legal-body p,
      .legal-body li {
        line-height: 1.65;
        color: var(--text-secondary);
      }
      .legal-body ul,
      .legal-body ol {
        padding-left: 1.25rem;
      }
      .legal-body a {
        color: var(--accent-color, #64ffda);
      }
      .legal-body code {
        font-size: 0.9em;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--accent-opacity, rgba(100, 255, 218, 0.1));
      }
      .legal-play {
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 8px;
        border: 1px dashed var(--border-color);
        background: var(--bg-secondary);
      }
      .legal-nav {
        margin: 24px 0 8px;
        font-size: 0.95rem;
      }
      .legal-nav a {
        color: var(--accent-color, #64ffda);
      }
    `,
  ],
})
export default class PrivacyPage {
  readonly lastUpdated = PRIVACY_LAST_UPDATED;
  private seo = inject(SeoService);

  constructor() {
    this.seo.updateMeta({
      title: 'Privacy Policy',
      description: PAGE_DESCRIPTION,
      url: '/privacy',
    });
  }
}
