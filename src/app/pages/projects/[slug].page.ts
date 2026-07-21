import { Component, inject, effect, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { getProjectBySlug } from '../../data/projects.data';
import { LanguageService } from '../../services/language/language.service';

/**
 * Legacy /projects/:slug URLs redirect to the matching blog post when one exists,
 * otherwise back to the projects list. Case pages are no longer rendered.
 */
@Component({
  selector: 'app-project-detail-redirect',
  standalone: true,
  template: `<div class="redirect-shell" aria-live="polite">Redirecting…</div>`,
  styles: [
    `
      .redirect-shell {
        min-height: 40vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        padding: 120px 24px 48px;
      }
    `,
  ],
})
export default class ProjectDetailRedirectPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private languageService = inject(LanguageService);

  /** Bound by Analog + withComponentInputBinding */
  slug = input<string>('');

  private routeSlug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') || '')),
    { initialValue: this.route.snapshot.paramMap.get('slug') || '' }
  );

  private redirectEffect = effect(() => {
    const slug = this.slug() || this.routeSlug() || '';
    if (!slug) {
      void this.router.navigateByUrl('/projects');
      return;
    }

    const project = getProjectBySlug(slug);
    if (project?.blogSlug) {
      const lang = this.languageService.language();
      void this.router.navigate(['/blog', lang, project.blogSlug], {
        replaceUrl: true,
      });
      return;
    }

    void this.router.navigateByUrl('/projects', { replaceUrl: true });
  });
}
