import { Component, inject } from '@angular/core';
import { PortfolioStore } from '../../core/portfolio-store';
import { PortfolioLink, portfolioUrl } from '../../core/portfolio-link';
import { MediaUrl } from '../../core/media-url';
import { Router } from '@angular/router';

@Component({
  selector: 'app-site-header',
  imports: [PortfolioLink, MediaUrl],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  readonly store = inject(PortfolioStore);
  readonly router = inject(Router);
  active(href: string): boolean {
    const target = portfolioUrl(href);
    if (target === '/projects')
      return (
        this.router.url.startsWith('/projects') || this.router.url.startsWith('/project-detail')
      );
    return this.router.url === target;
  }
}
