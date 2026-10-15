import { Component, inject } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { PortfolioLink } from '../../core/portfolio-link';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-home-experience',
  imports: [PortfolioLink, Icon],
  templateUrl: './home-experience.html',
  styleUrl: './home-experience.css',
})
export class HomeExperience {
  readonly store = inject(PortfolioStore);
}
