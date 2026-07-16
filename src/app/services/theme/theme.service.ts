import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkTheme = signal(true);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light') {
        this.isDarkTheme.set(false);
      } else if (storedTheme === 'dark') {
        this.isDarkTheme.set(true);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkTheme.set(prefersDark);
      }
      this.updateBodyClass();
    }
  }

  toggleTheme() {
    this.isDarkTheme.set(!this.isDarkTheme());
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDarkTheme() ? 'dark' : 'light');
    }
    this.updateBodyClass();
  }

  private updateBodyClass() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isDarkTheme()) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
      }
    }
  }
}
