import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { injectContentFiles } from '@analogjs/content';
import type { MetaTag, RouteMeta } from '@analogjs/router';

export interface BlogPostAttributes {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  coverImage?: string;
  previewImage?: string;
  draft?: boolean | string;
  slug?: string;
}

const SITE = 'https://breejeshrathod.com';
const SITE_NAME = 'Breejesh Rathod';

function parseLangAndSlug(raw: string): { lang: string; postSlug: string } {
  const clean = raw.replace(/^\/+/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts.length >= 2 && ['en', 'es', 'fr', 'hi'].includes(parts[0])) {
    return { lang: parts[0], postSlug: parts.slice(1).join('/') };
  }
  return { lang: 'en', postSlug: clean };
}

/** Catch-all param from /blog/{lang}/{slug} (Analog [...slug] → **). */
function rawSlugFromRoute(route: ActivatedRouteSnapshot): string {
  const param = route.paramMap.get('slug');
  if (param) {
    return param.replace(/,/g, '/');
  }
  const segments = route.url.map((s) => s.path).filter(Boolean);
  if (segments.length) {
    return segments.join('/');
  }
  // Walk parents under /blog
  const fromTree = route.pathFromRoot
    .flatMap((r) => r.url.map((s) => s.path))
    .filter(Boolean);
  const parts = fromTree[0] === 'blog' ? fromTree.slice(1) : fromTree;
  return parts.join('/');
}

function findPostAttributes(
  route: ActivatedRouteSnapshot
): { lang: string; postSlug: string; attributes: BlogPostAttributes } | null {
  const raw = rawSlugFromRoute(route);
  if (!raw) return null;
  const { lang, postSlug } = parseLangAndSlug(raw);
  const files = injectContentFiles<BlogPostAttributes>((file) =>
    file.filename.includes(`/src/content/blog/${lang}/`)
  );
  const match = files.find((f) => {
    const base = f.slug || f.filename.replace(/\.md$/, '').split('/').pop() || '';
    return base === postSlug || f.filename.endsWith(`/${postSlug}.md`);
  });
  if (!match) return null;
  return { lang, postSlug, attributes: match.attributes || {} };
}

export const postTitleResolver: ResolveFn<string> = (route) => {
  const found = findPostAttributes(route);
  if (!found?.attributes?.title) {
    return `Blog | ${SITE_NAME}`;
  }
  return `${found.attributes.title} | ${SITE_NAME}`;
};

export const postMetaResolver: ResolveFn<MetaTag[]> = (route) => {
  const found = findPostAttributes(route);
  if (!found?.attributes?.title) {
    return [
      {
        name: 'description',
        content: 'Engineering blog by Breejesh Rathod.',
      },
      { name: 'robots', content: 'noindex, follow' },
    ];
  }

  const { lang, postSlug, attributes } = found;
  const title = attributes.title || '';
  const description = attributes.description || '';
  const image = attributes.coverImage || attributes.previewImage || '';
  const absImage = image
    ? image.startsWith('http')
      ? image
      : `${SITE}${image.startsWith('/') ? '' : '/'}${image}`
    : `${SITE}/assets/images/breejeshrathod-preview.png`;
  const url = `${SITE}/blog/${lang}/${postSlug}`;
  const tags = Array.isArray(attributes.tags) ? attributes.tags.join(', ') : '';

  const meta: MetaTag[] = [
    { name: 'description', content: description },
    { name: 'author', content: SITE_NAME },
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: absImage },
    { property: 'og:site_name', content: SITE_NAME },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: absImage },
  ];

  if (tags) {
    meta.push({ name: 'keywords', content: tags });
  }
  if (attributes.date) {
    meta.push({ property: 'article:published_time', content: String(attributes.date) });
  }

  return meta;
};

/** Analog RouteMeta for blog posts (title + meta resolvers). */
export const blogPostRouteMeta: RouteMeta = {
  title: postTitleResolver,
  meta: postMetaResolver,
};
