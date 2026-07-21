import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { getArchiveMeta, PortfolioProject } from '../../../data/projects.data';
import { hydrateProjects } from '../../../data/project-i18n';

@Component({
  selector: 'app-archive-projects',
  templateUrl: './archive-projects.component.html',
  styleUrls: ['./archive-projects.component.scss'],
})
export class ArchiveProjectsComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly meta = getArchiveMeta();
  private sub?: Subscription;

  readonly projects = signal<PortfolioProject[]>([]);

  ngOnInit(): void {
    this.refresh();
    this.sub = this.translate.onLangChange.subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refresh(): void {
    this.projects.set(hydrateProjects(this.meta, this.translate));
  }
}
