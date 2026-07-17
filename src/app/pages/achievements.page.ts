import { Component, inject } from '@angular/core';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from '../services/seo/seo.service';

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
      description: 'Awards, recognition, and milestones achieved by Breejesh Rathod throughout his software engineering career.',
      url: '/achievements'
    });
  }
}
