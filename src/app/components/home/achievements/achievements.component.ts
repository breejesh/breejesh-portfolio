import { Component, OnInit, AfterViewInit, Input } from '@angular/core';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  })
export class AchievementsComponent implements OnInit, AfterViewInit {
  @Input() hideTitle = false;

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
