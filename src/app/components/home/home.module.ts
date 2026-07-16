import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { AboutComponent } from './about/about.component';
import { HeroComponent } from './hero/hero.component';
import { ContactComponent } from './contact/contact.component';
import { ExperienceComponent } from './experience/experience.component';
import { OtherProjectsComponent } from './other-projects/other-projects.component';
import { ProjectsComponent } from './projects/projects.component';
import { NgbModule, NgbNav, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { GeneralModule } from '../general/general.module';
import { AchievementsComponent } from './achievements/achievements.component';



import { AsArrayPipe } from '../../pipes/as-array.pipe';

@NgModule({
  declarations: [
    HomeComponent,
    HeroComponent,
    AboutComponent,
    ExperienceComponent,
    ProjectsComponent,
    OtherProjectsComponent,
    ContactComponent,
    AchievementsComponent
  ],
  imports: [
    GeneralModule,
    CommonModule,
    NgbNavModule,
    TranslateModule.forChild(),
    AsArrayPipe
  ],
  exports: [
    HomeComponent,
    HeroComponent,
    AboutComponent,
    ExperienceComponent,
    ProjectsComponent,
    OtherProjectsComponent,
    ContactComponent,
    AchievementsComponent,
    AsArrayPipe
  ]
})
export class HomeModule { }
