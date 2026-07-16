import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language/language.service';
import BlogLayoutComponent from '../blog.page';

@Component({
  selector: 'app-blog-index',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="blog-main-section">
      <!-- Title & Filters Section -->
      <div class="blog-header-section">
        <span class="blog-pre-title">{{ 'Blog.Pretitle' | translate }}</span>
        <h1 class="blog-main-title">{{ 'Blog.Title' | translate }}</h1>
        <p class="blog-stats">{{ allPosts.length }} {{ 'Blog.Stats' | translate | lowercase }}</p>
        
        <div class="blog-controls">
          <!-- Search input -->
          <div class="search-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              placeholder="{{ 'Blog.SearchPlaceholder' | translate }}"
              class="blog-search-input"
            />
          </div>

          <!-- Tags Cloud -->
          <div class="tags-row">
            <button 
              (click)="selectTag('')" 
              class="tag-pill-btn" 
              [class.active]="selectedTag() === ''">
              {{ 'Blog.AllPosts' | translate }}
            </button>
            <button 
              *ngFor="let tag of allTags()" 
              (click)="selectTag(tag)" 
              class="tag-pill-btn" 
              [class.active]="selectedTag() === tag">
              {{ tag }}
            </button>
          </div>
        </div>
      </div>

      <!-- Featured Post (Larger Card) -->
      <div *ngIf="filteredPosts().length > 0 && searchQuery() === '' && selectedTag() === ''" class="featured-card" [routerLink]="'/blog/' + languageService.language() + '/' + filteredPosts()[0].slug" style="cursor: pointer;">
        <div class="featured-img-wrapper" *ngIf="filteredPosts()[0].attributes.coverImage">
          <img [src]="filteredPosts()[0].attributes.coverImage" alt="Cover" class="featured-img" />
        </div>
        <div class="featured-content">
          <div class="post-meta">
            <span class="post-date"><i class="far fa-calendar-alt"></i> {{ filteredPosts()[0].attributes.date | date: 'longDate' }}</span>
            <span class="meta-divider" *ngIf="filteredPosts()[0].attributes.tags && filteredPosts()[0].attributes.tags.length > 0">|</span>
            <div class="tag-badges" *ngIf="filteredPosts()[0].attributes.tags && filteredPosts()[0].attributes.tags.length > 0">
              <span *ngFor="let tag of filteredPosts()[0].attributes.tags" class="badge tag-badge">{{ tag }}</span>
            </div>
          </div>
          <h2 class="featured-title">
            <a [routerLink]="'/blog/' + languageService.language() + '/' + filteredPosts()[0].slug">{{ filteredPosts()[0].attributes.title }}</a>
          </h2>
          <p class="featured-excerpt">{{ filteredPosts()[0].attributes.description }}</p>
          <a [routerLink]="'/blog/' + languageService.language() + '/' + filteredPosts()[0].slug" class="read-more-link">
            {{ 'Blog.ReadArticle' | translate }} &rarr;
          </a>
        </div>
      </div>

      <!-- Rest of the Posts (Grid layout) -->
      <div class="posts-grid" *ngIf="filteredPosts().length > 0">
        <!-- Display all when searching or filtering; otherwise display from index 1 (since index 0 is featured) -->
        <article 
          *ngFor="let post of (searchQuery() !== '' || selectedTag() !== '' ? filteredPosts() : filteredPosts().slice(1))" 
          class="blog-card"
          [routerLink]="'/blog/' + languageService.language() + '/' + post.slug"
          style="cursor: pointer;"
        >
          <div class="card-img-wrapper" *ngIf="post.attributes.previewImage || post.attributes.coverImage">
            <img [src]="post.attributes.previewImage || post.attributes.coverImage" alt="Preview" class="card-img" />
          </div>
          <div class="card-body">
            <div class="post-meta">
              <span class="post-date"><i class="far fa-calendar-alt"></i> {{ post.attributes.date | date: 'mediumDate' }}</span>
            </div>
            <h3 class="card-title">
              <a [routerLink]="'/blog/' + languageService.language() + '/' + post.slug">{{ post.attributes.title }}</a>
            </h3>
            <p class="card-excerpt">{{ post.attributes.description }}</p>
            <div class="card-footer-meta">
              <div class="tag-badges" *ngIf="post.attributes.tags && post.attributes.tags.length > 0">
                <span *ngFor="let tag of post.attributes.tags" class="badge tag-badge">{{ tag }}</span>
              </div>
              <a [routerLink]="'/blog/' + languageService.language() + '/' + post.slug" class="card-read-more">{{ 'Blog.ReadArticle' | translate }} &rarr;</a>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredPosts().length === 0" class="no-results">
        <i class="far fa-frown no-results-icon"></i>
        <h3>{{ 'Blog.NoPosts' | translate }}</h3>
        <p>{{ 'Blog.NoPostsDesc' | translate }} "{{ searchQuery() }}"</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .blog-main-section {
      display: flex;
      flex-direction: column;
      gap: 40px;
      min-width: 0;
    }

    /* Header Section styling */
    .blog-header-section {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 30px;
    }

    .blog-pre-title {
      font-family: 'SF Mono', monospace;
      font-size: 14px;
      color: var(--accent-color);
      font-weight: normal;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
      display: block;
      text-align: center;
    }

    .blog-main-title {
      font-size: 40px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 auto 8px;
      line-height: 1.2;
      text-align: center;
    }

    .blog-stats {
      font-size: 14px;
      color: var(--text-secondary);
      font-family: 'SF Mono', monospace;
      margin-bottom: 32px;
      text-align: center;
    }

    .blog-controls {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .search-wrapper {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 14px;
    }

    .blog-search-input {
      width: 100%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 12px 16px 12px 46px;
      border-radius: 30px;
      font-size: 14px;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .blog-search-input:focus {
      border-color: var(--accent-color);
      outline: none;
      box-shadow: 0 0 0 3px var(--accent-opacity);
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .tag-pill-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s;
    }

    .tag-pill-btn:hover {
      border-color: var(--accent-color);
      color: var(--accent-color);
    }

    .tag-pill-btn.active {
      background-color: var(--accent-color);
      border-color: var(--accent-color);
      color: var(--bg-primary) !important;
      font-weight: 600;
    }

    /* Featured Post Card */
    .featured-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      transition: all 0.3s;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
    }

    @media (max-width: 768px) {
      .featured-card {
        grid-template-columns: 1fr;
      }
    }

    .featured-card:hover {
      transform: translateY(-4px);
      border-color: var(--accent-color);
      box-shadow: 0 12px 30px -10px var(--accent-opacity);
    }

    .featured-card:hover .featured-title a {
      color: var(--accent-color);
    }

    .featured-card:hover .read-more-link {
      color: var(--accent-color-hover);
    }

    .featured-img-wrapper {
      width: 100%;
      height: 100%;
      min-height: 280px;
      overflow: hidden;
    }

    .featured-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s;
    }

    .featured-card:hover .featured-img {
      transform: scale(1.03);
    }

    .featured-content {
      padding: 30px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .post-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-bottom: 12px;
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

    .featured-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 10px 0 12px;
      line-height: 1.3;
    }

    .featured-title a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .featured-title a:hover {
      color: var(--accent-color);
    }

    .featured-excerpt {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 20px;
      font-size: 0.95rem;
    }

    .read-more-link {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: color 0.2s;
      width: fit-content;
    }

    .read-more-link:hover {
      color: var(--accent-color-hover);
    }

    /* Grid layout */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    .blog-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      transition: all 0.3s;
    }

    .blog-card:hover {
      transform: translateY(-4px);
      border-color: var(--accent-color);
      box-shadow: 0 12px 25px -10px var(--accent-opacity);
    }

    .blog-card:hover .card-title a {
      color: var(--accent-color);
    }

    .blog-card:hover .card-read-more {
      color: var(--accent-color-hover);
    }

    .card-img-wrapper {
      width: 100%;
      height: 200px;
      overflow: hidden;
      border-bottom: 1px solid var(--border-color);
    }

    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s;
    }

    .blog-card:hover .card-img {
      transform: scale(1.03);
    }

    .card-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-grow: 1;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 10px 0;
      line-height: 1.4;
    }

    .card-title a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .card-title a:hover {
      color: var(--accent-color);
    }

    .card-excerpt {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }

    .card-read-more {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.85rem;
      transition: color 0.2s;
    }

    .card-read-more:hover {
      color: var(--accent-color-hover);
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);
    }

    .no-results-icon {
      font-size: 3rem;
      color: var(--border-color);
      margin-bottom: 16px;
    }

    .no-results h3 {
      color: var(--text-primary);
      margin-bottom: 8px;
    }
  `]
})
export default class BlogIndexPage {
  private layout = inject(BlogLayoutComponent);
  public languageService = inject(LanguageService);

  readonly searchQuery = this.layout.searchQuery;
  readonly selectedTag = this.layout.selectedTag;
  readonly allPosts = this.layout.allPosts;
  readonly allTags = this.layout.allTags;

  selectTag(tag: string) {
    this.layout.selectTag(tag);
  }

  onSearchChange(query: string) {
    this.layout.onSearchChange(query);
  }

  readonly filteredPosts = computed(() => {
    const lang = this.languageService.language();
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();
    
    return this.allPosts.filter((post) => {
      const matchesLang = post.filename.includes('/blog/' + lang + '/');

      if (!matchesLang) return false;

      const matchesSearch = !query || post.attributes.title.toLowerCase().includes(query) || post.attributes.description.toLowerCase().includes(query);
      const matchesTag = !tag || (post.attributes.tags && post.attributes.tags.includes(tag));
      return matchesSearch && matchesTag;
    });
  });
}
