import { Component, inject } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from '../services/seo/seo.service';

const PAGE_TITLE = 'Experience | Breejesh Rathod';
const PAGE_DESCRIPTION =
  'Professional experience of Breejesh Rathod, engineering leader across fintech, cybersecurity, and enterprise software.';

export const routeMeta: RouteMeta = {
  title: PAGE_TITLE,
  meta: [
    { name: 'description', content: PAGE_DESCRIPTION },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: PAGE_DESCRIPTION },
    { property: 'og:url', content: 'https://breejeshrathod.com/experience' },
    { name: 'twitter:title', content: PAGE_TITLE },
    { name: 'twitter:description', content: PAGE_DESCRIPTION },
  ],
};

@Component({
  selector: 'app-experience-page',
  standalone: true,
  imports: [HomeModule, GeneralModule, TranslateModule],
  template: `
    <div class="page-wrapper" style="padding-top: 120px; min-height: calc(100vh - 120px); display: flex; flex-direction: column; justify-content: space-between;">
      <div class="container" style="max-width: 1200px; width: 100%; margin: 0 auto; padding: 0 24px; box-sizing: border-box;">
        <div class="page-header-section">
          <h1 class="page-main-title">{{ 'Experience.Title' | translate }}</h1>
          <p class="page-subtitle">{{ 'Experience.Subtitle' | translate }}</p>
        </div>
        <app-experience [hideTitle]="true"></app-experience>
      </div>
      <app-footer></app-footer>
    </div>
  `
})
export default class ExperiencePage {
  private seoService = inject(SeoService);

  constructor() {
    this.seoService.updateMeta({
      title: 'Experience',
      description: PAGE_DESCRIPTION,
      url: '/experience'
    });
  }
}
