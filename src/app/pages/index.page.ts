import { Component, inject } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';
import { SeoService } from '../services/seo/seo.service';

const HOME_TITLE = 'Breejesh Rathod | Engineering Leader & Software Developer';
const HOME_DESCRIPTION =
  'Engineering leader with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software. Technical writing on Java, AWS, Docker, LLMs, and system design.';

/** Analog RouteMeta: title + meta for prerendered HTML head. */
export const routeMeta: RouteMeta = {
  title: HOME_TITLE,
  meta: [
    { name: 'description', content: HOME_DESCRIPTION },
    { name: 'author', content: 'Breejesh Rathod' },
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    },
    { name: 'keywords', content: 'Breejesh Rathod, Engineering Leader, Java, Virtual Threads, AWS, Docker, LLM, System Design, Tech Blog' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: HOME_TITLE },
    { property: 'og:description', content: HOME_DESCRIPTION },
    { property: 'og:url', content: 'https://breejeshrathod.com/' },
    { property: 'og:image', content: 'https://breejeshrathod.com/assets/images/breejeshrathod-preview.png' },
    { property: 'og:site_name', content: 'Breejesh Rathod' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: HOME_TITLE },
    { name: 'twitter:description', content: HOME_DESCRIPTION },
    { name: 'twitter:image', content: 'https://breejeshrathod.com/assets/images/breejeshrathod-preview.png' },
  ],
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HomeModule, GeneralModule],
  template: `
    <app-hero></app-hero>
    <app-about></app-about>
    <app-contact></app-contact>
    <app-footer></app-footer>
  `
})
export default class IndexPage {
  private seoService = inject(SeoService);

  constructor() {
    // SeoService still owns canonical, hreflang, and JSON-LD (beyond RouteMeta tags).
    this.seoService.updateMeta({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: '/',
      rawTitle: true,
      lang: 'en',
      keywords: [
        'Breejesh Rathod',
        'Engineering Leader',
        'Java',
        'Virtual Threads',
        'AWS',
        'Docker',
        'LLM',
        'System Design',
        'Tech Blog'
      ]
    });
    this.seoService.setPersonJsonLd();
    this.seoService.setWebSiteJsonLd();
  }
}
