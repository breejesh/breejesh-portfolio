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
    <div class="blog-magazine-container">
      <!-- Left Column: Main Content -->
      <div class="blog-main-column">
        <!-- Magazine Header -->
        <div class="blog-magazine-header">
          <h1 class="magazine-title">{{ 'Blog.Title' | translate }}</h1>
          <p class="magazine-subtitle"> {{ filteredPosts().length }} {{ 'Blog.Stats' | translate | lowercase }}</p>
        </div>
 
        <!-- Featured Post (Larger Card) - Only shown when no filters are active -->
        <div 
          *ngIf="filteredPosts().length > 0 && searchQuery() === '' && selectedTag() === ''" 
          class="featured-magazine-card" 
          [routerLink]="'/blog/' + languageService.language() + '/' + filteredPosts()[0].slug" 
          style="cursor: pointer;"
        >
          <div class="featured-img-wrapper">
            <img [src]="getPostImage(filteredPosts()[0])" alt="Cover" class="featured-img" />
          </div>
          <div class="featured-content">
            <div class="post-meta">
              <span class="post-date"><i class="far fa-calendar-alt"></i> {{ filteredPosts()[0].attributes.date | date: 'longDate' }}</span>
            </div>
            <h2 class="featured-title">
              <a [routerLink]="'/blog/' + languageService.language() + '/' + filteredPosts()[0].slug">{{ filteredPosts()[0].attributes.title }}</a>
            </h2>
            <p class="featured-excerpt">{{ filteredPosts()[0].attributes.description }}</p>
            <a [routerLink]="'/blog/' + languageService.language() + '/' + filteredPosts()[0].slug" class="read-more-link">
              {{ 'Blog.Read' | translate }}
            </a>
          </div>
        </div>
 
        <!-- Rest of the Posts (Grid layout) -->
        <div class="posts-grid" *ngIf="filteredPosts().length > 0">
          <article 
            *ngFor="let post of (searchQuery() !== '' || selectedTag() !== '' ? filteredPosts() : filteredPosts().slice(1))" 
            class="blog-card"
            [routerLink]="'/blog/' + languageService.language() + '/' + post.slug"
            style="cursor: pointer;"
          >
            <div class="card-img-wrapper">
              <img [src]="getPostImage(post)" alt="Preview" class="card-img" />
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
              </div>
            </div>
          </article>
        </div>
 
        <!-- Empty State -->
        <div *ngIf="filteredPosts().length === 0" class="no-results">
          <i class="far fa-frown no-results-icon"></i>
          <h3>{{ 'Blog.NoPosts' | translate }}</h3>
          <p>{{ 'Blog.NoPostsDesc' | translate }}</p>
        </div>
      </div>
 
      <!-- Right Column: Sidebar -->
      <aside class="blog-sidebar-column">
        <div class="sidebar-sticky-wrapper">
          <!-- Widget: Search -->
          <div class="sidebar-widget">
            <h4 class="widget-title">Search</h4>
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
          </div>
 
          <!-- Widget: Topics Cloud -->
          <div class="sidebar-widget" *ngIf="allTags().length > 0">
            <h4 class="widget-title">Explore Topics</h4>
            <div class="tags-row">
              <button 
                (click)="selectTag('')" 
                class="tag-pill-btn" 
                [class.active]="selectedTag() === ''">All Topics</button>
              <button 
                *ngFor="let tag of allTags()" 
                (click)="selectTag(tag)" 
                class="tag-pill-btn" 
                [class.active]="selectedTag() === tag">{{ tag }}</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .blog-magazine-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
      width: 100%;
    }

    @media (min-width: 992px) {
      .blog-magazine-container {
        grid-template-columns: 7.6fr 2.4fr;
      }
    }

    .blog-main-column {
      display: flex;
      flex-direction: column;
      gap: 40px;
      min-width: 0;
    }

    .blog-magazine-header {
      border-bottom: 2px double var(--border-color);
      padding-bottom: 20px;
      margin-bottom: 10px;
    }

    .magazine-title {
      font-family: 'Outfit', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .magazine-subtitle {
      font-family: 'SF Mono', monospace;
      font-size: 13px;
      color: var(--accent-color);
      margin: 8px 0 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* Featured Magazine Card */
    .featured-magazine-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
    }

    .featured-magazine-card:hover {
      transform: translateY(-4px);
      border-color: var(--accent-color);
      box-shadow: 0 12px 30px -10px var(--accent-opacity);
    }

    .featured-magazine-card:hover .featured-title a {
      color: var(--accent-color);
    }

    .featured-magazine-card:hover .read-more-link {
      background-color: var(--accent-opacity);
      transform: translateY(-1px);
    }

    .featured-img-wrapper {
      width: 100%;
      height: 250px;
      overflow: hidden;
    }

    .featured-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s;
    }

    .featured-magazine-card:hover .featured-img {
      transform: scale(1.03);
    }

    .featured-content {
      padding: 30px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    @media (min-width: 768px) {
      .featured-magazine-card {
        flex-direction: row;
        min-height: 320px;
      }
      .featured-img-wrapper {
        width: 50%;
        height: auto;
      }
      .featured-content {
        width: 50%;
        padding: 40px;
      }
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

    .featured-excerpt {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 20px;
      font-size: 0.95rem;
    }

    .read-more-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-color) !important;
      border: 1px solid var(--accent-color);
      background-color: transparent;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-family: 'SF Mono', monospace;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
      width: fit-content;
      cursor: pointer;
    }

    .read-more-link:hover {
      background-color: var(--accent-opacity);
      transform: translateY(-1px);
    }

    /* Grid Layout */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
      background-color: var(--accent-opacity);
      transform: translateY(-1px);
    }

    .card-img-wrapper {
      width: 100%;
      height: 160px;
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
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      box-sizing: border-box;
    }

    .card-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 10px 0;
      line-height: 1.4;
    }

    .card-title a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.2s;
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
      flex-grow: 1;
    }

    .card-read-more {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-color) !important;
      border: 1px solid var(--accent-color);
      background-color: transparent;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-family: 'SF Mono', monospace;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
      width: fit-content;
      cursor: pointer;
    }

    .card-footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
      margin-top: auto;
    }

    .tag-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-opacity);
      color: var(--accent-color);
      padding: 8px 8px 4px 8px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 600;
      border: 1px solid var(--border-color);
    }

    /* Sidebar Columns */
    .blog-sidebar-column {
      width: 100%;
    }

    .sidebar-sticky-wrapper {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    @media (min-width: 992px) {
      .sidebar-sticky-wrapper {
        position: sticky;
        top: 100px;
      }
    }

    .sidebar-widget {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
    }

    .widget-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 8px;
    }

    /* Search Wrapper */
    .search-wrapper {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 13px;
    }

    .blog-search-input {
      width: 100%;
      height: 40px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 6px 14px 0 38px;
      border-radius: 30px;
      font-size: 13px;
      line-height: 38px;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .blog-search-input:focus {
      border-color: var(--accent-color);
      outline: none;
      box-shadow: 0 0 0 3px var(--accent-opacity);
    }

    /* Year archive list */
    .archive-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    @media (min-width: 992px) {
      .archive-list {
        flex-direction: column;
        gap: 6px;
      }
    }

    .archive-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      line-height: 1;
      transition: all 0.25s;
      width: fit-content;
      box-sizing: border-box;
    }

    @media (min-width: 992px) {
      .archive-btn {
        display: block;
        width: 100%;
        height: auto;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        text-align: left;
        line-height: 1.5;
      }

      .archive-btn:hover {
        background-color: var(--accent-opacity);
        color: var(--accent-color);
      }

      .archive-btn.active {
        background-color: var(--accent-color) !important;
        color: var(--bg-primary) !important;
        font-weight: 600;
      }
    }

    @media (max-width: 991px) {
      .archive-btn.active {
        background-color: var(--accent-color);
        border-color: var(--accent-color);
        color: var(--bg-primary);
      }
    }

    /* Tags/Topics list */
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag-pill-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 8px 8px 4px 8px;
      border-radius: 20px;
      line-height: 1; 
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s;
      box-sizing: border-box;
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

  getPostImage(post: any): string {
    if (!post) return '/assets/images/virtual-piano.jpg';
    if (post.attributes && (post.attributes.previewImage || post.attributes.coverImage)) {
      return post.attributes.previewImage || post.attributes.coverImage;
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
