import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language/language.service';
import BlogLayoutComponent from '../blog.page';
import { SeoService } from '../../services/seo/seo.service';

@Component({
  selector: 'app-blog-index',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss']
})
export default class BlogIndexPage {
  private layout = inject(BlogLayoutComponent);
  public languageService = inject(LanguageService);
  private seoService = inject(SeoService);

  constructor() {
    this.seoService.updateMeta({
      title: 'Engineering Blog',
      description: 'Insights, tutorials, and experiences in software engineering, cloud architecture, and building products from 0 to 1.',
      url: '/blog'
    });
  }

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
