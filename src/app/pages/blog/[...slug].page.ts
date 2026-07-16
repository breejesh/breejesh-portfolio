import { Component, inject, effect } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../services/language/language.service';
import { MarkdownComponent, injectContentFilesMap, parseRawContentFile } from '@analogjs/content';
import { TranslateModule } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs/operators';
import { from, of, combineLatest } from 'rxjs';

export interface BlogAttributes {
  title: string;
  description: string;
  date: string;
  tags: string[];
  coverImage?: string;
  previewImage?: string;
}

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, MarkdownComponent, AsyncPipe, RouterLink, TranslateModule],
  template: `
    <div class="blog-post-section" *ngIf="post$ | async as post">
      <header class="post-header-nav">
        <a routerLink="/blog" class="back-link">
          &larr; {{ 'Blog.BackLink' | translate }}
        </a>
      </header>

      <article class="blog-post">
        <div class="post-cover-wrapper" *ngIf="post.attributes.coverImage">
          <img [src]="post.attributes.coverImage" alt="Cover" class="post-cover-img" />
        </div>

        <header class="post-header">
          <h1 class="post-title">{{ post.attributes.title }}</h1>
          <div class="post-meta">
            <span class="post-date"><i class="far fa-calendar-alt"></i> {{ post.attributes.date | date: 'longDate' }}</span>
            <span class="meta-divider">|</span>
            <div class="tag-badges">
              <span *ngFor="let tag of post.attributes.tags" class="badge tag-badge">{{ tag }}</span>
            </div>
          </div>
          <p class="post-description">{{ post.attributes.description }}</p>
        </header>

        <section class="post-content">
          <analog-markdown [content]="post.content" />
        </section>
      </article>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
    }

    .blog-post-section {
      width: 100%;
      min-width: 0;
    }

    .post-header-nav {
      margin-bottom: 24px;
    }

    .back-link {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .back-link:hover {
      color: var(--accent-color-hover);
      transform: translateX(-4px);
    }

    .blog-post {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      transition: all 0.3s;
    }

    .post-cover-wrapper {
      width: calc(100% + 80px);
      margin: -40px -40px 30px;
      height: 380px;
      overflow: hidden;
      border-radius: 16px 16px 0 0;
      border-bottom: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .blog-post {
        padding: 24px;
      }
      .post-cover-wrapper {
        width: calc(100% + 48px);
        margin: -24px -24px 24px;
        height: 240px;
      }
    }

    .post-cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .post-cover-wrapper:hover .post-cover-img {
      transform: scale(1.03);
    }

    .post-header {
      margin-bottom: 30px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 24px;
    }

    .post-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 16px 0;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }

    @media (max-width: 768px) {
      .post-title {
        font-size: 1.8rem;
      }
    }

    .post-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .post-date {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'SF Mono', monospace;
    }

    .meta-divider {
      color: var(--border-color);
    }

    .tag-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-opacity);
      color: var(--accent-color);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid var(--border-color);
    }

    .post-description {
      font-style: italic;
      color: var(--text-secondary);
      font-size: 1.05rem;
      line-height: 1.5;
      margin-top: 16px;
    }

    /* Style the parsed markdown content inside the host component */
    :host ::ng-deep .post-content {
      color: var(--text-secondary);
      font-size: 1.05rem;
      line-height: 1.75;
    }

    :host ::ng-deep .post-content h1,
    :host ::ng-deep .post-content h2,
    :host ::ng-deep .post-content h3,
    :host ::ng-deep .post-content h4 {
      color: var(--text-primary);
      font-weight: 700;
      margin-top: 36px;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    :host ::ng-deep .post-content h1 { font-size: 1.8rem; }
    :host ::ng-deep .post-content h2 { font-size: 1.5rem; }
    :host ::ng-deep .post-content h3 { font-size: 1.25rem; }

    :host ::ng-deep .post-content p {
      margin-bottom: 24px;
    }

    :host ::ng-deep .post-content a {
      color: var(--accent-color);
      text-decoration: none;
      transition: color 0.2s;
    }

    :host ::ng-deep .post-content a:hover {
      color: var(--accent-color-hover);
      text-decoration: underline;
    }

    :host ::ng-deep .post-content img {
      max-width: 100%;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid var(--border-color);
    }

    :host ::ng-deep .post-content pre {
      background: #011627 !important;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid var(--border-color);
      margin: 25px 0;
    }

    :host ::ng-deep .post-content code {
      font-family: 'Fira Code', 'Courier New', Courier, monospace;
      font-size: 0.9rem;
      background: var(--accent-opacity);
      padding: 3px 6px;
      border-radius: 4px;
      color: var(--accent-color);
    }

    :host ::ng-deep .post-content pre code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: #ccd6f6;
    }

    :host ::ng-deep .post-content ul,
    :host ::ng-deep .post-content ol {
      margin-bottom: 24px;
      padding-left: 24px;
    }

    :host ::ng-deep .post-content li {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    :host ::ng-deep .post-content blockquote {
      border-left: 4px solid var(--accent-color);
      padding: 4px 0 4px 20px;
      margin: 0 0 24px 0;
      font-style: italic;
      color: var(--text-secondary);
    }
  `]
})
export default class BlogPostComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);
  private contentFiles = injectContentFilesMap();

  readonly post$ = combineLatest([
    this.route.paramMap.pipe(
      map((params) => {
        return params.get('slug') || '';
      })
    ),
    toObservable(this.languageService.language)
  ]).pipe(
    switchMap(([slug, currentLang]) => {
      if (!slug) {
        return of({
          filename: '',
          slug: '',
          attributes: {} as BlogAttributes,
          content: 'No Content Found'
        });
      }
      
      const cleanSlug = slug.startsWith('/') ? slug.substring(1) : slug;
      const parts = cleanSlug.split('/');
      
      let lang = currentLang;
      let postSlug = cleanSlug;
      
      if (parts.length >= 2 && ['en', 'es', 'fr', 'hi'].includes(parts[0])) {
        lang = parts[0] as any;
        postSlug = parts.slice(1).join('/');
      }
      
      const filePath = `src/content/blog/${lang}/${postSlug}`;
      const contentFile = this.contentFiles[`${filePath}.md`] ?? 
                          this.contentFiles[`/${filePath}.md`] ?? 
                          this.contentFiles[`${filePath}.agx`] ?? 
                          this.contentFiles[`/${filePath}.agx`];
      
      console.log('BLOG LOOKUP - SLUG:', slug, 'LANG:', lang, 'POSTSLUG:', postSlug, 'FILEPATH:', filePath, 'FOUND FILE:', !!contentFile);
      
      if (!contentFile) {
        return of({
          filename: filePath,
          slug,
          attributes: {} as BlogAttributes,
          content: 'No Content Found'
        });
      }

      return from(contentFile()).pipe(
        map((rawContent) => {
          if (typeof rawContent === 'string') {
            const { content, attributes } = parseRawContentFile<BlogAttributes>(rawContent);
            return {
              filename: filePath,
              slug,
              attributes,
              content
            };
          }
          return {
            filename: filePath,
            slug,
            attributes: (rawContent as any).metadata,
            content: (rawContent as any).default
          };
        })
      );
    })
  );

  constructor() {
    const paramsSignal = toSignal(this.route.paramMap);

    effect(() => {
      const params = paramsSignal();
      if (!params) return;
      
      const currentLang = this.languageService.language();
      const rawSlug = params.get('slug') || '';
      const segments = rawSlug.split('/');
      if (segments.length >= 1) {
        const firstSegment = segments[0];
        if (['en', 'es', 'fr', 'hi'].includes(firstSegment)) {
          const postLang = firstSegment;
          const postSlugBase = segments.slice(1).join('/');
          if (postLang !== currentLang) {
            this.router.navigateByUrl(`/blog/${currentLang}/${postSlugBase}`);
          }
        } else if (rawSlug) {
          // No language prefix in URL, redirect to current selected language path
          this.router.navigateByUrl(`/blog/${currentLang}/${rawSlug}`);
        }
      }
    });
  }
}
