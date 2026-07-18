import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface SeoConfig {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  article?: {
    datePublished?: string;
    tags?: string[];
    author?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly baseUrl = 'https://breejeshrathod.com';
  private readonly defaultImage = `${this.baseUrl}/assets/images/breejeshrathod-preview.png`;
  private readonly siteName = 'Breejesh Rathod';

  constructor(
    private meta: Meta,
    private titleService: Title,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  updateMeta(config: SeoConfig): void {
    const title = config.title
      ? `${config.title} | Breejesh Rathod`
      : 'Breejesh Rathod | Engineering Leader & Software Developer';
    const description = config.description ||
      'Engineering leader with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software.';
    const url = config.url ? `${this.baseUrl}${config.url}` : this.baseUrl;
    const image = config.image
      ? (config.image.startsWith('http') ? config.image : `${this.baseUrl}${config.image}`)
      : this.defaultImage;
    const type = config.type || 'website';

    // Title
    this.titleService.setTitle(title);

    // Primary Meta
    this.meta.updateTag({ name: 'title', content: title });
    this.meta.updateTag({ name: 'description', content: description });

    // Canonical URL
    this.setCanonicalUrl(url);

    // Open Graph
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    // Article-specific
    if (config.article) {
      this.meta.updateTag({ property: 'og:type', content: 'article' });
      if (config.article.datePublished) {
        this.meta.updateTag({ property: 'article:published_time', content: config.article.datePublished });
      }
      if (config.article.author) {
        this.meta.updateTag({ property: 'article:author', content: config.article.author });
      }
      if (config.article.tags) {
        config.article.tags.forEach(tag => {
          this.meta.updateTag({ property: 'article:tag', content: tag });
        });
      }
    }
  }

  /**
   * Injects JSON-LD structured data into the document head.
   * Works on BOTH server (SSR/SSG) and client to ensure structured data
   * is present in prerendered HTML for search engine crawlers.
   */
  setJsonLd(data: object): void {
    // Remove existing JSON-LD with the same class
    const existing = this.document.querySelector('script[type="application/ld+json"].seo-jsonld');
    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.className = 'seo-jsonld';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  setBlogPostJsonLd(post: { title: string; description: string; date: string; image?: string; url: string; tags?: string[] }): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.description,
      'image': post.image ? (post.image.startsWith('http') ? post.image : `${this.baseUrl}${post.image}`) : this.defaultImage,
      'datePublished': post.date,
      'dateModified': post.date,
      'author': {
        '@type': 'Person',
        'name': 'Breejesh Rathod',
        'url': this.baseUrl
      },
      'publisher': {
        '@type': 'Person',
        'name': 'Breejesh Rathod',
        'url': this.baseUrl
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `${this.baseUrl}${post.url}`
      },
      'keywords': post.tags ? post.tags.join(', ') : undefined
    };

    this.setJsonLd(jsonLd);
  }

  setPersonJsonLd(): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': 'Breejesh Rathod',
      'url': this.baseUrl,
      'image': this.defaultImage,
      'jobTitle': 'Engineering Leader',
      'description': 'Engineering leader with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software.',
      'sameAs': [
        'https://github.com/breejesh',
        'https://www.linkedin.com/in/breejesh/'
      ]
    };

    this.setJsonLd(jsonLd);
  }

  setWebSiteJsonLd(): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Breejesh Rathod',
      'url': this.baseUrl,
      'description': 'Engineering leader with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software. Explore blog posts on Docker, AWS, Serverless, LLMs, and system design.',
      'author': {
        '@type': 'Person',
        'name': 'Breejesh Rathod'
      }
    };

    this.setJsonLd(jsonLd);
  }

  setBreadcrumbJsonLd(items: { name: string; url: string }[]): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`
      }))
    };

    // Breadcrumb gets its own script tag (separate from main JSON-LD)
    const existing = this.document.querySelector('script[type="application/ld+json"].seo-breadcrumb');
    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.className = 'seo-breadcrumb';
    script.text = JSON.stringify(jsonLd);
    this.document.head.appendChild(script);
  }

  private setCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }
}
