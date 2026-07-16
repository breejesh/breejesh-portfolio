import { Component } from '@angular/core';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [HomeModule, GeneralModule],
  template: `
    <div class="page-wrapper" style="padding-top: 100px; min-height: calc(100vh - 100px); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <app-projects></app-projects>
        <app-other-projects></app-other-projects>
      </div>
      <app-footer></app-footer>
    </div>
  `
})
export default class ProjectsPage {}
