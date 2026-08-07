import { Component, inject } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { HomeModule } from '../../components/home/home.module';
import { GeneralModule } from '../../components/general/general.module';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from '../../services/seo/seo.service';

const PAGE_TITLE = 'Projects | Breejesh Rathod';
const PAGE_DESCRIPTION =
  'Selected work by Breejesh Rathod: NomAI, InnoDino, Zunify, Vanguard Health, and more open-source projects with case pages and GitHub links.';

export const routeMeta: RouteMeta = {
  title: PAGE_TITLE,
  meta: [
    { name: 'description', content: PAGE_DESCRIPTION },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: PAGE_DESCRIPTION },
    { property: 'og:url', content: 'https://breejeshrathod.com/projects' },
    { name: 'twitter:title', content: PAGE_TITLE },
    { name: 'twitter:description', content: PAGE_DESCRIPTION },
  ],
};

@Component({
  selector: 'app-projects-index',
  standalone: true,
  imports: [HomeModule, GeneralModule, TranslateModule],
  template: `
    <div class="page-wrapper" style="padding-top: 120px; min-height: calc(100vh - 120px); display: flex; flex-direction: column; justify-content: space-between;">
      <div class="container" style="max-width: 1000px; width: 100%; margin: 0 auto; padding: 0 24px; box-sizing: border-box;">
        <div class="page-header-section">
          <h1 class="page-main-title">{{ 'FeatureProjects.Title' | translate }}</h1>
          <p class="page-subtitle">{{ 'FeatureProjects.Subtitle' | translate }}</p>
        </div>
        <app-projects [hideTitle]="true"></app-projects>
        <app-other-projects></app-other-projects>
        <app-archive-projects></app-archive-projects>
      </div>
      <app-footer></app-footer>
    </div>
  `,
})
export default class ProjectsIndexPage {
  private seoService = inject(SeoService);

  constructor() {
    this.seoService.updateMeta({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: '/projects',
    });
  }
}
