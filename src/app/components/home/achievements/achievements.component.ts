import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  })
export class AchievementsComponent implements OnInit, AfterViewInit {

  public state: boolean = false;
  constructor() { }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
        this.state=true;
    }, 1);
  }

}
