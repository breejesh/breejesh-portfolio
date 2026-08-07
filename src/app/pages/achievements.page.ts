import { Component, inject } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from '../services/seo/seo.service';

const PAGE_TITLE = 'Achievements | Breejesh Rathod';
const PAGE_DESCRIPTION =
  'Awards, recognition, and milestones achieved by Breejesh Rathod throughout his software engineering career.';

export const routeMeta: RouteMeta = {
  title: PAGE_TITLE,
  meta: [
    { name: 'description', content: PAGE_DESCRIPTION },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: PAGE_DESCRIPTION },
    { property: 'og:url', content: 'https://breejeshrathod.com/achievements' },
    { name: 'twitter:title', content: PAGE_TITLE },
    { name: 'twitter:description', content: PAGE_DESCRIPTION },
  ],
};

@Component({
  selector: 'app-achievements-page',
  standalone: true,
  imports: [HomeModule, GeneralModule, TranslateModule],
  template: `
    <div class="page-wrapper" style="padding-top: 120px; min-height: calc(100vh - 120px); display: flex; flex-direction: column; justify-content: space-between;">
      <div class="container" style="max-width: 1000px; width: 100%; margin: 0 auto; padding: 0 24px; box-sizing: border-box;">
        <div class="page-header-section">
          <h1 class="page-main-title">{{ 'Achievements.Title' | translate }}</h1>
          <p class="page-subtitle">{{ 'Achievements.Subtitle' | translate }}</p>
        </div>
        <app-achievements [hideTitle]="true"></app-achievements>
      </div>
      <app-footer></app-footer>
    </div>
  `
})
export default class AchievementsPage {
  private seoService = inject(SeoService);

  constructor() {
    this.seoService.updateMeta({
      title: 'Achievements',
      description: PAGE_DESCRIPTION,
      url: '/achievements'
    });
  }
}
