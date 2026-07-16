import { Component } from '@angular/core';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';

@Component({
  selector: 'app-achievements-page',
  standalone: true,
  imports: [HomeModule, GeneralModule],
  template: `
    <div class="page-wrapper" style="padding-top: 100px; min-height: calc(100vh - 100px); display: flex; flex-direction: column; justify-content: space-between;">
      <app-achievements></app-achievements>
      <app-footer></app-footer>
    </div>
  `
})
export default class AchievementsPage {}
