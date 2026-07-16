import { Component, OnInit, HostListener, inject, Input } from '@angular/core';
import { LanguageService } from '../../../services/language/language.service';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss'],
})
export class ExperienceComponent implements OnInit {
  @Input() hideTitle = false;
  activeJobIndex = 0;
  public languageService = inject(LanguageService);

  constructor() {}

  ngOnInit(): void {}

  getReversedRoles(roles: any[]): any[] {
    if (!roles) return [];
    return [...roles].reverse();
  }

  getJobDuration(job: any): string {
    if (job.Tab === 'Concentric AI') {
      const start = new Date('2025-01-01');
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      months += 1;
      if (months >= 12) {
        years += Math.floor(months / 12);
        months = months % 12;
      }
      
      const lang = this.languageService.language();
      let durationStr = '';
      if (lang === 'es') {
        if (years > 0) durationStr += `${years} año${years > 1 ? 's' : ''} `;
        if (months > 0) durationStr += `${months} mes${months > 1 ? 'es' : ''}`;
      } else if (lang === 'fr') {
        if (years > 0) durationStr += `${years} an${years > 1 ? 's' : ''} `;
        if (months > 0) durationStr += `${months} mois`;
      } else if (lang === 'hi') {
        if (years > 0) durationStr += `${years} वर्ष `;
        if (months > 0) durationStr += `${months} महीने`;
      } else {
        if (years > 0) durationStr += `${years} yr${years > 1 ? 's' : ''} `;
        if (months > 0) durationStr += `${months} mo${months > 1 ? 's' : ''}`;
      }
      return durationStr.trim();
    }
    return job.TotalDuration || '';
  }

  scrollToJob(index: number) {
    this.activeJobIndex = index;
    const el = document.getElementById('job-' + index);
    if (el) {
      const headerOffset = 140;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const jobs = document.querySelectorAll('.timeline-item');
    if (!jobs || jobs.length === 0) return;
    
    let activeIndex = 0;
    let minDistance = Infinity;
    
    jobs.forEach((job, index) => {
      const rect = job.getBoundingClientRect();
      const distance = Math.abs(rect.top - 180);
      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = index;
      }
    });
    
    this.activeJobIndex = activeIndex;
  }
}
