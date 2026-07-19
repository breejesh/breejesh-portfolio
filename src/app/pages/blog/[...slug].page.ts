import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../services/language/language.service';
import { MarkdownComponent, injectContentFilesMap, parseRawContentFile } from '@analogjs/content';
import { TranslateModule } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs/operators';
import { from, of, combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Comment } from '../../services/firebase/firebase.service';
import { SeoService } from '../../services/seo/seo.service';

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
  imports: [CommonModule, MarkdownComponent, AsyncPipe, RouterLink, TranslateModule, FormsModule],
  templateUrl: './[...slug].page.html',
  styleUrls: ['./[...slug].page.scss']
})
export default class BlogPostComponent {
  private router = inject(Router);
  public route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);
  private contentFiles = injectContentFilesMap();
  private firebaseService = inject(FirebaseService);
  private seoService = inject(SeoService);

  readonly views = signal(0);
  readonly likesCount = signal(0);
  readonly hasLiked = signal(false);
  readonly comments = signal<Comment[]>([]);
  readonly submittingComment = signal(false);

  private getSlugFromRoute(): string {
    // AnalogJS exposes [...slug] as a comma-separated paramMap entry named 'slug'
    const paramSlug = this.route.snapshot.paramMap.get('slug');
    if (paramSlug) {
      return paramSlug.replace(/,/g, '/');
    }

    // Fallback: parse from the current URL path
    // URL is like /blog/en/some-article — strip leading /blog/
    const url = this.router.url.split('?')[0].split('#')[0];
    const prefix = '/blog/';
    if (url.startsWith(prefix)) {
      return url.substring(prefix.length);
    }
    return '';
  }

  readonly post$ = of(null).pipe(
    map(() => this.getSlugFromRoute()),
    switchMap((slug) => {
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
      
      let lang = this.languageService.language();
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
      
      console.log('=== BLOG LOOKUP ===');
      console.log('routeSlug:', slug);
      console.log('lang:', lang);
      console.log('postSlug:', postSlug);
      console.log('filePath:', filePath);
      console.log('availableKeys (first 5):', Object.keys(this.contentFiles).slice(0, 5));
      console.log('found:', !!contentFile);
      
      if (!contentFile) {
        return of({
          filename: filePath,
          slug: postSlug,
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
              slug: postSlug,
              attributes,
              content
            };
          }
          return {
            filename: filePath,
            slug: postSlug,
            attributes: (rawContent as any).metadata,
            content: (rawContent as any).default
          };
        })
      );
    })
  );

  readonly postSignal = toSignal(this.post$);

  private loadStatsEffect = effect(() => {
    const post = this.postSignal();
    if (!post || !post.slug) return;

    const baseSlug = this.extractBaseSlug(post.slug);

    this.firebaseService.incrementViews(baseSlug).subscribe(views => {
      this.views.set(views);
    });

    this.firebaseService.getLikesInfo(baseSlug).subscribe(likes => {
      this.likesCount.set(likes.count);
      this.hasLiked.set(likes.hasLiked);
    });

    this.firebaseService.getComments(baseSlug).subscribe(comments => {
      this.comments.set(comments);
    });
  }, { allowSignalWrites: true });

  private seoEffect = effect(() => {
    const post = this.postSignal();
    if (!post || !post.attributes.title) return;

    const currentLang = this.languageService.language();
    const url = `/blog/${currentLang}/${post.slug}`;

    const alternates = ['en', 'es', 'fr', 'hi'].map(lang => ({
      hreflang: lang,
      href: `/blog/${lang}/${post.slug}`
    }));
    alternates.push({
      hreflang: 'x-default',
      href: `/blog/en/${post.slug}`
    });

    this.seoService.updateMeta({
      title: post.attributes.title,
      description: post.attributes.description,
      image: post.attributes.coverImage,
      url: url,
      type: 'article',
      article: {
        datePublished: post.attributes.date,
        tags: post.attributes.tags,
        author: 'Breejesh Rathod'
      },
      alternates: alternates
    });

    this.seoService.setBlogPostJsonLd({
      title: post.attributes.title,
      description: post.attributes.description,
      date: post.attributes.date,
      image: post.attributes.coverImage,
      url: url,
      tags: post.attributes.tags
    });

    // Add breadcrumb structured data for rich Google results
    this.seoService.setBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.attributes.title, url: url }
    ]);
  });

  constructor() {
    const slug = this.getSlugFromRoute();
    const currentLang = this.languageService.language();
    if (slug) {
      const parts = slug.split('/');
      const firstPart = parts[0];
      if (['en', 'es', 'fr', 'hi'].includes(firstPart)) {
        const postLang = firstPart;
        const postSlugBase = parts.slice(1).join('/');
        if (postLang !== currentLang && postSlugBase) {
          this.router.navigateByUrl(`/blog/${currentLang}/${postSlugBase}`);
        }
      } else if (slug) {
        this.router.navigateByUrl(`/blog/${currentLang}/${slug}`);
      }
    }
  }

  public extractBaseSlug(slug: string): string {
    const clean = slug.startsWith('/') ? slug.substring(1) : slug;
    const parts = clean.split('/');
    if (parts.length >= 2 && ['en', 'es', 'fr', 'hi'].includes(parts[0])) {
      return parts.slice(1).join('/');
    }
    return clean;
  }

  public toggleLike(baseSlug: string) {
    this.firebaseService.toggleLike(baseSlug).subscribe(likes => {
      this.likesCount.set(likes.count);
      this.hasLiked.set(likes.hasLiked);
    });
  }

  public addComment(baseSlug: string, name: string, text: string, form: any) {
    if (!name.trim() || !text.trim() || this.submittingComment()) return;
    this.submittingComment.set(true);

    this.firebaseService.addComment(baseSlug, name, text).subscribe({
      next: (comment) => {
        this.comments.update(all => [comment, ...all]);
        this.submittingComment.set(false);
        form.reset();
      },
      error: () => {
        this.submittingComment.set(false);
      }
    });
  }
}
