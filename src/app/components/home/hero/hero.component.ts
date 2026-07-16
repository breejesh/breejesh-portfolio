import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit {
  yearsOfExperience: number = 8;

  constructor() {}

  ngOnInit(): void {
    const start = new Date('2017-05-01');
    const now = new Date();
    let diff = now.getFullYear() - start.getFullYear();
    const m = now.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
      diff--;
    }
    this.yearsOfExperience = diff;
  }
}
