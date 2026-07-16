import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { GeneralModule } from './components/general/general.module';
import * as AOS from 'aos';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from "./services/language/language.service";
import { ThemeService } from './services/theme/theme.service';
import { Location } from '@angular/common';
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
    private titleService: Title,
    private metaService: Meta,
    private translateService: TranslateService,
    private location: Location,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.languageService.initLanguage();

    this.titleService.setTitle("Breejesh Rathod | Software Developer");

    this.metaService.addTags([
      { name: 'keywords', content: 'Frontend, software, developer' },
      { name: 'description', content: '' },
    ]);

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
