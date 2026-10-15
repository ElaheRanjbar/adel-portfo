import { Component, inject } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-home-about',
  imports: [MediaUrl, Icon],
  templateUrl: './home-about.html',
  styleUrl: './home-about.css',
})
export class HomeAbout {
  readonly store = inject(PortfolioStore);
}
