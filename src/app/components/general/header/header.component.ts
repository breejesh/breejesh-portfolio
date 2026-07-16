import {
  Component,
  OnInit,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { LanguageService } from '../../../services/language/language.service';
import { ThemeService } from '../../../services/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  responsiveMenuVisible: Boolean = false;
  pageYPosition: number;
  languageFormControl: FormControl = new FormControl();
  cvName: string = '';

  constructor(
    private router: Router,
    public languageService: LanguageService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.languageFormControl.valueChanges.subscribe((val) =>
      this.languageService.changeLanguage(val)
    );

    this.languageFormControl.setValue(this.languageService.language());
  }

  scroll(el) {
    if (el === '/') {
      this.router.navigate(['/']).then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      this.router.navigate([`/${el}`]).then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    this.responsiveMenuVisible = false;
  }

  downloadCV() {
    this.languageService.translateService
      .get('Header.cvName')
      .subscribe((val) => {
        this.cvName = val;
        console.log(val);
        // app url
        let url = window.location.href;

        // Open a new window with the CV
        window.open(url + '/../assets/cv/' + this.cvName, '_blank');
      });
  }

  get activeRouteSection() {
    const url = this.router.url;
    if (url.startsWith('/blog')) return 'blog';
    if (url.startsWith('/experience')) return 'experience';
    if (url.startsWith('/projects')) return 'projects';
    if (url.startsWith('/achievements')) return 'achievements';
    return '/';
  }

  @HostListener('window:scroll', [])
  getScrollPosition() {
    this.pageYPosition = window.pageYOffset;
  }

  changeLanguage(language: string) {
    this.languageFormControl.setValue(language);
  }
}
