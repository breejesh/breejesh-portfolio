/**
 * Structural project metadata only.
 * User-facing copy (title, tagline, description, technologies, etc.)
 * lives in i18n under PortfolioProjects.{slug}.* so en/es/fr/hi stay in sync.
 */
export interface ProjectMeta {
  slug: string;
  image: string;
  /** Centered on image hover overlay */
  logo?: string;
  ghLink?: string;
  demoLink?: string;
  /**
   * Blog post slug under src/content/blog/{lang}/ (no extension).
   * Featured "Read more" links go to /blog/{lang}/{blogSlug} when set.
   */
  blogSlug?: string;
  featured: boolean;
  /** Older showcase work; shown below featured */
  archive?: boolean;
}

/** Merged view model used by templates (meta + translated fields). */
export interface PortfolioProject extends ProjectMeta {
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  body: string[];
  highlights: string[];
}

export const PORTFOLIO_PROJECTS: ProjectMeta[] = [
  {
    slug: 'nom-ai',
    image: '/assets/images/nom-ai-showcase.webp',
    logo: '/assets/images/nom-ai-logo.svg',
    ghLink: 'https://github.com/breejesh/nom.ai',
    blogSlug: 'nom-ai-showcase',
    featured: true,
  },
  {
    slug: 'innodino',
    image: '/assets/images/innodino-showcase.webp',
    logo: '/assets/images/innodino-logo.svg',
    ghLink: 'https://github.com/breejesh/innodino',
    demoLink: 'https://breejesh.github.io/innodino/',
    featured: true,
  },
  {
    slug: 'zunify',
    image: '/assets/images/zunify-music.webp',
    logo: '/assets/images/zunify-logo.svg',
    ghLink: 'https://github.com/breejesh/zunify',
    demoLink: 'https://zunify.breejeshrathod.com/',
    blogSlug: 'zunify-music-player',
    featured: true,
  },
  {
    slug: 'vanguard-health',
    image: '/assets/images/vanguard-health.webp',
    logo: '/assets/images/vanguard-logo.svg',
    ghLink: 'https://github.com/breejesh/vanguard-health',
    demoLink: 'https://vanguard-health.web.app/',
    featured: true,
  },
  {
    slug: 'dijkstra-robot',
    image: '/assets/images/d-robot.jpg',
    featured: false,
    archive: true,
  },
  {
    slug: 'virtual-piano',
    image: '/assets/images/virtual-piano.jpg',
    featured: false,
    archive: true,
  },
  {
    slug: 'game-development',
    image: '/assets/images/games.jpg',
    featured: false,
    archive: true,
  },
  {
    slug: 'digital-watermark',
    image: '/assets/images/gemma-android.webp',
    ghLink: 'https://github.com/breejesh/digital-watermark',
    featured: false,
  },
  {
    slug: 'multi-stage-docker',
    image: '/assets/images/docker-optimization.webp',
    ghLink: 'https://github.com/breejesh/multi-stage-docker-benchmarking',
    featured: false,
  },
  {
    slug: 'java-virtual-threads',
    image: '/assets/images/java-virtual-threads.webp',
    ghLink: 'https://github.com/breejesh/java-virtual-threads-benchmarking',
    featured: false,
  },
  {
    slug: 'smart-posture',
    image: '/assets/images/gemma-android.webp',
    ghLink: 'https://github.com/breejesh/SmartPosture',
    featured: false,
  },
  {
    slug: 'rippleboards',
    image: '/assets/images/serverless-database.webp',
    ghLink: 'https://github.com/breejesh/rippleboards',
    featured: false,
  },
  {
    slug: 'clipper-co',
    image: '/assets/images/d-robot.jpg',
    ghLink: 'https://github.com/breejesh/clipper-co',
    featured: false,
  },
  {
    slug: 'happyness',
    image: '/assets/images/games.jpg',
    ghLink: 'https://github.com/breejesh/happyness',
    featured: false,
  },
  {
    slug: 'consistent-hashing',
    image: '/assets/images/virtual-piano.jpg',
    ghLink: 'https://github.com/breejesh/consistent-hashing-visualization',
    featured: false,
  },
];

export function getFeaturedMeta(): ProjectMeta[] {
  return PORTFOLIO_PROJECTS.filter((p) => p.featured);
}

export function getArchiveMeta(): ProjectMeta[] {
  return PORTFOLIO_PROJECTS.filter((p) => p.archive);
}

export function getOtherMeta(): ProjectMeta[] {
  return PORTFOLIO_PROJECTS.filter((p) => !p.featured && !p.archive);
}

export function getProjectMetaBySlug(slug: string): ProjectMeta | undefined {
  return PORTFOLIO_PROJECTS.find((p) => p.slug === slug);
}

/** @deprecated use getProjectMetaBySlug; kept for redirect page */
export function getProjectBySlug(slug: string): ProjectMeta | undefined {
  return getProjectMetaBySlug(slug);
}
