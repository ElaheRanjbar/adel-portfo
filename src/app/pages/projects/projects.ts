import { Icon } from '../../shared/icon/icon';
import { Component, inject } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { MediaUrl } from '../../core/media-url';
import { TagName } from '../../core/tag-name';
import { PortfolioLink } from '../../core/portfolio-link';

import { SiteHeader } from '../../shared/site-header/site-header';
import { SiteFooter } from '../../shared/site-footer/site-footer';

@Component({
  selector: 'app-projects',
  imports: [Icon, MediaUrl, TagName, SiteHeader, SiteFooter, PortfolioLink],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  readonly store = inject(PortfolioStore);
}
