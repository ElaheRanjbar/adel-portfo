import { ResumeDownload } from '../../core/resume-download';
import { Component, inject } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-home-experience',
  imports: [ResumeDownload, Icon],
  templateUrl: './home-experience.html',
  styleUrl: './home-experience.css',
})
export class HomeExperience {
  readonly store = inject(PortfolioStore);
}
