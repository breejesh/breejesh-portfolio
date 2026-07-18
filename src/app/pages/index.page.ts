import { Component, inject } from '@angular/core';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';
import { SeoService } from '../services/seo/seo.service';

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
    this.seoService.updateMeta({
      title: 'Breejesh Rathod | Engineering Leader & Software Developer',
      description: 'Engineering leader with experience taking products from 0→1 and scaling them 1→100 across fintech, cybersecurity, and enterprise software.',
      url: '/'
    });
    this.seoService.setPersonJsonLd();
    this.seoService.setWebSiteJsonLd();
  }
}
