import { TranslateService } from '@ngx-translate/core';
import { PortfolioProject, ProjectMeta } from './projects.data';

interface ProjectI18nBlock {
  Title?: string;
  Tagline?: string;
  Description?: string;
  Technologies?: string[];
  Highlights?: string[];
  Body?: string[];
}

export function hydrateProject(
  meta: ProjectMeta,
  translate: TranslateService
): PortfolioProject {
  const block = translate.instant(`PortfolioProjects.${meta.slug}`) as
    | ProjectI18nBlock
    | string;

  const t: ProjectI18nBlock =
    block && typeof block === 'object' ? block : {};

  return {
    ...meta,
    title: t.Title ?? meta.slug,
    tagline: t.Tagline ?? '',
    description: t.Description ?? '',
    technologies: Array.isArray(t.Technologies) ? t.Technologies : [],
    highlights: Array.isArray(t.Highlights) ? t.Highlights : [],
    body: Array.isArray(t.Body) ? t.Body : [],
  };
}

export function hydrateProjects(
  metas: ProjectMeta[],
  translate: TranslateService
): PortfolioProject[] {
  return metas.map((m) => hydrateProject(m, translate));
}
