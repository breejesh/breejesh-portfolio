import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralModule } from '../components/general/general.module';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-resume-page',
  standalone: true,
  imports: [CommonModule, GeneralModule, TranslateModule],
  template: `
    <div class="page-wrapper" style="padding-top: 100px; min-height: calc(100vh - 100px); display: flex; flex-direction: column; justify-content: space-between;">
      <section class="resume-section">
        <header class="resume-header">
          <div>
            <h1 class="resume-title">{{ 'Header.cvBtn' | translate }}</h1>
            <p class="resume-subtitle" style="color: var(--text-secondary); margin-top: 6px; font-size: 14px;">
              View or download my professional credentials and experience.
            </p>
          </div>
          <a 
            href="https://docs.google.com/document/d/1B-YwXMlKY1WLx1k1LM1p9Yc375JIcaRawzl87DoHscs/export?format=pdf" 
            target="_blank" 
            class="resume-btn"
          >
            <i class="fas fa-file-pdf"></i> Download PDF
          </a>
        </header>

        <div class="iframe-container">
          <iframe 
            src="https://docs.google.com/document/d/1B-YwXMlKY1WLx1k1LM1p9Yc375JIcaRawzl87DoHscs/preview" 
            class="resume-iframe"
            title="Resume Document"
          ></iframe>
        </div>
      </section>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .resume-section {
      max-width: 900px;
      width: 100%;
      margin: 0 auto;
      padding: 40px 24px;
      box-sizing: border-box;
    }

    .resume-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .resume-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .resume-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 4px;
      background-color: transparent;
      color: var(--accent-color) !important;
      border: 1px solid var(--accent-color);
      font-family: 'SF Mono', monospace;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-decoration: none;
    }

    .resume-btn:hover {
      background-color: var(--accent-opacity);
      outline: none;
    }

    .iframe-container {
      width: 100%;
      height: 1300px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 30px -10px var(--header-shadow);
      background-color: var(--bg-secondary);
      transition: border-color 0.3s;
    }

    .resume-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    @media (max-width: 768px) {
      .resume-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .iframe-container {
        height: 1100px;
      }
    }
  `]
})
export default class ResumePage {}
