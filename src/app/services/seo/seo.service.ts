import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface SeoConfig {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  /** Optional document language (en, es, fr, hi) */
  lang?: string;
  /** When true, use title as-is without appending the site name */
  rawTitle?: boolean;
  robots?: string;
  keywords?: string[];
  article?: {
    datePublished?: string;
    dateModified?: string;
    tags?: string[];
    author?: string;
  };
  alternates?: { hreflang: string; href: string }[];
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
      ? (config.rawTitle || config.title.includes(this.siteName)
          ? config.title
          : `${config.title} | ${this.siteName}`)
      : 'Breejesh Rathod | Engineering Leader & Software Developer';
    const description = config.description ||
      'Engineering leader with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software.';
    const url = config.url ? this.toAbsoluteUrl(config.url) : this.baseUrl;
    const image = config.image
      ? this.toAbsoluteUrl(config.image)
      : this.defaultImage;
    const type = config.type || 'website';

    // Document language for crawlers and accessibility
    if (config.lang) {
      this.document.documentElement.lang = config.lang;
      this.document.documentElement.setAttribute('xml:lang', config.lang);
    }

    // Title
    this.titleService.setTitle(title);

    // Primary Meta
    this.meta.updateTag({ name: 'title', content: title });
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: config.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    });
    this.meta.updateTag({ name: 'author', content: 'Breejesh Rathod' });

    if (config.keywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords.join(', ') });
    }

    // Canonical URL
    this.setCanonicalUrl(url);

    // Hreflang alternates
    this.setHreflangAlternates(config.alternates || []);

    // Open Graph
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: title });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({
      property: 'og:locale',
      content: this.localeFromLang(config.lang || 'en')
    });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: title });
    this.meta.updateTag({ name: 'twitter:creator', content: '@breejesh' });

    // Article-specific
    if (config.article) {
      this.meta.updateTag({ property: 'og:type', content: 'article' });
      if (config.article.datePublished) {
        this.meta.updateTag({
          property: 'article:published_time',
          content: this.toIsoDate(config.article.datePublished)
        });
      }
      if (config.article.dateModified || config.article.datePublished) {
        this.meta.updateTag({
          property: 'article:modified_time',
          content: this.toIsoDate(config.article.dateModified || config.article.datePublished!)
        });
      }
      if (config.article.author) {
        this.meta.updateTag({ property: 'article:author', content: config.article.author });
      }
      if (config.article.tags) {
        // Clear previous article:tag tags by rewriting the first and removing extras is hard;
        // set a joined keywords-style fallback and individual tags.
        config.article.tags.forEach(tag => {
          this.meta.updateTag({ property: 'article:tag', content: tag });
        });
      }
    }
  }

  setHreflangAlternates(alternates: { hreflang: string; href: string }[]): void {
    // Remove existing alternates
    const existing = this.document.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach(el => el.remove());

    // Add new alternates
    alternates.forEach(alt => {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', alt.hreflang);
      link.setAttribute('href', this.toAbsoluteUrl(alt.href));
      this.document.head.appendChild(link);
    });
  }

  /**
   * Injects JSON-LD structured data into the document head.
   * Works on BOTH server (SSR/SSG) and client to ensure structured data
   * is present in prerendered HTML for search engine crawlers.
   */
  setJsonLd(data: object, className = 'seo-jsonld'): void {
    const existing = this.document.querySelector(`script[type="application/ld+json"].${className}`);
    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.className = className;
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  setBlogPostJsonLd(post: {
    title: string;
    description: string;
    date: string;
    dateModified?: string;
    image?: string;
    url: string;
    tags?: string[];
    lang?: string;
  }): void {
    const pageUrl = this.toAbsoluteUrl(post.url);
    const image = post.image ? this.toAbsoluteUrl(post.image) : this.defaultImage;
    const published = this.toIsoDate(post.date);
    const modified = this.toIsoDate(post.dateModified || post.date);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.description,
      'image': [image],
      'datePublished': published,
      'dateModified': modified,
      'inLanguage': post.lang || 'en',
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
        '@id': pageUrl
      },
      'isPartOf': {
        '@type': 'Blog',
        'name': 'Breejesh Rathod Engineering Blog',
        'url': `${this.baseUrl}/blog`
      },
      'keywords': post.tags ? post.tags.join(', ') : undefined
    };

    this.setJsonLd(jsonLd, 'seo-jsonld');
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

    this.setJsonLd(jsonLd, 'seo-person-jsonld');
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
      },
      'inLanguage': ['en', 'es', 'fr', 'hi']
    };

    this.setJsonLd(jsonLd, 'seo-website-jsonld');
  }

  setBlogIndexJsonLd(): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'name': 'Breejesh Rathod Engineering Blog',
      'url': `${this.baseUrl}/blog`,
      'description': 'Insights, tutorials, and benchmarks on Java, cloud architecture, LLMs, and building products from 0 to 1.',
      'author': {
        '@type': 'Person',
        'name': 'Breejesh Rathod',
        'url': this.baseUrl
      },
      'inLanguage': ['en', 'es', 'fr', 'hi']
    };
    this.setJsonLd(jsonLd, 'seo-blog-jsonld');
  }

  setBreadcrumbJsonLd(items: { name: string; url: string }[]): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': this.toAbsoluteUrl(item.url)
      }))
    };

    this.setJsonLd(jsonLd, 'seo-breadcrumb');
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

  private toAbsoluteUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    if (!pathOrUrl.startsWith('/')) {
      return `${this.baseUrl}/${pathOrUrl}`;
    }
    return `${this.baseUrl}${pathOrUrl}`;
  }

  private toIsoDate(value: string): string {
    // Accept YYYY-MM-DD or full ISO; normalize to ISO-8601 date time UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T00:00:00.000Z`;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return value;
  }

  private localeFromLang(lang: string): string {
    switch (lang) {
      case 'es': return 'es_ES';
      case 'fr': return 'fr_FR';
      case 'hi': return 'hi_IN';
      default: return 'en_US';
    }
  }
}
