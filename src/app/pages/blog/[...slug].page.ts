import {
  AfterViewChecked,
  Component,
  ElementRef,
  ExperimentalPendingTasks,
  Inject,
  PLATFORM_ID,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, AsyncPipe, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../services/language/language.service';
import { ThemeService } from '../../services/theme/theme.service';
import { MarkdownComponent, injectContentFilesMap, parseRawContentFile } from '@analogjs/content';
import { TranslateModule } from '@ngx-translate/core';
import { distinctUntilChanged, filter, map, switchMap, startWith, finalize } from 'rxjs/operators';
import { from, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Comment } from '../../services/firebase/firebase.service';
import { SeoService } from '../../services/seo/seo.service';
import { blogPostRouteMeta } from './blog-route-meta';

/** Analog RouteMeta: title + OG/Twitter from frontmatter (content routes SEO docs). */
export const routeMeta = blogPostRouteMeta;

export interface BlogAttributes {
  title: string;
  description: string;
  date: string;
  tags: string[];
  coverImage?: string;
  previewImage?: string;
}

export interface BlogPostView {
  filename: string;
  /** Base slug without language prefix, e.g. java-virtual-threads */
  slug: string;
  /** Language from the URL, e.g. en */
  lang: string;
  attributes: BlogAttributes;
  content: string;
}

const EMPTY_POST: BlogPostView = {
  filename: '',
  slug: '',
  lang: 'en',
  attributes: {} as BlogAttributes,
  content: '',
};

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, MarkdownComponent, AsyncPipe, RouterLink, TranslateModule, FormsModule],
  templateUrl: './[...slug].page.html',
  styleUrls: ['./[...slug].page.scss']
})
export default class BlogPostComponent implements AfterViewChecked {
  private router = inject(Router);
  public route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  private contentFiles = injectContentFilesMap();
  private firebaseService = inject(FirebaseService);
  private seoService = inject(SeoService);
  private pendingTasks = inject(ExperimentalPendingTasks);
  private host = inject(ElementRef<HTMLElement>);
  private tablesWrappedForSlug = '';

  readonly views = signal(0);
  readonly likesCount = signal(0);
  readonly hasLiked = signal(false);
  readonly comments = signal<Comment[]>([]);
  readonly submittingComment = signal(false);
  readonly loadError = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Resolve /blog/{lang}/{post} from the catch-all route.
   * Analog maps [...slug] to path **, so paramMap may not have "slug".
   * Prefer ActivatedRoute url segments, then router URL fallback.
   */
  private getSlugFromRoute(): string {
    const segments = this.route.snapshot.url.map((s) => s.path).filter(Boolean);
    if (segments.length > 0) {
      return segments.join('/');
    }

    const paramSlug = this.route.snapshot.paramMap.get('slug');
    if (paramSlug) {
      return paramSlug.replace(/,/g, '/');
    }

    // Walk parent routes for segments under /blog
    const fromTree = this.route.pathFromRoot
      .flatMap((r) => r.snapshot.url.map((s) => s.path))
      .filter(Boolean);
    if (fromTree.length > 0) {
      // Drop leading "blog" if present
      const parts = fromTree[0] === 'blog' ? fromTree.slice(1) : fromTree;
      if (parts.length > 0) {
        return parts.join('/');
      }
    }

    const url = this.router.url.split('?')[0].split('#')[0];
    const prefix = '/blog/';
    if (url.startsWith(prefix)) {
      return url.substring(prefix.length);
    }
    return '';
  }

