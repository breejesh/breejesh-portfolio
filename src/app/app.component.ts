import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { GeneralModule } from './components/general/general.module';
import * as AOS from 'aos';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from "./services/language/language.service";
import { ThemeService } from './services/theme/theme.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GeneralModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'breejeshrathod-portfolio';
  isBlog: boolean = false;

  constructor(
    private translateService: TranslateService,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.languageService.initLanguage();

    // Per-page SEO is handled by individual page components via SeoService.
    // Do NOT set generic title/description here as it overrides page-specific SEO.

    if (isPlatformBrowser(this.platformId)) {
      AOS.init();
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isBlog = event.urlAfterRedirects.startsWith('/blog');
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          AOS.refresh();
        }, 150);
      }
    });
  }
}
