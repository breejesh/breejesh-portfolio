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
  template: `
    <div class="blog-post-section" *ngIf="postSignal() as post">
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
            <span class="post-views"><i class="far fa-eye"></i> {{ views() }} {{ 'Blog.Views' | translate }}</span>
            <span class="meta-divider">|</span>
            <button class="like-btn" (click)="toggleLike(extractBaseSlug(post.slug))" [class.liked]="hasLiked()">
              <i class="fas fa-heart"></i> {{ likesCount() }}
            </button>
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

        <!-- Comments Section -->
        <section class="comments-section">
          <h3 class="comments-title">
            <i class="far fa-comments"></i> {{ 'Blog.CommentsTitle' | translate }} ({{ comments().length }})
          </h3>

          <!-- Add Comment Form -->
          <form #commentForm="ngForm" (submit)="addComment(extractBaseSlug(post.slug), nameInput.value, textInput.value, commentForm)" class="comment-form">
            <div class="form-row">
              <input 
                #nameInput
                required
                name="name"
                ngModel
                type="text" 
                [placeholder]="'Blog.NamePlaceholder' | translate" 
                class="form-input name-input" 
              />
            </div>
            <div class="form-row">
              <textarea 
                #textInput
                required
                name="text"
                ngModel
                rows="4" 
                [placeholder]="'Blog.CommentPlaceholder' | translate" 
                class="form-input text-input"
              ></textarea>
            </div>
            <div class="form-actions">
              <button 
                type="submit" 
                [disabled]="!commentForm.valid || submittingComment()" 
                class="submit-comment-btn"
              >
                <span *ngIf="submittingComment()">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                <span *ngIf="!submittingComment()">
                  {{ 'Blog.SubmitComment' | translate }}
                </span>
              </button>
            </div>
          </form>

          <!-- Comments List -->
          <div class="comments-list">
            <div *ngFor="let comment of comments()" class="comment-item">
              <div class="comment-header">
                <span class="comment-author"><i class="far fa-user"></i> {{ comment.name }}</span>
                <span class="comment-date">{{ comment.timestamp | date: 'medium' }}</span>
              </div>
              <p class="comment-body">{{ comment.text }}</p>
            </div>                      
          </div>
        </section>
      </article>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 1280px;
      margin: 0 auto;
    }

    .blog-post-section {
      width: 100%;
      min-width: 0;
      padding: 0 16px 40px;
      box-sizing: border-box;
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

    .post-views {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'SF Mono', monospace;
    }

    .like-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      font-family: 'SF Mono', monospace;
    }
    
    .like-btn i {
      font-size: 0.85rem;
      transition: transform 0.2s ease;
    }

    .like-btn:hover {
      border-color: #f43f5e;
      color: #f43f5e;
      background: rgba(244, 63, 94, 0.05);
    }

    .like-btn:hover i {
      transform: scale(1.2);
    }

    .like-btn.liked {
      background: rgba(244, 63, 94, 0.1);
      border-color: #f43f5e;
      color: #f43f5e;
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
      padding: 8px 8px 4px 8px;
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
      padding: 20px 0 4px 20px;
      background: var(--bg-primary);
      margin: 0 0 24px 0;
      font-style: italic;
      color: var(--text-secondary);
    }

    .comments-section {
      margin-top: 50px;
      border-top: 1px solid var(--border-color);
      padding-top: 40px;
    }

    .comments-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .comment-form {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      transition: border-color 0.3s;
    }

    .comment-form:focus-within {
      border-color: var(--accent-color);
    }

    .form-row {
      margin-bottom: 12px;
    }

    .form-input {
      width: 100%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--accent-color);
      background: var(--bg-primary);
    }

    .name-input {
      max-width: 300px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .submit-comment-btn {
      background: var(--accent-color);
      color: var(--bg-primary);
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s;
    }

    .submit-comment-btn:hover:not(:disabled) {
      background: var(--accent-color-hover);
      transform: translateY(-1px);
    }

    .submit-comment-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 20px;
      animation: fadeIn 0.4s ease;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.85rem;
    }

    .comment-author {
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .comment-date {
      color: var(--text-secondary);
      font-family: 'SF Mono', monospace;
    }

    .comment-body {
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
    }

    .no-comments {
      text-align: center;
      padding: 30px;
      color: var(--text-secondary);
      font-style: italic;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export default class BlogPostComponent {
  private router = inject(Router);
  public route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);
  private contentFiles = injectContentFilesMap();
  private firebaseService = inject(FirebaseService);

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
