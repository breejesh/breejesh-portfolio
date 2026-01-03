import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ElementRef,
  viewChild,
  OnDestroy,
  PLATFORM_ID,
  untracked,
  afterNextRender,
  Injector,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import type { ContentFile } from '@analogjs/content';
import { LanguageService } from '../../services/language/language.service';
import BlogLayoutComponent, { BlogAttributes } from '../blog.page';
import { SeoService } from '../../services/seo/seo.service';

/** Cards per load. Grid-friendly (≈4 rows on a 3-column desktop layout). */
const PAGE_SIZE = 12;

@Component({
  selector: 'app-blog-index',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss']
})
export default class BlogIndexPage implements OnDestroy {
  private layout = inject(BlogLayoutComponent);
  public languageService = inject(LanguageService);
  private seoService = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  readonly searchQuery = this.layout.searchQuery;
  readonly selectedTag = this.layout.selectedTag;
  readonly allPosts = this.layout.allPosts;
  readonly allTags = this.layout.allTags;

  /** How many grid posts are currently rendered (grows with Load more / infinite scroll). */
  readonly visibleCount = signal(PAGE_SIZE);
  readonly pageSize = PAGE_SIZE;

  private loadMoreSentinel = viewChild<ElementRef<HTMLElement>>('loadMoreSentinel');
  private observer: IntersectionObserver | null = null;

  readonly filtersActive = computed(() => {
    return this.searchQuery().trim() !== '' || this.selectedTag() !== '';
  });

  readonly filteredPosts = computed(() => {
    const lang = this.languageService.language();
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();

    return this.allPosts.filter((post) => {
      const matchesLang = post.filename.includes('/blog/' + lang + '/');
      if (!matchesLang) return false;

      const matchesSearch =
        !query ||
        post.attributes.title.toLowerCase().includes(query) ||
        post.attributes.description.toLowerCase().includes(query);
      const matchesTag = !tag || (post.attributes.tags && post.attributes.tags.includes(tag));

      return matchesSearch && matchesTag;
    });
  });

  /** Latest post as the hero when browsing unfiltered. */
  readonly featuredPost = computed(() => {
    if (this.filtersActive()) return null;
    const posts = this.filteredPosts();
    return posts.length > 0 ? posts[0] : null;
  });

  /** Remaining posts for the grid (excludes featured when present). */
  readonly gridSource = computed(() => {
    const posts = this.filteredPosts();
    if (this.featuredPost()) {
      return posts.slice(1);
    }
    return posts;
  });

  /** Windowed slice actually rendered in the DOM. */
  readonly visiblePosts = computed(() => {
    return this.gridSource().slice(0, this.visibleCount());
  });

  readonly totalGridPosts = computed(() => this.gridSource().length);

  readonly totalArticles = computed(() => this.filteredPosts().length);

  readonly hasMore = computed(() => this.visibleCount() < this.totalGridPosts());

  readonly showingFrom = computed(() => (this.totalGridPosts() === 0 ? 0 : 1));

  readonly showingTo = computed(() => Math.min(this.visibleCount(), this.totalGridPosts()));

  constructor() {
    this.seoService.updateMeta({
      title: 'Engineering Blog',
      description: 'Insights, tutorials, and benchmarks on Java 21 virtual threads, cloud architecture, LLMs, Docker, AWS, and building products from 0 to 1.',
      url: '/blog',
      lang: 'en',
      keywords: [
        'Engineering Blog',
        'Java 21',
        'Virtual Threads',
        'AWS',
        'Docker',
        'LLM',
        'System Design'
      ]
    });
    this.seoService.setBlogIndexJsonLd();
    this.seoService.setBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' }
    ]);

    // Reset the window when language, search, or tag changes
    effect(() => {
      this.languageService.language();
      this.searchQuery();
      this.selectedTag();
      this.visibleCount.set(PAGE_SIZE);
    }, { allowSignalWrites: true });

    // Keep IntersectionObserver attached to the sentinel as the list grows
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        this.hasMore();
        this.visibleCount();
        this.loadMoreSentinel();
        untracked(() => this.scheduleObserve());
      });
    }
  }

  selectTag(tag: string) {
    this.layout.selectTag(tag);
  }

  onSearchChange(query: string) {
    this.layout.onSearchChange(query);
  }

  loadMore(): void {
    if (!this.hasMore()) return;
    this.visibleCount.update((n) => Math.min(n + PAGE_SIZE, this.totalGridPosts()));
  }

  trackBySlug(_index: number, post: ContentFile<BlogAttributes>): string {
    return post.slug || post.filename;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private scheduleObserve(): void {
    afterNextRender(
      () => {
        this.attachObserver();
      },
      { injector: this.injector }
    );
  }

  private ensureObserver(): IntersectionObserver {
    if (this.observer) return this.observer;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && this.hasMore()) {
          this.loadMore();
        }
      },
      {
        root: null,
        rootMargin: '280px 0px',
        threshold: 0,
      }
    );
    return this.observer;
  }

  private attachObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer?.disconnect();
    if (!this.hasMore()) return;

    const el = this.loadMoreSentinel()?.nativeElement;
    if (!el) return;

    this.ensureObserver().observe(el);
  }

  getPostImage(post: ContentFile<BlogAttributes> | null | undefined): string {
    if (!post) return '/assets/images/virtual-piano.jpg';
    if (post.attributes && (post.attributes.previewImage || post.attributes.coverImage)) {
      return post.attributes.previewImage || post.attributes.coverImage || '/assets/images/virtual-piano.jpg';
    }
    const images = [
      '/assets/images/d-robot.jpg',
      '/assets/images/games.jpg',
      '/assets/images/virtual-piano.jpg'
    ];
    let hash = 0;
    const str = post.slug || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % images.length;
    return images[index];
  }
}
