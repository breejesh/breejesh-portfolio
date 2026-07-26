import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  language = signal<"es" | "en" | "hi" | "fr">("en");

  constructor(
    public translateService: TranslateService,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  initLanguage(){
    this.translateService.addLangs(["en", "es", "hi", "fr"])
    let language: "es" | "en" | "hi" | "fr" = "en";

    // Prefer language from the URL for deep links like /blog/en/...
    // so direct opens do not get rewritten by the browser locale.
    const path = this.location.path() || '';
    const blogMatch = path.match(/^\/blog\/(en|es|hi|fr)(?:\/|$)/);
    if (blogMatch) {
      language = blogMatch[1] as "es" | "en" | "hi" | "fr";
    } else if (isPlatformBrowser(this.platformId)) {
      let navLang = navigator.language || (navigator as any).userLanguage;
      if (navLang.split("-").includes("es")) language = "es";
      else if (navLang.split("-").includes("hi")) language = "hi";
      else if (navLang.split("-").includes("fr")) language = "fr";
      else language = "en";
    }
    
    this.translateService.setDefaultLang(language)
    this.translateService.use(language)
    this.language.set(language)
  }

  changeLanguage(language: "es" | "en" | "hi" | "fr"){
    this.translateService.use(language)
    this.language.set(language)
  }
}
