import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { appConfig } from './app.config';

// During SSR, read translation files directly from disk.
// This avoids making HTTP requests back to the server (which would deadlock).
export class FsTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    try {
      const filePath = join(process.cwd(), 'public', 'assets', 'i18n', `${lang}.json`);
      const content = readFileSync(filePath, 'utf-8');
      return of(JSON.parse(content));
    } catch {
      return of({});
    }
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: TranslateLoader, useClass: FsTranslateLoader },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
