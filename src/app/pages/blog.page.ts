import { Component, signal, computed, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { injectContentFiles } from '@analogjs/content';
import { ThemeService } from '../services/theme/theme.service';
import { LanguageService } from '../services/language/language.service';
import { GeneralModule } from '../components/general/general.module';

export interface BlogAttributes {
  title: string;
  description: string;
  date: string;
  tags: string[];
  coverImage?: string;
  previewImage?: string;
}

@Component({
  selector: 'app-blog-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GeneralModule],
  template: `
    <div class="blog-layout-wrapper">
      <div class="blog-layout-container">
        <main class="blog-main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: background-color 0.3s, color 0.3s;
    }

    .blog-layout-wrapper {
      padding-top: 80px; /* Spacer for fixed unified header */
      min-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .blog-layout-container {
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      padding: 40px 24px;
      box-sizing: border-box;
      flex-grow: 1;
    }

    .blog-main-content {
      width: 100%;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .blog-layout-container {
        padding: 20px 16px;
      }
    }
  `]
})
export default class BlogLayoutComponent {
  searchQuery = signal('');
  selectedTag = signal('');

  private router = inject(Router);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);

  readonly allPosts = injectContentFiles<BlogAttributes>((file) =>
    file.filename.includes('/src/content/blog/')
  ).sort((a, b) => {
    const dateA = new Date(a.attributes.date).getTime();
    const dateB = new Date(b.attributes.date).getTime();
    return dateB - dateA;
  });

  constructor() {
    console.log('ALL POSTS FILENAMES:', JSON.stringify(this.allPosts.map(p => p.filename)));
    console.log('ALL POSTS SLUGS:', JSON.stringify(this.allPosts.map(p => p.slug)));
  }

  readonly allTags = computed(() => {
    const lang = this.languageService.language();
    const tagsSet = new Set<string>();
    this.allPosts.forEach((post) => {
      if (post.filename.includes('/blog/' + lang + '/') && post.attributes.tags) {
        post.attributes.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  });

  selectTag(tag: string) {
    this.selectedTag.set(tag);
    if (this.router.url !== '/blog') {
      this.router.navigate(['/blog']);
    }
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    if (this.router.url !== '/blog') {
      this.router.navigate(['/blog']);
    }
  }
}
