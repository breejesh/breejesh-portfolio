import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFileRouter, requestContextInterceptor, withDebugRoutes } from '@analogjs/router';
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { withPrismHighlighter } from '@analogjs/content/prism-highlighter';
import {
  withComponentInputBinding,
  withInMemoryScrolling,
  type RouterFeatures,
} from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

/**
 * Analog provideFileRouter features:
 * - withComponentInputBinding: bind route params as inputs (docs)
 * - withInMemoryScrolling: restore scroll / honor #anchors on navigation
 * - withDebugRoutes: /__analog/routes table in development only
 */
const fileRouterFeatures: RouterFeatures[] = [
  withComponentInputBinding(),
  withInMemoryScrolling({
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled',
  }),
  ...(environment.production ? [] : [withDebugRoutes()]),
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([requestContextInterceptor])),
    provideClientHydration(),
    provideAnimations(),
    provideFileRouter(...fileRouterFeatures),
    provideContent(
      withMarkdownRenderer(),
      withPrismHighlighter()
    ),
    importProvidersFrom(
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ],
};
