import { Component, Input, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { getFeaturedMeta, PortfolioProject } from '../../../data/projects.data';
import { hydrateProjects } from '../../../data/project-i18n';
import { LanguageService } from '../../../services/language/language.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  @Input() hideTitle = false;

  readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly meta = getFeaturedMeta();
  private sub?: Subscription;

  readonly projects = signal<PortfolioProject[]>([]);

  ngOnInit(): void {
    this.refresh();
    this.sub = this.translate.onLangChange.subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  blogLink(project: PortfolioProject): string[] | null {
    if (!project.blogSlug) return null;
    return ['/blog', this.languageService.language(), project.blogSlug];
  }

  private refresh(): void {
    this.projects.set(hydrateProjects(this.meta, this.translate));
  }
}