  private parseLangAndSlug(raw: string): { lang: 'en' | 'es' | 'fr' | 'hi'; postSlug: string } {
    const clean = raw.startsWith('/') ? raw.substring(1) : raw;
    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2 && ['en', 'es', 'fr', 'hi'].includes(parts[0])) {
      return {
        lang: parts[0] as 'en' | 'es' | 'fr' | 'hi',
        postSlug: parts.slice(1).join('/'),
      };
    }
    return {
      lang: this.languageService.language(),
      postSlug: clean,
    };
  }

  private loadPost(rawSlug: string): Observable<BlogPostView> {
    if (!rawSlug) {
      this.loadError.set(true);
      return of({ ...EMPTY_POST, content: 'No Content Found' });
    }

    const { lang, postSlug } = this.parseLangAndSlug(rawSlug);

    // URL language wins. Do not redirect the user away from an explicit /blog/en/... link.
    if (this.languageService.language() !== lang) {
      this.languageService.changeLanguage(lang);
    }

    const filePath = `src/content/blog/${lang}/${postSlug}`;
    const contentFile =
      this.contentFiles[`/${filePath}.md`] ??
      this.contentFiles[`${filePath}.md`] ??
      this.contentFiles[`/${filePath}.agx`] ??
      this.contentFiles[`${filePath}.agx`];

    if (!contentFile) {
      this.loadError.set(true);
      return of({
        filename: filePath,
        slug: postSlug,
        lang,
        attributes: {} as BlogAttributes,
        content: 'No Content Found',
      });
    }

    // Block SSR/prerender stability until the markdown chunk is loaded.
    // Without this, Analog finishes HTML before content arrives (empty app-blog-post).
    const clearTask = this.pendingTasks.add();

    return from(contentFile()).pipe(
      map((rawContent) => {
        this.loadError.set(false);
        if (typeof rawContent === 'string') {
          const { content, attributes } = parseRawContentFile<BlogAttributes>(rawContent);
          return {
            filename: filePath,
            slug: postSlug,
            lang,
            attributes,
            content,
          };
        }
        return {
          filename: filePath,
          slug: postSlug,
          lang,
          attributes: (rawContent as { metadata: BlogAttributes }).metadata,
          content: (rawContent as { default: string }).default,
        };
      }),
      catchError((err) => {
        // Common production failure: /assets/blog-data/*.json missing → SPA index.html
        console.error('[blog] failed to load post body', filePath, err);
        this.loadError.set(true);
        return of({
          filename: filePath,
          slug: postSlug,
          lang,
          attributes: {} as BlogAttributes,
          content: 'No Content Found',
        });
      }),
      finalize(() => {
        // Match Analog's getContentFile timing so markdown render can settle.
        setTimeout(() => clearTask(), 10);
      })
    );
  }

  readonly post$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    startWith(null),
    map(() => this.getSlugFromRoute()),
    distinctUntilChanged(),
    switchMap((slug) => this.loadPost(slug))
  );

  readonly postSignal = toSignal(this.post$);

  private loadStatsEffect = effect(() => {
    const post = this.postSignal();
    if (!post || !post.slug) return;
    // Firebase + localStorage only on the client
    if (!isPlatformBrowser(this.platformId)) return;

    const baseSlug = post.slug;

    this.firebaseService.incrementViews(baseSlug).subscribe((views) => {
      this.views.set(views);
    });

    this.firebaseService.getLikesInfo(baseSlug).subscribe((likes) => {
      this.likesCount.set(likes.count);
      this.hasLiked.set(likes.hasLiked);
    });

    this.firebaseService.getComments(baseSlug).subscribe((comments) => {
      this.comments.set(comments);
    });
  }, { allowSignalWrites: true });

  private seoEffect = effect(() => {
    const post = this.postSignal();
    if (!post || !post.attributes?.title) return;

    const lang = post.lang || this.languageService.language();
    const url = `/blog/${lang}/${post.slug}`;

    const alternates: { hreflang: string; href: string }[] = (
      ['en', 'es', 'fr', 'hi'] as const
    ).map((l) => ({
      hreflang: l,
      href: `/blog/${l}/${post.slug}`,
    }));
    alternates.push({
      hreflang: 'x-default',
      href: `/blog/en/${post.slug}`,
    });

    this.seoService.updateMeta({
      title: post.attributes.title,
      description: post.attributes.description,
      image: post.attributes.coverImage,
      url: url,
      type: 'article',
      lang,
      keywords: post.attributes.tags,
      article: {
        datePublished: post.attributes.date,
        dateModified: post.attributes.date,
        tags: post.attributes.tags,
        author: 'Breejesh Rathod',
      },
      alternates: alternates,
    });

    this.seoService.setBlogPostJsonLd({
      title: post.attributes.title,
      description: post.attributes.description,
      date: post.attributes.date,
      dateModified: post.attributes.date,
      image: post.attributes.coverImage,
      url: url,
      tags: post.attributes.tags,
      lang,
    });

    this.seoService.setBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.attributes.title, url: url },
    ]);
  });

  public extractBaseSlug(slug: string): string {
    const clean = slug.startsWith('/') ? slug.substring(1) : slug;
    const parts = clean.split('/');
    if (parts.length >= 2 && ['en', 'es', 'fr', 'hi'].includes(parts[0])) {
      return parts.slice(1).join('/');
    }
    return clean;
  }

  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const post = this.postSignal();
    if (!post?.slug || !post.content) {
      return;
    }

    const root = this.host.nativeElement.querySelector('.post-content') as HTMLElement;
    if (!root) {
      return;
    }

    if (this.tablesWrappedForSlug !== post.slug) {
      const tables = root.querySelectorAll('table');
      if (!tables.length) {
        if (root.querySelector('p, h1, h2, h3, h4, ul, ol, pre, img, blockquote')) {
          this.tablesWrappedForSlug = post.slug;
        }
      } else {
        Array.from(tables).forEach((table: Element) => {
          const parent = table.parentElement;
          if (!parent || parent.classList.contains('md-table-wrap')) {
            return;
          }
          const wrap = document.createElement('div');
          wrap.className = 'md-table-wrap';
          parent.insertBefore(wrap, table);
          wrap.appendChild(table);
        });
        this.tablesWrappedForSlug = post.slug;
      }
    }
  }

  public toggleLike(baseSlug: string) {
    this.firebaseService.toggleLike(baseSlug).subscribe((likes) => {
      this.likesCount.set(likes.count);
      this.hasLiked.set(likes.hasLiked);
    });
  }

  public addComment(baseSlug: string, name: string, text: string, form: { reset: () => void }) {
    if (!name.trim() || !text.trim() || this.submittingComment()) return;
    this.submittingComment.set(true);

    this.firebaseService.addComment(baseSlug, name, text).subscribe({
      next: (comment) => {
        this.comments.update((all) => [comment, ...all]);
        this.submittingComment.set(false);
        form.reset();
      },
      error: () => {
        this.submittingComment.set(false);
      },
    });
  }
}
