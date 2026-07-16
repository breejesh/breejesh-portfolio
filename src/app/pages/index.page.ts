import { Component } from '@angular/core';
import { HomeModule } from '../components/home/home.module';
import { GeneralModule } from '../components/general/general.module';

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
export default class IndexPage {}
